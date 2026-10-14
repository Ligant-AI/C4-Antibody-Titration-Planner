import { flagLabel, type Flag } from '../../lib/flags';
function FlagIcon() {
    return (<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5 15 14H1L8 1.5Z" fill="var(--brand-amber)"/>
      <path d="M8 6v3.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="8" cy="11.8" r="0.9" fill="#fff"/>
    </svg>);
}
export function FlagSummaryList({ flags }: {
    flags: readonly Flag[];
}) {
    if (flags.length === 0)
        return null;
    return (<ul className="flag-summary-list">
      {flags.map((flag) => (<li key={flag.code}>
          <details className="flag-summary">
            <summary>
              <strong>{flagLabel(flag.code)}</strong>: {flag.summary}
            </summary>
            <span>
              {flag.message}
              {flag.remedy && <span className="flag-remedy">{flag.remedy}</span>}
            </span>
          </details>
        </li>))}
    </ul>);
}
export function FlagList({ flags }: {
    flags: readonly Flag[];
}) {
    if (flags.length === 0)
        return null;
    return (<>
      {flags.map((flag) => (<div className="flag" key={flag.code}>
          <FlagIcon />
          <span>
            
            <strong>{flagLabel(flag.code)}</strong>{' '}
            {flag.message}
            {flag.remedy && <span className="flag-remedy">{flag.remedy}</span>}
          </span>
        </div>))}
    </>);
}
export function RejectionList({ rejections, }: {
    rejections: readonly {
        code: string;
        message: string;
    }[];
}) {
    if (rejections.length === 0)
        return null;
    return (<>
      {rejections.map((rejection) => (<div className="flag" key={rejection.code + rejection.message}>
          <FlagIcon />
          <span>
            {rejection.message}
          </span>
        </div>))}
    </>);
}
