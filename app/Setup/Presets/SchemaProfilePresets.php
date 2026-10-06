<?php

namespace Kirki\Ecommerce\App\Setup\Presets;

use Kirki\Ecommerce\App\Models\ProductSchema;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

defined('ABSPATH') || exit;

/**
 * Inserts the default product schema profile.
 *
 * @since 1.0.0
 */
class SchemaProfilePresets
{
    /**
     * Create the preset schema profiles when the store has none.
     *
     * The schema column is encoded here because the bulk insert bypasses the
     * model's set_schema_attribute mutator.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $presets The preset response.
     * @param PresetContext        $context The store's answers.
     * @return void
     */
    public function apply(array $presets, PresetContext $context)
    {
        $rows = [];

        foreach ($presets['schema_profiles'] ?? [] as $profile) {
            $name = sanitize_text_field($profile['name'] ?? '');

            if ($name === '' || !is_array($profile['schema'] ?? null)) {
                continue;
            }

            $rows[] = [
                'name' => $name,
                'is_default' => !empty($profile['is_default']),
                'schema' => wp_json_encode(array_map(fn($fields) => array_map('sanitize_text_field', (array) $fields), $profile['schema'])),
            ];
        }

        if (empty($rows) || ProductSchema::query()->exists()) {
            return;
        }

        ProductSchema::query()->insert($rows);

        Log::info(sprintf('Store presets created %d schema profiles', count($rows)));
    }
}
