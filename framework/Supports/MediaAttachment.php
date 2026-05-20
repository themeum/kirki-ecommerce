<?php

namespace Kirki\Ecommerce\Supports;

class MediaAttachment
{
    /**
     * Make a video attachment.
     * 
     * @param array|null $video The video data.
     * 
     * @return array|null
     */
    public static function make_video($video)
    {
        if (empty($video)) {
            return null;
        }

        // If the video comes from youtube or video providers then return it.
        if (isset($video['url'])) {
            return $video;
        }

        $video_id = $video['id'] ?? null;
        $poster_id = $video['poster'] ?? null;

        if (empty($video_id)) {
            return null;
        }

        $video_attachment = static::make($video_id);
        $poster_attachment = static::make($poster_id);

        $video_attachment['poster'] = $poster_attachment;

        return $video_attachment;
    }
    /**
     * Generate an array of metadata about an image attachment.
     *
     * @param int|null $id Attachment ID.
     *
     * @return array|null Array of image metadata, or null if attachment is invalid.
     */
    public static function make($id)
    {
        if (empty($id)) {
            return null;
        }

        $metadata = wp_get_attachment_metadata($id);
        $attached_file = get_attached_file($id);

        if (empty($metadata) || empty($attached_file)) {
            return null;
        }

        $mime = get_post_mime_type($id);
        $type = $mime && stripos($mime, '/') !== false ? explode('/', $mime)[0] : '';

        $sizes = isset($metadata['sizes']) && is_array($metadata['sizes'])
            ? static::get_formatted_sizes($id, $metadata['sizes'])
            : [];
        $filename = basename($attached_file) ?? '';

        $author_id = (string) get_post_field('post_author', $id);
        $author_name = get_the_author_meta('display_name', $author_id);

        return [
            'id'            => (string) $id,
            'filename'      => $filename,
            'url'           => wp_get_attachment_url($id),
            'sizes'         => $sizes,
            'height'        => isset($metadata['height']) ? (int) $metadata['height'] : 0,
            'width'         => isset($metadata['width']) ? (int) $metadata['width'] : 0,
            'filesize'      => isset($metadata['filesize']) ? (int) $metadata['filesize'] : 0,
            'mime'          => $mime,
            'type'          => $type,
            'thumb'         => null,
            'author'        => $author_id,
            'author_name'   => $author_name,
            'date'          => get_the_date('c', $id),
        ];
    }

    /**
     * Generate an array of metadata about multiple image attachments.
     * @param array $ids
     * @return array
     */
    public static function make_many(array $ids)
    {
        $attachments = [];

        foreach ($ids as $id) {
            $attachment = static::make($id);
            if ($attachment) {
                $attachments[] = $attachment;
            }
        }

        return $attachments;
    }

    /**
     * Get the formatted image sizes.
     *
     * @param int   $attachment_id The attachment ID.
     * @param array $sizes         An array of size data from attachment metadata.
     *
     * @return array An associative array of formatted image sizes with height, width, URL, and orientation.
     */
    private static function get_formatted_sizes($attachment_id, array $sizes)
    {
        $formatted_sizes = [];

        foreach ($sizes as $size => $info) {
            $height = isset($info['height']) ? (int) $info['height'] : 0;
            $width  = isset($info['width']) ? (int) $info['width'] : 0;

            $formatted_sizes[$size] = [
                'height'      => $height,
                'width'       => $width,
                'url'         => wp_get_attachment_image_url($attachment_id, $size),
                'orientation' => $height >= $width ? 'portrait' : 'landscape',
            ];
        }

        return $formatted_sizes;
    }
}
