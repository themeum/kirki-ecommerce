<?php

namespace Kirki\Ecommerce\Database\Concerns;

use Kirki\Ecommerce\Database\Query\Relations\BelongsTo;
use Kirki\Ecommerce\Database\Query\Relations\BelongsToMany;
use Kirki\Ecommerce\Database\Query\Relations\HasMany;
use Kirki\Ecommerce\Database\Query\Relations\HasOne;

trait HasRelationships
{
    /**
     * Define a one-to-one relationship.
     *
     * Creates a HasOne relation object targeting the given model class. Keys
     * default to the parent's foreign key and primary key when omitted.
     *
     * @param string $related The related model class name
     * @param mixed $foreign_key The foreign key name on the related model
     * @param mixed $local_key The local key name on the parent model
     * @return HasOne The relation instance
     * @since 1.0.0
     */
    protected function has_one($related, $foreign_key = null, $local_key = null)
    {
        $instance = new $related();
        $foreign_key = $foreign_key ?? $this->get_foreign_key();
        $local_key = $local_key ?? $this->primary_key;

        return new HasOne($instance, $this, $foreign_key, $local_key);
    }

    /**
     * Define a one-to-many relationship.
     *
     * Creates a HasMany relation object targeting the given model class. Keys
     * default similarly to has_one when not explicitly specified.
     *
     * @param string $related The related model class name
     * @param mixed $foreign_key The foreign key name on the related model
     * @param mixed $local_key The local key name on the parent model
     * @return HasMany The relation instance
     * @since 1.0.0
     */
    protected function has_many($related, $foreign_key = null, $local_key = null)
    {
        $instance = new $related();
        $foreign_key = $foreign_key ?? $this->get_foreign_key();
        $local_key = $local_key ?? $this->primary_key;

        return new HasMany($instance, $this, $foreign_key, $local_key);
    }

    /**
     * Define an inverse one-to-one or many relationship.
     *
     * Creates a BelongsTo relation where this model holds the foreign key
     * referencing the owner model's primary key (or provided owner key).
     *
     * @param string $related The related model class name
     * @param mixed $foreign_key The foreign key name on this model
     * @param mixed $owner_key The referenced key name on the related model
     * @return BelongsTo The relation instance
     * @since 1.0.0
     */
    protected function belongs_to($related, $foreign_key = null, $owner_key = null)
    {
        $instance = new $related();
        $foreign_key = $foreign_key ?? $instance->get_foreign_key();
        $owner_key = $owner_key ?? $instance->primary_key;

        return new BelongsTo($instance, $this, $foreign_key, $owner_key);
    }

    /**
     * Define a many-to-many relationship using a pivot table.
     *
     * Constructs a BelongsToMany relation with optional pivot table and key
     * names. When the pivot table is not given, it is inferred by sorting and
     * joining the table names. Parent and related keys default to primary keys.
     *
     * @param string $related The related model class name
     * @param mixed $pivot_table The pivot table name joining the models
     * @param mixed $foreign_pivot_key The foreign key for this model on pivot
     * @param mixed $related_pivot_key The foreign key for related on pivot
     * @param mixed $parent_key The local key on this model
     * @param mixed $related_key The key on the related model
     * @return BelongsToMany The relation instance
     * @since 1.0.0
     */
    protected function belongs_to_many($related, $pivot_table = null, $foreign_pivot_key = null, $related_pivot_key = null, $parent_key = null, $related_key = null)
    {
        $instance = new $related();

        $foreign_pivot_key = $foreign_pivot_key ?? $this->get_foreign_key();
        $related_pivot_key = $related_pivot_key ?? $instance->get_foreign_key();

        $parent_key = $parent_key ?? $this->primary_key;
        $related_key = $related_key ?? $instance->primary_key;

        if ($pivot_table === null) {
            $pivot_table = $this->get_pivot_table_name($this->get_table(), $instance->get_table());
        }

        return new BelongsToMany(
            $instance,
            $this,
            $pivot_table,
            $foreign_pivot_key,
            $related_pivot_key,
            $parent_key,
            $related_key
        );
    }
}
