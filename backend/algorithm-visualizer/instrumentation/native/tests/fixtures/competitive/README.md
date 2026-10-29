# Competitive programming regression fixtures

These are small, self-authored programs that exercise common competitive
programming patterns supported by the instrumenter. They are not copied
submissions or problem statements from online judges.

Each source has an entry in `manifest.json` with its standard input, expected
standard output, and expected final serialized values. Keep cases small and
deterministic so a failure points to a specific instrumentation behavior.

To add a case:

1. Add a standalone `.cpp` file with `main`.
2. Add its source path, input, output, and final observed values to the
   manifest.
3. Run the native instrumenter integration suite.

The current harness compiles as GNU C++17. Keep expected map contents as JSON
objects and arrays in the same shape emitted by the runtime.
