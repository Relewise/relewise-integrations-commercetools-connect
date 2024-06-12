import { ProductProjection, Category } from '@commercetools/platform-sdk';
import { Trackable, DataValueFactory } from '@relewise/client';
import { ProductAdministrativeActionBuilder } from '@relewise/integrations';
import { createIntegrator } from '../infrastructure/relewise.clients';
import { mapProduct } from '../mapping/mapProduct';

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
        filters: (f) => f.addProductDataFilter('ImportedAt', c => c.addEqualsCondition(DataValueFactory.number(unixTimeStamp), /* negated: */ true), undefined, /* filterOutIfKeyNotFound: */ false),
        productUpdateKind: 'Disable',
    }).build());

    const integrator = createIntegrator();
    integrator.batch(updates);
}