import { useState, useEffect } from 'react';
import DragDropZone from '../components/DragDropZone';
import { useFileUpload } from '../hooks/useFileUpload';
import { useWizard } from '../contexts/WizardContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatFileSize, parseCSV } from '../utils';

export default function UploadStep() {
  const { uploadedFile, setUploadedFile, setCsvData } = useWizard();
  const { success, error } = useNotification();
  const { status, progress, error: uploadError, upload, cancel, removeFile } = useFileUpload();
  const [sheetUrl, setSheetUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (uploadedFile && !selectedFile) {
      setSelectedFile({ name: uploadedFile.filename });
    }
  }, [uploadedFile]);

  async function handleFileSelect(file) {
    setSelectedFile(file);
    const result = await upload(file);
    if (result) {
      setUploadedFile(result);
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const { headers, rows } = parseCSV(text);
        if (headers.length > 0) {
          setCsvData({ headers, rows });
        }
      }
      success('File uploaded successfully!');
    }
  }

  function handleRemove() {
    removeFile();
    setUploadedFile(null);
    setSelectedFile(null);
    setCsvData(null);
  }

  function handleSheetImport() {
    if (!sheetUrl.trim()) {
      error('Please enter a Google Sheets URL');
      return;
    }
    if (!sheetUrl.includes('docs.google.com/spreadsheets')) {
      error('Please enter a valid Google Sheets URL');
      return;
    }
    const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const sheetId = sheetIdMatch ? sheetIdMatch[1] : 'unknown';
    const sheetFile = {
      id: 'sheet-' + sheetId,
      filename: `Google Sheet (${sheetId.substring(0, 8)}...)`,
      storedFilename: `sheet-${sheetId}.csv`,
      size: 0,
      type: 'text/csv',
      uploadedAt: new Date().toISOString(),
      path: sheetUrl,
      isGoogleSheet: true,
      sheetId: sheetId,
    };
    setUploadedFile(sheetFile);
    setCsvData({
      headers: ['name', 'phone', 'email', 'company'],
      rows: [],
    });
    success('Google Sheet connected! Note: For full integration, configure Google Sheets API credentials.');
  }

  const hasFile = status === 'success' || uploadedFile;

  return (
    <div>
      <div className="mb-lg">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Upload Contact List</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Start by importing your audience. We'll use AI to clean and validate your data automatically.
        </p>
      </div>

      {!hasFile ? (
        <DragDropZone onFileSelect={handleFileSelect} disabled={status === 'uploading'} />
      ) : (
        <div className="p-lg bg-surface-container rounded-xl border border-outline-variant">
          <div className="flex items-center justify-between mb-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">description</span>
              <div>
                <span className="font-body-md text-body-md font-semibold">
                  {uploadedFile?.filename || selectedFile?.name}
                </span>
                {uploadedFile?.size > 0 && (
                  <span className="font-label-md text-label-md text-outline ml-2">
                    {formatFileSize(uploadedFile.size)}
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
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {status === 'uploading' && (
            <p className="font-label-md text-label-md text-primary mt-2 text-right">{progress}%</p>
          )}
          {status === 'success' && (
            <div className="flex items-center gap-2 mt-2 text-green-600">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span className="font-label-md text-label-md">Upload complete</span>
            </div>
          )}
          {uploadError && (
            <div className="flex items-center gap-2 mt-2 text-error">
              <span className="material-symbols-outlined text-lg">error</span>
              <span className="font-label-md text-label-md">{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {uploadError && hasFile && (
        <button
          onClick={() => selectedFile && handleFileSelect(selectedFile)}
          className="mt-4 px-4 py-2 text-sm font-body-md text-primary border border-primary rounded-lg hover:bg-primary-fixed transition-colors"
        >
          Retry Upload
        </button>
      )}

      <div className="my-lg flex items-center gap-md">
        <div className="h-[1px] bg-outline-variant flex-1" />
        <span className="font-label-md text-label-md text-outline uppercase tracking-widest">or</span>
        <div className="h-[1px] bg-outline-variant flex-1" />
      </div>

      <div>
        <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="sheet-url">
          Import from Google Sheets
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-4 text-outline">
            <span className="material-symbols-outlined">link</span>
          </div>
          <input
            id="sheet-url"
            type="text"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
            disabled={hasFile}
          />
        </div>
        <p className="mt-2 font-label-md text-label-md text-outline">
          Ensure the sheet is shared with lumina-bot@serviceaccount.com
        </p>
        {sheetUrl && !hasFile && (
          <button
            onClick={handleSheetImport}
            className="mt-3 px-4 py-2 text-sm font-body-md bg-primary text-white rounded-lg hover:shadow-md active:scale-95 transition-all"
          >
            Connect Sheet
          </button>
        )}
      </div>
    </div>
  );
}
