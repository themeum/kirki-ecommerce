<?php

/**
 * Renames every index, unique key and foreign key on the plugin's tables to an explicit,
 * project-owned name.
 *
 * Framework 2.1.15 compiled foreign keys without a CONSTRAINT clause and ignored the name passed
 * to Structure::foreign(), so every foreign key on a site created before framework 3.x carries an
 * engine-assigned name. Indexes and unique keys did not drift; they are renamed here so that a
 * single scheme covers every key and no migration ever has to guess what a key is called.
 *
 * ORDERING INVARIANT: this migration must stay registered after the last Create* migration and
 * before the first Alter* migration. At that point an upgraded database and a fresh install hold
 * the same set of tables, which is what lets one code path serve both. Never reorder it, and never
 * edit it once released.
 */

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\App\Supports\SchemaKeys;
use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class AlterSchemaKeysToExplicitNames implements Migration
{
    public function up()
    {
        Schema::disabled_checking_foreign_key_constraints();

        try {
            foreach (SchemaKeys::get_tables() as $table) {
                $this->rename_table_keys($table);
            }
        } finally {
            Schema::enabled_checking_foreign_key_constraints();
        }
    }

    /**
     * Renaming back to engine-assigned names is neither possible nor wanted.
     *
     * @return void
     */
    public function down()
    {
    }

    /**
     * Bring every key on one table in line with the naming scheme.
     *
     * @param string $table The table name, without the WordPress table prefix.
     *
     * @return void
     */
    protected function rename_table_keys($table)
    {
        $foreign_keys = SchemaKeys::get_foreign_keys($table);
        $indexes = SchemaKeys::get_indexes($table);

        $backing_indexes = $this->collect_backing_indexes($foreign_keys, $indexes);

        $stale_foreign_keys = $this->collect_stale_foreign_keys($table, $foreign_keys);
        $stale_indexes = $this->collect_stale_indexes($table, $indexes, $backing_indexes);

        if (empty($stale_foreign_keys) && empty($stale_indexes)) {
            return;
        }

        $stale_backing_indexes = [];

        foreach ($stale_foreign_keys as $foreign_key) {
            if (isset($backing_indexes[$foreign_key['name']])) {
                $stale_backing_indexes[] = $backing_indexes[$foreign_key['name']];
            }
        }

        $this->drop_keys($table, $stale_foreign_keys, $stale_indexes, $stale_backing_indexes);
        $this->add_keys($table, $stale_foreign_keys, $stale_indexes);
    }

    /**
     * Map each foreign key to the index InnoDB created to back it, where there is one.
     *
     * InnoDB names an auto-created backing index after the constraint, or after the column when the
     * constraint itself is unnamed. Those are its only two choices, and the schema library never
     * produces either shape for a declared index, so matching them identifies a backing index
     * without any risk of catching a deliberately declared one.
     *
     * Getting this right is what makes the two populations converge: a database created before
     * framework 3.x has these indexes named after their column, and one created since has them
     * named after their constraint. Both are dropped with their constraint and recreated by InnoDB
     * under the new constraint name.
     *
     * @param array $foreign_keys The live foreign keys.
     * @param array $indexes The live indexes.
     *
     * @return array<string, string> Index name keyed by the constraint it backs.
     */
    protected function collect_backing_indexes(array $foreign_keys, array $indexes)
    {
        $backing = [];

        foreach ($foreign_keys as $foreign_key) {
            foreach ($indexes as $index) {
                if (count($index['columns']) !== 1 || $index['columns'][0] !== $foreign_key['column']) {
                    continue;
                }

                if ($index['name'] !== $foreign_key['name'] && $index['name'] !== $foreign_key['column']) {
                    continue;
                }

                $backing[$foreign_key['name']] = $index['name'];
            }
        }

        return $backing;
    }

    /**
     * Get the foreign keys whose name does not match the scheme, each with the name it should take.
     *
     * @param string $table The table name.
     * @param array $foreign_keys The live foreign keys.
     *
     * @return array
     */
    protected function collect_stale_foreign_keys($table, array $foreign_keys)
    {
        $stale = [];

        foreach ($foreign_keys as $foreign_key) {
            $expected = SchemaKeys::expected_name($table, [$foreign_key['column']], 'foreign');

            if ($foreign_key['name'] === $expected) {
                continue;
            }

            $foreign_key['expected'] = $expected;
            $stale[] = $foreign_key;
        }

        return $stale;
    }

    /**
     * Get the indexes whose name does not match the scheme, each with the name it should take.
     *
     * A foreign key's backing index is left out: InnoDB recreates it under the new constraint name
     * when the constraint is re-added, so naming it here would leave a duplicate behind.
     *
     * @param string $table The table name.
     * @param array $indexes The live indexes.
     * @param array $backing_indexes Index name keyed by the constraint it backs.
     *
     * @return array
     */
    protected function collect_stale_indexes($table, array $indexes, array $backing_indexes)
    {
        $stale = [];
        $backing_names = array_values($backing_indexes);

        foreach ($indexes as $index) {
            if (in_array($index['name'], $backing_names, true)) {
                continue;
            }

            $type = $index['unique'] ? 'unique' : 'index';
            $expected = SchemaKeys::expected_name($table, $index['columns'], $type);

            if ($index['name'] === $expected) {
                continue;
            }

            $index['expected'] = $expected;
            $stale[] = $index;
        }

        return $stale;
    }

    /**
     * Drop the keys that need renaming.
     *
     * Foreign keys go first: InnoDB refuses to drop an index an existing constraint depends on. A
     * dropped constraint leaves its backing index behind, so that index is dropped in the same
     * statement, otherwise re-adding the constraint would reuse it and keep the old name.
     *
     * @param string $table The table name.
     * @param array $foreign_keys The foreign keys to rename.
     * @param array $indexes The indexes to rename.
     * @param array $backing_index_names Backing indexes of the foreign keys being renamed.
     *
     * @return void
     */
    protected function drop_keys($table, array $foreign_keys, array $indexes, array $backing_index_names)
    {
        Schema::table($table, function (Structure $structure) use ($foreign_keys, $indexes, $backing_index_names) {
            foreach ($foreign_keys as $foreign_key) {
                $structure->drop_foreign($foreign_key['name']);
            }

            foreach ($backing_index_names as $index_name) {
                $structure->drop_index($index_name);
            }

            foreach ($indexes as $index) {
                $structure->drop_index($index['name']);
            }
        });
    }

    /**
     * Recreate the dropped keys under their scheme names, with their definitions unchanged.
     *
     * @param string $table The table name.
     * @param array $foreign_keys The foreign keys to recreate.
     * @param array $indexes The indexes to recreate.
     *
     * @return void
     */
    protected function add_keys($table, array $foreign_keys, array $indexes)
    {
        Schema::table($table, function (Structure $structure) use ($foreign_keys, $indexes) {
            foreach ($indexes as $index) {
                if ($index['unique']) {
                    $structure->unique($index['columns'], $index['expected']);
                    continue;
                }

                $structure->index($index['columns'], $index['expected']);
            }

            foreach ($foreign_keys as $foreign_key) {
                $definition = $structure->foreign($foreign_key['column'], $foreign_key['expected'])
                    ->references($foreign_key['references'])
                    ->on($foreign_key['on']);

                if (!$this->is_default_rule($foreign_key['on_delete'])) {
                    $definition->on_delete($foreign_key['on_delete']);
                }

                if (!$this->is_default_rule($foreign_key['on_update'])) {
                    $definition->on_update($foreign_key['on_update']);
                }
            }
        });
    }

    /**
     * Determine whether a referential rule is the engine default.
     *
     * RESTRICT and NO ACTION mean the same thing to MySQL and MariaDB, but the two are not reported
     * the same way: an omitted clause comes back as RESTRICT while an explicitly written one comes
     * back as NO ACTION. Writing the rule back out would therefore leave a renamed key describing
     * itself differently from an identical key that was simply created, which is a difference this
     * migration has no business introducing.
     *
     * @param string $rule The rule read from the information schema.
     *
     * @return bool
     */
    protected function is_default_rule($rule)
    {
        return in_array(strtoupper((string) $rule), ['RESTRICT', 'NO ACTION'], true);
    }
}
