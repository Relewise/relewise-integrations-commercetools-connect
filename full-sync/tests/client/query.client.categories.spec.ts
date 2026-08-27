import { createApiRoot } from '../../src/client/create.client';
import { getCategories } from '../../src/client/query.client.categories';

jest.mock('../../src/client/create.client', () => ({
  createApiRoot: jest.fn(),
}));

describe('category pagination', () => {
  const createApiRootMock = jest.mocked(createApiRoot);
  const get = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    createApiRootMock.mockReturnValue({
      categories: jest.fn(() => ({ get })),
    } as never);
  });

  it('sorts by ID and advances with an ID cursor', async () => {
    get
      .mockReturnValueOnce(requestWithCategories('one', 'two'))
      .mockReturnValueOnce(requestWithCategories());

    await expect(getCategories()).resolves.toEqual([
      { id: 'one' },
      { id: 'two' },
    ]);
    expect(get).toHaveBeenNthCalledWith(1, {
      queryArgs: { limit: 500, sort: 'id asc', withTotal: false },
    });
    expect(get).toHaveBeenNthCalledWith(2, {
      queryArgs: {
        limit: 500,
        sort: 'id asc',
        where: 'id > "two"',
        withTotal: false,
      },
    });
  });
});

function requestWithCategories(...ids: string[]) {
  return {
    execute: jest.fn().mockResolvedValue({
      body: { results: ids.map((id) => ({ id })) },
    }),
  };
}
