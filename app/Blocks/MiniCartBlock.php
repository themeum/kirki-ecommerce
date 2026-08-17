<?php

/**
 * Mini Cart Block
 *
 * @package Kirki\Ecommerce\App\Blocks
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Blocks;

use Kirki\Ecommerce\App\Services\MiniCartService;

defined('ABSPATH') || exit;

/**
 * Class MiniCartBlock
 *
 * @since 1.0.0
 *
 */
class MiniCartBlock
{
    /**
     * Mini cart service instance.
     *
     * @var MiniCartService
     */
    protected $service;

    /**
     * Constructor
     *
     * @since 1.0.0
     */
    public function __construct(MiniCartService $service)
    {
        $this->service = $service;
        add_action('init', [$this, 'register']);
    }

    /**
     * Register block
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function register()
    {
        $block_name = 'kirki-ecommerce/mini-cart';
        $block_config = [
            'title'           => __('Mini Cart', 'kirki-ecommerce'),
            'render_callback' => fn($attributes) => $this->service->get_mimi_cart_html($attributes),
            'supports'        => ['autoRegister' => true],
        ];

        register_block_type($block_name, $block_config);
    }
}
