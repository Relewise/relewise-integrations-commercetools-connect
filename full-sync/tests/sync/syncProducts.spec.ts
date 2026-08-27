import { type ProductProjection } from '@commercetools/platform-sdk';
import { getCategories } from '../../src/client/query.client.categories';
import {
  getProductProjectionInStoreById,
  getProductReferenceChunksInCurrentStore,
} from '../../src/client/query.client.products';
import { createIntegrator } from '../../src/infrastructure/relewise.clients';
import { syncProducts } from '../../src/sync';
import { finalizeProductSync, saveProducts } from '../../src/sync/saveProducts';

jest.mock('../../src/client/query.client.categories', () => ({
  getCategories: jest.fn(),
}));

jest.mock('../../src/client/query.client.products', () => ({
  getProductProjectionInStoreById: jest.fn(),
  getProductReferenceChunksInCurrentStore: jest.fn(),
}));

jest.mock('../../src/infrastructure/relewise.clients', () => ({
  createIntegrator: jest.fn(),
}));

jest.mock('../../src/sync/saveProducts', () => ({
  finalizeProductSync: jest.fn(),
  saveProducts: jest.fn(),
}));

describe('syncProducts', () => {
  const getCategoriesMock = jest.mocked(getCategories);
  const getProductProjectionMock = jest.mocked(getProductProjectionInStoreById);
  const getProductReferenceChunksMock = jest.mocked(
    getProductReferenceChunksInCurrentStore
  );
  const createIntegratorMock = jest.mocked(createIntegrator);
  const saveProductsMock = jest.mocked(saveProducts);
  const finalizeProductSyncMock = jest.mocked(finalizeProductSync);
  const integrator = { batch: jest.fn() } as never;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(123);
    getCategoriesMock.mockResolvedValue([]);
    createIntegratorMock.mockReturnValue(integrator);
    saveProductsMock.mockResolvedValue();
    finalizeProductSyncMock.mockResolvedValue();
    getProductProjectionMock.mockImplementation(
      async (_storeKey, productId) => ({ id: productId }) as ProductProjection
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deduplicates products across pages and finalizes after every batch', async () => {
    getProductReferenceChunksMock.mockImplementation(async function* () {
      yield [{ id: 'one' } as never];
      yield [{ id: 'one' } as never, { id: 'two' } as never];
    });

    await syncProducts('store-key');

    expect(getProductProjectionMock).toHaveBeenCalledTimes(2);
    expect(getProductProjectionMock).toHaveBeenNthCalledWith(
      1,
      'store-key',
      'one'
    );
    expect(getProductProjectionMock).toHaveBeenNthCalledWith(
      2,
      'store-key',
      'two'
    );
    expect(saveProductsMock).toHaveBeenCalledTimes(2);
    expect(finalizeProductSyncMock).toHaveBeenCalledWith(123, integrator);
    expect(saveProductsMock.mock.invocationCallOrder.at(-1)).toBeLessThan(
      finalizeProductSyncMock.mock.invocationCallOrder[0]
    );
  });

  it('does not disable products when the source returns no products', async () => {
    getProductReferenceChunksMock.mockImplementation(async function* () {});

    await syncProducts('store-key');

    expect(saveProductsMock).not.toHaveBeenCalled();
    expect(finalizeProductSyncMock).not.toHaveBeenCalled();
  });

  it('does not finalize when a product batch fails', async () => {
    getProductReferenceChunksMock.mockImplementation(async function* () {
      yield [{ id: 'one' } as never];
    });
    saveProductsMock.mockRejectedValue(new Error('write failed'));

    await expect(syncProducts('store-key')).rejects.toThrow('write failed');

    expect(finalizeProductSyncMock).not.toHaveBeenCalled();
  });
});
