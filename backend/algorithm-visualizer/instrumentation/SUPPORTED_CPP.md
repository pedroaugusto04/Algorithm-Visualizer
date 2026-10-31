# Instrumented C++ Subset

The visualizer executes the original code with `g++` and captures snapshots of
supported structures. The AST is analyzed with Clang LibTooling, configured
with the same GNU C++ standard (17, 20, or 23) as the compilation.

## Supported in this version

- A single source file containing a `main` function.
- Qualified global variables and local variables declared directly in a block:
<!-- generated-supported-types-start -->
- `std::vector`, `std::deque`, `std::list`, `std::forward_list`, `std::array`, `std::set`, `std::multiset`, `std::unordered_set`, `std::unordered_multiset`, `std::stack`, `std::queue`, `std::priority_queue`, `std::bitset`, `std::pair`, `std::tuple`, `std::map`, `std::multimap`, `std::unordered_map`, `std::unordered_multimap`, `mutable std::string`, `fixed-size C arrays`.
<!-- generated-supported-types-end -->
- `std::pair` and `std::tuple` declared directly are also tracked and emitted as arrays.
- Scalar and arithmetic types (`int`, `long`, `double`, `float`, `char`, `bool`, and enums)
  declared directly in blocks or in global scope are tracked and emitted with type
  `scalar` for inspection in the Variables tab.
- Structs defined before `main`, in global scope or namespace, can be used inside
  observed containers. Their public fields can combine scalar types, enums,
  `std::string`, arrays, `pair`, `tuple`, supported containers, and other eligible structs.
  They are emitted as JSON objects using field names.
- Serializable arithmetic elements, `bool`, `char`, `std::string`, pairs, tuples, and
  nested combinations of containers serialized by the runtime.
- `std::tuple` is serialized as a sequence in element order. `std::bitset<N>` is serialized
  as an array of booleans from index `0` to `N - 1`.
- Containers with custom comparators, hash functions, equality, or allocators, provided
  their elements and keys can be serialized; `vector<bool>` is emitted as a sequence of booleans.
- Mutations performed directly in the statement, including calls to helper functions
  receiving the observed variable and STL algorithms called with iterators derived from it.
  Each statement produces at most one snapshot per variable.
- Control conditions can query observed structures through operations recognized
  as read-only (`size`, `empty`, `find`, among others). Detectable side effects in
  control headers are rejected instead of attributed to the branch or loop body.
- Unbraced bodies of `if`, `else`, `for`, `while`, `do`, `switch`, and range-based `for`:
  the instrumenter adds braces to position snapshots safely.
- Maps are rendered as a simple graph of root and key/value pairs; `multimap` preserves
  repeated keys as separate entries. Sequences and arrays are rendered as arrays.

An `init` event records the first observed state. After it, `snapshot` events are only
emitted when the serialized state changes. The `line` field points to the line of the
original statement that completed the snapshot.
Globals receive their `init` event at the beginning of `main`, before the user's first
instruction; in this event, `line` points to the global declaration.

## Known Limitations

- Only direct local declarations in blocks and qualified global variables are tracked.
  Containers in anonymous namespaces, class fields, and containers declared in a `for`
  header are explicitly rejected. Custom containers are outside the scope.
- Observed structs with inheritance, templates, local scope, private fields, bitfields,
  or pointer/reference fields are rejected with an instrumentation error. Field types
  outside the supported list are also rejected.
- Local aliases detectable via reference, pointer, stored iterator, `span`, `string_view`,
  or reference capture in lambdas are rejected with an error. Temporary iterators used
  by read-only algorithms are not treated as persistent aliases. Indirect escape to global
  or hidden function state cannot be detected in general.
- State is captured per complete statement, not per sub-expression or individual internal
  operation. Statements in the loop body are observed on each iteration when they have
  a direct reference to the variable. Loop initialization and increment do not appear as
  separate steps. Indirect side effects hidden in globals or in functions that do not
  receive the observed structure cannot be detected in general.
- Macros enclosing a statement with an observed variable are rejected. Multiple files,
  templates instantiated outside the main file, runtime exceptions, and private internal
  object state are not visualized.
- Stacks are displayed from top to bottom; queues from front to back; priority queues in
  priority order. Unordered sets are sorted by serialized value to ensure a stable visualization.
- Values of user-defined types without a specific serializer appear as opaque markers.
  Map keys are converted to text and may collide for custom types.

These limitations are deliberate to keep the code transformation simple and preserve a
single execution of the program. This is not a virtual-machine step debugger nor a proof
of semantic equivalence for arbitrary C++.
