
import React from 'react';
import { Step } from '../types.ts';

interface StepperProps {
  currentStep: Step;
}

const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  const steps = [
    { id: Step.Selection, label: 'Items' },
    { id: Step.Configuration, label: 'Options' },
    { id: Step.Method, label: 'Method' },
    { id: Step.Validation, label: 'Validation' }
  ];

  return (
    <div className="w-full py-6 mb-8 border-b border-gray-100 bg-white">
      <div className="max-w-xl mx-auto flex items-center justify-between px-4 relative">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-[1.5rem] z-0 px-12">
            <div 
                className="h-full bg-[#20B2AA] transition-all duration-300"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
        </div>

        {steps.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'border-[#20B2AA] bg-white ring-4 ring-[#20B2AA]/10'
                    : isCompleted
                    ? 'border-[#20B2AA] bg-[#20B2AA]'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-[#20B2AA]' : 'bg-transparent'}`} />
                )}
              </div>
              <span className={`mt-2 text-sm font-medium ${isActive ? 'text-[#333]' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;
