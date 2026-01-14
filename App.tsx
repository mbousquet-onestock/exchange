
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
    <div className="bg-[#f2f2f2] rounded-lg py-3.5 px-5 mb-4 flex items-center gap-4">
      {icon && (
        <div className="w-5 h-5 flex items-center justify-center text-[#555]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )}
      <p className="text-[15px] font-medium text-[#555]">{text}</p>
    </div>
  );

  const renderSelectionStep = () => (
    <div className="space-y-4">
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
    <div className="space-y-6">
      <InfoBar text="Choose why you are returning or exchanging these items" />
      {selectedArticles.map(article => {
        const config = itemConfigs[article.id];
        const exchangeArticle = config.exchangeArticleId ? ARTICLES.find(a => a.id === config.exchangeArticleId) : null;
        
        // Filter logic for different model search - includes ALL ARTICLES except current one
        const filteredArticles = ARTICLES.filter(a => 
          a.id !== article.id && 
          (a.name.toLowerCase().includes(exchangeSearchQuery.toLowerCase()) || 
           a.sku.toLowerCase().includes(exchangeSearchQuery.toLowerCase()))
        );

        return (
          <div key={article.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="flex items-center p-4 border-b border-gray-100 bg-gray-50/50">
                <img src={article.imageUrl} className="w-12 h-12 rounded-lg object-cover mr-4 border border-gray-200" alt="" />
                <div className="flex flex-col">
                    <span className="font-bold text-gray-800 text-[16px]">{article.name}</span>
                    <span className="text-[13px] text-gray-500">{article.sku} • {article.currency}{article.price}</span>
                </div>
            </div>
            <div className="p-5 space-y-5">
              {/* Action Selection */}
              <div className="flex gap-4">
                <button
                  onClick={() => updateItemConfig(article.id, { action: 'return' })}
                  className={`flex-1 py-3 px-4 rounded-lg border text-[14px] font-bold transition-all ${
                    config.action === 'return' 
                    ? 'border-[#20B2AA] bg-[#20B2AA]/5 text-[#20B2AA]' 
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  Return for refund
                </button>
                <button
                  onClick={() => updateItemConfig(article.id, { action: 'exchange' })}
                  className={`flex-1 py-3 px-4 rounded-lg border text-[14px] font-bold transition-all ${
                    config.action === 'exchange' 
                    ? 'border-[#20B2AA] bg-[#20B2AA]/5 text-[#20B2AA]' 
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  Exchange
                </button>
              </div>

              {/* Reason Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">Reason</label>
                <select 
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#20B2AA] appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23888\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem' }}
                  value={config.reason}
                  onChange={(e) => updateItemConfig(article.id, { reason: e.target.value })}
                >
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Exchange Options */}
              {config.action === 'exchange' && (
                <div className="space-y-4 pt-1 border-t border-gray-100 mt-2">
                  <div className="flex p-1 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => updateItemConfig(article.id, { exchangeType: 'same_model' })}
                      className={`flex-1 py-1.5 text-[12px] font-bold rounded-md transition-all ${
                        config.exchangeType === 'same_model' ? 'bg-white shadow-sm text-[#20B2AA]' : 'text-gray-500'
                      }`}
                    >
                      Same model
                    </button>
                    <button
                      onClick={() => updateItemConfig(article.id, { exchangeType: 'different_model' })}
                      className={`flex-1 py-1.5 text-[12px] font-bold rounded-md transition-all ${
                        config.exchangeType === 'different_model' ? 'bg-white shadow-sm text-[#20B2AA]' : 'text-gray-500'
                      }`}
                    >
                      Different model
                    </button>
                  </div>

                  {config.exchangeType === 'same_model' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">New Size</label>
                        <select 
                          className="w-full p-3 bg-white border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#20B2AA] appearance-none"
                          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23888\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem' }}
                          value={config.exchangeSize || article.size}
                          onChange={(e) => updateItemConfig(article.id, { exchangeSize: e.target.value })}
                        >
                          {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">New Color</label>
                        <select 
                          className="w-full p-3 bg-white border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#20B2AA] appearance-none"
                          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23888\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem' }}
                          value={config.exchangeColor || article.color}
                          onChange={(e) => updateItemConfig(article.id, { exchangeColor: e.target.value })}
                        >
                          {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search articles..."
                          className="w-full p-2.5 pl-9 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[#20B2AA] focus:bg-white transition-all"
                          value={exchangeSearchQuery}
                          onChange={(e) => setExchangeSearchQuery(e.target.value)}
                        />
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>

                      <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
                        {filteredArticles.length > 0 ? filteredArticles.map(altArticle => (
                          <div 
                            key={altArticle.id}
                            onClick={() => updateItemConfig(article.id, { exchangeArticleId: altArticle.id })}
                            className={`flex items-center p-2 border rounded-lg cursor-pointer transition-all ${
                              config.exchangeArticleId === altArticle.id ? 'border-[#20B2AA] bg-[#20B2AA]/5' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img src={altArticle.imageUrl} className="w-10 h-10 rounded object-cover mr-3 border border-gray-100" alt="" />
                            <div className="flex-grow">
                              <p className="text-[13px] font-bold text-gray-800">{altArticle.name}</p>
                              <p className="text-[11px] text-gray-500">{altArticle.color} | {altArticle.size} | {altArticle.currency}{altArticle.price}</p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              config.exchangeArticleId === altArticle.id ? 'border-[#20B2AA] bg-[#20B2AA]' : 'border-gray-300'
                            }`}>
                              {config.exchangeArticleId === altArticle.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                        )) : (
                          <p className="text-center py-4 text-gray-400 text-[13px]">No articles found.</p>
                        )}
                      </div>

                      {exchangeArticle && (
                        <div className={`p-3 rounded-lg border flex gap-3 items-center ${
                          exchangeArticle.price > article.price ? 'bg-orange-50 border-orange-100 text-orange-800' : 
                          exchangeArticle.price < article.price ? 'bg-green-50 border-green-100 text-green-800' : 
                          'bg-gray-50 border-gray-100 text-gray-600'
                        }`}>
                          <div className="flex-shrink-0">
                            {exchangeArticle.price > article.price ? (
                              <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <p className="text-[12px] font-medium leading-snug">
                            {exchangeArticle.price > article.price ? (
                              <>The new item is more expensive. A <strong>Pay by Link</strong> for <strong>{article.currency}{(exchangeArticle.price - article.price).toFixed(2)}</strong> will be sent to you once your return is processed.</>
                            ) : exchangeArticle.price < article.price ? (
                              <>The new item is cheaper. A refund of <strong>{article.currency}{(article.price - exchangeArticle.price).toFixed(2)}</strong> will be issued to your original payment method after we receive your item.</>
                            ) : (
                              <>The items have the same price. No additional payment or refund is required.</>
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
    <div className="space-y-3">
      <InfoBar text="Select the return method" />
      {METHODS.map(method => (
        <div
          key={method.id}
          onClick={() => setSelectedMethod(method.id)}
          className={`group flex items-center p-5 bg-white border rounded-lg cursor-pointer transition-all hover:border-[#20B2AA] shadow-sm ${
            selectedMethod === method.id ? 'border-[#20B2AA] ring-2 ring-[#20B2AA]/5' : 'border-gray-200'
          }`}
        >
          <div className="mr-5 text-gray-400 group-hover:text-[#20B2AA] transition-colors">
            {method.icon}
          </div>
          <div className="flex-grow">
            <h4 className="text-[16px] font-bold text-gray-800 leading-tight">{method.label}</h4>
            <p className="text-[14px] text-gray-500 mt-1">{method.description}</p>
          </div>
          <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all ${
            selectedMethod === method.id ? 'border-[#20B2AA]' : 'border-gray-300'
          }`}>
            {selectedMethod === method.id && <div className="w-[10px] h-[10px] rounded-full bg-[#20B2AA]" />}
          </div>
        </div>
      ))}
    </div>
  );

  const renderValidationStep = () => (
    <div className="space-y-4">
      <InfoBar text="Please confirm your contact and shipping details" />
      
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">First Name</label>
            <input 
              type="text" 
              className="w-full p-2 bg-[#f9fafb] border border-gray-200 rounded-md text-[13px] outline-none focus:bg-white focus:border-[#20B2AA] transition-all"
              value={customerDetails.firstName}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, firstName: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Last Name</label>
            <input 
              type="text" 
              className="w-full p-2 bg-[#f9fafb] border border-gray-200 rounded-md text-[13px] outline-none focus:bg-white focus:border-[#20B2AA] transition-all"
              value={customerDetails.lastName}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, lastName: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Email</label>
            <input 
              type="email" 
              className="w-full p-2 bg-[#f9fafb] border border-gray-200 rounded-md text-[13px] outline-none focus:bg-white focus:border-[#20B2AA] transition-all"
              value={customerDetails.email}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Phone</label>
            <input 
              type="tel" 
              className="w-full p-2 bg-[#f9fafb] border border-gray-200 rounded-md text-[13px] outline-none focus:bg-white focus:border-[#20B2AA] transition-all"
              value={customerDetails.phone}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Address</label>
          <input 
            type="text"
            className="w-full p-2 bg-[#f9fafb] border border-gray-200 rounded-md text-[13px] outline-none focus:bg-white focus:border-[#20B2AA] transition-all"
            value={customerDetails.address}
            onChange={(e) => setCustomerDetails(prev => ({ ...prev, address: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">City</label>
            <input 
              type="text" 
              className="w-full p-2 bg-[#f9fafb] border border-gray-200 rounded-md text-[13px] outline-none focus:bg-white focus:border-[#20B2AA] transition-all"
              value={customerDetails.city}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, city: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Zip</label>
            <input 
              type="text" 
              className="w-full p-2 bg-[#f9fafb] border border-gray-200 rounded-md text-[13px] outline-none focus:bg-white focus:border-[#20B2AA] transition-all"
              value={customerDetails.zipCode}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, zipCode: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Country</label>
            <input 
              type="text" 
              className="w-full p-2 bg-[#f9fafb] border border-gray-200 rounded-md text-[13px] outline-none focus:bg-white focus:border-[#20B2AA] transition-all"
              value={customerDetails.country}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, country: e.target.value }))}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="text-center py-12 px-6">
      <div className="w-20 h-20 bg-[#E0F7F6] text-[#20B2AA] rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Request Submitted!</h2>
      <p className="text-gray-500 max-w-sm mx-auto mb-8">
        Your return/exchange request has been successfully created. We have sent a confirmation email to <strong>{customerDetails.email}</strong> with your shipping instructions.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="px-8 py-3 bg-[#20B2AA] text-white font-bold rounded-lg hover:bg-[#16A085] transition-colors"
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
      <main className="flex-grow max-w-2xl w-full mx-auto px-4 pb-24">
        {currentStep === Step.Selection && renderSelectionStep()}
        {currentStep === Step.Configuration && renderConfigurationStep()}
        {currentStep === Step.Method && renderMethodStep()}
        {currentStep === Step.Validation && renderValidationStep()}
        {currentStep === Step.Confirmation && renderConfirmationStep()}
      </main>

      {/* Bottom Navigation */}
      {currentStep !== Step.Confirmation && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div>
              {currentStep > Step.Selection && (
                <button 
                  onClick={handleBack}
                  className="px-6 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                className="px-6 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleNext}
                disabled={currentStep === Step.Selection && selectedItemIds.length === 0}
                className={`px-8 py-2.5 bg-[#20B2AA] text-white font-bold rounded-lg hover:bg-[#16A085] transition-all ${
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
