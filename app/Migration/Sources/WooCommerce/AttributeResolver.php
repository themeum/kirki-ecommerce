<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\Models\MigrationRecordLedger;
use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;

use function Kirki\Ecommerce\Framework\user;

/**
 * Finds or creates the Kirki attribute and attribute value that a WooCommerce product attribute stands for.
 *
 * A global attribute that was migrated is reused through the record ledger. Any other attribute, such as a
 * product-level custom attribute, is matched by name, and created when no attribute has that name.
 * New values may be added to a matched attribute; no existing value is changed.
 *
 * @since 1.0.0
 */
class AttributeResolver
{
    /** @var RecordLedger */
    protected $ledger;

    /** @var int|null */
    protected $run_id;

    /** @var array<string, int> Attribute ids found so far, by lower-case name. */
    protected $attribute_ids = [];

    /**
     * Create the resolver.
     *
     * @since 1.0.0
     *
     * @param RecordLedger    $ledger The links between source and Kirki records.
     * @param int|null $run_id The current run, saved on the links this creates.
     */
    public function __construct(RecordLedger $ledger, $run_id = null)
    {
        $this->ledger = $ledger;
        $this->run_id = $run_id;
    }

    /**
     * Get the Kirki attribute id for a WooCommerce product attribute.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $attribute The attribute description: taxonomy (or null) and name.
     * @return int
     */
    public function attribute_id(array $attribute)
    {
        $label = $attribute['name'];

        if (!empty($attribute['taxonomy'])) {
            $global = $this->global_attribute($attribute['taxonomy']);

            if ($global !== null) {
                $migrated = $this->ledger->resolve('attribute', (int) $global['id']);

                if ($migrated !== null) {
                    return $migrated;
                }

                $label = $global['label'] !== null && $global['label'] !== '' ? $global['label'] : $global['name'];
            } else {
                $label = preg_replace('/^pa_/', '', $label);
            }
        }

        return $this->by_name((string) $label);
    }

    /**
     * Get the Kirki attribute value id for a value of a WooCommerce product attribute.
     *
     * @since 1.0.0
     *
     * @param int                  $attribute_id The Kirki attribute id.
     * @param array<string, mixed> $value        The value description: term_id (or null) and name.
     * @return int
     */
    public function value_id(int $attribute_id, array $value)
    {
        if (!empty($value['term_id'])) {
            $migrated = $this->ledger->resolve('attribute_value', (int) $value['term_id']);

            if ($migrated !== null) {
                return $migrated;
            }
        }

        $existing = AttributeValue::query()
            ->where('attribute_id', $attribute_id)
            ->where_raw('LOWER(value) = %s', [strtolower($value['name'])])
            ->first();

        $id = $existing ? (int) $existing->id : (int) AttributeValue::create(['attribute_id' => $attribute_id, 'value' => $value['name']])->id;

        if (!empty($value['term_id']) && !$this->ledger->exists('attribute_value', (int) $value['term_id'])) {
            $this->ledger->link('attribute_value', (int) $value['term_id'], $id, $this->run_id, $existing ? MigrationRecordLedger::ORIGIN_REUSED : MigrationRecordLedger::ORIGIN_CREATED);
        }

        return $id;
    }

    /**
     * Find a global WooCommerce attribute by its "pa_<name>" taxonomy.
     *
     * @since 1.0.0
     *
     * @param string $taxonomy The taxonomy, for example "pa_size".
     * @return array{id: int, name: string, label: string|null}|null
     */
    protected function global_attribute(string $taxonomy)
    {
        $row = DB::table('woocommerce_attribute_taxonomies')
            ->where('attribute_name', preg_replace('/^pa_/', '', $taxonomy))
            ->select(['attribute_id as id', 'attribute_name as name', 'attribute_label as label'])
            ->first();

        return $row ? (array) $row : null;
    }

    /**
     * Find a Kirki attribute by name, ignoring case, or create it.
     *
     * @since 1.0.0
     *
     * @param string $name The attribute name.
     * @return int
     */
    protected function by_name(string $name)
    {
        $key = strtolower($name);

        if (isset($this->attribute_ids[$key])) {
            return $this->attribute_ids[$key];
        }

        $existing = Attribute::query()->where_raw('LOWER(name) = %s', [$key])->first();

        if ($existing) {
            return $this->attribute_ids[$key] = (int) $existing->id;
        }

        $attribute = Attribute::create([
            'name' => $name,
            'slug' => Attribute::generate_unique_slug($name),
            'type' => 'list',
            'created_by' => user()->get_id(),
            'updated_by' => user()->get_id(),
        ]);

        return $this->attribute_ids[$key] = (int) $attribute->id;
    }
}
