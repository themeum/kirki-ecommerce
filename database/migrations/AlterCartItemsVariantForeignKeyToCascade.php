<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class AlterCartItemsVariantForeignKeyToCascade implements Migration
{
    public function up()
    {
        Schema::table('kirki_ecommerce_cart_items', function (Structure $table) {
            $table->drop_foreign('fk_kirki_ecommerce_cart_items_variant_id');

            $table->foreign('variant_id', 'fk_kirki_ecommerce_cart_items_variant_id')
                ->references('id')
                ->on('kirki_ecommerce_variants')
                ->cascade_on_delete();
        });
    }

    public function down()
    {
        Schema::table('kirki_ecommerce_cart_items', function (Structure $table) {
            $table->drop_foreign('fk_kirki_ecommerce_cart_items_variant_id');

            $table->foreign('variant_id', 'fk_kirki_ecommerce_cart_items_variant_id')
                ->references('id')
                ->on('kirki_ecommerce_variants')
                ->null_on_delete();
        });
    }
}
