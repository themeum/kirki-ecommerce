<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\Framework\Route;
use Kirki\Ecommerce\App\Supports\AddonPlugin;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Exception;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use ZipArchive;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\app_path;
use function Kirki\Ecommerce\Framework\base_path;
use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\json_decoded_data;

class OnlinePaymentService
{
    protected $settings;

    public function __construct()
    {
        $this->settings = Settings::get(OptionKeys::PAYMENT_SETTINGS);
    }

    /**
     * Return all installable online payment providers
     *
     * @return Collection
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
     * Discover installable online payment providers
     *
     * @todo: will be removed later and discover from remote server instead
     * @return array
     */
    protected function __discover_installable_providers()
    {
        $path = base_path('payments/payments.json');
        return json_decoded_data($path);
    }

    /**
     * Install an online payment provider
     *
     * @return PaymentProvider
     */
    public function install(string $id)
    {
        if (Payment::get_provider($id)) {
            throw new Exception(__('Payment method already installed.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $addon_zip_url = Route::url('online-payments/download/' . $id); //@todo: implement cloud url
        $is_installed = AddonPlugin::install($addon_zip_url);

        if (!$is_installed) {
            throw new NotFoundException(__('Payment method not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        Payment::init_registry();

        return $this->find($id);
    }

    /**
     * Return all online payment providers
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
     * @param string $id
     * @return PaymentProvider|null
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
     * @param string $id
     * @return PaymentProvider
     * @throws NotFoundException
     */
    public function find_or_fail(string $id)
    {
        $provider = $this->find($id);

        if (!$provider) {
            throw new NotFoundException(__('Payment method not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $provider;
    }

    /**
     * Updates an online payment provider.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param array $data
     * @throws NotFoundException
     * @return PaymentProvider
     */
    public function update(string $id, array $data)
    {
        $provider = $this->find_or_fail($id);

        $provider->save_settings($data);

        return $provider;
    }

    /**
     * Toggle an online payment provider.
     *
     * @param string $id
     * @param bool $is_enabled
     * @return bool
     * @throws NotFoundException
     */
    public function set_enabled(string $id, bool $is_enabled)
    {
        $provider = $this->find_or_fail($id);

        $provider->set_is_enabled($is_enabled);

        return true;
    }

    //@todo remove this later as its just to mock the zip download
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
            readfile($temp_zip_path);
            unlink($temp_zip_path);
            exit;
        } else {
            throw new Exception(__('Failed to create zip file.', 'kirki-ecommerce'), Response::INTERNAL_SERVER_ERROR);
        }
    }
}
