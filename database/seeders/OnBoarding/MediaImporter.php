<?php

namespace Kirki\Ecommerce\Database\Seeders\OnBoarding;

class MediaImporter
{
    /**
     * Post meta recording the bundled filename an attachment was imported from.
     *
     * Looking this up before importing is what keeps a repeated onboarding run
     * from creating a second copy of every image.
     */
    const SOURCE_META_KEY = '_kirki_ecommerce_onboarding_image';

    /**
     * Import a file bundled with the plugin into the WordPress media library.
     *
     * Returns null rather than throwing on any failure, so a store that cannot
     * write to the uploads directory still gets its catalog - just without
     * imagery - instead of a fatal during the version update.
     *
     * @param string $absolute_path Absolute path to the bundled source file.
     *
     * @return int|null The attachment ID, or null when the import failed.
     * @since 1.0.0
     */
    public function import($absolute_path)
    {
        if (!is_readable($absolute_path)) {
            return null;
        }

        $filename = basename($absolute_path);
        $existing = $this->find_existing($filename);

        if ($existing) {
            return $existing;
        }

        $contents = file_get_contents($absolute_path);

        if (false === $contents) {
            return null;
        }

        $upload = wp_upload_bits($filename, null, $contents);

        if (!empty($upload['error']) || empty($upload['file'])) {
            return null;
        }

        $attachment_id = $this->create_attachment($upload['file'], $filename);

        if (!$attachment_id) {
            return null;
        }

        $this->generate_metadata($attachment_id, $upload['file']);
        update_post_meta($attachment_id, static::SOURCE_META_KEY, $filename);

        return $attachment_id;
    }

    /**
     * Find an attachment previously imported from the same bundled filename.
     *
     * @param string $filename The bundled source filename.
     *
     * @return int|null
     * @since 1.0.0
     */
    protected function find_existing($filename)
    {
        $found = get_posts([
            'post_type' => 'attachment',
            'post_status' => 'inherit',
            'posts_per_page' => 1,
            'fields' => 'ids',
            // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- one lookup per bundled image, on install only.
            'meta_key' => static::SOURCE_META_KEY,
            'meta_value' => $filename,
        ]);

        return !empty($found) ? (int) $found[0] : null;
    }

    /**
     * Register an uploaded file as an attachment post.
     *
     * @param string $file     Absolute path to the uploaded file.
     * @param string $filename The original filename.
     *
     * @return int|null
     * @since 1.0.0
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
     * @param int    $attachment_id The attachment ID.
     * @param string $file          Absolute path to the uploaded file.
     *
     * @return void
     * @since 1.0.0
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
