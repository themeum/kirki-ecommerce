<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class AlterAddressesTableForAddressBook implements Migration
{
    public function up()
    {
        Schema::table('kirki_ecommerce_addresses', function (Structure $table) {
            $table->string('type', 50)
                ->default('home')
                ->comment('Supported values: home, office, others')
                ->change();

            $table->string('label', 255)->nullable()->after('type');
            $table->boolean('is_default_shipping')->default(0)->after('label');
            $table->boolean('is_default_billing')->default(0)->after('is_default_shipping');
        });

        DB::table('kirki_ecommerce_addresses')->where('type', 'billing')->update([
            'type' => 'home',
            'is_default_billing' => 1,
        ]);

        DB::table('kirki_ecommerce_addresses')->where('type', 'shipping')->update([
            'type' => 'home',
            'is_default_shipping' => 1,
        ]);
    }

    public function down()
    {
        DB::table('kirki_ecommerce_addresses')->where('is_default_billing', 1)->update(['type' => 'billing']);
        DB::table('kirki_ecommerce_addresses')->where('is_default_shipping', 1)->update(['type' => 'shipping']);

        Schema::table('kirki_ecommerce_addresses', function (Structure $table) {
            $table->drop_column('is_default_shipping');
            $table->drop_column('is_default_billing');
            $table->drop_column('label');

            $table->string('type', 50)
                ->default('billing')
                ->comment('Supported values: billing, shipping')
                ->change();
        });
    }
}
