import unittest

from instrumentation.testcase_parser import parse_testcase, resolve_argument_values


class TestTestcaseParserDeterminism(unittest.TestCase):
    def test_named_inputs_are_stable(self):
        named, positional = parse_testcase("nums=[1,2,3], k=2")
        self.assertEqual(list(named.keys()), ["nums", "k"])
        self.assertEqual(named["nums"], [1, 2, 3])
        self.assertEqual(named["k"], 2)
        self.assertEqual(positional, [])

    def test_rejects_mixed_named_and_positional(self):
        with self.assertRaises(Exception):
            resolve_argument_values(
                ["nums", "k"],
                {"nums": [1, 2, 3]},
                [2],
            )

    def test_rejects_unknown_named_argument(self):
        with self.assertRaises(Exception):
            resolve_argument_values(
                ["nums"],
                {"nums": [1], "k": 2},
                [],
            )

    def test_rejects_extra_positional_arguments(self):
        with self.assertRaises(Exception):
            resolve_argument_values(
                ["nums"],
                {},
                [[1, 2, 3], 2],
            )

    def test_resolves_positional_arguments(self):
        resolved = resolve_argument_values(
            ["nums", "k"],
            {},
            [[1, 2, 3], 2],
        )
        self.assertEqual(resolved, {"nums": [1, 2, 3], "k": 2})


if __name__ == "__main__":
    unittest.main()
