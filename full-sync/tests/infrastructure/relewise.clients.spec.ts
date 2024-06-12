import { createIntegrator } from '../../src/infrastructure/relewise.clients';
//import * as configUtils from '../../src/infrastructure/utils/config.utils';
import { Integrator } from '@relewise/integrations';
import { readConfiguration } from '../../src/infrastructure/utils/config.utils';
import CustomError from '../../src/infrastructure/errors/custom.error';

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