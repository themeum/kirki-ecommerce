<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\Framework\Supports\Str;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;

use function Kirki\Ecommerce\Framework\user;

/**
 * Migrates WooCommerce global product attributes with their values.
 *
 * @since 1.0.0
 */
class AttributesGroup extends WooCommerceGroup
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function id()
    {
        return 'attributes';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function label()
    {
        return __('Attributes', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function description()
    {
        return __('Global product attributes and their values.', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function count()
    {
        return $this->database->count_attributes();
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function entity()
    {
        return 'attribute';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function fetch(int $cursor, int $limit)
    {
        return $this->database->attributes($cursor, $limit);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function map(array $row, RecordLedger $ledger)
    {
        return [
            'name' => $row['label'] !== null && $row['label'] !== '' ? $row['label'] : $row['name'],
            'slug' => $row['name'],
            'values' => $this->database->attribute_values($row['name']),
        ];
    }

    /**
     * Save the attribute and its values and link each value.
     *
     * This does not call the attribute service, which opens its own transaction and would end the one that wraps the row.
     *
     * @since 1.0.0
     *
     * @inheritDoc
     */
    protected function persist($mapped, array $row, RecordLedger $ledger)
    {
        $slug = Attribute::generate_unique_slug($mapped['slug']);

        $attribute = Attribute::create([
            'name' => $mapped['name'],
            'slug' => $slug,
            'type' => 'list',
            'created_by' => user()->get_id(),
            'updated_by' => user()->get_id(),
        ]);

        $this->note_attribute_slug($mapped['name'], Str::slug($mapped['slug']), $slug);

        foreach ($mapped['values'] as $value) {
            $created = AttributeValue::create(['attribute_id' => $attribute->id, 'value' => $value['name']]);
            $ledger->link('attribute_value', (int) $value['id'], (int) $created->id, $this->run_id);
        }

        return (int) $attribute->id;
    }

    /**
     * Record a note when the attribute slug was changed because it was already used.
     *
     * @since 1.0.0
     *
     * @param string $name   The attribute name.
     * @param string $wanted The slug in WooCommerce.
     * @param string $saved  The slug that was saved.
     * @return void
     */
    protected function note_attribute_slug(string $name, string $wanted, string $saved)
    {
        if ($wanted !== $saved) {
            $this->note(sprintf(
                /* translators: 1: attribute name, 2: new slug */
                __('Attribute "%1$s" was saved with the slug "%2$s" because its slug was already used.', 'kirki-ecommerce'),
                $name,
                $saved
            ));
        }
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function ledger_entities()
    {
        return ['attribute', 'attribute_value'];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function revert_record(string $entity, int $kirki_ecommerce_id, $previous_value = null)
    {
        if ($entity === 'attribute_value') {
            return $this->remove_record(AttributeValue::class, $kirki_ecommerce_id, $this->value_in_use([$kirki_ecommerce_id]));
        }

        $value_ids = AttributeValue::query()->where('attribute_id', $kirki_ecommerce_id)->pluck('id')->all();

        return $this->remove_record(Attribute::class, $kirki_ecommerce_id, $this->value_in_use($value_ids));
    }

    /**
     * Check whether a product or a variant still uses one of the attribute values.
     *
     * @since 1.0.0
     *
     * @param int[] $value_ids The attribute value ids.
     * @return bool
     */
    protected function value_in_use(array $value_ids)
    {
        if (empty($value_ids)) {
            return false;
        }

        return DB::table('kirki_ecommerce_attribute_value_product')->where_in('attribute_value_id', $value_ids)->exists()
            || DB::table('kirki_ecommerce_attribute_value_variant')->where_in('attribute_value_id', $value_ids)->exists();
    }
}
