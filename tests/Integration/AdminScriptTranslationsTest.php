<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Wordpress\Hooks\Actions\EnqueueAdminScripts;
use WP_Scripts;
use WP_UnitTestCase;

use function Kirki\Ecommerce\Framework\app;

/**
 * The admin app loads its chunks through `import()`, so their translations have to
 * reach `wp.i18n` through the entry bundle's inline data.
 */
class AdminScriptTranslationsTest extends WP_UnitTestCase
{
    protected const MANIFEST = [
        'main.tsx' => [
            'file' => 'js/kirki-ecommerce.bundle-Entry1.js',
            'isEntry' => true,
        ],
        'features/orders/pages/orders.tsx' => [
            'file' => 'js/pages/orders-Page1.chunk.js',
            'isDynamicEntry' => true,
        ],
        'style.css' => [
            'file' => 'assets/style-Css1.css',
        ],
    ];

    /** @var array<string, string> JSON translation files keyed by their core lookup file name. */
    protected $translation_files = [];

    /** @var string|null */
    protected $fixture_dir;

    /**
     * Prepare state before each test.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();

        $GLOBALS['wp_scripts'] = new WP_Scripts();
        $this->fixture_dir = get_temp_dir() . 'kirki-ecommerce-i18n-' . wp_generate_password(8, false);
        wp_mkdir_p($this->fixture_dir);

        add_filter('load_script_translation_file', [$this, 'serve_translation_file']);
        add_filter('load_script_textdomain_relative_path', [$this, 'relative_to_plugin_root'], 10, 2);
    }

    /**
     * Clean up state after each test.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        remove_filter('load_script_translation_file', [$this, 'serve_translation_file']);
        remove_filter('load_script_textdomain_relative_path', [$this, 'relative_to_plugin_root']);
        array_map('unlink', glob($this->fixture_dir . '/*.json') ?: []);
        rmdir($this->fixture_dir);
        $GLOBALS['wp_scripts'] = null;

        parent::tearDown();
    }

    /**
     * The entry bundle loads after `wp-i18n`, so the app's i18n wrapper finds it.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_entry_bundle_depends_on_wp_i18n(): void
    {
        $this->enqueue();

        $this->assertContains('wp-i18n', wp_scripts()->registered[$this->bundle_handle()]->deps);
    }

    /**
     * Strings from the entry bundle and from a lazy page chunk both reach the entry's inline data.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_entry_and_chunk_translations_are_inlined_before_the_entry(): void
    {
        $this->add_translation('assets/js/kirki-ecommerce.bundle-Entry1.js', 'Orders', 'Bestellungen');
        $this->add_translation('assets/js/pages/orders-Page1.chunk.js', 'Add order', 'Neue Bestellung');

        $this->enqueue();

        $inline = implode("\n", wp_scripts()->get_data($this->bundle_handle(), 'before') ?: []);

        $this->assertStringContainsString('"Bestellungen"', $inline);
        $this->assertStringContainsString('"Neue Bestellung"', $inline);
        $this->assertStringContainsString('wp.i18n.setLocaleData( localeData, domain )', $inline);
        $this->assertStringContainsString('( "kirki-ecommerce", ', $inline);
    }

    /**
     * Without translation files the entry gets no inline data and no helper handle stays registered.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_no_inline_data_without_translation_files(): void
    {
        $this->enqueue();

        $this->assertEmpty(wp_scripts()->get_data($this->bundle_handle(), 'before'));

        foreach (array_keys(wp_scripts()->registered) as $handle) {
            $this->assertStringStartsNotWith(app()->prefix() . 'i18n-', $handle);
        }
    }

    /**
     * Map core's lookup of a translation file to the fixture written for it.
     *
     * @since 1.0.0
     *
     * @param string|false $file Path core looks for.
     * @return string|false
     */
    public function serve_translation_file($file)
    {
        if (!$file) {
            return $file;
        }

        return $this->translation_files[basename($file)] ?? $file;
    }

    /**
     * Give core the script path that a standard install produces.
     *
     * The test WordPress loads the plugin from outside its own `WP_PLUGIN_DIR`, so
     * the plugin's asset URLs do not sit under `plugins_url()` and core cannot cut
     * them down to a plugin-relative path. On a standard install it gets
     * `assets/js/...`, and this filter returns the same.
     *
     * @since 1.0.0
     *
     * @param string|false $relative Path core computed.
     * @param string       $src      Script URL.
     * @return string|false
     */
    public function relative_to_plugin_root($relative, $src)
    {
        $marker = '/plugins/kirki-ecommerce/';
        $position = strrpos($src, $marker);

        return $position === false ? $relative : substr($src, $position + strlen($marker));
    }

    /**
     * Write a one-string JSON translation file for a script path in the package.
     *
     * The file name is the one translate.wordpress.org gives a language pack: the
     * md5 of the script's path relative to the plugin root.
     *
     * @since 1.0.0
     *
     * @param string $relative_path Script path relative to the plugin root.
     * @param string $original      Source string.
     * @param string $translation   Translated string.
     * @return void
     */
    protected function add_translation($relative_path, $original, $translation)
    {
        $file_name = sprintf('kirki-ecommerce-%s-%s.json', determine_locale(), md5($relative_path));
        $path = $this->fixture_dir . '/' . $file_name;

        file_put_contents($path, wp_json_encode([
            'domain' => 'messages',
            'locale_data' => [
                'messages' => [
                    '' => ['domain' => 'messages', 'lang' => determine_locale()],
                    $original => [$translation],
                ],
            ],
        ]));

        $this->translation_files[$file_name] = $path;
    }

    /**
     * Run the production enqueue against the fake manifest.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function enqueue()
    {
        $hook = new class (static::MANIFEST) extends EnqueueAdminScripts {
            /** @var array<string, array<string, mixed>> */
            protected $manifest;

            /**
             * Create the hook with a fixed manifest.
             *
             * @since 1.0.0
             *
             * @param array<string, array<string, mixed>> $manifest Fake Vite manifest.
             */
            public function __construct($manifest)
            {
                $this->manifest = $manifest;
            }

            /**
             * @inheritDoc
             *
             * @since 1.0.0
             */
            protected function get_manifest()
            {
                return $this->manifest;
            }

            /**
             * Run the production enqueue.
             *
             * @since 1.0.0
             *
             * @return void
             */
            public function run()
            {
                $this->enqueue_production_scripts();
            }
        };

        $hook->run();
    }

    /**
     * Get the entry bundle's script handle.
     *
     * @since 1.0.0
     *
     * @return string
     */
    protected function bundle_handle()
    {
        return app()->prefix() . 'bundle';
    }
}
