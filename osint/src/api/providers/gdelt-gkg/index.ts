import { createProviderRouter } from '../provider-router.js';

export default createProviderRouter({ source: 'gdelt-gkg', rawModel: 'gkgRecord', rawOrderField: 'ingestedAt' });
