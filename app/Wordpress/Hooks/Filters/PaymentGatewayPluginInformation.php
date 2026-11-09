<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Filters;

defined('ABSPATH') || exit;

use Exception;
use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Payment\PaymentGatewayCatalog;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

/**
 * Answers the WordPress plugin details request for payment gateways from the remote catalog.
 *
 * @since 1.0.1
 */
class PaymentGatewayPluginInformation extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.1
     */
    public function get_name(): string
    {
        return WPHookNames::PLUGINS_API;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.1
     */
    public function get_type(): string
    {
        return HookTypes::FILTER;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.1
     */
    public function get_args_count()
    {
        return 3;
    }

    /**
     * Return the details of a catalog gateway for the "View details" popup.
     *
     * Runs on the `plugins_api` filter. Requests for other plugins, or a
     * catalog that cannot be loaded, leave the result to WordPress.
     *
     * @since 1.0.1
     *
     * @param mixed ...$args Filter arguments: the result, the action and the request arguments.
     * @return mixed The plugin details, or the result without a change.
     */
    public function handle(...$args)
    {
        list($result, $action, $request) = array_pad($args, 3, null);

        if ($action !== 'plugin_information' || !is_object($request) || empty($request->slug)) {
            return $result;
        }

        $catalog = new PaymentGatewayCatalog();
        $gateway = $this->find_gateway($catalog, (string) $request->slug);

        if (!$gateway) {
            return $result;
        }

        $details = $catalog->details($gateway['slug']);
        $changelog = is_string($details['changelog'] ?? null) ? $details['changelog'] : '';
        $sections = ['description' => wpautop(esc_html($gateway['description']))];

        if ($changelog !== '') {
            $sections['changelog'] = wp_kses_post($this->markdown_to_html($changelog));
        }

        return (object) [
            'name' => $gateway['name'],
            'slug' => $gateway['slug'],
            'version' => $gateway['version'],
            'author' => '',
            'homepage' => '',
            'requires' => $gateway['requires_wp'],
            'requires_php' => $gateway['requires_php'],
            'download_link' => $gateway['download_url'],
            'sections' => $sections,
            'icons' => $gateway['icon_url'] !== '' ? ['svg' => $gateway['icon_url']] : [],
            'banners' => [],
            'external' => true,
        ];
    }

    /**
     * Find a catalog gateway by its plugin slug.
     *
     * @since 1.0.1
     *
     * @param PaymentGatewayCatalog $catalog Remote gateway catalog.
     * @param string                $slug    Plugin slug.
     * @return array<string, string>|null Null when the catalog does not offer it or cannot be loaded.
     */
    protected function find_gateway(PaymentGatewayCatalog $catalog, string $slug)
    {
        try {
            $gateways = $catalog->all();
        } catch (Exception $exception) {
            return null;
        }

        foreach ($gateways as $gateway) {
            if ($gateway['slug'] === $slug) {
                return $gateway;
            }
        }

        return null;
    }

    /**
     * Convert a simple Markdown changelog to HTML.
     *
     * Supports headings, "-" or "*" list items and paragraphs. All text is escaped.
     *
     * @since 1.0.1
     *
     * @param string $markdown Changelog text.
     * @return string
     */
    protected function markdown_to_html(string $markdown)
    {
        $html = '';
        $in_list = false;

        foreach (preg_split('/\R/', $markdown) as $line) {
            $line = trim($line);
            $is_item = preg_match('/^[-*]\s+(.*)$/', $line, $item) === 1;

            if ($in_list && !$is_item) {
                $html .= '</ul>';
                $in_list = false;
            }

            if ($line === '') {
                continue;
            }

            if ($is_item) {
                $html .= ($in_list ? '' : '<ul>') . '<li>' . esc_html($item[1]) . '</li>';
                $in_list = true;
            } elseif (preg_match('/^#{1,6}\s+(.*)$/', $line, $heading) === 1) {
                $html .= '<h4>' . esc_html($heading[1]) . '</h4>';
            } else {
                $html .= '<p>' . esc_html($line) . '</p>';
            }
        }

        return $in_list ? $html . '</ul>' : $html;
    }
}
