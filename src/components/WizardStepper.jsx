import { classNames } from '../utils';

export default function WizardStepper({ currentStep, steps }) {
  return (
    <div className="mb-xl px-2">
      <div className="flex gap-2 h-1.5 w-full mb-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={classNames(
              'flex-1 rounded-full transition-all duration-300',
              index + 1 <= currentStep ? 'bg-primary' : 'bg-surface-container-highest'
            )}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {steps.map((step) => (
          <span
            key={step.id}
            className={classNames(
              'font-label-md',
              step.id <= currentStep
                ? 'text-primary font-bold'
                : 'text-outline'
            )}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}
