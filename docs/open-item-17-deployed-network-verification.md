# Open item 18 / acceptance test 17: the deployed-address network verification record

| Field | Value |
|---|---|
| URS | C4-NF-01, acceptance test 17 |
| Status | **PASSED, recorded** |
| Owner | Developer |
| Date | 16 September 2026 |

C4-NF-01 is a claim about the page as SERVED, not about the build artefact: a
local server over `dist/` does not exercise the host or its CDN, and what a
host inserts into a response afterwards is a real failure mode, not a
hypothetical one. Acceptance test 17 is the only thing that establishes it,
and this file is that record, kept in the idiom this project's other open
items use, rather than left as a claim with nothing behind it.

**This record exists because `scripts/check-network.mjs` requires it before
`NETWORK_CLAIM_VERIFIED` may be set (open item 18).** A local run cannot
itself establish the deployed-address claim, and does not get to decide the
flag is fine on its own say-so; what it can check, exactly as well as a
deployed run can, is whether a record like this one backs the flag.

## The run

```
node scripts/check-network.mjs https://benchtools.ligant.ai/antibody-titration-planner/
```

Driven against the actual address users reach, through the router, not
against the raw `*.pages.dev` origin the Pages project also serves. Monitoring
(`page.on('request', ...)`) was registered before `page.goto()`, so no request
issued during navigation or first paint could have gone uncounted.

Output:

```
Network check passed against the deployed address, at https://benchtools.ligant.ai/antibody-titration-planner/.
The page requested nothing from any origin but its own. Both self-hosted typefaces loaded.
Every storage key written is disclosed on the page, nothing survives a reload unmarked, and
clearing stored data removes the key rather than rewriting it empty. The reference case of
acceptance 1 renders the values URS section 16 states, C4-FL-03 names its points and marks
their rows, and the failure classes, the constants register and the three convention
statements are all on the page.
C4-NF-03 at the reference viewport (1366 x 650), four-flag fixture: MET, under window scroll, at all 13 of acceptance 25's positions where a row was in view, with every flag summary collapsed and again with every one expanded.
ACCEPTANCE TEST 17: PASSED, at https://benchtools.ligant.ai/antibody-titration-planner/, 2026-09-16T14:54:09.575Z.
```

## Re-run, 16 September 2026, after the input-guidance rework

Re-run against the same address after the guidance tooltips and the state
markers shipped, because acceptance 17 is a claim about the page as served
and that page changed:

```
ACCEPTANCE TEST 17: PASSED, at https://benchtools.ligant.ai/antibody-titration-planner/, 2026-09-16T15:36:53.126Z.
```

The same run carried acceptance T1 to T12 of the input-guidance instruction,
and both C4-NF-03 measurements: the four-flag fixture in each flag expansion
state, and a restored document with every declaration marked as carried over
(sticky block 208 px against 187 px unmarked, MET at all thirteen positions).

## Re-run, 17 September 2026, the closing deploy

Re-run after the four closing text corrections (URS version, the C4-HI-05
rejection message, the "Confirm these values" label and tooltip, and the
final-concentration vendor basis in the declaration line). Acceptance 17 is a
claim about the page as served, so a changed page needs a fresh run:

```
ACCEPTANCE TEST 17: PASSED, at https://benchtools.ligant.ai/antibody-titration-planner/, 2026-09-17T16:40:15.054Z.
```

The same run carried acceptance T1 to T12 of the input-guidance instruction
and both C4-NF-03 measurements, unchanged: the four-flag fixture in each flag
expansion state, and a restored document with every declaration marked as
carried over, 208 px at the reference viewport.

**The bot-challenge is gone.** A bare `curl` of the deployed address returned
200 rather than the 403 that blocked every earlier attempt, against a skip
rule scoped to `benchtools.ligant.ai` created 16 September. Both this run and
the plain request went through unchallenged.

## Re-run, 17 September 2026, after the sticky-release fix

The declaration block was staying pinned roughly 300px after the series
table had left the viewport. Fixed by scoping the sticky element's
containing block to the table it describes, and the same run carries the new
assertion that the block RELEASES once there is no point left to read, which
acceptance 25 had never checked:

```
ACCEPTANCE TEST 17: PASSED, at https://benchtools.ligant.ai/antibody-titration-planner/, 2026-09-17T16:55:28.241Z.
```

