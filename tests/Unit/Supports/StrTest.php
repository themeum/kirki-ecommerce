<?php

namespace Kirki\Ecommerce\Tests\Unit\Supports;

use BadMethodCallException;
use Kirki\Ecommerce\Supports\Str;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class StrTest extends TestCase
{
    public function test_to_number_converts_numeric_strings(): void
    {
        $this->assertSame(10, Str::to_number('10'));
        $this->assertSame(1.5, Str::to_number('1.5'));
        $this->assertSame(1000.0, Str::to_number('1e3'));
        $this->assertSame('not-a-number', Str::to_number('not-a-number'));
    }

    public function test_increment_handles_dash_and_regular_styles(): void
    {
        $this->assertSame('product-3', Str::increment('product-2'));
        $this->assertSame('product-2', Str::increment('product'));
        $this->assertSame('Product (3)', Str::increment('Product (2)', 'regular'));
    }

    public function test_trim_and_squish_normalize_whitespace(): void
    {
        $this->assertSame('hello world', Str::trim("  hello world  "));
        $this->assertSame('hello world', Str::squish(" hello   world "));
    }

    public function test_case_converters_transform_strings(): void
    {
        $this->assertSame('helloWorld', Str::camel('hello-world'));
        $this->assertSame('hello_world', Str::snake('hello-world'));
        $this->assertSame('HelloWorld', Str::pascal('hello_world'));
    }

    public function test_starts_with_handles_multiple_needles(): void
    {
        $this->assertTrue(Str::starts_with('hello world', 'hello'));
        $this->assertTrue(Str::starts_with('hello world', ['hi', 'hello']));
        $this->assertFalse(Str::starts_with(null, 'hello'));
    }

    public function test_take_returns_prefix_or_suffix(): void
    {
        $this->assertSame('hel', Str::take('hello', 3));
        $this->assertSame('llo', Str::take('hello', -3));
    }

    public function test_replace_supports_case_insensitive_replacement(): void
    {
        $this->assertSame('foo_bar', Str::replace('-', '_', 'foo-bar'));
        $this->assertSame('fOO_bar', Str::replace('o', 'O', 'foo_bar', false));
    }

    public function test_uuid_uses_wp_generate_uuid4(): void
    {
        $uuid = Str::uuid();

        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
            $uuid
        );
    }

    public function test_slug_sanitizes_title_strings(): void
    {
        $this->assertSame('hello-world', Str::slug('Hello World'));
    }

    public function test_macros_can_be_registered_and_called(): void
    {
        Str::macro('exclaim', fn($value) => $value . '!');

        $this->assertTrue(Str::has_macro('exclaim'));
        $this->assertSame('hello!', Str::exclaim('hello'));
    }

    public function test_unknown_macro_throws_bad_method_call_exception(): void
    {
        $this->expectException(BadMethodCallException::class);

        Str::unknownMacro('value');
    }
}
