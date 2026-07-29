<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class CreateOrderActivitiesTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_order_activities', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('order_id');
            $table->string('activity_type', 100)
                ->comment('Available: order-placed, payment-completed, status-changed, comment-added, partially-refunded, refunded, etc.');
            $table->text('description')->nullable();
            $table->text('metadata')->nullable();
            $table->unsigned_big_integer('created_by')->nullable();
            $table->timestamps();

            $table->index('activity_type');
            $table->index('created_at');

            $table->foreign('order_id', 'fk_kirki_ecommerce_order_activities_order_id')
                ->references('id')
                ->on('kirki_ecommerce_orders')
                ->cascade_on_delete();
            $table->foreign('created_by', 'fk_kirki_ecommerce_order_activities_created_by')
                ->references('id')
                ->on('kirki_ecommerce_customers')
                ->null_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_order_activities');
    }
}
