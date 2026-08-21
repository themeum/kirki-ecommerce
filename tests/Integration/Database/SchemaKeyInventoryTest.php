<?php

namespace Kirki\Ecommerce\Tests\Integration\Database;

use Kirki\Ecommerce\App\Supports\SchemaKeys;
use Kirki\Ecommerce\Database\Migrations\AlterSchemaKeysToExplicitNames;
use Kirki\Ecommerce\Framework\Constants\OptionKeys;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;
use WP_UnitTestCase;

use function Kirki\Ecommerce\Framework\migrator;

class SchemaKeyInventoryTest extends WP_UnitTestCase
{
    /**
     * Give every test a schema built from nothing.
     *
     * The WordPress test case rewrites CREATE TABLE to CREATE TEMPORARY TABLE inside a test, and a
     * temporary table cannot hold a foreign key, so those filters are removed first.
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        remove_filter('query', [$this, '_create_temporary_tables']);
        remove_filter('query', [$this, '_drop_temporary_tables']);

        $this->rebuild_schema_from_scratch();
    }

    /**
     * Every key on every plugin table must carry the name the scheme derives for it.
     *
     * A migration that creates a key without naming it lands on the schema library's generated
     * name instead, which never matches the scheme, so this fails and says which key it was.
     *
     * @return void
     */
    public function test_every_key_matches_the_naming_scheme(): void
    {
        $mismatched = [];

        foreach (SchemaKeys::get_tables() as $table) {
            $foreign_keys = SchemaKeys::get_foreign_keys($table);
            $constraint_names = array_column($foreign_keys, 'name');

            foreach ($foreign_keys as $foreign_key) {
                $expected = SchemaKeys::expected_name($table, [$foreign_key['column']], 'foreign');

                if ($foreign_key['name'] !== $expected) {
                    $mismatched[] = sprintf('%s: foreign key [%s] should be [%s]', $table, $foreign_key['name'], $expected);
                }
            }

            foreach (SchemaKeys::get_indexes($table) as $index) {
                if (in_array($index['name'], $constraint_names, true)) {
                    continue;
                }

                $type = $index['unique'] ? 'unique' : 'index';
                $expected = SchemaKeys::expected_name($table, $index['columns'], $type);

                if ($index['name'] !== $expected) {
                    $mismatched[] = sprintf('%s: %s [%s] should be [%s]', $table, $type, $index['name'], $expected);
                }
            }
        }

        $this->assertSame([], $mismatched, "Keys not following the naming scheme:\n" . implode("\n", $mismatched));
    }

    /**
     * A database created before framework 3.x must end up with the same keys as a fresh install.
     *
     * @return void
     */
    public function test_legacy_and_fresh_databases_converge(): void
    {
        $fresh = $this->capture_inventory();

        $this->rewind_to_legacy_shape();

        $this->assertNotSame($fresh, $this->capture_inventory(), 'The legacy rewind did not change anything.');

        $this->rerun_key_migration();

        $this->assertSame($fresh, $this->capture_inventory());
    }

    /**
     * The rename must change names only, never referential behaviour.
     *
     * @return void
     */
    public function test_foreign_key_semantics_survive_the_rename(): void
    {
        $before = $this->capture_foreign_key_semantics();

        $this->rewind_to_legacy_shape();
        $this->rerun_key_migration();

        $this->assertSame($before, $this->capture_foreign_key_semantics());

        $variant_foreign_key = [];

        foreach (SchemaKeys::get_foreign_keys('kirki_ecommerce_cart_items') as $foreign_key) {
            if ($foreign_key['column'] === 'variant_id') {
                $variant_foreign_key = $foreign_key;
            }
        }

        $this->assertSame('fk_kirki_ecommerce_cart_items_variant_id', $variant_foreign_key['name']);
        $this->assertSame('CASCADE', $variant_foreign_key['on_delete']);
    }

    /**
     * No index may be dropped while any foreign key still exists.
     *
     * An index can be required by a foreign key on a different table — the unique index on
     * languages.code is what makes the foreign keys on the three translation tables legal — so a
     * per-table drop order is not enough. MySQL rejects such a drop even with FOREIGN_KEY_CHECKS
     * off, while MariaDB permits it, so the tests cannot catch this by running the migration.
     * Asserting the statement order instead is what makes this portable.
     *
     * @return void
     */
    public function test_indexes_are_only_touched_while_no_foreign_key_exists(): void
    {
        $this->rewind_to_legacy_shape();

        $statements = $this->capture_statements_while_renaming();

        $foreign_key_drops = $this->positions_matching($statements, 'DROP FOREIGN KEY');
        $index_drops = $this->positions_matching($statements, 'DROP INDEX');
        $index_adds = $this->positions_matching($statements, 'ADD INDEX', 'ADD UNIQUE KEY');
        $foreign_key_adds = $this->positions_matching($statements, 'ADD CONSTRAINT');

        $this->assertNotEmpty($foreign_key_drops);
        $this->assertNotEmpty($index_drops);
        $this->assertNotEmpty($index_adds);
        $this->assertNotEmpty($foreign_key_adds);

        $this->assertLessThan(
            min($index_drops),
            max($foreign_key_drops),
            'An index was dropped while a foreign key still existed.'
        );

        $this->assertLessThan(
            min($foreign_key_adds),
            max($index_adds),
            'A foreign key was added before every index was back in place.'
        );
    }

