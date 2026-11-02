<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Core\AbstractGroupMigrator;
use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceDatabase;
use LogicException;

/**
 * Base class for the WooCommerce data groups.
 *
 * @since 1.0.0
 */
abstract class WooCommerceGroup extends AbstractGroupMigrator
{
    /** @var WooCommerceDatabase */
    protected $database;

    /**
     * Create the group with read access to the WooCommerce tables.
     *
     * @since 1.0.0
     *
     * @param WooCommerceDatabase $database The WooCommerce database reader.
     */
    public function __construct(WooCommerceDatabase $database)
    {
        $this->database = $database;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function fetch(int $cursor, int $limit)
    {
        throw new LogicException(esc_html__('Not implemented yet.', 'kirki-ecommerce'));
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function map(array $row, RecordLedger $ledger)
    {
        throw new LogicException(esc_html__('Not implemented yet.', 'kirki-ecommerce'));
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function persist($mapped, array $row, RecordLedger $ledger)
    {
        throw new LogicException(esc_html__('Not implemented yet.', 'kirki-ecommerce'));
    }

    /**
     * Delete one Kirki record, unless other data uses it.
     *
     * @since 1.0.0
     *
     * @param string $model_class        The model class of the record.
     * @param int    $kirki_ecommerce_id The Kirki id of the record.
     * @param bool   $is_in_use          Whether other data uses the record.
     * @return bool False when the record was kept.
     */
    protected function remove_record(string $model_class, int $kirki_ecommerce_id, bool $is_in_use)
    {
        if ($is_in_use) {
            return false;
        }

        $model_class::query()->where('id', $kirki_ecommerce_id)->delete();

        return true;
    }
}
