import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[3]
INSTRUMENTER = os.environ.get("AV_INSTRUMENTER", "av-instrumenter")
RUNTIME_HEADER = ROOT / "instrumentation" / "runtime_cpp.hpp"
COMPETITIVE_FIXTURES = Path(__file__).parent / "fixtures" / "competitive"


class InstrumenterIntegrationTests(unittest.TestCase):
    def run_program(self, source: str, stdin: str = ""):
        with tempfile.TemporaryDirectory(prefix="av-instrumenter-test-") as temp:
            work = Path(temp)
            input_file = work / "main.cpp"
            instrumented_file = work / "instrumented.cpp"
            executable = work / "program"
            events_file = work / "events.jsonl"
            include_dir = work / "include" / "algorithm-visualizer"
            include_dir.mkdir(parents=True)
            shutil.copyfile(RUNTIME_HEADER, include_dir / "runtime_cpp.hpp")
            shutil.copytree(RUNTIME_HEADER.parent / "runtime", include_dir / "runtime")
            input_file.write_text(source)

            result = subprocess.run(
                [INSTRUMENTER, str(input_file), "--std=gnu++17"],
                check=False,
                text=True,
                capture_output=True,
            )
            if result.returncode != 0:
                self.fail(f"instrumenter failed ({result.returncode}): {result.stderr}")
            instrumented_file.write_text(result.stdout)
            compilation = subprocess.run(
                ["g++", "-std=gnu++17", "-I", str(work / "include"), str(instrumented_file), "-o", str(executable)],
                check=False,
                text=True,
                capture_output=True,
            )
            if compilation.returncode != 0:
                self.fail(f"generated source did not compile:\n{compilation.stderr}\n{result.stdout}")
            execution = subprocess.run(
                [str(executable)],
                check=True,
                text=True,
                input=stdin,
                capture_output=True,
                env={**os.environ, "AV_EVENT_FILE": str(events_file)},
            )
            events = [json.loads(line) for line in events_file.read_text().splitlines()]
            return execution.stdout, events

    def test_vector_helper_algorithm_and_unbraced_if(self):
        stdout, events = self.run_program(r"""
#include <algorithm>
#include <iostream>
#include <map>
#include <vector>
void append_one(std::vector<int>& values) { values.push_back(3); }
int main() {
    std::vector<int> values{1, 2};
    values[0]++;
    append_one(values);
    std::reverse(values.begin(), values.end());
    if (values[0] == 3)
        values.push_back(4);
    std::cout << values.size() << '\n';
}
""")
        self.assertEqual(stdout, "4\n")
        states = [event["value"] for event in events if event["path"] == "values"]
        self.assertEqual(states, [[1, 2], [2, 2], [2, 2, 3], [3, 2, 2], [3, 2, 2, 4]])
        self.assertEqual(events[0]["op"], "init")
        self.assertTrue(all("line" in event for event in events))

    def test_map_snapshot_and_same_name_scopes(self):
        stdout, events = self.run_program(r"""
#include <iostream>
#include <map>
int main() {
    std::map<int, int> values;
    values[7] = 9;
    { std::map<int, int> values; values[2] = 5; }
    std::cout << values[7] << '\n';
}
""")
        self.assertEqual(stdout, "9\n")
        paths = {event["path"] for event in events}
        self.assertEqual(len(paths), 2)
        self.assertTrue(any(path.startswith("values@") for path in paths))
        self.assertTrue(any(event["value"] == {"7": 9} for event in events))

    def test_scalar_only_main_is_left_runnable(self):
        stdout, events = self.run_program("int main() { int answer = 42; return answer == 42 ? 0 : 1; }\n")
        self.assertEqual(stdout, "")
        self.assertEqual(events, [])

    def test_fixed_array_is_snapshotted_each_loop_iteration(self):
        stdout, events = self.run_program(r"""
#include <iostream>
int main() {
    int values[3] = {1, 2, 3};
    for (int i = 0; i < 2; ++i) {
        values[i] += 2;
    }
    std::cout << values[0] + values[1] + values[2] << '\n';
}
""")
        self.assertEqual(stdout, "10\n")
        states = [event["value"] for event in events if event["path"] == "values"]
        self.assertEqual(states, [[1, 2, 3], [3, 2, 3], [3, 4, 3]])

    def test_competitive_input_nested_vectors_and_unbraced_loop(self):
        stdout, events = self.run_program(r"""
#include <iostream>
#include <vector>
int main() {
    int n; std::cin >> n;
    std::vector<std::vector<int>> rows{{1}, {2}};
    for (int i = 0; i < n; ++i)
        rows[0].push_back(i + 3);
    std::cout << rows[0].size() << ' ' << rows[1][0] << '\n';
}
""", stdin="2\n")
        self.assertEqual(stdout, "3 2\n")
        states = [event["value"] for event in events if event["path"] == "rows"]
        self.assertEqual(states, [[[1], [2]], [[1, 3], [2]], [[1, 3, 4], [2]]])

    def test_unbraced_continue_with_observed_container_compiles(self):
        stdout, events = self.run_program(r"""
#include <iostream>
#include <vector>
int main() {
    std::vector<int> distance{0, -1, 2};
    for (int i = 0; i < static_cast<int>(distance.size()); ++i) {
        if (distance[i] >= 0) continue;
        distance[i] = i;
    }
    for (int value : distance) std::cout << value << ' ';
    std::cout << '\n';
}
""")
        self.assertEqual(stdout, "0 1 2 \n")
        states = [event["value"] for event in events if event["path"] == "distance"]
        self.assertEqual(states[-1], [0, 1, 2])

    def test_nested_pairs_are_serialized_as_json_values(self):
        stdout, events = self.run_program(r"""
#include <iostream>
#include <map>
#include <utility>
#include <vector>
int main() {
    std::vector<std::pair<int, int>> pairs{{1, 2}};
    std::map<int, std::vector<std::pair<int, int>>> grouped{{7, {{3, 4}}}};
    pairs.push_back({5, 6});
    grouped[7].push_back({8, 9});
    std::cout << pairs.size() + grouped[7].size() << '\n';
}
""")
        self.assertEqual(stdout, "4\n")
        states = {event["path"]: event["value"] for event in events if event["op"] == "init"}
        self.assertEqual(states["pairs"], [[1, 2]])
        self.assertEqual(states["grouped"], {"7": [[3, 4]]})
        self.assertEqual(
            [event["value"] for event in events if event["path"] == "pairs"],
            [[[1, 2]], [[1, 2], [5, 6]]],
        )
        self.assertEqual(
            [event["value"] for event in events if event["path"] == "grouped"],
            [{"7": [[3, 4]]}, {"7": [[3, 4], [8, 9]]}],
        )

    def test_bitset_pair_and_tuple_have_initial_and_mutated_states(self):
        stdout, events = self.run_program(r"""
#include <bitset>
#include <iostream>
#include <tuple>
#include <utility>
int main() {
    std::bitset<4> selected("0101");
    std::pair<int, int> edge{2, 7};
    std::tuple<int, char, bool> state{3, 'x', false};
    selected.flip(1);
    edge.second = 9;
    std::get<2>(state) = true;
    std::cout << selected.count() + edge.second + std::get<0>(state) << '\n';
}
""")
        self.assertEqual(stdout, "15\n")
        values = {}
        for event in events:
            values.setdefault(event["path"], []).append(event["value"])

        self.assertEqual(values["selected"], [[True, False, True, False], [True, True, True, False]])
        self.assertEqual(values["edge"], [[2, 7], [2, 9]])
        self.assertEqual(values["state"], [[3, "x", False], [3, "x", True]])

    def test_vector_of_public_structs_serializes_named_fields(self):
        stdout, events = self.run_program(r"""
#include <iostream>
#include <string>
#include <vector>
namespace cp {
struct Edge {
    int to;
    int weight;
};
struct Node {
    std::string name;
    std::vector<Edge> edges;
    Edge preferred;
};
}
int main() {
    std::vector<cp::Node> nodes{{"a", {{2, 7}}, {3, 4}}};
    nodes[0].edges[0].weight += 3;
    nodes[0].preferred.to = 5;
    nodes.push_back({"b", {{4, 1}}, {6, 2}});
    std::cout << nodes.size() << ' ' << nodes[0].edges[0].weight << '\n';
}
""")
        self.assertEqual(stdout, "2 10\n")
        self.assertEqual(
            [event["value"] for event in events if event["path"] == "nodes"],
            [
                [{"name": "a", "edges": [{"to": 2, "weight": 7}], "preferred": {"to": 3, "weight": 4}}],
                [{"name": "a", "edges": [{"to": 2, "weight": 10}], "preferred": {"to": 3, "weight": 4}}],
                [{"name": "a", "edges": [{"to": 2, "weight": 10}], "preferred": {"to": 5, "weight": 4}}],
                [
                    {"name": "a", "edges": [{"to": 2, "weight": 10}], "preferred": {"to": 5, "weight": 4}},
                    {"name": "b", "edges": [{"to": 4, "weight": 1}], "preferred": {"to": 6, "weight": 2}},
                ],
            ],
        )

    def test_vector_bool_and_maps_with_custom_comparators_keep_structured_values(self):
        stdout, events = self.run_program(r"""
#include <functional>
#include <iostream>
#include <map>
#include <vector>
int main() {
    std::vector<bool> flags{true, false};
    std::map<int, int, std::greater<int>> scores{{1, 10}, {2, 20}};
    flags[1] = true;
    scores[3] = 30;
    std::cout << flags.size() + scores.size() << '\n';
}
""")
        self.assertEqual(stdout, "5\n")
        self.assertEqual(
            [event["value"] for event in events if event["path"] == "flags"],
            [[True, False], [True, True]],
        )
        self.assertEqual(
            [event["value"] for event in events if event["path"] == "scores"],
            [{"1": 10, "2": 20}, {"1": 10, "2": 20, "3": 30}],
        )

    def test_every_registered_structure_has_initial_and_mutated_serialized_states(self):
        stdout, events = self.run_program(r"""
#include <array>
#include <deque>
#include <forward_list>
#include <iostream>
#include <list>
#include <map>
#include <queue>
#include <set>
#include <stack>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>
int main() {
    std::vector<int> vector{1};
    std::deque<int> deque{1};
    std::list<int> list{1};
    std::forward_list<int> forward{1};
    std::array<int, 2> fixed{1, 2};
    std::set<int> set{1};
    std::multiset<int> multiset{1};
    std::unordered_set<int> unordered_set{1};
    std::unordered_multiset<int> unordered_multiset{1};
    std::stack<int> stack;
    std::queue<int> queue;
    std::priority_queue<int> priority_queue;
    std::map<int, int> map{{1, 10}};
    std::multimap<int, int> multimap{{1, 10}};
    std::unordered_map<int, int> unordered_map{{1, 10}};
    std::unordered_multimap<int, int> unordered_multimap{{1, 10}};
    std::string text{"a"};
    int c_array[2] = {1, 2};

    vector.push_back(2); deque.push_back(2); list.push_back(2); forward.push_front(2);
    fixed[0] = 2; set.insert(2); multiset.insert(2); unordered_set.insert(2);
    unordered_multiset.insert(2); stack.push(2); queue.push(2); priority_queue.push(2);
    map[2] = 20; multimap.emplace(2, 20); unordered_map[2] = 20;
    unordered_multimap.emplace(2, 20); text.push_back('b'); c_array[0] = 2;
    std::cout << "ok\n";
}
""")
        self.assertEqual(stdout, "ok\n")
        values = {}
        for event in events:
            values.setdefault(event["path"], []).append(event["value"])

        expected = {
            "vector": [[1], [1, 2]],
            "deque": [[1], [1, 2]],
            "list": [[1], [1, 2]],
            "forward": [[1], [2, 1]],
            "fixed": [[1, 2], [2, 2]],
            "set": [[1], [1, 2]],
            "multiset": [[1], [1, 2]],
            "unordered_set": [[1], [1, 2]],
            "unordered_multiset": [[1], [1, 2]],
            "stack": [[], [2]],
            "queue": [[], [2]],
            "priority_queue": [[], [2]],
            "map": [{"1": 10}, {"1": 10, "2": 20}],
            "multimap": [[[1, 10]], [[1, 10], [2, 20]]],
            "unordered_map": [{"1": 10}, {"1": 10, "2": 20}],
            "unordered_multimap": [[[1, 10]], [[1, 10], [2, 20]]],
            "text": [["a"], ["a", "b"]],
            "c_array": [[1, 2], [2, 2]],
        }
        self.assertEqual(values, expected)

    def test_competitive_solution_corpus_preserves_output_and_final_states(self):
        manifest = json.loads((COMPETITIVE_FIXTURES / "manifest.json").read_text())

        for case in manifest["cases"]:
            source_path = COMPETITIVE_FIXTURES / case["source"]
            with self.subTest(program=case["name"]):
                stdout, events = self.run_program(
                    source_path.read_text(),
                    stdin=case.get("stdin", ""),
                )
                self.assertEqual(stdout, case["expected_stdout"])
                final_values = {}
                for event in events:
                    final_values[event["path"]] = event["value"]
                for path, expected in case["expected_values"].items():
                    self.assertIn(path, final_values)
                    self.assertEqual(final_values[path], expected)

    def test_common_competitive_structures_have_stable_visual_states(self):
        stdout, events = self.run_program(r"""
#include <array>
#include <iostream>
#include <map>
#include <queue>
#include <set>
#include <stack>
#include <string>
#include <unordered_set>
int main() {
    std::array<int, 2> fixed{1, 2};
    std::set<int> ordered{3, 1};
    std::unordered_set<int> hashed{4, 2};
    std::multimap<int, int> repeated;
    repeated.emplace(2, 10);
    repeated.emplace(2, 20);
    std::stack<int> lifo;
    lifo.push(10);
    lifo.push(20);
    std::queue<int> fifo;
    fifo.push(7);
    std::priority_queue<int> best;
    best.push(2);
    best.push(5);
    std::string text = "ab";
    text.push_back('c');
    std::cout << fixed[0] + static_cast<int>(ordered.size() + hashed.size() + lifo.size()
        + fifo.size() + best.size() + text.size()) << '\n';
}
""")
        self.assertEqual(stdout, "13\n")
        initial = {event["path"]: event["value"] for event in events if event["op"] == "init"}
        self.assertEqual(initial["fixed"], [1, 2])
        self.assertEqual(initial["ordered"], [1, 3])
        self.assertEqual(initial["hashed"], [2, 4])
        self.assertEqual(initial["repeated"], [])
        self.assertEqual(initial["lifo"], [])
        self.assertEqual(initial["fifo"], [])
        self.assertEqual(initial["best"], [])
        self.assertEqual(initial["text"], ["a", "b"])

        states = [event["value"] for event in events if event["path"] == "lifo"]
        self.assertEqual(states, [[], [10], [20, 10]])
        self.assertEqual(
            [event["value"] for event in events if event["path"] == "fifo"],
            [[], [7]],
        )
        self.assertEqual(
            [event["value"] for event in events if event["path"] == "best"],
            [[], [2], [5, 2]],
        )
        self.assertEqual(
            [event["value"] for event in events if event["path"] == "text"],
            [["a", "b"], ["a", "b", "c"]],
        )
        self.assertEqual(
            [event["value"] for event in events if event["path"] == "repeated"],
            [[], [[2, 10]], [[2, 10], [2, 20]]],
        )

    def test_container_alias_is_rejected_instead_of_silently_losing_updates(self):
        programs = [
            ("reference", "gnu++17", "#include <vector>\n", "std::vector<int> values{1};", "auto& alias = values; alias.push_back(2);"),
            ("pointer", "gnu++17", "#include <vector>\n", "std::vector<int> values{1};", "auto* alias = &values; alias->push_back(2);"),
            ("iterator", "gnu++17", "#include <vector>\n", "std::vector<int> values{1};", "auto alias = values.begin(); *alias = 2;"),
            ("span", "gnu++20", "#include <vector>\n#include <span>\n", "std::vector<int> values{1};", "std::span<int> alias(values); alias[0] = 2;"),
            ("lambda capture", "gnu++17", "#include <vector>\n", "std::vector<int> values{1};", "auto alias = [&values] { values.push_back(2); }; alias();"),
            ("string view", "gnu++17", "#include <string>\n#include <string_view>\n", "std::string values{\"a\"};", "std::string_view alias(values); (void)alias;"),
        ]
        for label, standard, includes, declaration, alias_code in programs:
            with self.subTest(alias_kind=label), tempfile.TemporaryDirectory(prefix="av-instrumenter-alias-") as temp:
                source_file = Path(temp) / "main.cpp"
                source_file.write_text(
                    includes
                    + "int main() { "
                    + declaration
                    + " "
                    + alias_code
                    + " }\n"
                )
                result = subprocess.run(
                    [INSTRUMENTER, str(source_file), f"--std={standard}"],
                    check=False,
                    text=True,
                    capture_output=True,
                )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("alias de contêiner observado não suportado", result.stderr)
            self.assertEqual(result.stdout, "")

    def test_global_containers_are_instrumented(self):
        stdout, events = self.run_program(r"""
#include <iostream>
#include <vector>
std::vector<int> values{1};
int main() {
    values.push_back(2);
    std::cout << values.back() << '\n';
}
""")
        self.assertEqual(stdout, "2\n")
        self.assertEqual(
            [event["value"] for event in events if event["path"] == "values"],
            [[1], [1, 2]],
        )

    def test_global_namespaced_and_shadowed_containers_keep_distinct_paths(self):
        stdout, events = self.run_program(r"""
#include <iostream>
#include <vector>
std::vector<int> values{1};
namespace cp { std::vector<int> values{2}; }
int main() {
    values.push_back(3);
    {
        std::vector<int> values{9};
        values.push_back(10);
    }
    cp::values.push_back(4);
    std::cout << values.back() + cp::values.back() << '\n';
}
""")
        self.assertEqual(stdout, "7\n")
        states_by_path = {}
        for event in events:
            states_by_path.setdefault(event["path"], []).append(event["value"])

        self.assertEqual(len(states_by_path), 3)
        self.assertTrue(all(path.startswith("values@") for path in states_by_path))
        self.assertEqual(
            {json.dumps(states) for states in states_by_path.values()},
            {
                json.dumps([[1], [1, 3]]),
                json.dumps([[2], [2, 4]]),
                json.dumps([[9], [9, 10]]),
            },
        )

    def test_class_member_containers_are_rejected_explicitly(self):
        self.assert_rejected_with(
            "#include <vector>\nstruct State { std::vector<int> values; }; int main() { State state; }\n",
            "contêiner membro de classe não suportado para visualização: values",
        )

    def test_for_header_containers_are_rejected_explicitly(self):
        self.assert_rejected_with(
            "#include <vector>\nint main() { for (std::vector<int> values{1}; !values.empty(); values.clear()) {} }\n",
            "contêiner declarado no cabeçalho de for não suportado para visualização: values",
        )

    def assert_rejected_with(self, source: str, message: str):
        with tempfile.TemporaryDirectory(prefix="av-instrumenter-unsupported-") as temp:
            source_file = Path(temp) / "main.cpp"
            source_file.write_text(source)
            result = subprocess.run(
                [INSTRUMENTER, str(source_file), "--std=gnu++17"],
                check=False,
                text=True,
                capture_output=True,
            )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(message, result.stderr)
        self.assertEqual(result.stdout, "")

    def test_mutating_control_headers_are_rejected_instead_of_misattributed_to_loop_body(self):
        programs = [
            "for (int i = 0; i < 1; values.push_back(i++)) {}",
            "while (mutate(values)) {}",
            "if (mutate(values)) {}",
        ]
        for header in programs:
            with self.subTest(header=header), tempfile.TemporaryDirectory(prefix="av-instrumenter-header-") as temp:
                source_file = Path(temp) / "main.cpp"
                source_file.write_text(
                    "#include <vector>\n"
                    "bool mutate(std::vector<int>& values) { values.push_back(2); return false; }\n"
                    "int main() { std::vector<int> values{1}; " + header + " }\n"
                )
                result = subprocess.run(
                    [INSTRUMENTER, str(source_file), "--std=gnu++17"],
                    check=False,
                    text=True,
                    capture_output=True,
                )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("efeito colateral em cabeçalho de controle", result.stderr)
            self.assertEqual(result.stdout, "")

    def test_temporary_iterators_used_for_read_only_algorithms_are_not_aliases(self):
        stdout, events = self.run_program(r"""
#include <iostream>
#include <numeric>
#include <vector>
int main() {
    std::vector<int> values{2, 3, 5};
    int sum = std::accumulate(values.begin(), values.end(), 0);
    auto length = std::distance(values.begin(), values.end());
    std::cout << sum << ' ' << length << '\n';
}
""")
        self.assertEqual(stdout, "10 3\n")
        self.assertEqual([event["value"] for event in events if event["path"] == "values"], [[2, 3, 5]])

    def test_read_only_container_condition_remains_supported(self):
        stdout, events = self.run_program(r"""
#include <iostream>
#include <vector>
int main() {
    std::vector<int> values{1};
    for (int i = 0; i < static_cast<int>(values.size()); ++i)
        values[i] += 1;
    std::cout << values[0] << '\n';
}
""")
        self.assertEqual(stdout, "2\n")
        self.assertEqual([event["value"] for event in events if event["path"] == "values"], [[1], [2]])


if __name__ == "__main__":
    unittest.main()
