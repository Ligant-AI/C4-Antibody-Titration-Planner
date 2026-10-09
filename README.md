# Antibody Titration Planner

Plans an antibody titration series for flow cytometry: the concentration at each
point, in every form the bench and the method record require, for the staining
volume and cell number you actually use.

A free bench tool from [Ligant](https://ligant.ai), part of Ligant Bench Tools.
It runs entirely in your browser, and nothing you enter into the planner is
transmitted or stored.

**Use it at benchtools.ligant.ai/antibody-titration-planner/**

## Why this exists

How much antibody binds depends on the free antibody concentration and, where
the antigen sink is significant, on the amount of antibody available per cell.
Which of the two governs depends on antigen density, affinity and cell number,
none of which a datasheet states.

A vendor recommendation of "5 µL per test" carries neither quantity unless the
volume and the cell number of that test are also stated, and vendors do not
always state them. A lab that titrates in 100 µL and stains in 50 µL has doubled
the concentration and will not see it, because the volume pipetted is identical.
A lab that titrates at 1 × 10⁶ cells and stains at 5 × 10⁶ has cut the amount per
cell fivefold and will not see that either.

A spreadsheet returns a clean list of volumes in both cases and records none of
the context that makes them wrong. This tool requires the staining volume,
requires the cell number, requires the basis of the vendor recommendation, and
puts all three in the derivation.

## What it does not do

It determines what the series should be. It does not prepare it, does not
analyse the resulting data, does not choose the optimal point, and **does not
determine whether any point saturates the target**. A vendor recommendation is a
concentration chosen for a stated assay, frequently for separation; it does not
establish saturation and is not treated as though it did.

The page lists, in full, the fourteen classes of failure the tool cannot detect.
That list is a requirement of the specification rather than a disclaimer, and it
is tested for on every build.

## Method

Five declarations, none of them defaulted or inferred: the stock concentration
and what its mass is the mass of, where that concentration came from, the basis
of any vendor recommendation, the staining volume, and the cell number. Plus the
minimum volume your pipette delivers reliably, which is pre-filled at 2 µL as a
visibly marked suggestion rather than as a standard.

From those, each point is reported in six forms: the volume of stock per test,
the mass per test, the final concentration in the staining volume, the dilution
factor from stock, the mass per 10⁶ cells, and the molar concentration where a
molecular weight has been imported from the Molarity Converter.

Two conventions are stated on the page because each is read both ways at a
bench, and each changes every number below it:

- **Staining volume is the final volume of the stain, including the antibody**
  and every other reagent added.
- **Dilution factor is final volume divided by stock volume.** A dilution of
  1 in 100 is a factor of 100.

### The arithmetic

Every quantity is converted to a base unit exactly once, at entry, and the unit
factors are folded into one constant per reported form, so nothing is normalised
twice. Rounding is applied at display and nowhere else: the unrounded value of
every reported quantity is in the structured result.

Each point is computed from the top point and its integer index as
`top / f^(i-1)`, with the power formed by exponentiation by squaring and applied
as a single division. `Math.pow` is not used, and neither is repeated
multiplication from the preceding point. The ratio-test tolerance, 6 ULP, is an
analytic bound over every rounding operation in the worst consecutive pair of a
12-point series, not an empirical sample maximum: `Math.pow`'s disagreement
with this method is engine-dependent, real and non-zero at a factor of 1.7, and
of the same order as that bound wherever it has been measured.

Displayed values are rounded to three significant figures, **half away from
zero, applied to the exact stored binary value**. A two-fold series from a round
top point lands on genuine binary ties, so the rule has to be stated rather than
inherited from a platform primitive. The implementation computes the exact
decimal expansion of the double rather than calling `toPrecision`, because
`toPrecision` cannot tell you whether a value was really halfway: by the time
you can see its output it has already rounded.

## Reproducibility

Same inputs, same outputs. Nothing reads a clock or a random source.

- 272 tests, including the reference case of the specification asserted value by
  value, the negative control asserted to raise no flags at all, and every
  rejection and flag condition.
- An **independent Python reimplementation** in `reimpl/`, written from the
  specification rather than translated from the TypeScript, run over the same
  fixture set and compared on unrounded values. Observed agreement: exact, 0
  ULP, over more than 200 values.
- A round-trip invariance test and a consecutive-ratio test, each with its
  tolerance derived by measurement and each **confirmed capable of failing** by
  inserting defects and showing they are detected. The sensitivity of both is
  bounded on both sides, so what the tests do not catch is written down as well
  as what they do.

## Privacy

The page carries the standard privacy statement every Ligant Bench Tool shares:

> Everything you enter into this calculator stays on your computer.
> Calculations run entirely in your browser, and your inputs are never
> transmitted, stored, or logged. The newsletter signup at the foot of this page is separate: only
> an email address you choose to submit there is sent to us. We use Cloudflare
> Web Analytics to count visits and measure how quickly this page loads, so we
> can see which tools are used and improve them. It sets no cookie, does not
> identify you, and never reads what you type. If you allow it in the banner, we
> also use Google Analytics, which sets cookies and records which pages you
> visit; it never receives anything you type into this tool.

The full terms are in the [Privacy Policy](https://ligant.ai/privacy). The
typefaces are self-hosted, and the tool's own source contains no network call of
any kind. The suite footer (`@ligant/bench-chrome`) shows the privacy banner and,
only after Allow, loads Google Analytics; it stores only your answer, in one
`localStorage` entry, `ligant_privacy_choice`.

The footer also opens with a newsletter signup, which is separate from the
planner. On the hosted page it asks for an email address and a consent tick.
Nothing is sent until you submit it; then the email address and the consent,
and nothing you entered into the planner, go in one request to the site's own
`/api/subscribe`, which forwards them to ligant.ai to email you a confirmation
link. Nothing joins the list until you confirm. A copy you run yourself shows a
link to the signup on ligant.ai instead of the form. See the
[Privacy Policy](https://ligant.ai/privacy#newsletter).

Two checks enforce this on every build. `check:privacy` fails if any external
address appears in the source or in the built bundle. `check:network` drives the
built page in a real browser and fails if it requests anything from another
origin, or reads or writes browser storage; requests are recorded rather than
blocked, so what it proves is that the code never tries. The content security
policy allows this origin, the Cloudflare Web Analytics beacon script, which the
host inserts into the served page, the newsletter endpoint `/api/subscribe`, and
the Google Analytics hosts the banner loads after Allow, and nothing else.
`check:network` also fails if the newsletter form is missing or if anything is
sent to `/api/subscribe` while the page is loaded and used. `check:consent`
drives the banner in a real browser: nothing Google or stored before Allow, and
a sentinel typed into every field of the planner never reaches any host. It then
checks the newsletter signup on its own: nothing sent before submit, and one
request carrying only the email address, the consent and an empty spam-trap
field. `check:network` runs with a Global Privacy Control
signal, so the banner stays out of its storage accounting.

## Running it

**What you need:** Node 20 or newer, and npm. Python 3 for the reimplementation
comparison.

```sh
npm install
npm run dev            # development server
npm run build          # static site to dist/
npm run build:single   # one self-contained HTML file, no server needed
npm test               # unit tests and the reimplementation comparison
npm run verify         # style, citation, types, tests, build, privacy, network
```

`npm run verify` runs everything. A change that breaks the privacy guarantee
fails the build.

`npm run check:network` and `npm run verify` drive a real browser, so install it
once first:

```sh
npx playwright install chromium
```

Nothing else needs it. `npm run dev`, `npm run build` and `npm test` do not.

### Verifying a deployment

A local server over `dist/` does not exercise the host or its CDN, so the
runtime check has a second mode, against the page as served:

```sh
node scripts/check-network.mjs https://benchtools.ligant.ai/antibody-titration-planner/
```

It allows exactly the disclosed Cloudflare Web Analytics beacon script and fails
on any other request to another origin. (It sends GPC, so Google Analytics never
loads in it; the banner's own deployed check is bench-chrome's
`check-consent.mjs --live`.) Re-run it after every deploy, and record
the pass in `docs/open-item-17-deployed-network-verification.md`.

## Status and limitations

Built against **C4 URS v0.6**. The specification's open items that belong to
this repository are written up in `docs/`:

| Item | State |
|---|---|
| 6, the derived tolerances | Three analytic bounds derived and enforced. **Open**, pending sign-off on the derivation record |
| 7, the one-screen requirement | **Superseded at v0.5.** Restated as a property (a series point is never read apart from its context) and MET at the reference viewport, measured against a four-flag declaration set, not only the one-flag reference case |
| 8, the shared result object | **Escalated.** It cannot express a series; C1 does not migrate, the two schemas coexist |
| 9, the transport and its integrity check | Designed and built |
| 16, the shipped calculator's conformance | Tie-breaking direction measured, conforms. Displayed precision does not match C4's for most of its range |
| 17, the deployed-address verification | **Passed and recorded**, 16 September 2026, and twice since after the page changed. **Lapsed** pending a re-run after finding B2 deploys. Re-run after every deploy |
| B2, the origin storage | **Closed by removal**, 21 September 2026. The page reads and writes no browser storage, gated in a real browser |

One limitation is worth knowing before you use this:

**A series with points below your pipetting minimum needs an intermediate
working stock**, and the tool that plans those does not exist yet. Most real
series will raise that flag on their lowest points. Each flagged point is listed
with its dilution factor from stock so the intermediate can be designed against
it by hand in the meantime.

## How to cite

> Modi, A.B. (2026). Antibody Titration Planner (v0.1.0) [Computer software].
> Ligant AI Incorporated. benchtools.ligant.ai/antibody-titration-planner/
> doi:10.5281/zenodo.22773732

The footer of the tool carries this same line, generated from the same
constants the build uses, with a one-click copy button, so the page,
`CITATION.cff` and this README cannot disagree.

The DOI above is version-specific, archived by Zenodo for the v0.1.0 tag. The
concept DOI, [10.5281/zenodo.22773731](https://doi.org/10.5281/zenodo.22773731),
always resolves to whichever version is newest; cite the version-specific one
to name the exact artefact these results came from.

## Licence

Apache 2.0, for its express patent grant. A copy is served with the page and
distributed with the source.

**Research use only. Not qualified for GxP decision-making.**
