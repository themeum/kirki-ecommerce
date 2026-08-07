<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\App\Payment\PaymentGateway;
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

class PaymentGatewayService
{
    protected $settings;

    public function __construct()
    {
        $this->settings = Settings::get(OptionKeys::PAYMENT_SETTINGS);
    }

    /**
     * Return all payment methods
     *
     * @return Collection
     */
    public function all_installable_gateways() // @todo: replace this with real payment methods later
    {
        // @todo: replace this with real payment methods later
        $payment_methods = $this->__discover_installable_gateways();

        foreach ($payment_methods as $key => $payment_method) {
            $payment_methods[$key] = PaymentGateway::make($payment_method);

            if ($payment_methods[$key]->id() === 'paypal') {
                $payment_methods[$key]->set_icon(app()->base_url('/app/Payment/Gateways/logo.svg'));
            }
        }

        return collection($payment_methods);
    }

    /**
     * Discover installable payment methods
     *
     * @todo: will be removed later and discover from remote server instead
     * @return array
     */
    protected function __discover_installable_gateways()
    {
        $path = base_path('payments/payments.json');
        return json_decoded_data($path);
    }

    /**
     * Install a payment method
     *
     * @return PaymentGateway
     */
    public function install(string $id)
    {
        if (Payment::get_gateway($id)) {
            throw new Exception(__('Payment method already installed.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $addon_zip_url = Route::url('payment-gateways/download/' . $id); //@todo: implement cloud url
        $is_installed = AddonPlugin::install($addon_zip_url);

        if (!$is_installed) {
            throw new NotFoundException(__('Payment method not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        Payment::init_registry();

        return $this->find($id);
    }

    /**
     * Return all payment methods
     *
     * @return Collection<PaymentGateway>
     */
    public function get()
    {
        return collection(Payment::get_all_online_gateways());
    }

    /**
     * Find a payment method by ID.
     *
     * @param string $id
     * @return PaymentGateway|null
     */
    public function find(string $id)
    {
        $gateway = Payment::get_gateway($id);

        if (!$gateway || $gateway->is_manual()) {
            return null;
        }

        return $gateway;
    }

    /**
     * Find a payment method by ID or throw an exception.
     *
     * @param string $id
     * @return PaymentGateway
     * @throws NotFoundException
     */
    public function find_or_fail(string $id)
    {
        $payment_gateway = $this->find($id);

        if (!$payment_gateway) {
            throw new NotFoundException(__('Payment method not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $payment_gateway;
    }

    /**
     * Updates a payment method.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param array $data
     * @throws NotFoundException
     * @return PaymentGateway
     */
    public function update(string $id, array $data)
    {
        $payment_gateway = $this->find_or_fail($id);

        $payment_gateway->save_settings($data);

        return $payment_gateway;
    }

    /**
     * Toggle a payment method.
     *
     * @param string $id
     * @param bool $is_enabled
     * @return bool
     * @throws NotFoundException
     */
    public function set_enabled(string $id, bool $is_enabled)
    {
        $payment_gateway = $this->find_or_fail($id);

        $payment_gateway->set_is_enabled($is_enabled);

        return true;
    }

    //@todo remove this later as its just to mock the zip download
    public function mock_download_gateway_zip(string $id)
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
