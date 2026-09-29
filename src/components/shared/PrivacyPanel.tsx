/**
 * The privacy disclosure: the suite's standard statement, word for word the
 * one in the footer, and the Privacy Policy it rests on.
 *
 * Both come from @ligant/bench-chrome, the source the footer renders from, so
 * the two places this page states its privacy terms cannot disagree, and no
 * Bench Tool can state different ones.
 *
 * THIS TOOL STORES NOTHING IN THE BROWSER (finding B2), which is what lets it
 * carry the statement's "never stored": scripts/check-network.mjs drives a
 * whole session with every storage accessor instrumented and fails the build
 * if the page reads or writes any of them. The one exception is the suite
 * footer's privacy choice (bench-chrome 1.1.0), the visitor's answer to the
 * banner, which check:network holds out with GPC and check:consent tests.
 */
import { PRIVACY_STATEMENT, PRIVACY_URL } from '@ligant/bench-chrome'

export function PrivacyPanel() {
  return (
    <>
      <h3>Privacy</h3>
      <p>{PRIVACY_STATEMENT}</p>
      <p>
        <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
          Privacy Policy
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      </p>
    </>
  )
}
