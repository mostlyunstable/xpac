import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { generateUniqueId } from '../utils';
import { getCampaigns, getOrders } from '../services/api';

const AIContext = createContext(null);

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I'm your XPAC AI Assistant. I can help you manage campaigns, check orders, and navigate the dashboard. What would you like to do?",
  timestamp: Date.now(),
  cards: [],
  suggestions: [
    'Show my orders',
    'Create a new campaign',
    'View analytics',
    'Help me with settings',
  ],
};

export function AIProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);
  const [context, setContext] = useState({ campaigns: [], orders: [], currentPage: 'dashboard' });
  const abortControllerRef = useRef(null);
  const actionHandlerRef = useRef(null);
  const isOpenRef = useRef(false);

  isOpenRef.current = isOpen;

  const loadContext = useCallback(async () => {
    try {
      const [campaigns, orders] = await Promise.all([
        getCampaigns().catch(() => []),
        getOrders({ limit: 50 }).then(d => d.orders || []).catch(() => []),
      ]);
      setContext(prev => ({ ...prev, campaigns, orders }));
      return { campaigns, orders };
    } catch {
      return { campaigns: [], orders: [] };
    }
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isTyping) return;

    const userMsg = {
      id: generateUniqueId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      cards: [],
      suggestions: [],
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setError(null);

    try {
      const ctx = await loadContext();

      const conversationHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      conversationHistory.push({ role: 'user', content: content.trim() });

      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          context: {
            ...ctx,
            currentPage: context.currentPage,
            userName: 'Admin',
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const data = await response.json();

      const assistantMsg = {
        id: generateUniqueId(),
        role: 'assistant',
        content: data.message || 'I received your message but had trouble generating a response.',
        timestamp: Date.now(),
        cards: data.cards || [],
        suggestions: data.suggestions || [],
        action: data.action || { type: 'none' },
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (!isOpenRef.current) {
        setUnreadCount(prev => prev + 1);
      }

      if (data.action && data.action.type && data.action.type !== 'none' && actionHandlerRef.current) {
        actionHandlerRef.current(data.action.type, data.action.data);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;

      const errorMsg = {
        id: generateUniqueId(),
        role: 'assistant',
        content: "I'm having trouble connecting to the AI service. Please try again in a moment.",
        timestamp: Date.now(),
        cards: [],
        suggestions: ['Try again', 'Show my orders', 'View campaigns'],
      };
      setMessages(prev => [...prev, errorMsg]);
      setError(err.message);
    } finally {
      setIsTyping(false);
    }
  }, [messages, isTyping, context, loadContext]);

  const regenerateMessage = useCallback(async () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      setMessages(prev => prev.slice(0, -1));
      await sendMessage(lastUserMsg.content);
    }
  }, [messages, sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setError(null);
  }, []);

  const deleteMessage = useCallback((messageId) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, []);

  const setCurrentPage = useCallback((page) => {
    setContext(prev => ({ ...prev, currentPage: page }));
  }, []);

  const registerActionHandler = useCallback((handler) => {
    actionHandlerRef.current = handler;
  }, []);

  const value = {
    isOpen,
    toggle,
    open,
    close,
    messages,
    isTyping,
    error,
    unreadCount,
    context,
    sendMessage,
    regenerateMessage,
    clearMessages,
    deleteMessage,
    setCurrentPage,
    registerActionHandler,
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error('useAI must be used within AIProvider');
  return ctx;
}
