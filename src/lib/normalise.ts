import { CELLS_TO_COUNT, CONCENTRATION_TO_UG_PER_ML, VOLUME_TO_UL, type CellUnit, type ConcentrationUnit, type FormId, type ImportedMassBasis, type StockMassBasis, type StockSource, type VendorBasis, type VolumeUnit, } from './units';
export interface Entered<U extends string> {
    value: number;
    unit: U;
}
export type StockDeclaration = {
    kind: 'stated';
    concentration: Entered<ConcentrationUnit>;
    massBasis: StockMassBasis;
} | {
    kind: 'not-stated-by-vendor';
};
export type VendorAmount = {
    kind: 'volume';
    value: Entered<VolumeUnit>;
} | {
    kind: 'mass';
    ug: number;
};
export type VendorDeclaration = {
    basis: 'per-test-volume-stated';
    amountPerTest: VendorAmount;
    testVolume: Entered<VolumeUnit>;
    cellNumber: Entered<CellUnit> | 'not-stated';
} | {
    basis: 'per-test-volume-not-stated';
    amountPerTest: VendorAmount;
} | {
    basis: 'final-concentration';
    concentration: Entered<ConcentrationUnit> | {
        dilutionFactor: number;
    };
    cellNumber: Entered<CellUnit> | 'not-stated';
} | {
    basis: 'none';
};
export type TopPointForm = Exclude<FormId, 6>;
export type TopPointEntry = {
    form: 1;
    value: Entered<VolumeUnit>;
} | {
    form: 2;
    value: number;
} | {
    form: 3;
    value: Entered<ConcentrationUnit>;
} | {
    form: 4;
    value: number;
} | {
    form: 5;
    value: number;
};
export interface ImportedMolecularWeight {
    gPerMol: number;
    provenance: string;
    massBasis: ImportedMassBasis;
    flags: readonly {
        code: string;
        message: string;
    }[];
    toolVersion: string;
}
export interface SeriesInputs {
    stock: StockDeclaration;
    stockSource: StockSource;
    vendor: VendorDeclaration;
    stainingVolume: Entered<VolumeUnit>;
    cellNumber: Entered<CellUnit>;
    pipettingMinimum: {
        value: number;
        provenance: 'entered' | 'default';
    };
    topPoint: TopPointEntry;
    dilutionFactor: number;
    points: number;
    imported: ImportedMolecularWeight | null;
}
export const SUGGESTED_PIPETTING_MINIMUM_UL = 2;
export const MIN_POINTS = 2;
export const MAX_POINTS = 12;
export interface Normalised {
    stockUgPerMl: number | null;
    stainingVolumeUl: number;
    cells: number;
    pipettingMinimumUl: number;
    cellsPerUl: number;
    volumePerConcentration: number | null;
    massPerConcentration: number;
    massPer1e6CellsPerConcentration: number | null;
    molarPerConcentration: number | null;
}
export function normalise(inputs: SeriesInputs): Normalised {
    const stockUgPerMl = inputs.stock.kind === 'stated'
        ? inputs.stock.concentration.value *
            CONCENTRATION_TO_UG_PER_ML[inputs.stock.concentration.unit]
        : null;
    const stainingVolumeUl = inputs.stainingVolume.value * VOLUME_TO_UL[inputs.stainingVolume.unit];
    const cells = inputs.cellNumber.value * CELLS_TO_COUNT[inputs.cellNumber.unit];
    const massPerConcentration = stainingVolumeUl / 1000;
    return {
        stockUgPerMl,
        stainingVolumeUl,
        cells,
        pipettingMinimumUl: inputs.pipettingMinimum.value,
        cellsPerUl: cells / stainingVolumeUl,
        volumePerConcentration: stockUgPerMl === null ? null : stainingVolumeUl / stockUgPerMl,
        massPerConcentration,
        massPer1e6CellsPerConcentration: cells > 0 ? (massPerConcentration * 1e6) / cells : null,
        molarPerConcentration: inputs.imported === null ? null : 1e-3 / inputs.imported.gPerMol,
    };
}
export function anchorConcentration(inputs: SeriesInputs, base: Normalised): number | null {
    const entry = inputs.topPoint;
    switch (entry.form) {
        case 1: {
            if (base.volumePerConcentration === null)
                return null;
            const ul = entry.value.value * VOLUME_TO_UL[entry.value.unit];
            return ul / base.volumePerConcentration;
        }
        case 2:
            return entry.value / base.massPerConcentration;
        case 3:
            return entry.value.value * CONCENTRATION_TO_UG_PER_ML[entry.value.unit];
        case 4:
            return base.stockUgPerMl === null ? null : base.stockUgPerMl / entry.value;
        case 5:
            return base.massPer1e6CellsPerConcentration === null
                ? null
                : entry.value / base.massPer1e6CellsPerConcentration;
    }
}
export function anchorVolumeUl(inputs: SeriesInputs, base: Normalised): number | null {
    const entry = inputs.topPoint;
    if (entry.form === 1)
        return entry.value.value * VOLUME_TO_UL[entry.value.unit];
    if (entry.form === 4)
        return base.stainingVolumeUl / entry.value;
    return null;
}
export function acceptedTopPointForms(stockKind: StockDeclaration['kind']): readonly TopPointForm[] {
    return stockKind === 'stated' ? [1, 2, 3, 4, 5] : [1, 4];
}
export type { VendorBasis };
