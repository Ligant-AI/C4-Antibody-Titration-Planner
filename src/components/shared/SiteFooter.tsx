/**
 * What this tool is, who publishes it, and under what terms.
 *
 * The citation is here rather than in the method section because it is the
 * thing a reader needs at the moment they decide to use a figure from this tool
 * in their own work, and that decision is made at the bottom of the page.
 *
 * The address and the email are plain text and a mailto link. Nothing here
 * contacts anything: a mailto is handled by the reader's own mail client and
 * fires no request, so the privacy claim is untouched.
 *
 * THE PRIVACY STATEMENT IS THE SUITE'S STANDARD ONE, word for word the same in
 * every Bench Tool, including its disclosure of Cloudflare Web Analytics. It is
 * not rewritten per tool: a reader moving between tools should read one policy.
 */
import { useState } from 'react'
import {
  APP_VERSION,
  CITATION_DOI,
  DEPLOYED_URL,
  PRIVACY_URL,
  RELEASE_YEAR,
  REPO_URL,
  TOOL_NAME,
} from '../../lib/site'

/**
 * The citation, in three pieces, so what is shown and what is copied cannot
 * differ.
 */
const CITATION_LEAD = `Modi, A.B. (${RELEASE_YEAR}). `
const CITATION_TAIL =
  ` (${APP_VERSION}) [Computer software]. Ligant AI Incorporated. ${DEPLOYED_URL.replace('https://', '')}` +
  (CITATION_DOI !== null ? ` doi:${CITATION_DOI}` : '')

/**
 * One reference, with a control that takes it in a single action.
 *
 * `copied` is set only once the write resolves, not on click: a claim this
 * page makes about itself should be as accurate as every other one on it.
 */
function CitationRow() {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(CITATION_LEAD + TOOL_NAME + CITATION_TAIL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // A browser may refuse clipboard access. The reference is on the page
      // and selectable regardless, so silence is better than an error the
      // reader cannot act on.
    }
  }

  return (
    <div className="footer-citation-row">
      <p>
        {CITATION_LEAD}
        <cite>{TOOL_NAME}</cite>
        {CITATION_TAIL}
      </p>
      <button type="button" onClick={copy} aria-label="Copy the software citation" aria-live="polite">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-prose">
          <p>
            Ligant Bench Tools are free and open source under Apache 2.0, for research and educational use.{' '}
            <strong>Privacy.</strong> Everything you enter into this tool stays on your computer. Calculations run entirely in your browser, and your inputs are never transmitted, stored, or logged. We use Cloudflare Web Analytics to count visits and measure how quickly this page loads, so we can see which tools are used and improve them. It sets no cookie, does not identify you, and never reads what you type.{' '}
            <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
              Privacy Policy
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          </p>
          {REPO_URL && (
            <p>
              Every figure on this page comes from code you can read, download or run yourself, at{' '}
              <a href={REPO_URL}>{REPO_URL.replace('https://', '')}</a>. Clone it and{' '}
              <code>npm run dev</code> for a local copy.
            </p>
          )}
          <p>
            These tools are standalone calculators. Ligant's enterprise platform adds reference
            databases, connected agentic workflows, on-premise language models, and full GxP
            validation. If your lab needs that, please email us{' '}
            <a href="mailto:hello@ligant.ai">hello@ligant.ai</a>.
          </p>
        </div>

        <address className="footer-address">
          <span className="eyebrow">Ligant AI Incorporated</span>
          3675 Market Street
          <br />
          Suite 200
          <br />
          Philadelphia PA 19104
          <br />
          <a href="mailto:hello@ligant.ai">hello@ligant.ai</a>
        </address>
      </div>

      <div className="footer-citation">
        <span className="eyebrow">How to cite</span>
        <p className="footer-citation-note">Cite the software as below.</p>
        <CitationRow />
      </div>

      <p className="footer-licence">
        Licensed under the Apache License, Version 2.0. You may obtain a copy of the License in the{' '}
        <a href="LICENSE">
          <code>LICENSE</code>
        </a>{' '}
        file served with this page and distributed with the source. Unless required by applicable
        law or agreed to in writing, software distributed under the License is distributed on an "AS
        IS" basis, without warranties or conditions of any kind, either express or implied.{' '}
        <strong>Research use only. Not qualified for GxP decision-making.</strong>
      </p>
    </footer>
  )
}
