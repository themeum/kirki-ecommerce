<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Setup\Presets\PresetRepository;
use Kirki\Ecommerce\Framework\Supports\Facades\Cache;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\ServesPresetData;
use WP_Error;

/**
 * Covers how the preset repository reads the remote preset location.
 */
class RemotePresetRepositoryTest extends RestTestCase
{
    use ServesPresetData;

    public function test_presets_are_requested_once_from_the_base_url(): void
    {
        $this->serve_preset_data();
        $repository = new PresetRepository();

        $this->assertNotEmpty($repository->get_common()['attributes']);
        $this->assertNotEmpty($repository->get_industry('fashion-and-apparel')['attributes']);
        $this->assertSame(['presets.json'], $this->preset_requests);
    }

    public function test_failed_request_yields_no_presets(): void
    {
        $this->serve_preset_data(['presets.json' => new WP_Error('http_request_failed', 'Operation timed out')]);

        $this->assertSame([], (new PresetRepository())->get_common());
    }

    public function test_error_status_yields_no_presets(): void
    {
        $this->serve_preset_data(['presets.json' => 500]);

        $this->assertSame([], (new PresetRepository())->get_common());
    }

    public function test_invalid_json_yields_no_presets(): void
    {
        $this->serve_preset_data(['presets.json' => '{ not json']);

        $this->assertSame([], (new PresetRepository())->get_industry('fashion-and-apparel'));
    }

    public function test_unsupported_version_yields_no_presets(): void
    {
        $this->serve_preset_data(['presets.json' => ['version' => 99, 'common' => ['attributes' => [['slug' => 'color']]]]]);

        $this->assertSame([], (new PresetRepository())->get_common());
    }

    public function test_untrusted_base_url_is_not_requested(): void
    {
        $requested = [];
        add_filter('pre_http_request', function ($reply, $args, $url) use (&$requested) {
            $requested[] = $url;

            return new WP_Error('http_request_failed', 'No network in tests');
        }, 10, 3);

        $repository = new PresetRepository('http://presets.example.com/data');

        $this->assertSame([], $repository->get_common());
        $this->assertNull($repository->get_products('fashion-and-apparel'));
        $this->assertSame([], $requested);
    }

    public function test_industry_products_are_read_from_the_industry_folder(): void
    {
        $this->serve_preset_data();

        $catalog = (new PresetRepository())->get_products('fashion-and-apparel');

        $this->assertCount(5, $catalog['products']);
        $this->assertNotEmpty($catalog['categories']);
        $this->assertNotEmpty($catalog['tags']);
        $this->assertSame('fashion-and-apparel', $catalog['set']);
        $this->assertSame(['fashion-and-apparel/products.json', 'presets.json'], $this->preset_requests);
    }

    public function test_other_and_empty_industries_read_the_other_products(): void
    {
        $this->serve_preset_data();
        $repository = new PresetRepository();

        $this->assertSame('other', $repository->get_products('other')['set']);
        $this->assertSame('other', $repository->get_products('')['set']);
        $this->assertSame(['other/products.json', 'presets.json', 'other/products.json'], $this->preset_requests);
    }

    public function test_missing_industry_file_falls_back_to_the_other_products(): void
    {
        $this->serve_preset_data(['pet-supplies/products.json' => 404, 'baby-and-kids/products.json' => 403]);
        $repository = new PresetRepository();

        $this->assertSame('other', $repository->get_products('pet-supplies')['set']);
        $this->assertSame('other', $repository->get_products('baby-and-kids')['set']);
    }

    public function test_failed_industry_request_does_not_fall_back(): void
    {
        $this->serve_preset_data(['pet-supplies/products.json' => new WP_Error('http_request_failed', 'Operation timed out')]);

        $this->assertNull((new PresetRepository())->get_products('pet-supplies'));
        $this->assertSame(['pet-supplies/products.json', 'presets.json'], $this->preset_requests);
    }

    public function test_read_presets_are_reused_by_the_next_request(): void
    {
        $this->serve_preset_data();
        (new PresetRepository())->get_common();
        $this->preset_requests = [];

        $this->assertNotEmpty((new PresetRepository())->get_common()['attributes']);
        $this->assertSame([], $this->preset_requests);
    }

    public function test_failed_presets_read_is_not_cached(): void
    {
        $this->serve_preset_data(['presets.json' => 500]);

        $this->assertSame([], (new PresetRepository())->get_common());
        $this->assertNull(Cache::get(PresetRepository::cache_key(constant('KIRKI_ECOMMERCE_PRESETS_URL'))));
    }

    public function test_cached_presets_are_kept_per_base_url(): void
    {
        $this->serve_preset_data();
        (new PresetRepository())->get_common();

        $this->assertNull(Cache::get(PresetRepository::cache_key('https://other.example.com/data')));
        $this->assertIsArray(Cache::get(PresetRepository::cache_key(constant('KIRKI_ECOMMERCE_PRESETS_URL'))));
    }

    public function test_products_and_presets_are_requested_together(): void
    {
        $this->serve_preset_data();
        $repository = new class extends PresetRepository {
            /** @var array<int, string[]> Paths of each read, in order. */
            public $reads = [];

            protected function fetch(string $path, int $version, &$status = null)
            {
                $this->reads[] = [$path];

                return parent::fetch($path, $version, $status);
            }

            protected function fetch_many(array $paths)
            {
                $this->reads[] = array_keys($paths);

                return parent::fetch_many($paths);
            }
        };

        $this->assertSame('fashion-and-apparel', $repository->get_products('fashion-and-apparel')['set']);
        $this->assertNotEmpty($repository->get_common()['attributes']);
        $this->assertSame([['fashion-and-apparel/products.json', 'presets.json']], $repository->reads);
        $this->assertSame(['fashion-and-apparel/products.json', 'presets.json'], $this->preset_requests);
    }

    public function test_cached_presets_leave_only_the_products_request(): void
    {
        $this->serve_preset_data();
        (new PresetRepository())->get_common();
        $this->preset_requests = [];
        $repository = new PresetRepository();

        $this->assertSame('fashion-and-apparel', $repository->get_products('fashion-and-apparel')['set']);
        $this->assertNotEmpty($repository->get_common()['attributes']);
        $this->assertSame(['fashion-and-apparel/products.json'], $this->preset_requests);
    }

    public function test_missing_industry_file_falls_back_after_the_pooled_requests(): void
    {
        $this->serve_preset_data(['pet-supplies/products.json' => 404]);

        $this->assertSame('other', (new PresetRepository())->get_products('pet-supplies')['set']);
        $this->assertSame(['pet-supplies/products.json', 'presets.json', 'other/products.json'], $this->preset_requests);
    }

    public function test_unsupported_products_version_yields_no_products(): void
    {
        $this->serve_preset_data(['fashion-and-apparel/products.json' => ['version' => 2, 'products' => []]]);

        $this->assertNull((new PresetRepository())->get_products('fashion-and-apparel'));
    }

    public function test_image_url_is_below_the_base_url(): void
    {
        $repository = new PresetRepository('https://presets.test/data/');

        $this->assertSame(
            'https://presets.test/data/fashion-and-apparel/images/linen%20shirt.jpg',
            $repository->get_image_url('fashion-and-apparel', 'linen shirt.jpg')
        );
    }
}
