<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\Tag;
use Kirki\Ecommerce\Database\Seeder;
use Kirki\Ecommerce\Supports\Facades\Date;
use Kirki\Ecommerce\Supports\Facades\Log;

class TagSeeder extends Seeder
{
    /**
     * Seed curated merchandising and descriptive tags.
     *
     * @return void
     * @since 1.0.0
     */
    public function run()
    {
        $tags = array_map(function ($tag) {
            return [
                'id' => $tag['id'],
                'name' => $tag['name'],
                'slug' => $tag['slug'],
                'description' => $tag['description'],
                'created_at' => Date::now(),
            ];
        }, SeedCatalog::get_tags());

        Tag::query()->insert($tags);

        Log::info('TagSeeder run successfully');
    }
}
