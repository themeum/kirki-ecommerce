<?php

namespace Kirki\Ecommerce\App\Setup\Presets;

use Kirki\Ecommerce\App\Constants\ConsentLocations;
use Kirki\Ecommerce\App\Constants\ConsentMethods;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

defined('ABSPATH') || exit;

/**
 * Inserts the legal pages and the consents that link to them.
 *
 * Pages get placeholder text only: generated legal text could be wrong for
 * the merchant, so writing the policy stays their job.
 *
 * @since 1.0.0
 */
class LegalPresets
{
    /**
     * Create the missing legal pages, then the consents when the store has none.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $presets The preset response.
     * @param PresetContext        $context The store's answers.
     * @return void
     */
    public function apply(array $presets, PresetContext $context)
    {
        $legal = $presets['legal'] ?? [];
        $slugs = $this->ensure_pages($legal['pages'] ?? []);

        $settings = Settings::get(OptionKeys::LEGAL_SETTINGS)->refresh();

        if (!empty($settings->to_array()['consents'])) {
            return;
        }

        $consents = array_values(array_filter(array_map(fn($consent) => $this->make_consent((array) $consent, $slugs), $legal['consents'] ?? [])));

        if (empty($consents)) {
            return;
        }

        $settings->set(['consents' => $consents]);

        Log::info(sprintf('Store presets created %d legal consents', count($consents)));
    }

    /**
     * Make sure a published page exists for each preset legal page.
     *
     * The privacy page reuses the WordPress privacy policy page when that page
     * is published. A draft one is not published for the merchant: it holds
     * the WordPress guide text, not a policy.
     *
     * @since 1.0.0
     *
     * @param mixed $pages Page definitions with key, slug, title and content.
     * @return array<string, string> The slug of each page, keyed by its preset key.
     */
    protected function ensure_pages($pages)
    {
        $slugs = [];

        foreach (is_array($pages) ? $pages : [] as $page) {
            $page = [
                'key' => sanitize_key($page['key'] ?? ''),
                'slug' => sanitize_title($page['slug'] ?? ''),
                'title' => sanitize_text_field($page['title'] ?? ''),
                'content' => wp_kses_post($page['content'] ?? ''),
            ];

            if ($page['key'] === '' || $page['slug'] === '' || $page['title'] === '') {
                continue;
            }

            if ('privacy' === $page['key']) {
                $privacy_page_id = (int) get_option('wp_page_for_privacy_policy');

                if ($privacy_page_id && 'publish' === get_post_status($privacy_page_id)) {
                    $slugs[$page['key']] = get_post_field('post_name', $privacy_page_id);
                    continue;
                }
            }

            $slugs[$page['key']] = $page['slug'];

            if (get_page_by_path($page['slug'], OBJECT, 'page')) {
                continue;
            }

            wp_insert_post([
                'post_title' => $page['title'],
                'post_name' => $page['slug'],
                'post_content' => $page['content'],
                'post_status' => 'publish',
                'post_type' => 'page',
            ]);
        }

        return $slugs;
    }

    /**
     * Build a stored consent from a preset consent.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed>  $consent Preset consent with title, locations, method and message.
     * @param array<string, string> $slugs   Legal page slugs keyed by preset page key.
     * @return array<string, mixed>|null Consent settings entry, or null when the consent is not valid.
     */
    protected function make_consent(array $consent, array $slugs)
    {
        $title = sanitize_text_field($consent['title'] ?? '');
        $locations = array_values(array_intersect((array) ($consent['locations'] ?? []), ConsentLocations::get_constant_values()));
        $method = $consent['method'] ?? null;

        if ($title === '' || empty($locations) || !in_array($method, ConsentMethods::get_constant_values(), true)) {
            Log::warning('Store presets skipped a legal consent');

            return null;
        }

        return [
            'id' => wp_generate_uuid4(),
            'title' => $title,
            'locations' => $locations,
            'message' => $this->replace_page_tokens(sanitize_text_field($consent['message'] ?? ''), $slugs),
            'method' => $method,
            'is_enabled' => true,
        ];
    }

    /**
     * Replace `{page:<key>}` placeholders with consent page tokens.
     *
     * A consent token is the page slug with hyphens written as underscores,
     * which is the form the consent renderer resolves back to a slug.
     *
     * @since 1.0.0
     *
     * @param string                $message Message with page placeholders.
     * @param array<string, string> $slugs   Legal page slugs keyed by preset page key.
     * @return string
     */
    protected function replace_page_tokens(string $message, array $slugs)
    {
        return preg_replace_callback('/\{page:([a-z_]+)\}/', function ($matches) use ($slugs) {
            $slug = $slugs[$matches[1]] ?? $matches[1];

            return '{' . str_replace('-', '_', $slug) . '}';
        }, $message);
    }
}
