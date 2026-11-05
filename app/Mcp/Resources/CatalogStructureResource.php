<?php

namespace Kirki\Ecommerce\App\Mcp\Resources;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Models\Collection;
use Kirki\Ecommerce\App\Models\Tag;

/**
 * The catalog vocabulary: categories, brands, collections, tags and attributes, with product counts.
 *
 * @since 1.0.0
 */
class CatalogStructureResource extends StoreResource
{
    const LIST_LIMIT = 200;

    /** @var string */
    protected $title = 'Catalog structure';

    /** @var string */
    protected $description = 'The category tree, brands, collections and tags with their product counts, and the attributes with their values. Each list holds at most 200 entries, with the most products first. Read it to use the store\'s own catalog names.';

    /** @var string */
    protected $uri = 'kecom://catalog/structure';

    /**
     * Read the catalog structure.
     *
     * @since 1.0.0
     *
     * @param Request $request The read, which carries no arguments.
     *
     * @return Response
     */
    public function handle(Request $request)
    {
        return Response::structured([
            'categories' => $this->counted_list(Category::class, 'name', function ($category) {
                return [
                    'id' => (int) $category->id,
                    'name' => $category->name,
                    'parent_id' => empty($category->parent_id) ? null : (int) $category->parent_id,
                    'product_count' => (int) $category->products_count,
                ];
            }),
            'brands' => $this->counted_list(Brand::class, 'name', fn($model) => $this->named_row($model)),
            'collections' => $this->counted_list(Collection::class, 'title', function ($collection) {
                return [
                    'id' => (int) $collection->id,
                    'name' => $collection->title,
                    'product_count' => (int) $collection->products_count,
                ];
            }),
            'tags' => $this->counted_list(Tag::class, 'name', fn($model) => $this->named_row($model)),
            'attributes' => $this->attributes(),
        ]);
    }

    /**
     * Get a capped list of a model with its product counts, the most products first.
     *
     * @since 1.0.0
     *
     * @param string   $model       Model class with a products relation.
     * @param string   $name_column Column that holds the name.
     * @param callable $row         Turns one model into a row.
     *
     * @return array{items: array<int, array<string, mixed>>, total: int, is_truncated: bool}
     */
    protected function counted_list(string $model, string $name_column, callable $row)
    {
        $total = (int) $model::query()->count();
        $items = $model::with_count('products')
            ->order_by('products_count', 'desc')
            ->order_by($name_column, 'asc')
            ->limit(static::LIST_LIMIT)
            ->get();

        return $this->capped(array_map($row, $items->all()), $total);
    }

    /**
     * Get the row of a model that has a name and a product count.
     *
     * @since 1.0.0
     *
     * @param Brand|Tag $model Model.
     *
     * @return array<string, mixed>
     */
    protected function named_row($model)
    {
        return [
            'id' => (int) $model->id,
            'name' => $model->name,
            'product_count' => (int) $model->products_count,
        ];
    }

    /**
     * Get the attributes with their value names, sorted by name. Attributes have no product count.
     *
     * @since 1.0.0
     *
     * @return array{items: array<int, array<string, mixed>>, total: int, is_truncated: bool}
     */
    protected function attributes()
    {
        $total = (int) Attribute::query()->count();
        $attributes = Attribute::with('values')
            ->order_by('name', 'asc')
            ->limit(static::LIST_LIMIT)
            ->get();

        $items = array_map(function ($attribute) {
            return [
                'id' => (int) $attribute->id,
                'name' => $attribute->name,
                'type' => $attribute->type,
                'values' => array_values(array_map(function ($value) {
                    return $value->value;
                }, $attribute->values->all())),
            ];
        }, $attributes->all());

        return $this->capped($items, $total);
    }

    /**
     * Wrap a list with its full count and whether it was cut.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $items Listed entries.
     * @param int                              $total Number of entries in the store.
     *
     * @return array{items: array<int, array<string, mixed>>, total: int, is_truncated: bool}
     */
    protected function capped(array $items, int $total)
    {
        return [
            'items' => array_values($items),
            'total' => $total,
            'is_truncated' => $total > count($items),
        ];
    }
}
