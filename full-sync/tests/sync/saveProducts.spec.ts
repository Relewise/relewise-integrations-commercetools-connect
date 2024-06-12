import { ProductProjection, Category } from '@commercetools/platform-sdk';
import { ProductAdministrativeActionBuilder } from '@relewise/integrations';
import { createIntegrator } from '../../src/infrastructure/relewise.clients';
import { saveProducts } from '../../src/sync/saveProducts';

jest.mock('@relewise/integrations', () => ({
    ProductAdministrativeActionBuilder: jest.fn().mockImplementation(() => ({
        build: jest.fn().mockReturnValue({}),
    })),
}));

jest.mock('../../src/infrastructure/relewise.clients', () => ({
    createIntegrator: jest.fn().mockReturnValue({
        batch: jest.fn(),
    }),
}));

describe('saveProducts', () => {
    it('should map products and add administrative actions', async () => {
        const products: ProductProjection[] = [];
        const categories: Category[] = [];

        const integrator = createIntegrator();

        await saveProducts({ products, categories });

        // Ensure ProductAdministrativeActionBuilder is called twice
        expect(ProductAdministrativeActionBuilder).toHaveBeenCalledTimes(2);

        // Ensure batch is called with the correct number of updates
        expect(integrator.batch).toHaveBeenCalledWith(expect.any(Array));
    });
});