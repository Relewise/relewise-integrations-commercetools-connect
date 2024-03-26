import { describe, expect, test } from '@jest/globals';
import { localizedToMultilingual } from '../src/mapping/helpers';

describe('Testing helpers', () => {
  test('localizedToMultilingual null value', () => {

    localizedToMultilingual(null)
    expect(1).toBe(1);
  });
});
