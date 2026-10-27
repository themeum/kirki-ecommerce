<?php

namespace Kirki\Ecommerce\Tests\Support\Racing;

use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\VariantService;

/**
 * Variant service whose lookup returns a snapshot taken earlier, as if another request changed the row after this one read it.
 *
 * @since 1.0.0
 */
class StaleVariantService extends VariantService
{
    /** @var Variant */
    protected $snapshot;

    /**
     * Keep the snapshot every lookup returns.
     *
     * @since 1.0.0
     *
     * @param Variant $snapshot Variant as it was before the competing change.
     */
    public function __construct(Variant $snapshot)
    {
        $this->snapshot = $snapshot;
    }

    /**
     * Return the stale snapshot instead of the current row.
     *
     * @since 1.0.0
     *
     * @param int $id Variant ID.
     * @return Variant
     */
    public function find_or_null(int $id)
    {
        return $this->snapshot;
    }
}
