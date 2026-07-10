import { useState, useRef } from 'react';
import { ALLOWED_FILE_TYPES } from '../constants';

const acceptedTypes = Object.values(ALLOWED_FILE_TYPES).map(t => t.ext).join(',');

export default function DragDropZone({ onFileSelect, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  function handleDragOver(e) {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) onFileSelect(files[0]);
  }

  function handleClick() {
    if (!disabled) fileInputRef.current?.click();
  }

  function handleChange(e) {
    const files = e.target.files;
    if (files.length > 0) onFileSelect(files[0]);
    e.target.value = '';
  }

  return (
    <div
      className={`relative group cursor-pointer border-2 border-dashed rounded-xl p-3xl bg-surface-container-low text-center transition-all duration-300 ${
        isDragging
          ? 'drag-active border-primary'
          : 'border-outline-variant hover:bg-surface-container hover:border-primary active:scale-[0.99]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Upload files by dragging and dropping or clicking to browse"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={acceptedTypes}
        onChange={handleChange}
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-md">
        <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
          <span className="material-symbols-outlined text-4xl" style={{ fontWeight: 300 }}>cloud_upload</span>
        </div>
        <div>
          <p className="font-title-lg text-title-lg text-on-surface">Drag and drop files here</p>
          <p className="font-body-md text-body-md text-outline mt-1">or click to browse from your computer</p>
        </div>
        <div className="flex flex-wrap justify-center gap-sm mt-md">
          {Object.values(ALLOWED_FILE_TYPES).map((type) => (
            <span key={type.label} className="px-3 py-1 rounded-full bg-surface-container-highest text-on-surface-variant font-label-md text-label-md border border-outline-variant">
              {type.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
