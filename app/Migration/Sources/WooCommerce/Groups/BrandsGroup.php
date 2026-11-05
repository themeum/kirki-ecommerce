<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\DTO\Brand\CreateBrandDTO;
use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Services\BrandService;
use Kirki\Ecommerce\Framework\Supports\Str;
use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\App\Models\Product;

use function Kirki\Ecommerce\Framework\app;

/**
 * Migrates WooCommerce product brands.
 *
 * @since 1.0.0
 */
class BrandsGroup extends TermsGroup
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function id()
    {
        return 'brands';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function label()
    {
        return __('Brands', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function description()
    {
        return __('Product brands with their logos.', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function entity()
    {
        return 'brand';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function taxonomy()
    {
        return 'product_brand';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function map(array $row, RecordLedger $ledger)
    {
        return new CreateBrandDTO([
            'name' => $row['name'],
            'slug' => $row['slug'],
            'description' => $row['description'] !== '' ? $row['description'] : null,
            'logo' => $row['image_id'],
        ]);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function persist($mapped, array $row, RecordLedger $ledger)
    {
        $brand = app(BrandService::class)->create($mapped);

        $this->note_slug_change(__('Brand', 'kirki-ecommerce'), $row['name'], Str::slug($row['slug']), $brand->slug);

        return (int) $brand->id;
    }
}
