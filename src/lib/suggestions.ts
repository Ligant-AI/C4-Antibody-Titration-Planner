/**
 * C4-SR-01, C4-SR-05 and C4-UN-01: values the TOOL chose, and how a reader
 * stands behind one.
 *
 * A pre-filled pipetting minimum and a pre-selected unit are on the behaviour
 * path for as long as nobody changes them, so the page says which values it
 * proposed rather than presenting them as declarations the reader made. The
 * marker says so beside the field; "Confirm the suggested values" is how the
 * reader converts a suggestion into a choice, and the output then records the
 * choice rather than the guess.
 *
 * WHAT USED TO BE HERE. This file was `retention.ts` and held the origin
 * storage feature: a `c4.state.v1` key holding the declarations, a per-field
 * "from your last visit" marker, and a confirmation set persisted beside the
 * form. Finding B2 removed all of it, and the file kept only the half that was
 * never about storage. See `docs/finding-b2-origin-storage.md`. C4-ST-03, "no
 * input shall persist across a page reload unless its persistence is visible
 * on screen", is now met by there being nothing to persist.
 *
 * Confirmation is SESSION STATE and deliberately nothing more. It lives in
 * `FormState`, nothing writes it anywhere, and it is gone on reload, which is
 * the correct lifetime for it: the suggestion it answers is itself re-proposed
 * on every fresh load.
 */

/**
 * What "Confirm these values" is about to do, said plainly.
 *
 * The control accepts whatever the panel currently holds, INCLUDING anything
 * the tool filled in that the reader has not looked at. That is the whole
 * risk: a stock concentration entered in µg/mL against a unit still sitting
 * on the mg/mL suggestion is out by a thousand, and a confirmation that
 * quietly swept it up would have recorded the tool's guess as the reader's
 * own declaration on the output and in the notebook copy.
 */
export const CONFIRM_TOOLTIP =
  'Records these values as your own choice, including any the tool suggested and you have not ' +
  'changed. The output stops marking them as suggested.'

/**
 * The button's label.
 *
 * `CONFIRM_LABEL_DEFAULT` is the honest label for a panel with no outstanding
 * suggestion. With the retained markers gone the control is offered only where
 * a suggestion IS outstanding, so this label is still COMPUTED for panels 2
 * and 4, which hold no suggestion, and never rendered: their `onConfirm` is
 * undefined, so the button they would label does not exist. Kept as the
 * explicit default rather than leaving the label to an invariant a later
 * panel could quietly break.
 */
export const CONFIRM_LABEL_DEFAULT = 'Confirm these values'
export const CONFIRM_LABEL_SUGGESTED_UNIT = 'Confirm the suggested unit'
export const CONFIRM_LABEL_SUGGESTED_VALUES = 'Confirm the suggested values'

/** Shown beside a value the tool filled in rather than the reader choosing. */
export const SUGGESTION_MARKER_LABEL = 'suggested, not chosen'
export const SUGGESTION_MARKER_TOOLTIP =
  'This value was filled in by the tool as a starting point, not chosen by you. Change it or leave ' +
  'it. The output records which of the two it was.'
