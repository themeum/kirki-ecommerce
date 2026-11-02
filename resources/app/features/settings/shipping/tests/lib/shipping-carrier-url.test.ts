import { describe, expect, it } from 'vitest';

import {
  getTrackingTemplateError,
  hasTrackingPlaceholder,
  isTrackingTemplate,
  resolveTrackingUrl,
  toTrackingTemplate,
} from '@/features/settings/shipping/lib/shipping-carrier-url';

const UPS_TEMPLATE = 'https://www.ups.com/track?loc=en_US&tracknum={tracking_number}';

describe('isTrackingTemplate', () => {
  it('accepts an http(s) URL holding the placeholder', () => {
    expect(isTrackingTemplate(UPS_TEMPLATE)).toBe(true);
    expect(isTrackingTemplate('http://example.test/{tracking_number}/{tracking_number}')).toBe(
      true,
    );
  });

  it('rejects a URL without the placeholder', () => {
    expect(isTrackingTemplate('https://www.ups.com/track')).toBe(false);
  });

  it('rejects other schemes and scheme-less URLs', () => {
    expect(isTrackingTemplate('javascript:alert({tracking_number})')).toBe(false);
    expect(isTrackingTemplate('ftp://example.test/{tracking_number}')).toBe(false);
    expect(isTrackingTemplate('//example.test/{tracking_number}')).toBe(false);
    expect(isTrackingTemplate('')).toBe(false);
  });
});

describe('hasTrackingPlaceholder', () => {
  it('detects the placeholder anywhere in the URL', () => {
    expect(hasTrackingPlaceholder(UPS_TEMPLATE)).toBe(true);
    expect(hasTrackingPlaceholder('https://x.test/{tracking_number}')).toBe(true);
    expect(hasTrackingPlaceholder('https://x.test/{tracking_url}')).toBe(false);
  });
});

describe('getTrackingTemplateError', () => {
  it('returns null for a valid template', () => {
    expect(getTrackingTemplateError(UPS_TEMPLATE)).toBeNull();
  });

  it('names the scheme problem first', () => {
    expect(getTrackingTemplateError('javascript:alert({tracking_number})')).toContain('http://');
  });

  it('names the missing placeholder', () => {
    expect(getTrackingTemplateError('https://www.ups.com/track')).toContain('{tracking_number}');
  });
});

describe('resolveTrackingUrl', () => {
  it('replaces the placeholder with the tracking number', () => {
    expect(resolveTrackingUrl(UPS_TEMPLATE, '1Z999AA10123456784')).toBe(
      'https://www.ups.com/track?loc=en_US&tracknum=1Z999AA10123456784',
    );
  });

  it('encodes spaces and ampersands so the number cannot break the link', () => {
    expect(resolveTrackingUrl(UPS_TEMPLATE, '1Z 999&A')).toBe(
      'https://www.ups.com/track?loc=en_US&tracknum=1Z%20999%26A',
    );
  });

  it('encodes the characters encodeURIComponent leaves alone, like the server', () => {
    expect(resolveTrackingUrl('https://x.test/{tracking_number}', "a!b'c(d)e*f")).toBe(
      'https://x.test/a%21b%27c%28d%29e%2Af',
    );
  });

  it('replaces every placeholder', () => {
    expect(resolveTrackingUrl('https://x.test/{tracking_number}/{tracking_number}', '123')).toBe(
      'https://x.test/123/123',
    );
  });
});

describe('toTrackingTemplate', () => {
  it('turns a resolved URL back into a template', () => {
    expect(
      toTrackingTemplate('https://www.ups.com/track?loc=en_US&tracknum=1Z%20999', '1Z 999'),
    ).toBe(UPS_TEMPLATE);
  });

  it('leaves a URL that does not hold the number unchanged', () => {
    expect(toTrackingTemplate('https://x.test/track', '123')).toBe('https://x.test/track');
    expect(toTrackingTemplate('https://x.test/123', '')).toBe('https://x.test/123');
  });
});
