export const VIEW_PATHS = {
  overview: '/',
  monitor: '/monitor',
  ai: '/ai',
  chain: '/chain',
  qr: '/scan',
  scale: '/scale-up',
  quality: '/quality',
  'quality-test': '/quality/test',
  'quality-history': '/quality/history',
  'quality-rejected': '/quality/rejected',
  'quality-standards': '/quality/standards',
  'quality-reports': '/quality/reports',
  hives: '/hives',
  processing: '/processing',
  'proc-incoming': '/processing/incoming',
  'processing-log': '/processing/log',
  packaging: '/processing/packaging',
  inventory: '/processing/inventory',
  dispatch: '/processing/dispatch',
  facility: '/processing/facility',
  'proc-batches': '/processing/batches',
  'my-batches': '/beekeeper/batches',
  harvest: '/beekeeper/harvest',
  'bk-alerts': '/beekeeper/alerts',
  earnings: '/beekeeper/earnings',
  'bk-profile': '/beekeeper/profile',
  login: '/login',
};

export function viewForPath(pathname) {
  const entry = Object.entries(VIEW_PATHS).find(([, p]) => p === pathname);
  return entry ? entry[0] : 'overview';
}