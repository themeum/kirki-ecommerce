<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class CreateWishlistTable implements Migration
{
    protected $table = 'kirki_ecommerce_wishlist';

    public function up()
    {
        Schema::create($this->table, function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('user_id');
            $table->unsigned_big_integer('variant_id');
            $table->timestamps();

            $table->unique(['user_id', 'variant_id']);

            $table->foreign('user_id', 'fk_kirki_ecommerce_wishlist_user_id')
                ->references('ID')
                ->on('users')
                ->cascade_on_delete();

            $table->foreign('variant_id', 'fk_kirki_ecommerce_wishlist_variant_id')
                ->references('id')
                ->on('kirki_ecommerce_variants')
                ->cascade_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists($this->table);
    }
}
