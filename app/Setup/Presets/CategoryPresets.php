<?php

namespace Kirki\Ecommerce\App\Setup\Presets;

use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

defined('ABSPATH') || exit;

/**
 * Inserts the industry's category tree.
 *
 * @since 1.0.0
 */
class CategoryPresets
{
    const MAX_LEVEL = 2;

    /**
     * Create the preset category tree when the store has no categories.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $presets The preset response.
     * @param PresetContext        $context The store's answers.
     * @return void
     */
    public function apply(array $presets, PresetContext $context)
    {
        $tree = $presets['categories'] ?? [];

        if (empty($tree) || !is_array($tree) || Category::query()->exists()) {
            return;
        }

        $count = $this->insert_level($tree, null, 1);

        Log::info(sprintf('Store presets created %d categories', $count));
    }

    /**
     * Insert one level of the tree, then each node's children.
     *
     * A name that repeats in the tree gets a numbered slug, because the slug
     * column is unique.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $nodes     Categories with name, optional description and children.
     * @param int|null                         $parent_id The parent category id, or null for the top level.
     * @param int                              $level     The level of these nodes, from 1.
     * @return int The number of categories created.
     */
    protected function insert_level(array $nodes, $parent_id, int $level)
    {
        $count = 0;

        foreach (array_values($nodes) as $index => $node) {
            $name = sanitize_text_field($node['name'] ?? '');

            if ($name === '') {
                continue;
            }

            $category = Category::create([
                'parent_id' => $parent_id,
                'name' => $name,
                'slug' => Category::generate_unique_slug($name),
                'description' => sanitize_text_field($node['description'] ?? '') ?: null,
                'level' => $level,
                'ordering' => $index + 1,
                'is_active' => true,
                'is_deletable' => true,
                'created_by' => get_current_user_id() ?: null,
            ]);
            $count++;

            if ($level < static::MAX_LEVEL && is_array($node['children'] ?? null)) {
                $count += $this->insert_level($node['children'], $category->id, $level + 1);
            }
        }

        return $count;
    }
}
