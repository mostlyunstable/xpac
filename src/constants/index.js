export const WIZARD_STEPS = [
  { id: 1, label: 'Broadcast Name', key: 'name' },
  { id: 2, label: 'Audio Upload', key: 'audio' },
  { id: 3, label: 'Contacts', key: 'contacts' },
  { id: 4, label: 'Description', key: 'description' },
  { id: 5, label: 'Schedule', key: 'schedule' },
];

export const ALLOWED_FILE_TYPES = {
  'text/csv': { ext: '.csv', label: 'CSV' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: '.xlsx', label: 'Excel' },
  'application/vnd.ms-excel': { ext: '.xls', label: 'Excel' },
  'application/pdf': { ext: '.pdf', label: 'PDF' },
  'text/plain': { ext: '.txt', label: 'TXT' },
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const CAMPAIGN_STATUSES = {
  PLACED: 'Placed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUSES = {
  CREATED: 'Created',
  PROCESSING: 'Processing',
  QUEUED: 'Queued',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  PAUSED: 'Paused',
};

export const VOICE_OPTIONS = [
  { id: 'alloy', name: 'Alloy', gender: 'Neutral', language: 'English' },
  { id: 'echo', name: 'Echo', gender: 'Male', language: 'English' },
  { id: 'fable', name: 'Fable', gender: 'Neutral', language: 'English' },
  { id: 'onyx', name: 'Onyx', gender: 'Male', language: 'English' },
  { id: 'nova', name: 'Nova', gender: 'Female', language: 'English' },
  { id: 'shimmer', name: 'Shimmer', gender: 'Female', language: 'English' },
];

export const LANGUAGE_OPTIONS = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Spanish' },
  { id: 'fr', name: 'French' },
  { id: 'de', name: 'German' },
  { id: 'pt', name: 'Portuguese' },
  { id: 'hi', name: 'Hindi' },
];

export const TIMEZONE_OPTIONS = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
];

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/campaigns', label: 'Campaigns', icon: 'campaign' },
  { path: '/orders', label: 'Orders', icon: 'shopping_cart' },
  { path: '/reports', label: 'Reports', icon: 'assessment' },
  { path: '/analytics', label: 'Analytics', icon: 'bar_chart' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

export const ADMIN_NAV_ITEMS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/admin/campaigns', label: 'Broadcasts', icon: 'campaign' },
  { path: '/admin/users', label: 'Customers', icon: 'people' },
  { path: '/admin/support', label: 'Support', icon: 'support_agent' },
  { path: '/admin/analytics', label: 'Analytics', icon: 'analytics' },
  { path: '/admin/reports', label: 'Reports', icon: 'assessment' },
  { path: '/admin/activity', label: 'Activity Logs', icon: 'history' },
  { path: '/admin/settings', label: 'Settings', icon: 'settings' },
];

export const API_BASE_URL = '/api';
