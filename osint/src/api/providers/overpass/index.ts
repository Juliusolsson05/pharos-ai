import { createProviderRouter } from '../provider-router.js';

export default createProviderRouter({ source: 'overpass', rawModel: 'overpassInstallation', rawOrderField: 'ingestedAt' });
