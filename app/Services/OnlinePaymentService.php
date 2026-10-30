<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Exceptions\HttpException;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Wordpress\Extension;
use Kirki\Ecommerce\App\Payment\PaymentGatewayCatalog;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Supports\Facades\File;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;
use Exception;
use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\throw_anyway;
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Manages online payment providers: discovery, installation, settings and enabling.
 *
 * @since 1.0.0
 */
class OnlinePaymentService
{
    /** @var \Kirki\Ecommerce\App\AppSettings */
    protected $settings;

    /** @var PaymentGatewayCatalog */
    protected $catalog;

    /**
     * Create the service and load the payment settings.
     *
     * @since 1.0.0
     *
     * @param PaymentGatewayCatalog|null $catalog Remote gateway catalog; the default one is used when omitted.
     */
    public function __construct(?PaymentGatewayCatalog $catalog = null)
    {
        $this->settings = Settings::get(OptionKeys::PAYMENT_SETTINGS);
        $this->catalog = $catalog ?: new PaymentGatewayCatalog();
    }

    /**
     * Get the gateways the remote catalog offers, each flagged with its installed state.
     *
     * @since 1.0.0
     *
     * @return Collection Collection of catalog entries.
     * @throws Exception When the catalog cannot be loaded.
     */
    public function all_installable_providers()
    {
        return collection($this->catalog->all())->map(function ($gateway) {
            $gateway['is_installed'] = (bool) Payment::get_provider($gateway['id']);

            return $gateway;
        })->values();
    }

