import { forwardRef, type ElementType, type HTMLAttributes } from 'react';

import './components.css';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: 'body-md' | 'body-sm' | 'label-md' | 'label-sm' | 'caption';
  as?: ElementType;
}

export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { variant = 'body-md', as: Component = 'span', className = '', children, ...props },
  ref,
) {
  return (
    <Component
      {...props}
      ref={ref}
      className={['ui-text', `ui-text--${variant}`, className].filter(Boolean).join(' ')}
    >
      {children}
    </Component>
  );
});
