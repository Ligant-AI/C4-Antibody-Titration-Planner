import { escapeHtml as esc } from '@ligant/bench-chrome';
import { APP_VERSION, DEPLOYED_URL, REPO_URL, SITE_URL, TOOL_NAME } from './site';
export interface FaqItem {
    q: string;
    a: string;
}
export const SEO = {
    h1: 'Antibody titration calculator for flow cytometry',
    lead: 'This tool plans an antibody titration series for flow cytometry. For the staining volume and the cell number you declare, it gives the antibody concentration at each point of the series in every form the bench and the method record need. It does not choose the optimal point and does not determine whether any point saturates the target.',
    description: 'Free antibody titration calculator for flow cytometry. Plan a titration series for your staining volume and cell number: µL of stock, µg per test, final µg/mL.',
    related: {
        text: 'Titration Analysis computes the stain index at each point from the population statistics you export, once the series is stained and acquired.',
        name: 'Titration Analysis',
        href: '/titration-analysis/',
    },
    faqHeading: 'Questions and answers',
    faq: [
        {
            q: 'How do I plan an antibody titration series?',
            a: 'If the vendor states a stock concentration, enter it as printed, with its unit, what that mass is of (the antibody protein or the whole conjugate) and where the number came from. Then enter the final volume of your stain, including the antibody and every other reagent; the number of cells in one test; the top point, the most concentrated one, and which form you are entering it in; the dilution factor between points (a 1 in 2 dilution, one part in two total, is a factor of 2); and the number of points, from 2 to 12. Each later point is the top point divided by the dilution factor raised to the power of its position minus one, and each point is shown in every form that can be computed.',
        },
        {
            q: 'Why doesn\'t "5 µL per test" carry over to my staining volume?',
            a: 'A recommendation of "5 µL per test" carries neither a concentration nor an amount per cell unless the volume and the cell number of that test are also stated. A lab that titrates in 100 µL and stains in 50 µL has doubled the concentration and will not see it, because the volume pipetted is identical.',
        },
        {
            q: 'Which matters, the antibody concentration or the amount per cell?',
            a: "How much antibody binds is set by the free antibody concentration. Where the cells' antigen sites take up a significant share of the antibody added (many cells, dense antigen, a small volume), binding depletes the free antibody, and the amount of antibody per cell then matters as well. Which situation applies depends on antigen density, affinity and cell number, which a datasheet does not usually state, so titrate at the cell number you will stain.",
        },
        {
            q: 'Which forms does it give for each point?',
            a: 'Volume of stock to pipette, mass per test, final concentration, dilution from stock, mass per 10⁶ cells and, where a molecular weight is supplied, molar concentration. A form that cannot be computed, for example a mass when the vendor states no stock concentration, is marked as withheld with the reason and is never shown as zero.',
        },
        {
            q: 'Does it pick the optimal concentration?',
            a: 'No. It does not prepare the series, does not analyze the resulting data, does not choose the optimal point, and does not determine whether any point saturates the target.',
        },
        {
            q: 'Is my data uploaded anywhere?',
            a: 'No. Calculations run entirely in your browser, and your inputs are never transmitted, stored, or logged. The page sends an email address only if you choose to submit one in the newsletter signup, and its web analytics counts visits and sees how quickly the page loads, with further analytics only if you allow it in the banner; no analytics ever receives anything you type into this tool.',
        },
        {
            q: 'Is it free?',
            a: 'Yes. It is free to use and open source under the Apache 2.0 licence. Its source code is on GitHub, so you can download it and run it on your own computer.',
        },
    ] as readonly FaqItem[],
    featureList: [
        'Antibody concentration at each point of a titration series',
        'Volume of stock, mass per test, final concentration, dilution from stock, mass per 10⁶ cells and, where a molecular weight is supplied, molar concentration',
        'Uses the staining volume and cell number you declare',
        'Records the basis of a vendor recommendation',
    ] as readonly string[],
} as const;
export function relatedHtml(): string {
    const { text, name, href } = SEO.related;
    return `<p class="related">${esc(text).replace(esc(name), `<a href="${href}">${esc(name)}</a>`)}</p>`;
}
export function faqPanelHtml(): string {
    const body = SEO.faq.map(({ q, a }) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('');
    return `<section class="panel faq-panel" aria-labelledby="faq-heading"><div class="panel-head"><div class="titles"><h2 id="faq-heading">${esc(SEO.faqHeading)}</h2></div></div><div class="panel-body">${body}</div></section>`;
}
export function softwareApplication() {
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: `Ligant · ${TOOL_NAME}`,
        url: DEPLOYED_URL,
        description: SEO.description,
        applicationCategory: 'ScientificApplication',
        operatingSystem: 'Any (runs in a web browser)',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0' },
        license: `${DEPLOYED_URL}LICENSE`,
        softwareVersion: APP_VERSION.replace(/^v/, ''),
        ...(REPO_URL !== null ? { codeRepository: REPO_URL } : {}),
        featureList: [...SEO.featureList],
    };
}
export function faqPage() {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: SEO.faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    };
}
export function breadcrumbs() {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Ligant Bench Tools', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: TOOL_NAME, item: DEPLOYED_URL },
        ],
    };
}
const block = (o: object) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
export function jsonLdHtml(): string {
    return [softwareApplication(), faqPage(), breadcrumbs()].map(block).join('\n    ');
}
