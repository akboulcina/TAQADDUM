import type { ReactNode } from 'react';
export function Button({
  children,
  disabled = false,
  loading = false,
}: {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button type="button" disabled={disabled || loading} aria-busy={loading}>
      {loading ? '…' : children}
    </button>
  );
}
export function Text({ children }: { children: ReactNode }) {
  return <span>{children}</span>;
}
export function StatusBadge({ children }: { children: ReactNode }) {
  return <span role="status">{children}</span>;
}
export function AlertBanner({ children }: { children: ReactNode }) {
  return (
    <div role="alert" aria-live="polite">
      {children}
    </div>
  );
}
