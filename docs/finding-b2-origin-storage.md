# Finding B2: the page kept the declarations in origin storage

| Field | Value |
|---|---|
| URS | C4 v0.6, C4-ST-03, C4-ST-06, C4-NF-07, finding B2 |
| Status | **CLOSED by removal.** Authorised by A.B. as a hotfix, not waiting on the sibling tool |
| Owner | Developer |
| Date | 21 September 2026 |
| Blocks | Nothing. The removal is shipped behind the build and browser gates below |

The tool wrote one key, `c4.state.v1`, holding every declaration on screen
plus the list of fields the reader had confirmed, and read it back on load.
Finding B2 says that behaviour goes. This is the record of what was removed,
what was deliberately kept, and what now stops it coming back.

## Reproduced before it was touched

Driven against the deployed page,
`https://benchtools.ligant.ai/antibody-titration-planner/`, in headless
Chrome, 21 September 2026:

1. Storage cleared, one unrelated key `zz.foreign.key` seeded.
2. `50` typed into `#staining-volume` through React's native setter.
3. Within about a second, `c4.state.v1` appeared, holding the whole form
   object and a `confirmed` array.
4. After a reload the field held `50` again and the words "from your last
   visit" were on the page.
5. The seeded foreign key was neither read nor altered.

So the behaviour was live, reproducible, and disciplined as far as it went.
It was still the wrong behaviour.

## Whether any requirement mandated it

**No requirement in this repository's records asks for retention, and the
requirement most often cited beside it does not.** This was checked before
anything was cut, because a removal that contradicts the specification is
worse than the defect.

C4-ST-03, quoted verbatim in the module that implemented this
(`src/lib/retention.ts`, now `src/lib/suggestions.ts`), reads:

> No input shall persist across a page reload unless its persistence is
> visible on screen.

That is a **condition on persistence, not a mandate to persist**. It was met
before by disclosure, by the "from your last visit" markers and the confirm
controls; it is met now by there being nothing to disclose. A requirement of
the form "not X unless Y" is satisfied by not doing X.

C4-ST-06, recorded at `docs/open-item-09-transport-and-integrity.md` line 40,
rejected `localStorage` as the C1-to-C4 transport on the ground that
"C4-ST-06 says no persistence", and added that it "would also leave a user's
object on a shared machine after they had finished". That is scoped to the
transport mechanism rather than to the form, so it does not by itself govern
this, but the second half of it is the same objection finding B2 makes and
the tool was doing exactly what that row refused to do elsewhere.

**One limitation of this assessment, stated rather than glossed.** The URS is
not in this repository. C4-NF-07 was cited at four call sites as the reason
the structured object carried a `retained` list, and its wording appears
nowhere here, so its intent has been inferred from those four sites. All four
read as *disclosure conditional on retention* rather than as a requirement to
retain. If C4-NF-07 says otherwise in the URS itself, this is the paragraph to
come back to.

## What was removed

| Removed | Where |
|---|---|
| `STORAGE_KEY`, `persist`, `restoreInputs`, `splitStored`, `StoredDocument` | `src/lib/retention.ts`, gone |
| The per-field retention model: `RetainableField`, `RETAINABLE_FIELDS`, `PANEL_FIELDS`, `heldOnRestore`, `retainedMarks`, `confirmFields`, `confirmedToList`, `confirmedFromList`, `anyRetained` | same |
| `RETAINED_MARKER_LABEL`, `RETAINED_MARKER_TOOLTIP`, `RETENTION_PANEL_NOTE`, `RETENTION_STATEMENT` | same |
| `loadForm`, the `held` and `confirmed` state, the persisting effect, the `Retained` component and its 19 call sites, `clearStorage` | `src/App.tsx` |
| The `retained` badge and the `note` slot | `src/components/DeclarationPanel.tsx` |
| The retention convention statement from the method panel | `src/components/Method.tsx` |
| The stored-key list and the "Clear stored data" button | `src/components/shared/PrivacyPanel.tsx` |
| `hasContent`, which existed only to decide whether to write | `src/lib/form.ts` |
| `SeriesInputs.retainedFields` | `src/lib/normalise.ts` |
| `declarations.retained` | `src/lib/serialise.ts` |
| `.retained-marker` and `.retention-note` | `src/styles.css` |
| The second C4-NF-03 figure in the constants register, measured against a restored document at 208px, withdrawn rather than left standing for a state the page cannot reach | `src/lib/flags.ts` |
| `src/lib/retention.test.ts`, 10 tests, all of them about a feature that no longer exists | deleted |

`src/lib/retention.ts` became `src/lib/suggestions.ts`. What was left in it
after the cut was never about storage: the suggestion markers and the confirm
control, which are C4-SR-01, C4-SR-05 and C4-UN-01. A file called
`retention.ts` containing no retention is a worse thing to leave behind than a
rename.

## What was deliberately kept

