import { Integrator } from '@relewise/integrations';
import { readConfiguration } from './utils/config.utils';

export function createIntegrator() {
    const configuration = readConfiguration().relewise;
    return new Integrator(
        configuration.datasetId,
        configuration.apiKey,
        {
            serverUrl: configuration.serverUrl
        });
}