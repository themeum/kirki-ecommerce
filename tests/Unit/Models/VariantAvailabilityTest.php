<?php

namespace Kirki\Ecommerce\Tests\Unit\Models;

use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class VariantAvailabilityTest extends TestCase
{
    /**
     * @param string $status Product status to assign.
     * @return Variant
     */
    protected function make_variant(string $status, bool $is_visible): Variant
    {
        $variant = new Variant(['is_visible' => $is_visible]);
        $variant->set_relation('product', new Product(['status' => $status]));

        return $variant;
    }

    public function test_available_when_published_and_visible(): void
    {
        $variant = $this->make_variant(ProductStatus::PUBLISHED, true);

        $this->assertTrue($variant->is_available());
    }

    public function test_unavailable_when_product_is_draft(): void
    {
        $variant = $this->make_variant(ProductStatus::DRAFT, true);

        $this->assertFalse($variant->is_available());
    }

    public function test_unavailable_when_product_is_trashed(): void
    {
        $variant = $this->make_variant(ProductStatus::TRASHED, true);

        $this->assertFalse($variant->is_available());
    }

    public function test_unavailable_when_variant_is_not_visible(): void
    {
        $variant = $this->make_variant(ProductStatus::PUBLISHED, false);

        $this->assertFalse($variant->is_available());
    }
}