1. **"Confirm the suggested values" stays.** The control had two jobs. One was
   standing behind values carried over from a previous visit, and that job is
   gone. The other is standing behind values the TOOL pre-filled, the
   pre-selected units and the suggested 2 µL pipetting minimum, which C4-SR-05
   and R16 require the output to distinguish from a reader's own declaration.
   Removing the whole control would have taken the second job with the first
   and broken a requirement in the course of fixing a defect. Only the
   retained clause was cut from `panelHasUnconfirmed`, and `CONFIRM_TOOLTIP`
   stopped promising to clear a "carried over" mark it can no longer meet.
2. **`reconcileTopPoint` and the "cleared, needs re-entry" marker stay.**
   C4-ST-04, and interactive: a stock declaration changing under an entered
   top point is still reachable by editing, which was always the main path.
   Only its invocation from the load path went, because there is no load path.
3. **Two uses of the word "persisted" stay, because they are a different
   word.** `reimpl/fixtures.json` line 173 and `src/lib/determinism.test.ts`
   line 152 both say "the persisted input" or "the retained input" about the
   top point surviving a change of stock declaration WITHIN a session. That is
   C4-SR-01, the entered value being the thing recomputed from, and has nothing
   to do with storage. Checked and left alone; noted here because a reviewer
   grepping for "persist" will find them.
4. **The suggestion marker's styling stays.** It shared every CSS rule with
   `.retained-marker`. The selectors were split rather than deleted, which is
   the failure mode a careless removal would have had: a marker still rendered
   and silently unstyled.

## The structured object, and a version bump the owner may want to reverse

`declarations.retained` is **gone rather than pinned at `[]`**. An object that
carries a key for a distinction the tool can no longer make invites a consumer
to read meaning into an empty list.

`SCHEMA_VERSION` therefore goes **1.1.0 to 2.0.0**. Removal is the breaking
direction: a consumer written against 1.1.0 may look for that key. 1.1.0 was
itself minted six days ago for the addition of this same field, and no
consumer of it is known to exist, C1 does not read this object (open item 8,
the two schemas coexist and C1 does not migrate) and C3 is not built (open
item 9).

**This is the one decision in this change that is the owner's rather than the
developer's.** The object is now shaped exactly as 1.0.0 was, so reverting the
version to 1.0.0 is defensible and was considered. It was rejected because two
artefacts a week apart would then be indistinguishable by version, and the
version is the only thing on the object recording that this tool no longer
makes the retained/entered distinction at all. If C4-NF-07 or an unbuilt
consumer argues otherwise, change the number; the removal itself does not
depend on it.

## What stops it coming back

`scripts/check-network.mjs` wraps `getItem`, `setItem`, `removeItem`, `clear`
and `key` on `Storage.prototype` in an init script that runs **before any page
script on every navigation**, seeds one foreign key through the saved original,
then drives a full session: every declaration entered, a panel confirmed, the
page reloaded, and more typing on the fresh load. It fails the build if the
count of recorded calls is anything but zero.

The instrumentation is the point. A count of surviving keys at the end proves
only that nothing SURVIVED; it cannot see a key written and removed, and it
cannot see a read at all. A tool that reads a key it did not write is still a
tool looking at what a shared machine holds.

**Confirmed capable of failing**, in the idiom this project already uses for
its tolerances. Two defects were inserted and the gate caught both:

| Inserted | Caught as |
|---|---|
| `localStorage.setItem('c4.state.v1', ...)` on every form change | 25 calls on load, 3 across the session, and `c4.state.v1` present at the end beside the seeded key |
| `localStorage.getItem('zz.foreign.key')` once on mount, leaving no trace | 1 call on load, 1 across the session, and "the page touched zz.foreign.key, a key belonging to something else" |

The second is the one a survivor count cannot detect, which is why it was the
one worth inserting.

`sessionStorage`, `document.cookie` and `indexedDB.databases()` are checked
too, so the removal cannot be seen to have pushed the state sideways.

## Acceptance test 17

The page has changed, so the deployed-address claim lapses until it is re-run.
`NETWORK_CLAIM_VERIFIED` is left set, which is the practice this project
already follows across a page change: the flag is gated on a written record
existing, the two recorded passes still exist, and the next run after this
deploys is appended to
`docs/open-item-17-deployed-network-verification.md` in the usual way. The
summary line that record quotes has changed shape with this work, and the note
appended there says so.

**This one is the owner's to decide, and it is a second decision, not the
same one as the schema bump.** Every precedent for leaving the flag set across
a page change was a deploy-then-verify inside the same working session, where
the gap was hours. This is a hotfix on a branch, and if it sits unmerged or
undeployed the footer goes on saying "confirmed against the page as served"
about a page nobody is serving. The developer's reading is that the flag
should stay set while this moves promptly to deploy, and should be unset if it
is going to wait. That choice has not been made here.
