<?php

namespace Kirki\Ecommerce\Database\Seeders\OnBoarding;

use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;
use Kirki\Ecommerce\Framework\Supports\Str;

class CategorySeeder extends Seeder
{
    /**
     * Seed the starter category tree.
     *
     * Inserted one level at a time so each level's real primary keys can be read
     * back and used as the next level's parent_id - the tree carries no hardcoded
     * ids, which is what lets it coexist with a store that already has data.
     *
     * @return void
     * @since 1.0.0
     */
    public function run(): void
    {
        if (Category::query()->exists()) {
            return;
        }

        $categories = $this->flatten(OnBoardingCatalog::get_categories());
        $ids = [];

        foreach ([1, 2, 3] as $level) {
            $rows = [];

            foreach ($categories as $category) {
                if ($category['level'] !== $level) {
                    continue;
                }

                $rows[] = [
                    'parent_id' => $ids[$category['parent_slug']] ?? null,
                    'name' => $category['name'],
                    'slug' => $category['slug'],
                    'description' => $category['description'],
                    'level' => $level,
                    'ordering' => $category['ordering'],
                    'is_active' => true,
                    'is_deletable' => true,
                    'created_by' => 1,
                    'created_at' => Date::now(),
                    'updated_at' => Date::now(),
                ];
            }

            Category::query()->insert($rows);

            $ids += Category::query()->where('level', $level)->pluck('id', 'slug')->all();
        }

        Log::info(sprintf('OnBoarding CategorySeeder created %d categories', count($categories)));
    }

    /**
     * Flatten the nested catalog tree into insert-ordered rows.
     *
     * @param array $tree The nested category tree.
     *
     * @return array
     * @since 1.0.0
     */
    protected function flatten($tree)
    {
        $used_slugs = [];
        $categories = [];

        foreach ($tree as $top_index => $top) {
            $top_slug = $this->unique_slug($top['name'], null, $used_slugs);

            $categories[] = [
                'name' => $top['name'],
                'slug' => $top_slug,
                'description' => $top['description'] ?? null,
                'level' => 1,
                'ordering' => $top_index + 1,
                'parent_slug' => null,
            ];

            foreach ($top['children'] as $child_index => $child) {
                $child_slug = $this->unique_slug($child['name'], $top['name'], $used_slugs);

                $categories[] = [
                    'name' => $child['name'],
                    'slug' => $child_slug,
                    'description' => null,
                    'level' => 2,
                    'ordering' => $child_index + 1,
                    'parent_slug' => $top_slug,
                ];

                foreach ($child['children'] ?? [] as $leaf_index => $leaf) {
                    $categories[] = [
                        'name' => $leaf['name'],
                        'slug' => $this->unique_slug($leaf['name'], $child['name'], $used_slugs),
                        'description' => null,
                        'level' => 3,
                        'ordering' => $leaf_index + 1,
                        'parent_slug' => $child_slug,
                    ];
                }
            }
        }

        return $categories;
    }

    /**
     * Build a slug that is unique across the whole tree.
     *
     * Names repeat across branches - "Accessories" appears five times, "Shoes",
     * "Helmets" and "Toys" three times each - and the slug column is unique. A
     * repeat is disambiguated by its parent's name rather than a counter, so the
     * resulting slug is stable and still readable as a URL.
     *
     * @param string      $name        The category name.
     * @param string|null $parent_name The parent category name, when there is one.
     * @param array       $used_slugs  Slugs already taken, by reference.
     *
     * @return string
     * @since 1.0.0
     */
    protected function unique_slug($name, $parent_name, array &$used_slugs)
    {
        $slug = Str::slug($name);

        if (isset($used_slugs[$slug]) && !empty($parent_name)) {
            $slug = Str::slug($parent_name . '-' . $name);
        }

        $used_slugs[$slug] = true;

        return $slug;
    }
}
