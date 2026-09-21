<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Concerns\HasSortableColumns;
use Kirki\Ecommerce\App\Models\ShippingBox;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\DTO\ShippingBox\CreateShippingBoxDTO;
use Kirki\Ecommerce\App\DTO\ShippingBox\UpdateShippingBoxDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Manages shipping boxes and keeps exactly one of them as the default.
 *
 * @since 1.0.0
 */
class ShippingBoxService
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
            'name' => 'name',
            'width' => 'width',
            'height' => 'height',
            'length' => 'length',
            'is_default' => 'is_default',
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
        ];
    }

    /**
     * Get a page of shipping boxes matching the filters.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search, sorting and pagination filters.
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Get all shipping boxes matching the filters, without pagination.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search and sorting filters.
     * @return Collection Collection of ShippingBox.
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a shipping box by ID or throw an exception.
     *
     * @since 1.0.0
     *
     * @param int $id Shipping box ID.
     * @return ShippingBox
     * @throws NotFoundException When the shipping box does not exist.
     */
    public function find(int $id)
    {
        $shipping_box = ShippingBox::find($id);

        throw_if(!$shipping_box, __('Shipping box not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $shipping_box;
    }

    /**
     * Find the default shipping box.
     *
     * @since 1.0.0
     *
     * @return ShippingBox|null Null when no box is marked as default.
     */
    public function find_default()
    {
        return ShippingBox::where('is_default', true)->first() ?? null;
    }

    /**
     * Create a new shipping box.
     *
     * The box becomes the default only when no default exists yet.
     *
     * @since 1.0.0
     *
     * @param CreateShippingBoxDTO $data Shipping box data.
     * @return ShippingBox
     */
    public function create(CreateShippingBoxDTO $data)
    {
        $current_default = $this->find_default();

        $data->is_default = empty($current_default);

        $shipping_box = ShippingBox::create($data->to_array());

        if ($shipping_box->is_default && $current_default && $current_default->id !== $shipping_box->id) {
            $current_default->update(['is_default' => false]);
        }

        return $shipping_box;
    }

    /**
     * Update a shipping box.
     *
     * Marking a box as default clears the flag on the previous default, and the
     * current default cannot be unmarked directly.
     *
     * @since 1.0.0
     *
     * @param UpdateShippingBoxDTO $data Shipping box data, including its ID.
     * @return ShippingBox|null The reloaded shipping box.
     * @throws NotFoundException When the box does not exist, could not be updated, or is the default being unmarked.
     */
    public function update(UpdateShippingBoxDTO $data)
    {
        $shipping_box = ShippingBox::find($data->id);

        throw_if(empty($shipping_box), __('Shipping box could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $current_default = $this->find_default();

        if ($data->is_default && $current_default && $current_default->id !== $data->id) {
            $current_default->update(['is_default' => false]);
        }

        throw_if(!$data->is_default && $current_default && $current_default->id === $data->id, __('At least one default shipping box is required.', 'kirki-ecommerce'), NotFoundException::class, Response::BAD_REQUEST);

        $is_updated = (bool) $shipping_box->update($data->to_array());

        throw_if(!$is_updated, __('Shipping box could not be updated.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return ShippingBox::find($data->id);
    }

    /**
     * Delete a shipping box by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Shipping box ID.
     * @return bool Always true; failure throws.
     * @throws NotFoundException When no shipping box was deleted.
     */
    public function delete(int $id)
    {
        $is_deleted = (bool) ShippingBox::query()->where('id', $id)->delete();

        throw_if(!$is_deleted, __('Shipping box could not be deleted.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return true;
    }

    /**
     * Delete multiple shipping boxes by their IDs.
     *
     * @since 1.0.0
     *
     * @param int[] $ids IDs of the shipping boxes to delete.
     * @return bool Always true; failure throws.
     * @throws NotFoundException When no shipping box was deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = (bool) ShippingBox::where_in('id', $ids)->delete();

        throw_if(!$is_deleted, __('Shipping boxes could not be deleted.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return true;
    }

    /**
     * Delete all shipping boxes matching the filters.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search filter selecting the shipping boxes.
     * @return bool True when rows were deleted.
     */
    public function delete_all(ListFilterDTO $filters)
    {
        return (bool) $this->list_query($filters)->delete();
    }

    /**
     * Build the filtered and sorted query for the list of shipping boxes.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search and sorting filters.
     * @return QueryBuilder
     */
    protected function list_query(ListFilterDTO $filters)
    {
        $query = ShippingBox::when($filters->search, function (QueryBuilder $query, $search) {
            return $query->where_any(['name', 'description'], 'like', '%' . $search . '%');
        });

        return $this->apply_sorting($query, $filters);
    }
}
