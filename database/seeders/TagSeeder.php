<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\Tag;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Seeder;
use Kirki\Ecommerce\Supports\Arr;
use Kirki\Ecommerce\Supports\Facades\Date;
use Kirki\Ecommerce\Supports\Facades\Log;
use Kirki\Ecommerce\Supports\Str;
use Faker\Factory;

use function Kirki\Ecommerce\faker;

class TagSeeder extends Seeder
{
    public function run()
    {
        $tags = Collection::range(1, 10)->map(function ($id) {
            $name = faker()->words(2, true);
            return [
                'id' => $id,
                'name' => $name,
                'slug' => Str::slug($name),
                'description' => faker()->sentence(10, true),
                'created_at' => faker()->dateTimeBetween('-1 year', 'now'),
            ];
        })->all();

        Tag::query()->insert($tags);

        Log::info('TagSeeder run successfully');
    }
}
