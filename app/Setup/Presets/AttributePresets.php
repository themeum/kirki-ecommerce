<?php

namespace Kirki\Ecommerce\App\Setup\Presets;

use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

defined('ABSPATH') || exit;

/**
 * Inserts the preset attributes (Color and the industry's attributes) with their values.
 *
 * @since 1.0.0
 */
class AttributePresets
{
    const TYPES = ['color', 'list'];

    /**
     * Create each preset attribute whose slug does not exist yet, with its values.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $presets The preset response.
     * @param PresetContext        $context The store's answers.
     * @return void
     */
    public function apply(array $presets, PresetContext $context)
    {
        foreach ($presets['attributes'] ?? [] as $definition) {
            $slug = sanitize_title($definition['slug'] ?? '');
            $name = sanitize_text_field($definition['name'] ?? '');
            $type = $definition['type'] ?? null;

            if ($slug === '' || $name === '' || !in_array($type, static::TYPES, true)) {
                Log::warning('Store presets skipped an attribute');
                continue;
            }

            if (Attribute::query()->where('slug', $slug)->exists()) {
                continue;
            }

            $values = $this->make_values($definition['values'] ?? []);
            $attribute = Attribute::create(['name' => $name, 'slug' => $slug, 'type' => $type]);
            $attribute->values()->create_many($values);

            Log::info(sprintf('Store presets created the %s attribute with %d values', $name, count($values)));
        }
    }

    /**
     * Build the attribute values, dropping any without a label.
     *
     * @since 1.0.0
     *
     * @param mixed $values Preset values with value and optional hex color.
     * @return array<int, array<string, string|null>>
     */
    protected function make_values($values)
    {
        $rows = [];

        foreach (is_array($values) ? $values : [] as $value) {
            $label = sanitize_text_field($value['value'] ?? '');

            if ($label === '') {
                continue;
            }

            $row = ['value' => $label];

            if (isset($value['color'])) {
                $row['color'] = sanitize_hex_color($value['color']);
            }

            $rows[] = $row;
        }

        return $rows;
    }
}
