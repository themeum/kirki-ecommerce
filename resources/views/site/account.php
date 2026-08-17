<?php

/**
 * Account Page Template (Alias for Dashboard).
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\view_data;

$pages = view_data('pages');

include_view('site.account.dashboard', ['pages' => $pages]);
