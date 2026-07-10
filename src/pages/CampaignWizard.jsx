import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizard } from '../contexts/WizardContext';
import { WIZARD_STEPS } from '../constants';
import WizardStepper from '../components/WizardStepper';
import Modal from '../components/Modal';
import UploadStep from './UploadStep';
import MappingStep from './MappingStep';
import AIStep from './AIStep';
import ScheduleStep from './ScheduleStep';
import LaunchStep from './LaunchStep';

const STEP_COMPONENTS = {
  1: UploadStep,
  2: MappingStep,
  3: AIStep,
  4: ScheduleStep,
  5: LaunchStep,
};

export default function CampaignWizard() {
  const { currentStep, goNext, goPrev, canGoNext, canGoPrev, reset } = useWizard();
  const navigate = useNavigate();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const safeStep = STEP_COMPONENTS[currentStep] ? currentStep : 1;
  const StepComponent = STEP_COMPONENTS[safeStep] || UploadStep;
  const isLastStep = safeStep === 5;

  const hasProgress = currentStep > 1;

  function handleReset() {
    reset();
    setShowResetConfirm(false);
  }

  function handleCancel() {
    if (hasProgress) {
      setShowResetConfirm(true);
    } else {
      navigate('/dashboard');
    }
  }

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="flex items-center justify-between mb-lg">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">New Campaign</h1>
        {hasProgress && (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 text-sm font-body-md text-error border border-error rounded-lg hover:bg-red-50 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      <WizardStepper currentStep={currentStep} steps={WIZARD_STEPS} />

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
        <div className="p-lg md:p-xl">
          <StepComponent />
        </div>

        {!isLastStep && (
          <div className="px-lg py-md bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
            <button
              onClick={handleCancel}
              className="px-lg py-2 font-body-md text-body-md text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg flex items-center gap-2"
            >
              {hasProgress ? 'Cancel' : 'Back to Dashboard'}
            </button>
            <div className="flex gap-md">
              <button
                onClick={goPrev}
                disabled={!canGoPrev()}
                className="px-lg py-2 font-body-md text-body-md text-outline border border-outline-variant rounded-lg bg-surface transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Previous
              </button>
              <button
                onClick={goNext}
                disabled={!canGoNext()}
                className="px-xl py-2 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Reset Campaign?"
        actions={
          <>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-lg py-2 font-body-md text-body-md text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors"
            >
              Keep Working
            </button>
            <button
              onClick={handleReset}
              className="px-lg py-2 font-body-md text-body-md bg-error text-white rounded-lg hover:shadow-md transition-all"
            >
              Reset Everything
            </button>
          </>
        }
      >
        <p className="font-body-md text-body-md text-on-surface-variant">
          All progress on this campaign will be lost. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
