import CustomError from '../../src/infrastructure/errors/custom.error';
import { readConfiguration } from '../../src/infrastructure/utils/config.utils';

describe('readConfiguration', () => {
    it('should throw an error with missing config', () => {

        const t = () => {
            readConfiguration();
        };
        expect(t).toThrow(CustomError);
    });
});