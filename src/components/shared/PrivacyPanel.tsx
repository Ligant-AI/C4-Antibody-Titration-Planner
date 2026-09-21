/**
 * The privacy disclosure.
 *
 * Shared across the bench tools rather than duplicated, because privacy is the
 * product's central claim. Two copies would drift, and a tool that quietly
 * lacked this section would undercut the claim everywhere else.
 *
 * THIS TOOL STORES NOTHING IN THE BROWSER. It used to write one key holding
 * the declarations on screen, and finding B2 removed it: the declarations now
 * live in the tab and nowhere else. scripts/check-network.mjs drives a whole
 * session in a real browser with every storage accessor instrumented, and
 * fails the build if the page reads or writes any of them, so the sentence
 * below cannot quietly stop being true.
 *
 * This component is shared across the bench tools. C4 is the first to write
 * nothing at all, so its copy has diverged from the sibling tools' and the
 * `storageKeys` and `onClearStorage` props are gone with the feature they
 * described.
 */
import { NETWORK_CLAIM_VERIFIED } from '../../lib/site'

export function PrivacyPanel() {
  return (
    <>
      <h3>Privacy</h3>
      <p>
        Everything on this page is computed in your browser. Nothing you enter is transmitted, and
        the page contacts no third party at all: the typefaces are served from this origin, there is
        no analytics script, and the code contains no network call of any kind.
      </p>
      <p>
        {NETWORK_CLAIM_VERIFIED ? (
          <>
            That has been checked against this deployed address in a real browser, with the network
            monitor started before the page loaded.
          </>
        ) : (
          <>
            That is checked two ways on every build: a scan that fails the build if any external
            address appears in the source or the bundle, and a real browser driven over the built
            artefact that fails if the page requests anything from another origin. Both checks are
            on the build. What no check here can see is anything a host inserts into a response
            afterwards, which is a real failure mode rather than a hypothetical one. Whoever deploys
            this is the only party positioned to check for that, and this page does not claim it has
            been done.
          </>
        )}
      </p>
      <p>
        Nothing is stored in this browser either. The tool writes no cookie and no site data of any
        kind, so what you enter lives in this tab for as long as the tab does and is gone when you
        close or reload it. There is nothing to clear, and a reload starts an empty page rather than
        returning declarations you made under conditions that may since have changed.
      </p>
    </>
  )
}
