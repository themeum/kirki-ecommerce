<?php

namespace Kirki\Ecommerce\App\Concerns;

use Kirki\Ecommerce\Framework\Exceptions\ValidationException;

/**
 * Cross-field integrity checks for a product's variant matrix.
 *
 * The rule DSL validates each field in isolation, so the relationships between
 * `attributes` and `variants.*.attribute_values` are checked here instead.
 */
trait ValidatesVariantMatrix
{
    /**
     * @return void
     *
     * @throws ValidationException
     */
    protected function validate_variant_matrix()
    {
        $attributes = $this->input('attributes') ?? [];
        $variants = $this->input('variants') ?? [];

        $allowed_value_ids = [];

        foreach ($attributes as $attribute) {
            foreach ($attribute['values'] ?? [] as $value_id) {
                $allowed_value_ids[] = (int) $value_id;
            }
        }

        $attribute_count = count($attributes);
        $errors = [];
        $seen_combinations = [];
        $default_count = 0;

        foreach ($variants as $index => $variant) {
            if (!is_array($variant)) {
                continue;
            }

            if (!empty($variant['is_default'])) {
                $default_count++;
            }

            $has_values = array_key_exists('attribute_values', $variant) && is_array($variant['attribute_values']);

            if (!$has_values) {
                if ($attribute_count > 0) {
                    $errors["variants.{$index}.attribute_values"] = __('This product has variations, so each variant must list its attribute values.', 'kirki-ecommerce');
                }

                continue;
            }

            $values = array_map('intval', $variant['attribute_values']);

            if (count($values) !== $attribute_count) {
                $errors["variants.{$index}.attribute_values"] = sprintf(
                    /* translators: 1: number of values supplied, 2: number of attributes on the product */
                    __('This variant lists %1$d value(s) but the product has %2$d attribute(s).', 'kirki-ecommerce'),
                    count($values),
                    $attribute_count
                );

                continue;
            }

            $unknown = array_diff($values, $allowed_value_ids);

            if (!empty($unknown)) {
                $errors["variants.{$index}.attribute_values"] = __('This variant references a value that does not belong to any of the product\'s attributes.', 'kirki-ecommerce');

                continue;
            }

            sort($values);
            $signature = implode('-', $values);

            if (isset($seen_combinations[$signature])) {
                $errors["variants.{$index}.attribute_values"] = __('Two variants share the same combination of values.', 'kirki-ecommerce');

                continue;
            }

            $seen_combinations[$signature] = $index;
        }

        if (!empty($variants) && $default_count !== 1) {
            $errors['variants'] = __('Exactly one variant must be marked as the default.', 'kirki-ecommerce');
        }

        if (!empty($errors)) {
            throw ValidationException::with_errors($errors);
        }
    }
}
