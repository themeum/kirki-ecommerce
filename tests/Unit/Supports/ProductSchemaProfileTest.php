<?php

namespace Kirki\Ecommerce\Tests\Unit\Supports;

use Kirki\Ecommerce\App\Supports\ProductSchemaProfile;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class ProductSchemaProfileTest extends TestCase
{
    public function test_normalize_keeps_known_groups_and_string_fields()
    {
        $profile = ProductSchemaProfile::normalize([
            'Product' => ['name', 5, 'image'],
            'Offer' => ['price'],
            'Mystery' => ['x'],
            'Brand' => 'name',
        ]);

        $this->assertSame(['Product' => ['name', 'image'], 'Offer' => ['price']], $profile);
    }

    public function test_normalize_reads_a_json_string()
    {
        $this->assertSame(['Product' => ['name']], ProductSchemaProfile::normalize('{"Product":["name"]}'));
    }

    public function test_normalize_rejects_unusable_data()
    {
        $this->assertNull(ProductSchemaProfile::normalize('{not json'));
        $this->assertNull(ProductSchemaProfile::normalize(null));
        $this->assertNull(ProductSchemaProfile::normalize(['Mystery' => ['x']]));
        $this->assertNull(ProductSchemaProfile::normalize([]));
    }

    public function test_normalize_keeps_a_listed_group_with_no_fields()
    {
        $this->assertSame(['Product' => []], ProductSchemaProfile::normalize(['Product' => []]));
    }
}
