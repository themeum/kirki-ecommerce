<?php

use Kirki\Ecommerce\Framework\Application;

if (!defined('ABSPATH')) {
    exit;
}

Application::macro('is_dev_mode', function () {
    return in_array(strtolower(KIRKI_ECOMMERCE_MODE), ['development', 'dev'], true);
});

return Application::configure(KIRKI_ECOMMERCE_PLUGIN_PATH)
    ->use_prefix(KIRKI_ECOMMERCE_PREFIX)
    ->use_routing(KIRKI_ECOMMERCE_PLUGIN_PATH . '/routes/site.php')
    ->use_routing(KIRKI_ECOMMERCE_PLUGIN_PATH . '/routes/api.php')
    ->boot();
