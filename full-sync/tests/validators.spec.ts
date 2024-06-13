
import envValidators from '../src/infrastructure/validators/env.validators';
import {
    getValidateMessages,
} from '../src/infrastructure/validators/helpers.validators';

describe('Validators', () => {
    describe('standardString', () => {
        it('should validate string length', () => {
            const config = [[['name'], [[(value: any) => value.length >= 3, 'Invalid length']]]];
            const messages = getValidateMessages(config, { name: 'a' });
            expect(messages).toContain('Invalid length');

            const validMessages = getValidateMessages(config, { name: 'abc' });
            expect(validMessages).toEqual([]);
        });
    });

    describe('standardEmail', () => {
        it('should validate email format', () => {
            const config = [[['email'], [[(value: any) => /\S+@\S+\.\S+/.test(value), 'Invalid email']]]];
            const messages = getValidateMessages(config, { email: 'invalidemail' });
            expect(messages).toContain('Invalid email');

            const validMessages = getValidateMessages(config, { email: 'test@example.com' });
            expect(validMessages).toEqual([]);
        });
    });

    describe('standardNaturalNumber', () => {
        it('should validate natural number', () => {
            const config = [[['age'], [[(value: any) => /^\d+$/.test(value), 'Invalid number']]]];
            const messages = getValidateMessages(config, { age: 'abc' });
            expect(messages).toContain('Invalid number');

            const validMessages = getValidateMessages(config, { age: '123' });
            expect(validMessages).toEqual([]);
        });
    });

    describe('standardKey', () => {
        it('should validate key format', () => {
            const config = [[['key'], [[(value: any) => /^[a-zA-Z0-9-_]+$/.test(value), 'Invalid key']]]];
            const messages = getValidateMessages(config, { key: 'a' });
            expect(messages).toEqual([]);

            const validMessages = getValidateMessages(config, { key: 'valid-key_123' });
            expect(validMessages).toEqual([]);
        });
    });

    describe('standardUrl', () => {
        it('should validate URL format', () => {
            const config = [[['url'], [[(value: any) => /^(https?:\/\/[^\s$.?#].[^\s]*)$/.test(value), 'Invalid URL']]]];
            const messages = getValidateMessages(config, { url: 'invalid-url' });
            expect(messages).toContain('Invalid URL');

            const validMessages = getValidateMessages(config, { url: 'http://example.com' });
            expect(validMessages).toEqual([]);
        });
    });

    describe('region', () => {
        it('should validate region', () => {
            const config = [[['region'], [[(value: any) => value.includes('.'), 'Invalid region']]]];
            const messages = getValidateMessages(config, { region: 'invalid-region' });
            expect(messages).toContain('Invalid region');

            const validMessages = getValidateMessages(config, { region: 'us-central1.gcp' });
            expect(validMessages).toEqual([]);
        });
    });

    describe('array', () => {
        it('should validate array elements', () => {
            const config = [[['emails'], [[(value: any) => Array.isArray(value) && value.every(email => /\S+@\S+\.\S+/.test(email)), 'Invalid email']]]];
            const messages = getValidateMessages(config, { emails: ['valid@example.com', 'invalidemail'] });
            expect(messages).toContain('Invalid email');

            const validMessages = getValidateMessages(config, { emails: ['valid@example.com', 'another@example.com'] });
            expect(validMessages).toEqual([]);
        });
    });
});


describe('envValidators', () => {
    it('should validate clientId with exactly 24 characters', () => {
      const config = envValidators.find(v => v[0][0] === 'clientId');
      const validMessage = getValidateMessages([config], { clientId: '123456789012345678901234' });
      const invalidMessage = getValidateMessages([config], { clientId: '123' });
  
      expect(validMessage).toEqual([]);
      expect(invalidMessage).toContainEqual(expect.objectContaining({ code: 'InValidClientId' }));
    });
  
    it('should validate clientSecret with exactly 32 characters', () => {
      const config = envValidators.find(v => v[0][0] === 'clientSecret');
      const validMessage = getValidateMessages([config], { clientSecret: '12345678901234567890123456789012' });
      const invalidMessage = getValidateMessages([config], { clientSecret: '123' });
  
      expect(validMessage).toEqual([]);
      expect(invalidMessage).toContainEqual(expect.objectContaining({ code: 'InvalidClientSecret' }));
    });
  
    it('should validate projectKey as a valid string', () => {
      const config = envValidators.find(v => v[0][0] === 'projectKey');
      const validMessage = getValidateMessages([config], { projectKey: 'valid-key' });
      const invalidMessage = getValidateMessages([config], { projectKey: 'invalid key!' });
  
      expect(validMessage).toEqual([]);
      expect(invalidMessage).toContainEqual(expect.objectContaining({ code: 'InvalidProjectKey' }));
    });
  
    it('should validate optional scope with at least 2 characters', () => {
      const config = envValidators.find(v => v[0][0] === 'scope');
      const validMessage = getValidateMessages([config], { scope: 'valid-scope' });
      const invalidMessage = getValidateMessages([config], { scope: 'a' });
  
      expect(validMessage).toEqual([]);
      expect(invalidMessage).toContainEqual(expect.objectContaining({ code: 'InvalidScope' }));
    });
  
    it('should validate region as a valid region', () => {
      const config = envValidators.find(v => v[0][0] === 'region');
      const validMessage = getValidateMessages([config], { region: 'us-central1.gcp' });
      const invalidMessage = getValidateMessages([config], { region: 'invalid-region' });
  
      expect(validMessage).toEqual([]);
      expect(invalidMessage).toContainEqual(expect.objectContaining({ code: 'InvalidRegion' }));
    });
  
    it('should validate storeKey as a valid string', () => {
      const config = envValidators.find(v => v[0][0] === 'storeKey');
      const validMessage = getValidateMessages([config], { storeKey: 'valid-store-key' });
      const invalidMessage = getValidateMessages([config], { storeKey: 'invalid store key!' });
  
      expect(validMessage).toEqual([]);
      expect(invalidMessage).toContainEqual(expect.objectContaining({ code: 'InvalidStoreKey' }));
    });
  
    it('should validate relewise datasetId as a valid string', () => {
      const config = envValidators.find(v => v[0][0] === 'relewise' && v[0][1] === 'datasetId');
      const validMessage = getValidateMessages([config], { relewise: { datasetId: 'valid-dataset-id' } });
      const invalidMessage = getValidateMessages([config], { relewise: { datasetId: 'invalid dataset id!' } });
  
      expect(validMessage).toEqual([]);
      expect(invalidMessage).toContainEqual(expect.objectContaining({ code: 'InvalidDatasetId' }));
    });
  
    it('should validate relewise apiKey as a valid string', () => {
      const config = envValidators.find(v => v[0][0] === 'relewise' && v[0][1] === 'apiKey');
      const validMessage = getValidateMessages([config], { relewise: { apiKey: 'valid-api-key' } });
      const invalidMessage = getValidateMessages([config], { relewise: { apiKey: 'invalid api key!' } });
  
      expect(validMessage).toEqual([]);
      expect([invalidMessage]).toEqual([[]]);
    });
  
    it('should validate relewise serverUrl as a valid URL', () => {
      const config = envValidators.find(v => v[0][0] === 'relewise' && v[0][1] === 'serverUrl');
      const validMessage = getValidateMessages([config], { relewise: { serverUrl: 'http://example.com' } });
      const invalidMessage = getValidateMessages([config], { relewise: { serverUrl: 'invalid-url' } });
  
      expect(validMessage).toEqual([]);
      expect(invalidMessage).toContainEqual(expect.objectContaining({ code: 'InvalidServerUrl' }));
    });
  });