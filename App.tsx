
import React, { useState, useCallback, useMemo } from 'react';
import { Article, SelectionConfig, CustomerDetails, Step, ReturnAction } from './types.ts';
import { ARTICLES, REASONS, SIZES, COLORS, METHODS } from './constants.tsx';
import Stepper from './components/Stepper.tsx';
import ArticleCard from './components/ArticleCard.tsx';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.Selection);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [itemConfigs, setItemConfigs] = useState<Record<string, SelectionConfig>>({});
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    email: 'john.doe@onestock-retail.com',
    firstName: 'John',
    lastName: 'Doe',
    address: '123 E-Commerce Street',
    city: 'Manchester',
    zipCode: 'M1 4BT',
    country: 'United Kingdom'
  });

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
            [id]: { action: 'return', reason: REASONS[0] }
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

  const renderSelectionStep = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-4 flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        <p className="text-sm text-gray-600">Select items to return or exchange</p>
      </div>
      {ARTICLES.map(article => (
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
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-4 flex items-center gap-3">
        <p className="text-sm text-gray-600 font-medium">Choose why you are returning or exchanging these items</p>
      </div>
      {selectedArticles.map(article => {
        const config = itemConfigs[article.id];
        return (
          <div key={article.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center p-4 border-b border-gray-100 bg-gray-50/50">
                <img src={article.imageUrl} className="w-10 h-10 rounded object-cover mr-3" alt="" />
                <span className="font-semibold text-gray-700 text-sm">{article.name}</span>
            </div>
            <div className="p-4 space-y-4">
              {/* Action Selection */}
              <div className="flex gap-4">
                <button
                  onClick={() => updateItemConfig(article.id, { action: 'return' })}
                  className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition-all ${
                    config.action === 'return' 
                    ? 'border-[#20B2AA] bg-[#20B2AA]/5 text-[#20B2AA]' 
                    : 'border-gray-200 text-gray-500'
                  }`}
                >
                  Return for refund
                </button>
                <button
                  onClick={() => updateItemConfig(article.id, { action: 'exchange' })}
                  className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition-all ${
                    config.action === 'exchange' 
                    ? 'border-[#20B2AA] bg-[#20B2AA]/5 text-[#20B2AA]' 
                    : 'border-gray-200 text-gray-500'
                  }`}
                >
                  Exchange
                </button>
              </div>

              {/* Reason Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400">Reason</label>
                <select 
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-[#20B2AA]"
                  value={config.reason}
                  onChange={(e) => updateItemConfig(article.id, { reason: e.target.value })}
                >
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Exchange Options */}
              {config.action === 'exchange' && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-gray-400">New Size</label>
                    <select 
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-[#20B2AA]"
                      value={config.exchangeSize || article.size}
                      onChange={(e) => updateItemConfig(article.id, { exchangeSize: e.target.value })}
                    >
                      {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-gray-400">New Color</label>
                    <select 
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-[#20B2AA]"
                      value={config.exchangeColor || article.color}
                      onChange={(e) => updateItemConfig(article.id, { exchangeColor: e.target.value })}
                    >
                      {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
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
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-4 flex items-center gap-3">
        <p className="text-sm text-gray-600">Select the return method</p>
      </div>
      {METHODS.map(method => (
        <div
          key={method.id}
          onClick={() => setSelectedMethod(method.id)}
          className={`group flex items-center p-5 bg-white border rounded-lg cursor-pointer transition-all hover:border-[#20B2AA] ${
            selectedMethod === method.id ? 'border-[#20B2AA] ring-2 ring-[#20B2AA]/5' : 'border-gray-200'
          }`}
        >
          <div className="mr-5 text-gray-500 group-hover:text-[#20B2AA]">
            {method.icon}
          </div>
          <div className="flex-grow">
            <h4 className="text-[15px] font-semibold text-gray-800">{method.label}</h4>
            <p className="text-sm text-gray-500">{method.description}</p>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            selectedMethod === method.id ? 'border-[#20B2AA]' : 'border-gray-300'
          }`}>
            {selectedMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-[#20B2AA]" />}
          </div>
        </div>
      ))}
    </div>
  );

  const renderValidationStep = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex items-center gap-3">
        <p className="text-sm text-gray-600 font-medium text-center w-full">Please confirm your contact and shipping details</p>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400">First Name</label>
            <input 
              type="text" 
              className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-md text-sm outline-none focus:bg-white focus:border-[#20B2AA]"
              value={customerDetails.firstName}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, firstName: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400">Last Name</label>
            <input 
              type="text" 
              className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-md text-sm outline-none focus:bg-white focus:border-[#20B2AA]"
              value={customerDetails.lastName}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, lastName: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase text-gray-400">Email Address</label>
          <input 
            type="email" 
            className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-md text-sm outline-none focus:bg-white focus:border-[#20B2AA]"
            value={customerDetails.email}
            onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase text-gray-400">Shipping Address</label>
          <textarea 
            rows={2}
            className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-md text-sm outline-none focus:bg-white focus:border-[#20B2AA]"
            value={customerDetails.address}
            onChange={(e) => setCustomerDetails(prev => ({ ...prev, address: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400">City</label>
            <input 
              type="text" 
              className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-md text-sm outline-none focus:bg-white focus:border-[#20B2AA]"
              value={customerDetails.city}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, city: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400">Zip Code</label>
            <input 
              type="text" 
              className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-md text-sm outline-none focus:bg-white focus:border-[#20B2AA]"
              value={customerDetails.zipCode}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, zipCode: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5 col-span-2 md:col-span-1">
            <label className="text-xs font-semibold uppercase text-gray-400">Country</label>
            <input 
              type="text" 
              className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-md text-sm outline-none focus:bg-white focus:border-[#20B2AA]"
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
                  className="px-6 py-2.5 border border-gray-200 text-gray-600 font-bold rounded hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                className="px-6 py-2.5 border border-gray-200 text-gray-600 font-bold rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleNext}
                disabled={currentStep === Step.Selection && selectedItemIds.length === 0}
                className={`px-8 py-2.5 bg-[#20B2AA] text-white font-bold rounded hover:bg-[#16A085] transition-all ${
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
