import { ProductProjection, ProductReference, Category } from '@commercetools/platform-sdk';
import { getProductsInCurrentStore, getProductProjectionInStoreById, getCategories } from '../client/query.client';
import { HTTP_STATUS_BAD_REQUEST } from '../infrastructure/constants/http.status';
import CustomError from '../infrastructure/errors/custom.error';
import { logger } from '../infrastructure/utils/logger.utils';
import { Trackable, DataValueFactory } from '@relewise/client';
import { ProductAdministrativeActionBuilder } from '@relewise/integrations';
import { createIntegrator } from '../infrastructure/relewise.clients';
import mapProduct from '../mapping/mapProduct';

export default async function syncProducts(storeKey: string) {

    let productsToBeSynced: ProductProjection[] = [];
    const products: ProductReference[] = await getProductsInCurrentStore(storeKey);

    for (const productInCurrentStore of products) {
        const productToBeSynced = await getProductProjectionInStoreById(
            storeKey,
            productInCurrentStore.id
        );

        //Check if product ID has already been existing in the list
        if (productToBeSynced) {
            const isDuplicatedProduct =
                productsToBeSynced.filter(
                    (product) => product.id === productToBeSynced.id
                ).length > 0;
            if (isDuplicatedProduct)
                logger.info(`${productToBeSynced.id} is duplicated.`);
            if (!isDuplicatedProduct)
                productsToBeSynced = productsToBeSynced.concat(productToBeSynced);
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
    }
}

export async function saveProducts({ products, categories }: { products: ProductProjection[], categories: Category[] }) {
    const categoriesMap: Map<string, Category> = new Map(categories.map(c => [c.id, c]))

    const unixTimeStamp: number = Date.now();
    const updates: Trackable[] = [];

    for (const product of products) {
        updates.push(mapProduct(product, unixTimeStamp, categoriesMap));
    }

    updates.push(new ProductAdministrativeActionBuilder({
        filters: (f) => f.addProductDataFilter('ImportedAt', c => c.addEqualsCondition(DataValueFactory.number(unixTimeStamp))),
        productUpdateKind: 'Enable',
    }).build());

    updates.push(new ProductAdministrativeActionBuilder({
        filters: (f) => f.addProductDataFilter('ImportedAt', c => c.addEqualsCondition(DataValueFactory.number(unixTimeStamp), /* negated: */ true)),
        productUpdateKind: 'Disable',
    }).build())

    const integrator = createIntegrator();
    integrator.batch(updates);
}
