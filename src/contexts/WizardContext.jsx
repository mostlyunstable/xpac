import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { WIZARD_STEPS } from '../constants';

const WizardContext = createContext(null);

const STORAGE_KEY = 'xpac_wizard_state';

const DEFAULT_STATE = {
  currentStep: 1,
  uploadedFile: null,
  mapping: { name: null, phone: null, email: null, company: null, city: null, country: null },
  csvData: null,
  aiConfig: { voice: 'alloy', language: 'en', customPrompt: '', scriptType: 'standard' },
  scheduleConfig: { mode: 'immediate', date: '', time: '', timezone: 'UTC' },
  launchConfig: { campaignName: '', campaignDescription: '' },
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_STATE,
        ...parsed,
        mapping: { ...DEFAULT_STATE.mapping, ...(parsed.mapping || {}) },
        aiConfig: { ...DEFAULT_STATE.aiConfig, ...(parsed.aiConfig || {}) },
        scheduleConfig: { ...DEFAULT_STATE.scheduleConfig, ...(parsed.scheduleConfig || {}) },
        launchConfig: { ...DEFAULT_STATE.launchConfig, ...(parsed.launchConfig || {}) },
      };
    }
  } catch { /* ignore */ }
  return null;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

const initialState = loadState() || {
  currentStep: 1,
  uploadedFile: null,
  mapping: { name: null, phone: null, email: null, company: null, city: null, country: null },
  csvData: null,
  aiConfig: { voice: 'alloy', language: 'en', customPrompt: '', scriptType: 'standard' },
  scheduleConfig: { mode: 'immediate', date: '', time: '', timezone: 'UTC' },
  launchConfig: { campaignName: '', campaignDescription: '' },
};

function wizardReducer(state, action) {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_UPLOADED_FILE':
      return { ...state, uploadedFile: action.payload };
    case 'SET_CSV_DATA':
      return { ...state, csvData: action.payload };
    case 'SET_MAPPING':
      return { ...state, mapping: { ...state.mapping, ...action.payload } };
    case 'SET_AI_CONFIG':
      return { ...state, aiConfig: { ...state.aiConfig, ...action.payload } };
    case 'SET_SCHEDULE_CONFIG':
      return { ...state, scheduleConfig: { ...state.scheduleConfig, ...action.payload } };
    case 'SET_LAUNCH_CONFIG':
      return { ...state, launchConfig: { ...state.launchConfig, ...action.payload } };
    case 'RESET':
      return {
        currentStep: 1,
        uploadedFile: null,
        mapping: { name: null, phone: null, email: null, company: null, city: null, country: null },
        csvData: null,
        aiConfig: { voice: 'alloy', language: 'en', customPrompt: '', scriptType: 'standard' },
        scheduleConfig: { mode: 'immediate', date: '', time: '', timezone: 'UTC' },
        launchConfig: { campaignName: '', campaignDescription: '' },
      };
    default:
      return state;
  }
}

export function WizardProvider({ children }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const totalSteps = WIZARD_STEPS.length;

  const canGoNext = useCallback(() => {
    const s = state;
    switch (s.currentStep) {
      case 1:
        return !!s.uploadedFile;
      case 2:
        return !!s.mapping.phone;
      case 3:
        return !!s.aiConfig.voice && !!s.aiConfig.language;
      case 4:
        if (s.scheduleConfig.mode === 'immediate') return true;
        if (!s.scheduleConfig.date || !s.scheduleConfig.time) return false;
        const selected = new Date(`${s.scheduleConfig.date}T${s.scheduleConfig.time}`);
        return selected > new Date();
      case 5:
        return !!s.launchConfig.campaignName.trim();
      default:
        return false;
    }
  }, [state]);

  const canGoPrev = useCallback(() => state.currentStep > 1, [state.currentStep]);

  const goNext = useCallback(() => {
    if (state.currentStep < totalSteps) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    }
  }, [state.currentStep, totalSteps]);

  const goPrev = useCallback(() => {
    if (state.currentStep > 1) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 });
    }
  }, [state.currentStep]);

  const goTo = useCallback((step) => {
    if (step >= 1 && step <= totalSteps) {
      dispatch({ type: 'SET_STEP', payload: step });
    }
  }, [totalSteps]);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const value = {
    ...state,
    totalSteps,
    canGoNext,
    canGoPrev,
    goNext,
    goPrev,
    goTo,
    reset,
    setUploadedFile: (file) => dispatch({ type: 'SET_UPLOADED_FILE', payload: file }),
    setCsvData: (data) => dispatch({ type: 'SET_CSV_DATA', payload: data }),
    setMapping: (mapping) => dispatch({ type: 'SET_MAPPING', payload: mapping }),
    setAiConfig: (config) => dispatch({ type: 'SET_AI_CONFIG', payload: config }),
    setScheduleConfig: (config) => dispatch({ type: 'SET_SCHEDULE_CONFIG', payload: config }),
    setLaunchConfig: (config) => dispatch({ type: 'SET_LAUNCH_CONFIG', payload: config }),
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) throw new Error('useWizard must be used within WizardProvider');
  return context;
}