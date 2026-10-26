import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AlertBanner, Button, StatusBadge, Text } from '../index.js';

describe('UI components', () => {
  it('renders Button variants and loading state', () => {
    const { rerender } = render(<Button variant="primary">Create</Button>);
    expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();

    rerender(
      <Button loading variant="secondary">
        Saving
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Saving' })).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders Text with the requested element', () => {
    render(
      <Text as="h2" variant="label-md">
        Heading
      </Text>,
    );
    expect(screen.getByRole('heading', { name: 'Heading' })).toBeInTheDocument();
  });

  it('renders StatusBadge tones', () => {
    render(<StatusBadge tone="success">Active</StatusBadge>);
    expect(screen.getByText('Active')).toHaveClass('ui-status-badge--success');
  });

  it('dismisses AlertBanner with an accessible button', () => {
    const onDismiss = vi.fn();
    render(
      <AlertBanner dismissible dismissLabel="Dismiss notification" onDismiss={onDismiss}>
        Service ready
      </AlertBanner>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
