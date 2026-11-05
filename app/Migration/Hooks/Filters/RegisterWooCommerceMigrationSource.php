<?php

namespace Kirki\Ecommerce\App\Migration\Hooks\Filters;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Constants\MigrationHookNames;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceSource;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

/**
 * Adds WooCommerce to the sources that data can be migrated from.
 *
 * @since 1.0.0
 */
class RegisterWooCommerceMigrationSource extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name(): string
    {
        return MigrationHookNames::SOURCES;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type(): string
    {
        return HookTypes::FILTER;
    }

    /**
     * Add the WooCommerce source to the list.
     *
     * Responds to kirki_ecommerce_migration_sources.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments; the first is the list of sources so far.
     * @return array The sources with WooCommerce added.
     */
    public function handle(...$args)
    {
        $sources = is_array($args[0]) ? $args[0] : [];
        $sources[] = new WooCommerceSource();

        return $sources;
    }
}
