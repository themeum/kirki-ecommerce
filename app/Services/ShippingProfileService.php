<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Concerns\HasSortableColumns;
use Kirki\Ecommerce\App\Models\ShippingProfile;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\DTO\ShippingProfile\CreateShippingProfileDTO;
use Kirki\Ecommerce\App\DTO\ShippingProfile\UpdateShippingProfileDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Manages shipping profiles: listing, lookup, creation, updates and deletion, keeping a single default.
 *
 * @since 1.0.0
 */
class ShippingProfileService
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
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
        ];
    }

    /**
     * Get a page of shipping profiles matching the filters.
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
     * Get all shipping profiles matching the filters, without pagination.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search and sorting filters.
     * @return Collection Collection of ShippingProfile.
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a shipping profile by ID or throw an exception.
     *
     * @since 1.0.0
     *
     * @param int $id Shipping profile ID.
     * @return ShippingProfile
     * @throws NotFoundException When the shipping profile does not exist.
     */
    public function find(int $id)
    {
        $shipping_profile = ShippingProfile::find($id);

        throw_if(!$shipping_profile, __('Shipping profile not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $shipping_profile;
    }

    /**
     * Find the default shipping profile.
     *
     * @since 1.0.0
     *
     * @return ShippingProfile|null Null when no shipping profile is marked as default.
     */
    public function find_default()
    {
        return ShippingProfile::where('is_default', true)->first() ?? null;
    }

    /**
     * Create a new shipping profile.
     *
     * Marking it as default clears the flag on every other shipping profile.
     *
     * @since 1.0.0
     *
     * @param CreateShippingProfileDTO $data Shipping profile data.
     * @return ShippingProfile
     */
    public function create(CreateShippingProfileDTO $data)
    {
        $shipping_profile = ShippingProfile::create($data->to_array());

        if ($shipping_profile->is_default) {
            ShippingProfile::where('id', '!=', $shipping_profile->id)->update(['is_default' => false]);
        }

        return $shipping_profile;
    }

    /**
     * Update a shipping profile.
     *
     * Marking it as default clears the flag on every other shipping profile.
     *
     * @since 1.0.0
     *
     * @param UpdateShippingProfileDTO $data Shipping profile data, including its ID.
     * @return ShippingProfile|null The reloaded shipping profile.
     * @throws NotFoundException When the shipping profile does not exist or could not be updated.
     */
    public function update(UpdateShippingProfileDTO $data)
    {
        $shipping_profile = ShippingProfile::find($data->id);

        throw_if(empty($shipping_profile), __('Shipping profile could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        if ($data->is_default) {
            ShippingProfile::where('id', '!=', $data->id)->update(['is_default' => false]);
        }

        $is_updated = (bool) $shipping_profile->update($data->to_array());

        throw_if(!$is_updated, __('Shipping profile could not be updated.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return ShippingProfile::find($data->id);
    }

    /**
     * Delete a shipping profile by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Shipping profile ID.
     * @return bool Always true; failure throws.
     * @throws NotFoundException When no shipping profile was deleted.
     */
    public function delete(int $id)
    {
        $is_deleted = (bool) ShippingProfile::query()->where('id', $id)->delete();

        throw_if(!$is_deleted, __('Shipping profile could not be deleted.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return true;
    }

    /**
     * Delete multiple shipping profiles by their IDs.
     *
     * @since 1.0.0
     *
     * @param int[] $ids IDs of the shipping profiles to delete.
     * @return bool Always true; failure throws.
     * @throws NotFoundException When no shipping profile was deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = (bool) ShippingProfile::where_in('id', $ids)->delete();

        throw_if(!$is_deleted, __('Shipping profiles could not be deleted.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return true;
    }

    /**
     * Delete all shipping profiles matching the filters.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search filter selecting the shipping profiles.
     * @return bool True when rows were deleted.
     */
    public function delete_all(ListFilterDTO $filters)
    {
        return (bool) $this->list_query($filters)->delete();
    }

    /**
     * Build the filtered and sorted query for the list of shipping profiles.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search and sorting filters.
     * @return QueryBuilder
     */
    protected function list_query(ListFilterDTO $filters)
    {
        $query = ShippingProfile::when($filters->search, function (QueryBuilder $query, $search) {
            return $query->where('name', 'like', '%' . $search . '%');
        });

        return $this->apply_sorting($query, $filters);
    }
}
