import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAI } from '../contexts/AIContext';
import { useNotification } from '../contexts/NotificationContext';
import { getOrders } from '../services/api';
import ChatMessage from './ai/ChatMessage';
import WelcomeScreen from './ai/WelcomeScreen';
import TypingIndicator from './ai/TypingIndicator';

export default function FloatingAI() {
  const {
    isOpen, toggle, messages, isTyping, unreadCount,
    sendMessage, clearMessages, registerActionHandler,
  } = useAI();
  const { success, error } = useNotification();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const handleActionRef = useRef(null);

  const hasMessages = messages.length > 1;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      const id = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  useEffect(() => {
    registerActionHandler((type, data) => handleActionRef.current?.(type, data));
    return () => registerActionHandler(null);
  }, [registerActionHandler]);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape' && isOpen) toggle();
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, toggle]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isTyping) return;
    sendMessage(input.trim());
    setInput('');
  }, [input, isTyping, sendMessage]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleAction(type, data) {
    switch (type) {
      case 'navigate':
        if (data?.path) navigate(data.path);
        break;
      case 'view_order':
      case 'track_order':
        navigate(`/orders/${data}`);
        break;
      case 'view_campaign':
        navigate('/campaigns');
        break;
      case 'view_analytics':
        navigate('/analytics');
        break;
      case 'view_reports':
        navigate('/reports');
        break;
      case 'view_settings':
        navigate('/settings');
        break;
      case 'download_report': {
        getOrders({ limit: 100 }).then(data => {
          const orders = data.orders || [];
          const headers = ['Order ID', 'Campaign', 'Status', 'Contacts', 'Cost', 'Created'];
          const escCsv = (v) => {
            const s = String(v ?? '');
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
              return '"' + s.replace(/"/g, '""') + '"';
            }
            return s;
          };
          const rows = orders.map(o => [o.id, o.campaignName || '', o.status, o.contactCount || 0, o.estimatedCost || '0.00', o.createdAt].map(escCsv).join(','));
          const csv = [headers.map(escCsv).join(','), ...rows].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `xpac-report-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          success('Report downloaded!');
        }).catch(() => error('Failed to download report'));
        break;
      }
      case 'clone_campaign':
        navigate('/campaigns');
        success('Opening campaign wizard. Fill in the details to create a similar campaign.');
        break;
      case 'launch_campaign':
        navigate('/campaigns');
        break;
      case 'send_suggestion':
        sendMessage(data);
        break;
      default:
        break;
    }
  }

  handleActionRef.current = handleAction;

  return (
    <>
      <button
        onClick={toggle}
        className="fixed bottom-20 md:bottom-6 right-6 w-14 h-14 rounded-full bg-primary-container text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50 group"
        aria-label="Toggle AI assistant"
      >
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          {isOpen ? 'close' : 'smart_toy'}
        </span>
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white rounded-full text-xs font-bold flex items-center justify-center animate-bounce">
            {unreadCount}
          </span>
        )}
        {!isOpen && (
          <div className="absolute bottom-full right-0 mb-4 px-4 py-2 bg-inverse-surface text-inverse-on-surface text-label-md font-label-md rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
            Ask AI Assistant
          </div>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-36 md:bottom-24 right-6 w-[420px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-140px)] bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl z-50 flex flex-col overflow-hidden animate-slide-up">
          <div className="px-lg py-4 bg-primary text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              </div>
              <div>
                <p className="font-title-lg text-title-lg">AI Assistant</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="font-label-md text-label-md opacity-80">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearMessages}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Clear chat"
                title="Clear chat"
              >
                <span className="material-symbols-outlined text-lg">delete_sweep</span>
              </button>
              <button
                onClick={toggle}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close chat"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>

          <div className="px-lg py-2 bg-surface-container border-b border-outline-variant flex-shrink-0">
            <p className="font-label-md text-label-md text-on-surface-variant">
              Ask me anything about your campaigns.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!hasMessages ? (
              <WelcomeScreen />
            ) : (
              <div className="py-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="group">
                    <ChatMessage message={msg} onAction={handleAction} />
                  </div>
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="px-lg py-4 border-t border-outline-variant bg-surface-container-low flex-shrink-0">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  rows={1}
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md resize-none max-h-24"
                  style={{ minHeight: '44px' }}
                  onInput={(e) => {
                    e.target.style.height = '44px';
                    e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                  }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-3 bg-primary text-white rounded-xl hover:shadow-md active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Send message"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
            <p className="font-label-md text-xs text-outline mt-2 text-center">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
}
