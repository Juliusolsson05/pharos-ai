import { createProviderRouter } from '../provider-router.js';

export default createProviderRouter({ source: 'cloudflare-radar', rawModel: 'cloudflareRadarOutage', rawOrderField: 'lastSeenAt' });
