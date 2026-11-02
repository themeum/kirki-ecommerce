import { describe, expect, it } from 'vitest';

import { ActivitySchema } from '@/features/orders/schemas/catalog/activity';
import { ActivityFormSchema } from '@/features/orders/schemas/forms/activity-form';

describe('ActivityFormSchema', () => {
  it('sends the comment with the notify-customer flag', () => {
    const result = ActivityFormSchema.parse({
      message: 'Your parcel left the warehouse.',
      notify_customer: true,
    });

    expect(result).toEqual({ message: 'Your parcel left the warehouse.', notify_customer: true });
  });

  it('omits the notify-customer flag when it is not set', () => {
    const result = ActivityFormSchema.parse({ message: 'Internal note' });

    expect(result).toEqual({ message: 'Internal note' });
    expect(Object.keys(result)).not.toContain('notify_customer');
  });

  it('rejects an empty message', () => {
    expect(ActivityFormSchema.safeParse({ message: '', notify_customer: true }).success).toBe(
      false,
    );
  });
});

describe('ActivitySchema', () => {
  const comment = {
    id: 1,
    order_id: 7,
    activity_type: 'comment-added',
    description: 'Your parcel left the warehouse.',
    created_by: 2,
    author_name: 'Admin',
    created_at: '2 minutes ago',
  };

  it('reads the notify-customer flag of a comment', () => {
    expect(ActivitySchema.parse({ ...comment, notify_customer: true }).notify_customer).toBe(true);
  });

  it('accepts an activity without the notify-customer flag', () => {
    expect(ActivitySchema.parse(comment).notify_customer).toBeUndefined();
  });
});
