import { LocalizedString, SearchKeywords } from '@commercetools/platform-sdk';
import { DataValueFactory } from '@relewise/client';

export function localizedToMultilingual(value?: LocalizedString) {
    if (!value) {
        return null;
    }

    const mapped = localizedToLanguageLookUp(value);
    if (!mapped) {
        return null;
    }

    return DataValueFactory.multilingual(mapped);
}

export function localizedToLanguageLookUp(value: LocalizedString) {

    const values = Object.entries(value);

    if (values.length === 0) {
        return null;
    }

    return values.map(v => ({ language: v[0], value: v[1] }));
}

export function searchKeywordsToMultilingual(value?: SearchKeywords) {
    if (!value) {
        return null;
    }

    const values = Object.entries(value);

    if (values.length === 0) {
        return null;
    }

    return DataValueFactory.multilingualCollection(values.map(v => ({ language: v[0], values: v[1].map(x => x.text) })));
}

export function groupBy<T>(list: T[], fN: (item: T) => string): { [key: string]: T[] } {
    const grouped = list.reduce(
        (result: Record<string, T[]>, currentValue: T) => {
            const groupName = fN(currentValue);

            (result[groupName] || (result[groupName] = [])).push(currentValue);
            return result;
        }, {});

    return grouped;
}
