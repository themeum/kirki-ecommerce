<?php

namespace Kirki\Ecommerce\App\Events;

use Kirki\Ecommerce\Concerns\Dispatchable;

class SettingsChanged
{
    use Dispatchable;

    public string $key;

    public function __construct(string $key)
    {
        $this->key = $key;
    }
}
