import { anchorConcentration, anchorVolumeUl, normalise, type Normalised, type SeriesInputs, type VendorDeclaration, } from './normalise';
import { GENERATION_METHOD, seriesValue } from './generate';
import { formsAtConcentration, formsAtVolume, valueOf, type Point } from './forms';
import { rejectInputs, rejectSeries, type Rejection } from './validate';
import { DETERMINES_NOT_VERIFIES_STATEMENT, DILUTION_CONVENTION_STATEMENT, SCOPE_STATEMENT, STAINING_VOLUME_STATEMENT, THRESHOLD_EVALUATION_STATEMENT, flagBelowPipettingMinimum, flagCellNumberMismatch, flagConcentrationNotStated, flagImportedCarriesFlags, flagImportedConjugateBasis, flagMassBasisPair, flagNoCells, flagSourceNotRecorded, flagTestVolumeNotStated, flagTopBelowRecommendation, flagVolumeMismatch, reportablePair, type Flag, } from './flags';
import { PRECISION_STATEMENT } from './format';
import { APP_VERSION } from './site';
import { CELLS_TO_COUNT, CONCENTRATION_TO_UG_PER_ML, VOLUME_TO_UL } from './units';
export interface VendorMultiple {
    atVendorTestVolume: number;
    atStainingVolume: number;
    identical: boolean;
}
export interface SeriesPoint extends Point {
    vendorMultiple: VendorMultiple | null;
}
export interface VendorContext {
    basis: VendorDeclaration['basis'];
    recommendedUgPerMl: number | null;
    atStainingVolumeUgPerMl: number | null;
    vendorTestVolumeUl: number | null;
    vendorCells: number | null;
}
export interface SeriesResult {
    ok: true;
    inputs: SeriesInputs;
    normalised: Normalised;
    anchor: {
        kind: 'concentration';
        ugPerMl: number;
    } | {
        kind: 'volume';
        ul: number;
    };
    points: SeriesPoint[];
    vendor: VendorContext | null;
    flags: Flag[];
    form6WithheldReason: string | null;
    engineVersion: string;
    generationMethod: string;
    relations: string[];
    assumptions: string[];
}
export type Outcome = SeriesResult | {
    ok: false;
    rejections: Rejection[];
};
export function isRejected(outcome: Outcome): outcome is {
    ok: false;
    rejections: Rejection[];
} {
    return outcome.ok === false;
}
function vendorContext(inputs: SeriesInputs, base: Normalised): VendorContext | null {
    const v = inputs.vendor;
    if (v.basis === 'none')
        return null;
    const cells = (declared: {
        value: number;
        unit: keyof typeof CELLS_TO_COUNT;
    } | 'not-stated') => declared === 'not-stated' ? null : declared.value * CELLS_TO_COUNT[declared.unit];
    const amountToUgPerMl = (amount: {
        kind: 'volume';
        value: {
            value: number;
            unit: keyof typeof VOLUME_TO_UL;
        };
    } | {
        kind: 'mass';
        ug: number;
    }, volumeUl: number): number | null => {
        if (amount.kind === 'mass')
            return (amount.ug * 1000) / volumeUl;
        if (base.stockUgPerMl === null)
            return null;
        const ul = amount.value.value * VOLUME_TO_UL[amount.value.unit];
        return (ul * base.stockUgPerMl) / volumeUl;
    };
    if (v.basis === 'per-test-volume-not-stated') {
        return {
            basis: v.basis,
            recommendedUgPerMl: null,
            atStainingVolumeUgPerMl: null,
            vendorTestVolumeUl: null,
            vendorCells: null,
        };
    }
    if (v.basis === 'per-test-volume-stated') {
        const testVolumeUl = v.testVolume.value * VOLUME_TO_UL[v.testVolume.unit];
        return {
            basis: v.basis,
            recommendedUgPerMl: amountToUgPerMl(v.amountPerTest, testVolumeUl),
            atStainingVolumeUgPerMl: amountToUgPerMl(v.amountPerTest, base.stainingVolumeUl),
            vendorTestVolumeUl: testVolumeUl,
            vendorCells: cells(v.cellNumber),
        };
    }
    const stated = 'dilutionFactor' in v.concentration
        ? base.stockUgPerMl === null
            ? null
            : base.stockUgPerMl / v.concentration.dilutionFactor
        : v.concentration.value * CONCENTRATION_TO_UG_PER_ML[v.concentration.unit];
    return {
        basis: v.basis,
        recommendedUgPerMl: stated,
        atStainingVolumeUgPerMl: stated,
        vendorTestVolumeUl: null,
        vendorCells: cells(v.cellNumber),
    };
}
export function computeSeries(inputs: SeriesInputs): Outcome {
    const inputRejections = rejectInputs(inputs);
    if (inputRejections.length > 0)
        return { ok: false, rejections: inputRejections };
    const base = normalise(inputs);
    const pair = inputs.imported !== null && inputs.stock.kind === 'stated'
        ? reportablePair(inputs.imported.massBasis, inputs.stock.massBasis)
        : null;
    const form6WithheldReason = pair !== null && !pair.reported ? pair.reason : null;
    const usesConcentration = inputs.stock.kind === 'stated';
    const anchorC = usesConcentration ? anchorConcentration(inputs, base) : null;
    const anchorV = usesConcentration ? null : anchorVolumeUl(inputs, base);
    if (usesConcentration && (anchorC === null || !(anchorC > 0))) {
        return {
            ok: false,
            rejections: [
                {
                    code: 'C4-HI-01',
                    field: 'top-point',
                    message: 'The top point does not resolve to a concentration greater than zero at the declared staining volume. A series has to start somewhere, and every point below the top is smaller still.',
                },
            ],
        };
    }
    if (!usesConcentration && (anchorV === null || !(anchorV > 0))) {
        return {
            ok: false,
            rejections: [
                {
                    code: 'C4-HI-01',
                    field: 'top-point',
                    message: 'The top point does not resolve to a stock volume greater than zero. Where the vendor states no concentration, the top point has to be entered as a volume per test or as a dilution factor from stock.',
                },
            ],
        };
    }
    const anchor = usesConcentration
        ? ({ kind: 'concentration', ugPerMl: anchorC as number } as const)
        : ({ kind: 'volume', ul: anchorV as number } as const);
    const rawPoints: Point[] = Array.from({ length: inputs.points }, (_, i) => {
        const index = i + 1;
        if (anchor.kind === 'concentration') {
            return formsAtConcentration(index, seriesValue(anchor.ugPerMl, inputs.dilutionFactor, index), base, form6WithheldReason);
        }
        return formsAtVolume(index, seriesValue(anchor.ul, inputs.dilutionFactor, index), base);
    });
    const seriesRejections = rejectSeries(rawPoints.map((p) => p.concentrationUgPerMl), rawPoints.map((p) => p.volumeUl), base.stockUgPerMl, base.stainingVolumeUl);
    if (seriesRejections.length > 0)
        return { ok: false, rejections: seriesRejections };
    const vendor = vendorContext(inputs, base);
    const points: SeriesPoint[] = rawPoints.map((p) => ({
        ...p,
        vendorMultiple: vendor !== null &&
            vendor.recommendedUgPerMl !== null &&
            vendor.atStainingVolumeUgPerMl !== null &&
            p.concentrationUgPerMl !== null
            ? {
                atVendorTestVolume: p.concentrationUgPerMl / vendor.recommendedUgPerMl,
                atStainingVolume: p.concentrationUgPerMl / vendor.atStainingVolumeUgPerMl,
                identical: vendor.recommendedUgPerMl === vendor.atStainingVolumeUgPerMl,
            }
            : null,
    }));
    return {
        ok: true,
        inputs,
        normalised: base,
        anchor,
        points,
        vendor,
        flags: raiseFlags(inputs, base, points, vendor, pair),
        form6WithheldReason,
        engineVersion: APP_VERSION,
        generationMethod: GENERATION_METHOD,
        relations: relationsApplied(inputs, base),
        assumptions: [
            STAINING_VOLUME_STATEMENT,
            DILUTION_CONVENTION_STATEMENT,
            PRECISION_STATEMENT,
            DETERMINES_NOT_VERIFIES_STATEMENT,
            THRESHOLD_EVALUATION_STATEMENT,
            SCOPE_STATEMENT,
        ],
    };
}
function raiseFlags(inputs: SeriesInputs, base: Normalised, points: readonly SeriesPoint[], vendor: VendorContext | null, pair: {
    reported: boolean;
    reason: string | null;
} | null): Flag[] {
    const flags: Flag[] = [];
    if (vendor !== null &&
        vendor.vendorTestVolumeUl !== null &&
        vendor.vendorTestVolumeUl !== base.stainingVolumeUl &&
        inputs.vendor.basis === 'per-test-volume-stated') {
        flags.push(flagVolumeMismatch(inputs.vendor.amountPerTest, vendor.vendorTestVolumeUl, base.stainingVolumeUl, vendor.recommendedUgPerMl, vendor.atStainingVolumeUgPerMl));
    }
    if (inputs.vendor.basis === 'per-test-volume-not-stated')
        flags.push(flagTestVolumeNotStated());
    const below = points
        .filter((p) => p.volumeUl !== null && p.volumeUl < base.pipettingMinimumUl)
        .map((p) => ({
        index: p.index,
        volumeUl: p.volumeUl as number,
        dilutionFromStock: valueOf(p.forms[4]),
    }));
    if (below.length > 0) {
        flags.push(flagBelowPipettingMinimum(below, base.pipettingMinimumUl, inputs.pipettingMinimum.provenance));
    }
    if (inputs.stockSource === 'not-recorded')
        flags.push(flagSourceNotRecorded());
    if (inputs.stock.kind === 'not-stated-by-vendor')
        flags.push(flagConcentrationNotStated());
    if (base.cells === 0)
        flags.push(flagNoCells());
    if (vendor !== null && vendor.vendorCells !== null && vendor.vendorCells !== base.cells) {
        flags.push(flagCellNumberMismatch(base.cells, vendor.vendorCells));
    }
    const top = points[0]?.concentrationUgPerMl ?? null;
    if (vendor !== null && vendor.recommendedUgPerMl !== null && top !== null) {
        if (top < vendor.recommendedUgPerMl) {
            flags.push(flagTopBelowRecommendation(top, vendor.recommendedUgPerMl));
        }
    }
    if (inputs.imported !== null && inputs.imported.massBasis === 'conjugate') {
        flags.push(flagImportedConjugateBasis());
    }
    if (inputs.imported !== null && inputs.imported.flags.length > 0) {
        flags.push(flagImportedCarriesFlags(inputs.imported.flags));
    }
    if (pair !== null && !pair.reported && inputs.imported !== null && inputs.stock.kind === 'stated') {
        flags.push(flagMassBasisPair(inputs.imported.massBasis, inputs.stock.massBasis, pair.reason ?? 'The two declared mass bases do not form a reportable pair.'));
    }
    return flags;
}
function relationsApplied(inputs: SeriesInputs, base: Normalised): string[] {
    const relations = [
        'Series: concentration at point i = concentration at the top point / f^(i-1), with f the declared dilution factor.',
    ];
    if (inputs.stock.kind === 'stated') {
        relations.push('Volume of stock per test = concentration at the point x staining volume / stock concentration.', 'Mass per test = concentration at the point x staining volume.', 'Dilution factor from stock = stock concentration / concentration at the point.');
        if (base.cells > 0) {
            relations.push('Mass per 10⁶ cells = mass per test x 10⁶ / cell number.');
        }
        if (base.molarPerConcentration !== null) {
            relations.push('Molar concentration = mass concentration / molecular weight, with the molecular weight taken from the imported result object.');
        }
    }
    else {
        relations.push('Volume of stock per test = volume at the top point / f^(i-1).', 'Dilution factor from stock = staining volume / volume of stock per test.');
    }
    relations.push('Cell density = cell number / staining volume, recorded as a declaration and not compared against any threshold.');
    return relations;
}
