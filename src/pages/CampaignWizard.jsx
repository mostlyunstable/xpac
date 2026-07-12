import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizard } from '../contexts/WizardContext';
import { WIZARD_STEPS } from '../constants';
import WizardStepper from '../components/WizardStepper';
import Modal from '../components/Modal';
import BroadcastNameStep from './BroadcastNameStep';
import AudioStep from './AudioStep';
import ContactsStep from './ContactsStep';
import DescriptionStep from './DescriptionStep';
import ScheduleLaunchStep from './ScheduleLaunchStep';

const STEP_COMPONENTS = {
  1: BroadcastNameStep,
  2: AudioStep,
  3: ContactsStep,
  4: DescriptionStep,
  5: ScheduleLaunchStep,
};

export default function CampaignWizard() {
  const { currentStep, goNext, goPrev, canGoNext, canGoPrev, reset } = useWizard();
  const navigate = useNavigate();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const safeStep = STEP_COMPONENTS[currentStep] ? currentStep : 1;
  const StepComponent = STEP_COMPONENTS[safeStep] || BroadcastNameStep;
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
        <h1 className="font-headline-lg text-headline-lg text-on-surface">New Broadcast</h1>
        {hasProgress && (
          <button
            onClick={handleCancel}
            className="px-4 py-2 font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-sm"
          >
            <span className="material-symbols-outlined">close</span>
            Cancel
          </button>
        )}
      </div>

      <WizardStepper currentStep={currentStep} steps={WIZARD_STEPS} />

      <div className="mt-lg animate-fade-in">
        <StepComponent />
      </div>

      {!isLastStep && (
        <div className="mt-xl flex justify-between">
          <button
            onClick={goPrev}
            disabled={!canGoPrev()}
            className="px-lg py-3 font-body-md text-body-md text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-sm"
          >
            <span className="material-symbols-outlined">chevron_left</span>
            Back
          </button>
          <button
            onClick={goNext}
            disabled={!canGoNext()}
            className="px-lg py-3 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-sm"
          >
            Next
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}

      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Discard Changes?"
        actions={
          <div className="flex gap-md">
            <button onClick={() => setShowResetConfirm(false)} className="px-lg py-2 font-body-md text-body-md text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors">
              Keep Editing
            </button>
            <button onClick={handleReset} className="px-lg py-2 font-body-md text-body-md bg-error text-white rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all">
              Discard Changes
            </button>
          </div>
        }
      >
        <p className="font-body-md text-body-md text-on-surface-variant">
          You have unsaved progress. Are you sure you want to cancel and discard all changes?
        </p>
      </Modal>
    </div>
  );
}