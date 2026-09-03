<?php

namespace Kirki\Ecommerce\App\Services;

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

class ShippingBoxService
{
    /**
     * Return paginated shipping boxes
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Return all shipping boxes
     *
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a shipping box by ID.
     *
     * @param int $id
     * @return ShippingBox
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $shipping_box = ShippingBox::find($id);

        if (!$shipping_box) {
            throw new NotFoundException(__('Shipping box not found.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        return $shipping_box;
    }

    /**
     * Find default shipping box.
     *
     * @return ShippingBox
     */
    public function find_default()
    {
        return ShippingBox::where('is_default', true)->first() ?? null;
    }

    /**
     * Create a new shipping box.
     *
     * @param CreateShippingBoxDTO $data
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
     * Updates a shipping box.
     *
     * @param UpdateShippingBoxDTO $data
     * @throws NotFoundException
     * @return ShippingBox
     */
    public function update(UpdateShippingBoxDTO $data)
    {
        $shipping_box = ShippingBox::find($data->id);

        if (empty($shipping_box)) {
            throw new NotFoundException(__('Shipping box could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        $current_default = $this->find_default();

        if ($data->is_default && $current_default && $current_default->id !== $data->id) {
            $current_default->update(['is_default' => false]);
        }

        if (!$data->is_default && $current_default && $current_default->id === $data->id) {
            throw new NotFoundException(__('At least one default shipping box is required.', 'kirki-ecommerce'), Response::BAD_REQUEST); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        $is_updated = (bool) $shipping_box->update($data->to_array());

        if (!$is_updated) {
            throw new NotFoundException(__('Shipping box could not be updated.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        return ShippingBox::find($data->id);
    }

    /**
     * Deletes a shipping box by ID.
     *
     * @param int $id The ID of the shipping box to delete.
     * @return bool True if the shipping box was deleted successfully, false otherwise.
     * @throws NotFoundException If the shipping box could not be found or deleted.
     */
    public function delete(int $id)
    {
        $is_deleted = (bool) ShippingBox::query()->where('id', $id)->delete();

        if (!$is_deleted) {
            throw new NotFoundException(__('Shipping box could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        return true;
    }

    /**
     * Deletes multiple shipping boxes by their IDs.
     *
     * @param array $ids The IDs of the shipping boxes to delete.
     * @return bool True if the shipping boxes were deleted successfully, false otherwise.
     * @throws NotFoundException If the shipping boxes could not be found or deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = (bool) ShippingBox::where_in('id', $ids)->delete();

        if (!$is_deleted) {
            throw new NotFoundException(__('Shipping boxes could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        return true;
    }

    /**
     * Deletes all tax profiles.
     *
     * @param ListFilterDTO $filters
     * @return bool True if successfully, false otherwise.
     */
    public function delete_all(ListFilterDTO $filters)
    {
        return (bool) $this->list_query($filters)->delete();
    }

    protected function list_query(ListFilterDTO $filters)
    {
        return ShippingBox::when($filters->search, function (QueryBuilder $query, $search) {
            return $query->where_any(['name', 'description'], 'like', '%' . $search . '%');
        })
            ->when(!empty($filters->sort_by) && !empty($filters->sort_order), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters->sort_by, $filters->sort_order);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            });
    }
}
