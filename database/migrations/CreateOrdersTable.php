<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class CreateOrdersTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_orders', function (Structure $table) {
            $table->id();
            $table->uuid('uuid')->nullable();
            $table->string('order_number', 50)->nullable();
            $table->unsigned_big_integer('customer_id')->nullable();
            $table->string('order_status', 50)->default('pending')->comment('Available: pending, unpaid_processing, paid_unfulfilled, paid_processing, paid_shipped, shipped_unpaid, delivered_unpaid, completed, on_hold_paid, on_hold_unpaid, paid_cancelled, unpaid_cancelled, failed_cancelled, failed_unfulfilled, failed_processing, failed_shipped, failed_delivered, failed_on_hold, refund_requested, refund_in_progress, refunded, refund_declined, returned_pending_refund, refunded_partially');
            $table->string('fulfillment_status', 50)->default('unfulfilled')->comment('Available: unfulfilled, processing, shipped, delivered, on-hold, cancelled, delivered-refund-processing, returned-refund-pending, returned-refund-processing, returned, delivered');
            $table->boolean('is_manual')->default(0)->comment('Admin-created order');
            $table->boolean('is_refund_initiated')->default(0)->comment('When refund initiated, set to true, otherwise set to false');

            $table->string('currency_code', 3);
            $table->string('base_currency_code', 3);
            $table->decimal('exchange_rate', 15, 6)->nullable()->comment('Exchange rate at time of order for accurate historical reporting');

            $table->integer('subtotal')->default(0);
            $table->integer('subtotal_base')->default(0);

            $table->string('tax_id_number', 100)->nullable();
            $table->string('tax_id_type', 50)->nullable()->comment('Available: vat, gst, ein, etc.');
            $table->boolean('reverse_charge')->default(0)->comment('EU reverse charge mechanism');

            $table->integer('shipping_total')->default(0);
            $table->integer('shipping_total_base')->default(0);

            $table->string('coupon_code', 100)->nullable();
            $table->integer('discount_total')->default(0);
            $table->integer('discount_total_base')->default(0);
            $table->text('discount_details')->nullable()->comment('JSON snapshot of discount details');

            $table->integer('tax_total')->default(0);
            $table->integer('tax_total_base')->default(0);

            $table->integer('total')->default(0);
            $table->integer('total_base')->default(0);

            $table->integer('items_count')->default(0);
            $table->decimal('total_weight', 10, 2)->nullable();

            $table->string('payment_status', 50)->default('pending')->comment('Available: paid, unpaid, failed, refunding, refunded');
            $table->string('payment_method', 100)->nullable();
            $table->string('payment_transaction_id')->nullable();
            $table->string('payment_gateway')->nullable();
            $table->integer('payment_gateway_fee')->default(0);
            $table->text('payment_metadata')->nullable();

            $table->string('shipping_method', 100)->nullable();
            $table->string('shipping_carrier', 100)->nullable();
            $table->string('shipping_tracking_number', 100)->nullable();
            $table->string('shipping_tracking_url', 500)->nullable();

            $table->string('shipping_first_name', 100)->nullable();
            $table->string('shipping_last_name', 100)->nullable();
            $table->string('shipping_address_line1', 255)->nullable();
            $table->string('shipping_address_line2', 255)->nullable();
            $table->string('shipping_city', 100)->nullable();
            $table->string('shipping_state', 100)->nullable();
            $table->string('shipping_country', 100)->nullable();
            $table->string('shipping_postal_code', 20)->nullable();
            $table->string('shipping_phone', 50)->nullable();
            $table->string('shipping_email', 255)->nullable();
            $table->string('shipping_company')->nullable();

            $table->boolean('is_billing_same_as_shipping')->default(false);

            $table->string('billing_first_name', 100)->nullable();
            $table->string('billing_last_name', 100)->nullable();
            $table->string('billing_address_line1', 255)->nullable();
            $table->string('billing_address_line2', 255)->nullable();
            $table->string('billing_city', 100)->nullable();
            $table->string('billing_state', 100)->nullable();
            $table->string('billing_country', 100)->nullable();
            $table->string('billing_postal_code', 20)->nullable();
            $table->string('billing_phone', 50)->nullable();
            $table->string('billing_email', 255)->nullable();
            $table->string('billing_company')->nullable();

            $table->string('customer_email', 255)->nullable();
            $table->string('customer_phone', 50)->nullable();
            $table->ip_address('ip_address')->nullable();
            $table->text('user_agent')->nullable();

            $table->text('customer_notes')->nullable();
            $table->text('admin_notes')->nullable();
            $table->text('flags')->nullable()->comment('Comma separated admin flags, i.e. Backorder, Urgent');

            $table->text('cancellation_reason')->nullable();

            $table->unsigned_big_integer('created_by')->nullable();
            $table->unsigned_big_integer('updated_by')->nullable();

            $table->timestamp('paid_at')->nullable()->comment('Payment confirmation time');
            $table->timestamp('shipped_at')->nullable()->comment('The order is handed over to the shipping carrier');
            $table->timestamp('cancelled_at')->nullable()->comment('The order was cancelled by the customer or admin');
            $table->timestamp('fulfilled_at')->nullable()->comment('The order has been completely prepared, packed, and is ready to ship');
            $table->timestamp('estimated_delivery_date')->nullable();
            $table->timestamp('delivered_at')->nullable()->comment('The order was delivered to the customer by the shipping carrier');
            $table->timestamp('archived_at')->nullable()->comment('The order was archived by an admin');
            $table->timestamps();

            $table->foreign('created_by')->on('users')->references('ID')->null_on_delete();
            $table->foreign('updated_by')->on('users')->references('ID')->null_on_delete();

            $table->index('order_number');
            $table->index('uuid');
            $table->index('customer_email');
            $table->index('ip_address', 'idx_fraud_detection');

            $table->index(['customer_id', 'created_at'], 'idx_customer_orders');
            $table->index(['customer_id', 'order_status', 'created_at'], 'idx_customer_status_orders');

            $table->index(['created_at', 'order_status'], 'idx_recent_orders');
            $table->index(['order_status', 'payment_status', 'created_at'], 'idx_status_payment_date');
            $table->index(['payment_status', 'order_status', 'updated_at'], 'idx_payment_order_tracking');

            $table->index(['paid_at', 'order_status'], 'idx_paid_orders');
            $table->index(['fulfilled_at'], 'idx_fulfilled_orders');
            $table->index(['shipped_at'], 'idx_shipped_orders');

            $table->index(['payment_method', 'payment_status'], 'idx_payment_method_tracking');
            $table->index(['shipping_country', 'created_at'], 'idx_country_orders');

            $table->index('payment_transaction_id');
            $table->index(['base_currency_code', 'created_at'], 'idx_base_currency_reporting');

            $table->foreign('customer_id')
                ->references('id')
                ->on('kirki_ecommerce_customers')
                ->null_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_orders');
    }
}
