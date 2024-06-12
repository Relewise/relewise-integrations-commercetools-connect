import { ProductUpdateBuilder } from '@relewise/integrations';
import { mapPriceOnProduct, mapVariants, mapProduct } from '../../src/mapping/mapProduct';
import { ProductVariant as CTProductVariant, Category, Price, ProductProjection } from '@commercetools/platform-sdk';
import { DataValueFactory } from '@relewise/client';

describe('mapProduct', () => {
    it('should map product properties correctly', () => {
        // Mock product data
        const product = {
            key: 'test-product',
            id: 'product-id',
            masterVariant: { sku: 'variant-sku' },
            variants: [ /* variant objects */],
            name: { /* localized name */ },
            description: { /* localized description */ },
            slug: { /* localized slug */ },
            searchKeywords: [ /* localized search keywords */],
            categories: [ /* category objects */]
        };
        // Mock Unix timestamp
        const unixTimeStamp = 1623380400;
        // Mock categories map
        const categoriesMap = new Map<string, Category>();

        // Call the function to test
        const result = mapProduct(product as unknown as ProductProjection, unixTimeStamp, categoriesMap);

        // Verify that the builder has correct ID
        expect(result.product?.id).toEqual('test-product');

        // Verify that the builder has correct product update kind
        expect(result.productUpdateKind).toEqual('ReplaceProvidedProperties');

        // Verify that the builder has correct variant update kind
        expect(result.variantUpdateKind).toEqual('ReplaceProvidedProperties');

        // Verify that the builder has replaceExistingVariants set to true
        expect(result.replaceExistingVariants).toEqual(true);
    });
});

describe('mapPriceOnProduct', () => {
    it('should map the lowest list price and sales price to the builder', () => {
        const builder = new ProductUpdateBuilder({ id: "1", productUpdateKind: 'None' });
        const variants: CTProductVariant[] = [
            {
                id: 1,

                prices: [
                    { country: 'us', value: { centAmount: 100000, currencyCode: 'USD' }, } as unknown as Price,
                    { country: 'us', value: { centAmount: 90000, currencyCode: 'USD' } } as unknown as Price,
                    { country: 'nl', value: { centAmount: 80000, currencyCode: 'EUR' } } as unknown as Price,
                ]
            },
            {
                id: 2,
                prices: [
                    { country: 'us', value: { centAmount: 100000, currencyCode: 'USD' }, } as unknown as Price,
                    { country: 'nl', value: { centAmount: 75000, currencyCode: 'EUR' } } as unknown as Price,
                ]
            }
        ];

        mapPriceOnProduct(builder, variants);

        expect(builder.build().product?.listPrice?.values).toEqual([
            { currency: { value: 'us-USD' }, amount: 900 },
            { currency: { value: 'nl-EUR' }, amount: 750 }
        ]);
        expect(builder.build().product?.salesPrice?.values).toEqual([
            { currency: { value: 'us-USD' }, amount: 900 },
            { currency: { value: 'nl-EUR' }, amount: 750 }
        ]);
    });

    it('should handle empty prices array', () => {
        const builder = new ProductUpdateBuilder({ id: "1", productUpdateKind: 'None' });
        const variants: CTProductVariant[] = [
            {
                id: 1,
                prices: []
            },
            {
                id: 2,
                prices: []
            }
        ];

        mapPriceOnProduct(builder, variants);

        expect(builder.build().product?.listPrice?.values).toEqual([]);
        expect(builder.build().product?.salesPrice?.values).toEqual([]);
    });

    it('should handle undefined prices', () => {
        const builder = new ProductUpdateBuilder({ id: "1", productUpdateKind: 'None' });
        const variants: CTProductVariant[] = [
            {
                id: 1
            },
            {
                id: 2
            }
        ];

        mapPriceOnProduct(builder, variants);

        expect(builder.build().product?.listPrice?.values).toEqual([]);
        expect(builder.build().product?.salesPrice?.values).toEqual([]);
    });
});


describe('mapVariants', () => {
    it('should map variants correctly', () => {
        // Mock product data
        const product = {
            masterVariant: { id: 1 },
            variants: [
                {
                    id: 2,
                    sku: 'variant-sku-2',
                    images: [{ url: 'http://image2.url' }],
                    availability: { isOnStock: true, availableQuantity: 5 },
                    prices: [{ country: 'us', value: { centAmount: 100000, currencyCode: 'USD' }, }]
                }
            ]
        };

        const variants = [
            product.masterVariant,
            ...product.variants
        ];

        // Call the function to test
        const result = mapVariants(variants as CTProductVariant[], product as unknown as ProductProjection);

        // Verify that the result is an array of ProductVariant
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);

        // Verify the first variant (master variant)
        expect(result[0]).toEqual({
            id: '1',
            data: {
                'Id': DataValueFactory.number(1),
                'IsMasterVariant': DataValueFactory.boolean(true),
                'ImageUrls': null,
                'InStock': DataValueFactory.boolean(false),
                'AvailableQuantity': DataValueFactory.number(0),
            },
            listPrice: { values: [] },
            salesPrice: { values: [] },
        });

        // Verify the second variant
        expect(result[1]).toEqual({
            id: 'variant-sku-2',
            data: {
                'Id': DataValueFactory.number(2),
                'IsMasterVariant': DataValueFactory.boolean(false),
                'ImageUrls': DataValueFactory.stringCollection(['http://image2.url']),
                'InStock': DataValueFactory.boolean(true),
                'AvailableQuantity': DataValueFactory.number(5),
            },
            listPrice: { values: [{ currency: { value: 'us-USD' }, amount: 1000 }] },
            salesPrice: { values: [{ currency: { value: 'us-USD' }, amount: 1000 }] },
        });
    });

    it('should handle variants with missing optional fields correctly', () => {
        const product: ProductProjection = {
            masterVariant: { id: 1 },
            variants: [
                {
                    id: 2,
                    sku: 'variant-sku-2',
                    // No images
                    // No availability
                    prices: [] // Empty prices array
                }
            ]
        } as unknown as ProductProjection;

        const variants = [
            product.masterVariant,
            ...product.variants
        ];

        // Call the function to test
        const result = mapVariants(variants as CTProductVariant[], product);

        // Verify that the result is an array of ProductVariant
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);

        // Verify the second variant with missing optional fields
        expect(result[1]).toEqual({
            id: 'variant-sku-2',
            data: {
                'Id': DataValueFactory.number(2),
                'IsMasterVariant': DataValueFactory.boolean(false),
                'ImageUrls': null,
                'InStock': DataValueFactory.boolean(false),
                'AvailableQuantity': DataValueFactory.number(0),
            },
            listPrice: { values: [] },
            salesPrice: { values: [] },
        });
    });
});