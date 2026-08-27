import { type Category } from '@commercetools/platform-sdk';
import { getCategories } from '../client/query.client.categories';
import {
  getProductProjectionInStoreById,
  getProductReferenceChunksInCurrentStore,
} from '../client/query.client.products';
import { createIntegrator } from '../infrastructure/relewise.clients';
import { logger } from '../infrastructure/utils/logger.utils';
import { finalizeProductSync, saveProducts } from './saveProducts';

const PRODUCT_FETCH_CONCURRENCY = 10;

export async function syncProducts(storeKey: string): Promise<void> {
  const importedAt = Date.now();
  const categories = new Map<string, Category>(
    (await getCategories()).map((category) => [category.id, category])
  );
  const integrator = createIntegrator();
  const seenProductIds = new Set<string>();
  let syncedProductCount = 0;

  for await (const productReferences of getProductReferenceChunksInCurrentStore(
    storeKey
  )) {
    const uniqueReferences = productReferences.filter((product) => {
      if (seenProductIds.has(product.id)) {
        return false;
      }

      seenProductIds.add(product.id);
      return true;
    });

    const products = await mapWithConcurrency(
      uniqueReferences.map((product) => product.id),
      PRODUCT_FETCH_CONCURRENCY,
      (productId) => getProductProjectionInStoreById(storeKey, productId)
    );

    await saveProducts({
      products,
      categories,
      importedAt,
      integrator,
    });
    syncedProductCount += products.length;
    logger.info(`${syncedProductCount} product(s) synchronized to Relewise.`);
  }

  if (syncedProductCount === 0) {
    logger.warn(
      '0 products found. Make sure product selections are configured for the store.'
    );
    return;
  }

  await finalizeProductSync(importedAt, integrator);
  logger.info(
    `Product synchronization completed for ${syncedProductCount} product(s).`
  );
}

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  concurrency: number,
  map: (item: TInput) => Promise<TOutput>
): Promise<TOutput[]> {
  const results: TOutput[] = [];

  for (let index = 0; index < items.length; index += concurrency) {
    const chunk = items.slice(index, index + concurrency);
    results.push(...(await Promise.all(chunk.map(map))));
  }

  return results;
}
