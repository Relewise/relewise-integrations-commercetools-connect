import { type Category } from '@commercetools/platform-sdk';
import { HTTP_STATUS_BAD_REQUEST } from '../infrastructure/constants/http.status';
import CustomError from '../infrastructure/errors/custom.error';
import { createApiRoot } from './create.client';

const CHUNK_SIZE = 500;

export async function getCategories(): Promise<Category[]> {
  let lastCategoryId: string | undefined;
  let allCategories: Category[] = [];

  do {
    const queryArgs = {
      limit: CHUNK_SIZE,
      withTotal: false,
      sort: 'id asc',
      ...(lastCategoryId ? { where: `id > "${lastCategoryId}"` } : {}),
    };
    const categoryChunk = await createApiRoot()
      .categories()
      .get({ queryArgs })
      .execute()
      .then((response) => response.body.results)
      .catch((error: Error) => {
        throw new CustomError(
          HTTP_STATUS_BAD_REQUEST,
          `Bad request: ${error.message}`
        );
      });

    if (categoryChunk.length === 0) {
      break;
    }

    lastCategoryId = categoryChunk.at(-1)?.id;
    allCategories = allCategories.concat(categoryChunk);
  } while (lastCategoryId !== undefined);

  return allCategories;
}
