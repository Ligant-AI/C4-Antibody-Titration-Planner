import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode, } from 'react';
import { FIELD_GUIDANCE } from '../../lib/guidance';
interface FieldHelpState {
    openId: string | null;
    setOpenId: (id: string | null) => void;
}
const FieldHelpContext = createContext<FieldHelpState>({ openId: null, setOpenId: () => { } });
export function FieldHelpProvider({ children }: {
    children: ReactNode;
}) {
    const [openId, setOpenId] = useState<string | null>(null);
    return (<FieldHelpContext.Provider value={{ openId, setOpenId }}>{children}</FieldHelpContext.Provider>);
}
const PANEL_WIDTH = 320;
const VIEWPORT_MARGIN = 12;
const GAP = 8;
interface Props {
    id: string;
    label: string;
    text?: string;
}
export function FieldHelp({ id, label, text }: Props) {
    const { openId, setOpenId } = useContext(FieldHelpContext);
    const open = openId === id;
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const [position, setPosition] = useState<{
        top: number;
        left: number;
    } | null>(null);
    const body = text ?? FIELD_GUIDANCE[id] ?? '';
    const close = useCallback(() => {
        setOpenId(null);
        triggerRef.current?.focus();
    }, [setOpenId]);
    useLayoutEffect(() => {
        if (!open) {
            setPosition(null);
            return;
        }
        const trigger = triggerRef.current;
        const panel = panelRef.current;
        if (trigger === null || panel === null)
            return;
        const rect = trigger.getBoundingClientRect();
        const height = panel.offsetHeight;
        let left = rect.right + GAP;
        if (left + PANEL_WIDTH + VIEWPORT_MARGIN > window.innerWidth) {
            left = rect.left - PANEL_WIDTH - GAP;
        }
        if (left < VIEWPORT_MARGIN)
            left = VIEWPORT_MARGIN;
        let top = rect.top - 4;
        if (top + height + VIEWPORT_MARGIN > window.innerHeight) {
            top = window.innerHeight - height - VIEWPORT_MARGIN;
        }
        if (top < VIEWPORT_MARGIN)
            top = VIEWPORT_MARGIN;
        setPosition({ top, left });
    }, [open, body]);
    useLayoutEffect(() => {
        if (open && position !== null)
            panelRef.current?.focus();
    }, [open, position !== null]);
    useEffect(() => {
        if (!open)
            return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                close();
            }
        };
        const onPointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (panelRef.current?.contains(target))
                return;
            if (triggerRef.current?.contains(target))
                return;
            close();
        };
        document.addEventListener('keydown', onKeyDown, true);
        document.addEventListener('mousedown', onPointerDown, true);
        return () => {
            document.removeEventListener('keydown', onKeyDown, true);
            document.removeEventListener('mousedown', onPointerDown, true);
        };
    }, [open, close]);
    if (body === '')
        return null;
    return (<>
      <button type="button" ref={triggerRef} className="field-help-trigger" data-help-for={id} aria-label={`What goes in this field: ${label}`} aria-expanded={open} onClick={() => setOpenId(open ? null : id)}>
        <span aria-hidden="true">?</span>
      </button>
      {open && (<div ref={panelRef} role="dialog" aria-label={label} tabIndex={-1} className="field-help-panel" style={{
                top: position?.top ?? -9999,
                left: position?.left ?? -9999,
                width: PANEL_WIDTH,
                visibility: position === null ? 'hidden' : 'visible',
            }}>
          {body}
        </div>)}
    </>);
}
