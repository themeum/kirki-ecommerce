<?php

namespace Kirki\Ecommerce\App\Concerns;

use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Supports\Str;

trait HasSlug
{
    protected $slug_column = 'slug';

    /**
     * Generate a unique slug by appending a number if necessary.
     *
     * @param string $slug The slug to generate a unique version of
     * @param mixed $exclude The ID/Primary Key value to exclude from the search
     * @return string The unique slug
     */
    public static function generate_unique_slug(string $slug, $exclude = null): string
    {
        $instance = new static();
        $slug = Str::slug($slug);

        while (
            $instance::query()->where($instance->slug_column, $slug)->when($exclude, function (QueryBuilder $query, $exclude) use ($instance) {
                return $query->where($instance->primary_key, '!=', $exclude);
            })->first()
        ) {
            $slug = Str::increment($slug);
        }

        return $slug;
    }
}
