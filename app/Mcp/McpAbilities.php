<?php

namespace Kirki\Ecommerce\App\Mcp;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Ability;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Tool;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Mcp\Servers\StoreServer;
use Kirki\Ecommerce\App\Supports\Facades\Settings;

use function Kirki\Ecommerce\Framework\app;

/**
 * Decides from the MCP settings whether the store server exists and which of its tools, resources and prompts are on.
 *
 * @since 1.0.0
 */
class McpAbilities
{
    const SERVER_ID = 'kirki-ecommerce';

    /**
     * Component instances by class, made once to read their metadata.
     *
     * @var array<string, Ability>
     */
    protected $components = [];

    /**
     * Register the store server with the MCP manager when MCP is turned on.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\Ahamed\FrameworkMcp\McpManager $manager The MCP manager.
     * @return void
     */
    public function register_server($manager)
    {
        if (!$this->is_enabled()) {
            return;
        }

        $manager->server(static::SERVER_ID, StoreServer::class)->middleware(['throttle:60,1']);
    }

    /**
     * Check whether WordPress has the Abilities API and the MCP Adapter plugin is active.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function is_adapter_available()
    {
        return function_exists('wp_register_ability') && class_exists('WP\\MCP\\Core\\McpAdapter');
    }

    /**
     * Get the URL of the store server's HTTP endpoint.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function server_url()
    {
        $server = (new StoreServer())->set_id(static::SERVER_ID);

        return rest_url($server->route_namespace() . '/' . $server->route());
    }

    /**
     * Check whether MCP is turned on.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function is_enabled()
    {
        return (bool) Settings::get(OptionKeys::MCP_SETTINGS . '.enabled', false);
    }

    /**
     * Check whether read-only mode is on.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function is_read_only()
    {
        return (bool) Settings::get(OptionKeys::MCP_SETTINGS . '.read_only', false);
    }

    /**
     * Keep the component classes whose ability is on, whether MCP is turned on or not.
     *
     * @since 1.0.0
     *
     * @param string[] $classes Tool, resource or prompt classes.
     * @return string[]
     */
    public function filter(array $classes)
    {
        return array_values(array_filter($classes, fn($class) => $this->is_on($class)));
    }

    /**
     * Check whether a component's ability is on: its group is on, its own value is on, and it is not a write tool in read-only mode.
     *
     * A group or ability that has no stored value counts as on.
     *
     * @since 1.0.0
     *
     * @param string $class Tool, resource or prompt class.
     * @return bool
     */
    public function is_on(string $class)
    {
        $group = $this->group_of($class);
        $groups = (array) Settings::get(OptionKeys::MCP_SETTINGS . '.groups', []);
        $abilities = (array) Settings::get(OptionKeys::MCP_SETTINGS . '.abilities', []);
        $component = $this->component($class);

        if ($group === null || !($groups[$group] ?? true)) {
            return false;
        }

        if (!($abilities[$component->name()] ?? true)) {
            return false;
        }

        return !($this->is_read_only() && $this->is_write($component));
    }

    /**
     * Count the abilities that are on, whether MCP is turned on or not.
     *
     * @since 1.0.0
     *
     * @return int
     */
    public function count_on()
    {
        return count($this->filter(array_merge(...array_values(AbilityGroups::GROUPS))));
    }

    /**
     * Get the groups with their label and description, and the name, kind, title, description and write flag of each
     * ability, in display order.
     *
     * @since 1.0.0
     *
     * @return array<int, array{id: string, label: string, description: string, abilities: array<int, array<string, mixed>>}>
     */
    public function catalog()
    {
        $labels = $this->group_labels();
        $descriptions = $this->group_descriptions();
        $catalog = [];

        foreach (AbilityGroups::GROUPS as $group => $classes) {
            $catalog[] = [
                'id' => $group,
                'label' => $labels[$group],
                'description' => $descriptions[$group],
                'abilities' => array_map(function ($class) {
                    $component = $this->component($class);

                    return [
                        'name' => $component->name(),
                        'kind' => $component::KIND,
                        'title' => $component->title(),
                        'description' => $component->description(),
                        'is_write' => $this->is_write($component),
                    ];
                }, $classes),
            ];
        }

        return $catalog;
    }

    /**
     * Get every ability name of the catalog.
     *
     * @since 1.0.0
     *
     * @return string[]
     */
    public function ability_names()
    {
        return array_map(fn($class) => $this->component($class)->name(), array_merge(...array_values(AbilityGroups::GROUPS)));
    }

    /**
     * Get the translated group labels by group id.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function group_labels()
    {
        return [
            'sales' => __('Sales & analytics', 'kirki-ecommerce'),
            'orders' => __('Orders', 'kirki-ecommerce'),
            'products' => __('Products & inventory', 'kirki-ecommerce'),
            'customers' => __('Customers', 'kirki-ecommerce'),
            'coupons' => __('Coupons', 'kirki-ecommerce'),
            'store_setup' => __('Store setup', 'kirki-ecommerce'),
        ];
    }

    /**
     * Get the translated group descriptions by group id.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function group_descriptions()
    {
        return [
            'sales' => __('Read sales numbers, trends and best sellers, and run the sales report routines.', 'kirki-ecommerce'),
            'orders' => __('Find and read orders, add notes, update fulfillment and payment, and create or cancel orders.', 'kirki-ecommerce'),
            'products' => __('Find products and stock levels, and change product content, status, stock and prices.', 'kirki-ecommerce'),
            'customers' => __('Find customers and change their tags.', 'kirki-ecommerce'),
            'coupons' => __('Find coupons, and create, update, turn on or turn off coupons.', 'kirki-ecommerce'),
            'store_setup' => __('Read the store profile and setup status, fix store pages and change email notifications.', 'kirki-ecommerce'),
        ];
    }

    /**
     * Get the id of the group that a component class is in, or null when it is in none.
     *
     * @since 1.0.0
     *
     * @param string $class Tool, resource or prompt class.
     * @return string|null
     */
    protected function group_of(string $class)
    {
        foreach (AbilityGroups::GROUPS as $group => $classes) {
            if (in_array($class, $classes, true)) {
                return $group;
            }
        }

        return null;
    }

    /**
     * Check whether a component is a tool that changes store data.
     *
     * @since 1.0.0
     *
     * @param Ability $component The component.
     * @return bool
     */
    protected function is_write(Ability $component)
    {
        return $component instanceof Tool && !$component->read_only();
    }

    /**
     * Get the component instance of a class.
     *
     * @since 1.0.0
     *
     * @param string $class Tool, resource or prompt class.
     * @return Ability
     */
    protected function component(string $class)
    {
        if (!isset($this->components[$class])) {
            $this->components[$class] = app()->make($class);
        }

        return $this->components[$class];
    }
}
