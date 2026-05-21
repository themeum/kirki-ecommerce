<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\Sanitizer;
use WP_UnitTestCase;

class SanitizerTest extends WP_UnitTestCase
{
    public function test_it_sanitizes_nested_dot_notation_fields(): void
    {
        $sanitizer = Sanitizer::make(
            [
                'user' => [
                    'name' => '  Jane  ',
                ],
            ],
            [
                'user.name' => Sanitizer::TRIM,
            ]
        );

        $this->assertSame(
            [
                'user' => [
                    'name' => 'Jane',
                ],
            ],
            $sanitizer->get_sanitized_data()
        );
    }

    public function test_it_sanitizes_wildcard_array_fields(): void
    {
        $sanitizer = Sanitizer::make(
            [
                'items' => [
                    ['label' => '  One  '],
                    ['label' => '  Two  '],
                ],
            ],
            [
                'items.*.label' => Sanitizer::TRIM,
            ]
        );

        $this->assertSame('One', $sanitizer->get_sanitized_data()['items'][0]['label']);
        $this->assertSame('Two', $sanitizer->get_sanitized_data()['items'][1]['label']);
    }

    public function test_apply_rule_returns_null_for_null_values(): void
    {
        $this->assertNull(Sanitizer::apply_rule(null, Sanitizer::TEXT));
    }

    public function test_apply_rule_casts_integers(): void
    {
        $this->assertSame(12, Sanitizer::apply_rule('12', Sanitizer::INT));
    }

    public function test_apply_rule_trims_strings(): void
    {
        $this->assertSame('value', Sanitizer::apply_rule('  value  ', Sanitizer::TRIM));
    }

    public function test_apply_rule_uses_sanitize_text_field(): void
    {
        $this->assertSame('clean', Sanitizer::apply_rule('<b>clean</b>', Sanitizer::TEXT));
        $this->assertSame('hello', Sanitizer::apply_rule('  hello  ', Sanitizer::TEXT));
    }

    public function test_apply_rule_uses_sanitize_textarea_field(): void
    {
        $this->assertSame(
            "line1\nline2",
            Sanitizer::apply_rule("line1\nline2", Sanitizer::TEXTAREA)
        );
        $this->assertSame(
            'line1',
            Sanitizer::apply_rule("line1\n<script>x</script>", Sanitizer::TEXTAREA)
        );
    }

    public function test_apply_rule_uses_sanitize_email(): void
    {
        $this->assertSame(
            'User@Example.COM',
            Sanitizer::apply_rule('User@Example.COM', Sanitizer::EMAIL)
        );
        $this->assertSame('', Sanitizer::apply_rule('not-an-email', Sanitizer::EMAIL));
    }

    public function test_apply_rule_uses_sanitize_user(): void
    {
        $this->assertSame('User_Name', Sanitizer::apply_rule(' User_Name ', Sanitizer::USERNAME));
    }

    public function test_apply_rule_uses_sanitize_url(): void
    {
        $this->assertSame(
            'https://example.com/path?q=1',
            Sanitizer::apply_rule('https://example.com/path?q=1', Sanitizer::URL)
        );
        $this->assertSame('', Sanitizer::apply_rule('javascript:alert(1)', Sanitizer::URL));
    }

    public function test_apply_rule_uses_sanitize_key(): void
    {
        $this->assertSame('mykey', Sanitizer::apply_rule('My Key!', Sanitizer::KEY));
    }

    public function test_apply_rule_uses_sanitize_title(): void
    {
        $this->assertSame('hello-world', Sanitizer::apply_rule('Hello World', Sanitizer::TITLE));
        $this->assertSame('hello-world', Sanitizer::apply_rule('Hello World! @#$', Sanitizer::TITLE));
    }

    public function test_apply_rule_uses_sanitize_file_name(): void
    {
        $this->assertSame('Hello-World', Sanitizer::apply_rule('Hello World', Sanitizer::FILE_NAME));
        $this->assertSame('etcpasswd', Sanitizer::apply_rule('../../../etc/passwd', Sanitizer::FILE_NAME));
    }

    public function test_apply_rule_uses_sanitize_mime_type(): void
    {
        $this->assertSame(
            'image/jpegcharsetutf-8',
            Sanitizer::apply_rule('image/jpeg; charset=utf-8', Sanitizer::MIME_TYPE)
        );
    }

    public function test_apply_rule_uses_wp_kses_post(): void
    {
        $this->assertSame(
            '<p>ok</p>x',
            Sanitizer::apply_rule('<p>ok</p><script>x</script>', Sanitizer::RICH_TEXT)
        );
    }
}
