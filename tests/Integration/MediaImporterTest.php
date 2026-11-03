<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Setup\MediaImporter;
use Kirki\Ecommerce\Tests\Support\ServesPresetData;
use WP_Error;
use WP_UnitTestCase;

/**
 * Covers downloading sample images into the media library, many at a time.
 */
class MediaImporterTest extends WP_UnitTestCase
{
    use ServesPresetData;

    /** @var string Base URL of the preset location. */
    protected $base_url;

    /** @var string Image folder of this test, unique so imports of other tests are not reused. */
    protected $folder;

    /** @var string[] Every URL requested outside the preset location. */
    protected $foreign_requests = [];

    /**
     * Serve the preset location and block every other request.
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->base_url = rtrim(constant('KIRKI_ECOMMERCE_PRESETS_URL'), '/');
        $this->folder = uniqid('media-importer-');

        add_filter('pre_http_request', function ($reply, $args, $url) {
            if (strpos($url, $this->base_url . '/') === 0) {
                return $reply;
            }

            $this->foreign_requests[] = $url;

            return new WP_Error('http_request_failed', 'Blocked in tests');
        }, 5, 3);
    }

    /**
     * Get the URL of an image in this test's folder.
     *
     * @param string $filename Image filename.
     * @return string
     */
    protected function image_url(string $filename): string
    {
        return sprintf('%s/%s/images/%s', $this->base_url, $this->folder, $filename);
    }

    /**
     * Get the path below the base URL of an image in this test's folder.
     *
     * @param string $filename Image filename.
     * @return string
     */
    protected function image_path(string $filename): string
    {
        return sprintf('%s/images/%s', $this->folder, $filename);
    }

    public function test_each_url_becomes_one_attachment_with_its_source(): void
    {
        $this->serve_preset_data();
        $urls = [$this->image_url('a.jpg'), $this->image_url('b.jpg'), $this->image_url('c.jpg')];

        $ids = (new MediaImporter())->import_urls($urls, $this->base_url);

        $this->assertSame($urls, array_keys($ids));
        $this->assertCount(3, array_unique(array_filter($ids)));

        foreach ($ids as $url => $id) {
            $this->assertSame('attachment', get_post_type($id));
            $this->assertSame($url, get_post_meta($id, MediaImporter::SOURCE_META_KEY, true));
        }
    }

    public function test_a_url_listed_twice_is_requested_once(): void
    {
        $this->serve_preset_data();
        $url = $this->image_url('a.jpg');

        $ids = (new MediaImporter())->import_urls([$url, $url], $this->base_url);

        $this->assertSame([$url], array_keys($ids));
        $this->assertSame([$this->image_path('a.jpg')], $this->preset_requests);
    }

    public function test_an_imported_url_is_reused_without_a_request(): void
    {
        $this->serve_preset_data();
        $url = $this->image_url('a.jpg');
        $importer = new MediaImporter();
        $first = $importer->import_urls([$url], $this->base_url);
        $this->preset_requests = [];

        $second = $importer->import_urls([$url], $this->base_url);

        $this->assertSame($first, $second);
        $this->assertSame([], $this->preset_requests);
    }

    public function test_an_untrusted_url_is_not_requested(): void
    {
        $this->serve_preset_data();
        $url = 'https://example.com/images/a.jpg';

        $ids = (new MediaImporter())->import_urls([$url, $this->image_url('b.jpg')], $this->base_url);

        $this->assertNull($ids[$url]);
        $this->assertIsInt($ids[$this->image_url('b.jpg')]);
        $this->assertSame([], $this->foreign_requests);
    }

    public function test_failed_downloads_give_null_for_those_images_only(): void
    {
        $this->serve_preset_data([
            $this->image_path('timeout.jpg') => new WP_Error('http_request_failed', 'Operation timed out'),
            $this->image_path('missing.jpg') => 404,
        ]);
        $urls = [$this->image_url('timeout.jpg'), $this->image_url('a.jpg'), $this->image_url('missing.jpg')];

        $ids = (new MediaImporter())->import_urls($urls, $this->base_url);

        $this->assertNull($ids[$this->image_url('timeout.jpg')]);
        $this->assertNull($ids[$this->image_url('missing.jpg')]);
        $this->assertIsInt($ids[$this->image_url('a.jpg')]);
    }

    public function test_no_urls_send_no_request(): void
    {
        $this->serve_preset_data();

        $this->assertSame([], (new MediaImporter())->import_urls([], $this->base_url));
        $this->assertSame([], $this->preset_requests);
    }

    public function test_one_url_imports_through_the_same_path(): void
    {
        $this->serve_preset_data();
        $url = $this->image_url('a.jpg');

        $id = (new MediaImporter())->import_url($url, $this->base_url);

        $this->assertSame($url, get_post_meta($id, MediaImporter::SOURCE_META_KEY, true));
        $this->assertSame([$this->image_path('a.jpg')], $this->preset_requests);
    }
}
