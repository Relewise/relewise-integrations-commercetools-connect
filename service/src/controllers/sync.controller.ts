import { Request, Response } from 'express';
import { logger } from '../infrastructure/utils/logger.utils';
import {
    getProductsInCurrentStore,
    getProductProjectionInStoreById,
    getCategories,
} from '../client/query.client';
import CustomError from '../infrastructure/errors/custom.error';

import {
    HTTP_STATUS_BAD_REQUEST,
    HTTP_STATUS_SUCCESS_NO_CONTENT,
} from '../infrastructure/constants/http.status';
import { Category, LocalizedString, ProductProjection, ProductReference, SearchKeywords } from '@commercetools/platform-sdk';
import { Integrator, ProductAdministrativeActionBuilder, ProductUpdateBuilder, ProductVariantBuilder } from '@relewise/integrations';
import { DataValueFactory, ProductVariant, Trackable } from '@relewise/client';
import { readConfiguration } from '../infrastructure/utils/config.utils';

function localizedToMultilingual(value?: LocalizedString) {
    if (!value) return null;

    return DataValueFactory.multilingual(Object.entries(value).map(v => ({ language: v[0], value: v[1] })));
}

function searchKeywordsToMultilingual(value?: SearchKeywords) {
    if (!value) return null;

    return DataValueFactory.multilingualCollection(Object.entries(value).map(v => ({ language: v[0], values: v[1].map(x => x.text) })));
}

function createIntegrator() {
    const configuration = readConfiguration().relewise;
    return new Integrator(
        configuration.datasetId,
        configuration.apiKey,
        {
            serverUrl: configuration.serverUrl
        });
}

export async function saveProducts({ products, categories }: { products: ProductProjection[], categories: Category[] }) {
    const categoriesMap = new Map(categories.map(c => [c.id, c]))

    const unixTimeStamp: number = Date.now();
    const updates: Trackable[] = [];
    const integrator = createIntegrator();

    for (const product of products) {
        logger.info(`${product.variants.length} variants`);

        const variants: ProductVariant[] = product.variants
            .map(variant => {
                const builder = new ProductVariantBuilder({ id: variant.sku ?? variant.id.toString() })
                    .data({
                        'Images': variant.images ? DataValueFactory.stringCollection(variant.images.map(x => x.url)) : null
                    })
                    .listPrice([{
                        currency: variant.price?.value.currencyCode ?? 'DKK',
                        amount: (variant.price?.value.centAmount ?? 0) / 100
                    }])
                    .salesPrice([{
                        currency: variant.price?.value.currencyCode ?? 'DKK',
                        amount: (variant.price?.value.centAmount ?? 0) / 100
                    }])

                return builder.build();
            })

        const builder = new ProductUpdateBuilder({
            id: product.key ?? product.id,
            productUpdateKind: 'ReplaceProvidedProperties',
        })
            .variants(variants)
            .displayName(Object.entries(product.name).map(v => ({ language: v[0], value: v[1] })))
            .data({
                'ImportedAt': DataValueFactory.number(unixTimeStamp),
                'Id': DataValueFactory.string(product.id),
                'SuperMasterId': null,
                'Type': DataValueFactory.string(product.productType.typeId),
                'State': product.state?.typeId ? DataValueFactory.string(product.state?.typeId) : null,
                'Decription': localizedToMultilingual(product.description),
                'Slug': localizedToMultilingual(product.slug),
                'SearchKeywords': searchKeywordsToMultilingual(product.searchKeywords),
            })
            .categoryPaths(b => {

                for (const categoryLink of product.categories) {
                    const category = categoriesMap.get(categoryLink.id);
                    if (category) {

                        b.path(p => {
                            category.ancestors
                                .forEach(parent => {
                                    const parentCategory = categoriesMap.get(parent.id);
                                    if (parentCategory) {
                                        p.category({ id: parentCategory.id, displayName: Object.entries(parentCategory.name).map(v => ({ language: v[0], value: v[1] })) })
                                    }
                                })
                            p.category({ id: category.id, displayName: Object.entries(category.name).map(v => ({ language: v[0], value: v[1] })) })

                        });
                    }
                }

                return b;
            });

        updates.push(builder.build());
    }

    updates.push(new ProductAdministrativeActionBuilder({
        filters: (f) => f.addProductDataFilter('ImportedAt', c => c.addEqualsCondition(DataValueFactory.number(unixTimeStamp))),
        productUpdateKind: 'Enable',
    }).build());

    updates.push(new ProductAdministrativeActionBuilder({
        filters: (f) => f.addProductDataFilter('ImportedAt', c => c.addEqualsCondition(DataValueFactory.number(unixTimeStamp), /* negated: */ true)),
        productUpdateKind: 'Disable',
    }).build())

    integrator.batch(updates);
}

async function syncProducts(storeKey: string) {

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

export const syncHandler = async (request: Request, response: Response) => {
    try {
        const storeKey = readConfiguration().storeKey;
        await syncProducts(storeKey);
    } catch (err: unknown) {
        logger.error(err);

        if (err instanceof CustomError) {
            return response.status(Number(err.statusCode)).send(err);
        }

        return response.status(500).send(err);
    }

    return response.status(HTTP_STATUS_SUCCESS_NO_CONTENT).send();
};