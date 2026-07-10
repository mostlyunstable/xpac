import { useState } from 'react';
import OrderCard from './OrderCard';
import CampaignCard from './CampaignCard';
import AnalyticsCard from './AnalyticsCard';

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatMarkdown(text) {
  if (!text) return '';
  let formatted = escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-surface-container rounded text-sm font-code">$1</code>')
    .replace(/\n/g, '<br/>');
  return formatted;
}

export default function ChatMessage({ message, onAction }) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(null);
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  function handleCopy() {
    try {
      navigator.clipboard.writeText(message.content).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = message.content;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch {
      setCopied(false);
    }
  }

  function handleLike() {
    setLiked(liked === 'like' ? null : 'like');
  }

  function handleDislike() {
    setLiked(liked === 'dislike' ? null : 'dislike');
  }

  if (isSystem) {
    return (
      <div className="flex justify-center py-2 animate-fade-in">
        <span className="px-3 py-1 bg-surface-container rounded-full font-label-md text-label-md text-outline">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-lg py-2 animate-slide-up`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0 mr-3 mt-1">
          <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl font-body-md text-body-md leading-relaxed ${
            isUser
              ? 'bg-primary text-white rounded-br-md'
              : 'bg-surface-container text-on-surface rounded-bl-md'
          }`}
          dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
        />

        {!isUser && message.cards && message.cards.length > 0 && (
          <div className="mt-2 w-full">
            {message.cards.map((card, i) => {
              if (card.type === 'order') return <OrderCard key={i} data={card.data} onAction={onAction} />;
              if (card.type === 'campaign') return <CampaignCard key={i} data={card.data} onAction={onAction} />;
              if (card.type === 'analytics') return <AnalyticsCard key={i} data={card.data} onAction={onAction} />;
              return null;
            })}
          </div>
        )}

        {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onAction && onAction('send_suggestion', s)}
                className="px-3 py-1.5 bg-primary-fixed text-primary rounded-full font-label-md text-xs hover:bg-primary-fixed-dim transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {!isUser && (
          <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleCopy} className="p-1 rounded hover:bg-surface-container transition-colors" title="Copy">
              <span className="material-symbols-outlined text-xs text-outline">
                {copied ? 'check' : 'content_copy'}
              </span>
            </button>
            <button onClick={handleLike} className={`p-1 rounded hover:bg-surface-container transition-colors ${liked === 'like' ? 'text-primary' : ''}`} title="Like">
              <span className="material-symbols-outlined text-xs">thumb_up</span>
            </button>
            <button onClick={handleDislike} className={`p-1 rounded hover:bg-surface-container transition-colors ${liked === 'dislike' ? 'text-error' : ''}`} title="Dislike">
              <span className="material-symbols-outlined text-xs">thumb_down</span>
            </button>
            <span className="font-label-md text-xs text-outline ml-1">
              {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {isUser && (
          <span className="font-label-md text-xs text-outline mt-1">
            {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}
