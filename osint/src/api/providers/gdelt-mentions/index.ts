import { createProviderRouter } from '../provider-router.js';

export default createProviderRouter({ source: 'gdelt-mentions', rawModel: 'gdeltMention', rawOrderField: 'ingestedAt' });
