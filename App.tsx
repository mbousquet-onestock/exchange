
import React, { useState, useCallback, useMemo } from 'react';
import { Article, SelectionConfig, CustomerDetails, Step, ReturnAction, ExchangeType } from './types.ts';
import { ARTICLES, REASONS, SIZES, COLORS, METHODS } from './constants.tsx';
import Stepper from './components/Stepper.tsx';
import ArticleCard from './components/ArticleCard.tsx';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.Selection);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [itemConfigs, setItemConfigs] = useState<Record<string, SelectionConfig>>({});
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [exchangeSearchQuery, setExchangeSearchQuery] = useState<string>('');
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    email: 'john.doe@onestock-retail.com',
    phone: '+44 7700 900077',
    firstName: 'John',
    lastName: 'Doe',
    address: '123 E-Commerce Street',
    city: 'Manchester',
    zipCode: 'M1 4BT',
    country: 'United Kingdom'
  });

  // Articles available in the user's order to be returned/exchanged
  const orderArticles = useMemo(() => 
    ARTICLES.filter(a => a.id !== '1006102405490'),
    []
  );

  const selectedArticles = useMemo(() => 
    ARTICLES.filter(a => selectedItemIds.includes(a.id)),
    [selectedItemIds]
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

  const handleNext = () => {
    if (currentStep === Step.Selection && selectedItemIds.length === 0) return;
    if (currentStep === Step.Method && !selectedMethod) return;
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

  const renderSelectionStep = () => (
    <div className="space-y-2">
      <InfoBar text="Select items to return or exchange" />
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
        const exchangeArticle = config.exchangeArticleId ? ARTICLES.find(a => a.id === config.exchangeArticleId) : null;
        
        const filteredArticles = ARTICLES.filter(a => 
          a.id !== article.id && 
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
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23888\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
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
                      onClick={() => updateItemConfig(article.id, { exchangeType: 'same_model' })}
                      className={`flex-1 py-1 text-[11px] font-bold rounded transition-all ${
                        config.exchangeType === 'same_model' ? 'bg-white shadow-sm text-[#20B2AA]' : 'text-gray-500'
                      }`}
                    >
                      Same model
                    </button>
                    <button
                      onClick={() => updateItemConfig(article.id, { exchangeType: 'different_model' })}
                      className={`flex-1 py-1 text-[11px] font-bold rounded transition-all ${
                        config.exchangeType === 'different_model' ? 'bg-white shadow-sm text-[#20B2AA]' : 'text-gray-500'
                      }`}
                    >
                      Different model
                    </button>
                  </div>

                  {config.exchangeType === 'same_model' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Size</label>
                        <select 
                          className="w-full p-2 bg-white border border-gray-200 rounded-md text-[13px] outline-none focus:border-[#20B2AA] appearance-none"
                          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23888\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                          value={config.exchangeSize || article.size}
                          onChange={(e) => updateItemConfig(article.id, { exchangeSize: e.target.value })}
                        >
                          {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Color</label>
                        <select 
                          className="w-full p-2 bg-white border border-gray-200 rounded-md text-[13px] outline-none focus:border-[#20B2AA] appearance-none"
                          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23888\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                          value={config.exchangeColor || article.color}
                          onChange={(e) => updateItemConfig(article.id, { exchangeColor: e.target.value })}
                        >
                          {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
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
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-[#20B2AA] text-white text-[14px] font-bold rounded-lg hover:bg-[#16A085] transition-colors"
      >
        Done
      </button>
    </div>
  );

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
                className="px-4 py-2 border border-gray-200 text-gray-600 text-[13px] font-bold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleNext}
                disabled={currentStep === Step.Selection && selectedItemIds.length === 0}
                className={`px-6 py-2 bg-[#20B2AA] text-white text-[13px] font-bold rounded-lg hover:bg-[#16A085] transition-all ${
                    (currentStep === Step.Selection && selectedItemIds.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {currentStep === Step.Validation ? 'Confirm' : 'Next'}
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
