<?php

/**
 * Social Login Template Part.
 *
 * @todo will be used later.
 * @package Kirki\Ecommerce\Templates
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Icon;
?>

<div class="kecom-login-social">
    <div class="kecom-login-social-divider">
        <div class="kecom-divider"></div>
        <span class="kecom-divider-text"><?php _e('or continue with', 'kirki-ecommerce'); ?></span>
        <div class="kecom-divider"></div>
    </div>
    <div class="kecom-login-social-btn-container">
        <button class="kecom-btn kecom-btn-outline kecom-google-btn">
            <?php Icon::render('google', ['size' => 24]); ?>
        </button>
        <button class="kecom-btn kecom-btn-outline kecom-facebook-btn">
            <?php Icon::render('facebook', ['size' => 24]); ?>
        </button>
    </div>

</div>