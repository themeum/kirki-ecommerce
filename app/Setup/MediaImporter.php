<?php

namespace Kirki\Ecommerce\App\Setup;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\RemoteUrl;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

/**
 * Downloads sample product images into the WordPress media library.
 *
 * @since 1.0.0
 */
class MediaImporter
{
    /**
     * Post meta recording the URL an attachment was downloaded from.
     *
     * Looking this up before downloading is what keeps a repeated sample data
     * load from creating a second copy of every image.
     */
    const SOURCE_META_KEY = '_kirki_ecommerce_sample_image_url';

    /**
     * Download an image into the WordPress media library.
     *
     * Returns null rather than throwing on any failure, so a store that cannot
     * download or write images still gets its products - just without imagery.
     *
     * @since 1.0.0
     *
     * @param string $url      The image URL.
     * @param string $base_url The base URL the image must belong to.
     * @return int|null The attachment ID, or null when the import failed.
     */
    public function import_url(string $url, string $base_url)
    {
        $existing = $this->find_existing($url);

        if ($existing) {
            return $existing;
        }

        if (!RemoteUrl::is_trusted($url, $base_url)) {
            return null;
        }

        $response = Http::timeout(15)->get($url);
        $contents = $response->successful() ? $response->body() : '';

        if ($contents === '') {
            return null;
        }

        $filename = sanitize_file_name(rawurldecode(basename((string) wp_parse_url($url, PHP_URL_PATH))));
        $upload = wp_upload_bits($filename, null, $contents);

        if (!empty($upload['error']) || empty($upload['file'])) {
            return null;
        }

        $attachment_id = $this->create_attachment($upload['file'], $filename);

        if (!$attachment_id) {
            return null;
        }

        $this->generate_metadata($attachment_id, $upload['file']);
        update_post_meta($attachment_id, static::SOURCE_META_KEY, $url);

        return $attachment_id;
    }

    /**
     * Find an attachment previously downloaded from the same URL.
     *
     * @since 1.0.0
     *
     * @param string $url The image URL.
     * @return int|null The existing attachment ID, or null when none was imported.
     */
    protected function find_existing($url)
    {
        $found = get_posts([
            'post_type' => 'attachment',
            'post_status' => 'inherit',
            'posts_per_page' => 1,
            'fields' => 'ids',
            // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- one lookup per sample image, on request only.
            'meta_key' => static::SOURCE_META_KEY,
            'meta_value' => $url,
        ]);

        return !empty($found) ? (int) $found[0] : null;
    }

    /**
     * Register an uploaded file as an attachment post.
     *
     * @since 1.0.0
     *
     * @param string $file     Absolute path to the uploaded file.
     * @param string $filename The original filename.
     * @return int|null The new attachment ID, or null when insertion failed.
     */
    protected function create_attachment($file, $filename)
    {
        $filetype = wp_check_filetype($filename, null);

        $attachment_id = wp_insert_attachment([
            'post_mime_type' => $filetype['type'] ?? '',
            'post_title' => sanitize_file_name(pathinfo($filename, PATHINFO_FILENAME)),
            'post_content' => '',
            'post_status' => 'inherit',
        ], $file);

        if (is_wp_error($attachment_id) || empty($attachment_id)) {
            return null;
        }

        return (int) $attachment_id;
    }

    /**
     * Build and store the attachment's metadata and generated image sizes.
     *
     * wp_generate_attachment_metadata() lives in an admin include that is not
     * guaranteed to be loaded during admin_init, where the version update runs.
     *
     * @since 1.0.0
     *
     * @param int    $attachment_id The attachment ID.
     * @param string $file          Absolute path to the uploaded file.
     * @return void
     */
    protected function generate_metadata($attachment_id, $file)
    {
        require_once ABSPATH . 'wp-admin/includes/image.php';

        wp_update_attachment_metadata(
            $attachment_id,
            wp_generate_attachment_metadata($attachment_id, $file)
        );
    }
}
