import { useEffect, useRef } from 'react';

export default function Modal({ isOpen, onClose, title, children, actions }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 animate-fade-in"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-2xl w-full max-w-md mx-4 animate-slide-up">
        <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between">
          <h2 id="modal-title" className="font-headline-md text-headline-md text-on-surface">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-high transition-colors" aria-label="Close modal">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div className="px-lg py-lg">{children}</div>
        {actions && (
          <div className="px-lg py-md border-t border-outline-variant flex justify-end gap-md">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
