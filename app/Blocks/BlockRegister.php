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
 * Block register class
 *
 * @since 1.0.0
 */
class BlockRegister
{
    /**
     * Array of block class names
     *
     * @since 1.0.0
     *
     * @var array<int, string>
     */
    protected $blocks;

    /**
     * Constructor
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function __construct()
    {
        $this->blocks = [
            MiniCartBlock::class,
        ];

        $this->register();
    }

    /**
     * Get all shortcodes.
     *
     * @since 1.0.0
     *
     * @return array<int, string>
     */
    public function get_blocks(): array
    {
        return $this->blocks;
    }

    /**
     * Register all blocks.
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
