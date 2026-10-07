
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Article, SelectionConfig, CustomerDetails, Step, OrderSummary, ExchangeOrderLine } from './types.ts';
import { REASONS, METHODS } from './constants.tsx';
import Stepper from './components/Stepper.tsx';
import ArticleCard from './components/ArticleCard.tsx';
import { getOrder, getExchangeOptions, createExchangeOrder } from './services/api.ts';

const EMPTY_CUSTOMER: CustomerDetails = {
  email: '', phone: '', firstName: '', lastName: '', address: '', city: '', zipCode: '', country: ''
};

const isSameModel = (a: Article, b: Article) =>
  a.productId && b.productId ? a.productId === b.productId : a.name === b.name;

const uniq = (values: string[]) => [...new Set(values.filter(Boolean))];

const SELECT_STYLE: React.CSSProperties = { backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23888\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' };

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.Selection);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [itemConfigs, setItemConfigs] = useState<Record<string, SelectionConfig>>({});
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [exchangeSearchQuery, setExchangeSearchQuery] = useState<string>('');
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>(EMPTY_CUSTOMER);

  // OneStock data
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const [orderIdInput, setOrderIdInput] = useState(urlParams.get('order') || urlParams.get('order_id') || '');
  const [emailInput, setEmailInput] = useState(urlParams.get('email') || '');
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [exchangeOptions, setExchangeOptions] = useState<Record<string, Article[] | 'loading' | { error: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [exchangeOrderId, setExchangeOrderId] = useState('');

  const loadOrder = useCallback(async (id: string, email: string) => {
    if (!id.trim()) return;
    setOrderLoading(true);
    setOrderError('');
    try {
      const result = await getOrder(id.trim(), email.trim() || undefined);
      setOrder(result);
      setCustomerDetails({ ...EMPTY_CUSTOMER, ...result.customer });
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : 'Unable to load the order');
    } finally {
      setOrderLoading(false);
    }
  }, []);

  useEffect(() => {
    if (orderIdInput) loadOrder(orderIdInput, emailInput);
    // Only auto-load once from the URL parameters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Articles available in the user's order to be returned/exchanged
  const orderArticles = order?.articles || [];

  const selectedArticles = useMemo(() => 
    orderArticles.filter(a => selectedItemIds.includes(a.id)),
    [orderArticles, selectedItemIds]
  );

  // Exchange articles are read from the product attribute, fetched on demand
  const loadExchangeOptions = useCallback((itemId: string) => {
    setExchangeOptions(prev => {
      if (prev[itemId] && !(typeof prev[itemId] === 'object' && 'error' in (prev[itemId] as object))) return prev;
      getExchangeOptions(itemId)
        .then(items => setExchangeOptions(p => ({ ...p, [itemId]: items })))
        .catch(e => setExchangeOptions(p => ({ ...p, [itemId]: { error: e instanceof Error ? e.message : 'Error' } })));
      return { ...prev, [itemId]: 'loading' };
    });
  }, []);

  useEffect(() => {
    selectedArticles.forEach(a => {
      if (itemConfigs[a.id]?.action === 'exchange') loadExchangeOptions(a.id);
    });
  }, [selectedArticles, itemConfigs, loadExchangeOptions]);

  const optionsFor = (id: string): Article[] => {
    const value = exchangeOptions[id];
    return Array.isArray(value) ? value : [];
  };

  const findExchangeArticle = (article: Article, config?: SelectionConfig) =>
    config?.exchangeArticleId ? optionsFor(article.id).find(a => a.id === config.exchangeArticleId) || null : null;

  const missingExchangeChoice = selectedArticles.some(a =>
    itemConfigs[a.id]?.action === 'exchange' && !findExchangeArticle(a, itemConfigs[a.id])
  );

  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItemIds(prev => {
      const isCurrentlySelected = prev.includes(id);
      if (isCurrentlySelected) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
    // Initialize config if not exists
    if (!itemConfigs[id]) {
        setItemConfigs(prev => ({
            ...prev,
            [id]: { action: 'return', reason: REASONS[0], exchangeType: 'same_model' }
        }));
    }
  }, [itemConfigs]);

  const updateItemConfig = (id: string, updates: Partial<SelectionConfig>) => {
    setItemConfigs(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));
  };

  const submitRequest = async () => {
    if (!order) return;
    const lines: ExchangeOrderLine[] = selectedArticles.flatMap(article => {
      const config = itemConfigs[article.id];
      const exchangeArticle = config?.action === 'exchange' ? findExchangeArticle(article, config) : null;
      return exchangeArticle ? [{
        returnedItemId: article.id,
        exchangeItemId: exchangeArticle.id,
        quantity: article.quantity,
        price: exchangeArticle.price,
        reason: config.reason
      }] : [];
    });

    setSubmitError('');
    if (lines.length) {
      setSubmitting(true);
      try {
        const result = await createExchangeOrder({
          originalOrderId: order.id,
          method: selectedMethod,
          customer: customerDetails,
          lines
        });
        setExchangeOrderId(result.id);
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : 'Unable to create the exchange order');
        return;
      } finally {
        setSubmitting(false);
      }
    }
    setCurrentStep(Step.Confirmation);
  };

  const isNextDisabled =
    submitting ||
    (currentStep === Step.Selection && selectedItemIds.length === 0) ||
    (currentStep === Step.Configuration && missingExchangeChoice) ||
    (currentStep === Step.Method && !selectedMethod);

  const handleNext = () => {
    if (isNextDisabled) return;
    if (currentStep === Step.Validation) {
      submitRequest();
      return;
    }
    setCurrentStep(prev => (prev + 1) as Step);
  };

  const handleBack = () => {
    setCurrentStep(prev => (prev - 1) as Step);
  };

  const InfoBar = ({ text, icon = true }: { text: string; icon?: boolean }) => (
    <div className="bg-[#f2f2f2] rounded-lg py-2.5 px-4 mb-2 flex items-center gap-3">
      {icon && (
        <div className="w-4 h-4 flex items-center justify-center text-[#555]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )}
      <p className="text-[13px] font-medium text-[#555]">{text}</p>
    </div>
  );

  const renderOrderLookup = () => (
    <div className="max-w-sm mx-auto pt-12">
      <h2 className="text-xl font-bold text-gray-800 mb-1 text-center">Returns & exchanges</h2>
      <p className="text-[13px] text-gray-500 mb-6 text-center">Enter your order number to get started.</p>
      <form
        className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm"
        onSubmit={(e) => { e.preventDefault(); loadOrder(orderIdInput, emailInput); }}
      >
        <div className="space-y-0.5">
          <label className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Order number</label>
          <input
            type="text"
            required
            className="w-full p-2 bg-[#f9fafb] border border-gray-200 rounded-md text-[13px] outline-none focus:bg-white focus:border-[#20B2AA] transition-all"
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value)}
          />
        </div>
        <div className="space-y-0.5">
          <label className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Email</label>
          <input
            type="email"
            className="w-full p-2 bg-[#f9fafb] border border-gray-200 rounded-md text-[13px] outline-none focus:bg-white focus:border-[#20B2AA] transition-all"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />
        </div>
        {orderError && <p className="text-[12px] text-red-500">{orderError}</p>}
        <button
          type="submit"
          disabled={orderLoading}
          className={`w-full py-2 bg-[#20B2AA] text-white text-[13px] font-bold rounded-lg hover:bg-[#16A085] transition-colors ${orderLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {orderLoading ? 'Loading...' : 'Find my order'}
        </button>
      </form>
    </div>
  );

  const renderSelectionStep = () => (
    <div className="space-y-2">
      <InfoBar text={`Order ${order?.id} — select items to return or exchange`} />
      {order?.mock && <InfoBar text="Demo mode: OneStock API credentials are not configured." />}
      {orderArticles.map(article => (
        <ArticleCard 
          key={article.id} 
          article={article} 
          isSelected={selectedItemIds.includes(article.id)}
          onToggle={toggleItemSelection}
        />
      ))}
    </div>
  );

  const renderConfigurationStep = () => (
    <div className="space-y-4">
      <InfoBar text="Choose your return or exchange options" />
      {selectedArticles.map(article => {
        const config = itemConfigs[article.id];
        const exchangeArticle = findExchangeArticle(article, config);
        const optionsState = exchangeOptions[article.id];
        const options = optionsFor(article.id).filter(a => a.id !== article.id);

        // Same model: variants sharing the product id, selected by size / color
        const sameModelOptions = options.filter(a => isSameModel(a, article));
        const variants = [article, ...sameModelOptions];
        const selectedSize = config.exchangeSize ?? article.size;
        const selectedColor = config.exchangeColor ?? article.color;
        const sizes = uniq(variants.map(v => v.size));
        const colors = uniq(variants.map(v => v.color));
        const selectVariant = (size: string, color: string) => {
          const match = sameModelOptions.find(v => v.size === size && v.color === color);
          updateItemConfig(article.id, { exchangeSize: size, exchangeColor: color, exchangeArticleId: match?.id });
        };
        const variantUnavailable = !exchangeArticle && (selectedSize !== article.size || selectedColor !== article.color);

        const filteredArticles = options.filter(a => 
          !isSameModel(a, article) &&
          (a.name.toLowerCase().includes(exchangeSearchQuery.toLowerCase()) || 
           a.sku.toLowerCase().includes(exchangeSearchQuery.toLowerCase()))
        );

        return (
          <div key={article.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="flex items-center p-2.5 border-b border-gray-100 bg-gray-50/50">
                <img src={article.imageUrl} className="w-10 h-10 rounded-md object-cover mr-3 border border-gray-200" alt="" />
                <div className="flex flex-col">
                    <span className="font-bold text-gray-800 text-[14px]">{article.name}</span>
                    <span className="text-[12px] text-gray-500">{article.sku} • {article.currency}{article.price}</span>
                </div>
            </div>
            <div className="p-3 space-y-3">
              {/* Action Selection */}
              <div className="flex gap-2">
                <button
                  onClick={() => updateItemConfig(article.id, { action: 'return' })}
                  className={`flex-1 py-2 px-3 rounded-lg border text-[13px] font-bold transition-all ${
                    config.action === 'return' 
                    ? 'border-[#20B2AA] bg-[#20B2AA]/5 text-[#20B2AA]' 
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  Return
                </button>
                <button
                  onClick={() => updateItemConfig(article.id, { action: 'exchange' })}
                  className={`flex-1 py-2 px-3 rounded-lg border text-[13px] font-bold transition-all ${
                    config.action === 'exchange' 
                    ? 'border-[#20B2AA] bg-[#20B2AA]/5 text-[#20B2AA]' 
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  Exchange
                </button>
              </div>

              {/* Reason Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Reason</label>
                <select 
                  className="w-full p-2 bg-white border border-gray-200 rounded-md text-[13px] outline-none focus:border-[#20B2AA] appearance-none"
                  style={SELECT_STYLE}
                  value={config.reason}
                  onChange={(e) => updateItemConfig(article.id, { reason: e.target.value })}
                >
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Exchange Options */}
              {config.action === 'exchange' && (
                <div className="space-y-3 pt-1 border-t border-gray-100 mt-1">
                  <div className="flex p-1 bg-gray-100 rounded-md">
                    <button
                      onClick={() => updateItemConfig(article.id, { exchangeType: 'same_model', exchangeArticleId: undefined, exchangeSize: undefined, exchangeColor: undefined })}
                      className={`flex-1 py-1 text-[11px] font-bold rounded transition-all ${
                        config.exchangeType === 'same_model' ? 'bg-white shadow-sm text-[#20B2AA]' : 'text-gray-500'
                      }`}
                    >
                      Same model
                    </button>
                    <button
                      onClick={() => updateItemConfig(article.id, { exchangeType: 'different_model', exchangeArticleId: undefined })}
                      className={`flex-1 py-1 text-[11px] font-bold rounded transition-all ${
                        config.exchangeType === 'different_model' ? 'bg-white shadow-sm text-[#20B2AA]' : 'text-gray-500'
                      }`}
                    >
                      Different model
                    </button>
                  </div>

                  {optionsState === 'loading' || optionsState === undefined ? (
                    <p className="text-center py-2 text-gray-400 text-[11px]">Loading exchange articles...</p>
                  ) : typeof optionsState === 'object' && 'error' in optionsState ? (
                    <p className="text-center py-2 text-red-500 text-[11px]">Unable to load exchange articles: {optionsState.error}</p>
                  ) : config.exchangeType === 'same_model' ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Size</label>
                          <select 
                            className="w-full p-2 bg-white border border-gray-200 rounded-md text-[13px] outline-none focus:border-[#20B2AA] appearance-none"
                            style={SELECT_STYLE}
                            value={selectedSize}
                            onChange={(e) => selectVariant(e.target.value, selectedColor)}
                          >
                            {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Color</label>
                          <select 
                            className="w-full p-2 bg-white border border-gray-200 rounded-md text-[13px] outline-none focus:border-[#20B2AA] appearance-none"
                            style={SELECT_STYLE}
                            value={selectedColor}
                            onChange={(e) => selectVariant(selectedSize, e.target.value)}
                          >
                            {colors.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      {sameModelOptions.length === 0 ? (
                        <p className="text-[11px] text-gray-400">No other variant of this model is available for exchange.</p>
                      ) : variantUnavailable ? (
                        <p className="text-[11px] text-orange-600">This size / color combination is not available for exchange.</p>
                      ) : exchangeArticle ? (
                        <p className="text-[11px] text-gray-500">Exchange article: <strong>{exchangeArticle.sku}</strong></p>
                      ) : (
                        <p className="text-[11px] text-gray-400">Select a new size or color.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search articles..."
                          className="w-full p-2 pl-8 bg-gray-50 border border-gray-200 rounded-md text-[12px] outline-none focus:border-[#20B2AA] focus:bg-white transition-all"
                          value={exchangeSearchQuery}
                          onChange={(e) => setExchangeSearchQuery(e.target.value)}
                        />
                        <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {filteredArticles.length > 0 ? filteredArticles.map(altArticle => (
                          <div 
                            key={altArticle.id}
                            onClick={() => updateItemConfig(article.id, { exchangeArticleId: altArticle.id })}
                            className={`flex items-center p-1.5 border rounded-md cursor-pointer transition-all ${
                              config.exchangeArticleId === altArticle.id ? 'border-[#20B2AA] bg-[#20B2AA]/5' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img src={altArticle.imageUrl} className="w-8 h-8 rounded object-cover mr-2.5 border border-gray-100" alt="" />
                            <div className="flex-grow">
                              <p className="text-[12px] font-bold text-gray-800">{altArticle.name}</p>
                              <p className="text-[10px] text-gray-500">{altArticle.color} | {altArticle.size} | {altArticle.currency}{altArticle.price}</p>
                            </div>
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              config.exchangeArticleId === altArticle.id ? 'border-[#20B2AA] bg-[#20B2AA]' : 'border-gray-300'
                            }`}>
                              {config.exchangeArticleId === altArticle.id && <div className="w-1 h-1 rounded-full bg-white" />}
                            </div>
                          </div>
                        )) : (
                          <p className="text-center py-2 text-gray-400 text-[11px]">No articles found.</p>
                        )}
                      </div>

                    </div>
                  )}

                  {exchangeArticle && (
                        <div className={`p-2 rounded-md border flex gap-2 items-center ${
                          exchangeArticle.price > article.price ? 'bg-orange-50 border-orange-100 text-orange-800' : 
                          exchangeArticle.price < article.price ? 'bg-green-50 border-green-100 text-green-800' : 
                          'bg-gray-50 border-gray-100 text-gray-600'
                        }`}>
                          <div className="flex-shrink-0">
                            {exchangeArticle.price > article.price ? (
                              <svg className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            ) : exchangeArticle.price < article.price ? (
                              <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <p className="text-[10px] font-medium leading-tight">
                            {exchangeArticle.price > article.price ? (
                              <>A <strong>pay-by-link</strong> for <strong>{article.currency}{(exchangeArticle.price - article.price).toFixed(2)}</strong> will be sent to you to complete the order.</>
                            ) : exchangeArticle.price < article.price ? (
                              <>A refund of <strong>{article.currency}{(article.price - exchangeArticle.price).toFixed(2)}</strong> will be issued to your original method.</>
                            ) : (
                              <>No additional payment or refund required for this exchange.</>
                            )}
                          </p>
                        </div>
                      )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderMethodStep = () => (
    <div className="space-y-2">
      <InfoBar text="Select the return method" />
      {METHODS.map(method => (
        <div
          key={method.id}
          onClick={() => setSelectedMethod(method.id)}
          className={`group flex items-center p-3.5 bg-white border rounded-lg cursor-pointer transition-all hover:border-[#20B2AA] shadow-sm ${
            selectedMethod === method.id ? 'border-[#20B2AA] ring-2 ring-[#20B2AA]/5' : 'border-gray-200'
          }`}
        >
          <div className="mr-4 text-gray-400 group-hover:text-[#20B2AA] transition-colors scale-90">
            {method.icon}
          </div>
          <div className="flex-grow">
            <h4 className="text-[14px] font-bold text-gray-800 leading-tight">{method.label}</h4>
            <p className="text-[12px] text-gray-500 mt-0.5">{method.description}</p>
          </div>
          <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${
            selectedMethod === method.id ? 'border-[#20B2AA]' : 'border-gray-300'
          }`}>
            {selectedMethod === method.id && <div className="w-[8px] h-[8px] rounded-full bg-[#20B2AA]" />}
          </div>
        </div>
      ))}
    </div>
  );

  const renderValidationStep = () => (
    <div className="space-y-3">
      <InfoBar text="Confirm your contact and shipping details" />
      
      <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2.5 shadow-sm">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-0.5">
            <label className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">First Name</label>
            <input 
              type="text" 
              className="w-full p-1.5 bg-[#f9fafb] border border-gray-200 rounded-md text-[12px] outline-none focus:bg-white focus:border-[#20B2AA] transition-all"
              value={customerDetails.firstName}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, firstName: e.target.value }))}
            />
          </div>
          <div className="space-y-0.5">
            <label className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Last Name</label>
            <input 
              type="text" 
              className="w-full p-1.5 bg-[#f9fafb] border border-gray-200 rounded-md text-[12px] outline-none focus:bg-white focus:border-[#20B2AA] transition-all"
              value={customerDetails.lastName}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, lastName: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-0.5">
            <label className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Email</label>
            <input 
              type="email" 
              className="w-full p-1.5 bg-[#f9fafb] border border-gray-200 rounded-md text-[12px] outline-none focus:bg-white focus:border-[#20B2AA] transition-all"
              value={customerDetails.email}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className="space-y-0.5">
            <label className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Phone</label>
            <input 
              type="tel" 
              className="w-full p-1.5 bg-[#f9fafb] border border-gray-200 rounded-md text-[12px] outline-none focus:bg-white focus:border-[#20B2AA] transition-all"
              value={customerDetails.phone}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-0.5">
          <label className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Address</label>
          <input 
            type="text"
            className="w-full p-1.5 bg-[#f9fafb] border border-gray-200 rounded-md text-[12px] outline-none focus:bg-white focus:border-[#20B2AA] transition-all"
            value={customerDetails.address}
            onChange={(e) => setCustomerDetails(prev => ({ ...prev, address: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="space-y-0.5">
            <label className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">City</label>
            <input 
              type="text" 
              className="w-full p-1.5 bg-[#f9fafb] border border-gray-200 rounded-md text-[12px] outline-none focus:bg-white focus:border-[#20B2AA] transition-all"
              value={customerDetails.city}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, city: e.target.value }))}
            />
          </div>
          <div className="space-y-0.5">
            <label className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Zip</label>
            <input 
              type="text" 
              className="w-full p-1.5 bg-[#f9fafb] border border-gray-200 rounded-md text-[12px] outline-none focus:bg-white focus:border-[#20B2AA] transition-all"
              value={customerDetails.zipCode}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, zipCode: e.target.value }))}
            />
          </div>
          <div className="space-y-0.5">
            <label className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Country</label>
            <input 
              type="text" 
              className="w-full p-1.5 bg-[#f9fafb] border border-gray-200 rounded-md text-[12px] outline-none focus:bg-white focus:border-[#20B2AA] transition-all"
              value={customerDetails.country}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, country: e.target.value }))}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="text-center py-8 px-6">
      <div className="w-14 h-14 bg-[#E0F7F6] text-[#20B2AA] rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">Request Submitted!</h2>
      <p className="text-[13px] text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
        Your return request is confirmed. We sent instructions to <strong>{customerDetails.email}</strong>.
        {exchangeOrderId && (
          <><br />Your exchange order <strong>{exchangeOrderId}</strong> has been created.</>
        )}
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-[#20B2AA] text-white text-[14px] font-bold rounded-lg hover:bg-[#16A085] transition-colors"
      >
        Done
      </button>
    </div>
  );

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
        <main className="flex-grow max-w-2xl w-full mx-auto px-4 pb-20">
          {orderLoading && !orderError ? (
            <p className="text-center pt-16 text-[13px] text-gray-500">Loading your order...</p>
          ) : renderOrderLookup()}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      {/* Stepper */}
      {currentStep !== Step.Confirmation && <Stepper currentStep={currentStep} />}

      {/* Main Content */}
      <main className="flex-grow max-w-2xl w-full mx-auto px-4 pb-20">
        {currentStep === Step.Selection && renderSelectionStep()}
        {currentStep === Step.Configuration && renderConfigurationStep()}
        {currentStep === Step.Method && renderMethodStep()}
        {currentStep === Step.Validation && renderValidationStep()}
        {currentStep === Step.Confirmation && renderConfirmationStep()}
      </main>

      {/* Bottom Navigation */}
      {currentStep !== Step.Confirmation && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 z-50">
          {submitError && (
            <p className="max-w-2xl mx-auto mb-2 text-[12px] text-red-500">{submitError}</p>
          )}
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div>
              {currentStep > Step.Selection && (
                <button 
                  onClick={handleBack}
                  className="px-4 py-2 border border-gray-200 text-gray-600 text-[13px] font-bold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-gray-200 text-gray-600 text-[13px] font-bold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleNext}
                disabled={isNextDisabled}
                className={`px-6 py-2 bg-[#20B2AA] text-white text-[13px] font-bold rounded-lg hover:bg-[#16A085] transition-all ${
                    isNextDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {currentStep === Step.Validation ? (submitting ? 'Creating...' : 'Confirm') : 'Next'}
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
