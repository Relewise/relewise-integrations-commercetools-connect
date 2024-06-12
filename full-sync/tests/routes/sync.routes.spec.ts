// @ts-ignore
import request from 'supertest';
import server from '../../src/index';
import CustomError from '../../src/infrastructure/errors/custom.error';
import { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_SUCCESS_NO_CONTENT } from '../../src/infrastructure/constants/http.status';

jest.mock('../../src/infrastructure/utils/config.utils', () => ({
    readConfiguration: jest.fn(() => ({
        
        relewise: {
            datasetId: 'test-dataset',
            apiKey: 'test-api-key',
            serverUrl: 'https://test-server.com',
        },
        storeKey: "test-key"
    }))
}));

jest.mock('../../src/client/query.client.categories', () => ({
    getCategories: jest.fn(() => [])
}));
jest.mock('../../src/client/query.client.products', () => ({
    getProductProjectionInStoreById: jest.fn(() => {}),
    getProductsInCurrentStore: jest.fn(() => [])
}));


describe('syncRouter', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call syncHandler when POST request is made to /', async () => {
        const subject = jest.fn((req, res) => res.sendStatus(200));
        jest.mock('../../src/sync', () => ({
            syncProducts: () => subject(null, null),
        }));


        let response = {};
        // Send request to the connector application with following code snippet.
        response = await (request(server) as any).post(`/full-sync`);

        expect(response).toBeDefined();
        expect((response as any).statusCode).toBe(HTTP_STATUS_SUCCESS_NO_CONTENT);

        server.close();
    });
});
