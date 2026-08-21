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
            $table->drop_foreign(['customer_id']);
            $table->drop_index('idx_customer_carts');
            $table->drop_column('customer_id');

            $table->unsigned_big_integer('user_id')->nullable()->comment('WordPress user ID for owned carts');

            $table->index(['user_id', 'created_at'], 'idx_user_carts');

            $table->foreign('user_id')
                ->references('ID')
                ->on('users')
                ->cascade_on_delete();
        });
    }

    public function down()
    {
        Schema::table('kirki_ecommerce_carts', function (Structure $table) {
            $table->drop_foreign(['user_id']);
            $table->drop_index('idx_user_carts');
            $table->drop_column('user_id');

            $table->unsigned_big_integer('customer_id')->nullable();

            $table->index(['customer_id', 'created_at'], 'idx_customer_carts');

            $table->foreign('customer_id')
                ->references('id')
                ->on('kirki_ecommerce_customers')
                ->cascade_on_delete();
        });
    }
}
