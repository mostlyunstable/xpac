import { useState, useEffect } from 'react';
import DragDropZone from '../components/DragDropZone';
import { useFileUpload } from '../hooks/useFileUpload';
import { useWizard } from '../contexts/WizardContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatFileSize } from '../utils';

export default function AudioStep() {
  const { audioFile, setAudioFile } = useWizard();
  const { success, error } = useNotification();
  const { status, progress, error: uploadError, upload, cancel, removeFile } = useFileUpload();
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (audioFile && !selectedFile) {
      setSelectedFile({ name: audioFile.filename });
    }
  }, [audioFile]);

  const ALLOWED_AUDIO_TYPES = ['.mp3', '.wav'];
  const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB

  async function handleFileSelect(file) {
    setSelectedFile(file);
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!ALLOWED_AUDIO_TYPES.includes(ext)) {
      error(`File type "${ext}" not allowed. Allowed: ${ALLOWED_AUDIO_TYPES.join(', ')}`);
      return;
    }
    if (file.size > MAX_AUDIO_SIZE) {
      error(`File too large. Maximum size: ${formatFileSize(MAX_AUDIO_SIZE)}`);
      return;
    }

    setSelectedFile(file);
    const result = await upload(file);
    if (result) {
      setAudioFile(result);
      success('Audio file uploaded successfully!');
    }
  }

  function handleRemove() {
    removeFile();
    setAudioFile(null);
    setSelectedFile(null);
  }

  const hasAudioFile = audioFile;

  return (
    <div>
      <div className="mb-lg">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Audio Message</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
          Upload your audio message (MP3 or WAV). Maximum 25MB.
        </p>
      </div>

      {!hasAudioFile ? (
        <DragDropZone
          onFileSelect={handleFileSelect}
          disabled={status === 'uploading'}
          accept=".mp3,.wav"
        />
      ) : (
        <div className="p-lg bg-surface-container rounded-xl border border-outline-variant space-y-md animate-slide-up">
          <div className="flex items-center justify-between mb-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">audiotrack</span>
              <div>
                <span className="font-body-md text-body-md font-semibold">
                  {audioFile?.filename || selectedFile?.name}
                </span>
                {audioFile?.size > 0 && (
                  <span className="font-label-md text-label-md text-outline ml-2">
                    {formatFileSize(audioFile.size)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {status === 'uploading' && (
                <button onClick={cancel} className="p-2 rounded-full hover:bg-surface-container-high transition-colors" aria-label="Cancel upload">
                  <span className="material-symbols-outlined text-error">close</span>
                </button>
              )}
              <button onClick={handleRemove} className="p-2 rounded-full hover:bg-surface-container-high transition-colors" aria-label="Remove file">
                <span className="material-symbols-outlined text-on-surface-variant">delete</span>
              </button>
            </div>
          </div>
          {status === 'uploading' && (
            <div className="w-full h-2 bg-outline-variant rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          )}
          {status === 'uploading' && (
            <p className="font-label-md text-label-md text-primary text-right">{progress}%</p>
          )}
          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-600">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span className="font-label-md text-label-md">Upload complete</span>
            </div>
          )}
          {uploadError && (
            <div className="flex items-center gap-2 text-error">
              <span className="material-symbols-outlined text-lg">error</span>
              <span className="font-label-md text-label-md">{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {uploadError && hasAudioFile && (
        <button
          onClick={() => selectedFile && handleFileSelect(selectedFile)}
          className="mt-4 px-4 py-2 text-sm font-body-md text-primary border border-primary rounded-lg hover:bg-primary-fixed transition-colors"
        >
          Retry Upload
        </button>
      )}

      <div className="mt-lg p-md bg-primary-container rounded-lg border border-primary">
        <div className="flex items-start gap-sm">
          <span className="material-symbols-outlined text-primary mt-1">info</span>
          <div className="font-body-sm text-body-sm text-on-primary-container">
            <p className="font-medium mb-1">Audio Requirements:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Format: MP3 or WAV</li>
              <li>Maximum file size: 25MB</li>
              <li>Recommended: 16-bit, 44.1kHz sample rate</li>
              <li>Keep messages under 60 seconds for best results</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}