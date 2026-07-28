<?php

namespace Kirki\Ecommerce\App\Repositories;

use Kirki\Ecommerce\App\Constants\InventoryType;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Exception;

class VariantRepository
{
    /**
     * Find a variant by ID.
     *
     * @return Collection<Variant>
     */
    public function all(array $filters = [])
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Get all variants with product and media.
     *
     * @param array $filters
     * @return Paginator
     */
    public function paginated(array $filters = [])
    {
        return $this->list_query($filters)->paginate($filters['limit'] ?? Pagination::LIMIT, $filters['page'] ?? 1);
    }

    /**
     * Get all variants with product and media by ids.
     *
     * @param array $ids
     * @return Collection
     */
    public function get_by_ids(array $ids)
    {
        return $this->list_query([])->where_in('id', $ids)->get();
    }

    /**
     * Find a variant by ID.
     *
     * @param int $id
     * @return Variant|null
     */
    public function find(int $id)
    {
        return Variant::with(['product.media', 'attribute_values'])->where('id', $id)->first();
    }

    /**
     * Create multiple variants.
     *
     * @param array $values
     * @return bool
     */
    public function insert(array $values)
    {
        return Variant::insert($values);
    }

    /**
     * Create a new variant.
     *
     * @param array $data
     * @return Variant
     */
    public function create(array $data)
    {
        return Variant::create($data);
    }

    /**
     * Update a variant by ID.
     *
     * @param int $id
     * @param array $data
     * @return Variant|false
     */
    public function update(int $id, array $data)
    {
        $variant = Variant::find($id);

        if (empty($variant)) {
            throw new NotFoundException(__('Variant not found!', 'kirki-ecommerce'));
        }

        return $variant->update($data) ? $variant : false;
    }

    /**
     * Bulk update
     * @param array $variants
     * @return Variant[]
     */
    public function bulk_update(array $variants)
    {
        if (empty($variants)) {
            throw new NotFoundException(__('No variants selected.', 'kirki-ecommerce'));
        }

        DB::begin_transaction();

        $updated_variants = [];

        foreach ($variants as $variant) {
            if (empty($variant['id'])) {
                throw new NotFoundException(__('Variant id is required.', 'kirki-ecommerce'));
            }

            $updated_variant = $this->update($variant['id'], $variant);

            if (!$updated_variant) {
                DB::roll_back();

                throw new NotFoundException(
                    sprintf(
                        /* translators: %s: variant id */
                        __('Variant with id %s could not be updated.', 'kirki-ecommerce'),
                        $variant['id']
                    )
                );
            }

            $updated_variants[] = $updated_variant;
        }

        DB::commit();

        return $updated_variants;
    }

    /**
     * Increment a variant by ID.
     *
     * @param int $id
     * @param string $column
     * @param int $amount
     * @return bool
     */
    public function increment(int $id, string $column, int $amount = 1)
    {
        return (bool) Variant::find($id)->increment($column, $amount);
    }

    /**
     * Decrement a variant by ID.

     * @param int $id
     * @param string $column
     * @param int $amount
     * @return bool
     */
    public function decrement(int $id, string $column, int $amount = 1)
    {
        return (bool) Variant::find($id)->decrement($column, $amount);
    }

    /**
     * Delete a variant by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id)
    {
        return (bool) Variant::find($id)->delete();
    }

    /**
     * Bulk delete variants by IDs.
     *
     * @param array $ids
     * @return bool
     */
    public function bulk_delete(array $ids)
    {
        return (bool) Variant::where_in('id', $ids)->delete();
    }

    /**
     * Delete all variants.
     *
     * @param array $ids
     * @return bool
     */
    public function delete_all()
    {
        return (bool) Variant::query()->delete();
    }

    /**
     * List query.
     *
     * @param array $filters
     * @return QueryBuilder
     */
    protected function list_query(array $filters)
    {
        $query = Variant::with('product.media', 'attribute_values');

        $query->where(function ($query) use ($filters) {
            $query->where_has('product', function ($product_query) use ($filters) {
                $product_query->when($filters['search'] ?? false, function ($product_query) use ($filters) {
                    return $product_query->where(function ($product_query) use ($filters) {
                        $product_query->where_like('title', '%' . $filters['search'] . '%');
                        $product_query->or_where_like('description', '%' . $filters['search'] . '%');
                        return $product_query;
                    });
                });
            });

            $query->when($filters['search'] ?? false, function ($query) use ($filters) {
                return $query->or_where_like('sku', '%' . $filters['search'] . '%');
            });
        });

        $query->where_has('product', function ($product_query) use ($filters) {
            $product_query->when($filters['brand_id'] ?? false, function ($product_query) use ($filters) {
                return $product_query->where('brand_id', $filters['brand_id']);
            });

            $product_query->when($filters['category_ids'] ?? false, function ($product_query) use ($filters) {
                return $product_query->where_relation('categories', fn($q) => $q->where_in('category_id', $filters['category_ids']));
            });

            $product_query->when($filters['collection_id'] ?? false, function ($product_query) use ($filters) {
                return $product_query->where_relation('collections', fn($q) => $q->where('collection_id', $filters['collection_id']));
            });

            $product_query->when(!empty($filters['status']) && in_array($filters['status'], ProductStatus::get_constant_values()), function ($product_query) use ($filters) {
                return $product_query->where('status', $filters['status']);
            });
        });

        $query->when(!empty($filters['inventory_type']) && $filters['inventory_type'] === InventoryType::IN_STOCK, function ($query) {
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

        $query->when(!empty($filters['inventory_type']) && $filters['inventory_type'] === InventoryType::OUT_OF_STOCK, function ($query) {
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

        $query->when($filters['sort_by'] ?? false, function ($query) use ($filters) {
            return $query->order_by($filters['sort_by'], $filters['sort_order']);
        });

        return $query;
    }
}
