import { createProviderRouter } from '../provider-router.js';

export default createProviderRouter({ source: 'eonet', rawModel: 'eonetEvent', rawOrderField: 'ingestedAt' });
