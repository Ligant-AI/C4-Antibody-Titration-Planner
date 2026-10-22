import type { FooterOptions, HeaderOptions } from '@ligant/bench-chrome';
import { SCOPE_STATEMENT } from './flags';
import { SEO } from './seo';
import { APP_VERSION, CITATION_DOI, DEPLOYED_URL, RELEASE_YEAR, REPO_URL, TOOL_NAME, TOOL_PATH } from './site';
export const HEADER: HeaderOptions = {
    path: TOOL_PATH,
    title: SEO.h1,
    description: SEO.lead,
};
export const FOOTER: FooterOptions = {
    repoUrl: REPO_URL ?? '',
    citations: [
        {
            lead: `Modi, A.B. (${RELEASE_YEAR}). `,
            title: TOOL_NAME,
            tail: ` (${APP_VERSION}) [Computer software]. Ligant AI Incorporated. ${DEPLOYED_URL.replace('https://', '')}` +
                (CITATION_DOI !== null ? ` doi:${CITATION_DOI}` : ''),
        },
    ],
    disclaimer: SCOPE_STATEMENT,
};
