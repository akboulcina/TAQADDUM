import { forwardRef, type HTMLAttributes } from 'react';

import './components.css';

export interface AlertBannerProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'info' | 'warning' | 'danger' | 'success';
  dismissible?: boolean;
  onDismiss?: () => void;
  dismissLabel?: string;
}

export const AlertBanner = forwardRef<HTMLDivElement, AlertBannerProps>(function AlertBanner(
  {
    tone = 'info',
    dismissible = false,
    onDismiss,
    dismissLabel = 'Dismiss',
    className = '',
    children,
    ...props
  },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      role="status"
      className={['ui-alert', `ui-alert--${tone}`, className].filter(Boolean).join(' ')}
    >
      <div className="ui-alert__content">{children}</div>
      {dismissible ? (
        <button
          type="button"
          className="ui-alert__dismiss"
          aria-label={dismissLabel}
          onClick={onDismiss}
        >
          ×
        </button>
      ) : null}
    </div>
  );
});
