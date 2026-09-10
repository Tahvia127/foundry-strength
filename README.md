# Foundry — Strength & Conditioning

A gym site built around the two things that actually sell memberships: the schedule and the price.

**Status:** unpublished demo. Not on GitHub Pages, not linked from the studio site.
**Built by:** Framework Studio.

---

## What this one proves

Recurring-revenue businesses live or die on two screens. This build takes both seriously.

**A real weekly schedule.** Seven days, twenty-four sessions, generated from `data/schedule.json`. Filter by class and the grid narrows, the count updates, and any day with nothing left says so rather than showing an empty box. Spots are colour-coded three ways: open, three or fewer left, and full.

**Pricing that does the arithmetic for you.** A monthly/annual toggle recalculates every tier and prints the actual annual saving in dollars, not a vague "save 15%". The drop-in rate deliberately does *not* discount, because a per-class price has no annual equivalent — a detail most pricing toggles get wrong.

**Honest copy in the pricing section.** It tells visitors that most people overbuy and that the eight-a-month plan is cheaper if they are realistic about twice a week. Gyms that say this convert fewer members and keep them far longer.

## How it works

```
data/site.json        ─┐
data/classes.json     ─┤─> build.mjs ─> index.html
data/schedule.json    ─┤
data/memberships.json ─┘
```

`build.mjs` cross-checks the schedule against the class list and **exits non-zero** if a session references a class that does not exist, so a typo cannot ship a blank session card.

Zero dependencies.

## Repository layout

```
data/schedule.json     One week. Edit spots here or push them from the booking system.
data/classes.json      Class types, levels, durations, descriptions.
data/memberships.json  Tiers, inclusions, annual discount, terms.
data/site.json         Contact, hours, capacity, demo notice.
build.mjs              Renders and validates. No dependencies.
index.html             Generated. Do not edit by hand.
```

## Running it

```bash
node build.mjs
python3 -m http.server 8000
```

## Design notes

- **Type:** Anton for display, Inter for body and UI.
- **Color:** bone `#F3F2EE`, ink `#141414`, flame `#BE4019`. All text pairings clear WCAG AA; flame was darkened from `#C4441C`, which sat at 4.47:1 on bone and missed by a hair.
- **Spot badges** carry their state in text as well as colour, so "Full" is readable without seeing the grey.

## Before this goes to a real client

1. Wire the schedule to the gym's booking system. Mindbody, Wodify and Momence all expose a class list; `data/schedule.json` is the shape to map onto. Until then the counts are static.
2. Point the booking buttons at that system's flow.
3. Replace the photography with the gym's own. Placeholders are Unsplash, under the Unsplash License.
4. Set `demo.show` to `false` in `data/site.json`.

## A note on the gym

Foundry is fictional, as are the coaches' first names, the address and the spot counts. There are no coach photographs, because attaching invented names to photographs of real people would misrepresent them.
