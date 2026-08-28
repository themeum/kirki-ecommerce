<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class AddPublishedAtAndTrashedAtToProductsTable implements Migration
{
    public function up()
    {
        Schema::table('kirki_ecommerce_products', function (Structure $table) {
            $table->timestamp('published_at')->nullable()->after('has_variants');
            $table->timestamp('trashed_at')->nullable()->after('published_at');
        });
    }

    public function down()
    {
        Schema::table('kirki_ecommerce_products', function (Structure $table) {
            $table->drop_column('published_at');
            $table->drop_column('trashed_at');
        });
    }
}
