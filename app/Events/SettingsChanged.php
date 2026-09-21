<?php

namespace Kirki\Ecommerce\App\Events;

use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

/**
 * Event dispatched after a settings group has been saved.
 *
 * @since 1.0.0
 */
class SettingsChanged
{
    use Dispatchable;

    /** @var string */
    public string $key;

    /**
     * Create the event for a changed settings group.
     *
     * @since 1.0.0
     *
     * @param string $key Option key of the settings group that changed.
     */
    public function __construct(string $key)
    {
        $this->key = $key;
    }
}
