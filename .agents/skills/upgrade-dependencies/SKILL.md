---
name: upgrade-dependencies
description: Upgrade npm dependencies in the commercetools Connect integration. Use for dependency refreshes and dependency-upgrade PRs in this repository; require a Trello card, coordinate coupled package families, preserve sync invariants, validate the Node job, and deliver a Trello-linked PR.
---

# Upgrade Dependencies

Upgrade direct runtime and development dependencies in `full-sync` and resolve compatibility changes that are a direct consequence of the upgrade.

## Required input and preflight

Require a Trello card URL before making an upgrade branch or PR. Stop and ask for it when absent.

From repository root:

1. Require `git status --porcelain` to be empty.
2. Confirm `origin` exists and fetch it with pruning.
3. Switch to `main` and update it with `git pull --ff-only origin main`.
4. Create `chore/upgrade-dependencies-yyyyMM`; stop if it already exists locally or remotely.

Do not discard local changes or continue after a failed safety check.

## Upgrade policy

Target `full-sync/package.json`. Upgrade direct `dependencies` and `devDependencies`; do not edit transitive versions manually.

Preserve each declaration's range style. Keep Node tooling aligned with the Node 24 runtime and do not upgrade `@types/node` to a different Node major.

Review these package families together because their compatibility is coupled:

- `@commercetools/platform-sdk`, `@commercetools/sdk-client-v2`, and `@commercetools-backend/loggers`.
- `@relewise/client` and `@relewise/integrations`; confirm the integrations peer range accepts the selected client version.
- `typescript`, `ts-jest`, `jest`, `@types/jest`, ESLint, and TypeScript ESLint. Respect all peer ranges instead of forcing installation.
- `express`, `@types/express`, and `supertest`; re-check middleware and error-handler behavior after majors.

Prefer a clean lockfile regeneration when a major toolchain upgrade cannot be resolved from the existing lockfile. Follow it with both `npm install` and `npm ci`; never use `--force` or `--legacy-peer-deps` to hide an incompatible graph.

Remove dependencies that are no longer needed and keep test-only packages in `devDependencies`.

## Compatibility and invariants

Fix manageable API, type, lint, build, and test fallout caused by the upgrades. Preserve the authoritative sync invariants in `AGENTS.md`, especially awaited writes, safe finalization, deterministic pagination, and bounded concurrency.

Pause for direction if compatibility work becomes a business-logic redesign, changes mapping keys, changes identity semantics, or requires the automatic Connect API Client credential migration.

## Required validation

From `full-sync`, run and treat failures as blocking:

```powershell
npm ci
npm run type-check
npm run lint
npm run format:check
npm run build
npm run test:ci
npm start
npm audit
npm outdated
```

For `npm start`, provide valid-shape non-production environment values, verify the compiled server listens on port 8080, and stop it without triggering a live sync. Record remaining outdated packages or audit findings with reasons.

## Commit and pull request

Commit dependency declarations, the regenerated lockfile, and direct compatibility fixes together. Push the monthly branch and open a draft PR to `main`.

The Trello URL must be the first line of the PR description. Include:

- Upgraded packages grouped by family.
- Compatibility changes.
- Lockfile regeneration status.
- Every validation command and result.
- Remaining outdated packages, audit findings, or constraints.

Return the branch URL and draft PR URL.
