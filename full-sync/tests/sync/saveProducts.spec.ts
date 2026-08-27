import { type ProductProjection } from '@commercetools/platform-sdk';
import { ProductAdministrativeActionBuilder } from '@relewise/integrations';
import { mapProduct } from '../../src/mapping/mapProduct';
import { finalizeProductSync, saveProducts } from '../../src/sync/saveProducts';

jest.mock('../../src/mapping/mapProduct', () => ({
  mapProduct: jest.fn(() => ({ $type: 'product-update' })),
}));

jest.mock('@relewise/integrations', () => ({
  ProductAdministrativeActionBuilder: jest
    .fn()
    .mockImplementation(({ productUpdateKind }) => ({
      build: jest.fn(() => ({ productUpdateKind })),
    })),
}));

describe('saveProducts', () => {
  const product = { id: 'product-1' } as ProductProjection;
  const categories = new Map();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps a product with the run timestamp and awaits the batch', async () => {
    const batch = jest.fn().mockResolvedValue(undefined);
    const integrator = { batch } as never;

    await saveProducts({
      products: [product],
      categories,
      importedAt: 123,
      integrator,
    });

    expect(mapProduct).toHaveBeenCalledWith(product, 123, categories);
    expect(batch).toHaveBeenCalledWith([{ $type: 'product-update' }]);
  });

  it('propagates a rejected Relewise batch', async () => {
    const rejection = Object.assign(new Error('Bad request'), {
      statusCode: 400,
    });
    const integrator = {
      batch: jest.fn().mockRejectedValue(rejection),
    } as never;

    await expect(
      saveProducts({
        products: [product],
        categories,
        importedAt: 123,
        integrator,
      })
    ).rejects.toThrow('Bad request');
  });

  it('retries transient Relewise failures with backoff', async () => {
    jest.useFakeTimers();
    const rejection = Object.assign(new Error('Temporarily unavailable'), {
      statusCode: 503,
    });
    const batch = jest
      .fn()
      .mockRejectedValueOnce(rejection)
      .mockRejectedValueOnce(rejection)
      .mockResolvedValue(undefined);

    const operation = saveProducts({
      products: [product],
      categories,
      importedAt: 123,
      integrator: { batch } as never,
    });
    await jest.runAllTimersAsync();
    await operation;

    expect(batch).toHaveBeenCalledTimes(3);
    jest.useRealTimers();
  });

  it('finalizes the import with enable and disable actions', async () => {
    const batch = jest.fn().mockResolvedValue(undefined);

    await finalizeProductSync(123, { batch } as never);

    expect(ProductAdministrativeActionBuilder).toHaveBeenCalledTimes(2);
    expect(batch).toHaveBeenCalledWith([
      { productUpdateKind: 'Enable' },
      { productUpdateKind: 'Disable' },
    ]);
  });
});
