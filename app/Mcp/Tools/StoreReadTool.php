<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Tool;
use Kirki\Ecommerce\App\Mcp\Concerns\ReadsStoreValues;
use Kirki\Ecommerce\App\Mcp\Concerns\ValidatesArguments;
use Kirki\Ecommerce\Framework\Wordpress\Constants\Capabilities;

/**
 * Base of the tools that read store data and change nothing. Only store administrators can run them.
 *
 * @since 1.0.0
 */
abstract class StoreReadTool extends Tool
{
    use ReadsStoreValues;
    use ValidatesArguments;

    const STORE_TEXT_LIMIT = 500;

    /** @var bool */
    protected $read_only = true;

    /** @var bool */
    protected $idempotent = true;

    /** @var bool */
    protected $destructive = false;

    /** @var bool */
    protected $open_world = false;

    /**
     * Allow only store administrators to run the tool.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function permission()
    {
        return current_user_can(Capabilities::MANAGE_OPTIONS);
    }
}
