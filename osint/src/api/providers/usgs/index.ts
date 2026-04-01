import { createProviderRouter } from '../provider-router.js';

export default createProviderRouter({ source: 'usgs', rawModel: 'usgsQuake', rawOrderField: 'occurredAt' });
