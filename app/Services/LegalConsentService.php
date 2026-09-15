<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Constants\ConsentMethods;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Supports\Facades\Settings;

defined('ABSPATH') || exit;

class LegalConsentService
{
    /**
     * Pattern matching a page token such as {privacy_policy}.
     */
    protected const TOKEN_PATTERN = '/\{([a-z0-9_]+)\}/i';

    /**
     * @var PageService
     */
    protected $page_service;

    public function __construct(PageService $page_service)
    {
        $this->page_service = $page_service;
    }

    /**
     * Get the consents to display at a location, with their messages rendered.
     *
     * Tokens across every consent are resolved in one query - resolving them
     * per consent would mean a query per token on every page render.
     *
     * @param string $location
     *
     * @return array<int, array{id: string, method: string, html: string}>
     */
    public function get_renderable(string $location)
    {
        $consents = $this->get_enabled_for($location);

        if (empty($consents)) {
            return [];
        }

        $pages = $this->resolve_pages($this->collect_slugs($consents));

        $renderable = [];

        foreach ($consents as $consent) {
            $renderable[] = [
                'id' => (string) ($consent['id'] ?? ''),
                'method' => (string) ($consent['method'] ?? ConsentMethods::DISPLAY_TEXT_ONLY),
                'html' => $this->render_with_pages((string) ($consent['message'] ?? ''), $pages),
            ];
        }

        return $renderable;
    }

    /**
     * Get the ids of the enabled mandatory consents at a location.
     *
     * @param string $location
     *
     * @return string[]
     */
    public function get_mandatory_ids(string $location)
    {
        $ids = [];

        foreach ($this->get_enabled_for($location) as $consent) {
            if (($consent['method'] ?? null) !== ConsentMethods::MANDATORY_CHECKBOX) {
                continue;
            }

            $ids[] = (string) ($consent['id'] ?? '');
        }

        return array_values(array_filter($ids));
    }

    /**
     * Render a single consent message to escaped HTML.
     *
     * @param string $message
     *
     * @return string
     */
    public function render_message(string $message)
    {
        return $this->render_with_pages($message, $this->resolve_pages($this->extract_slugs($message)));
    }

    /**
     * Get the enabled consents configured for a location.
     *
     * @param string $location
     *
     * @return array<int, array>
     */
    protected function get_enabled_for(string $location)
    {
        $consents = Settings::get(OptionKeys::LEGAL_SETTINGS . '.consents', []);

        if (!is_array($consents)) {
            return [];
        }

        $matched = [];

        foreach ($consents as $consent) {
            if (!is_array($consent) || empty($consent['is_enabled'])) {
                continue;
            }

            $locations = isset($consent['locations']) && is_array($consent['locations']) ? $consent['locations'] : [];

            if (!in_array($location, $locations, true)) {
                continue;
            }

            $matched[] = $consent;
        }

        return $matched;
    }

    /**
     * Escape the message, then swap its tokens for links.
     *
     * The message is escaped in full before any markup is inserted: esc_html()
     * leaves the braces alone, so the tokens survive while every other byte is
     * already neutralised. Substituting first and escaping the remaining
     * fragments afterwards would leave a missed fragment unescaped.
     *
     * @param string $message
     * @param array<string, object> $pages Keyed by page slug.
     *
     * @return string
     */
    protected function render_with_pages(string $message, array $pages)
    {
        $escaped = nl2br(esc_html($message));

        return preg_replace_callback(
            static::TOKEN_PATTERN,
            function ($matches) use ($pages) {
                return $this->render_token($matches[1], $pages);
            },
            $escaped
        );
    }

    /**
     * Render a single token as a link, or as readable text when unresolved.
     *
     * @param string $token
     * @param array<string, object> $pages
     *
     * @return string
     */
    protected function render_token(string $token, array $pages)
    {
        $slug = static::token_to_slug($token);
        $page = $pages[$slug] ?? null;

        if (empty($page)) {
            return esc_html(static::humanize_slug($slug));
        }

        return sprintf(
            '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
            esc_url((string) get_permalink($page->ID)),
            esc_html((string) $page->post_title)
        );
    }

    /**
     * Collect every token slug used across a set of consents.
     *
     * @param array<int, array> $consents
     *
     * @return string[]
     */
    protected function collect_slugs(array $consents)
    {
        $slugs = [];

        foreach ($consents as $consent) {
            $slugs = array_merge($slugs, $this->extract_slugs((string) ($consent['message'] ?? '')));
        }

        return array_values(array_unique($slugs));
    }

    /**
     * Extract the page slugs referenced by a message's tokens.
     *
     * @param string $message
     *
     * @return string[]
     */
    protected function extract_slugs(string $message)
    {
        if (!preg_match_all(static::TOKEN_PATTERN, $message, $matches)) {
            return [];
        }

        return array_values(array_unique(array_map([static::class, 'token_to_slug'], $matches[1])));
    }

    /**
     * Look up published pages by slug, keyed by slug.
     *
     * @param string[] $slugs
     *
     * @return array<string, object>
     */
    protected function resolve_pages(array $slugs)
    {
        if (empty($slugs)) {
            return [];
        }

        $pages = [];

        foreach ($this->page_service->find_published_by_slugs($slugs) as $page) {
            $pages[$page->post_name] = $page;
        }

        return $pages;
    }

    /**
     * Convert a token to the page slug it refers to.
     *
     * @param string $token
     *
     * @return string
     */
    protected static function token_to_slug(string $token)
    {
        return str_replace('_', '-', strtolower($token));
    }

    /**
     * Turn a slug into readable text, for a token that resolves to no page.
     *
     * @param string $slug
     *
     * @return string
     */
    protected static function humanize_slug(string $slug)
    {
        return ucwords(str_replace('-', ' ', $slug));
    }
}
