import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { generateUniqueId } from '../utils';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const timersRef = useRef({});

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const removeNotification = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = generateUniqueId();
    setNotifications(prev => [...prev, { id, message, type, createdAt: Date.now() }]);
    if (duration > 0) {
      timersRef.current[id] = setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    return id;
  }, [removeNotification]);

  const success = useCallback((msg, duration) => addNotification(msg, 'success', duration), [addNotification]);
  const error = useCallback((msg, duration) => addNotification(msg, 'error', duration), [addNotification]);
  const info = useCallback((msg, duration) => addNotification(msg, 'info', duration), [addNotification]);
  const warning = useCallback((msg, duration) => addNotification(msg, 'warning', duration), [addNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, success, error, info, warning }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}