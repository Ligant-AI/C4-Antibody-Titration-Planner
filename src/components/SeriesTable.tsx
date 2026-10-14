import type { SeriesResult } from '../lib/compute';
import { flagLabel } from '../lib/flags';
import { formatSigFigs } from '../lib/format';
import type { FormValue } from '../lib/forms';
import { FORMS, FORM_LABEL, STOCK_MASS_BASIS_SHORT, STOCK_SOURCE_LABEL, UNIT_LABEL, VENDOR_BASIS_SHORT, type FormId, } from '../lib/units';
const FORM_HEADING: Readonly<Record<FormId, string>> = {
    1: 'µL / test',
    2: 'µg / test',
    3: 'µg/mL',
    4: '1 in',
    5: 'µg / 10⁶ cells',
    6: 'mol/L',
};
function Cell({ form }: {
    form: FormValue;
}) {
    if (form.state === 'computed')
        return <>{formatSigFigs(form.value)}</>;
    return <span className="absent">{form.state === 'withheld' ? 'withheld' : 'not computable'}</span>;
}
export function vendorMultipleAbsentReason(result: SeriesResult): string | null {
    const showVendorMultiple = result.points.some((p) => p.vendorMultiple !== null);
    if (result.vendor === null || showVendorMultiple)
        return null;
    return result.vendor.recommendedUgPerMl === null
        ? 'not computable: the vendor recommendation does not reduce to a concentration under the declared basis, so there is nothing here to compare the series against'
        : 'not computable: no stock concentration is stated, so this series is expressed as volumes only, and there is no concentration here for the vendor recommendation to be compared against';
}
export function SeriesTable({ result }: {
    result: SeriesResult;
}) {
    const flaggedPoints = new Set(result.flags.flatMap((f) => f.points ?? []));
    const showVendorMultiple = result.points.some((p) => p.vendorMultiple !== null);
    const multiplesDiffer = result.points.some((p) => p.vendorMultiple?.identical === false);
    const absentForms = FORMS.map((id) => ({ id, form: result.points[0].forms[id] })).filter((entry): entry is {
        id: FormId;
        form: Extract<FormValue, {
            state: 'not-computable' | 'withheld';
        }>;
    } => entry.form.state !== 'computed');
    const vendorMultipleAbsent = vendorMultipleAbsentReason(result);
    return (<>
      <div className="table-scroll">
        <table className="series-table">
          <caption>
            The titration series, in every form computable from the declarations, at{' '}
            {formatSigFigs(result.normalised.stainingVolumeUl)} µL and{' '}
            {formatSigFigs(result.normalised.cells)} cells
          </caption>
          <thead>
            <tr>
              <th scope="col">Point</th>
              {FORMS.map((id) => (<th scope="col" key={id} title={FORM_LABEL[id]}>
                  {FORM_HEADING[id]}
                </th>))}
              {showVendorMultiple && (<>
                  <th scope="col" title="Multiple of the vendor recommendation at the vendor's own test volume">
                    {multiplesDiffer ? 'x rec, vendor vol' : 'x rec'}
                  </th>
                  {multiplesDiffer && (<th scope="col" title="Multiple of the vendor's stated amount placed in this staining volume">
                      x rec, this vol
                    </th>)}
                </>)}
            </tr>
          </thead>
          <tbody>
            {result.points.map((point) => (<tr key={point.index} className={flaggedPoints.has(point.index) ? 'point-flagged' : undefined}>
                <th scope="row">{point.index}</th>
                {FORMS.map((id) => (<td key={id} className="num">
                    <Cell form={point.forms[id]}/>
                  </td>))}
                {showVendorMultiple && (<>
                    <td className="num">
                      {point.vendorMultiple ? formatSigFigs(point.vendorMultiple.atVendorTestVolume) : ''}
                    </td>
                    {multiplesDiffer && (<td className="num">
                        {point.vendorMultiple ? formatSigFigs(point.vendorMultiple.atStainingVolume) : ''}
                      </td>)}
                  </>)}
              </tr>))}
          </tbody>
        </table>
      </div>

      {(absentForms.length > 0 || vendorMultipleAbsent !== null) && (<ul className="form-notes">
          {absentForms.map(({ id, form }) => (<li key={id}>
              <b>
                Form {id}, {FORM_LABEL[id]}
              </b>
              {form.reason}
            </li>))}
          {vendorMultipleAbsent !== null && (<li>
              <b>Multiple of the vendor recommendation</b>
              {vendorMultipleAbsent}
            </li>)}
        </ul>)}

      {multiplesDiffer && (<p className="hint">
          The two vendor multiples differ because the staining volume differs from the vendor's
          stated test volume. The first compares each point against the concentration the vendor
          recommended in their own tube; the second against the concentration their stated amount
          would reach in yours.
        </p>)}
    </>);
}
export function vendorBasisSummary(result: SeriesResult): string {
    const label = VENDOR_BASIS_SHORT[result.inputs.vendor.basis];
    if (result.vendor === null || result.vendor.recommendedUgPerMl === null)
        return label;
    const concentration = `${formatSigFigs(result.vendor.recommendedUgPerMl)} ${UNIT_LABEL['ug/mL']}`;
    return result.inputs.vendor.basis === 'final-concentration'
        ? `${label}, ${concentration}`
        : `${label}, ${concentration} at the vendor's volume`;
}
export function notebookLine(result: SeriesResult): string {
    const points = result.points
        .map((point) => {
        const volume = point.forms[1];
        const concentration = point.forms[3];
        const massPerTest = point.forms[2];
        const massPer1e6Cells = point.forms[5];
        const parts = [`${point.index}:`];
        if (volume.state === 'computed')
            parts.push(`${formatSigFigs(volume.value)} ${UNIT_LABEL.uL}`);
        if (concentration.state === 'computed') {
            parts.push(`(${formatSigFigs(concentration.value)} ${UNIT_LABEL['ug/mL']})`);
        }
        if (massPerTest.state === 'computed') {
            parts.push(`${formatSigFigs(massPerTest.value)} ${UNIT_LABEL.ug}/test`);
        }
        if (massPer1e6Cells.state === 'computed') {
            parts.push(`${formatSigFigs(massPer1e6Cells.value)} ${UNIT_LABEL.ug}/10⁶ cells`);
        }
        return parts.join(' ');
    })
        .join('; ');
    const stock = result.inputs.stock.kind === 'stated'
        ? `Stock ${result.inputs.stock.concentration.value} ${UNIT_LABEL[result.inputs.stock.concentration.unit]}, ` +
            `${STOCK_MASS_BASIS_SHORT[result.inputs.stock.massBasis]}, ${STOCK_SOURCE_LABEL[result.inputs.stockSource]}.`
        : 'Stock concentration not stated by the vendor.';
    const vendor = result.inputs.vendor.basis === 'none' ? '' : ` Vendor: ${vendorBasisSummary(result)}.`;
    const pipettingMinimum = ` Pipetting minimum ${formatSigFigs(result.normalised.pipettingMinimumUl)} ${UNIT_LABEL.uL} ` +
        `(${result.inputs.pipettingMinimum.provenance}).`;
    const flags = result.flags.length > 0
        ? ` Flags: ${result.flags.map((f) => `${flagLabel(f.code)} (${f.summary})`).join('; ')}.`
        : '';
    return (`Titration series, ${result.inputs.points} points, ${formatSigFigs(result.inputs.dilutionFactor)}-fold. ` +
        `Staining volume ${formatSigFigs(result.normalised.stainingVolumeUl)} ${UNIT_LABEL.uL} (final, including antibody), ` +
        `${formatSigFigs(result.normalised.cells)} cells. ${stock}${vendor}${pipettingMinimum} ` +
        `Points ${points}.${flags} ` +
        `Ligant Bench Tools: Antibody Titration Planner, engine ${result.engineVersion}. 3 sf, half away from zero.`);
}
