import type { ReactNode } from 'react';
export function Button({children,disabled=false}:{children:ReactNode;disabled?:boolean}){return <button disabled={disabled}>{children}</button>}
export function Text({children}:{children:ReactNode}){return <span>{children}</span>}
export function StatusBadge({children}:{children:ReactNode}){return <span role="status">{children}</span>}
export function AlertBanner({children}:{children:ReactNode}){return <div role="alert">{children}</div>}
