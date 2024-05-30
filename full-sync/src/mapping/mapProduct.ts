import { ProductProjection, Category, ProductVariant as CTProductVariant } from '@commercetools/platform-sdk';
import { DataValueFactory, ProductVariant } from '@relewise/client';
import { ProductVariantBuilder, ProductUpdateBuilder } from '@relewise/integrations';
import { groupBy, localizedToLanguageLookUp, localizedToMultilingual, mapListPrice, mapSalesPrice, searchKeywordsToMultilingual } from './helpers';

export default function mapProduct(product: ProductProjection, unixTimeStamp: number, categoriesMap: Map<string, Category>) {

    const variants = [product.masterVariant].concat(product.variants);
    
    const builder = new ProductUpdateBuilder({
        id: product.key ?? product.id,
        productUpdateKind: 'ReplaceProvidedProperties',
        variantUpdateKind: 'ReplaceProvidedProperties',
        replaceExistingVariants: true
    })
        .variants(mapVariants(variants, product))
        .displayName(localizedToLanguageLookUp(product.name))
        .data({
            'ImportedAt': DataValueFactory.number(unixTimeStamp),
            'Id': DataValueFactory.string(product.id),
            'Decription': localizedToMultilingual(product.description),
            'Slug': localizedToMultilingual(product.slug),
            'SearchKeywords': searchKeywordsToMultilingual(product.searchKeywords),
            'InStock': DataValueFactory.boolean(variants.some(variant => variant.availability?.isOnStock))
        })
        .categoryPaths(categoryBuilder => {
            for (const categoryLink of product.categories) {
                const category = categoriesMap.get(categoryLink.id);
                
                if (category) {
                    categoryBuilder.path(p => {
                        category.ancestors
                            .forEach(parent => {
                                const parentCategory = categoriesMap.get(parent.id);
                                if (parentCategory) {
                                    p.category({ id: parentCategory.id, displayName: localizedToLanguageLookUp(parentCategory.name) })
                                }
                            })
                        p.category({ id: category.id, displayName: localizedToLanguageLookUp(category.name) })

                    });
                }
            }
        });

    mapPriceOnProduct(builder, variants);

    return builder.build();
}

function mapVariants(variants: CTProductVariant[], product: ProductProjection): ProductVariant[] {
    return variants
        .map(variant => {
            const builder = new ProductVariantBuilder({ id: variant.sku ?? variant.id.toString() })
                .data({
                    'Id': DataValueFactory.number(variant.id),
                    'IsMasterVariant': DataValueFactory.boolean(variant.id == product.masterVariant.id),
                    'ImageUrls': variant.images ? DataValueFactory.stringCollection(variant.images.map(x => x.url)) : null,
                    'InStock': DataValueFactory.boolean(variant.availability?.isOnStock ?? false),
                    'AvailableQuantity': DataValueFactory.number(variant.availability?.availableQuantity ?? 0),
                })
                .listPrice(variant.prices?.map(p => mapListPrice(p)) ?? [])
                .salesPrice(variant.prices?.map(p => mapSalesPrice(p)) ?? []);

            return builder.build();
        });
}

function mapPriceOnProduct(builder: ProductUpdateBuilder, variants: CTProductVariant[]) {
    const lowestListPrice = Object.entries(groupBy(
            variants.flatMap(v => v.prices?.map(p => mapListPrice(p)) ?? []),
            (t) => t.currency))
        .map(currencyGroup => ({ currency: currencyGroup[0], amount: currencyGroup[1].sort(x => x.amount)[0].amount }));

    const lowestSalesPrice = Object.entries(groupBy(
            variants.flatMap(v => v.prices?.map(p => mapSalesPrice(p)) ?? []),
            (t) => t.currency))
        .map(currencyGroup => ({ currency: currencyGroup[0], amount: currencyGroup[1].sort(x => x.amount)[0].amount }));

    builder.listPrice(lowestListPrice);
    builder.salesPrice(lowestSalesPrice);
}