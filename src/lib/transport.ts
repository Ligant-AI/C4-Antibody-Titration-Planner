const FNV_OFFSET = 0xcbf29ce484222325n;
const FNV_PRIME = 0x100000001b3n;
const MASK_64 = 0xffffffffffffffffn;
export function canonicalise(value: unknown): string {
    if (value === null || typeof value !== 'object')
        return JSON.stringify(value) ?? 'null';
    if (Array.isArray(value))
        return `[${value.map(canonicalise).join(',')}]`;
    const entries = Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalise(v)}`).join(',')}}`;
}
export function checksum(value: unknown): string {
    const bytes = new TextEncoder().encode(canonicalise(value));
    let hash = FNV_OFFSET;
    for (const byte of bytes) {
        hash = ((hash ^ BigInt(byte)) * FNV_PRIME) & MASK_64;
    }
    return hash.toString(16).padStart(16, '0');
}
export type EnvelopeKind = 'c1-conversion' | 'c4-series';
export interface Envelope<T = unknown> {
    v: 1;
    kind: EnvelopeKind;
    payload: T;
    checksum: string;
}
function toBase64Url(text: string): string {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (const byte of bytes)
        binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromBase64Url(encoded: string): string {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}
export function encodeEnvelope<T>(kind: EnvelopeKind, payload: T): string {
    const envelope: Envelope<T> = { v: 1, kind, payload, checksum: checksum(payload) };
    return toBase64Url(JSON.stringify(envelope));
}
export type TransportFailure = 'not-decodable' | 'not-an-envelope' | 'unsupported-version' | 'wrong-kind' | 'checksum-mismatch' | 'flags-missing';
export interface TransportRejection {
    failure: TransportFailure;
    message: string;
}
export type DecodeOutcome<T> = {
    ok: true;
    payload: T;
} | {
    ok: false;
    rejection: TransportRejection;
};
const MESSAGES: Readonly<Record<TransportFailure, string>> = {
    'not-decodable': 'The imported object could not be decoded. The link is incomplete or was altered in transit; ask for it again rather than repairing it by hand.',
    'not-an-envelope': 'The imported data is not a result object from this tool set. It carries no envelope, so there is nothing to check it against.',
    'unsupported-version': 'The imported object uses a transport version this tool does not read. The tool that produced it is newer than this one.',
    'wrong-kind': 'The imported object is not of the kind this tool expected. A molecular weight was expected and something else arrived.',
    'checksum-mismatch': 'The imported object failed its integrity check: it was truncated, corrupted, or had fields removed after it was produced. It has not been used. This check detects accidental damage; it cannot detect a deliberate edit, because anyone editing the object can recompute the check.',
    'flags-missing': 'The imported object carries no flag list at all. An absent list is not the same as an empty one, and a value that arrived stripped of what qualifies it cannot be accepted.',
};
export function decodeEnvelope<T = unknown>(encoded: string, expected: EnvelopeKind, requireFlags = true): DecodeOutcome<T> {
    const reject = (failure: TransportFailure): DecodeOutcome<T> => ({
        ok: false,
        rejection: { failure, message: MESSAGES[failure] },
    });
    let parsed: unknown;
    try {
        parsed = JSON.parse(fromBase64Url(encoded));
    }
    catch {
        return reject('not-decodable');
    }
    if (typeof parsed !== 'object' || parsed === null)
        return reject('not-an-envelope');
    const envelope = parsed as Partial<Envelope<T>>;
    if (typeof envelope.checksum !== 'string' || envelope.payload === undefined) {
        return reject('not-an-envelope');
    }
    if (envelope.v !== 1)
        return reject('unsupported-version');
    if (envelope.kind !== expected)
        return reject('wrong-kind');
    if (checksum(envelope.payload) !== envelope.checksum)
        return reject('checksum-mismatch');
    if (requireFlags) {
        const payload = envelope.payload as {
            flags?: unknown;
        };
        if (!Array.isArray(payload?.flags))
            return reject('flags-missing');
    }
    return { ok: true, payload: envelope.payload as T };
}
export const INTEGRITY_SCOPE_STATEMENT = 'An imported object carries a check that detects accidental corruption, truncation, or removal ' +
    'of fields including its flags. This is an integrity check and not an authenticity check: it ' +
    'cannot detect a deliberate edit, because there is no server and no secret, and anyone who ' +
    'edits the object can recompute the check. This tool does not claim otherwise.';
