<?php

namespace Kirki\Ecommerce\App;

use Kirki\Ecommerce\App\Constants\Install;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\StorefrontPages;
use Kirki\Ecommerce\Database\Seeders\CurrencySeeder;
use Kirki\Ecommerce\Database\Seeders\ProductSchemaSeeder;
use Kirki\Ecommerce\Database\Seeders\ShippingBoxesSeeder;
use Kirki\Ecommerce\Database\Seeders\ShippingProfilesSeeder;
use Kirki\Ecommerce\Database\Seeders\TaxProfilesSeeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;

defined('ABSPATH') || exit;

class Installer
{
    /**
     * Provision the default data a fresh install needs to be usable.
     *
     * Runs on every activation. The version gate makes a repeat activation at
     * the same version a no-op, and the seeders guard their own rows by
     * natural key so a version bump can add a default without duplicating the
     * ones an earlier version supplied.
     *
     * @return void
     */
    public static function run()
    {
        $installer = new static();

        if ($installer->is_current_version_installed()) {
            return;
        }

        $installer->seed_default_records();
        $installer->create_storefront_pages();
        $installer->mark_installed();
    }

    /**
     * Whether the install already ran for the running plugin version.
     *
     * @return bool
     */
    protected function is_current_version_installed()
    {
        return Option::get(Install::INSTALLED_VERSION) === KIRKI_ECOMMERCE_VERSION;
    }

    /**
     * Seed the records other features hold references to.
     *
     * @return void
     */
    protected function seed_default_records()
    {
        (new CurrencySeeder())->run();
        (new ShippingProfilesSeeder())->run();
        (new TaxProfilesSeeder())->run();
        (new ShippingBoxesSeeder())->run();
        (new ProductSchemaSeeder())->run();
    }

    /**
     * Ensure every storefront view is backed by a page, and record the map.
     *
     * A view whose mapped page still exists is left alone, so a merchant's
     * choice survives reactivation and only a missing page is replaced.
     *
     * @return void
     */
    protected function create_storefront_pages()
    {
        $stored = Option::get(OptionKeys::ADVANCE_SETTINGS) ?? [];
        $pages = $stored['pages'] ?? [];

        foreach (StorefrontPages::definitions() as $view => $definition) {
            if ($this->page_exists($pages[$view] ?? null)) {
                continue;
            }

            $pages[$view] = $this->create_page($definition);
        }

        $stored['pages'] = $pages;

        Option::set(OptionKeys::ADVANCE_SETTINGS, $stored);
    }

    /**
     * Whether a recorded page id still resolves to a usable page.
     *
     * @param mixed $page_id
     * @return bool
     */
    protected function page_exists($page_id)
    {
        if (empty($page_id)) {
            return false;
        }

        $page = get_post((int) $page_id);

        return $page && $page->post_type === 'page' && $page->post_status !== 'trash';
    }

    /**
     * Create a published storefront page.
     *
     * @param array $definition
     * @return int|null
     */
    protected function create_page(array $definition)
    {
        $page_id = wp_insert_post([
            'post_title' => $definition['title'],
            'post_name' => $definition['slug'],
            'post_content' => '',
            'post_status' => 'publish',
            'post_type' => 'page',
            'comment_status' => 'closed',
            'ping_status' => 'closed',
        ]);

        if (is_wp_error($page_id) || empty($page_id)) {
            return null;
        }

        return (int) $page_id;
    }

    /**
     * Record the version this install provisioned for.
     *
     * Deliberately the last step, so a failure part way through leaves the
     * marker unset and the next activation retries from the top.
     *
     * @return void
     */
    protected function mark_installed()
    {
        Option::set(Install::INSTALLED_VERSION, KIRKI_ECOMMERCE_VERSION);
    }
}
