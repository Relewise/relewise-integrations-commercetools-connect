import { createApiRoot } from './create.client';
import CustomError from '../infrastructure/errors/custom.error.js';
import { HTTP_STATUS_BAD_REQUEST } from '../infrastructure/constants/http.status';
import { Category } from '@commercetools/platform-sdk';

const CHUNK_SIZE = 100;

export async function getCategories() {
  let lastCategoryId = undefined;
  let hasNextQuery = true;
  let allCategories: Category[] = [];

  const queryArgs: { limit: number; where?: string } = { limit: CHUNK_SIZE };
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