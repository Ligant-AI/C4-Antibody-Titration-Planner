import { useState, type ReactNode } from 'react';
import { CONFIRM_TOOLTIP } from '../lib/suggestions';
interface Props {
    step: number;
    title: string;
    summary: string | null;
    complete: boolean;
    onConfirm?: () => void;
    confirmLabel?: string;
    children: ReactNode;
}
export function DeclarationPanel({ step, title, summary, complete, onConfirm, confirmLabel = 'Confirm these values', children, }: Props) {
    const [open, setOpen] = useState<boolean | null>(null);
    const expanded = open ?? !complete;
    return (<section className={expanded ? 'panel' : 'panel panel-collapsed'}>
      <div className="panel-head">
        <div className="titles">
          <span className="step">{step}</span>
          <h2>{title}</h2>
        </div>
        <div className="panel-head-actions">
          {onConfirm && (<button type="button" className="confirm-values" onClick={onConfirm} title={CONFIRM_TOOLTIP}>
              {confirmLabel}
            </button>)}
          {complete && (<button type="button" aria-expanded={expanded} onClick={() => setOpen(!expanded)} className="disclose">
              {expanded ? 'Collapse' : 'Change'}
            </button>)}
        </div>
      </div>
      {expanded ? (<div className="panel-body stack" style={{ gap: 14 }}>{children}</div>) : (<div className="panel-body panel-summary">{summary}</div>)}
    </section>);
}
