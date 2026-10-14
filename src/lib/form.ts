import type { Entered, ImportedMolecularWeight, SeriesInputs, TopPointForm, VendorDeclaration, } from './normalise';
import { acceptedTopPointForms, SUGGESTED_PIPETTING_MINIMUM_UL } from './normalise';
import type { CellUnit, ConcentrationUnit, StockMassBasis, StockSource, VendorBasis, VolumeUnit, } from './units';
export interface FormState {
    stockKind: 'stated' | 'not-stated-by-vendor';
    stockValue: string;
    stockUnit: ConcentrationUnit;
    stockMassBasis: StockMassBasis | '';
    stockSource: StockSource | '';
    vendorBasis: VendorBasis;
    vendorAmountKind: 'volume' | 'mass';
    vendorAmountValue: string;
    vendorAmountUnit: VolumeUnit;
    vendorTestVolume: string;
    vendorTestVolumeUnit: VolumeUnit;
    vendorConcentrationKind: 'concentration' | 'dilution';
    vendorConcentrationValue: string;
    vendorConcentrationUnit: ConcentrationUnit;
    vendorCellsKind: 'stated' | 'not-stated';
    vendorCells: string;
    vendorCellsUnit: CellUnit;
    stainingVolume: string;
    stainingVolumeUnit: VolumeUnit;
    cellNumber: string;
    cellNumberUnit: CellUnit;
    pipettingMinimum: string;
    pipettingMinimumEntered: boolean;
    pipettingMinimumConfirmed: boolean;
    stockUnitChosen: boolean;
    stainingVolumeUnitChosen: boolean;
    cellNumberUnitChosen: boolean;
    topForm: '' | `${TopPointForm}`;
    topValue: string;
    topVolumeUnit: VolumeUnit;
    topConcentrationUnit: ConcentrationUnit;
    dilutionFactor: string;
    points: string;
}
export const EMPTY_FORM: FormState = {
    stockKind: 'stated',
    stockValue: '',
    stockUnit: 'mg/mL',
    stockMassBasis: '',
    stockSource: '',
    vendorBasis: 'none',
    vendorAmountKind: 'volume',
    vendorAmountValue: '',
    vendorAmountUnit: 'uL',
    vendorTestVolume: '',
    vendorTestVolumeUnit: 'uL',
    vendorConcentrationKind: 'concentration',
    vendorConcentrationValue: '',
    vendorConcentrationUnit: 'ug/mL',
    vendorCellsKind: 'not-stated',
    vendorCells: '',
    vendorCellsUnit: 'cells-1e6',
    stainingVolume: '',
    stainingVolumeUnit: 'uL',
    cellNumber: '',
    cellNumberUnit: 'cells-1e6',
    pipettingMinimum: String(SUGGESTED_PIPETTING_MINIMUM_UL),
    pipettingMinimumEntered: false,
    pipettingMinimumConfirmed: false,
    stockUnitChosen: false,
    stainingVolumeUnitChosen: false,
    cellNumberUnitChosen: false,
    topForm: '',
    topValue: '',
    topVolumeUnit: 'uL',
    topConcentrationUnit: 'ug/mL',
    dilutionFactor: '',
    points: '',
};
export function parseNumber(raw: string): number | null {
    const cleaned = raw.replace(/,/g, '').trim();
    if (cleaned === '')
        return null;
    const value = Number(cleaned);
    return Number.isFinite(value) ? value : null;
}
export function reconcileTopPoint(form: FormState): {
    form: FormState;
    invalidated: boolean;
} {
    if (form.topForm === '')
        return { form, invalidated: false };
    if (acceptedTopPointForms(form.stockKind).includes(Number(form.topForm) as TopPointForm)) {
        return { form, invalidated: false };
    }
    return { form: { ...form, topForm: '', topValue: '' }, invalidated: true };
}
export function missingDeclarations(form: FormState): string[] {
    const missing: string[] = [];
    if (form.stockKind === 'stated') {
        if (parseNumber(form.stockValue) === null)
            missing.push('the stock concentration');
        if (form.stockMassBasis === '')
            missing.push('what the stated stock mass is the mass of');
    }
    if (form.stockSource === '')
        missing.push('where the stock concentration came from');
    if (parseNumber(form.stainingVolume) === null)
        missing.push('the staining volume');
    if (parseNumber(form.cellNumber) === null)
        missing.push('the cell number');
    if (parseNumber(form.pipettingMinimum) === null)
        missing.push('the minimum reliable pipetting volume');
    if (form.topForm === '')
        missing.push('the form the top point is entered in');
    if (parseNumber(form.topValue) === null)
        missing.push('the top point of the series');
    if (parseNumber(form.dilutionFactor) === null)
        missing.push('the dilution factor between points');
    if (parseNumber(form.points) === null)
        missing.push('the number of points');
    if (form.vendorBasis === 'per-test-volume-stated') {
        if (parseNumber(form.vendorAmountValue) === null)
            missing.push('the amount the vendor recommends per test');
        if (parseNumber(form.vendorTestVolume) === null)
            missing.push('the test volume the vendor states');
    }
    if (form.vendorBasis === 'per-test-volume-not-stated' && parseNumber(form.vendorAmountValue) === null) {
        missing.push('the amount the vendor recommends per test');
    }
    if (form.vendorBasis === 'final-concentration' && parseNumber(form.vendorConcentrationValue) === null) {
        missing.push('the concentration or dilution the vendor recommends');
    }
    if (form.vendorBasis !== 'none' &&
        form.vendorBasis !== 'per-test-volume-not-stated' &&
        form.vendorCellsKind === 'stated' &&
        parseNumber(form.vendorCells) === null) {
        missing.push("the vendor's stated cell number");
    }
    return missing;
}
function vendorDeclaration(form: FormState): VendorDeclaration {
    const cells: Entered<CellUnit> | 'not-stated' = form.vendorCellsKind === 'stated' && parseNumber(form.vendorCells) !== null
        ? { value: parseNumber(form.vendorCells) as number, unit: form.vendorCellsUnit }
        : 'not-stated';
    const amount = form.vendorAmountKind === 'mass'
        ? ({ kind: 'mass', ug: parseNumber(form.vendorAmountValue) ?? 0 } as const)
        : ({
            kind: 'volume',
            value: { value: parseNumber(form.vendorAmountValue) ?? 0, unit: form.vendorAmountUnit },
        } as const);
    switch (form.vendorBasis) {
        case 'per-test-volume-stated':
            return {
                basis: 'per-test-volume-stated',
                amountPerTest: amount,
                testVolume: {
                    value: parseNumber(form.vendorTestVolume) ?? 0,
                    unit: form.vendorTestVolumeUnit,
                },
                cellNumber: cells,
            };
        case 'per-test-volume-not-stated':
            return { basis: 'per-test-volume-not-stated', amountPerTest: amount };
        case 'final-concentration':
            return {
                basis: 'final-concentration',
                concentration: form.vendorConcentrationKind === 'dilution'
                    ? { dilutionFactor: parseNumber(form.vendorConcentrationValue) ?? 0 }
                    : {
                        value: parseNumber(form.vendorConcentrationValue) ?? 0,
                        unit: form.vendorConcentrationUnit,
                    },
                cellNumber: cells,
            };
        default:
            return { basis: 'none' };
    }
}
function topPoint(form: FormState): SeriesInputs['topPoint'] {
    const value = parseNumber(form.topValue) ?? 0;
    const topForm = Number(form.topForm) as TopPointForm;
    switch (topForm) {
        case 1:
            return { form: 1, value: { value, unit: form.topVolumeUnit } };
        case 3:
            return { form: 3, value: { value, unit: form.topConcentrationUnit } };
        default:
            return { form: topForm, value };
    }
}
export function toSeriesInputs(form: FormState, imported: ImportedMolecularWeight | null): SeriesInputs | null {
    if (missingDeclarations(form).length > 0)
        return null;
    return {
        stock: form.stockKind === 'stated'
            ? {
                kind: 'stated',
                concentration: { value: parseNumber(form.stockValue) as number, unit: form.stockUnit },
                massBasis: form.stockMassBasis as StockMassBasis,
            }
            : { kind: 'not-stated-by-vendor' },
        stockSource: form.stockSource as StockSource,
        vendor: vendorDeclaration(form),
        stainingVolume: {
            value: parseNumber(form.stainingVolume) as number,
            unit: form.stainingVolumeUnit,
        },
        cellNumber: { value: parseNumber(form.cellNumber) as number, unit: form.cellNumberUnit },
        pipettingMinimum: {
            value: parseNumber(form.pipettingMinimum) as number,
            provenance: form.pipettingMinimumEntered ? 'entered' : 'default',
        },
        topPoint: topPoint(form),
        dilutionFactor: parseNumber(form.dilutionFactor) as number,
        points: parseNumber(form.points) as number,
        imported,
    };
}
export interface PanelCompletion {
    stock: boolean;
    vendor: boolean;
    context: boolean;
    design: boolean;
}
export function panelCompletion(form: FormState): PanelCompletion {
    const stockStated = form.stockKind === 'not-stated-by-vendor' ||
        (parseNumber(form.stockValue) !== null && form.stockMassBasis !== '');
    const vendorCellsAnswered = form.vendorCellsKind === 'not-stated' || parseNumber(form.vendorCells) !== null;
    let vendor = true;
    if (form.vendorBasis === 'per-test-volume-stated') {
        vendor =
            parseNumber(form.vendorAmountValue) !== null &&
                parseNumber(form.vendorTestVolume) !== null &&
                vendorCellsAnswered;
    }
    else if (form.vendorBasis === 'per-test-volume-not-stated') {
        vendor = parseNumber(form.vendorAmountValue) !== null;
    }
    else if (form.vendorBasis === 'final-concentration') {
        vendor = parseNumber(form.vendorConcentrationValue) !== null && vendorCellsAnswered;
    }
    return {
        stock: stockStated && form.stockSource !== '',
        vendor,
        context: parseNumber(form.stainingVolume) !== null &&
            parseNumber(form.cellNumber) !== null &&
            parseNumber(form.pipettingMinimum) !== null,
        design: form.topForm !== '' &&
            parseNumber(form.topValue) !== null &&
            parseNumber(form.dilutionFactor) !== null &&
            parseNumber(form.points) !== null,
    };
}
