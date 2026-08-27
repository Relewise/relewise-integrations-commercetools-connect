import { type ProductReference } from '@commercetools/platform-sdk';
import { HTTP_STATUS_BAD_REQUEST } from '../infrastructure/constants/http.status';
import CustomError from '../infrastructure/errors/custom.error';
import { createApiRoot } from './create.client';

const CHUNK_SIZE = 500;

export async function getProductProjectionInStoreById(
  storeKey: string,
  productId: string
) {
  return createApiRoot()
    .inStoreKeyWithStoreKeyValue({ storeKey })
    .productProjections()
    .withId({ ID: productId })
    .get({
      queryArgs: {
        expand: ['taxCategory', 'productType', 'categories[*]'],
      },
    })
    .execute()
    .then((response) => response.body);
}

export async function* getProductReferenceChunksInCurrentStore(
  storeKey: string
): AsyncGenerator<ProductReference[]> {
  let lastProductId: string | undefined;

  do {
    const queryArgs = {
      limit: CHUNK_SIZE,
      withTotal: false,
      sort: 'product.id asc',
      ...(lastProductId ? { where: `product(id > "${lastProductId}")` } : {}),
    };

    const productChunk = await createApiRoot()
      .inStoreKeyWithStoreKeyValue({ storeKey })
      .productSelectionAssignments()
      .get({ queryArgs })
      .execute()
      .then((response) => response.body.results)
      .then((results) => results.map((result) => result.product))
      .catch((error: Error) => {
        throw new CustomError(
          HTTP_STATUS_BAD_REQUEST,
          `Bad request: ${error.message}`
        );
      });

    if (productChunk.length === 0) {
      return;
    }

    yield productChunk;
    lastProductId = productChunk.at(-1)?.id;
  } while (lastProductId !== undefined);
}
