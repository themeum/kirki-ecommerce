<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Hooks\DevHookNames;
use Kirki\Ecommerce\App\Supports\Assets;
use WP_UnitTestCase;

/**
 * The config is printed inside an inline `<script>`, so no value may close that tag.
 */
class InlineConfigScriptTest extends WP_UnitTestCase
{
    public function test_config_value_cannot_close_the_script_tag()
    {
        $payload = '</script><script>alert(1)</script><!--';
        $inject = function ($config) use ($payload) {
            $config['probe'] = $payload;
            return $config;
        };
        add_filter(DevHookNames::CONFIG_DATA, $inject, PHP_INT_MAX);

        $script = Assets::get_kirki_ecommerce_configs();

        remove_filter(DevHookNames::CONFIG_DATA, $inject, PHP_INT_MAX);

        $this->assertStringNotContainsString('<', $script);
        $this->assertStringNotContainsString('>', $script);

        $json = substr($script, strlen('window.kirki_ecommerce = '), -1);
        $this->assertSame($payload, json_decode($json, true)['probe']);
    }
}
