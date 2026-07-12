import { useState, useEffect } from 'react';
import DragDropZone from '../components/DragDropZone';
import { useFileUpload } from '../hooks/useFileUpload';
import { useWizard } from '../contexts/WizardContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatFileSize, parseCSV, getContactCSVTemplate, validateContactCSV } from '../utils';
import Modal from '../components/Modal';

export default function ContactsStep() {
  const { uploadedFile, setUploadedFile, setCsvData, csvData } = useWizard();
  const { success, error } = useNotification();
  const { status, progress, error: uploadError, upload, cancel, removeFile } = useFileUpload();
  const [selectedFile, setSelectedFile] = useState(null);
  const [sheetUrl, setSheetUrl] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [csvValidationError, setCsvValidationError] = useState(null);

  useEffect(() => {
    if (uploadedFile && !selectedFile) {
      setSelectedFile({ name: uploadedFile.filename });
    }
  }, [uploadedFile]);

  const ALLOWED_CONTACT_TYPES = ['.csv', '.xlsx', '.xls', '.pdf', '.txt'];
  const MAX_CONTACT_SIZE = 50 * 1024 * 1024; // 50MB

  async function handleFileSelect(file) {
    setSelectedFile(file);
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!ALLOWED_CONTACT_TYPES.includes(ext)) {
      error(`File type "${ext}" not allowed. Allowed: ${ALLOWED_CONTACT_TYPES.join(', ')}`);
      return;
    }
    if (file.size > MAX_CONTACT_SIZE) {
      error(`File too large. Maximum size: ${formatFileSize(MAX_CONTACT_SIZE)}`);
      return;
    }

    setSelectedFile(file);
    const result = await upload(file);
    if (result) {
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const { headers, rows } = parseCSV(text);
        const validation = validateContactCSV(headers, rows);
        if (!validation.valid) {
          setCsvValidationError(validation.error);
        } else {
          setCsvValidationError(null);
          if (headers.length > 0) {
            setCsvData({ headers, rows });
          }
        }
      }
      setUploadedFile(result);
      success('Contact list uploaded successfully!');
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

  const hasContactFile = uploadedFile;
  const previewRows = csvData?.rows?.slice(0, 5) || [];
  const headers = csvData?.headers || [];
  const previewTable = showPreview && previewRows.length > 0;

  return (
    <div>
      <div className="mb-lg">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Contact List</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
          Upload a CSV, Excel, or text file with your contacts. Maximum 50MB.
        </p>
      </div>

      {!hasContactFile ? (
        <DragDropZone
          onFileSelect={handleFileSelect}
          disabled={status === 'uploading'}
          accept=".csv,.xlsx,.xls,.pdf,.txt"
        />
      ) : (
        <div className="p-lg bg-surface-container rounded-xl border border-outline-variant space-y-md animate-slide-up">
          <div className="flex items-center justify-between mb-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">groups</span>
              <h3 className="font-title-lg text-title-lg text-on-surface">{uploadedFile?.filename || selectedFile?.name}</h3>
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

          {csvValidationError && (
            <div className="mt-md p-md bg-error-container rounded-lg border border-error text-error">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-lg">error</span>
                <div className="font-body-md text-body-md">{csvValidationError}</div>
              </div>
            </div>
          )}

          {uploadError && hasContactFile && (
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
                disabled={hasContactFile}
              />
            </div>
            <p className="mt-2 font-label-md text-label-md text-outline">
              Ensure the sheet is shared with the service account
            </p>
            {sheetUrl && !hasContactFile && (
              <button
                onClick={handleSheetImport}
                className="mt-3 px-4 py-2 text-sm font-body-md bg-primary text-white rounded-lg hover:shadow-md active:scale-95 transition-all"
              >
                Connect Sheet
              </button>
            )}
          </div>

          {headers.length > 0 && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 mb-md font-label-md text-label-md text-primary hover:text-on-primary-fixed transition-colors"
            >
              <span className="material-symbols-outlined text-lg">
                {showPreview ? 'visibility_off' : 'visibility'}
              </span>
              {showPreview ? 'Hide' : 'Show'} Preview
            </button>
          )}

          {previewTable && (
            <div className="overflow-x-auto border border-outline-variant rounded-xl">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container">
                    {headers.slice(0, 6).map((h) => (
                      <th key={h} className="px-4 py-3 font-label-md text-label-md text-on-surface-variant border-b border-outline-variant">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition-colors">
                      {headers.slice(0, 6).map((h) => (
                        <td key={h} className="px-4 py-3 font-body-md text-body-md text-on-surface">
                          {row[h] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {csvData && (
            <p className="mt-4 font-label-md text-label-md text-outline">
              {csvData.rows.length} contacts detected · {headers.length} columns
            </p>
          )}
        </div>
      )}

      <div className="mt-lg p-md bg-primary-container rounded-lg border border-primary">
        <div className="flex items-start gap-sm">
          <span className="material-symbols-outlined text-primary mt-1">info</span>
          <div className="font-body-sm text-body-sm text-on-primary-container">
            <p className="font-medium mb-1">Contact List Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Phone number is required for each contact</li>
              <li>Supported formats: CSV, Excel (.xlsx, .xls), PDF, TXT</li>
              <li>Maximum file size: 50MB</li>
              <li>Include columns: name, phone, email, company (optional)</li>
            </ul>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowTemplateModal(true)}
        className="mt-lg px-4 py-2 text-sm font-body-md text-primary border border-primary rounded-lg hover:bg-primary-fixed transition-colors"
      >
        <span className="material-symbols-outlined text-sm">table_rows</span>
        View CSV Template
      </button>

      {csvValidationError && (
        <div className="mt-md p-md bg-error-container rounded-lg border border-error text-error">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-lg">error</span>
            <div className="font-body-md text-body-md">{csvValidationError}</div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="CSV Template"
        actions={
          <div className="flex gap-md">
            <button onClick={() => setShowTemplateModal(false)} className="px-lg py-2 font-body-md text-body-md text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors">
              Close
            </button>
            <button
              onClick={() => {
                const template = getContactCSVTemplate();
                const blob = new Blob([template], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'contact_template.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-lg py-2 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Download Template
            </button>
          </div>
        }
      >
        <div className="space-y-md">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Use this template to format your contact list correctly. Only <strong>phone</strong> is required; all others are optional.
          </p>
          <div className="bg-surface rounded-lg p-md overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container">
                  <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant border-b border-outline-variant">Column</th>
                  <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant border-b border-outline-variant">Required</th>
                  <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant border-b border-outline-variant">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant">
                  <td className="px-4 py-3 font-body-md text-body-md font-semibold text-primary">phone</td>
                  <td className="px-4 py-3 font-label-md text-label-md text-green-600">Yes</td>
                  <td className="px-4 py-3 font-label-md text-label-md text-on-surface">Phone number in E.164 format (e.g., +15551234567)</td>
                </tr>
                <tr className="border-b border-outline-variant">
                  <td className="px-4 py-3 font-body-md text-body-md">name</td>
                  <td className="px-4 py-3 font-label-md text-label-md text-gray-500">No</td>
                  <td className="px-4 py-3 font-label-md text-label-md text-on-surface">Full name of the contact</td>
                </tr>
                <tr className="border-b border-outline-variant">
                  <td className="px-4 py-3 font-body-md text-body-md">email</td>
                  <td className="px-4 py-3 font-label-md text-label-md text-gray-500">No</td>
                  <td className="px-4 py-3 font-label-md text-label-md text-on-surface">Email address</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-body-md text-body-md">company</td>
                  <td className="px-4 py-3 font-label-md text-label-md text-gray-500">No</td>
                  <td className="px-4 py-3 font-label-md text-label-md text-on-surface">Company name</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="font-label-md text-label-md text-outline">
            Required column: <strong>phone</strong> · Optional: name, email, company, city, country
          </p>
        </div>
      </Modal>

      {csvValidationError && (
        <div className="mt-md p-md bg-error-container rounded-lg border border-error text-error">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-lg">error</span>
            <div className="font-body-md text-body-md">{csvValidationError}</div>
          </div>
        </div>
      )}

      <div className="mt-lg p-md bg-primary-container rounded-lg border border-primary">
        <div className="flex items-start gap-sm">
          <span className="material-symbols-outlined text-primary mt-1">info</span>
          <div className="font-body-sm text-body-sm text-on-primary-container">
            <p className="font-medium mb-1">Contact List Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Phone number is required for each contact</li>
              <li>Supported formats: CSV, Excel (.xlsx, .xls), PDF, TXT</li>
              <li>Maximum file size: 50MB</li>
              <li>Include columns: name, phone, email, company (optional)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}