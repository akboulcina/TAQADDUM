import { forwardRef, type HTMLAttributes } from 'react';

import './components.css';

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'restricted';
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(function StatusBadge(
  { tone = 'neutral', className = '', children, ...props },
  ref,
) {
  return (
    <span
      {...props}
      ref={ref}
      className={['ui-status-badge', `ui-status-badge--${tone}`, className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
});
