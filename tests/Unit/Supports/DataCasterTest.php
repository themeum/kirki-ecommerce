<?php

namespace Kirki\Ecommerce\Tests\Unit\Supports;

use Exception;
use Kirki\Ecommerce\Framework\Supports\DataCaster;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class DataCasterTest extends TestCase
{
    public function test_cast_value_returns_null_when_type_is_null(): void
    {
        $this->assertNull(DataCaster::cast_value(null, null));
    }

    public function test_cast_value_casts_scalar_types(): void
    {
        $this->assertSame(10, DataCaster::cast_value('10', 'int'));
        $this->assertSame(1.5, DataCaster::cast_value('1.5', 'float'));
        $this->assertTrue(DataCaster::cast_value('1', 'bool'));
        $this->assertSame('123', DataCaster::cast_value(123, 'string'));
    }

    public function test_cast_value_decodes_json_arrays(): void
    {
        $this->assertSame(['a', 'b'], DataCaster::cast_value('["a","b"]', 'array'));
    }

    public function test_cast_value_wraps_invalid_json_strings_in_array(): void
    {
        $this->assertSame(['not-json'], DataCaster::cast_value('not-json', 'array'));
    }

    public function test_cast_value_wraps_non_array_values_in_array(): void
    {
        $this->assertSame([42], DataCaster::cast_value(42, 'array'));
    }

    public function test_cast_value_returns_unknown_types_unchanged(): void
    {
        $value = new \stdClass();

        $this->assertSame($value, DataCaster::cast_value($value, 'object'));
    }

    public function test_cast_data_casts_array_values(): void
    {
        $data = [
            'quantity' => '3',
            'enabled' => '1',
        ];

        $result = DataCaster::cast_data($data, [
            'quantity' => 'int',
            'enabled' => 'bool',
        ]);

        $this->assertSame(3, $result['quantity']);
        $this->assertTrue($result['enabled']);
    }

    public function test_cast_data_casts_object_properties(): void
    {
        $data = (object) [
            'price' => '12.5',
        ];

        $result = DataCaster::cast_data($data, [
            'price' => 'float',
        ]);

        $this->assertSame(12.5, $result->price);
    }

    public function test_cast_data_throws_for_scalar_input(): void
    {
        $this->expectException(Exception::class);

        DataCaster::cast_data('invalid', ['value' => 'string']);
    }
}
