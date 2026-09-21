import type { Meta, StoryObj } from '@storybook/react';

import { AlertBanner } from './AlertBanner.js';
import type { AlertBannerProps } from './AlertBanner.js';

const meta = {
  title: 'Components/AlertBanner',
  component: AlertBanner,
  tags: ['autodocs'],
} satisfies Meta<typeof AlertBanner>;

export default meta;
type Story = StoryObj<AlertBannerProps>;

export const Info: Story = {
  args: { children: 'Service ready', tone: 'info' },
};

export const Dismissible: Story = {
  args: {
    children: 'This message can be dismissed',
    tone: 'warning',
    dismissible: true,
    dismissLabel: 'Dismiss notification',
  },
};
