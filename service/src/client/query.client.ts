import { createApiRoot } from './create.client';
import CustomError from '../infrastructure/errors/custom.error.js';
import { HTTP_STATUS_BAD_REQUEST } from '../infrastructure/constants/http.status';
import { Category, ProductReference, QueryParam } from '@commercetools/platform-sdk';

const CHUNK_SIZE = 100;

const productQueryArgs: {
  where?: string | string[];
  priceCurrency?: string;
  priceCountry?: string;
  priceCustomerGroup?: string;
  priceChannel?: string;
  localeProjection?: string | string[];
  expand?: string | string[];
  sort?: string | string[];
  limit?: number;
  offset?: number;
  withTotal?: boolean;
  [key: string]: QueryParam;
} = {
  limit: CHUNK_SIZE,
  withTotal: false,
  sort: 'product.id asc',
  expand: ['productSelection', 'taxCategory', 'productType', 'categories[*]'],
};

export async function getProductProjectionInStoreById(storeKey: string, productId: string) {
  return await createApiRoot()
    .inStoreKeyWithStoreKeyValue({
      storeKey: Buffer.from(storeKey).toString(),
    })
    .productProjections()
    .withId({
      ID: Buffer.from(productId).toString(),
    })
    .get({ queryArgs: productQueryArgs })
    .execute()
    .then((response) => response.body);
}

export async function getCategories() {
  let lastCategoryId = undefined;
  let hasNextQuery = true;
  let allCategories: Category[] = [];

  const queryArgs: { limit: number; where?: string } = { limit: 500 };
  while (hasNextQuery) {
    if (lastCategoryId) {
      queryArgs.where = `category(id>"${lastCategoryId}")`;
    }

    const categoryChunk = await createApiRoot()
      .categories()
      .get({ queryArgs })
      .execute()
      .then((response) => response.body.results)
      .then((results) => results.map((result) => result))
      .catch((error) => {
        throw new CustomError(
          HTTP_STATUS_BAD_REQUEST,
          `Bad request: ${error.message}`,
          error
        );
      });

    hasNextQuery = categoryChunk.length == CHUNK_SIZE;
    if (categoryChunk.length > 0) {
      lastCategoryId = categoryChunk[categoryChunk.length - 1].id;
      allCategories = allCategories.concat(categoryChunk);
    }
  }
  return allCategories;
}

export async function getProductsInCurrentStore(storeKey: string) {
  let lastProductId = undefined;
  let hasNextQuery = true;
  let allProducts: ProductReference[] = [];

  while (hasNextQuery) {
    if (lastProductId) {
      productQueryArgs.where = `product(id>"${lastProductId}")`;
    }

    const productChunk = await createApiRoot()
      .inStoreKeyWithStoreKeyValue({
        //storeKey: Buffer.from(storeKey).toString(),
        storeKey: storeKey,
      })
      .productSelectionAssignments()
      .get({ queryArgs: productQueryArgs })
      .execute()
      .then((response) => response.body.results)
      .then((results) => results.map((result) => result.product))
      .catch((error) => {
        throw new CustomError(
          HTTP_STATUS_BAD_REQUEST,
          `Bad request: ${error.message}`,
          error
        );
      });
    hasNextQuery = productChunk.length == CHUNK_SIZE;
    if (productChunk.length > 0) {
      lastProductId = productChunk[productChunk.length - 1].id;
      allProducts = allProducts.concat(productChunk);
    }
  }
  return allProducts;
}
