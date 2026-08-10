<?php

namespace Kirki\Ecommerce\App\Repositories;

use Kirki\Ecommerce\App\Constants\InventoryType;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;

class ProductRepository
{
    /**
     * Get paginated products with optional search and sorting.
     *
     * @param array $filters
     * @return Paginator
     */
    public function paginate(array $filters = [])
    {
        $query = $this->list_query();
        return $this->apply_filters($query, $filters)->paginate($filters['limit'] ?? Pagination::LIMIT, $filters['page'] ?? 1);
    }

    /**
     * Get paginated products with variants and optional search and sorting.
     *
     * @param array $filters
     * @return Paginator
     */
    public function paginate_with_variants(array $filters = [])
    {
        $query = Product::query()->with(['attributes', 'attribute_values', 'variants', 'variants.attribute_values', 'variants.product', 'media']);
        return $this->apply_filters($query, $filters)->paginate($filters['limit'] ?? Pagination::LIMIT, $filters['page'] ?? 1);
    }

    /**
     * Get all products with optional search and sorting.
     *
     * @param array $filters
     * @return Collection
     */
    public function all(array $filters = [])
    {
        $query = $this->list_query();
        return $this->apply_filters($query, $filters)->get();
    }

    /**
     * Find a product by ID.
     *
     * @param int $id
     * @return Product|null
     */
    public function find(int $id)
    {
        return Product::with(['brand', 'currency', 'categories', 'tags', 'collections', 'attributes', 'attribute_values', 'variants.attribute_values', 'variants.product', 'media'])->find($id);
    }

    /**
     * Find a product by user ID.
     *
     * @param int $user_id
     * @return Product|null
     */
    public function find_by_user_id(int $user_id)
    {
        return Product::where('user_id', $user_id)->first();
    }

    /**
     * Find a product by slug.
     *
     * @param string $slug
     * @return Product|null
     */
    public function find_by_slug(string $slug)
    {
        return Product::where('slug', $slug)->first();
    }

    /**
     * Create a new product.
     *
     * @param array $data
     * @return Product
     */
    public function create(array $data)
    {
        $data = array_merge($data, [
            'slug' => Product::generate_unique_slug($data['slug'])
        ]);

        return Product::create($data);
    }

    /**
     * Update a product by ID.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data)
    {
        $data = array_merge($data, [
            'slug' => Product::generate_unique_slug($data['slug'], $id)
        ]);

        return (bool) Product::find($id)->update($data);
    }

    /**
     * Delete a product by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id)
    {
        return (bool) Product::find($id)->delete();
    }

    /**
     * Bulk delete products by IDs.
     *
     * @param array $ids
     * @return bool
     */
    public function bulk_delete(array $ids)
    {
        return (bool) Product::where_in('id', $ids)->delete();
    }

    /**
     * Delete all products.
     *
     * @param array $filters
     * @return bool
     */
    public function delete_all(array $filters = [])
    {
        $query = Product::query();
        return (bool) $this->apply_filters($query, $filters)->delete();
    }

    protected function list_query()
    {
        $query = Product::query()->with(['categories', 'tags', 'collections', 'attributes', 'attribute_values', 'variants', 'media']);
        $query->select_raw('*, id as pid');

        return $query;
    }

    protected function apply_filters(QueryBuilder $query, $filters = [])
    {
        $query->when($filters['search'] ?? null, function (QueryBuilder $query, $search) {
            return $query->where_any(['title', 'description'], 'like', '%' . $search . '%');
        });

        $query->where_has('variants', function ($variant_query) use ($filters) {
            $variant_query->when($filters['search'] ?? false, function ($variant_query) use ($filters) {
                return $variant_query->where(function ($variant_query) use ($filters) {
                    $variant_query->where_like('sku', '%' . $filters['search'] . '%');
                    return $variant_query;
                });
            });

            $variant_query->when(!empty($filters['inventory_type']) && $filters['inventory_type'] === InventoryType::IN_STOCK, function ($query) {
                $query->where(function ($query) {
                    $query->where(function ($query) {
                        $query->where('track_inventory', true);
                        $query->where('available_quantity', '>', 0);
                    });

                    $query->or_where(function ($query) {
                        $query->where('track_inventory', false);
                        $query->where('in_stock', true);
                    });
                });

                return $query;
            });

            $variant_query->when(!empty($filters['inventory_type']) && $filters['inventory_type'] === InventoryType::OUT_OF_STOCK, function ($query) {
                return $query->where(function ($query) {
                    $query->where(function ($query) {
                        $query->where('track_inventory', true);
                        $query->where('available_quantity', '<=', 0);
                    });

                    $query->or_where(function ($query) {
                        $query->where('track_inventory', false);
                        $query->where('in_stock', false);
                    });
                });
            });
        });

        $query->when($filters['brand_id'] ?? false, function ($query) use ($filters) {
            return $query->where('brand_id', $filters['brand_id']);
        });

        $query->when($filters['brand_ids'] ?? false, function ($query) use ($filters) {
            return $query->where_in('brand_id', $filters['brand_ids']);
        });

        $query->when($filters['attribute_value_ids'] ?? null, function (QueryBuilder $query, $attribute_value_ids) {
            $query->where_relation('attribute_values', fn($q) => $q->where_in('id', $attribute_value_ids));
        });

        $query->when($filters['min_price'] ?? null, function (QueryBuilder $query, $min_price) {
            $money = MoneyManager::to_minor($min_price);
            $query->where_relation('variants', function ($q) use ($money) {
                $q->where(fn($q) => $q->where('base_price', '>=', $money)->or_where('base_sale_price', '>=', $money));
            });
        });

        $query->when($filters['max_price'] ?? null, function (QueryBuilder $query, $max_price) {
            $money = MoneyManager::to_minor($max_price);
            $query->where_relation('variants', function ($q) use ($money) {
                $q->where(fn($q) => $q->where('base_price', '<=', $money)->or_where('base_sale_price', '<=', $money));
            });
        });

        $query->when($filters['category_ids'] ?? false, function ($query) use ($filters) {
            return $query->where_relation('categories', fn($q) => $q->where_in('category_id', $filters['category_ids']));
        });

        $query->when($filters['collection_id'] ?? false, function ($query) use ($filters) {
            return $query->where_relation('collections', fn($q) => $q->where('collection_id', $filters['collection_id']));
        });

        $query->when(!empty($filters['status']), function ($query) use ($filters) {
            return $query->where('status', $filters['status']);
        });


        $query->when(!empty($filters['sort_by']) && !empty($filters['sort_order']), function (QueryBuilder $query) use ($filters) {
            return $query->order_by($filters['sort_by'], $filters['sort_order']);
        }, function (QueryBuilder $query) {
            return $query->order_by('id', 'desc');
        });

        return $query;
    }
}
