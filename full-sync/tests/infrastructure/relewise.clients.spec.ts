import { createIntegrator } from '../../src/infrastructure/relewise.clients';
import { Integrator } from '@relewise/integrations';

jest.mock('../../src/infrastructure/utils/config.utils', () => ({
    readConfiguration: jest.fn(() => ({
        relewise: {
            datasetId: 'test-dataset',
            apiKey: 'test-api-key',
            serverUrl: 'https://test-server.com'
        },
    }))
}));

describe('createIntegrator', () => {
    it('should create an Integrator with the correct configuration', () => {

        const integrator = createIntegrator();

        // Create the expected Integrator instance
        const expectedIntegrator = new Integrator(
            'test-dataset',
            'test-api-key',
            { serverUrl: 'https://test-server.com' }
        );

        // Compare the created Integrator with the expected Integrator
        expect(integrator).toEqual(expectedIntegrator);
    });
});