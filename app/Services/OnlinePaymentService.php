<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\Framework\Route;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Exception;
use Kirki\Ecommerce\Framework\Wordpress\Extension;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use ZipArchive;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\app_path;
use function Kirki\Ecommerce\Framework\base_path;
use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\json_decoded_data;
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

    /**
     * Create the service and load the payment settings.
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->settings = Settings::get(OptionKeys::PAYMENT_SETTINGS);
    }

    /**
     * Get all installable online payment providers.
     *
     * @since 1.0.0
     *
     * @return Collection Collection of PaymentProvider.
     */
    public function all_installable_providers() // @todo: replace this with real providers later
    {
        // @todo: replace this with real providers later
        $providers = $this->__discover_installable_providers();

        foreach ($providers as $key => $provider) {
            $providers[$key] = PaymentProvider::make($provider);

            if ($providers[$key]->id() === 'paypal') {
                $providers[$key]->set_icon(app()->base_url('/app/Payment/Providers/logo.svg'));
            }
        }

        return collection($providers);
    }

    /**
     * Discover installable online payment providers from the bundled payments.json.
     *
     * @since 1.0.0
     *
     * @return array|null Decoded provider definitions, null when the file is missing.
     * @todo Replace with discovery from a remote server.
     */
    protected function __discover_installable_providers()
    {
        $path = base_path('payments/payments.json');
        return json_decoded_data($path);
    }

    /**
     * Install an online payment provider.
     *
     * @since 1.0.0
     *
     * @param string $id Payment provider ID.
     * @return PaymentProvider|null
     * @throws Exception When the provider is already installed.
     * @throws NotFoundException When the provider package could not be installed.
     */
    public function install(string $id)
    {
        throw_if((bool) Payment::get_provider($id), __('Payment method already installed.', 'kirki-ecommerce'), Exception::class, Response::NOT_FOUND);

        $addon_zip_url = Route::url('online-payments/download/' . $id); //@todo: implement cloud url
        $is_installed = Extension::install($addon_zip_url);

        throw_if(!$is_installed, __('Payment method not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        Payment::init_registry();

        return $this->find($id);
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

    //@todo remove this later as its just to mock the zip download
    /**
     * Stream a provider's folder to the client as a zip download, then exit.
     *
     * @since 1.0.0
     *
     * @param string $id Payment provider ID.
     * @return void
     * @throws Exception When the zip file cannot be created.
     * @todo Remove once providers are downloaded from a real source.
     */
    public function mock_download_provider_zip(string $id)
    {
        $name = 'kirki-' . $id;
        $folder_to_zip = base_path('payments/' . $name);
        $zip_file_name = $name . '.zip';
        $temp_zip_path = sys_get_temp_dir() . '/' . $zip_file_name;

        $zip = new ZipArchive();

        if ($zip->open($temp_zip_path, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
            $files = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($folder_to_zip),
                RecursiveIteratorIterator::LEAVES_ONLY
            );

            foreach ($files as $name => $file) {
                if (!$file->isDir()) {
                    $file_path = $file->getRealPath();
                    $relative_path = substr($file_path, strlen($folder_to_zip) + 1);
                    $zip->addFile($file_path, $relative_path);
                }
            }
            $zip->close();

            header('Content-Type: application/zip');
            header('Content-Disposition: attachment; filename="' . $zip_file_name . '"');
            header('Content-Length: ' . filesize($temp_zip_path));
            header('Pragma: no-cache');
            header('Expires: 0');

            // 4. Output the file and delete the temporary zip
            readfile($temp_zip_path); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_readfile -- Streaming a binary zip download directly to the client; WP_Filesystem::get_contents() would buffer the whole file into memory first.
            wp_delete_file($temp_zip_path);
            exit;
        } else {
            throw_anyway(__('Failed to create zip file.', 'kirki-ecommerce'), Exception::class, Response::INTERNAL_SERVER_ERROR);
        }
    }
}