    /**
     * Running the rename against an already-correct database must do nothing.
     *
     * @return void
     */
    public function test_renaming_is_idempotent(): void
    {
        $before = $this->capture_inventory();

        $this->rerun_key_migration();
        $this->assertSame($before, $this->capture_inventory());

        $this->rerun_key_migration();
        $this->assertSame($before, $this->capture_inventory());
    }

    /**
     * Drop every plugin table, forget the migration history, and migrate from empty.
     *
     * Migrator::fresh() cannot be relied on here. It only calls down() on migrations recorded in
     * the options table, and Schema::create compiles to CREATE TABLE IF NOT EXISTS, so once any
     * migration has thrown, the recorded history and the real schema diverge permanently: fresh()
     * drops nothing and run() no-ops every Create*. Dropping the tables outright is the only way to
     * guarantee this test starts from the schema the migrations actually describe.
     *
     * @return void
     */
    protected function rebuild_schema_from_scratch(): void
    {
        $prefix = DB::connection()->get_table_prefix();

        Schema::disabled_checking_foreign_key_constraints();

        try {
            foreach (SchemaKeys::get_tables() as $table) {
                DB::connection()->affecting_statement(sprintf('DROP TABLE IF EXISTS `%s`', $prefix . $table));
            }
        } finally {
            Schema::enabled_checking_foreign_key_constraints();
        }

        Option::delete(OptionKeys::MIGRATIONS);

        migrator()->run();
    }

    /**
     * Capture every index and foreign key on every plugin table, in a stable order.
     *
     * @return array<int, string>
     */
    protected function capture_inventory(): array
    {
        $inventory = [];

        foreach (SchemaKeys::get_tables() as $table) {
            foreach (SchemaKeys::get_indexes($table) as $index) {
                $inventory[] = sprintf(
                    '%s|%s|%s|%s',
                    $table,
                    $index['unique'] ? 'unique' : 'index',
                    $index['name'],
                    implode(',', $index['columns'])
                );
            }

            foreach (SchemaKeys::get_foreign_keys($table) as $foreign_key) {
                $inventory[] = sprintf(
                    '%s|foreign|%s|%s|%s.%s|%s|%s',
                    $table,
                    $foreign_key['name'],
                    $foreign_key['column'],
                    $foreign_key['on'],
                    $foreign_key['references'],
                    $foreign_key['on_delete'],
                    $foreign_key['on_update']
                );
            }
        }

        sort($inventory);

        return $inventory;
    }

    /**
     * Capture only what a foreign key does, ignoring what it is called.
     *
     * @return array<int, string>
     */
    protected function capture_foreign_key_semantics(): array
    {
        $semantics = [];

        foreach (SchemaKeys::get_tables() as $table) {
            foreach (SchemaKeys::get_foreign_keys($table) as $foreign_key) {
                $semantics[] = sprintf(
                    '%s.%s -> %s.%s on_delete=%s on_update=%s',
                    $table,
                    $foreign_key['column'],
                    $foreign_key['on'],
                    $foreign_key['references'],
                    $foreign_key['on_delete'],
                    $foreign_key['on_update']
                );
            }
        }

        sort($semantics);

        return $semantics;
    }

