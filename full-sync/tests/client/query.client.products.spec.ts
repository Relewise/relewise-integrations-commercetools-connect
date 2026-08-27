import { createApiRoot } from '../../src/client/create.client';
import { getProductReferenceChunksInCurrentStore } from '../../src/client/query.client.products';

jest.mock('../../src/client/create.client', () => ({
  createApiRoot: jest.fn(),
}));

describe('product reference pagination', () => {
  const createApiRootMock = jest.mocked(createApiRoot);
  const get = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    createApiRootMock.mockReturnValue({
      inStoreKeyWithStoreKeyValue: jest.fn(() => ({
        productSelectionAssignments: jest.fn(() => ({ get })),
      })),
    } as never);
  });

  it('uses deterministic local cursor state', async () => {
    get
      .mockReturnValueOnce(requestWithProducts('one', 'two'))
      .mockReturnValueOnce(requestWithProducts());

    const firstRun = [];
    for await (const chunk of getProductReferenceChunksInCurrentStore(
      'store'
    )) {
      firstRun.push(chunk);
    }

    expect(firstRun).toEqual([[{ id: 'one' }, { id: 'two' }]]);
    expect(get).toHaveBeenNthCalledWith(1, {
      queryArgs: {
        limit: 500,
        sort: 'product.id asc',
        withTotal: false,
      },
    });
    expect(get).toHaveBeenNthCalledWith(2, {
      queryArgs: {
        limit: 500,
        sort: 'product.id asc',
        where: 'product(id > "two")',
        withTotal: false,
      },
    });

    get.mockReturnValueOnce(requestWithProducts());
    const secondRun = getProductReferenceChunksInCurrentStore('store');
    await expect(secondRun.next()).resolves.toEqual({
      done: true,
      value: undefined,
    });

    expect(get).toHaveBeenNthCalledWith(3, {
      queryArgs: {
        limit: 500,
        sort: 'product.id asc',
        withTotal: false,
      },
    });
  });
});

function requestWithProducts(...ids: string[]) {
  return {
    execute: jest.fn().mockResolvedValue({
      body: {
        results: ids.map((id) => ({ product: { id } })),
      },
    }),
  };
}
