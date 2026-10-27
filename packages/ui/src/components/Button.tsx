import { forwardRef, type ButtonHTMLAttributes } from 'react';

import './components.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    className = '',
    children,
    disabled,
    ...props
  },
  ref,
) {
  const classes = ['ui-button', `ui-button--${variant}`, `ui-button--${size}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...props}
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? <span className="ui-button__spinner" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
});
