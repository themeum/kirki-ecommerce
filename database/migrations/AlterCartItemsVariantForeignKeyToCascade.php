<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class AlterCartItemsVariantForeignKeyToCascade implements Migration
{
    public function up()
    {
        $this->replace_variant_foreign_key('cascade_on_delete');
    }

    public function down()
    {
        $this->replace_variant_foreign_key('null_on_delete');
    }

    /**
     * Recreate the variant foreign key with a different delete rule.
     *
     * The drop and the add are separate statements on purpose. Compiler::compile_alter puts
     * additions ahead of drops inside a single ALTER, so doing both in one call would ask the
     * database to add a constraint whose name the statement has not dropped yet.
     *
     * @param string $delete_rule The ForeignKeyDefinition method naming the ON DELETE behaviour.
     *
     * @return void
     */
    protected function replace_variant_foreign_key(string $delete_rule)
    {
        Schema::table('kirki_ecommerce_cart_items', function (Structure $table) {
            $table->drop_foreign('fk_kirki_ecommerce_cart_items_variant_id');
            $table->drop_index('fk_kirki_ecommerce_cart_items_variant_id');
        });

        Schema::table('kirki_ecommerce_cart_items', function (Structure $table) use ($delete_rule) {
            $table->foreign('variant_id', 'fk_kirki_ecommerce_cart_items_variant_id')
                ->references('id')
                ->on('kirki_ecommerce_variants')
                ->{$delete_rule}();
        });
    }
}
