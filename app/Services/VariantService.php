<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Concerns\HasSortableColumns;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Constants\InventoryType;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\DTO\Variant\VariantListFilterDTO;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\App\DTO\Variant\CreateVariantDTO;
use Kirki\Ecommerce\App\DTO\Variant\UpdateVariantDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;

use function Kirki\Ecommerce\Framework\throw_anyway;
use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\user;

/**
 * Manages product variants: listing, lookup, creation, updates, stock counters and deletion.
 *
 * @since 1.0.0
 */
class VariantService
{
    use HasSortableColumns;

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function sortable_columns()
    {
        return [
            'id' => 'id',
            'product_id' => 'product_id',
            'name' => 'name',
            'sku' => 'sku',
            'base_price' => 'base_price',
            'base_sale_price' => 'base_sale_price',
            'available_quantity' => 'available_quantity',
            'committed_quantity' => 'committed_quantity',
            'title' => function () {
                return Product::where_raw('id = product_id')->limit(1)->select('title');
            },
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
        ];
    }

    /**
     * Get all variants matching the filters, with their product and media.
     *
     * @since 1.0.0
     *
     * @param VariantListFilterDTO $filters Search, product, stock, date and sorting filters.
     * @return Collection Collection of Variant.
     */
    public function all(VariantListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Get a page of variants matching the filters, with their product and media.
     *
     * @since 1.0.0
     *
     * @param VariantListFilterDTO $filters Search, product, stock, date, sorting and pagination filters.
     * @return Paginator
     */
    public function paginated(VariantListFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Get the variants with the given IDs, with their product and media.
     *
     * @since 1.0.0
     *
     * @param int[] $ids Variant IDs.
     * @return Collection Collection of Variant.
     */
    public function get_by_ids(array $ids)
    {
        return $this->list_query(new VariantListFilterDTO())->where_in('id', $ids)->get();
    }

    /**
     * Find a variant by ID or throw an exception.
     *
     * @since 1.0.0
     *
     * @param int $id Variant ID.
     * @return Variant
     * @throws NotFoundException When the variant does not exist.
     */
    public function find(int $id)
    {
        $variant = $this->find_or_null($id);

        throw_if(empty($variant), __('Variant not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $variant;
    }

    /**
     * Find a variant by ID without throwing when missing.
     *
     * @since 1.0.0
     *
     * @param int $id Variant ID.
     * @return Variant|null
     */
    public function find_or_null(int $id)
    {
        return Variant::with(['product.media', 'attribute_values'])->where('id', $id)->first();
    }

    /**
     * Create a new variant and sync its attribute values.
     *
     * @since 1.0.0
     *
     * @param CreateVariantDTO $data Variant data.
     * @return Variant
     */
    public function create(CreateVariantDTO $data)
    {
        $data_array = $data->all();

        $data_array['created_by'] = user()->get_id();
        $data_array['updated_by'] = user()->get_id();

        $variant = Variant::create($data_array);

        $variant->attribute_values()->sync($data->attribute_values);

        return $variant;
    }

    /**
     * Update a variant and sync its attribute values.
     *
     * @since 1.0.0
     *
     * @param UpdateVariantDTO $data Variant data, including its ID.
     * @return Variant
     * @throws NotFoundException When the variant does not exist or could not be updated.
     */
    public function update(UpdateVariantDTO $data)
    {
        $data_array = $data->all();

        $data_array['updated_by'] = user()->get_id();

        $variant = $this->update_variant($data->id, $data_array);

        $variant->attribute_values()->sync($data->attribute_values);

        /* translators: %s: variant ID */
        throw_if(!$variant, sprintf(__('Variant with id %s could not be updated.', 'kirki-ecommerce'), $data->id), NotFoundException::class, Response::NOT_FOUND);

        return $variant;
    }

    /**
     * Update only the given fields of a variant.
     *
     * @since 1.0.0
     *
     * @param int                  $id   Variant ID.
     * @param array<string, mixed> $data Column values to update.
     * @return Variant|null The reloaded variant; null when the update failed.
     * @throws NotFoundException When the variant does not exist.
     */
    public function partial_update($id, array $data)
    {
        return $this->update_variant($id, $data) ? $this->find($id) : null;
    }

    /**
     * Update several variants in one transaction.
     *
     * Rolls back and throws when any variant cannot be updated.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $variants Column values per variant, each including its `id`.
     * @return Variant[] The updated variants.
     * @throws NotFoundException When no variants are given, one has no ID, or one cannot be updated.
     */
    public function bulk_update(array $variants)
    {
        throw_if(empty($variants), __('No variants selected.', 'kirki-ecommerce'), NotFoundException::class);

        DB::begin_transaction();

        $updated_variants = [];

        foreach ($variants as $variant) {
            throw_if(empty($variant['id']), __('Variant id is required.', 'kirki-ecommerce'), NotFoundException::class);

            $updated_variant = $this->update_variant($variant['id'], $variant);

            if (!$updated_variant) {
                DB::rollback();

                throw_anyway(
                    sprintf(
                        /* translators: %s: variant id */
                        __('Variant with id %s could not be updated.', 'kirki-ecommerce'),
                        $variant['id']
                    ),
                    NotFoundException::class,
                    Response::NOT_FOUND
                );
            }

            $updated_variants[] = $updated_variant;
        }

        DB::commit();

        return $updated_variants;
    }

    /**
     * Increment a numeric column of a variant.
     *
     * @since 1.0.0
     *
     * @param int    $id     Variant ID.
     * @param string $column Column to increment.
     * @param int    $amount Amount to add.
     * @return bool True when a row was updated.
     */
    public function increment(int $id, string $column, int $amount = 1)
    {
        return (bool) Variant::query()->where('id', $id)->increment($column, $amount);
    }

    /**
     * Decrement a numeric column of a variant.
     *
     * @since 1.0.0
     *
     * @param int    $id     Variant ID.
     * @param string $column Column to decrement.
     * @param int    $amount Amount to subtract.
     * @return bool True when a row was updated.
     */
    public function decrement(int $id, string $column, int $amount = 1)
    {
        return (bool) Variant::query()->where('id', $id)->decrement($column, $amount);
    }

    /**
     * Delete a variant by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Variant ID.
     * @return bool Always true; failure throws.
     * @throws NotFoundException When no variant was deleted.
     */
    public function delete(int $id)
    {
        $is_deleted = (bool) Variant::query()->where('id', $id)->delete();

        /* translators: %s: variant ID */
        throw_if(!$is_deleted, sprintf(__('Variant with id %s could not be deleted.', 'kirki-ecommerce'), $id), NotFoundException::class, Response::NOT_FOUND);

        return true;
    }

    /**
     * Delete multiple variants by their IDs.
     *
     * @since 1.0.0
     *
     * @param int[] $ids IDs of the variants to delete.
     * @return bool Always true; failure throws.
     * @throws NotFoundException When no IDs are given or no variant was deleted.
     */
    public function bulk_delete(array $ids)
    {
        throw_if(empty($ids), __('No variants selected.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $is_deleted = (bool) Variant::where_in('id', $ids)->delete();

        throw_if(!$is_deleted, __('Variants could not be deleted.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return true;
    }

    /**
     * Delete every variant.
     *
     * @since 1.0.0
     *
     * @return bool True when rows were deleted.
     */
    public function delete_all()
    {
        return (bool) Variant::query()->delete();
    }

    /**
     * Update a variant and reload it with its product, media and attribute values.
     *
     * @since 1.0.0
     *
     * @param int                  $id   Variant ID.
     * @param array<string, mixed> $data Column values to update.
     * @return Variant|false False when the update did not succeed.
     * @throws NotFoundException When the variant does not exist.
     */
    protected function update_variant(int $id, array $data)
    {
        $variant = Variant::find($id);

        throw_if(empty($variant), __('Variant not found!', 'kirki-ecommerce'), NotFoundException::class);

        return $variant->update($data) ? $variant->load('product.media', 'attribute_values') : false;
    }

    /**
     * Build the filtered and sorted query for the list of variants.
     *
     * Filters by product search text or SKU, product brand, category, collection and
     * status, stock state and creation date range.
     *
     * @since 1.0.0
     *
     * @param VariantListFilterDTO $filters Search, product, stock, date and sorting filters.
     * @return QueryBuilder
     */
    protected function list_query(VariantListFilterDTO $filters)
    {
        $query = Variant::with('product.media', 'attribute_values');

        $query->where(function ($query) use ($filters) {
            $query->where_has('product', function ($product_query) use ($filters) {
                $product_query->when($filters->search, function ($product_query) use ($filters) {
                    return $product_query->where(function ($product_query) use ($filters) {
                        $product_query->where_like('title', '%' . $filters->search . '%');
                        $product_query->or_where_like('description', '%' . $filters->search . '%');
                        return $product_query;
                    });
                });
            });

            $query->when($filters->search, function ($query) use ($filters) {
                return $query->or_where_like('sku', '%' . $filters->search . '%');
            });
        });

        $query->where_has('product', function ($product_query) use ($filters) {
            $product_query->when($filters->brand_id, function ($product_query) use ($filters) {
                return $product_query->where('brand_id', $filters->brand_id);
            });

            $product_query->when($filters->category_ids, function ($product_query) use ($filters) {
                return $product_query->where_relation('categories', fn($q) => $q->where_in('category_id', $filters->category_ids));
            });

            $product_query->when($filters->collection_id, function ($product_query) use ($filters) {
                return $product_query->where_relation('collections', fn($q) => $q->where('collection_id', $filters->collection_id));
            });

            $product_query->when(!empty($filters->status) && in_array($filters->status, ProductStatus::get_constant_values()), function ($product_query) use ($filters) {
                return $product_query->where('status', $filters->status);
            });
        });

        $query->when(!empty($filters->inventory_type) && $filters->inventory_type === InventoryType::IN_STOCK, function ($query) {
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

        $query->when(!empty($filters->inventory_type) && $filters->inventory_type === InventoryType::OUT_OF_STOCK, function ($query) {
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

        $query->filter_with_datetime_range($filters->from_date, $filters->to_date);

        $this->apply_sorting($query, $filters);

        return $query;
    }
}
