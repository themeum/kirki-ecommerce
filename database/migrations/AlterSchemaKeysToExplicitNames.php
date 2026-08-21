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
 * The work is done in schema-wide phases rather than table by table, because a key's dependencies
 * are not confined to its own table: the unique index on languages.code is what makes the foreign
 * keys on the three translation tables legal, so it cannot be dropped while any of them exists.
 * MySQL raises "Cannot drop index: needed in a foreign key constraint" in that situation even with
 * FOREIGN_KEY_CHECKS off; MariaDB permits it. Every foreign key in the schema is therefore dropped
 * before any index is touched, and every index is back in place before any foreign key returns.
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
            $this->rename_keys();
        } finally {
            Schema::enabled_checking_foreign_key_constraints();
        }
    }

    /**
     * Renaming back to engine-assigned names is neither possible nor wanted.
     *
     * @return void
     */
    public function down() {}

    /**
     * Bring every key in the schema in line with the naming scheme.
     *
     * @return void
     */
    protected function rename_keys()
    {
        $plan = $this->build_plan();

        if (!$this->has_work($plan)) {
            return;
        }

        $this->drop_foreign_keys($plan);
        $this->drop_indexes($plan);
        $this->add_indexes($plan);
        $this->add_foreign_keys($plan);
    }

    /**
     * Work out what has to happen to every table before changing anything.
     *
     * Each entry holds every foreign key on the table, each carrying the name it should take; the
     * indexes that need renaming; and the backing indexes that have to go because they no longer
     * carry the name of the constraint they belong to.
     *
     * @return array<string, array>
     */
    protected function build_plan()
    {
        $plan = [];

        foreach (SchemaKeys::get_tables() as $table) {
            $foreign_keys = $this->describe_foreign_keys($table);
            $indexes = SchemaKeys::get_indexes($table);
            $backing_indexes = $this->collect_backing_indexes($foreign_keys, $indexes);

            $plan[$table] = [
                'foreign_keys' => $foreign_keys,
                'stale_indexes' => $this->collect_stale_indexes($table, $indexes, $backing_indexes),
                'obsolete_backing_indexes' => $this->collect_obsolete_backing_indexes($foreign_keys, $backing_indexes),
                'has_stale_foreign_key' => $this->has_stale_foreign_key($foreign_keys),
            ];
        }

        return $plan;
    }

    /**
     * Determine whether the schema needs any renaming at all.
     *
     * Nothing is dropped when every key already carries its scheme name, which is what makes the
     * migration a no-op on a database that has already been through it.
     *
     * @param array $plan The plan.
     *
     * @return bool
     */
    protected function has_work(array $plan)
    {
        foreach ($plan as $table) {
            if ($table['has_stale_foreign_key'] || !empty($table['stale_indexes']) || !empty($table['obsolete_backing_indexes'])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get a table's foreign keys, each with the name the scheme derives for it.
     *
     * @param string $table The table name, without the WordPress table prefix.
     *
     * @return array
     */
    protected function describe_foreign_keys($table)
    {
        return array_map(function ($foreign_key) use ($table) {
            $foreign_key['expected'] = SchemaKeys::expected_name($table, [$foreign_key['column']], 'foreign');

            return $foreign_key;
        }, SchemaKeys::get_foreign_keys($table));
    }

    /**
     * Determine whether any of a table's foreign keys is misnamed.
     *
     * @param array $foreign_keys The described foreign keys.
     *
     * @return bool
     */
    protected function has_stale_foreign_key(array $foreign_keys)
    {
        foreach ($foreign_keys as $foreign_key) {
            if ($foreign_key['name'] !== $foreign_key['expected']) {
                return true;
            }
        }

        return false;
    }

    /**
     * Map each foreign key to the index InnoDB created to back it, where there is one.
     *
     * InnoDB names an auto-created backing index after the constraint, or after the column when the
     * constraint itself is unnamed. Those are its only two choices, and the schema library never
     * produces either shape for a declared index, so matching them identifies a backing index
     * without any risk of catching a deliberately declared one.
     *
     * @param array $foreign_keys The described foreign keys.
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
     * Get the backing indexes that have to be dropped along with their constraint.
     *
     * InnoDB reuses a suitable existing index when a foreign key is added, so a backing index left
     * behind under its old name would be adopted by the renamed constraint and keep that name
     * forever. One already carrying the constraint's new name is left alone and reused, which is
     * both correct and cheaper.
     *
     * Getting this right is what makes the two populations converge: a database created before
     * framework 3.x has these indexes named after their column, and one created since has them
     * named after their constraint.
     *
     * @param array $foreign_keys The described foreign keys.
     * @param array $backing_indexes Index name keyed by the constraint it backs.
     *
     * @return array<int, string>
     */
    protected function collect_obsolete_backing_indexes(array $foreign_keys, array $backing_indexes)
    {
        $obsolete = [];

        foreach ($foreign_keys as $foreign_key) {
            if (!isset($backing_indexes[$foreign_key['name']])) {
                continue;
            }

            if ($backing_indexes[$foreign_key['name']] === $foreign_key['expected']) {
                continue;
            }

            $obsolete[] = $backing_indexes[$foreign_key['name']];
        }

        return $obsolete;
    }

    /**
     * Get the indexes whose name does not match the scheme, each with the name it should take.
     *
     * A foreign key's backing index is left out: it is dropped and recreated with its constraint
     * rather than renamed on its own.
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
     * Drop every foreign key in the schema.
     *
     * Correctly named constraints go too. An index can be required by a foreign key on any table,
     * not only its own, and there is no way to ask the database which index a given constraint
     * depends on, so the only way to guarantee an index is free to drop is for no foreign key to
     * exist at that moment. They are all restored from their live definitions in the last phase.
     *
     * @param array $plan The plan.
     *
     * @return void
     */
    protected function drop_foreign_keys(array $plan)
    {
        foreach ($plan as $table => $entry) {
            if (empty($entry['foreign_keys'])) {
                continue;
            }

            Schema::table($table, function (Structure $structure) use ($entry) {
                foreach ($entry['foreign_keys'] as $foreign_key) {
                    $structure->drop_foreign($foreign_key['name']);
                }
            });
        }
    }

    /**
     * Drop the indexes that need renaming, along with any orphaned backing index.
     *
     * @param array $plan The plan.
     *
     * @return void
     */
    protected function drop_indexes(array $plan)
    {
        foreach ($plan as $table => $entry) {
            if (empty($entry['stale_indexes']) && empty($entry['obsolete_backing_indexes'])) {
                continue;
            }

            Schema::table($table, function (Structure $structure) use ($entry) {
                foreach ($entry['obsolete_backing_indexes'] as $index_name) {
                    $structure->drop_index($index_name);
                }

                foreach ($entry['stale_indexes'] as $index) {
                    $structure->drop_index($index['name']);
                }
            });
        }
    }

    /**
     * Recreate the dropped indexes under their scheme names, with their definitions unchanged.
     *
     * This runs before any foreign key is restored, because a foreign key can only be added once
     * the index it references is in place on the parent table.
     *
     * @param array $plan The plan.
     *
     * @return void
     */
    protected function add_indexes(array $plan)
    {
        foreach ($plan as $table => $entry) {
            if (empty($entry['stale_indexes'])) {
                continue;
            }

            Schema::table($table, function (Structure $structure) use ($entry) {
                foreach ($entry['stale_indexes'] as $index) {
                    if ($index['unique']) {
                        $structure->unique($index['columns'], $index['expected']);
                        continue;
                    }

                    $structure->index($index['columns'], $index['expected']);
                }
            });
        }
    }

    /**
     * Restore every foreign key under its scheme name, with its definition unchanged.
     *
     * @param array $plan The plan.
     *
     * @return void
     */
    protected function add_foreign_keys(array $plan)
    {
        foreach ($plan as $table => $entry) {
            if (empty($entry['foreign_keys'])) {
                continue;
            }

            Schema::table($table, function (Structure $structure) use ($entry) {
                foreach ($entry['foreign_keys'] as $foreign_key) {
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
