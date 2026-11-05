<?php

namespace Kirki\Ecommerce\App\Mcp\Concerns;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Framework\Sanitizer;

/**
 * Gives the schema, rules and sanitizing of the product text fields that MCP tools can write.
 *
 * @since 1.0.0
 */
trait HandlesProductText
{
    /**
     * Get the names of the product text fields.
     *
     * @since 1.0.0
     *
     * @return string[]
     */
    protected function product_text_fields()
    {
        return array_keys($this->product_text_rules());
    }

    /**
     * Get the schema of the product text fields.
     *
     * @since 1.0.0
     *
     * @param JsonSchema $schema Schema builder.
     *
     * @return array<string, mixed>
     */
    protected function product_text_schema(JsonSchema $schema)
    {
        return [
            'short_description' => $schema->string()->description('Short description, plain text.'),
            'description' => $schema->string()->description('Description, plain text.'),
            'additional_info' => $schema->array()
                ->items($schema->object()->properties([
                    'title' => $schema->string(),
                    'description' => $schema->string(),
                ]))
                ->description('Extra information blocks, each with "title" and "description". The list replaces the current list.'),
            'seo_title' => $schema->string()->description('SEO title.'),
            'seo_description' => $schema->string()->description('SEO meta description.'),
            'seo_keywords' => $schema->array()->items($schema->string())->description('SEO keywords. The list replaces the current list.'),
            'og_title' => $schema->string()->description('Social share title.'),
            'og_description' => $schema->string()->description('Social share description.'),
            'ribbon' => $schema->string()->description('Ribbon text on the product card, for example "New". Empty to remove.'),
            'ribbon_color' => $schema->string()->description('Ribbon color, for example #FF0000.'),
        ];
    }

    /**
     * Get the validation rules of the product text fields.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function product_text_rules()
    {
        return [
            'short_description' => 'nullable|string|max:5000',
            'description' => 'nullable|string|max:20000',
            'additional_info' => 'nullable|array|max:20',
            'seo_title' => 'nullable|string|max:500',
            'seo_description' => 'nullable|string|max:2000',
            'seo_keywords' => 'nullable|array|max:30',
            'og_title' => 'nullable|string|max:500',
            'og_description' => 'nullable|string|max:2000',
            'ribbon' => 'nullable|string|max:100',
            'ribbon_color' => 'nullable|string|max:20',
        ];
    }

    /**
     * Get the validation rules of the list items of the product text fields.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function product_text_item_rules()
    {
        return [
            'additional_info.*.title' => 'required|string|max:200',
            'additional_info.*.description' => 'required|string|max:5000',
            'seo_keywords.*' => 'string|max:100',
        ];
    }

    /**
     * Sanitize the product text fields the same way as the admin product form.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $fields Validated text fields.
     *
     * @return array<string, mixed>
     */
    protected function sanitize_product_text(array $fields)
    {
        foreach ($fields as $field => $value) {
            if ($value === null) {
                continue;
            }

            if ($field === 'additional_info') {
                $fields[$field] = array_map(function ($block) {
                    return [
                        'title' => Sanitizer::apply_rule($block['title'], Sanitizer::TEXT),
                        'description' => Sanitizer::apply_rule($block['description'], Sanitizer::TEXT),
                    ];
                }, array_values($value));
            } elseif ($field === 'seo_keywords') {
                $fields[$field] = array_values(array_map(function ($keyword) {
                    return Sanitizer::apply_rule($keyword, Sanitizer::TEXT);
                }, $value));
            } else {
                $fields[$field] = Sanitizer::apply_rule($value, Sanitizer::TEXT);
            }
        }

        return $fields;
    }
}
