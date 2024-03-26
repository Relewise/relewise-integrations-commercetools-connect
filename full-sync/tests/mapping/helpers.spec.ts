import { describe, expect, test } from '@jest/globals';
import { localizedToLanguageLookUp, localizedToMultilingual } from '../../src/mapping/helpers';
import { DataValueFactory } from '@relewise/client';

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
});