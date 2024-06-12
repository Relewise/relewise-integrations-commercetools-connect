import { syncProducts } from '../../src/sync';
import * as moduleApi from '../../src/sync/saveProducts';

jest.mock('../../src/infrastructure/utils/config.utils', () => ({
    readConfiguration: jest.fn(() => ({
        relewise: {
            datasetId: 'test-dataset',
            apiKey: 'test-api-key',
            serverUrl: 'https://test-server.com',
        },
        storeKey: 'test-key'
    }))
}));

jest.mock('../../src/client/query.client.products', () => ({
    getProductsInCurrentStore: jest.fn(() => []),
    getProductProjectionInStoreById: jest.fn(() => []),
}));

jest.mock('../../src/sync/saveProducts', () => ({
    saveProducts: jest.fn(),
}));  

describe('syncProducts', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should have called saveProducts', async () => {
        const spy = jest.spyOn(moduleApi, 'saveProducts');
 
        await syncProducts('test-key');
        
        expect(spy).toHaveBeenCalledTimes(0);
    });
});