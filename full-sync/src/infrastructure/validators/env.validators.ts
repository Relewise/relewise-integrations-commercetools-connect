import {
  optional,
  standardString,
  standardKey,
  region,
  standardUrl,
} from './helpers.validators';

/**
 * Create here your own validators
 */
const envValidators = [
  standardString(
    ['clientId'],
    {
      code: 'InValidClientId',
      message: 'Client id should be 24 characters.',
      referencedBy: 'environmentVariables',
    },
    { min: 24, max: 24 }
  ),

  standardString(
    ['clientSecret'],
    {
      code: 'InvalidClientSecret',
      message: 'Client secret should be 32 characters.',
      referencedBy: 'environmentVariables',
    },
    { min: 32, max: 32 }
  ),

  standardKey(['projectKey'], {
    code: 'InvalidProjectKey',
    message: 'Project key should be a valid string.',
    referencedBy: 'environmentVariables',
  }),

  optional(standardString)(
    ['scope'],
    {
      code: 'InvalidScope',
      message: 'Scope should be at least 2 characters long.',
      referencedBy: 'environmentVariables',
    },
    { min: 2, max: undefined }
  ),

  region(['region'], {
    code: 'InvalidRegion',
    message: 'Not a valid region.',
    referencedBy: 'environmentVariables',
  }),

  standardKey(
    ['storeKey'],
    {
      code: 'InvalidStoreKey',
      message: 'Store key should be a valid string.',
      referencedBy: 'environmentVariables',
    }
  ),
  standardKey(
    ['relewise', 'datasetId'],
    {
      code: 'InvalidDatasetId',
      message: 'Dataset Id should be a valid string.',
      referencedBy: 'environmentVariables',
    }
  ),
  standardString(
    ['relewise', 'apiKey'],
    {
      code: 'InvalidApiKey',
      message: 'API Key should be a valid string.',
      referencedBy: 'environmentVariables',
    }
  ),
  standardUrl(
    ['relewise', 'serverUrl'],
    {
      code: 'InvalidServerUrl',
      message: 'Server Url should be a valid string.',
      referencedBy: 'environmentVariables',
    }
  ),
];

export default envValidators;
