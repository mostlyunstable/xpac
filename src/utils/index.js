export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}


export function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}


export function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };

  function parseLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          values.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }
    values.push(current.trim());
    return values;
  }

  const headers = parseLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const values = parseLine(line).map(v => v.replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
  return { headers, rows };
}

export function detectColumnMapping(headers) {
  const mapping = { name: null, phone: null, email: null, company: null, city: null, country: null };
  const namePatterns = ['name', 'full_name', 'fullname', 'first_name', 'firstname', 'contact'];
  const phonePatterns = ['phone', 'mobile', 'telephone', 'cell', 'phone_number', 'phonenumber'];
  const emailPatterns = ['email', 'email_address', 'emailaddress', 'mail'];
  const companyPatterns = ['company', 'organization', 'org', 'business', 'company_name'];
  const cityPatterns = ['city', 'town', 'locality'];
  const countryPatterns = ['country', 'nation', 'country_name'];

  headers.forEach(h => {
    const lower = h.toLowerCase().replace(/[^a-z]/g, '');
    if (!mapping.name && namePatterns.some(p => lower.includes(p))) mapping.name = h;
    if (!mapping.phone && phonePatterns.some(p => lower.includes(p))) mapping.phone = h;
    if (!mapping.email && emailPatterns.some(p => lower.includes(p))) mapping.email = h;
    if (!mapping.company && companyPatterns.some(p => lower.includes(p))) mapping.company = h;
    if (!mapping.city && cityPatterns.some(p => lower.includes(p))) mapping.city = h;
    if (!mapping.country && countryPatterns.some(p => lower.includes(p))) mapping.country = h;
  });

  return mapping;
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
  const cleaned = phone.replace(/[^+\d]/g, '');
  return cleaned.length >= 7 && cleaned.length <= 15;
}

export function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200);
}

export function calculateEstimatedCost(contactCount) {
  const ratePerMinute = 0.02;
  const avgDurationMinutes = 2.5;
  return (contactCount * ratePerMinute * avgDurationMinutes).toFixed(2);
}

export function calculateEstimatedDuration(contactCount) {
  const callsPerMinute = 3;
  const minutes = Math.ceil(contactCount / callsPerMinute);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}
