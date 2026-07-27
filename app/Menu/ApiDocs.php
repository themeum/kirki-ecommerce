<?php

namespace Kirki\Ecommerce\App\Menu;

use Kirki\Ecommerce\Wordpress\Constants\MenuTypes;
use Kirki\Ecommerce\Wordpress\Menu;

use function Kirki\Ecommerce\base_path;

/**
 * WordPress admin page that embeds Swagger UI for the OpenAPI docs.
 *
 * @since 1.0.0
 */
class ApiDocs extends Menu
{
    /**
     * Menu slug for the API docs admin page.
     *
     * @var string
     * @since 1.0.0
     */
    const PAGE_SLUG = 'kirki-ecommerce-api-docs';

    /** @inheritDoc */
    protected $menu_type = MenuTypes::SUB_MENU;

    /** @inheritDoc */
    protected $capabilities = 'read';

    /** @inheritDoc */
    protected $menu_slug = self::PAGE_SLUG;

    /** @inheritDoc */
    protected $parent_slug = 'ecommerce';

    /**
     * Register menu titles and admin asset enqueue.
     *
     * @return void
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->page_title = __('API Docs', 'kirki-ecommerce');
        $this->menu_title = __('API Docs', 'kirki-ecommerce');
        $this->callback = [$this, 'render_page'];

        parent::__construct();

        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
    }

    /**
     * Enqueue Swagger UI assets on the API docs admin page.
     *
     * @return void
     * @since 1.0.0
     */
    public function enqueue_assets()
    {
        if (!$this->is_api_docs_page()) {
            return;
        }

        $asset_base = defined('KIRKI_ECOMMERCE_ASSETS_URL')
            ? KIRKI_ECOMMERCE_ASSETS_URL . '/swagger-ui'
            : plugins_url('assets/swagger-ui', KIRKI_ECOMMERCE_PLUGIN_FILE);

        $style_handle = KIRKI_ECOMMERCE_PREFIX . 'swagger-ui';
        $admin_style_handle = KIRKI_ECOMMERCE_PREFIX . 'swagger-ui-admin';
        $bundle_handle = KIRKI_ECOMMERCE_PREFIX . 'swagger-ui-bundle';
        $standalone_handle = KIRKI_ECOMMERCE_PREFIX . 'swagger-ui-standalone';
        $init_handle = KIRKI_ECOMMERCE_PREFIX . 'swagger-ui-init';

        wp_enqueue_style(
            $style_handle,
            $asset_base . '/swagger-ui.css',
            [],
            KIRKI_ECOMMERCE_VERSION
        );

        wp_register_style($admin_style_handle, false, [$style_handle], KIRKI_ECOMMERCE_VERSION);
        wp_enqueue_style($admin_style_handle);
        wp_add_inline_style(
            $admin_style_handle,
            '#swagger-ui .topbar { display: none; }
            .kirki-ecommerce-api-docs-wrap { margin: 0 0 0 -20px; }
            .kirki-ecommerce-api-docs-wrap .wrap { margin: 0; }'
        );

        wp_enqueue_script(
            $bundle_handle,
            $asset_base . '/swagger-ui-bundle.js',
            [],
            KIRKI_ECOMMERCE_VERSION,
            true
        );

        wp_enqueue_script(
            $standalone_handle,
            $asset_base . '/swagger-ui-standalone-preset.js',
            [$bundle_handle],
            KIRKI_ECOMMERCE_VERSION,
            true
        );

        wp_register_script($init_handle, false, [$bundle_handle, $standalone_handle], KIRKI_ECOMMERCE_VERSION, true);
        wp_enqueue_script($init_handle);

        $spec = $this->load_spec();
        $nonce = wp_create_nonce('wp_rest');

        wp_add_inline_script(
            $init_handle,
            'window.kirkiEcommerceOpenApi = ' . wp_json_encode([
                'spec' => $spec,
                'nonce' => $nonce,
            ]) . ';
            window.addEventListener("load", function () {
                if (!window.kirkiEcommerceOpenApi || !window.kirkiEcommerceOpenApi.spec) {
                    return;
                }
                window.ui = SwaggerUIBundle({
                    spec: window.kirkiEcommerceOpenApi.spec,
                    dom_id: "#swagger-ui",
                    deepLinking: true,
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIStandalonePreset
                    ],
                    layout: "StandaloneLayout",
                    tryItOutEnabled: true,
                    withCredentials: true,
                    requestInterceptor: function (request) {
                        request.headers["X-WP-Nonce"] = window.kirkiEcommerceOpenApi.nonce;
                        return request;
                    }
                });
            });',
            'after'
        );
    }

    /**
     * Render the Swagger UI mount point.
     *
     * @return void
     * @since 1.0.0
     */
    public function render_page()
    {
        if (!is_user_logged_in()) {
            wp_die(
                esc_html__('You must be logged in to view API documentation.', 'kirki-ecommerce'),
                esc_html__('Unauthorized', 'kirki-ecommerce'),
                ['response' => 401]
            );
        }

        $spec_path = base_path('storage/openapi/openapi.json');

        if (!file_exists($spec_path)) {
            echo '<div class="wrap"><div class="notice notice-error"><p>';
            echo esc_html__(
                'OpenAPI specification has not been generated yet. Run: wp kirki docs:generate',
                'kirki-ecommerce'
            );
            echo '</p></div></div>';

            return;
        }

        echo '<div class="kirki-ecommerce-api-docs-wrap">';
        echo '<div class="wrap">';
        echo '<h1>' . esc_html__('API Docs', 'kirki-ecommerce') . '</h1>';
        echo '<div id="swagger-ui"></div>';
        echo '</div>';
        echo '</div>';
    }

    /**
     * Whether the current admin screen is the API docs page.
     *
     * @return bool
     * @since 1.0.0
     */
    protected function is_api_docs_page()
    {
        $page = isset($_GET['page']) ? sanitize_text_field(wp_unslash($_GET['page'])) : '';

        return $page === static::PAGE_SLUG;
    }

    /**
     * Load and decode the committed OpenAPI specification.
     *
     * @return array|null
     * @since 1.0.0
     */
    protected function load_spec()
    {
        $path = base_path('storage/openapi/openapi.json');

        if (!file_exists($path)) {
            return null;
        }

        $decoded = json_decode(file_get_contents($path), true);

        if (!is_array($decoded)) {
            return null;
        }

        return $decoded;
    }
}
