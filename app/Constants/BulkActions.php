<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Bulk action identifiers accepted by bulk action requests, including the all-items variants.
 *
 * @since 1.0.0
 */
class BulkActions
{
    use HasConstants;
    const DELETE = 'delete';
    const DELETE_ALL = 'delete-all';
    const TRASH = 'trash';
    const TRASH_ALL = 'trash-all';
    const RESTORE = 'restore';
    const RESTORE_ALL = 'restore-all';
}