    /**
     * Install and activate an online payment gateway from the remote catalog.
     *
     * The download URL always comes from the catalog, never from the caller.
     * The catalog cache is dropped first, so the checksum matches the zip on the server now.
     * The zip is installed only when its SHA-256 hash matches the catalog.
     *
     * @since 1.0.0
     *
     * @param string $id Payment provider ID.
     * @return PaymentProvider|null
     * @throws HttpException When the gateway is already installed.
     * @throws Exception When the gateway is untrusted, corrupt or fails to install.
     * @throws NotFoundException When the catalog does not offer the gateway.
     */
    public function install(string $id)
    {
        throw_if((bool) Payment::get_provider($id), __('Payment method already installed.', 'kirki-ecommerce'), HttpException::class, Response::CONFLICT);

        $this->catalog->flush();

        $gateway = $this->catalog->find($id);

        throw_if(!$gateway, __('Payment method not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);
        throw_if(
            !PaymentGatewayCatalog::is_trusted_url($gateway['download_url'], $this->catalog->base_url()),
            __('The payment method package is not from a trusted source.', 'kirki-ecommerce'),
            Exception::class,
            Response::BAD_REQUEST
        );

        $package_file = $this->download_package($gateway);

        try {
            $this->install_package($gateway['download_url'], $package_file);
        } finally {
            File::delete($package_file);
        }

        $this->catalog->flush();
        Payment::init_registry();

        $provider = $this->find($id);

        throw_if(!$provider, __('The payment method was installed but did not register.', 'kirki-ecommerce'), Exception::class, Response::INTERNAL_SERVER_ERROR);

        return $provider;
    }

    /**
     * Deactivate and delete the plugin of an installed online payment gateway.
     *
     * Built-in gateways have no plugin of their own and cannot be removed.
     * The saved gateway settings stay in the database, so installing the
     * gateway again restores them.
     *
     * @since 1.0.0
     *
     * @param string $id Payment provider ID.
     * @return bool Always true.
     * @throws NotFoundException When no online provider has that ID.
     * @throws Exception When the gateway is built in or the plugin cannot be removed.
     */
    public function uninstall(string $id)
    {
        $provider = $this->find_or_fail($id);
        $plugin_basename = $this->find_plugin_basename($provider);

        throw_if(
            !$plugin_basename,
            __('This payment method cannot be removed.', 'kirki-ecommerce'),
            Exception::class,
            Response::BAD_REQUEST
        );

        Extension::deactivate($plugin_basename);
        Extension::remove($plugin_basename);

        return true;
    }

    /**
     * Find the basename of the plugin that registers a provider.
     *
     * The plugin folder is taken from the file of the provider class. Classes
     * outside the plugins folder, or inside this plugin, have no basename.
     *
     * @since 1.0.0
     *
     * @param PaymentProvider $provider Payment provider.
     * @return string|null Plugin basename, e.g. "kirki-stripe/kirki-stripe.php".
     */
    protected function find_plugin_basename(PaymentProvider $provider)
    {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';

        $class_file = (new \ReflectionClass($provider))->getFileName();
        $plugins_dir = trailingslashit(wp_normalize_path(WP_PLUGIN_DIR));
        $class_file = wp_normalize_path((string) $class_file);

        if (strpos($class_file, $plugins_dir) !== 0) {
            return null;
        }

        $folder = explode('/', substr($class_file, strlen($plugins_dir)))[0];

        if ($folder === dirname(plugin_basename(KIRKI_ECOMMERCE_PLUGIN_FILE))) {
            return null;
        }

        foreach (array_keys(get_plugins()) as $plugin_basename) {
            if (strpos($plugin_basename, $folder . '/') === 0) {
                return $plugin_basename;
            }
        }

        return null;
    }

    /**
     * Download a gateway zip to a temporary file and check its checksum.
     *
     * @since 1.0.0
     *
     * @param array<string, string> $gateway Catalog entry.
     * @return string Path of the verified temporary file.
     * @throws Exception When the download fails or the checksum does not match.
     */
    protected function download_package(array $gateway)
    {
        require_once ABSPATH . 'wp-admin/includes/file.php';

        $package_file = wp_tempnam($gateway['download_url']);
        $response = Http::with_options(['timeout' => 300, 'stream' => true, 'filename' => $package_file])
            ->get($gateway['download_url']);

        if (!$response->successful()) {
            File::delete($package_file);
            throw_anyway(__('Could not download the payment method package.', 'kirki-ecommerce'), Exception::class, Response::SERVICE_UNAVAILABLE);
        }

        if (!hash_equals($gateway['sha256'], File::hash($package_file, 'sha256'))) {
            File::delete($package_file);
            throw_anyway(__('The payment method package failed the integrity check.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);
        }

        return $package_file;
    }

    /**
     * Install and activate a verified zip through the extension API.
     *
     * The upgrader would download the package URL again. The pre-download
     * filter hands it the verified local file instead, so the file that was
     * hashed is the file that is installed.
     *
     * @since 1.0.0
     *
     * @param string $download_url Catalog download URL.
     * @param string $package_file Path of the verified zip.
     * @return void
     * @throws Exception When the install or activation fails.
     */
    protected function install_package(string $download_url, string $package_file)
    {
        $use_verified_file = function ($reply, $package) use ($download_url, $package_file) {
            return $package === $download_url ? $package_file : $reply;
        };

        add_filter('upgrader_pre_download', $use_verified_file, 10, 2);

        try {
            Extension::install($download_url);
        } finally {
            remove_filter('upgrader_pre_download', $use_verified_file, 10);
        }
    }

    /**
     * Get all online payment providers.
     *
     * @since 1.0.0
     *
     * @return Collection<PaymentProvider>
     */
    public function get()
    {
        return collection(Payment::get_online_providers());
    }

    /**
     * Find an online payment provider by ID.
     *
     * @since 1.0.0
     *
     * @param string $id Payment provider ID.
     * @return PaymentProvider|null Null when the provider does not exist or is an offline one.
     */
    public function find(string $id)
    {
        $provider = Payment::get_provider($id);

        if (!$provider || $provider->is_offline()) {
            return null;
        }

        return $provider;
    }

    /**
     * Find an online payment provider by ID or throw an exception.
     *
     * @since 1.0.0
     *
     * @param string $id Payment provider ID.
     * @return PaymentProvider
     * @throws NotFoundException When no online provider has that ID.
     */
    public function find_or_fail(string $id)
    {
        $provider = $this->find($id);

        throw_if(!$provider, __('Payment method not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $provider;
    }

    /**
     * Update an online payment provider's settings.
     *
     * @since 1.0.0
     *
     * @param string               $id   Payment provider ID.
     * @param array<string, mixed> $data Settings to save.
     * @return PaymentProvider
     * @throws NotFoundException When no online provider has that ID.
     */
    public function update(string $id, array $data)
    {
        $provider = $this->find_or_fail($id);

        $provider->save_settings($data);

        return $provider;
    }

    /**
     * Enable or disable an online payment provider.
     *
     * @since 1.0.0
     *
     * @param string $id         Payment provider ID.
     * @param bool   $is_enabled Whether the provider should be enabled.
     * @return bool Always true.
     * @throws NotFoundException When no online provider has that ID.
     */
    public function set_enabled(string $id, bool $is_enabled)
    {
        $provider = $this->find_or_fail($id);

        $provider->set_is_enabled($is_enabled);

        return true;
    }
}
