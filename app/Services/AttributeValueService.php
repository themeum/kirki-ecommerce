<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Concerns\HasSortableColumns;
use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\App\DTO\AttributeValue\BatchAttributeValuesDTO;
use Kirki\Ecommerce\App\DTO\AttributeValue\CreateAttributeValueDTO;
use Kirki\Ecommerce\App\DTO\AttributeValue\UpdateAttributeValueDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Manages the values that belong to product attributes.
 *
 * @since 1.0.0
 */
class AttributeValueService
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
            'attribute_id' => 'attribute_id',
            'value' => 'value',
            'color' => 'color',
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
        ];
    }

    /**
     * Get the values of an attribute, optionally searched and sorted.
     *
     * @since 1.0.0
     *
     * @param int           $attribute_id Attribute ID.
     * @param ListFilterDTO $filters      Search term and sorting.
     * @return Collection Collection of AttributeValue models.
     */
    public function all(int $attribute_id, ListFilterDTO $filters)
    {
        $query = AttributeValue::where('attribute_id', $attribute_id)->when(!empty($filters->search), function (QueryBuilder $query, $search) {
            return $query->where_any(['value', 'color'], 'like', '%' . $search . '%');
        });

        return $this->apply_sorting($query, $filters)->get();
    }

    /**
     * Get the IDs of all values belonging to an attribute.
     *
     * @since 1.0.0
     *
     * @param int $id Attribute ID.
     * @return int[] Attribute value IDs.
     */
    public function get_ids_by_attribute_id(int $id)
    {
        return array_column(AttributeValue::select('id')->where('attribute_id', $id)->get()->to_array(), 'id');
    }

    /**
     * Find an attribute value by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Attribute value ID.
     * @return AttributeValue
     * @throws NotFoundException When the attribute value does not exist.
     */
    public function find(int $id)
    {
        $attribute_value = AttributeValue::find($id);

        throw_if(empty($attribute_value), __('Attribute value not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $attribute_value;
    }

    /**
     * Insert one or more attribute value rows in a single query.
     *
     * @since 1.0.0
     *
     * @param array $values A row of column values, or a list of such rows.
     * @return bool
     */
    public function insert(array $values)
    {
        return AttributeValue::insert($values);
    }

    /**
     * Create a new attribute value.
     *
     * @since 1.0.0
     *
     * @param CreateAttributeValueDTO $data Attribute value data.
     * @return AttributeValue
     */
    public function create(CreateAttributeValueDTO $data)
    {
        return AttributeValue::create($data->to_array());
    }

    /**
     * Create and recolor several values of one attribute in a single transaction.
     *
     * @since 1.0.0
     *
     * @param BatchAttributeValuesDTO $data Rows to create and rows to recolor.
     * @return Attribute The attribute with all of its values after the batch.
     * @throws Throwable When persisting fails; the transaction is rolled back first.
     */
    public function batch(BatchAttributeValuesDTO $data)
    {
        DB::begin_transaction();

        try {
            foreach ($data->create ?? [] as $row) {
                AttributeValue::create([
                    'attribute_id' => $data->attribute_id,
                    'value' => $row['value'],
                    'color' => $row['color'] ?? null,
                ]);
            }

            foreach ($data->update ?? [] as $row) {
                AttributeValue::where('id', (int) $row['id'])
                    ->where('attribute_id', $data->attribute_id)
                    ->update(['color' => $row['color'] ?? null]);
            }

            DB::commit();
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }

        return Attribute::with('values')->find($data->attribute_id);
    }

    /**
     * Update an attribute value.
     *
     * @since 1.0.0
     *
     * @param UpdateAttributeValueDTO $data Attribute value data including the ID.
     * @return AttributeValue The refreshed attribute value.
     * @throws NotFoundException When the attribute value does not exist or cannot be updated.
     */
    public function update(UpdateAttributeValueDTO $data)
    {
        $attribute_value = AttributeValue::find($data->id);

        throw_if(empty($attribute_value), __('Attribute value could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $is_updated = (bool) $attribute_value->update($data->to_array());

        throw_if(!$is_updated, __('Attribute value could not be updated.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return AttributeValue::find($data->id);
    }

    /**
     * Delete an attribute value by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Attribute value ID.
     * @return bool Always true; failure is signalled by an exception.
     * @throws NotFoundException When no attribute value was deleted.
     */
    public function delete(int $id)
    {
        $is_deleted = (bool) AttributeValue::query()->where('id', $id)->delete();

        throw_if(!$is_deleted, __('Attribute value could not be deleted.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return true;
    }

    /**
     * Delete multiple attribute values by their IDs.
     *
     * @since 1.0.0
     *
     * @param int[] $ids Attribute value IDs.
     * @return bool Always true; failure is signalled by an exception.
     * @throws NotFoundException When no attribute value was deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = (bool) AttributeValue::where_in('id', $ids)->delete();

        throw_if(!$is_deleted, __('Attributes could not be deleted.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return true;
    }

    /**
     * Delete every attribute value matching the search filter.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search term.
     * @return bool True when at least one attribute value was deleted.
     */
    public function delete_all(ListFilterDTO $filters)
    {
        return (bool) AttributeValue::when($filters->search, function (QueryBuilder $query, $search) {
            return $query->where_any(['value', 'color'], 'like', '%' . $search . '%');
        })->delete();
    }
}
