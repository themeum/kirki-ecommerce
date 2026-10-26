<?php

namespace Kirki\Ecommerce\App\Mcp\Resources;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Resource;
use Kirki\Ecommerce\App\Mcp\Concerns\FormatsMoney;
use Kirki\Ecommerce\Framework\Wordpress\Constants\Capabilities;

/**
 * Base of the resources that give store-wide context as JSON. Only store administrators can read them.
 *
 * Each resource builds its output field by field, so a settings field that no specification names never leaks.
 *
 * @since 1.0.0
 */
abstract class StoreResource extends Resource
{
    use FormatsMoney;

    /** @var string */
    protected $mime_type = 'application/json';

    /**
     * Allow only store administrators to read the resource.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function permission()
    {
        return current_user_can(Capabilities::MANAGE_OPTIONS);
    }

    /**
     * Turn an empty setting into null.
     *
     * @since 1.0.0
     *
     * @param mixed $value Setting value.
     *
     * @return mixed The value, or null when it is empty.
     */
    protected function value_or_null($value)
    {
        return $value === '' || $value === [] ? null : $value;
    }
}
