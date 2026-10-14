import { ulp } from './ulp';
export const DISPLAY_SIG_FIGS = 3;
export const ROUNDING_MODE = 'half-away-from-zero' as const;
export const PRECISION_STATEMENT = `Volumes and concentrations are displayed to ${DISPLAY_SIG_FIGS} significant figures, ` +
    'rounded half away from zero on the exact stored value. The unrounded value of every ' +
    'reported quantity is in the structured result.';
function exactDecimal(v: number): {
    digits: string;
    pointFromRight: number;
    negative: boolean;
} {
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, v);
    const bits = view.getBigUint64(0);
    const negative = bits >> 63n === 1n;
    const biasedExponent = Number((bits >> 52n) & 0x7ffn);
    const fraction = bits & 0xfffffffffffffn;
    const significand = biasedExponent === 0 ? fraction : fraction | (1n << 52n);
    const exponent2 = biasedExponent === 0 ? -1074 : biasedExponent - 1075;
    if (exponent2 >= 0) {
        return { digits: (significand << BigInt(exponent2)).toString(), pointFromRight: 0, negative };
    }
    const k = -exponent2;
    return { digits: (significand * 5n ** BigInt(k)).toString(), pointFromRight: k, negative };
}
function roundHalfAwayFromZero(digits: string, figs: number): {
    digits: string;
    carried: boolean;
} {
    if (digits.length <= figs)
        return { digits: digits.padEnd(figs, '0'), carried: false };
    const kept = digits.slice(0, figs);
    const first = digits[figs];
    if (first < '5')
        return { digits: kept, carried: false };
    const bumped = (BigInt(kept) + 1n).toString();
    if (bumped.length > figs)
        return { digits: bumped.slice(0, figs), carried: true };
    return { digits: bumped.padStart(figs, '0'), carried: false };
}
export function formatSigFigs(v: number, figs: number = DISPLAY_SIG_FIGS): string {
    if (!Number.isFinite(v))
        return 'n/a';
    if (v === 0)
        return figs > 1 ? `0.${'0'.repeat(figs - 1)}` : '0';
    const { digits, pointFromRight, negative } = exactDecimal(v);
    const trimmed = digits.replace(/^0+/, '') || '0';
    const leadingZeros = digits.length - trimmed.length;
    let exponent = digits.length - leadingZeros - pointFromRight - 1;
    const rounded = roundHalfAwayFromZero(trimmed, figs);
    if (rounded.carried)
        exponent += 1;
    const sign = negative ? '-' : '';
    const d = rounded.digits;
    if (exponent < -6 || exponent >= figs) {
        const mantissa = figs > 1 ? `${d[0]}.${d.slice(1)}` : d[0];
        return `${sign}${mantissa}e${exponent >= 0 ? '+' : '-'}${Math.abs(exponent)}`;
    }
    if (exponent >= 0) {
        const intPart = d.slice(0, exponent + 1);
        const fracPart = d.slice(exponent + 1);
        return `${sign}${intPart}${fracPart ? `.${fracPart}` : ''}`;
    }
    return `${sign}0.${'0'.repeat(-exponent - 1)}${d}`;
}
export function isExactTie(v: number, figs: number = DISPLAY_SIG_FIGS): boolean {
    if (!Number.isFinite(v) || v === 0)
        return false;
    const { digits } = exactDecimal(v);
    const trimmed = digits.replace(/^0+/, '').replace(/0+$/, '');
    return trimmed.length === figs + 1 && trimmed.endsWith('5');
}
export function ulpsFromDecimalTie(v: number, figs: number = DISPLAY_SIG_FIGS): number {
    if (!Number.isFinite(v) || v === 0)
        return Infinity;
    const { digits, pointFromRight } = exactDecimal(v);
    const trimmed = digits.replace(/^0+/, '');
    if (trimmed === '')
        return Infinity;
    if (trimmed.length <= figs)
        return Infinity;
    const leadingZeros = digits.length - trimmed.length;
    const exponent = digits.length - leadingZeros - pointFromRight - 1;
    const step = 10 ** (exponent - figs + 1);
    const remainder = Number(`0.${trimmed.slice(figs)}`);
    const distanceInSteps = Math.abs(remainder - 0.5);
    return (distanceInSteps * step) / ulp(v);
}
