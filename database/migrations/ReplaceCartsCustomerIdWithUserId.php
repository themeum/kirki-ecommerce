<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class ReplaceCartsCustomerIdWithUserId implements Migration
{
    public function up()
    {
        Schema::table('kirki_ecommerce_carts', function (Structure $table) {
            $table->drop_foreign('fk_kirki_ecommerce_carts_customer_id');
            $table->drop_index('idx_kirki_ecommerce_carts_customer_id_created_at');
            $table->drop_column('customer_id');

            $table->unsigned_big_integer('user_id')->nullable()->comment('WordPress user ID for owned carts')->after('id');

            $table->index(['user_id', 'created_at'], 'idx_kirki_ecommerce_carts_user_id_created_at');

            $table->foreign('user_id', 'fk_kirki_ecommerce_carts_user_id')
                ->references('ID')
                ->on('users')
                ->cascade_on_delete();
        });
    }

    public function down()
    {
        Schema::table('kirki_ecommerce_carts', function (Structure $table) {
            $table->drop_foreign('fk_kirki_ecommerce_carts_user_id');
            $table->drop_index('idx_kirki_ecommerce_carts_user_id_created_at');
            $table->drop_column('user_id');

            $table->unsigned_big_integer('customer_id')->nullable()->after('id');

            $table->index(['customer_id', 'created_at'], 'idx_kirki_ecommerce_carts_customer_id_created_at');

            $table->foreign('customer_id', 'fk_kirki_ecommerce_carts_customer_id')
                ->references('id')
                ->on('kirki_ecommerce_customers')
                ->cascade_on_delete();
        });
    }
}
