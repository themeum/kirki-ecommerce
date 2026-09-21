<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Concerns\HasSortableColumns;
use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\App\DTO\Attribute\AttributeListFilterDTO;
use Kirki\Ecommerce\App\DTO\Attribute\CreateAttributeDTO;
use Kirki\Ecommerce\App\DTO\Attribute\UpdateAttributeDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

use Exception;
use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\user;

/**
 * Manages product attributes: listing, lookup and CRUD.
 *
 * @since 1.0.0
 */
class AttributeService
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
            'slug' => 'slug',
            'type' => 'type',
            'created_by' => 'created_by',
            'updated_by' => 'updated_by',
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
        ];
    }

    /**
     * Get a page of attributes, with their values, matching the filters.
     *
     * @since 1.0.0
     *
     * @param AttributeListFilterDTO $filters Search, type, sorting and pagination.
     * @return Paginator
     */
    public function paginated(AttributeListFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Get every attribute, with its values, matching the filters.
     *
     * @since 1.0.0
     *
     * @param AttributeListFilterDTO $filters Search, type and sorting.
     * @return Collection Collection of Attribute models.
     */
    public function all(AttributeListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find an attribute, with its values, by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Attribute ID.
     * @return Attribute
     * @throws NotFoundException When the attribute does not exist.
     */
    public function find(int $id)
    {
        $attribute = Attribute::with('values')->find($id);

        throw_if(empty($attribute), __('Attribute not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $attribute;
    }

    /**
     * Create a new attribute.
     *
     * If no slug is provided, it will be generated from the name. The current
     * user is recorded as creator and updater.
     *
     * @since 1.0.0
     *
     * @param CreateAttributeDTO $data Attribute data.
     * @return Attribute
     */
    public function create(CreateAttributeDTO $data)
    {
        $data->slug = empty($data->slug) ? $data->name : $data->slug;
        $data->slug = Attribute::generate_unique_slug($data->slug);

        $attributes = $data->to_array();
        $attributes['created_by'] = user()->get_id();
        $attributes['updated_by'] = user()->get_id();

        return Attribute::create($attributes);
    }

    /**
     * Update an attribute.
     *
     * If no slug is provided, it will be generated from the name. The nested
     * values in the payload are not persisted here.
     *
     * @since 1.0.0
     *
     * @param UpdateAttributeDTO $data Attribute data including the ID.
     * @return Attribute The refreshed attribute with its values.
     * @throws NotFoundException When the attribute does not exist.
     * @throws Exception When the update fails.
     */
    public function update(UpdateAttributeDTO $data)
    {
        $attribute = Attribute::find($data->id);

        throw_if(empty($attribute), __('Attribute could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $data->slug = empty($data->slug) ? $data->name : $data->slug;
        $data->slug = Attribute::generate_unique_slug($data->slug, $data->id);

        $attributes = $data->except(['values']);
        $attributes['updated_by'] = user()->get_id();

        $is_updated = (bool) $attribute->update($attributes);

        throw_if(!$is_updated, __('Attribute could not be updated.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        return $this->find($data->id);
    }

    /**
     * Delete an attribute by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Attribute ID.
     * @return bool Always true; failure is signalled by an exception.
     * @throws Exception When no attribute was deleted.
     */
    public function delete(int $id)
    {
        $is_deleted = (bool) Attribute::query()->where('id', $id)->delete();

        throw_if(!$is_deleted, __('Attribute could not be deleted.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        return true;
    }

    /**
     * Delete multiple attributes by their IDs.
     *
     * @since 1.0.0
     *
     * @param int[] $ids Attribute IDs.
     * @return bool Always true; failure is signalled by an exception.
     * @throws NotFoundException When no IDs are given.
     * @throws Exception When no attribute was deleted.
     */
    public function bulk_delete(array $ids)
    {
        throw_if(empty($ids), __('No attributes selected.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $is_deleted = (bool) Attribute::where_in('id', $ids)->delete();

        throw_if(!$is_deleted, __('Attributes could not be deleted.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        return true;
    }



    /**
     * Delete every attribute matching the filters.
     *
     * @since 1.0.0
     *
     * @param AttributeListFilterDTO $filters Search and type filters.
     * @return bool True when at least one attribute was deleted.
     */
    public function delete_all(AttributeListFilterDTO $filters)
    {
        return (bool) $this->list_query($filters)->delete();
    }

    /**
     * Build the attribute list query with search, type filter and sorting applied.
     *
     * @since 1.0.0
     *
     * @param AttributeListFilterDTO $filters Search, type and sorting.
     * @return QueryBuilder
     */
    protected function list_query(AttributeListFilterDTO $filters)
    {
        $query = Attribute::with('values')
            ->when($filters->search, function (QueryBuilder $query, $search) {
                return $query->where_any(['name', 'slug', 'type'], 'like', '%' . $search . '%');
            })
            ->when($filters->type, function (QueryBuilder $query, $type) {
                return $query->where('type', $type);
            });

        return $this->apply_sorting($query, $filters);
    }
}
