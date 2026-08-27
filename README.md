<p align="center">
  <a href="https://relewise.com/">
    <img alt="Relewise logo" src=".github/banner.png">
  </a>
</p>

# Relewise commercetools Connect integration

This connector synchronizes the products assigned to product selections for a commercetools Store into Relewise. It runs as a scheduled commercetools Connect job and performs an authoritative full synchronization: products seen in a successful run are enabled in Relewise, while products no longer present are disabled.

## How synchronization works

Each run:

1. Reads categories in deterministic pages.
2. Reads product-selection assignments for the configured Store.
3. Fetches Store-projected product data with bounded concurrency.
4. Maps and sends products to Relewise in batches using one shared `ImportedAt` timestamp.
5. After every product batch succeeds, enables products marked by the run and disables older products.

The final enable/disable actions are skipped when commercetools returns no products or when any source read or Relewise write fails. This prevents a partial or misconfigured import from disabling the existing Relewise catalog. Transient commercetools and Relewise failures are retried with bounded exponential backoff.

## Product mapping

- Product ID: commercetools product key, falling back to product ID.
- Variant ID: SKU, falling back to the numeric commercetools variant ID.
- Display name: localized product name.
- Category paths: commercetools category ancestors and assigned categories.
- Product data: `ImportedAt`, `Id`, `Decription`, `Slug`, `SearchKeywords`, and `InStock`.
- Variant data: `Id`, `IsMasterVariant`, `ImageUrls`, `InStock`, and `AvailableQuantity`.
- Prices: list and discounted sales prices grouped by country and currency.

`Decription` is an intentionally preserved legacy key. Correcting its spelling would be a breaking data migration for existing consumers.

## Requirements

- A commercetools Project with a Store and product selections.
- A commercetools API Client for creating the deployment. In addition to the permissions needed to manage Connect deployments, it must have `manage_api_clients:{projectKey}` so Connect can create the connector's API Client. Do not grant `manage_api_clients` to the generated connector client.
- A Relewise dataset and an API key allowed to perform product updates and administrative actions.
- Node.js 24 for local development.
- npm, using the committed lockfile.

## Configuration

The deployment contract is defined in [`connect.yaml`](./connect.yaml). The job runs hourly by default (`0 * * * *`); a deployment can override the schedule.

Connect automatically creates a least-privilege commercetools API Client for the connector with these scopes:

- `view_products`
- `view_product_selections`
- `view_categories`

The Project key is appended to each scope by Connect. The deployment API Client's `manage_api_clients` scope is only used by Connect to create this client and is not inherited by the connector.

### Secured configuration

| Variable              | Description                                    |
| --------------------- | ---------------------------------------------- |
| `RELEWISE_STORE_KEY`  | Key of the commercetools Store to synchronize. |
| `RELEWISE_DATASET_ID` | Relewise dataset ID.                           |
| `RELEWISE_API_KEY`    | Relewise API key.                              |
| `RELEWISE_SERVER_URL` | Relewise API server URL for the dataset.       |

The Relewise values are available in [My Relewise](https://my.relewise.com). Keep all credentials out of source control and logs.

### Generated commercetools environment

Connect injects `CTP_API_URL`, `CTP_AUTH_URL`, `CTP_CLIENT_ID`, `CTP_CLIENT_SECRET`, `CTP_PROJECT_KEY`, and `CTP_SCOPE` into the running job. These values must not also be declared as connector configuration because that conflicts with the inherited API Client contract.

## Local development

From `full-sync`:

```powershell
npm ci
Copy-Item .env.example .env
# Fill in the local development values in .env
npm run start:dev
```

The automatic API Client environment is only injected into a deployed connector. For local development, create a separate API Client with `view_products`, `view_product_selections`, and `view_categories`, then add its credentials, scope, Project key, API URL, and authentication URL to `.env`. Never commit `.env`.

Trigger the local job with an empty POST request:

```powershell
Invoke-WebRequest -Method Post -Uri http://localhost:8080/full-sync
```

The endpoint returns `204 No Content` only after the synchronization and final administrative actions complete. Errors return a sanitized response while detailed diagnostics are written through the application logger.

## Validation

Run the same checks as CI from `full-sync`:

```powershell
npm ci
npm run type-check
npm run lint
npm run format:check
npm run build
npm run test:ci
npm audit
```

Tests mock external services and do not require commercetools or Relewise credentials.

## Deployment and releases

commercetools Connect builds the `full-sync` application from the committed `package-lock.json`. The `gcp-build` and `start` package scripts compile and run the application. Connect creates the connector API Client from `inheritAs.apiClient` in `connect.yaml`, so no custom deployment lifecycle script is required.

Validate changes through a Connect preview or sandbox deployment before production. Publish immutable connector versions using Git tags so deployments can refer to a known source revision and lockfile.

Operationally, monitor job duration, product counts, transient retries, and failures. A failed job is safe to rerun because product updates carry a run timestamp and finalization happens only after all product batches succeed.

### Migrating an existing deployment

Existing deployments that supplied commercetools credentials manually must be updated to the inherited API Client contract:

1. Grant `manage_api_clients:{projectKey}` to the API Client used to update the Connector and deployment.
2. Publish or preview the updated Connector, then update the deployment with `updateConnector: true`.
3. Supply only the Relewise secured configuration shown above; the previous `CTP_REGION`, `CTP_PROJECT_KEY`, `CTP_CLIENT_ID`, `CTP_CLIENT_SECRET`, and `CTP_SCOPE` inputs are no longer part of the deployment contract.
4. Verify in a preview or sandbox that the generated client can read categories, products, and product-selection assignments before updating production.

## Dependency maintenance

Dependabot checks GitHub Actions dependencies monthly. Repository maintainers use the `upgrade-dependencies` skill in `.agents/skills` for coordinated npm upgrades, validation, and the Trello-linked pull request workflow.

## Support and contributing

For support options, see the [Relewise support documentation](https://docs.relewise.com/docs/developer/support.html).

Pull requests are welcome. Include tests for behavior changes, run the validation suite, update documentation for user-visible changes, and put the relevant Trello card URL on the first line of the pull request description.

Report defects through the [issue tracker](https://github.com/Relewise/relewise-integrations-commercetools-connect/issues).

## License

This repository is licensed under the [MIT license](./LICENSE).
