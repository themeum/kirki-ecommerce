<?php

namespace Kirki\Ecommerce\Tests\Unit\Mcp;

use Kirki\Ecommerce\App\Mcp\Concerns\MasksPersonalData;
use Kirki\Ecommerce\Tests\Unit\TestCase;

/**
 * Covers task 2.5: the masking rules of the list tools.
 *
 * Spec: mcp-read-tool-conventions (List tools mask personal data).
 */
class MasksPersonalDataTest extends TestCase
{
    protected function masker()
    {
        return new class () {
            use MasksPersonalData;

            public function email($email)
            {
                return $this->mask_email($email);
            }

            public function name($name)
            {
                return $this->first_name($name);
            }
        };
    }

    public function test_normal_email_keeps_the_first_character_and_the_domain(): void
    {
        $this->assertSame('j***@example.com', $this->masker()->email('jane@example.com'));
    }

    public function test_one_character_local_part(): void
    {
        $this->assertSame('j***@example.com', $this->masker()->email('j@example.com'));
    }

    public function test_value_without_at_is_fully_masked(): void
    {
        $this->assertSame('***', $this->masker()->email('not-an-email'));
    }

    public function test_empty_value_is_null(): void
    {
        $this->assertNull($this->masker()->email(''));
        $this->assertNull($this->masker()->email(null));
    }

    public function test_first_name_is_not_split(): void
    {
        $this->assertSame('Mary Ann', $this->masker()->name(' Mary Ann '));
        $this->assertNull($this->masker()->name(''));
    }
}
