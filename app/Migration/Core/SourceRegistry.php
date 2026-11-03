<?php

namespace Kirki\Ecommerce\App\Migration\Core;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Constants\MigrationHookNames;
use Kirki\Ecommerce\App\Migration\Contracts\MigrationSource;

/**
 * Holds the migration sources: the built-in ones and any added through the sources filter.
 *
 * @since 1.0.0
 */
class SourceRegistry
{
    /** @var array<string, MigrationSource> */
    protected $sources = [];

    /**
     * Build the registry from the sources the filter returns.
     *
     * Other plugins can add a source with the `kirki_ecommerce_migration_sources` filter.
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        /**
         * Filters the sources that data can be migrated from.
         *
         * @since 1.0.0
         *
         * @param MigrationSource[] $sources The sources.
         */
        $sources = apply_filters(MigrationHookNames::SOURCES, []);

        foreach ($sources as $source) {
            if ($source instanceof MigrationSource) {
                $this->register($source);
            }
        }
    }

    /**
     * Register a source.
     *
     * @since 1.0.0
     *
     * @param MigrationSource $source The source to add.
     * @return $this
     */
    public function register(MigrationSource $source)
    {
        $this->sources[$source->id()] = $source;

        return $this;
    }

    /**
     * Get a source by id.
     *
     * @since 1.0.0
     *
     * @param string $id The source id.
     * @return MigrationSource|null
     */
    public function get(string $id)
    {
        return $this->sources[$id] ?? null;
    }

    /**
     * Get all registered sources.
     *
     * @since 1.0.0
     *
     * @return MigrationSource[]
     */
    public function all()
    {
        return array_values($this->sources);
    }
}
