<?php

namespace Kirki\Ecommerce\Tests\Unit\DTO;

use Kirki\Ecommerce\App\DTO\Variant\CreateVariantDTO;
use Kirki\Ecommerce\App\DTO\Variant\UpdateVariantDTO;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class VariantDTOChargeTaxesTest extends TestCase
{
    public function test_a_created_variant_charges_tax_when_the_field_is_missing(): void
    {
        $this->assertTrue(CreateVariantDTO::from_array([])->charge_taxes);
    }

    public function test_a_created_variant_keeps_an_explicit_false(): void
    {
        $this->assertFalse(CreateVariantDTO::from_array(['charge_taxes' => false])->charge_taxes);
    }

    public function test_an_updated_variant_charges_tax_when_the_field_is_missing(): void
    {
        $this->assertTrue(UpdateVariantDTO::from_array([])->charge_taxes);
    }

    public function test_an_updated_variant_keeps_an_explicit_false(): void
    {
        $this->assertFalse(UpdateVariantDTO::from_array(['charge_taxes' => false])->charge_taxes);
    }
}
