<?php

use Kirki\Ecommerce\Framework\Application;

if (!defined('ABSPATH')) {
    exit;
}

return Application::configure(KIRKI_ECOMMERCE_PLUGIN_PATH)
    ->use_prefix(KIRKI_ECOMMERCE_PREFIX)
    ->use_version(KIRKI_ECOMMERCE_VERSION)
    ->use_routing(KIRKI_ECOMMERCE_PLUGIN_PATH . '/routes/site.php')
    ->use_routing(KIRKI_ECOMMERCE_PLUGIN_PATH . '/routes/api.php')
    ->use_app_mode(strtolower(KIRKI_ECOMMERCE_MODE))
    ->boot();
