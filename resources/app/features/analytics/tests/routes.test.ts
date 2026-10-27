import { describe, expect, it } from 'vitest';

import { RouteConfig } from '@/config/route-config';

describe('RouteConfig.Analytics', () => {
  it('opens the Analytics page at #/analytics', () => {
    expect(RouteConfig.Analytics.template).toBe('/analytics');
    expect(RouteConfig.Analytics.buildLink()).toBe('/analytics');
  });
});
