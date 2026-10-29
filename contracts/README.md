# API contracts

`code-execution.v1.schema.json` is the shared wire contract for `POST /code/execute`.
The Java records, runtime event writer, and Angular interfaces must agree with it.

## Change policy

- Keep a published v1 payload backward compatible. Add optional fields only when
  old clients can ignore them safely.
- Removing or changing the meaning/type of a field requires a v2 schema and an
  explicit API migration.
- Keep machine-readable error codes stable; user-facing messages may improve.
- Visualization events are structured JSON values. Do not return JSONL as a
  string from the HTTP API; JSONL is only the private runner-to-backend format.
- Update the schema and all server/client representations in the same change.
- Add a contract check to CI whenever a schema validator is introduced; until
  then, review schema and DTO changes together.

`ExecutionEvent.value` intentionally remains an arbitrary JSON value because
container snapshots may be arrays, maps, scalars, or nested combinations. The
event envelope and its metadata remain strictly typed.

The runner exposes separate instrumentation, compilation, and execution stages.
`durationMs` is total wall-clock time for the full request. Failure responses
retain captured stdout/stderr and the process exit code when the process exited.
