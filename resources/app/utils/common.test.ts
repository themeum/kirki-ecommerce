import { beforeEach, describe, expect, it, vi } from 'vitest';

import { dispatchToastMessage } from '@/utils/common';

const { toastMock } = vi.hoisted(() => ({
  toastMock: {
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/ui/toast/toast', () => ({ toast: toastMock }));

describe('dispatchToastMessage', () => {
  beforeEach(() => {
    Object.values(toastMock).forEach((mock) => mock.mockReset());
  });

  it('sends no duration when the caller gives none', () => {
    dispatchToastMessage('success', { title: 'Payment gateway updated' });

    expect(toastMock.success).toHaveBeenCalledWith('Payment gateway updated', {
      duration: undefined,
    });
  });

  it('sends the duration that the caller gives', () => {
    dispatchToastMessage('warning', { title: 'Maximum quantity reached', duration: 3000 });

    expect(toastMock.warning).toHaveBeenCalledWith('Maximum quantity reached', { duration: 3000 });
  });

  it.each([
    ['success', 'success'],
    ['delete', 'success'],
    ['warning', 'warning'],
    ['error', 'error'],
    ['default', 'info'],
  ] as const)('shows a %s message as a %s toast', (variant, toastVariant) => {
    dispatchToastMessage(variant, { title: 'Message' });

    expect(toastMock[toastVariant]).toHaveBeenCalledTimes(1);
  });
});
