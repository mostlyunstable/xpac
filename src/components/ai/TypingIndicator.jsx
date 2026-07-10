export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-lg py-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
      </div>
      <div className="bg-surface-container rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex gap-1.5 items-center h-5">
          <span className="w-2 h-2 bg-outline rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-outline rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-outline rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
