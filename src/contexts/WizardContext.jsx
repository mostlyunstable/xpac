import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

const WizardContext = createContext(null);

const STORAGE_KEY = 'xpac_wizard_state';

const DEFAULT_STATE = {
  currentStep: 1,
  broadcastName: '',
  audioFile: null,
  contactFile: null,
  contactData: null,
  description: '',
  scheduleConfig: { mode: 'immediate', date: '', time: '', timezone: 'UTC' },
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_STATE,
        ...parsed,
        scheduleConfig: { ...DEFAULT_STATE.scheduleConfig, ...(parsed.scheduleConfig || {}) },
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

const initialState = loadState() || { ...DEFAULT_STATE };

function wizardReducer(state, action) {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_BROADCAST_NAME':
      return { ...state, broadcastName: action.payload };
    case 'SET_AUDIO_FILE':
      return { ...state, audioFile: action.payload };
    case 'SET_CONTACT_FILE':
      return { ...state, contactFile: action.payload };
    case 'SET_CONTACT_DATA':
      return { ...state, contactData: action.payload };
    case 'SET_DESCRIPTION':
      return { ...state, description: action.payload };
    case 'SET_SCHEDULE_CONFIG':
      return { ...state, scheduleConfig: { ...state.scheduleConfig, ...action.payload } };
    case 'RESET':
      return { ...DEFAULT_STATE };
    default:
      return state;
  }
}

export function WizardProvider({ children }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const totalSteps = 5;

  const canGoNext = useCallback(() => {
    const s = state;
    switch (s.currentStep) {
      case 1:
        return !!s.broadcastName.trim();
      case 2:
        return !!s.audioFile;
      case 3:
        return !!s.contactFile;
      case 4:
        return true; // Description is optional
      case 5:
        if (s.scheduleConfig.mode === 'immediate') return true;
        return !!s.scheduleConfig.date && !!s.scheduleConfig.time;
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
    setBroadcastName: (name) => dispatch({ type: 'SET_BROADCAST_NAME', payload: name }),
    setAudioFile: (file) => dispatch({ type: 'SET_AUDIO_FILE', payload: file }),
    setContactFile: (file) => dispatch({ type: 'SET_CONTACT_FILE', payload: file }),
    setContactData: (data) => dispatch({ type: 'SET_CONTACT_DATA', payload: data }),
    setDescription: (desc) => dispatch({ type: 'SET_DESCRIPTION', payload: desc }),
    setScheduleConfig: (config) => dispatch({ type: 'SET_SCHEDULE_CONFIG', payload: config }),
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