export function ulp(v: number): number {
    const magnitude = Math.abs(v);
    if (!Number.isFinite(magnitude))
        return NaN;
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, magnitude);
    view.setBigUint64(0, view.getBigUint64(0) + 1n);
    return view.getFloat64(0) - magnitude;
}
export function ulpsBetween(a: number, b: number): number {
    if (a === b)
        return 0;
    if (!Number.isFinite(a) || !Number.isFinite(b))
        return Infinity;
    const spacing = ulp(Math.max(Math.abs(a), Math.abs(b)));
    return Math.abs(a - b) / spacing;
}
