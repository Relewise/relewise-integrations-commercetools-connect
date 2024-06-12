import { describe, expect, test } from '@jest/globals';
import { localizedToLanguageLookUp, localizedToMultilingual, mapListPrice, mapSalesPrice, searchKeywordsToMultilingual } from '../../src/mapping/helpers';
import { DataValueFactory } from '@relewise/client';
import { Price, SearchKeywords } from '@commercetools/platform-sdk';

describe('Testing helpers', () => {
    test('localizedToMultilingual null value', () => {

        const result = localizedToMultilingual(undefined)
        expect(result).toBe(null);
    });


    test('localizedToMultilingual empty value', () => {

        const result = localizedToMultilingual({})
        expect(result).toBe(null);
    });


    test('localizedToMultilingual 1 language', () => {

        const result = localizedToMultilingual({
            "en": "test"
        });

        expect(result).toStrictEqual(DataValueFactory.multilingual([{
            language: "en",
            value: "test"
        }]));
    });

    test('localizedToMultilingual 2 languages', () => {

        const result = localizedToMultilingual({
            "en": "test",
            "da": "test2",
        });

        expect(result).toStrictEqual(DataValueFactory.multilingual([
            {
                language: "en",
                value: "test"
            },
            {
                language: "da",
                value: "test2"
            }
        ]));
    });

    test('localizedToMultilingual 2 languages', () => {

        const result = localizedToLanguageLookUp({
            "en": "test",
            "da": "test2",
        });

        expect(result).toStrictEqual([
            {
                language: "en",
                value: "test"
            },
            {
                language: "da",
                value: "test2"
            }
        ]);
    });

    test('searchKeywordsToMultilingual undefined', () => {
        const result = searchKeywordsToMultilingual(undefined);

        expect(result).toStrictEqual(null);
    });

    test('searchKeywordsToMultilingual empty', () => {

        const subject: SearchKeywords = {};

        const result = searchKeywordsToMultilingual(subject);

        expect(result).toStrictEqual(null);
    });

    test('searchKeywordsToMultilingual 2 languages', () => {

        const subject: SearchKeywords = {
            "en": [{ text: "test" }],
            "da": [{ text: "test2" }],
        }

        const result = searchKeywordsToMultilingual(subject);

        expect(result).toStrictEqual(DataValueFactory.multilingualCollection([
            {
                language: "en",
                values: ["test"]
            },
            {
                language: "da",
                values: ["test2"]
            }
        ]));
    });

    
    test('mapSalesPrice', () => {

        const subject: Price = {
            country: 'dk',
            id: 'a',
            value: {
                centAmount: 10_000,
                currencyCode: 'DKK',
                fractionDigits: 2,
                type: 'centPrecision'
            }
        }

        const result = mapSalesPrice(subject);

        expect(result).toStrictEqual(
            {
                currency: "dk-DKK",
                amount: 100
            });
    });

    test('mapSalesPrice with discount', () => {

        const subject: Price = {
            country: 'dk',
            id: 'a',
            discounted: {
                value: {
                    centAmount: 5_000,
                    currencyCode: 'DKK',
                    fractionDigits: 2,
                    type: 'centPrecision'
                },
                discount: { id: 'b', typeId: 'product-discount' }
            },
            value: {
                centAmount: 10_000,
                currencyCode: 'DKK',
                fractionDigits: 2,
                type: 'centPrecision'
            }
        }

        const result = mapSalesPrice(subject);

        expect(result).toStrictEqual(
            {
                currency: "dk-DKK",
                amount: 50
            });
    });

    test('mapListPrice', () => {

        const subject: Price = {
            country: 'dk',
            id: 'a',
            value: {
                centAmount: 10_000,
                currencyCode: 'DKK',
                fractionDigits: 2,
                type: 'centPrecision'
            }
        }

        const result = mapListPrice(subject);

        expect(result).toStrictEqual(
            {
                currency: "dk-DKK",
                amount: 100
            });
    });
});