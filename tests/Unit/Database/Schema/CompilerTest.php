<?php

namespace Kirki\Ecommerce\Tests\Unit\Database\Schema;

use Kirki\Ecommerce\Framework\Database\Schema\Compiler;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class CompilerTest extends TestCase
{
    private Compiler $compiler;

    protected function setUp(): void
    {
        parent::setUp();

        $this->compiler = new Compiler($this->make_test_connection());
    }

    public function test_compile_create_builds_basic_table(): void
    {
        $structure = $this->make_structure('kirki_products');
        $structure->id();
        $structure->string('title', 255);
        $structure->boolean('active')->default(1);

        $sql = $this->compiler->compile_create($structure);

        $this->assertSame(
            'CREATE TABLE IF NOT EXISTS `wp_kirki_products` (`id` bigint unsigned not null auto_increment, `title` varchar(255) not null, `active` tinyint(1) not null default \'1\', PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            $sql
        );
    }

    public function test_compile_create_builds_unique_and_index_commands(): void
    {
        $structure = $this->make_structure('kirki_products');
        $structure->id();
        $structure->string('slug', 255)->unique();
        $structure->string('status', 50);
        $structure->index(['status', 'created_at'], 'idx_status_created');

        $sql = $this->compiler->compile_create($structure);

        $this->assertStringContainsString('UNIQUE KEY `kirki_products_slug_unique` (`slug`)', $sql);
        $this->assertStringContainsString('KEY `idx_status_created` (`status`, `created_at`)', $sql);
    }

    public function test_compile_create_builds_foreign_key_constraints(): void
    {
        $structure = $this->make_structure('kirki_products');
        $structure->id();
        $structure->unsigned_big_integer('brand_id')->nullable();
        $structure
            ->foreign('brand_id', 'fk_products_brand_id')
            ->references('id')
            ->on('kirki_brands')
            ->null_on_delete();

        $sql = $this->compiler->compile_create($structure);

        $this->assertStringContainsString(
            'FOREIGN KEY (`brand_id`) REFERENCES `wp_kirki_brands` (`id`) ON DELETE set null',
            $sql
        );
    }

    public function test_compile_create_supports_common_column_types(): void
    {
        $structure = $this->make_structure('kirki_type_samples');
        $structure->decimal('amount', 10, 2);
        $structure->text('description')->nullable();
        $structure->enum('status', ['draft', 'published']);
        $structure->timestamp('published_at', 0)->nullable();

        $sql = $this->compiler->compile_create($structure);

        $this->assertStringContainsString('`amount` decimal(10, 2) not null', $sql);
        $this->assertStringContainsString('`description` text null', $sql);
        $this->assertStringContainsString("enum('draft', 'published')", $sql);
        $this->assertStringContainsString('`published_at` timestamp null', $sql);
    }

    public function test_compile_create_supports_expression_defaults(): void
    {
        $structure = $this->make_structure('kirki_events');
        $structure->timestamp('created_at', 0)->use_current();

        $sql = $this->compiler->compile_create($structure);

        $this->assertStringContainsString('`created_at` timestamp not null default CURRENT_TIMESTAMP', $sql);
    }

    public function test_compile_create_respects_custom_engine_and_encoding(): void
    {
        $structure = $this->make_structure('kirki_legacy', [
            'charset' => 'utf8',
            'collate' => 'utf8_general_ci',
        ]);
        $structure->engine('MyISAM');
        $structure->charset('utf8');
        $structure->collate('utf8_general_ci');
        $structure->integer('legacy_id');

        $sql = $this->compiler->compile_create($structure);

        $this->assertStringContainsString('ENGINE=MyISAM', $sql);
        $this->assertStringContainsString('DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci', $sql);
    }
}
