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
use Kirki\Ecommerce\App\Payment\PaymentGatewayUpdates;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Supports\Facades\File;
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

    /** @var PaymentGatewayUpdates */
    protected $updates;

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
        $this->updates = new PaymentGatewayUpdates($this->catalog);
    }

    /**
     * Get the gateways the remote catalog offers, each flagged with its installed and update state.
     *
     * The update fields are set only for installed gateways.
     *
     * @since 1.0.0
     *
     * @return Collection Collection of catalog entries.
     * @throws Exception When the catalog cannot be loaded.
     */
    public function all_installable_providers()
    {
        $gateways = $this->catalog->all();
        $plugins = $this->installed_plugins();

        return collection($gateways)->map(function ($gateway) use ($plugins) {
            $is_installed = (bool) Payment::get_provider($gateway['id']);
            $state = $this->updates->state($gateway, $plugins);

            $gateway['is_installed'] = $is_installed;
            $gateway['installed_version'] = $is_installed ? $state['installed_version'] : null;
            $gateway['update_available'] = $is_installed && $state['update_available'];
            $gateway['update_blocked_reason'] = $is_installed ? $state['update_blocked_reason'] : null;

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
     * @throws HttpException When the gateway is installed, unknown, untrusted, corrupt or fails to install.
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

        $this->install_package($gateway['download_url']);

        $this->catalog->flush();
        Payment::init_registry();

        $provider = $this->find($id);

        throw_if(!$provider, __('The payment method was installed but did not register.', 'kirki-ecommerce'), Exception::class, Response::INTERNAL_SERVER_ERROR);

        return $provider;
    }

    /**
     * Update the plugin of an installed online payment gateway to the catalog version.
     *
     * The download URL always comes from the catalog, never from the caller.
     * The catalog cache is dropped first, so the update uses the newest entry.
     * The gateway stays active and keeps its saved settings.
     *
     * @since 1.0.1
     *
     * @param string $id Payment provider ID.
     * @return PaymentProvider
     * @throws NotFoundException When the gateway is not installed or the catalog does not offer it.
     * @throws HttpException When the gateway is up to date.
     * @throws Exception When the update is blocked, untrusted, corrupt or fails to install.
     */
    public function update_plugin(string $id)
    {
        $this->find_or_fail($id);
        $this->catalog->flush();

        $gateway = $this->catalog->find($id);

        throw_if(!$gateway, __('Payment method not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $state = $this->updates->state($gateway, $this->installed_plugins());

        throw_if($state['update_blocked_reason'] !== null, (string) $state['update_blocked_reason'], Exception::class, Response::BAD_REQUEST);
        throw_if(!$state['update_available'], __('This payment method is already up to date.', 'kirki-ecommerce'), HttpException::class, Response::CONFLICT);
        throw_if(
            !PaymentGatewayCatalog::is_trusted_url($gateway['download_url'], $this->catalog->base_url()),
            __('The payment method package is not from a trusted source.', 'kirki-ecommerce'),
            Exception::class,
            Response::BAD_REQUEST
        );

        $this->install_package($gateway['download_url']);

        $this->catalog->flush();
        Payment::init_registry();

        return $this->find_or_fail($id);
    }

    /**
     * Get the installed plugins, keyed by plugin basename.
     *
     * @since 1.0.1
     *
     * @return array<string, array<string, mixed>>
     */
    protected function installed_plugins()
    {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';

        return get_plugins();
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
     * Download, verify, install and activate a catalog gateway package.
     *
     * The verified local file is given to the extension API, so the file that
     * was hashed is the file that is installed. A local path is not under the
     * catalog base URL, so the global package check does not download it again.
     *
     * @since 1.0.0
     *
     * @param string $download_url Catalog download URL.
     * @return void
     * @throws Exception When the download fails, the checksum does not match, or the install or activation fails.
     */
    protected function install_package(string $download_url)
    {
        $package_file = $this->updates->verified_package($download_url);

        if (is_wp_error($package_file)) {
            $code = $package_file->get_error_code() === 'kirki_payment_package_integrity' ? Response::BAD_REQUEST : Response::SERVICE_UNAVAILABLE;

            throw_anyway($package_file->get_error_message(), Exception::class, $code);
        }

        try {
            Extension::install($package_file, true, true);
        } finally {
            File::delete($package_file);
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
