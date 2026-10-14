import type { SeriesResult } from './compute';
import { computeSeries } from './compute';
import { DISPLAY_SIG_FIGS, ROUNDING_MODE, formatSigFigs } from './format';
import type { FormValue } from './forms';
import type { Flag, FlagCode } from './flags';
import { DETERMINES_NOT_VERIFIES_STATEMENT, DILUTION_CONVENTION_STATEMENT, SCOPE_STATEMENT, STAINING_VOLUME_STATEMENT, THRESHOLD_EVALUATION_STATEMENT, } from './flags';
import { PRECISION_STATEMENT } from './format';
import { TOOL_ID, TOOL_NAME } from './site';
import { FORMS, FORM_LABEL, type FormId } from './units';
import type { SeriesInputs } from './normalise';
export const SCHEMA_NAME = 'ligant-benchtools-c4-series';
export const SCHEMA_VERSION = '2.0.0';
export interface Quantity<U extends string = string> {
    value: number;
    unit: U;
    underflowed: boolean;
}
export interface AbsentForm {
    state: 'not-computable' | 'withheld';
    reason: string;
}
export type StructuredForm = ({
    state: 'computed';
} & Quantity) | AbsentForm;
export interface StructuredFlag {
    code: FlagCode;
    message: string;
    evaluatedOn: string;
    kind: Flag['kind'];
    points?: number[];
    remedy?: string;
}
export interface StructuredPoint {
    index: number;
    forms: Record<string, StructuredForm>;
    flags: StructuredFlag[];
    vendorMultiple: {
        atVendorTestVolume: number;
        atStainingVolume: number;
        identical: boolean;
    } | null;
    displayed: Record<string, string>;
}
export interface StructuredResult {
    schema: {
        name: string;
        version: string;
    };
    tool: {
        id: string;
        name: string;
        engineVersion: string;
    };
    series: {
        pointCount: number;
        dilutionFactor: number;
        generationMethod: string;
        anchor: {
            basis: 'concentration' | 'volume';
            value: number;
            unit: string;
        };
        points: StructuredPoint[];
    };
    inputs: SeriesInputs;
    declarations: {
        stockSource: string;
        stockMassBasis: string | null;
        vendorBasis: string;
        vendorTestVolume: Quantity | null;
        vendorCellNumber: Quantity | null;
        pipettingMinimum: Quantity & {
            provenance: 'entered' | 'default';
        };
        cellDensity: Quantity;
        imported: {
            molecularWeight: Quantity;
            provenance: string;
            massBasis: string;
            flags: {
                code: string;
                message: string;
            }[];
            toolVersion: string;
        } | null;
    };
    displayed: {
        significantFigures: number;
        roundingMode: typeof ROUNDING_MODE;
    };
    flags: StructuredFlag[];
    derivation: {
        relations: string[];
        unitHandling: string;
        assumptions: string[];
    };
    statements: {
        scope: string;
        precision: string;
        stainingVolume: string;
        dilutionConvention: string;
        determinesNotVerifies: string;
        thresholdEvaluation: string;
    };
}
const UNIT_HANDLING = 'Every quantity is converted to a base unit exactly once, at entry: microlitres, micrograms ' +
    'per millilitre, and cells. The unit factors are folded into one constant per reported form, ' +
    'so no value is normalised twice and no form is derived from another form that has already ' +
    'been rounded.';
