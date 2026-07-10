import { useState, useMemo } from 'react';
import { useWizard } from '../contexts/WizardContext';
import { useNotification } from '../contexts/NotificationContext';
import { detectColumnMapping } from '../utils';

const FIELDS = [
  { key: 'name', label: 'Full Name', required: false },
  { key: 'phone', label: 'Phone Number', required: true },
  { key: 'email', label: 'Email Address', required: false },
  { key: 'company', label: 'Company', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'country', label: 'Country', required: false },
];

export default function MappingStep() {
  const { csvData, mapping, setMapping, uploadedFile } = useWizard();
  const { warning } = useNotification();
  const [showPreview, setShowPreview] = useState(true);

  const detectedMapping = useMemo(() => {
    if (csvData?.headers) return detectColumnMapping(csvData.headers);
    return mapping;
  }, [csvData, mapping]);

  const headers = csvData?.headers || [];
  const previewRows = csvData?.rows?.slice(0, 5) || [];

  function handleMappingChange(field, value) {
    setMapping({ [field]: value || null });
  }

  function handleAutoDetect() {
    setMapping(detectedMapping);
    warning('Column mapping auto-detected. Please verify the mappings.');
  }

  const previewTable = showPreview && previewRows.length > 0;

  return (
    <div>
      <div className="mb-lg">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Map Contact Fields</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Map your spreadsheet columns to our standard fields. Phone number is required.
        </p>
      </div>

      {!uploadedFile && (
        <div className="p-lg bg-surface-container rounded-xl border border-outline-variant text-center">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">upload_file</span>
          <p className="font-body-md text-body-md text-on-surface-variant">Please upload a file first in the Upload step.</p>
        </div>
      )}

      {uploadedFile && (
        <>
          <div className="flex items-center justify-between mb-lg">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">description</span>
              <span className="font-body-md text-body-md font-semibold">{uploadedFile.filename}</span>
            </div>
            <button
              onClick={handleAutoDetect}
              className="px-4 py-2 text-sm font-body-md text-primary border border-primary rounded-lg hover:bg-primary-fixed transition-colors"
            >
              Auto-Detect
            </button>
          </div>

          <div className="space-y-md mb-lg">
            {FIELDS.map((field) => (
              <div key={field.key} className="flex items-center gap-4">
                <label className="w-40 font-label-md text-label-md text-on-surface-variant">
                  {field.label}
                  {field.required && <span className="text-error ml-1">*</span>}
                </label>
                <select
                  value={mapping[field.key] || ''}
                  onChange={(e) => handleMappingChange(field.key, e.target.value)}
                  className={`flex-1 px-4 py-2.5 bg-surface border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md ${
                    field.required && !mapping[field.key] ? 'border-error' : 'border-outline-variant'
                  }`}
                >
                  <option value="">-- Select Column --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
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
        </>
      )}
    </div>
  );
}