## Lapsed, 21 September 2026: finding B2 changed the page

Not a re-run. A note that one is owed.

Finding B2 removed the origin storage (`docs/finding-b2-origin-storage.md`),
which changes the page as served, so acceptance 17 lapses on its own terms
until it is run against the deployed address again. Deploy, then:

```
node scripts/check-network.mjs https://benchtools.ligant.ai/antibody-titration-planner/
```

`NETWORK_CLAIM_VERIFIED` is left set. What gates that flag is this record, and
the two passes above are unaltered facts about the dates they carry; unsetting
it would change the footer's wording on the strength of a change that has not
been deployed yet. This is the same posture the 16 and 17 September entries
were made under.

**Two things about the next run's output will differ from the blocks above,
and neither is a regression.** The storage sentence, which read "Every storage
key written is disclosed on the page, nothing survives a reload unmarked, and
clearing stored data removes the key rather than rewriting it empty", now
reads that the page read and wrote no browser storage at all across a full
session and left a seeded foreign key untouched. And the second C4-NF-03
measurement, the one taken against "a restored document with every declaration
marked as carried over" at 208 px, is gone: no document can be restored, so
there is no such state to measure. The four-flag measurement is unchanged and
is still taken in both flag-expansion states.

## Context: the standing Cloudflare bot-challenge

For most of this project's build, `benchtools.ligant.ai` and its subpaths
returned a Cloudflare bot-challenge ("Just a moment...", HTTP 403) to both
`curl` and this script's real-browser requests, confirmed present on sibling
Ligant Bench Tools too and therefore a zone-level Cloudflare setting rather
than anything specific to this deployment. That blocker cleared between the
previous check (403, earlier the same day) and this run (200, then a full
pass under a real browser). Nothing in this codebase changed that; it is
recorded here because it is what made this run possible, not as something
this project fixed.

## What this does not establish

Acceptance 17 is a snapshot, taken once, against the address as it responded
at the time above. It does not establish that no future deploy, no future
Cloudflare configuration change, and no future host-side injection will alter
what is served; C4-NF-01's own statement on the page is careful to say
"has been verified", not "is guaranteed to remain".

## Superseded, 29 September 2026

The passes above established that the served page requested nothing from any
other origin, and the page said so ("no third-party code runs on this page,
confirmed against the page as served"), gated on `NETWORK_CLAIM_VERIFIED`.

That is no longer the claim. The suite now carries one standard privacy
statement, which discloses Cloudflare Web Analytics: a beacon script the host
inserts into the served page to count visits and page-load time. The page's
content security policy allows exactly that script and nothing else, the
in-page Privacy section and the footer carry the standard statement, and
`NETWORK_CLAIM_VERIFIED` and the gate that read this record are removed.

A deployed run (`node scripts/check-network.mjs <address>`) now allows exactly
the beacon script and fails on any other request to another origin. The
records above stand as what was true when they were made.

## Google Analytics after Allow, 29 September 2026 (22:39 UTC)

From `@ligant/bench-chrome` 1.1.0 the suite footer asks, in a banner, before
Google Analytics loads. Deployed commit `b545573`, at
https://benchtools.ligant.ai/antibody-titration-planner/.

- `node scripts/check-network.mjs <address>` (which sends a Global Privacy
  Control signal, so the banner neither shows nor touches storage): **pass**.
  The only request to another origin was the Cloudflare Web Analytics beacon
  script. Finding B2: 0 storage calls in a full session.
- bench-chrome `scripts/check-consent.mjs <address>`: **pass**. First load:
  banner shown, no Google request, no cookie, no storage. A sentinel typed into
  all 7 fields before and after Allow, searched in plain, URL-encoded, base64
  and base64url form in every request URL and body: **0 hits**. After Allow the
  tag loaded and hits were sent (and aborted by the check) to
  `www.google-analytics.com/g/collect` and `www.google.com/g/collect`; GA
  cookies `_ga` and `_ga_9V1GYE3KRX` host-only. Withdrawal deleted them and the
  next load made no Google request. GPC: no banner, no Google.

Analytics endpoints observed: `static.cloudflareinsights.com` (beacon script),
and only after Allow `www.googletagmanager.com`, `www.google-analytics.com`
and `www.google.com`.
