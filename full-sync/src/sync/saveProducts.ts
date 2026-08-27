import {
  type Category,
  type ProductProjection,
} from '@commercetools/platform-sdk';
import { DataValueFactory, type Trackable } from '@relewise/client';
import {
  type Integrator,
  ProductAdministrativeActionBuilder,
} from '@relewise/integrations';
import { createIntegrator } from '../infrastructure/relewise.clients';
import { withTransientRetry } from '../infrastructure/utils/retry.utils';
import { mapProduct } from '../mapping/mapProduct';

type SaveProductsOptions = {
  products: ProductProjection[];
  categories: Map<string, Category>;
  importedAt: number;
  integrator?: Integrator;
};

export async function saveProducts({
  products,
  categories,
  importedAt,
  integrator = createIntegrator(),
}: SaveProductsOptions): Promise<void> {
  const updates: Trackable[] = products.map((product) =>
    mapProduct(product, importedAt, categories)
  );

  await withTransientRetry(() => integrator.batch(updates));
}

export async function finalizeProductSync(
  importedAt: number,
  integrator: Integrator = createIntegrator()
): Promise<void> {
  const importedAtValue = DataValueFactory.number(importedAt);
  const updates: Trackable[] = [
    new ProductAdministrativeActionBuilder({
      filters: (filter) =>
        filter.addProductDataFilter('ImportedAt', (condition) =>
          condition.addEqualsCondition(importedAtValue)
        ),
      productUpdateKind: 'Enable',
    }).build(),
    new ProductAdministrativeActionBuilder({
      filters: (filter) =>
        filter.addProductDataFilter(
          'ImportedAt',
          (condition) => condition.addEqualsCondition(importedAtValue, true),
          undefined,
          false
        ),
      productUpdateKind: 'Disable',
    }).build(),
  ];

  await withTransientRetry(() => integrator.batch(updates));
}
