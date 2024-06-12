import { ProductProjection, ProductReference, Category } from '@commercetools/platform-sdk';
import { getProductsInCurrentStore, getProductProjectionInStoreById } from '../client/query.client.products';
import { HTTP_STATUS_BAD_REQUEST } from '../infrastructure/constants/http.status';
import CustomError from '../infrastructure/errors/custom.error';
import { logger } from '../infrastructure/utils/logger.utils';
import { getCategories } from '../client/query.client.categories';
import { saveProducts } from './saveProducts';

export async function syncProducts(storeKey: string) {

    const productsToBeSynced: ProductProjection[] = [];
    const products: ProductReference[] = await getProductsInCurrentStore(storeKey);

    for (const productInCurrentStore of products) {
        const productToBeSynced = await getProductProjectionInStoreById(
            storeKey,
            productInCurrentStore.id);

        //Check if product ID has already been existing in the list
        if (productToBeSynced) {
            const isDuplicatedProduct = productsToBeSynced.some((product) => product.id === productToBeSynced.id);

            if (isDuplicatedProduct) {
                logger.info(`${productToBeSynced.id} is duplicated.`);
            }
            else {
                productsToBeSynced.push(productToBeSynced);
            }
        }
    }

    if (productsToBeSynced.length > 0) {
        const categories: Category[] = await getCategories();

        logger.info(`${productsToBeSynced.length} product(s) to be synced to relewise.`);

        await saveProducts({ products: productsToBeSynced, categories }).catch((error) => {
            throw new CustomError(
                HTTP_STATUS_BAD_REQUEST,
                `Bad request: ${error.message}`,
                error
            );
        });

        logger.info(`Product(s) has been added/updated to relewise.`);
    } else {
        logger.warn(`${productsToBeSynced.length} product(s) found. Make sure you have defined product selections for the store.`);
    }
}