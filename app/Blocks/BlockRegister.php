<?php

/**
 * Register all block.
 *
 * @package Kirki\Ecommerce\App\Shortcodes
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Blocks;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Blocks\MiniCartBlock;
use function Kirki\Ecommerce\Framework\app;

/**
 * Registers the plugin's blocks by resolving each block class from the container.
 *
 * @since 1.0.0
 */
class BlockRegister
{
    /**
     * Fully qualified class names of the blocks to register.
     *
     * @var array<int, string>
     */
    protected $blocks;

    /**
     * Set the block class list and register the blocks.
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->blocks = [
            MiniCartBlock::class,
        ];

        $this->register();
    }

    /**
     * Get the class names of the blocks to register.
     *
     * @since 1.0.0
     *
     * @return array<int, string> Fully qualified block class names.
     */
    public function get_blocks(): array
    {
        return $this->blocks;
    }

    /**
     * Register all blocks by instantiating each block class through the container.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function register()
    {
        foreach ($this->get_blocks() as $block) {
            app()->make($block);
        }
    }
}
