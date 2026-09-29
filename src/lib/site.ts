/**
 * Where the suite lives, what is in it, and what this tool is called.
 *
 * Single source of truth for all three. The navigation, the sitemap, the
 * canonical link and the social metadata are derived from this, so adding a
 * tool cannot leave the sitemap or the tool switcher behind. Plain data with no
 * browser dependency, because the build imports it too.
 *
 * The three check scripts read this file TEXTUALLY, by regular expression,
 * because they are plain Node and this project's TypeScript targets a browser
 * with no node types. That constrains the formatting as well as the contents:
 * every constant below is assigned a single-quoted string literal on a line the
 * regex can reach, and every TOOLS entry is a one-line object literal with `id`
 * before `path` and no nested braces. A reformat that wraps one of these across
 * two lines does not fail the typecheck; it makes a check silently stop finding
 * what it is checking.
 */

export const SITE_URL = 'https://benchtools.ligant.ai'


/**
 * The slug, decided 14 September 2026, closing URS open item 12.
 *
 * It becomes citable the moment it is public, so it is written once here and
 * referenced everywhere rather than repeated across metadata, the footer and
 * the checks. The siblings are `/molarity-converter/` and
 * `/antigen-density-calculator/`: both spell the tool's full name, so this one
 * does too. `/antibody-titration/` was proposed in the build brief and would
 * have been the only abbreviated slug in the set.
 */
export const TOOL_PATH = '/antibody-titration-planner/'

/** The one address acceptance test 17 is about. */
export const DEPLOYED_URL = `${SITE_URL}${TOOL_PATH}`

export const TOOL_ID = 'C4'
export const TOOL_NAME = 'Antibody Titration Planner'

/** The specification this build is written against. Stated on the page. */
export const URS_VERSION = '0.6'

/**
 * The engine version stamped on every output, per C4-NF-06.
 *
 * Bumped whenever calculation behaviour changes, which is not the same event as
 * a change to the shape of the structured object: that carries its own version
 * in `serialise.ts`. Versioning the two together would make one of them lie.
 */
export const APP_VERSION = 'v0.1.0'

/** The year the citation carries. Fixed, not read from the clock, so the page
 *  renders the same for every reader and for every build. */
export const RELEASE_YEAR = 2026

export const REPO_URL: string | null =
  'https://github.com/Ligant-AI/C4-Antibody-Titration-Planner'

/**
 * The Zenodo DOI for THIS version, minted when the v0.1.0 tag was archived,
 * 15 September 2026.
 *
 * The version-specific DOI, not the concept DOI (10.5281/zenodo.22773731,
 * which always resolves to whichever version is newest): the citation this
 * feeds names a specific version, "(v0.1.0)", so it has to point at the
 * artefact that string actually describes, not at whatever supersedes it
 * later. Matches the `identifiers` entry in CITATION.cff, by hand: nothing
 * here cross-checks the two against each other.
 */
export const CITATION_DOI: string | null = '10.5281/zenodo.22773732'


/* The list of tools is the suite's, in the shared header (@ligant/bench-chrome). */
