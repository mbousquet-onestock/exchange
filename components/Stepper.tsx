
import React from 'react';
import { Step } from '../types';

interface StepperProps {
  currentStep: Step;
}

export const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  const steps = [
    { id: 1, label: 'Order Selection' },
    { id: 2, label: 'Orchestration Scenarios' },
    { id: 3, label: 'Results Visualization' },
    { id: 4, label: 'Comparison' },
  ];

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${
                  currentStep === step.id
                    ? 'bg-[#00A79D] text-white border-[#00A79D]'
                    : currentStep > step.id
                    ? 'bg-emerald-50 text-[#00A79D] border-[#00A79D]'
                    : 'bg-white text-slate-400 border-slate-200'
                }`}
              >
                {currentStep > step.id ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                ) : (
                  step.id
                )}
              </div>
              <span className={`text-[10px] mt-2 font-semibold uppercase tracking-wide text-center px-1 ${
                currentStep === step.id ? 'text-slate-900' : 'text-slate-400'
              }`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-[2px] flex-1 -mt-5 ${currentStep > step.id ? 'bg-[#00A79D]' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
