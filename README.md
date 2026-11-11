# Reino de Cuba — DiplomaticaMC

The public site is a static HTML/CSS/JavaScript website. The Cuba residents
directory is built from Towny map markers whose `%nation%` value is exactly
`Cuba`; the page accepts only roster schema version 3 so older, relabelled
Colombia snapshots are never presented as verified Cuban residents.

## Resident roster

The `Sync Cuba roster from map` GitHub Actions workflow runs the offline parser
tests, fetches the map markers, and writes `roster.json`. When the file changes,
the workflow also updates `data/roster.snapshot.json` and commits both files.
The website fetches the root `roster.json` from its own origin and uses the
committed snapshot when that file is unavailable. It also loads a generated
JavaScript copy (`js/roster-data.js`) so the directory works when opened
directly as a local `file://` page, where browsers block fetching local JSON.
The sync workflow keeps all three generated roster files in sync; do not
hand-edit them or fill them with unverified residents.
The current snapshot was synced from the live map on 10 November 2026.

### Importing a permitted map export

If the automated map request is unavailable, a site maintainer can use a
`markers.json` export obtained through an authorized route. Save it in the
project folder and run this from PowerShell:

```powershell
python scripts/sync_roster.py --file .\markers.json
if ($?) { Copy-Item .\roster.json .\data\roster.snapshot.json }
```

The parser includes only markers whose nation field is exactly `Cuba`, and
fails without replacing the roster if the export is malformed or contains no
Cuba towns. Review `roster.json` and its source export before committing or
publishing either roster file. Do not edit the generated resident names by
hand or use an export that you are not authorized to access.

After publishing the site changes, open the repository's **Actions** tab and
run **Sync Cuba roster from map** once with **Run workflow**. The scheduled job
then refreshes the register every five minutes. If the map feed is unavailable
or contains no Cuba towns, the sync fails safely and does not replace the last
working roster.

To run the parser tests locally with Python 3:

```powershell
python -m unittest discover -s scripts -p "test_*.py"
```

## Publish from the local working copy

The working copy used for the Cuba redesign is not itself a Git clone. To
publish it without losing the repository's history:

1. In GitHub Desktop, clone `https://github.com/ueqqq/colombia` and select the
   `colombia-dmc-site-fixes-7d35c` branch.
2. Copy the updated files from this working copy into the cloned repository,
   keeping the same folder structure and preserving its `.git` directory.
3. Review the changed files in GitHub Desktop, commit the redesign, and push
   the branch. Open a pull request if you want to review the changes before
   merging them.
4. Once the changes are on the published branch, run the roster workflow as
   described above so it replaces the old unverified roster snapshots.

Do not copy the `site-backup-*` folder over the active site.