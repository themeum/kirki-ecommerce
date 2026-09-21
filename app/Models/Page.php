<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a WordPress page row in the core posts table.
 *
 * @since 1.0.0
 */
class Page extends Model
{
    /** @inheritDoc */
    protected $table = 'posts';
    /** @inheritDoc */
    protected $primary_key = 'ID';
}
