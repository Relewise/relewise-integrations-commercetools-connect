# Repository Guide

## Purpose and structure

This repository contains the Relewise commercetools Connect catalog integration.

- `connect.yaml`: Connect deployment and configuration contract.
- `full-sync`: Node.js job application that imports the products selected for a commercetools Store into Relewise.
- `.github/workflows`: CI and issue automation.

Run application commands from `full-sync` unless a task explicitly concerns repository-level files.

## Runtime and commands

- Node.js 24
- npm with the committed `package-lock.json`

```powershell
cd full-sync
npm ci
npm run type-check
npm run lint
npm run format:check
npm run build
npm run test:ci
```

Use `npm run start:dev` for local development. Copy `.env.example` to `.env` and supply development credentials; never commit credentials or populated environment files.

## Required validation

For normal application changes, run all CI commands above. For documentation-only changes, run `npm run format:check` when the edited files are in `full-sync`; otherwise state why application checks were skipped.

For dependency changes, also run `npm audit` and `npm outdated`, and report intentional remaining items. Use the repository `upgrade-dependencies` skill when the request is a dependency refresh.

## Synchronization invariants

The import is authoritative: after a successful run, products carrying the current `ImportedAt` value are enabled and older/missing products are disabled. Preserve these rules:

- Await every Relewise write. A job must never return success while a write is still pending.
- Run final enable/disable administrative actions only after every commercetools page and Relewise product batch succeeds.
- Do not finalize an empty import. An empty source result may indicate a configuration problem and must not disable the existing catalog.
- Use one `ImportedAt` timestamp for the whole run.
- Keep pagination deterministic, cursor-based, and local to one invocation. Do not keep mutable query state at module scope.
- Preserve Store projection when reading product projections.
- Bound outbound concurrency and memory use. Do not return to sequential N+1 fetching or collect the complete catalog before writing.
- Retry only transient failures such as network errors, HTTP 408/429, and 5xx responses. Do not retry normal validation or authorization failures.

## Mapping compatibility

Product identity is the commercetools product key when present, otherwise its ID. Variant identity is the SKU when present, otherwise the numeric variant ID.

Relewise data keys and price/currency conventions are externally visible contracts. In particular, the existing `Decription` key is misspelled but may already be consumed by customers. Do not rename or remove existing keys without an explicit migration plan and documentation.

Keep the two final administrative actions in their current order: enable this run's products, then disable products not marked by this run.

## Configuration and deployment

Keep `connect.yaml`, `.env.example`, runtime validation, and README configuration tables aligned. Treat automatic commercetools API Client generation as a separate migration because it changes deployment inputs and permissions.

The `postDeploy` and `preUndeploy` hooks are for external resource lifecycle automation, not routine application compilation. Add them only when the connector actually creates or removes such resources.

## Testing guidance

- Add regression tests for corrected behavior.
- Mock external commercetools and Relewise calls; unit tests must not require credentials.
- Verify rejected Relewise promises reach the HTTP error response.
- Verify finalization is skipped after empty imports and failed product batches.
- Verify pagination remains ordered and does not share state between runs.

## Change expectations

- Keep edits focused and preserve existing customer-facing mapping behavior.
- Update README documentation when setup, configuration, sync semantics, runtime requirements, or operations change.
- Do not commit `node_modules`, `build`, `coverage`, `.env`, or local HTTP-client environment files.
- Put the Trello card URL on the first line of pull request descriptions when a card exists.

## Repository skills

- `upgrade-dependencies`: safely refresh direct npm dependencies in `full-sync`, resolve compatibility fallout, validate the connector, and prepare a Trello-linked PR.
