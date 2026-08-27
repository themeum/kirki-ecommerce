<?php

namespace Kirki\Ecommerce\App\Services;

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

use function Kirki\Ecommerce\Framework\user;

class VariantService
{
    /**
     * Get all variants with product and media.
     *
     * @param VariantListFilterDTO $filters
     * @return Collection
     */
    public function all(VariantListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Get all variants with product and media.
     *
     * @param VariantListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(VariantListFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Get all variants with product and media by ids.
     *
     * @param array $ids
     * @return Collection
     */
    public function get_by_ids(array $ids)
    {
        return $this->list_query(new VariantListFilterDTO())->where_in('id', $ids)->get();
    }

    /**
     * Find a variant by ID.
     *
     * @param int $id
     * @return Variant
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $variant = $this->find_or_null($id);

        if (empty($variant)) {
            throw new NotFoundException(__('Variant not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $variant;
    }

    /**
     * Find a variant by ID without throwing when missing.
     *
     * @param int $id
     * @return Variant|null
     */
    public function find_or_null(int $id)
    {
        return Variant::with(['product.media', 'attribute_values'])->where('id', $id)->first();
    }

    /**
     * Create a new variant.
     *
     * @param CreateVariantDTO $data
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
     * Updates a variant.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param UpdateVariantDTO $data
     * @throws NotFoundException
     * @return Variant
     */
    public function update(UpdateVariantDTO $data)
    {
        $data_array = $data->all();

        $data_array['updated_by'] = user()->get_id();

        $variant = $this->update_variant($data->id, $data_array);

        $variant->attribute_values()->sync($data->attribute_values);

        if (!$variant) {
            throw new NotFoundException(sprintf(__('Variant with id %s could not be updated.', 'kirki-ecommerce'), $data->id), Response::NOT_FOUND);
        }

        return $variant;
    }

    /**
     * Partial update
     * @param mixed $id
     * @param array $data
     * @return Variant|null
     */
    public function partial_update($id, array $data)
    {
        return $this->update_variant($id, $data) ? $this->find($id) : null;
    }

    /**
     * Bulk update
     * @param array $variants
     * @return array
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

            $updated_variant = $this->update_variant($variant['id'], $variant);

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
        return (bool) Variant::query()->where('id', $id)->increment($column, $amount);
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
        return (bool) Variant::query()->where('id', $id)->decrement($column, $amount);
    }

    /**
     * Deletes a variant by ID.
     *
     * @param int $id The ID of the variant to delete.
     * @return bool True if the variant was deleted successfully, false otherwise.
     * @throws NotFoundException If the variant could not be found or deleted.
     */
    public function delete(int $id)
    {
        $is_deleted = (bool) Variant::query()->where('id', $id)->delete();

        if (!$is_deleted) {
            throw new NotFoundException(sprintf(__('Variant with id %s could not be deleted.', 'kirki-ecommerce'), $id), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Deletes multiple variants by their IDs.
     *
     * @param array $ids The IDs of the variants to delete.
     * @return bool True if the variants were deleted successfully, false otherwise.
     * @throws NotFoundException If the variants could not be found or deleted.
     */
    public function bulk_delete(array $ids)
    {
        if (empty($ids)) {
            throw new NotFoundException(__('No variants selected.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = (bool) Variant::where_in('id', $ids)->delete();

        if (!$is_deleted) {
            throw new NotFoundException(__('Variants could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Deletes all variants.
     *
     * @return bool True if successfully, false otherwise.
     */
    public function delete_all()
    {
        return (bool) Variant::query()->delete();
    }

    /**
     * Update a variant by ID.
     *
     * @param int $id
     * @param array $data
     * @return Variant|false
     */
    protected function update_variant(int $id, array $data)
    {
        $variant = Variant::find($id);

        if (empty($variant)) {
            throw new NotFoundException(__('Variant not found!', 'kirki-ecommerce'));
        }

        return $variant->update($data) ? $variant : false;
    }

    /**
     * List query.
     *
     * @param VariantListFilterDTO $filters
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

        $query->when(!empty($filters->sort_by) && !empty($filters->sort_order), function ($query) use ($filters) {
            return $query->order_by($filters->sort_by, $filters->sort_order);
        }, function ($query) {
            return $query->order_by('id', 'desc');
        });

        return $query;
    }
}
