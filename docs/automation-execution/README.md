# Durable incident execution

Implemented E5 teaching experience, 7 September 2026. The browser runs actual TypeScript fixture tools and persists their journal and external environment separately. Both available policies are authored code. No language model, real maintenance system, paid service or production agent is running.

## What the example executes

A fictional incident requires two FILTER-A units for FAN-7 and one linked work order citing manual-fan-7. The environment also contains FAN-9 and another supported manual fact. Tools really read the fixtures, decrement inventory, create reservations and work orders, and return durable idempotency receipts. Typed arguments, resource/domain checks, runtime authority and a human approval bound to the exact reservation precede service. Registry export is outside the allowed capability set.

The fixed workflow selects the target asset and stops on schema errors. The bounded authored policy can repair the prescribed string-quantity error and look up an uncertain receipt, but deliberately uses a first-fact selection rule. In the wrong-entity case it completes a valid supported work order for FAN-9; the independent environment oracle rejects it. In the malicious-manual case it makes a prescribed unsafe export proposal and the runtime denies the call. These are transparent authored teaching behaviors, not empirical statements about model behavior.

Nine cases run under both policies: normal, commit-before-lost-response, duplicate event delivery, malformed schema, missing write authority, malicious reference text, cancellation before write, cancellation after commit, and supported wrong-entity evidence. Live review can also approve or decline, and cancellation can be requested during an unfinished run. Comparison runs automatically approve exact reservation payloads solely to compare policies; they cannot approve an active run.

## Boundaries and invariants

- Policy completion, source support and task correctness are separate results. The task oracle reads actual environment state and does not read a policy's success flag.
- Inventory equals initial inventory minus committed reservations. There is exactly one receipt per idempotency key. Reusing a key with changed arguments returns an error; it never silently reinterprets an old effect.
- Human approval binds the canonical full call, including asset, evidence, quantity and key. Canonical JSON is an equality representation, not a cryptographic signature.
- A committed reservation can exist while the caller sees only timeout. Cancellation stops further work; it does not undo an existing reservation or manufacture a refund/compensating transaction.
- A delivered event is not a new business task. The duplicate case queues two deliveries of one incident and runs its tools once.
- Service durations are fixed synthetic milliseconds: asset read 40, manual search 60, reservation 80, receipt lookup 20, work order 50. Proposal is 5 ms; schema and authority checks are 1 ms each. Queue/review delays are declared scenario inputs, unrelated to real UI reading time.
- One worker serializes service. Reported elapsed time partitions into admission, completed recorded service, assumed review and other/restart intervals. UTF-8 proposed-call JSON bytes are payload counters, not wire bytes, provider tokens, energy, dollars or measured latency.
- The search tool supplies a small authored reference set, not a neural retriever. The environment and all purported equipment guidance are fictional.

## Durable storage contract

`createAutomationWorkspace(storage)` takes a synchronous storage port with atomic `setItem`: a throwing write leaves that item unchanged. Browser localStorage provides the implementation used here. It is a local single-worker teaching boundary, not a distributed transaction system or a guarantee across power loss, browsers or concurrent writers.

Every tool intent and approval is appended before service starts. An external effect is stored before its response is appended. If response journaling fails, the external commit remains. Reload accepts only the effect matching the outstanding approved service intent; replay records the reconciled original receipt, retries idempotently, and never decrements inventory twice. Read operations can simply be repeated. A failed environment write leaves old inventory and the durable pending intent intact.

The active journal names a separately stored environment slot. Import or a new run writes a fresh slot before switching the active journal pointer. The exact prior raw journal/environment pair is backed up before replacement. Backup failure preserves the active run and live state. Invalid prior raw data can be exported and is preserved before a new run is installed. Import validation re-executes recorded tool effects from the initial fixture, checks service durations and compares actual results and environment state; a forged stock count or result is rejected.

Optimistic active-record checks reject a workspace that has observed a newer saved journal in another tab. This is not an atomic cross-tab compare-and-swap; use one active writer. The bounded recovery list permits 30 displaced records and at most six million encoded bytes. Exported recovery can be cleared by an explicit button whose expected raw value must still match. Active records remain untouched. Environment slots can remain as orphan storage records after an interrupted replacement; export/recovery correctness does not depend on them being deleted.

Browser storage failure is visible and does not silently turn durable execution into volatile execution. Existing live state remains exportable. A browser that denies storage cannot start a durable run in this component. Optional animation and WebGL are not used.

## Integration and public API

Component: `src/components/automation-explorer.tsx`, default `AutomationExplorer({onSelect?:(id:string)=>void})`. It imports its own scoped CSS and standard studio primitives. It does not modify shared navigation, studio-record or content packs. Inputs apply only when “Start configured run” is selected; changing draft settings cannot mutate an approved active payload. Event scrubbing preserves the full live run, and the active-run review panel always concerns the actual current action.

Pure exports in `src/lib/automation-execution.ts`:

- `createAutomationRun(scenario)` and `runAutomationScenario(scenario, approval)`.
- `advanceAutomation(snapshot, command, persistence?, adapter?)` returns the last committed snapshot plus a visible error, including any already committed external effect.
- `replayAutomationJournal(document)`, `evaluateAutomationEnvironment(snapshot)`, `automationMetrics(snapshot)`.
- `createAutomationScenario()` and `automationCases`.

Journal exports: `validateAutomationSnapshot`, `serializeAutomationArchive`, `readAutomationArchive`, `createAutomationWorkspace`. Shared types live in `automation-contracts.ts`.

A future `PolicyAdapter` accepts observable state and returns a tool call, completion or failure with provider/model/configuration identity. An asynchronous caller can obtain a real model decision outside the pure engine and supply it through this port. Every proposal still passes through the same schema, authority, approval and service gates. No adapter is connected in the UI. The test uses a labeled stub only to check this contract; it supplies no actual-model evidence or invented chain of thought.

## Verification

Run `node --experimental-strip-types --test scripts/automation-execution.test.mjs` and `npx tsc --noEmit`. The scoped suite includes 35 tests, all nine cases under both policies, every live prefix of representative failures, independent inventory and hand-computed timing checks, stale approval, contradictory idempotency arguments, invalid archive/result injection, storage failure before intent/commit/ack, reload after an unacknowledged commit, failed import/backup, exact invalid-raw recovery and stale-tab protection.

Source-only and automated verification are recorded here. Browser, physical-device, screen-reader and learner observations must be recorded separately by the integration owner. The view provides keyboard controls, scrollable exact tables, live-status text, static state inspection and visible error messages; these implementation properties are not claims of observed accessibility or learning efficacy.

See [sources](source-review.json) for scoped primary-source checks. No framework implementation is reproduced, and no benchmark score is transferred to the fixture.

## Fitted local proposal extension

The separate [learned retrieval and action bridge](LEARNED-RETRIEVAL.md) now supplies an actual fitted mean-embedding retriever and conditional token decoder for the same fictional incident and corpus. A versioned frozen proposal can enter E5's existing schema/authority/review/idempotency boundaries. The two baseline policies described above remain authored; the learned run's outer workflow also remains authored. The journal's optional `learnedHandoff` preserves weights, request and generated proposal through reload, while old authored archives remain compatible. Source and task checks remain independent of model output.
