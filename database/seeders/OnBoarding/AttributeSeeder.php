<?php

namespace Kirki\Ecommerce\Database\Seeders\OnBoarding;

use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

/**
 * Seeds the onboarding attributes (Color and Material) with their preset values.
 *
 * @since 1.0.0
 */
class AttributeSeeder extends Seeder
{
    /**
     * Seed the starter attributes and their preset values.
     *
     * Guarded per attribute rather than per seeder, so a run that created Color
     * but died before Material finishes correctly when it is retried.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function run(): void
    {
        foreach (OnBoardingCatalog::get_attributes() as $definition) {
            if (Attribute::query()->where('slug', $definition['slug'])->exists()) {
                continue;
            }

            $values = $definition['values'];
            unset($definition['values']);

            $attribute = Attribute::create($definition);
            $attribute->values()->create_many($values);

            Log::info(
                sprintf(
                    'OnBoarding AttributeSeeder created the %s attribute with %d values',
                    $definition['name'],
                    count($values)
                )
            );
        }
    }
}
