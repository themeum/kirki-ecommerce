<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class DropIsBillingSameAsShippingFromCustomersTable implements Migration
{
    public function up()
    {
        Schema::table('kirki_ecommerce_customers', function (Structure $table) {
            $table->drop_column('is_billing_same_as_shipping');
        });
    }

    public function down()
    {
        Schema::table('kirki_ecommerce_customers', function (Structure $table) {
            $table->boolean('is_billing_same_as_shipping')->default(1)->after('accepts_marketing');
        });
    }
}
