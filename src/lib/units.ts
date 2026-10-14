export type VolumeUnit = 'uL' | 'mL';
export type ConcentrationUnit = 'mg/mL' | 'ug/mL' | 'ng/mL';
export type CellUnit = 'cells' | 'cells-1e6';
export type MassUnit = 'ug';
export const VOLUME_UNITS: readonly VolumeUnit[] = ['uL', 'mL'];
export const CONCENTRATION_UNITS: readonly ConcentrationUnit[] = ['mg/mL', 'ug/mL', 'ng/mL'];
export const CELL_UNITS: readonly CellUnit[] = ['cells', 'cells-1e6'];
export const VOLUME_TO_UL: Readonly<Record<VolumeUnit, number>> = {
    uL: 1,
    mL: 1000,
};
export const CONCENTRATION_TO_UG_PER_ML: Readonly<Record<ConcentrationUnit, number>> = {
    'mg/mL': 1000,
    'ug/mL': 1,
    'ng/mL': 1e-3,
};
export const CELLS_TO_COUNT: Readonly<Record<CellUnit, number>> = {
    cells: 1,
    'cells-1e6': 1e6,
};
export const UNIT_LABEL: Readonly<Record<VolumeUnit | ConcentrationUnit | CellUnit | MassUnit, string>> = {
    uL: 'µL',
    mL: 'mL',
    'mg/mL': 'mg/mL',
    'ug/mL': 'µg/mL',
    'ng/mL': 'ng/mL',
    cells: 'cells',
    'cells-1e6': 'cells × 10⁶',
    ug: 'µg',
};
export type StockSource = 'certificate-of-analysis' | 'vendor-datasheet' | 'measured' | 'not-recorded';
export const STOCK_SOURCES: readonly StockSource[] = [
    'certificate-of-analysis',
    'vendor-datasheet',
    'measured',
    'not-recorded',
];
export const STOCK_SOURCE_LABEL: Readonly<Record<StockSource, string>> = {
    'certificate-of-analysis': 'certificate of analysis',
    'vendor-datasheet': 'vendor datasheet',
    measured: 'measured (A280 or equivalent)',
    'not-recorded': 'not recorded',
};
export type StockMassBasis = 'antibody-protein' | 'conjugate' | 'not-recorded';
export const STOCK_MASS_BASES: readonly StockMassBasis[] = [
    'antibody-protein',
    'conjugate',
    'not-recorded',
];
export const STOCK_MASS_BASIS_LABEL: Readonly<Record<StockMassBasis, string>> = {
    'antibody-protein': 'the antibody protein, unconjugated mass; select this where the datasheet quotes protein or IgG concentration, whatever the reagent’s format',
    conjugate: 'a conjugate, including its label or payload',
    'not-recorded': 'not recorded',
};
export const STOCK_MASS_BASIS_SHORT: Readonly<Record<StockMassBasis, string>> = {
    'antibody-protein': 'antibody protein',
    conjugate: 'conjugate, including label or payload',
    'not-recorded': 'mass basis not recorded',
};
export function formatCellCount(value: string | number, unit: CellUnit): string {
    return unit === 'cells-1e6' ? `${value} \u00d7 10\u2076 cells` : `${value} cells`;
}
export type ImportedMassBasis = 'assembled' | 'monomer' | 'conjugate' | 'not-recorded';
export const IMPORTED_MASS_BASIS_LABEL: Readonly<Record<ImportedMassBasis, string>> = {
    assembled: 'the assembled molecule as it exists in solution',
    monomer: 'a monomer or single chain',
    conjugate: 'a conjugate, including its label or payload',
    'not-recorded': 'not recorded',
};
export type VendorBasis = 'per-test-volume-stated' | 'per-test-volume-not-stated' | 'final-concentration' | 'none';
export const VENDOR_BASES: readonly VendorBasis[] = [
    'per-test-volume-stated',
    'per-test-volume-not-stated',
    'final-concentration',
    'none',
];
export const VENDOR_BASIS_LABEL: Readonly<Record<VendorBasis, string>> = {
    'per-test-volume-stated': 'per test, with the test volume stated by the vendor',
    'per-test-volume-not-stated': 'per test, test volume not stated by the vendor',
    'final-concentration': 'as a final concentration (µg/mL, or a dilution factor from stock, where a dilution of 1 in 100 is a factor of 100)',
    none: 'no vendor recommendation used',
};
export const VENDOR_BASIS_SHORT: Readonly<Record<VendorBasis, string>> = {
    'per-test-volume-stated': 'per test, vendor test volume stated',
    'per-test-volume-not-stated': 'per test, test volume not stated',
    'final-concentration': 'as a final concentration',
    none: 'no vendor recommendation used',
};
export type FormId = 1 | 2 | 3 | 4 | 5 | 6;
export const FORMS: readonly FormId[] = [1, 2, 3, 4, 5, 6];
export const FORM_LABEL: Readonly<Record<FormId, string>> = {
    1: 'volume of stock per test',
    2: 'mass per test',
    3: 'final mass concentration in the staining volume',
    4: 'dilution factor relative to stock',
    5: 'mass per 10⁶ cells',
    6: 'molar concentration in the staining volume',
};
export const FORM_UNIT: Readonly<Record<FormId, string>> = {
    1: 'uL',
    2: 'ug',
    3: 'ug/mL',
    4: 'x',
    5: 'ug/1e6-cells',
    6: 'M',
};
