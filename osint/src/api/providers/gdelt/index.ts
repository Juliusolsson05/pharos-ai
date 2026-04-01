import { createProviderRouter } from '../provider-router.js';

export default createProviderRouter({ source: 'gdelt', rawModel: 'gdeltEvent', rawOrderField: 'ingestedAt' });
