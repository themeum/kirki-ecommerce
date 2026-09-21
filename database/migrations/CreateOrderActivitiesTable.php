<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_order_activities table, which stores the activity timeline of orders.
 *
 * @since 1.0.0
 */
class CreateOrderActivitiesTable implements Migration
{
    /**
     * Create the kirki_ecommerce_order_activities table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_order_activities', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('order_id');
            $table->string('activity_type', 100)
                ->comment('Available: order-placed, payment-completed, status-changed, comment-added, partially-refunded, refunded, etc.');
            $table->text('description')->nullable();
            $table->text('metadata')->nullable();
            $table->unsigned_big_integer('created_by')->nullable()->comment('WordPress user ID who recorded the activity');
            $table->timestamps();

            $table->index('activity_type');
            $table->index('created_at');

            $table->foreign('order_id', 'fk_kirki_ecommerce_order_activities_order_id')
                ->references('id')
                ->on('kirki_ecommerce_orders')
                ->cascade_on_delete();
            $table->foreign('created_by', 'fk_kirki_ecommerce_order_activities_created_by')
                ->references('id')
                ->on('users')
                ->null_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_order_activities table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_order_activities');
    }
}
