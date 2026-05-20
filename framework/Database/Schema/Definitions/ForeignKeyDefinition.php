<?php

namespace Kirki\Ecommerce\Database\Schema\Definitions;

/**
 * Class ForeignKeyDefinition
 *
 * Provides an interface for defining foreign key constraints and their actions
 * (ON UPDATE, ON DELETE) in database schema definitions. Allows setting actions such as
 * CASCADE, RESTRICT, SET NULL, and NO ACTION for both update and delete events.
 *
 * @package Kirki\Ecommerce\Database\Schema\Definitions
 *
 * @since 1.0.0
 * 
 * @method $this on(string $table)
 * @method $this on_update(string $action)
 * @method $this on_delete(string $action)
 * @method $this references(string $references)
 */
class ForeignKeyDefinition extends Definition
{
    /**
     * Set ON UPDATE action to CASCADE.
     *
     * @return $this
     */
    public function cascade_on_update()
    {
        return $this->on_update('cascade');
    }

    /**
     * Set ON DELETE action to CASCADE.
     *
     * @return $this
     */
    public function cascade_on_delete()
    {
        return $this->on_delete('cascade');
    }

    /**
     * Set ON UPDATE action to RESTRICT.
     *
     * @return $this
     */
    public function restrict_on_update()
    {
        return $this->on_update('restrict');
    }

    /**
     * Set ON DELETE action to RESTRICT.
     *
     * @return $this
     */
    public function restrict_on_delete()
    {
        return $this->on_delete('restrict');
    }

    /**
     * Set ON UPDATE action to SET NULL.
     *
     * @return $this
     */
    public function null_on_update()
    {
        return $this->on_update('set null');
    }

    /**
     * Set ON DELETE action to SET NULL.
     *
     * @return $this
     */
    public function null_on_delete()
    {
        return $this->on_delete('set null');
    }

    /**
     * Set ON UPDATE action to NO ACTION.
     *
     * @return $this
     */
    public function no_action_on_update()
    {
        return $this->on_update('no action');
    }

    /**
     * Set ON DELETE action to NO ACTION.
     *
     * @return $this
     */
    public function no_action_on_delete()
    {
        return $this->on_delete('no action');
    }
}