function toStructuredFlag(flag: Flag): StructuredFlag {
    const structured: StructuredFlag = {
        code: flag.code,
        message: flag.message,
        evaluatedOn: flag.evaluatedOn,
        kind: flag.kind,
    };
    if (flag.points !== undefined)
        structured.points = [...flag.points];
    if (flag.remedy !== undefined)
        structured.remedy = flag.remedy;
    return structured;
}
function toStructuredForm(form: FormValue, sourceIsNonZero: boolean): StructuredForm {
    if (form.state !== 'computed')
        return { state: form.state, reason: form.reason };
    return {
        state: 'computed',
        value: form.value,
        unit: form.unit,
        underflowed: form.value === 0 && sourceIsNonZero,
    };
}
export function toStructuredResult(result: SeriesResult): StructuredResult {
    const { inputs, normalised: base } = result;
    const pointFlags = (index: number): StructuredFlag[] => result.flags.filter((f) => f.points?.includes(index)).map(toStructuredFlag);
    return {
        schema: { name: SCHEMA_NAME, version: SCHEMA_VERSION },
        tool: { id: TOOL_ID, name: TOOL_NAME, engineVersion: result.engineVersion },
        series: {
            pointCount: inputs.points,
            dilutionFactor: inputs.dilutionFactor,
            generationMethod: result.generationMethod,
            anchor: result.anchor.kind === 'concentration'
                ? { basis: 'concentration', value: result.anchor.ugPerMl, unit: 'ug/mL' }
                : { basis: 'volume', value: result.anchor.ul, unit: 'uL' },
            points: result.points.map((point) => {
                const sourceIsNonZero = point.concentrationUgPerMl !== null ? point.concentrationUgPerMl > 0 : (point.volumeUl ?? 0) > 0;
                const forms: Record<string, StructuredForm> = {};
                const displayed: Record<string, string> = {};
                for (const id of FORMS) {
                    const structured = toStructuredForm(point.forms[id], sourceIsNonZero);
                    forms[String(id)] = structured;
                    displayed[String(id)] =
                        structured.state === 'computed' ? formatSigFigs(structured.value) : structured.reason;
                }
                return {
                    index: point.index,
                    forms,
                    flags: pointFlags(point.index),
                    vendorMultiple: point.vendorMultiple,
                    displayed,
                };
            }),
        },
        inputs,
        declarations: {
            stockSource: inputs.stockSource,
            stockMassBasis: inputs.stock.kind === 'stated' ? inputs.stock.massBasis : null,
            vendorBasis: inputs.vendor.basis,
            vendorTestVolume: result.vendor?.vendorTestVolumeUl != null
                ? { value: result.vendor.vendorTestVolumeUl, unit: 'uL', underflowed: false }
                : null,
            vendorCellNumber: result.vendor?.vendorCells != null
                ? { value: result.vendor.vendorCells, unit: 'cells', underflowed: false }
                : null,
            pipettingMinimum: {
                value: base.pipettingMinimumUl,
                unit: 'uL',
                underflowed: false,
                provenance: inputs.pipettingMinimum.provenance,
            },
            cellDensity: { value: base.cellsPerUl, unit: 'cells/uL', underflowed: false },
            imported: inputs.imported === null
                ? null
                : {
                    molecularWeight: { value: inputs.imported.gPerMol, unit: 'g/mol', underflowed: false },
                    provenance: inputs.imported.provenance,
                    massBasis: inputs.imported.massBasis,
                    flags: inputs.imported.flags.map((f) => ({ code: f.code, message: f.message })),
                    toolVersion: inputs.imported.toolVersion,
                },
        },
        displayed: { significantFigures: DISPLAY_SIG_FIGS, roundingMode: ROUNDING_MODE },
        flags: result.flags.map(toStructuredFlag),
        derivation: {
            relations: [...result.relations],
            unitHandling: UNIT_HANDLING,
            assumptions: [...result.assumptions],
        },
        statements: {
            scope: SCOPE_STATEMENT,
            precision: PRECISION_STATEMENT,
            stainingVolume: STAINING_VOLUME_STATEMENT,
            dilutionConvention: DILUTION_CONVENTION_STATEMENT,
            determinesNotVerifies: DETERMINES_NOT_VERIFIES_STATEMENT,
            thresholdEvaluation: THRESHOLD_EVALUATION_STATEMENT,
        },
    };
}
export function toJson(result: SeriesResult): string {
    return JSON.stringify(toStructuredResult(result), null, 2);
}
export function reproduceFrom(obj: StructuredResult): SeriesResult {
    const outcome = computeSeries(obj.inputs);
    if (!outcome.ok) {
        throw new Error(`the structured object did not reproduce: ${outcome.rejections.map((r) => r.code).join(', ')}`);
    }
    return outcome;
}
export interface ValidationProblem {
    path: string;
    problem: string;
}
export function validateStructuredResult(obj: unknown): ValidationProblem[] {
    const problems: ValidationProblem[] = [];
    const fail = (path: string, problem: string) => problems.push({ path, problem });
    if (typeof obj !== 'object' || obj === null)
        return [{ path: '', problem: 'not an object' }];
    const o = obj as Record<string, any>;
    if (o.schema?.name !== SCHEMA_NAME)
        fail('schema.name', `expected ${SCHEMA_NAME}`);
    if (typeof o.schema?.version !== 'string' || !o.schema.version)
        fail('schema.version', 'missing');
    if (typeof o.tool?.engineVersion !== 'string' || !o.tool.engineVersion) {
        fail('tool.engineVersion', 'missing: C4-NF-06 and C4-OUT-01 require it on the output');
    }
    const points = o.series?.points;
    if (!Array.isArray(points) || points.length === 0) {
        fail('series.points', 'missing: a series is an ordered set of points');
    }
    else {
        points.forEach((point: any, i: number) => {
            const at = `series.points[${i}]`;
            if (point?.index !== i + 1)
                fail(`${at}.index`, 'points are one-based and in order');
            if (!Array.isArray(point?.flags)) {
                fail(`${at}.flags`, 'missing: C4-OUT-04 requires point-level flag scope in addition to the series-level array');
            }
            for (const id of FORMS) {
                const form = point?.forms?.[String(id)];
                const path = `${at}.forms.${id}`;
                if (typeof form !== 'object' || form === null) {
                    fail(path, `missing: ${FORM_LABEL[id as FormId]} must be reported or say why not`);
                    continue;
                }
                if (form.state === 'computed') {
                    if (typeof form.value !== 'number' || !Number.isFinite(form.value)) {
                        fail(`${path}.value`, 'not a finite number');
                    }
                    if (typeof form.unit !== 'string' || form.unit === '') {
                        fail(`${path}.unit`, 'C4-OUT-03 requires a unit attached to every quantity');
                    }
                    if (typeof form.underflowed !== 'boolean') {
                        fail(`${path}.underflowed`, 'missing: a zero that is not the value must be marked');
                    }
                }
                else if (form.state === 'not-computable' || form.state === 'withheld') {
                    if (typeof form.reason !== 'string' || !form.reason) {
                        fail(`${path}.reason`, 'missing: C4-UN-05 requires an uncomputable form to be reported as such, not as zero or blank');
                    }
                }
                else {
                    fail(`${path}.state`, 'not one of computed, not-computable, withheld');
                }
            }
        });
    }
    if (typeof o.series?.generationMethod !== 'string' || !o.series.generationMethod) {
        fail('series.generationMethod', 'missing: C4-IV-06 requires the method to be stated');
    }
    const minimum = o.declarations?.pipettingMinimum;
    if (typeof minimum?.value !== 'number')
        fail('declarations.pipettingMinimum.value', 'missing');
    if (minimum?.provenance !== 'entered' && minimum?.provenance !== 'default') {
        fail('declarations.pipettingMinimum.provenance', 'missing: C4-SR-05 requires whether the minimum was entered or defaulted');
    }
    if (typeof o.declarations?.cellDensity?.value !== 'number') {
        fail('declarations.cellDensity', 'missing: C4-SC-04 requires it on the output');
    }
    if (typeof o.declarations?.stockSource !== 'string' || !o.declarations.stockSource) {
        fail('declarations.stockSource', 'missing: C4-AB-04 makes it required');
    }
    if (!Array.isArray(o.flags)) {
        fail('flags', 'missing: an empty array is the no-flags case and is not the same as absent');
    }
    else {
        o.flags.forEach((f: any, i: number) => {
            if (!/^C4-FL-(0[1-9]|1[01])$/.test(f?.code ?? '')) {
                fail(`flags[${i}].code`, 'not a machine-readable reason code');
            }
            if (typeof f?.message !== 'string' || !f.message)
                fail(`flags[${i}].message`, 'missing');
            if (!['threshold', 'declaration', 'import'].includes(f?.kind))
                fail(`flags[${i}].kind`, 'missing');
        });
    }
    if (o.displayed?.significantFigures !== DISPLAY_SIG_FIGS) {
        fail('displayed.significantFigures', 'not the displayed precision');
    }
    if (o.displayed?.roundingMode !== ROUNDING_MODE)
        fail('displayed.roundingMode', 'not stated');
    if (!Array.isArray(o.derivation?.relations) || o.derivation.relations.length === 0) {
        fail('derivation.relations', 'missing: C4-DT-02');
    }
    for (const key of [
        'scope',
        'precision',
        'stainingVolume',
        'dilutionConvention',
        'determinesNotVerifies',
        'thresholdEvaluation',
    ]) {
        if (typeof o.statements?.[key] !== 'string' || !o.statements[key]) {
            fail(`statements.${key}`, 'missing');
        }
    }
    return problems;
}
