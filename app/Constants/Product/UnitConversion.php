<?php

namespace Kirki\Ecommerce\App\Constants\Product;

class UnitConversion
{
    /**
     * Factor to convert each unit to its measurement group's base unit.
     * Mirrors resources/app/features/products/lib/price/utils.tsx's normalizedUnit.
     */
    const FACTORS = [
        'mg' => 0.001,
        'g' => 1,
        'kg' => 1000,
        'ml' => 0.001,
        'cl' => 0.01,
        'l' => 1,
        'm3' => 1000,
        'mm' => 0.001,
        'cm' => 0.01,
        'm' => 1,
        'sqft' => 1,
    ];

    /**
     * Measurement group each unit belongs to.
     * Mirrors resources/app/features/products/lib/price/utils.tsx's unitGroups.
     */
    const GROUPS = [
        'mg' => 'weight',
        'g' => 'weight',
        'kg' => 'weight',
        'ml' => 'volume',
        'cl' => 'volume',
        'l' => 'volume',
        'm3' => 'volume',
        'mm' => 'size',
        'cm' => 'size',
        'm' => 'size',
        'sqft' => 'area',
    ];
}
