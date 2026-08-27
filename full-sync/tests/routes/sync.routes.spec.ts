import request from 'supertest';
import { createApp } from '../../src/app';
import { HTTP_STATUS_SUCCESS_NO_CONTENT } from '../../src/infrastructure/constants/http.status';
import { syncProducts } from '../../src/sync';

jest.mock('../../src/infrastructure/utils/config.utils', () => ({
  readConfiguration: jest.fn(() => ({ storeKey: 'test-key' })),
}));

jest.mock('../../src/sync', () => ({
  syncProducts: jest.fn(),
}));

describe('sync route', () => {
  const app = createApp();
  const syncProductsMock = jest.mocked(syncProducts);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('waits for a successful sync before returning no content', async () => {
    syncProductsMock.mockResolvedValue();

    const response = await request(app).post('/full-sync');

    expect(response.statusCode).toBe(HTTP_STATUS_SUCCESS_NO_CONTENT);
    expect(syncProductsMock).toHaveBeenCalledWith('test-key');
  });

  it('returns a sanitized error when synchronization fails', async () => {
    syncProductsMock.mockRejectedValue(new Error('secret upstream detail'));

    const response = await request(app).post('/full-sync');

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ message: 'Internal server error' });
    expect(response.text).not.toContain('secret upstream detail');
  });
});
