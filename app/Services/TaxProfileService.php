<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Concerns\HasSortableColumns;
use Kirki\Ecommerce\App\Models\TaxProfile;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\DTO\TaxProfile\CreateTaxProfileDTO;
use Kirki\Ecommerce\App\DTO\TaxProfile\UpdateTaxProfileDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Manages tax profiles: listing, lookup, creation, updates and deletion, keeping a single default.
 *
 * @since 1.0.0
 */
class TaxProfileService
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
     * Get a page of tax profiles matching the filters.
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
     * Get all tax profiles matching the filters, without pagination.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search and sorting filters.
     * @return Collection Collection of TaxProfile.
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a tax profile by ID or throw an exception.
     *
     * @since 1.0.0
     *
     * @param int $id Tax profile ID.
     * @return TaxProfile
     * @throws NotFoundException When the tax profile does not exist.
     */
    public function find(int $id)
    {
        $tax_profile = TaxProfile::find($id);

        throw_if(!$tax_profile, __('Tax profile not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $tax_profile;
    }

    /**
     * Find the default tax profile.
     *
     * @since 1.0.0
     *
     * @return TaxProfile|null Null when no tax profile is marked as default.
     */
    public function find_default()
    {
        return TaxProfile::where('is_default', true)->first() ?? null;
    }

    /**
     * Create a new tax profile.
     *
     * Marking it as default clears the flag on every other tax profile.
     *
     * @since 1.0.0
     *
     * @param CreateTaxProfileDTO $data Tax profile data.
     * @return TaxProfile
     */
    public function create(CreateTaxProfileDTO $data)
    {
        $tax_profile = TaxProfile::create($data->to_array());

        if ($tax_profile->is_default) {
            TaxProfile::where('id', '!=', $tax_profile->id)->update(['is_default' => false]);
        }

        return $tax_profile;
    }

    /**
     * Update a tax profile.
     *
     * Marking it as default clears the flag on every other tax profile.
     *
     * @since 1.0.0
     *
     * @param UpdateTaxProfileDTO $data Tax profile data, including its ID.
     * @return TaxProfile|null The reloaded tax profile.
     * @throws NotFoundException When the tax profile does not exist or could not be updated.
     */
    public function update(UpdateTaxProfileDTO $data)
    {
        $tax_profile = TaxProfile::find($data->id);

        throw_if(empty($tax_profile), __('Tax profile could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        if ($data->is_default) {
            TaxProfile::where('id', '!=', $data->id)->update(['is_default' => false]);
        }

        $is_updated = (bool) $tax_profile->update($data->to_array());

        throw_if(!$is_updated, __('Tax profile could not be updated.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return TaxProfile::find($data->id);
    }

    /**
     * Delete a tax profile by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Tax profile ID.
     * @return bool Always true; failure throws.
     * @throws NotFoundException When no tax profile was deleted.
     */
    public function delete(int $id)
    {
        $is_deleted = (bool) TaxProfile::query()->where('id', $id)->delete();

        throw_if(!$is_deleted, __('Tax profile could not be deleted.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return true;
    }

    /**
     * Delete multiple tax profiles by their IDs.
     *
     * @since 1.0.0
     *
     * @param int[] $ids IDs of the tax profiles to delete.
     * @return bool Always true; failure throws.
     * @throws NotFoundException When no tax profile was deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = (bool) TaxProfile::where_in('id', $ids)->delete();

        throw_if(!$is_deleted, __('Tax profiles could not be deleted.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return true;
    }

    /**
     * Delete all tax profiles matching the filters.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search filter selecting the tax profiles.
     * @return bool True when rows were deleted.
     */
    public function delete_all(ListFilterDTO $filters)
    {
        return (bool) $this->list_query($filters)->delete();
    }

    /**
     * Build the filtered and sorted query for the list of tax profiles.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search and sorting filters.
     * @return QueryBuilder
     */
    protected function list_query(ListFilterDTO $filters)
    {
        $query = TaxProfile::when($filters->search, function (QueryBuilder $query, $search) {
            return $query->where('name', 'like', '%' . $search . '%');
        });

        return $this->apply_sorting($query, $filters);
    }
}
