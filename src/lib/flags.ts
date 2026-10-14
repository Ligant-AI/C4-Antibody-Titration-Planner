import { formatSigFigs } from './format';
import { IMPORTED_MASS_BASIS_LABEL, STOCK_MASS_BASIS_SHORT, UNIT_LABEL, type ImportedMassBasis, type StockMassBasis, } from './units';
import type { VendorAmount } from './normalise';
export type FlagCode = 'C4-FL-01' | 'C4-FL-02' | 'C4-FL-03' | 'C4-FL-04' | 'C4-FL-05' | 'C4-FL-06' | 'C4-FL-07' | 'C4-FL-08' | 'C4-FL-09' | 'C4-FL-10' | 'C4-FL-11';
export interface Flag {
    code: FlagCode;
    message: string;
    summary: string;
    evaluatedOn: string;
    kind: 'threshold' | 'declaration' | 'import';
    points?: number[];
    remedy?: string;
}
export const THRESHOLD_EVALUATION_STATEMENT = 'Flags that compare quantities are evaluated on the unrounded value, which may differ from ' +
    'the displayed value in its last significant figure. A flagged point and an unflagged one ' +
    'can therefore display identically.';
export const ARITHMETIC_CHECKS_STATEMENT = 'The arithmetic is checked by automated tests: a unit conversion and its reverse return the entered value to within 1 unit in the last binary place, the same quantity entered in different units agrees to within 2, and each step of the series equals the dilution factor to within 6. These checks cannot see an error smaller than about one rounding per step, which is far below the 3 significant figures shown.';
interface ReportablePair {
    importedBasis: ImportedMassBasis | 'any';
    stockBasis: StockMassBasis | 'any';
    reported: boolean;
    reason: string | null;
}
export const REPORTABLE_PAIRS: readonly ReportablePair[] = [
    { importedBasis: 'assembled', stockBasis: 'antibody-protein', reported: true, reason: null },
    { importedBasis: 'conjugate', stockBasis: 'conjugate', reported: true, reason: null },
    {
        importedBasis: 'monomer',
        stockBasis: 'any',
        reported: false,
        reason: 'The molecular weight is declared as a subunit of a larger molecule. The molar form would count subunits, not whole reagent molecules.',
    },
    {
        importedBasis: 'any',
        stockBasis: 'not-recorded',
        reported: false,
        reason: 'Stock mass basis not recorded.',
    },
    {
        importedBasis: 'not-recorded',
        stockBasis: 'any',
        reported: false,
        reason: 'Molecular-weight mass basis not recorded.',
    },
    {
        importedBasis: 'assembled',
        stockBasis: 'conjugate',
        reported: false,
        reason: 'Bases differ: whole-molecule weight against conjugate mass.',
    },
    {
        importedBasis: 'conjugate',
        stockBasis: 'antibody-protein',
        reported: false,
        reason: 'Bases differ: conjugate weight against protein mass.',
    },
] as const;
export interface PairVerdict {
    reported: boolean;
    reason: string | null;
}
export function reportablePair(importedBasis: ImportedMassBasis, stockBasis: StockMassBasis): PairVerdict {
    for (const row of REPORTABLE_PAIRS) {
        const importedMatches = row.importedBasis === 'any' || row.importedBasis === importedBasis;
        const stockMatches = row.stockBasis === 'any' || row.stockBasis === stockBasis;
        if (importedMatches && stockMatches)
            return { reported: row.reported, reason: row.reason };
    }
    return {
        reported: false,
        reason: 'The two declared mass bases do not form a pair this tool is able to report.',
    };
}
export function flagVolumeMismatch(amountPerTest: VendorAmount, vendorTestVolumeUl: number, stainingVolumeUl: number, recommendedUgPerMl: number | null, atStainingVolumeUgPerMl: number | null): Flag {
    const amountText = amountPerTest.kind === 'mass'
        ? `${formatSigFigs(amountPerTest.ug)} ${UNIT_LABEL.ug}`
        : `${amountPerTest.value.value} ${UNIT_LABEL[amountPerTest.value.unit]}`;
    const computable = recommendedUgPerMl !== null && atStainingVolumeUgPerMl !== null;
    const factor = computable ? atStainingVolumeUgPerMl / recommendedUgPerMl : null;
    const message = computable
        ? `The vendor's ${amountText} gives ${formatSigFigs(recommendedUgPerMl)} µg/mL in their ` +
            `${formatSigFigs(vendorTestVolumeUl)} µL and ${formatSigFigs(atStainingVolumeUgPerMl)} µg/mL in your ` +
            `${formatSigFigs(stainingVolumeUl)} µL, ${formatSigFigs(factor as number)} times the recommended ` +
            'concentration if the volume is carried across.'
        : `The vendor recommendation was defined at a different volume, ${formatSigFigs(vendorTestVolumeUl)} µL against ` +
            `a staining volume of ${formatSigFigs(stainingVolumeUl)} µL. The per-test volume does not transfer, and the ` +
            'concentration this would reach cannot be computed here because no stock concentration is stated.';
    const summary = computable
        ? `vendor volume ${formatSigFigs(vendorTestVolumeUl)} µL is not ${formatSigFigs(stainingVolumeUl)} µL, ` +
            `${formatSigFigs(factor as number)} times concentration`
        : `vendor volume ${formatSigFigs(vendorTestVolumeUl)} µL is not ${formatSigFigs(stainingVolumeUl)} µL, ` +
            'concentration not computable';
    return {
        code: 'C4-FL-01',
        kind: 'threshold',
        evaluatedOn: 'the declared staining volume against the vendor recommendation',
        message,
        summary,
        remedy: 'Pipetting the recommended amount into this staining volume does not reproduce the concentration the vendor recommended. If you intend to reproduce that concentration, use the concentration column rather than the volume column.',
    };
}
export function flagTestVolumeNotStated(): Flag {
    return {
        code: 'C4-FL-02',
        kind: 'declaration',
        evaluatedOn: 'the vendor recommendation declaration',
        message: 'The vendor’s intended concentration cannot be determined; the recommendation cannot be transferred to any other staining volume. The series below is fully defined at the declared volume.',
        summary: 'vendor amount has no test volume, cannot transfer to another staining volume',
        remedy: 'An amount per test with no test volume does not state a concentration, so it cannot be carried to another staining volume. If the datasheet gives a test volume elsewhere, enter it; otherwise treat the recommendation as applying only to the vendor’s own assay.',
    };
}
export function flagBelowPipettingMinimum(points: readonly {
    index: number;
    volumeUl: number;
    dilutionFromStock: number | null;
}[], minimumUl: number, provenance: 'entered' | 'default'): Flag {
    const named = points
        .map((p) => {
        const dilution = p.dilutionFromStock === null
            ? 'dilution from stock not computable'
            : `1 in ${formatSigFigs(p.dilutionFromStock)} from stock`;
        return `point ${p.index} at ${formatSigFigs(p.volumeUl)} µL (${dilution})`;
    })
        .join(', ');
    const minimumSource = provenance === 'default'
        ? `the suggested minimum of ${formatSigFigs(minimumUl)} µL, which has not been changed`
        : `the declared minimum of ${formatSigFigs(minimumUl)} µL`;
    const topBelowMinimum = points.some((p) => p.index === 1);
    const leadSentence = topBelowMinimum
        ? 'No point of this series can be pipetted from stock; the whole series is prepared from an intermediate. '
        : '';
    return {
        code: 'C4-FL-03',
        kind: 'threshold',
        evaluatedOn: 'each point’s computed stock volume against the declared pipetting minimum',
        points: points.map((p) => p.index),
        message: `${leadSentence}These points cannot be pipetted directly from stock at this staining volume and against ` +
            `${minimumSource}: ${named}.`,
        summary: topBelowMinimum
            ? `whole series below the pipetting minimum of ${formatSigFigs(minimumUl)} µL, prepare from an intermediate`
            : `${points.length} point${points.length === 1 ? '' : 's'} below the pipetting minimum of ${formatSigFigs(minimumUl)} µL`,
        remedy: 'Prepare an intermediate working stock and pipette these points from it. Each point is listed with its dilution factor from stock so the intermediate can be designed against it.',
    };
}
export function flagSourceNotRecorded(): Flag {
    return {
        code: 'C4-FL-04',
        kind: 'declaration',
        evaluatedOn: 'the stock concentration provenance declaration',
        message: 'Stock concentration provenance not recorded; the series cannot be traced to a source and should not be carried into a method record without one.',
        summary: 'stock concentration provenance not recorded',
        remedy: 'Record where the concentration came from: the certificate of analysis, the vendor datasheet, or your own measurement.',
    };
}
export function flagConcentrationNotStated(): Flag {
    return {
        code: 'C4-FL-05',
        kind: 'declaration',
        evaluatedOn: 'the stock declaration',
        message: 'Mass-based forms are not computable; the series is expressed in forms 1 and 4, plus the vendor multiple where a basis is stated.',
        summary: 'stock concentration not stated, mass-based forms not computable',
        remedy: 'A concentration from the certificate of analysis, or an A280 measurement (corrected for the dye’s absorbance at 280 nm, and only if the stock contains no carrier protein), would make the mass-based forms available. Without one the series is still fully defined as volumes and dilutions.',
    };
}
export function flagNoCells(): Flag {
    return {
        code: 'C4-FL-06',
        kind: 'threshold',
        evaluatedOn: 'the cell number',
        message: 'No cells declared; this series describes a no-cell condition.',
        summary: 'no cells declared, this is a no-cell condition',
        remedy: 'This is a legitimate control condition and is not an error. Mass per 10⁶ cells is reported as not computable, because there are no cells to express a mass per.',
    };
}
export function flagCellNumberMismatch(declaredCells: number, vendorCells: number): Flag {
    return {
        code: 'C4-FL-07',
        kind: 'threshold',
        evaluatedOn: 'the declared cell number against the vendor recommendation',
        message: `The vendor recommendation was defined at a different cell number, ${formatSigFigs(vendorCells)} against ` +
            `${formatSigFigs(declaredCells)} declared here. Antibody depletion may differ, and the recommendation may not ` +
            'transfer at this cell number even at the same concentration.',
        summary: `cell number ${formatSigFigs(declaredCells)} is not the vendor's ${formatSigFigs(vendorCells)}`,
        remedy: 'Whether this matters depends on whether antibody is in excess, which depends on antigen density and affinity. This tool records the difference; it cannot quantify the depletion.',
    };
}
export function flagTopBelowRecommendation(topUgPerMl: number, recommendedUgPerMl: number): Flag {
    return {
        code: 'C4-FL-08',
        kind: 'threshold',
        evaluatedOn: 'the series against the vendor recommendation',
        message: `The series begins below the vendor recommendation, at ${formatSigFigs(topUgPerMl)} µg/mL against a ` +
            `recommended ${formatSigFigs(recommendedUgPerMl)} µg/mL; the recommended point is not bracketed by this series.`,
        summary: `series begins at ${formatSigFigs(topUgPerMl)} µg/mL, below the vendor's ${formatSigFigs(recommendedUgPerMl)} µg/mL`,
        remedy: 'Raise the top point to at or above the recommendation if you intend the series to span it. A vendor recommendation is a concentration chosen for a stated assay; it is not established to be a saturating one.',
    };
}
export function flagImportedConjugateBasis(): Flag {
    return {
        code: 'C4-FL-09',
        kind: 'import',
        evaluatedOn: 'the imported mass-basis declaration',
        message: 'The molecular weight includes label or payload; the molar form shown is of the conjugate, not of the underlying antibody. The tool does not correct for degree of labelling.',
        summary: 'molecular weight includes label or payload, molar form is of the conjugate',
        remedy: 'Where the molar concentration of the antibody itself is wanted rather than of the conjugate, a protein-basis molecular weight is needed. This tool does not convert between the two.',
    };
}
export function flagImportedCarriesFlags(imported: readonly {
    code: string;
    message: string;
}[]): Flag {
    return {
        code: 'C4-FL-10',
        kind: 'import',
        evaluatedOn: 'the imported result object',
        message: 'The imported value carries flags, restated here in full: ' +
            imported.map((f) => `From the Molarity Converter: ${f.message}`).join(' '),
        summary: `imported value carries ${imported.length} flag${imported.length === 1 ? '' : 's'} of its own`,
        remedy: 'These qualify the molecular weight this series’ molar form rests on. They travelled with the value deliberately: a flag that stops at a tool boundary stops doing its work.',
    };
}
export function flagMassBasisPair(importedBasis: ImportedMassBasis, stockBasis: StockMassBasis, reason: string): Flag {
    return {
        code: 'C4-FL-11',
        kind: 'declaration',
        evaluatedOn: 'the stock mass basis against the imported molecular-weight mass basis',
        message: `Form 6, the molar concentration, is withheld. ${reason} The stock mass is declared as ` +
            `${STOCK_MASS_BASIS_SHORT[stockBasis]}; the molecular weight is declared as ` +
            `${IMPORTED_MASS_BASIS_LABEL[importedBasis]}.`,
        summary: 'form 6 withheld, the stock and molecular-weight mass bases do not form a reportable pair',
        remedy: 'The tool withholds rather than converting, because correcting between mass bases would need the degree of labelling or the chain composition, and it has neither. Import a molecular weight on a basis matching the stock, or record the basis that is missing.',
    };
}
export const UNDETECTABLE_FAILURES: readonly string[] = [
    'A stock concentration that is *wrong*: mislabelled, degraded, or from a different lot.',
    '*Loss of antibody activity* through storage, freeze-thaw, or age. A correct concentration of an inactive antibody titrates as if it were active.',
    'A titration performed on a *different cell type, fixation state, or permeabilisation condition* than the experiment it will be applied to.',
    '*Absence of Fc receptor blocking*, which changes apparent staining independently of concentration.',
    '*Which binding regime applies.* Concentration (form 3) transfers where antibody is in excess; mass per cell (form 5) transfers where antibody is depleted by the antigen sink. Which governs depends on antigen density, affinity and cell number. The cell density is recorded and a mismatch with the vendor is flagged; neither quantifies depletion.',
    'Whether the series *brackets the optimum*. A flag is raised only where a vendor recommendation with a stated basis was entered, and it states only that the recommended point is not bracketed by this series.',
    'Any error in the *preparation* of the series. The tool states the target; it does not observe what was pipetted.',
    'A *degree of labelling* differing from the lot the recommendation was derived from. A flag records that a payload is included but cannot quantify it.',
    'A staining volume entered as the *volume before antibody addition* rather than the final volume. The term is defined on this page, but the tool cannot verify which the user measured.',
    '*Matrix transfer.* A series titrated on one matrix, whether cells, capture beads, or fixed against live cells, does not establish the optimum on another; surface densities differ by orders of magnitude.',
    '*Volume accommodation.* Whether the stock volume at the top point can be accommodated alongside the volumes the cells and other reagents arrive in. The rejection above bounds only the stock volume against the whole staining volume.',
    '*Dilution convention.* A vendor dilution recommendation read under the other convention differs from the reading used here by (f + 1)/f. The tool cannot detect which the vendor meant.',
    '*Mass-basis mismatch where a basis is unrecorded.* The molar form is withheld when the two mass bases differ or are unrecorded; it cannot tell whether an unrecorded basis would have matched.',
    '*Saturation.* The tool cannot determine whether any point in the series saturates the target. A vendor recommendation does not establish saturation: it is a concentration chosen for a stated assay, frequently for separation, and the datasheet does not say which.',
] as const;
export interface RegisterEntry {
    readonly id: string;
    readonly label: string;
    readonly value: string;
    readonly basis: 'derived' | 'inspection' | 'convention';
    readonly reason: string;
}
export const PRECISION_PRINCIPLE = 'Displayed precision matches the resolution of the physical act the number drives.';
export const CONSTANTS_REGISTER: readonly RegisterEntry[] = [
    {
        id: 'pipetting-minimum',
        label: 'Minimum reliable pipetting volume',
        value: 'User-declared; 2 µL pre-filled as a suggestion',
        basis: 'inspection',
        reason: 'The smallest volume a pipette delivers reliably depends on the instrument and the operator, so no single value is imposed. The 2 µL suggestion is used for the pipetting-minimum flag whenever it is left unchanged, so leaving it in place is a decision and not an abstention. Whether the minimum was entered or left at the suggestion is recorded on the output, in the structured result and in the notebook copy.',
    },
    {
        id: 'maximum-points',
        label: 'Maximum point count',
        value: '12',
        basis: 'inspection',
        reason: 'A round number comfortably above what a bench titration series actually runs. It is not derived from any arithmetic or layout constraint.',
    },
    {
        id: 'displayed-precision',
        label: 'Displayed precision',
        value: '3 significant figures',
        basis: 'inspection',
        reason: `${PRECISION_PRINCIPLE} This tool drives a pipette, and three significant figures is the resolution at which a displayed volume corresponds to something a pipette delivers.`,
    },
    {
        id: 'rounding-mode',
        label: 'Rounding mode at displayed precision',
        value: 'Half away from zero, applied to the exact stored binary value',
        basis: 'convention',
        reason: 'Applied to the exact stored value rather than to a decimal rendering: a 2-fold series from a round top point lands on genuine binary ties, and a value that merely prints like a tie is usually not one. A true tie therefore always rounds away from zero. The Molarity Converter rounds exact ties to even, so on a tie the two tools can differ by one in the last displayed digit; their unrounded values agree.',
    },
    {
        id: 'dilution-factor',
        label: 'Dilution factor',
        value: 'Final volume divided by stock volume',
        basis: 'convention',
        reason: 'Stated on the output. A dilution of 1 in 100 is a factor of 100: one part in one hundred total, not one part plus one hundred parts. A vendor recommendation written under the other convention differs by (f + 1)/f, and the tool cannot detect which was meant.',
    },
    {
        id: 'staining-volume',
        label: 'Staining volume',
        value: 'The final volume of the stain, including the antibody',
        basis: 'convention',
        reason: 'Stated on the output. Whether 100 µL means the volume the antibody is added to or the volume after it is added changes the top-point concentration by the volume fraction of the antibody. Final volume is used because it is the quantity that determines concentration. The tool cannot verify which you measured.',
    },
    {
        id: 'cell-density',
        label: 'Cell density',
        value: 'Computed and stated; no threshold applied',
        basis: 'convention',
        reason: 'Recorded as part of the condition the series was designed under. No bound is applied to it, deliberately: depletion depends on antigen density, affinity and cell number together, none of which this tool knows, so no single defensible bound exists.',
    },
] as const;
export const SCOPE_STATEMENT = 'Research use only. Not qualified for GxP decision-making.';
export const DETERMINES_NOT_VERIFIES_STATEMENT = 'This tool determines the target concentration at each point. It does not verify what was prepared, and it does not observe what was pipetted.';
export const STAINING_VOLUME_STATEMENT = 'Staining volume is taken as the final volume of the stain, including the antibody and every other reagent added. All concentrations are computed on that basis.';
export const DILUTION_CONVENTION_STATEMENT = 'Dilution factor is final volume divided by stock volume. A dilution of 1 in 100 is a factor of 100.';
export const VENDOR_UNTRANSFERABLE_STATEMENT = 'The vendor’s intended concentration cannot be determined from an amount per test with no test volume, so the recommendation cannot be transferred to any other staining volume. The series computed at the declared staining volume remains fully expressed in every form.';
export { UNIT_LABEL };
export function flagLabel(code: string): string {
    return code.replace(/^C\d+-/, '');
}
export const FLAG_LEGEND: readonly {
    readonly code: FlagCode;
    readonly meaning: string;
    readonly action: string;
}[] = [
    {
        code: 'C4-FL-01',
        meaning: 'Your staining volume differs from the volume the vendor’s recommendation was defined at.',
        action: 'Pipetting the vendor’s volume of stock into your staining volume no longer gives the vendor’s concentration. If you intend to reproduce that concentration, use the concentration column, not the volume column.',
    },
    {
        code: 'C4-FL-02',
        meaning: 'The vendor gave an amount per test with no test volume.',
        action: 'The recommendation does not state a concentration, so it cannot be moved to another volume. Enter the test volume if the datasheet gives it elsewhere.',
    },
    {
        code: 'C4-FL-03',
        meaning: 'One or more points need less stock than your pipetting minimum.',
        action: 'Make an intermediate working stock and pipette those points from it. The dilution from stock is listed for each point.',
    },
    {
        code: 'C4-FL-04',
        meaning: 'You did not record where the stock concentration came from.',
        action: 'Record the source (certificate of analysis, datasheet or your own measurement) before the series goes into a method record.',
    },
    {
        code: 'C4-FL-05',
        meaning: 'The vendor does not state a concentration for the stock.',
        action: 'Only volumes and dilutions can be given. A concentration from the certificate of analysis, or your own A280 measurement (corrected for the dye’s absorbance at 280 nm, and only if the stock contains no carrier protein), makes the mass-based forms available.',
    },
    {
        code: 'C4-FL-06',
        meaning: 'No cells are declared, so this is a no-cell condition.',
        action: 'Nothing to fix if it is a control. Mass per 10⁶ cells is not computable because there are no cells.',
    },
    {
        code: 'C4-FL-07',
        meaning: 'Your cell number differs from the one the vendor’s recommendation was determined at.',
        action: 'If antibody is in large excess over the antigen sites in your tube, concentration is what transfers and the cell number matters little. If your cells bind a significant share of the antibody (many cells, dense antigen, a small volume), more cells need more antibody. The tool cannot tell which applies; titrate at the cell number you will stain.',
    },
    {
        code: 'C4-FL-08',
        meaning: 'The top point of your series is below the vendor’s recommended concentration.',
        action: 'Raise the top point to at or above the recommendation if you want the series to bracket it.',
    },
    {
        code: 'C4-FL-09',
        meaning: 'The imported molecular weight includes the label or payload.',
        action: 'The molar form is of the conjugate, not of the antibody alone. Use a protein-basis molecular weight if you want the antibody’s own molarity.',
    },
    {
        code: 'C4-FL-10',
        meaning: 'The imported molecular weight arrived with flags of its own.',
        action: 'They are repeated in full. They qualify the molecular weight the molar form rests on.',
    },
    {
        code: 'C4-FL-11',
        meaning: 'The molar concentration is withheld because the stock mass and the molecular weight are not on a matching basis. It is shown only for a whole-molecule weight with a stock quoted as antibody protein, or a conjugate weight with a stock quoted as conjugate. A subunit weight, any other pairing, or an unrecorded basis withholds it.',
        action: 'Import a molecular weight from the Molarity Converter declared on the same basis as the stock (assembled for antibody protein, conjugate for conjugate), or record the basis that is missing.',
    },
];
