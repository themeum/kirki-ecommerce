<?php

namespace Kirki\Ecommerce\App\Concerns;

use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Supports\Str;

/**
 * Generates unique slugs for models that store one.
 *
 * @since 1.0.0
 */
trait HasSlug
{
    /** @var string */
    protected $slug_column = 'slug';

    /**
     * Generate a unique slug by appending a number if necessary.
     *
     * @since 1.0.0
     *
     * @param string $slug    The slug to generate a unique version of.
     * @param mixed  $exclude Primary key value of a record to leave out of the uniqueness check.
     * @return string The unique slug.
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
