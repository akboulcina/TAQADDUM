import type { Meta, StoryObj } from '@storybook/react';

import { StatusBadge } from './StatusBadge.js';

const meta = {
  title: 'Components/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Success: Story = {
  args: { children: 'Active', tone: 'success' },
};

export const Warning: Story = {
  args: { children: 'Pending', tone: 'warning' },
};

export const Restricted: Story = {
  args: { children: 'Restricted', tone: 'restricted' },
};
