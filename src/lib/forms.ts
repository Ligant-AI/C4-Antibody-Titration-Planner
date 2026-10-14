import { type FormId, FORM_UNIT } from './units';
import type { Normalised } from './normalise';
export type FormValue = {
    state: 'computed';
    value: number;
    unit: string;
} | {
    state: 'not-computable';
    reason: string;
} | {
    state: 'withheld';
    reason: string;
};
export type PointForms = Readonly<Record<FormId, FormValue>>;
export interface Point {
    index: number;
    concentrationUgPerMl: number | null;
    volumeUl: number | null;
    forms: PointForms;
}
const NOT_COMPUTABLE_NO_STOCK = 'not computable: the vendor states no mass concentration for this stock, so no mass-based form is determined';
const NOT_COMPUTABLE_NO_CELLS = 'not computable: no cells were declared, so there is no quantity of cells to express a mass per';
const NOT_COMPUTABLE_NO_IMPORT = 'not computable: no molecular weight has been imported, and this tool accepts none of its own';
export function formsAtConcentration(index: number, concentrationUgPerMl: number, base: Normalised, withheldReason: string | null): Point {
    const volumeUl = base.volumePerConcentration === null ? null : concentrationUgPerMl * base.volumePerConcentration;
    const form6: FormValue = withheldReason !== null
        ? { state: 'withheld', reason: withheldReason }
        : base.molarPerConcentration === null
            ? { state: 'not-computable', reason: NOT_COMPUTABLE_NO_IMPORT }
            : {
                state: 'computed',
                value: concentrationUgPerMl * base.molarPerConcentration,
                unit: FORM_UNIT[6],
            };
    return {
        index,
        concentrationUgPerMl,
        volumeUl,
        forms: {
            1: volumeUl === null
                ? { state: 'not-computable', reason: NOT_COMPUTABLE_NO_STOCK }
                : { state: 'computed', value: volumeUl, unit: FORM_UNIT[1] },
            2: {
                state: 'computed',
                value: concentrationUgPerMl * base.massPerConcentration,
                unit: FORM_UNIT[2],
            },
            3: { state: 'computed', value: concentrationUgPerMl, unit: FORM_UNIT[3] },
            4: base.stockUgPerMl === null
                ? { state: 'not-computable', reason: NOT_COMPUTABLE_NO_STOCK }
                : {
                    state: 'computed',
                    value: base.stockUgPerMl / concentrationUgPerMl,
                    unit: FORM_UNIT[4],
                },
            5: base.massPer1e6CellsPerConcentration === null
                ? { state: 'not-computable', reason: NOT_COMPUTABLE_NO_CELLS }
                : {
                    state: 'computed',
                    value: concentrationUgPerMl * base.massPer1e6CellsPerConcentration,
                    unit: FORM_UNIT[5],
                },
            6: form6,
        },
    };
}
export function formsAtVolume(index: number, volumeUl: number, base: Normalised): Point {
    const notComputable: FormValue = { state: 'not-computable', reason: NOT_COMPUTABLE_NO_STOCK };
    return {
        index,
        concentrationUgPerMl: null,
        volumeUl,
        forms: {
            1: { state: 'computed', value: volumeUl, unit: FORM_UNIT[1] },
            2: notComputable,
            3: notComputable,
            4: { state: 'computed', value: base.stainingVolumeUl / volumeUl, unit: FORM_UNIT[4] },
            5: notComputable,
            6: notComputable,
        },
    };
}
export function valueOf(form: FormValue): number | null {
    return form.state === 'computed' ? form.value : null;
}
