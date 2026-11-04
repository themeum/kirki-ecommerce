<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Contracts\MigrationSource;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups\AttributesGroup;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups\BrandsGroup;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups\CategoriesGroup;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups\CouponsGroup;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups\CustomersGroup;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups\OrdersGroup;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups\ProductsGroup;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups\SettingsGroup;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups\TagsGroup;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Probe\ExtensionDetector;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Probe\StorageProbe;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Probe\VersionProbe;

/**
 * Migration source for WooCommerce.
 *
 * @since 1.0.0
 */
class WooCommerceSource implements MigrationSource
{
    /** @var WooCommerceDatabase */
    protected $database;

    /** @var VersionProbe */
    protected $version;

    /** @var StorageProbe */
    protected $storage;

    /** @var ExtensionDetector */
    protected $extensions;

    /**
     * Create the source with its probes.
     *
     * @since 1.0.0
     *
     * @param WooCommerceDatabase|null $database   The WooCommerce database reader.
     * @param ExtensionDetector|null   $extensions The extension detector.
     */
    public function __construct(?WooCommerceDatabase $database = null, ?ExtensionDetector $extensions = null)
    {
        $this->database = $database ?: new WooCommerceDatabase();
        $this->version = new VersionProbe($this->database);
        $this->storage = new StorageProbe($this->database);
        $this->extensions = $extensions ?: new ExtensionDetector();
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function id()
    {
        return 'woocommerce';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function label()
    {
        return __('WooCommerce', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function detect()
    {
        return $this->version->is_installed();
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function version_state()
    {
        return [
            'version' => $this->version->version(),
            'minimum' => VersionProbe::MINIMUM_VERSION,
            'supported' => $this->version->is_supported(),
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function extensions()
    {
        return $this->extensions->detect();
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function groups()
    {
        return [
            new SettingsGroup($this->database),
            new CategoriesGroup($this->database),
            new TagsGroup($this->database),
            new BrandsGroup($this->database),
            new AttributesGroup($this->database),
            new ProductsGroup($this->database, $this->extensions),
            new CustomersGroup($this->database),
            new CouponsGroup($this->database),
            new OrdersGroup($this->database, $this->storage),
        ];
    }
}
