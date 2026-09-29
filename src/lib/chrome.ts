/**
 * What this tool supplies to the suite's shared header and footer
 * (@ligant/bench-chrome). Everything else in them is the suite's, written once.
 * The citation is in three pieces, so what is shown and what is copied cannot
 * differ.
 */
import type { FooterOptions, HeaderOptions } from '@ligant/bench-chrome'
import { SCOPE_STATEMENT } from './flags'
import { APP_VERSION, CITATION_DOI, DEPLOYED_URL, RELEASE_YEAR, REPO_URL, TOOL_NAME, TOOL_PATH } from './site'

export const HEADER: HeaderOptions = {
  path: TOOL_PATH,
  title: TOOL_NAME,
  description:
    'Plans an antibody titration series for flow cytometry: the concentration at each point, in ' +
    'every form the bench and the method record require, for the staining volume and cell number ' +
    'you declare. Every value is computed deterministically by arithmetic you can read. No model ' +
    'and no inference is applied to any reported number.',
}

export const FOOTER: FooterOptions = {
  repoUrl: REPO_URL ?? '',
  citations: [
    {
      lead: `Modi, A.B. (${RELEASE_YEAR}). `,
      title: TOOL_NAME,
      tail:
        ` (${APP_VERSION}) [Computer software]. Ligant AI Incorporated. ${DEPLOYED_URL.replace('https://', '')}` +
        (CITATION_DOI !== null ? ` doi:${CITATION_DOI}` : ''),
    },
  ],
  disclaimer: SCOPE_STATEMENT,
}
