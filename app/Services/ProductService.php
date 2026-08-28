<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Constants\Product\AvailabilityStatus;
use Kirki\Ecommerce\App\DTO\Product\ProductListFilterDTO;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\App\DTO\Product\UpdateProductDTO;
use Kirki\Ecommerce\App\DTO\Product\CreateProductDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;

use function Kirki\Ecommerce\Framework\user;

class ProductService
{
    /**
     * Return paginated products
     *
     * @param ProductListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ProductListFilterDTO $filters)
    {
        $query = $this->list_query();

        return $this->apply_filters($query, $filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Return paginated products with variants
     *
     * @param ProductListFilterDTO $filters
     * @return Paginator
     */
    public function paginate_with_variants(ProductListFilterDTO $filters)
    {
        $query = Product::query()->with(['attributes', 'attribute_values', 'variants', 'variants.attribute_values', 'variants.product', 'media']);

        return $this->apply_filters($query, $filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Return all products
     *
     * @param ProductListFilterDTO $filters
     * @return Collection
     */
    public function all(ProductListFilterDTO $filters)
    {
        $query = $this->list_query();

        return $this->apply_filters($query, $filters)->get();
    }

    /**
     * Find a product by ID.
     *
     * @param int $id
     * @return Product
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $product = Product::with(['brand', 'currency', 'categories', 'tags', 'collections', 'attributes', 'attribute_values', 'variants.attribute_values', 'variants.product', 'media'])->find($id);

        if (empty($product)) {
            throw new NotFoundException(__('Product not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $product;
    }

    /**
     * Create a new product.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param CreateProductDTO $data
     * @return Product
     */
    public function create(CreateProductDTO $data)
    {
        $data->slug = empty($data->slug) ? $data->title : $data->slug;
        $data->slug = Product::generate_unique_slug($data->slug);

        $data_array = $data->all();

        $data_array['created_by'] = user()->get_id();
        $data_array['updated_by'] = user()->get_id();

        if ($data->status === ProductStatus::PUBLISHED) {
            $data_array['published_at'] = Date::now()->set_timezone('UTC');
        }

        $attributes = array_map(function ($attribute) {
            return $attribute['id'];
        }, $data->attributes);

        $attribute_values = array_map(function ($attribute) {
            return $attribute['values'];
        }, $data->attributes);

        $attribute_values = array_unique(array_merge(...$attribute_values));

        $product = Product::create($data_array);

        $product->media()->sync($this->format_ordering($data->media));
        $product->collections()->sync($data->collections);
        $product->categories()->sync($data->categories);
        $product->tags()->sync($data->tags);
        $product->attributes()->sync($this->format_ordering($attributes));
        $product->attribute_values()->sync($this->format_ordering($attribute_values));

        return $product;
    }

    /**
     * Updates a product.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param UpdateProductDTO $data
     * @throws NotFoundException
     * @return Product
     */
    public function update(UpdateProductDTO $data)
    {
        $product = Product::with(['brand', 'currency', 'categories', 'tags', 'collections', 'attributes', 'attribute_values', 'variants.attribute_values', 'variants.product', 'media'])->find($data->id);

        if (empty($product)) {
            throw new NotFoundException(__('Product could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $data->slug = empty($data->slug) ? $data->title : $data->slug;
        $data->slug = Product::generate_unique_slug($data->slug, $data->id);

        $data_array = $data->all();
        $data_array['updated_by'] = user()->get_id();

        if ($product->status !== $data->status) {
            if ($data->status === ProductStatus::PUBLISHED) {
                $data_array['published_at'] = Date::now()->set_timezone('UTC');
                $data_array['trashed_at'] = null;
            } else if ($data->status === ProductStatus::TRASHED) {
                $data_array['published_at'] = null;
                $data_array['trashed_at'] = Date::now()->set_timezone('UTC');
            } else {
                $data_array['published_at'] = null;
                $data_array['trashed_at'] = null;
            }
        }

        $is_updated = (bool) $product->update($data_array);

        if (!$is_updated) {
            throw new NotFoundException(__('Product could not be updated.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $attributes = array_map(function ($attribute) {
            return $attribute['id'];
        }, $data->attributes);

        $attribute_values = array_map(function ($attribute) {
            return $attribute['values'];
        }, $data->attributes);

        $attribute_values = array_unique(array_merge(...$attribute_values));

        $product->media()->sync($this->format_ordering($data->media));
        $product->collections()->sync($data->collections);
        $product->categories()->sync($data->categories);
        $product->tags()->sync($data->tags);
        $product->attributes()->sync($this->format_ordering($attributes));
        $product->attribute_values()->sync($this->format_ordering($attribute_values));

        return $product;
    }

    /**
     * Deletes a product by ID.
     *
     * @param int $id The ID of the product to delete.
     * @return bool True if the product was deleted successfully, false otherwise.
     * @throws NotFoundException If the product could not be found or deleted.
     */
    public function delete(int $id)
    {
        $is_deleted = (bool) Product::query()->where('id', $id)->delete();

        if (!$is_deleted) {
            throw new NotFoundException(__('Product could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Deletes multiple products by their IDs.
     *
     * @param array $ids The IDs of the products to delete.
     * @return bool True if the products were deleted successfully, false otherwise.
     * @throws NotFoundException If the products could not be found or deleted.
     */
    public function bulk_delete(array $ids)
    {
        if (empty($ids)) {
            throw new NotFoundException(__('No products selected.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = (bool) Product::query()
            ->where_in('id', $ids)
            ->where('status', ProductStatus::TRASHED)
            ->delete();

        if (!$is_deleted) {
            throw new NotFoundException(__('Products could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Deletes all products.
     *
     * @param ProductListFilterDTO $filters
     * @return bool True if successfully, false otherwise.
     */
    public function delete_all(ProductListFilterDTO $filters)
    {
        $query = Product::query();

        $filters->status = ProductStatus::TRASHED;

        return (bool) $this->apply_filters($query, $filters)
            ->delete();
    }

    /**
     * Trash multiple products by their IDs.
     *
     * @param array $ids The IDs of the products to trash.
     * @return bool True if the products were trashed successfully, false otherwise.
     * @throws NotFoundException If the products could not be found or trashed.
     */
    public function bulk_trash(array $ids)
    {
        if (empty($ids)) {
            throw new NotFoundException(__('No products selected.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_trashed = (bool) Product::query()->where_in('id', $ids)->update([
            'status' => ProductStatus::TRASHED,
            'trashed_at' => Date::now()->set_timezone('UTC'),
            'published_at' => null,
            'updated_by' => user()->get_id(),
        ]);

        if (!$is_trashed) {
            throw new NotFoundException(__('Products could not be trashed.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Trashes all products.
     *
     * @param ProductListFilterDTO $filters
     * @return bool True if successfully, false otherwise.
     */
    public function trash_all(ProductListFilterDTO $filters)
    {
        $query = Product::query();

        return (bool) $this->apply_filters($query, $filters)->update([
            'status' => ProductStatus::TRASHED,
            'trashed_at' => Date::now()->set_timezone('UTC'),
            'published_at' => null,
            'updated_by' => user()->get_id(),
        ]);
    }

    /**
     * Restore multiple products by their IDs.
     *
     * @param array $ids The IDs of the products to trash.
     * @return bool True if the products were trashed successfully, false otherwise.
     * @throws NotFoundException If the products could not be found or trashed.
     */
    public function bulk_restore(array $ids)
    {
        if (empty($ids)) {
            throw new NotFoundException(__('No products selected.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_trashed = (bool) Product::query()->where_in('id', $ids)
            ->where('status', ProductStatus::TRASHED)
            ->update([
                'status' => ProductStatus::DRAFT,
                'trashed_at' => null,
                'published_at' => null,
                'updated_by' => user()->get_id(),
            ]);

        if (!$is_trashed) {
            throw new NotFoundException(__('Products could not be restored.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Restores all products.
     *
     * @param ProductListFilterDTO $filters
     * @return bool True if successfully, false otherwise.
     */
    public function restore_all(ProductListFilterDTO $filters)
    {
        $query = Product::query();

        $filters->status = ProductStatus::TRASHED;

        return (bool) $this->apply_filters($query, $filters)
            ->update([
                'status' => ProductStatus::DRAFT,
                'trashed_at' => null,
                'published_at' => null,
                'updated_by' => user()->get_id(),
            ]);
    }

    protected function list_query()
    {
        $query = Product::query()->with(['categories', 'variants', 'media']);
        $query->select_raw('*, id as pid');

        return $query;
    }

    protected function apply_filters(QueryBuilder $query, ProductListFilterDTO $filters)
    {
        $query->when($filters->search, function (QueryBuilder $query, $search) {
            return $query->where_any(['title', 'description'], 'like', '%' . $search . '%');
        });

        $query->where_has('variants', function ($variant_query) use ($filters) {
            $variant_query->when($filters->search, function ($variant_query) use ($filters) {
                return $variant_query->where(function ($variant_query) use ($filters) {
                    $variant_query->where_like('sku', '%' . $filters->search . '%');
                    return $variant_query;
                });
            });
        });

        $this->apply_availability_status_filter($query, $filters->availability_status);

        $query->when($filters->brand_id, function ($query) use ($filters) {
            return $query->where('brand_id', $filters->brand_id);
        });

        $query->when($filters->brand_ids, function ($query) use ($filters) {
            return $query->where_in('brand_id', $filters->brand_ids);
        });

        $query->when($filters->attribute_value_ids, function (QueryBuilder $query, $attribute_value_ids) {
            $query->where_relation('attribute_values', fn($q) => $q->where_in('id', $attribute_value_ids));
        });

        $query->when($filters->min_price, function (QueryBuilder $query, $min_price) {
            $money = MoneyManager::to_minor($min_price);
            $query->where_relation('variants', function ($q) use ($money) {
                $q->where(fn($q) => $q->where('base_price', '>=', $money)->or_where('base_sale_price', '>=', $money));
            });
        });

        $query->when($filters->max_price, function (QueryBuilder $query, $max_price) {
            $money = MoneyManager::to_minor($max_price);
            $query->where_relation('variants', function ($q) use ($money) {
                $q->where(fn($q) => $q->where('base_price', '<=', $money)->or_where('base_sale_price', '<=', $money));
            });
        });

        $query->when($filters->category_ids, function ($query) use ($filters) {
            return $query->where_relation('categories', fn($q) => $q->where_in('category_id', $filters->category_ids));
        });

        $query->when($filters->collection_id, function ($query) use ($filters) {
            return $query->where_relation('collections', fn($q) => $q->where('collection_id', $filters->collection_id));
        });

        $query->when(!empty($filters->status), function ($query) use ($filters) {
            return $query->where('status', $filters->status);
        }, function (QueryBuilder $query) {
            return $query->where_not('status', ProductStatus::TRASHED);
        });

        $query->filter_with_datetime_range($filters->from_date, $filters->to_date);

        $query->when(!empty($filters->sort_by) && !empty($filters->sort_order), function (QueryBuilder $query) use ($filters) {
            return $query->order_by($filters->sort_by, $filters->sort_order);
        }, function (QueryBuilder $query) use ($filters) {
            $sort_by = $filters->sort_by ?? null;

            if ($sort_by === 'low_to_high') {
                return $query->order_by(Variant::where_raw('pid = product_id')->order_by('base_price', 'asc')->limit(1)->select('base_price'), 'asc');
            }

            if ($sort_by === 'high_to_low') {
                return $query->order_by(Variant::where_raw('pid = product_id')->order_by('base_price', 'desc')->limit(1)->select('base_price'), 'desc');
            }

            return $query->order_by('id', 'desc');
        });

        return $query;
    }

    /**
     * Filter products by their resolved availability status.
     *
     * A product's availability is the set-rule combination of its variants' own
     * statuses: every variant out -> out of stock; any variant low -> low stock;
     * a mix of available and unavailable variants (with none low) -> partially
     * stocked; otherwise in stock. See AvailabilityService for the canonical
     * definition this mirrors in SQL.
     *
     * @param QueryBuilder $query
     * @param string|null $availability_status
     * @return void
     */
    protected function apply_availability_status_filter(QueryBuilder $query, $availability_status)
    {
        if (empty($availability_status)) {
            return;
        }

        $store_default_threshold = (int) Settings::get('product.low_stock_threshold', 0);

        $is_low = function ($variant_query) use ($store_default_threshold) {
            $variant_query->where('track_inventory', true);
            $variant_query->where('available_quantity', '>', 0);
            $variant_query->where(function ($variant_query) use ($store_default_threshold) {
                $variant_query->where(function ($variant_query) {
                    $variant_query->where_not_null('low_stock_threshold');
                    $variant_query->where_column('available_quantity', '<=', 'low_stock_threshold');
                });
                $variant_query->or_where(function ($variant_query) use ($store_default_threshold) {
                    $variant_query->where_null('low_stock_threshold');
                    $variant_query->where('available_quantity', '<=', $store_default_threshold);
                });
            });
        };

        $is_out = function ($variant_query) {
            $variant_query->where(function ($variant_query) {
                $variant_query->where('track_inventory', true);
                $variant_query->where('available_quantity', '<=', 0);
            });
            $variant_query->or_where(function ($variant_query) {
                $variant_query->where('track_inventory', false);
                $variant_query->where('in_stock', false);
            });
        };

        $is_not_out = function ($variant_query) {
            $variant_query->where(function ($variant_query) {
                $variant_query->where('track_inventory', true);
                $variant_query->where('available_quantity', '>', 0);
            });
            $variant_query->or_where(function ($variant_query) {
                $variant_query->where('track_inventory', false);
                $variant_query->where('in_stock', true);
            });
        };

        if ($availability_status === AvailabilityStatus::LOW_STOCK) {
            $query->where_has('variants', $is_low);
            return;
        }

        if ($availability_status === AvailabilityStatus::OUT_OF_STOCK) {
            $query->where_not_has('variants', $is_not_out);
            return;
        }

        if ($availability_status === AvailabilityStatus::IN_STOCK) {
            $query->where_not_has('variants', $is_low);
            $query->where_not_has('variants', $is_out);
            return;
        }

        if ($availability_status === AvailabilityStatus::PARTIALLY_STOCKED) {
            $query->where_not_has('variants', $is_low);
            $query->where_has('variants', $is_out);
            $query->where_has('variants', $is_not_out);
        }
    }

    /**
     * Format the ordering of the given IDs.
     *
     * @param array $ids
     * @return array
     */
    protected function format_ordering($ids)
    {
        $ordered_data = [];

        foreach ($ids as $index => $id) {
            $ordered_data[$id] = ['ordering' => $index];
        }

        return $ordered_data;
    }

    /**
     * Get shop page data.
     *
     * @since 1.0.0
     *
     * @param array $filters filters.
     *
     * @return array{
     *      products: Paginator,
     *      filters: array
     * }
     */
    public function shop_page_data(array $filters = [])
    {
        $filters_dto = ProductListFilterDTO::from_array($filters);

        /**
         * @TODO: Currently fixed at 12 for the 4×3 layout.
         * This will be made dynamic based on the layout selected by the user.
         */
        $filters_dto->limit = 12;
        $filters_dto->status = 'published';
        $filters_dto->page = intval($filters['current_page'] ?? 1);
        $filters_dto->sort_order = null;

        $products = $this->paginated($filters_dto);

        return [
            'products' => $products,
            'filters'  => $filters,
        ];
    }
}
