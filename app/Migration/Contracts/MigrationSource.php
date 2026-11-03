<?php

namespace Kirki\Ecommerce\App\Migration\Contracts;

defined('ABSPATH') || exit;

/**
 * Contract for a plugin that data can be migrated from.
 *
 * @since 1.0.0
 */
interface MigrationSource
{
    /**
     * Get the stable id of the source, for example "woocommerce".
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function id();

    /**
     * Get the display name of the source.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function label();

    /**
     * Check whether the source plugin is installed and holds data.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function detect();

    /**
     * Get the installed version and whether it can be migrated from.
     *
     * @since 1.0.0
     *
     * @return array{version: string|null, minimum: string, supported: bool}
     */
    public function version_state();

    /**
     * Get the extension plugins found for the source.
     *
     * @since 1.0.0
     *
     * @return array<int, array{slug: string, label: string, status: string}>
     */
    public function extensions();

    /**
     * Get all data groups of the source in dependency order.
     *
     * @since 1.0.0
     *
     * @return GroupMigrator[]
     */
    public function groups();
}
