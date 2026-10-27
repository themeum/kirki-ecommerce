<?php

namespace Kirki\Ecommerce\Tests\Unit\Supports;

use Kirki\Ecommerce\App\Supports\TrackingUrl;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class TrackingUrlTest extends TestCase
{
    public function test_template_needs_http_scheme_and_placeholder(): void
    {
        $this->assertTrue(TrackingUrl::is_template('https://www.ups.com/track?loc=en_US&tracknum={tracking_number}'));
        $this->assertTrue(TrackingUrl::is_template('http://example.test/{tracking_number}/{tracking_number}'));
        $this->assertFalse(TrackingUrl::is_template('https://www.ups.com/track'));
        $this->assertFalse(TrackingUrl::is_template('javascript:alert({tracking_number})'));
        $this->assertFalse(TrackingUrl::is_template('ftp://example.test/{tracking_number}'));
        $this->assertFalse(TrackingUrl::is_template('//example.test/{tracking_number}'));
        $this->assertFalse(TrackingUrl::is_template(''));
        $this->assertFalse(TrackingUrl::is_template(null));
    }

    public function test_validate_template_returns_true_or_a_message(): void
    {
        $this->assertTrue(TrackingUrl::validate_template('https://x.test/?n={tracking_number}'));
        $this->assertStringContainsString('http://', TrackingUrl::validate_template('javascript:alert({tracking_number})'));
        $this->assertStringContainsString('{tracking_number}', TrackingUrl::validate_template('https://x.test/track'));
    }

    public function test_sanitize_keeps_the_placeholder(): void
    {
        $this->assertSame(
            'https://www.ups.com/track?loc=en_US&tracknum={tracking_number}',
            TrackingUrl::sanitize_template('  https://www.ups.com/track?loc=en_US&tracknum={tracking_number}  ')
        );
    }

    public function test_sanitize_removes_unsafe_characters_but_keeps_placeholders(): void
    {
        $this->assertSame(
            'https://x.test/?a=b&n={tracking_number}',
            TrackingUrl::sanitize_template('https://x.test/?a=b&n={tracking_number}<>"')
        );
    }

    public function test_sanitize_of_a_non_string_is_empty(): void
    {
        $this->assertSame('', TrackingUrl::sanitize_template(['x']));
    }

    public function test_resolve_encodes_the_tracking_number(): void
    {
        $this->assertSame(
            'https://www.ups.com/track?loc=en_US&tracknum=1Z%20999%26A',
            TrackingUrl::resolve('https://www.ups.com/track?loc=en_US&tracknum={tracking_number}', '1Z 999&A')
        );
    }

    public function test_resolve_replaces_every_placeholder(): void
    {
        $this->assertSame(
            'https://x.test/123/123',
            TrackingUrl::resolve('https://x.test/{tracking_number}/{tracking_number}', '123')
        );
    }
}
