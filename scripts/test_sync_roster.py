import unittest

from sync_roster import build_roster, find_nation_towns, parse_town


class RosterParserTests(unittest.TestCase):
    def test_parse_town_deduplicates_and_marks_map_mayor(self):
        town = parse_town({
            "meta": {
                "%town%": "Santa_Clara",
                "%nation%": "Cuba",
                "%mayor%": "TestMayor",
                "%residents%": "ResidentA, TestMayor, residenta, ResidentB",
            }
        })

        self.assertEqual(town["name"], "Santa Clara")
        self.assertEqual(town["mayor"], "TestMayor")
        self.assertEqual(
            [resident["username"] for resident in town["residents"]],
            ["TestMayor", "ResidentA", "ResidentB"],
        )

    def test_nation_filter_is_exact_and_duplicate_town_markers_merge(self):
        markers = {
            "layers": [{
                "id": "towny_claims",
                "markers": [
                    {"meta": {"%town%": "Santa_Clara", "%nation%": "Cuba",
                              "%mayor%": "TestMayor", "%residents%": "TestMayor, ResidentA"}},
                    {"meta": {"%town%": "Santa Clara", "%nation%": "Cuba",
                              "%mayor%": "", "%residents%": "ResidentA, ResidentB"}},
                    {"meta": {"%town%": "Havana", "%nation%": "Cuba Republic",
                              "%mayor%": "TestForeign", "%residents%": "TestForeign"}},
                ],
            }]
        }

        towns = find_nation_towns(markers, "Cuba")

        self.assertEqual(len(towns), 1)
        self.assertEqual(towns[0]["name"], "Santa Clara")
        self.assertEqual(towns[0]["mayor"], "TestMayor")
        self.assertEqual(
            [resident["username"] for resident in towns[0]["residents"]],
            ["TestMayor", "ResidentA", "ResidentB"],
        )

    def test_roster_counts_match_the_resident_arrays(self):
        towns = find_nation_towns({
            "layers": [{
                "id": "towny_claims",
                "markers": [{
                    "meta": {"%town%": "Santa_Clara", "%nation%": "Cuba",
                             "%mayor%": "TestMayor", "%residents%": "ResidentA"}
                }],
            }]
        }, "Cuba")

        roster = build_roster(towns, "Cuba")

        self.assertEqual(roster["schemaVersion"], 3)
        self.assertEqual(roster["townCount"], 1)
        self.assertEqual(roster["residentCount"], 2)
        self.assertEqual(roster["towns"][0]["mayor"], "TestMayor")


if __name__ == "__main__":
    unittest.main()