    /**
     * Put the schema back into the shape framework 2.1.15 produced.
     *
     * Foreign keys are recreated without a CONSTRAINT clause, which is exactly what 2.1.15 emitted,
     * so the engine assigns them `_ibfk_n` and names their backing index after the column. Indexes
     * are renamed to something other than their scheme name, since the rename derives a key's new
     * name from its columns and is indifferent to what it was called before.
     *
     * Like the migration, this works in schema-wide phases rather than table by table, because an
     * index can be required by a foreign key belonging to another table.
     *
     * @return void
     */
    protected function rewind_to_legacy_shape(): void
    {
        $prefix = DB::connection()->get_table_prefix();

        $tables = SchemaKeys::get_tables();
        $foreign_keys = [];
        $indexes = [];

        foreach ($tables as $table) {
            $foreign_keys[$table] = SchemaKeys::get_foreign_keys($table);
            $indexes[$table] = SchemaKeys::get_indexes($table);
        }

        Schema::disabled_checking_foreign_key_constraints();

        try {
            foreach ($tables as $table) {
                $qualified = '`' . $prefix . $table . '`';

                foreach ($foreign_keys[$table] as $foreign_key) {
                    DB::connection()->affecting_statement(sprintf(
                        'ALTER TABLE %s DROP FOREIGN KEY `%s`',
                        $qualified,
                        $foreign_key['name']
                    ));
                }
            }

            foreach ($tables as $table) {
                $qualified = '`' . $prefix . $table . '`';

                foreach ($indexes[$table] as $index) {
                    DB::connection()->affecting_statement(sprintf(
                        'ALTER TABLE %s DROP INDEX `%s`',
                        $qualified,
                        $index['name']
                    ));
                }
            }

            foreach ($tables as $table) {
                $qualified = '`' . $prefix . $table . '`';
                $constraint_names = array_column($foreign_keys[$table], 'name');

                foreach ($indexes[$table] as $index) {
                    if (in_array($index['name'], $constraint_names, true)) {
                        continue;
                    }

                    DB::connection()->affecting_statement(sprintf(
                        'ALTER TABLE %s ADD %s `%s` (`%s`)',
                        $qualified,
                        $index['unique'] ? 'UNIQUE INDEX' : 'INDEX',
                        $this->legacy_index_name($table, $index),
                        implode('`, `', $index['columns'])
                    ));
                }
            }

            foreach ($tables as $table) {
                $qualified = '`' . $prefix . $table . '`';

                foreach ($foreign_keys[$table] as $foreign_key) {
                    $rules = '';

                    foreach (['on_delete' => 'ON DELETE', 'on_update' => 'ON UPDATE'] as $key => $clause) {
                        if (in_array(strtoupper($foreign_key[$key]), ['RESTRICT', 'NO ACTION'], true)) {
                            continue;
                        }

                        $rules .= sprintf(' %s %s', $clause, $foreign_key[$key]);
                    }

                    DB::connection()->affecting_statement(sprintf(
                        'ALTER TABLE %s ADD FOREIGN KEY (`%s`) REFERENCES `%s` (`%s`)%s',
                        $qualified,
                        $foreign_key['column'],
                        $prefix . $foreign_key['on'],
                        $foreign_key['references'],
                        $rules
                    ));
                }
            }
        } finally {
            Schema::enabled_checking_foreign_key_constraints();
        }
    }

    /**
     * Build a pre-rename name for an index.
     *
     * The convention both framework versions generated for an unnamed key is used where it fits the
     * identifier limit. Where it does not, the migration author had to supply a short explicit name,
     * so a short deterministic stand-in is used instead.
     *
     * @param string $table The table name.
     * @param array $index The index.
     *
     * @return string
     */
    protected function legacy_index_name(string $table, array $index): string
    {
        $conventional = sprintf(
            '%s_%s_%s',
            $table,
            implode('_', $index['columns']),
            $index['unique'] ? 'unique' : 'index'
        );

        if (strlen($conventional) <= SchemaKeys::MAX_KEY_NAME_LENGTH) {
            return $conventional;
        }

        return 'legacy_' . substr(md5($conventional), 0, 16);
    }

    /**
     * Run the rename, collecting every ALTER statement it issues, in order.
     *
     * @return array<int, string>
     */
    protected function capture_statements_while_renaming(): array
    {
        $statements = [];

        $recorder = function ($query) use (&$statements) {
            if (stripos(ltrim($query), 'alter table') === 0) {
                $statements[] = $query;
            }

            return $query;
        };

        add_filter('query', $recorder);

        try {
            $this->rerun_key_migration();
        } finally {
            remove_filter('query', $recorder);
        }

        return $statements;
    }

    /**
     * Get the positions of the statements containing any of the given clauses.
     *
     * @param array $statements The captured statements.
     * @param string ...$clauses The clauses to look for.
     *
     * @return array<int, int>
     */
    protected function positions_matching(array $statements, string ...$clauses): array
    {
        $positions = [];

        foreach ($statements as $position => $statement) {
            foreach ($clauses as $clause) {
                if (stripos($statement, $clause) !== false) {
                    $positions[] = $position;
                    break;
                }
            }
        }

        return $positions;
    }

    /**
     * Forget that the key migration ran, then run the migrator again.
     *
     * @return void
     */
    protected function rerun_key_migration(): void
    {
        $migrations = Option::get(OptionKeys::MIGRATIONS, []);
        unset($migrations[AlterSchemaKeysToExplicitNames::class]);
        Option::set(OptionKeys::MIGRATIONS, $migrations);

        migrator()->run();
    }
}
