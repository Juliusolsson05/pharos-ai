import { createProviderRouter } from '../provider-router.js';

export default createProviderRouter({ source: 'gdelt-gqg', rawModel: 'gdeltQuote', rawOrderField: 'ingestedAt' });
