import { describe, expect, test } from '@jest/globals';
import { localizedToLanguageLookUp, localizedToMultilingual, searchKeywordsToMultilingual } from '../../src/mapping/helpers';
import { DataValueFactory } from '@relewise/client';
import { SearchKeywords } from '@commercetools/platform-sdk';

describe('Testing helpers', () => {
    test('localizedToMultilingual null value', () => {

        const result = localizedToMultilingual(undefined)
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
});