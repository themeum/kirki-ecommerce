<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Setup\Presets\AttributePresets;
use Kirki\Ecommerce\App\Setup\Presets\CategoryPresets;
use Kirki\Ecommerce\App\Setup\Presets\LegalPresets;
use Kirki\Ecommerce\App\Setup\Presets\Local\LocalPresetSource;
use Kirki\Ecommerce\App\Setup\Presets\PresetContext;
use Kirki\Ecommerce\App\Setup\Presets\SchemaProfilePresets;
use Kirki\Ecommerce\App\Setup\Presets\ShippingProfilePresets;
use Kirki\Ecommerce\App\Setup\Presets\ShippingZonePresets;
use Kirki\Ecommerce\App\Setup\Presets\TaxProfilePresets;
use Kirki\Ecommerce\App\Setup\Presets\TaxRegionPresets;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;

use function Kirki\Ecommerce\Framework\app;

defined('ABSPATH') || exit;

/**
 * Applies the industry and location presets to a newly set up store, once.
 *
 * @since 1.0.0
 */
class StorePresetService
{
    /**
     * Check whether the presets were already applied (or skipped) for this store.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function is_applied()
    {
        return !empty(Option::get(OptionKeys::PRESETS_APPLIED_AT));
    }

    /**
     * Build the presets from the bundled data file and insert them.
     *
     * Profiles are inserted before zones and the tax region, whose rules
     * reference them by id. A kind that fails is logged and the others still
     * run, so a store never loses all presets to one bad record. When the
     * data file cannot be read, nothing is written. Either way the presets
     * count as applied, so they are never applied twice.
     *
     * The source is resolved from the container here, because the router
     * builds controllers, and so this service, without container bindings.
     *
     * @since 1.0.0
     *
     * @param PresetContext $context The store's answers.
     * @return void
     */
    public function apply(PresetContext $context)
    {
        $presets = app()->make(LocalPresetSource::class)->fetch($context);

        if (is_array($presets)) {
            $this->insert($presets, $context);
        }

        Option::set(OptionKeys::PRESETS_APPLIED_AT, time());
    }

    /**
     * Run every inserter on the preset response.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $presets The preset response.
     * @param PresetContext        $context The store's answers.
     * @return void
     */
    protected function insert(array $presets, PresetContext $context)
    {
        $inserters = [
            CategoryPresets::class,
            AttributePresets::class,
            SchemaProfilePresets::class,
            ShippingProfilePresets::class,
            TaxProfilePresets::class,
            LegalPresets::class,
            ShippingZonePresets::class,
            TaxRegionPresets::class,
        ];

        foreach ($inserters as $inserter) {
            try {
                app()->make($inserter)->apply($presets, $context);
            } catch (\Throwable $exception) {
                Log::error(sprintf('Store presets failed in %s: %s', $inserter, $exception->getMessage()));
            }
        }
    }
}
