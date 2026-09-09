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

class AttributeService
{
    use HasSortableColumns;

    /**
     * @return array<string, mixed>
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
     * Return paginated attributes
     *
     * @param AttributeListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(AttributeListFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Return all attributes
     *
     * @param AttributeListFilterDTO $filters
     * @return Collection
     */
    public function all(AttributeListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a attribute by ID.
     *
     * @param int $id
     * @return Attribute
     * @throws NotFoundException
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
     * If no slug is provided, it will be generated from the name.
     *
     * @param CreateAttributeDTO $data
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
     * Updates a attribute.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @throws NotFoundException
     * @throws Exception
     * @return Attribute
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
     * Deletes a attribute by ID.
     *
     * @param int $id The ID of the attribute to delete.
     * @return bool True if the attribute was deleted successfully, false otherwise.
     * @throws NotFoundException If the attribute could not be found or deleted.
     * @throws Exception If the attribute could not be deleted.
     */
    public function delete(int $id)
    {
        $is_deleted = (bool) Attribute::query()->where('id', $id)->delete();

        throw_if(!$is_deleted, __('Attribute could not be deleted.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        return true;
    }

    /**
     * Deletes multiple attributes by their IDs.
     *
     * @param array $ids The IDs of the attributes to delete.
     * @return bool True if the attributes were deleted successfully, false otherwise.
     * @throws NotFoundException If the attributes could not be found or deleted.
     * @throws Exception If the attributes could not be deleted.
     */
    public function bulk_delete(array $ids)
    {
        throw_if(empty($ids), __('No attributes selected.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $is_deleted = (bool) Attribute::where_in('id', $ids)->delete();

        throw_if(!$is_deleted, __('Attributes could not be deleted.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        return true;
    }



    /**
     * Deletes all attributes.
     *
     * @param AttributeListFilterDTO $filters
     * @return bool True if successfully, false otherwise.
     */
    public function delete_all(AttributeListFilterDTO $filters)
    {
        return (bool) $this->list_query($filters)->delete();
    }

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
