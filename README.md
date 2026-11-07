# Prediction Journal

A personal prediction journal. Each entry is a Markdown file with YAML frontmatter in `entries/`. The site renders each entry as a swim-lane timeline (World / Circle / Me / What if) with decision forks, adoption lag and calibration.

## Add an entry
1. Copy `templates/prediction.md` to `entries/NNN-short-name.md`.
2. Fill the frontmatter (`events`, `forks`, `confidence`, `score`, `review_on`) and the body.
3. Commit and push. The Pages workflow rebuilds `entries/manifest.json` automatically.

## Obsidian
- Clone this repo and open it as a vault, or use **Export vault (.zip)** on the site.
- Settings → Core plugins → Templates → template folder `templates`. Then *Templates: Insert template* → `prediction`.

## Private entries
Put anything sensitive (named people, employer details) in `entries/private/`. That folder is gitignored, so it stays in your local vault and never reaches the public site. For local preview, list it in `entries/manifest.json` as `private/<file>.md`.

## Local preview
`python3 -m http.server` in this folder, then open http://localhost:8000. (Update `entries/manifest.json` by hand for local preview.)

## Frontmatter reference
| Key | Values |
|---|---|
| `lane` | `world`, `circle`, `me` |
| `approx` | `true` draws a hollow dot |
| `score` | `open`, `hit`, `partial`, `miss` |
| `confidence` | 0-100 |
| `forks[]` | `date`, `question`, `taken`, `alt`, `alt_outcome` |
