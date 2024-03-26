import { describe, expect, test } from '@jest/globals';
import { localizedToMultilingual } from '../../src/mapping/helpers';
import { DataValueFactory } from '@relewise/client';

describe('Testing helpers', () => {
    test('localizedToMultilingual null value', () => {

        const result = localizedToMultilingual(undefined)
        expect(result).toBe(null);
    });
});

describe('Testing helpers', () => {
    test('localizedToMultilingual 1 language', () => {

        const subject = localizedToMultilingual({
            "en": "test"
        });

        expect(subject).toStrictEqual(DataValueFactory.multilingual([{
            language: "en",
            value: "test"
        }]));
    });
});

describe('Testing helpers', () => {
    test('localizedToMultilingual 2 languages', () => {

        const subject = localizedToMultilingual({
            "en": "test",
            "da": "test2",
        });

        expect(subject).toStrictEqual(DataValueFactory.multilingual([
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
});

