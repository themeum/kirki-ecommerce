<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_refunds table, which stores order refunds.
 *
 * @since 1.0.0
 */
class CreateRefundsTable implements Migration
{
    /**
     * Create the kirki_ecommerce_refunds table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_refunds', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('order_id');
            $table->enum('status', ['pending', 'completed', 'failed', 'cancelled'])->default('pending');

            $table->integer('invoiced_amount')->comment('Refund amount in cents, in the order currency');
            $table->text('reason')->nullable();

            $table->enum('refund_type', ['partial', 'full'])->default('partial');

            $table->string('refund_id', 255)->nullable()->comment('Gateway refund ID');

            $table->unsigned_big_integer('created_by')->nullable()->comment('WordPress user ID who created the refund');
            $table->unsigned_big_integer('updated_by')->nullable()->comment('WordPress user ID who updated the refund');
            $table->timestamps();

            $table->index('status');

            $table->foreign('order_id', 'fk_refunds_order_id')
                ->references('id')
                ->on('kirki_ecommerce_orders')
                ->cascade_on_delete();
            $table->foreign('created_by', 'fk_refunds_created_by')
                ->references('id')
                ->on('users')
                ->null_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_refunds table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_refunds');
    }
}
