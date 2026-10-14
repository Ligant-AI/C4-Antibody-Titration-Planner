import type { SeriesResult } from '../lib/compute';
import { PrivacyPanel } from './shared/PrivacyPanel';
import { CONSTANTS_REGISTER, DETERMINES_NOT_VERIFIES_STATEMENT, DILUTION_CONVENTION_STATEMENT, FLAG_LEGEND, flagLabel, PRECISION_PRINCIPLE, ARITHMETIC_CHECKS_STATEMENT, SCOPE_STATEMENT, STAINING_VOLUME_STATEMENT, THRESHOLD_EVALUATION_STATEMENT, UNDETECTABLE_FAILURES, } from '../lib/flags';
import { PRECISION_STATEMENT } from '../lib/format';
import { INTEGRITY_SCOPE_STATEMENT } from '../lib/transport';
function withEmphasis(text: string) {
    return text.split(/(\*[^*]+\*)/g).map((part, i) => part.startsWith('*') && part.endsWith('*') && part.length > 2 ? (<strong key={i}>{part.slice(1, -1)}</strong>) : (part));
}
interface Props {
    result: SeriesResult | null;
    importAttempted: boolean;
}
export function Method({ result, importAttempted }: Props) {
    return (<section className="panel method-panel">
      <div className="panel-head">
        <div className="titles">
          <h2>About this calculator</h2>
        </div>
      </div>
      <div className="panel-body prose">
        <h3>What it does</h3>
        <p>
          This tool plans an antibody titration series for flow cytometry. For the staining volume and the
          cell number you declare, it gives the antibody concentration at each point of the series
          in every form the bench and the method record need: volume of stock to pipette, mass per
          test, final concentration, dilution from stock, mass per 10⁶ cells and, where a molecular
          weight is supplied, molar concentration.
        </p>
        <p>
          It also records the basis of any vendor recommendation you enter, so you can see at once
          whether that recommendation carries over to your own volume and cell number.
        </p>

        <h3>How to use it</h3>
        <ol>
          <li>
            <strong>Antibody stock.</strong> Choose whether the vendor states a concentration. If it
            does, enter it as printed on the vial or certificate, with its unit. Say whether that
            mass is the antibody protein or the whole conjugate (fluorochrome datasheets usually quote
            the antibody protein; check the wording), and where the number came from. "Not recorded" is an accepted answer and
            is shown on the output.
          </li>
          <li>
            <strong>Vendor recommendation (optional).</strong> Choose how the datasheet states it:
            an amount per test with or without a test volume, or a final concentration. Enter the
            amount, the test volume and the number of cells it was determined at, as the datasheet
            gives them. "Not stated" is a valid answer for the volume and the cells. A series
            anchored on a top point you chose is also a legitimate design.
          </li>
          <li>
            <strong>Staining context.</strong> Enter the final volume of your stain, including the
            antibody and every other reagent, and the number of cells in one test. Then enter the
            smallest volume your pipette delivers reliably; 2 µL is offered as a starting point and
            is marked as a suggestion. Units and suggested values are confirmed with the button on
            the panel.
          </li>
          <li>
            <strong>Series design.</strong> Enter the top point, the most concentrated one, and say
            which form you are entering it in (there is no default, because the forms differ by
            factors of your volume, stock concentration and cell number). Enter the dilution factor
            (1 in 100 is a factor of 100) and the number of points, from 2 to 12.
          </li>
          <li>
            <strong>Read the series.</strong> Each point is shown in every form that can be computed.
            A form that cannot be computed is marked as withheld or not computable, with the reason,
            and is never shown as zero. Amber flags say what to check.
          </li>
          <li>
            <strong>Copy the result.</strong> "Copy for notebook" copies the series, the
            declarations it rests on, the flags and the engine version as one line. The structured
            result below it carries the unrounded value and unit of every quantity.
          </li>
        </ol>

        <h3>How it works</h3>
        <p>
          How much antibody binds is set by the free antibody concentration. Where the cells’
          antigen sites take up a significant share of the antibody added (many cells, dense
          antigen, a small volume), binding depletes the free antibody, and the amount of antibody
          per cell then matters as well. Which situation applies depends on antigen density,
          affinity and cell number, which a datasheet does not usually state. A recommendation of
          "5 µL per test" carries neither a concentration nor an amount per cell unless the volume
          and the cell number of that test are also stated, which is why the tool asks you to
          declare them.
        </p>
        <p>
          The top point is converted to a concentration in the staining volume, and each later point
          is the top point divided by the dilution factor raised to the power of its position minus
          one. Every other form follows from that concentration. Every quantity is converted to a
          base unit exactly once, on entry, and the unit factors are folded into one constant per
          reported form, so nothing is converted twice.
        </p>
        <h4>Relations applied</h4>
        {result !== null ? (<>
            <p>The relations applied to produce the series on this page:</p>
            <ul>
              {result.relations.map((relation) => (<li key={relation}>{relation}</li>))}
            </ul>
            <p className="hint">{result.generationMethod}</p>
          </>) : (<p>
            Once a series is computed, the relations applied to it are listed here, with every
            declaration in them.
          </p>)}

        <h4>Constants and assumptions</h4>
        <p>
          Every threshold at which this tool changes behaviour, and every convention under which a
          value is interpreted, with its value and why it holds. Thresholds chosen by inspection are
          stated as such. The principle they follow: <em>{PRECISION_PRINCIPLE}</em>
        </p>
        <div className="table-scroll">
          <table className="register-table">
            <caption>Constants and assumptions</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Value</th>
                <th scope="col">Why</th>
              </tr>
            </thead>
            <tbody>
              {CONSTANTS_REGISTER.map((entry) => (<tr key={entry.id}>
                  <th scope="row">{entry.label}</th>
                  <td>{entry.value}</td>
                  <td className="prose-cell">
                    {entry.basis === 'inspection' ? 'Chosen by inspection. ' : ''}
                    {entry.reason}
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>

        <h4>Precision, rounding and engine version</h4>
        <ul>
          <li>{STAINING_VOLUME_STATEMENT}</li>
          <li>{DILUTION_CONVENTION_STATEMENT}</li>
          <li>{PRECISION_STATEMENT}</li>
          <li>{THRESHOLD_EVALUATION_STATEMENT}</li>
          <li>{ARITHMETIC_CHECKS_STATEMENT}</li>
          <li>
            {result !== null
            ? `Engine ${result.engineVersion}. `
            : 'Every result is stamped with the engine version. '}
            The version changes whenever the calculation changes, so two results with the same
            engine version come from the same arithmetic.
          </li>
          {importAttempted && <li>{INTEGRITY_SCOPE_STATEMENT}</li>}
        </ul>

        <h4>Flags</h4>
        <p>
          A flag never blocks the series. It keeps the number and says in words what to check. The
          short code is the same one carried in the structured result.
        </p>
        <div className="table-scroll">
          <table className="register-table">
            <caption>Flags, what they mean and what to do</caption>
            <thead>
              <tr>
                <th scope="col">Code</th>
                <th scope="col">What it means</th>
                <th scope="col">What to do</th>
              </tr>
            </thead>
            <tbody>
              {FLAG_LEGEND.map((entry) => (<tr key={entry.code}>
                  <th scope="row">{flagLabel(entry.code)}</th>
                  <td className="prose-cell">{entry.meaning}</td>
                  <td className="prose-cell">{entry.action}</td>
                </tr>))}
            </tbody>
          </table>
        </div>

        <h3>Why not a spreadsheet?</h3>
        <ul>
          <li>
            <strong>The declarations cannot be skipped.</strong> A lab that titrates in 100 µL and
            stains in 50 µL has doubled the concentration and will not see it, because the volume
            pipetted is identical. A lab that titrates at 1 × 10⁶ cells and stains at 5 × 10⁶ has cut
            the amount per cell fivefold and will not see that either. A spreadsheet can return a
            clean list of volumes in both cases without the context that makes them wrong. Here the
            staining volume, the cell number and the basis of the vendor recommendation are required,
            and they appear in the result.
          </li>
          <li>
            <strong>Every assumption is a recorded choice, not a hidden cell.</strong> The
            conventions, constants and defaults are listed above, and whether the pipetting minimum
            was entered or left at the suggestion is on the output.
          </li>
          <li>
            <strong>Units are carried and checked.</strong> Every quantity has a unit, a unit is
            never inferred from the size of a number, and a form that cannot be computed is reported
            as such rather than as zero or a blank.
          </li>
          <li>
            <strong>Rounding happens once, on display.</strong> Values are shown to three
            significant figures and the unrounded value is kept, so a figure is never rounded and
            then reused.
          </li>
          <li>
            <strong>Flags say in words what to check, and the copy-out records all of it.</strong>{' '}
            The same inputs always give the same output, and the notebook line and the structured
            result carry the declarations, the flags and the engine version with the numbers.
          </li>
        </ul>

        <h3>What it does not do</h3>
        <p>
          It does not prepare the series, does not analyse the resulting data, does not choose the
          optimal point, and does not determine whether any point saturates the target.
        </p>
        <p>
          <strong>{DETERMINES_NOT_VERIFIES_STATEMENT}</strong>
        </p>
        <p>
          The tool guarantees that the series arithmetic is correct and that the staining volume,
          cell number, recommendation basis, stock mass basis and pipetting minimum are recorded. It
          cannot detect any of the following.
        </p>
        <ul>
          {UNDETECTABLE_FAILURES.map((failure) => (<li key={failure}>{withEmphasis(failure)}</li>))}
        </ul>
        <p>
          <strong>{SCOPE_STATEMENT}</strong>
        </p>

        <PrivacyPanel />
      </div>
    </section>);
}
