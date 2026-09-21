import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './Button.js';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { children: 'Create', variant: 'primary', size: 'md' },
};

export const Secondary: Story = {
  args: { children: 'Cancel', variant: 'secondary', size: 'md' },
};

export const Loading: Story = {
  args: { children: 'Saving…', loading: true },
};

export const ArabicRtl: Story = {
  args: { children: 'إنشاء' },
  parameters: { direction: 'rtl' },
};
