<?php

namespace Kirki\Ecommerce\Wordpress;

use Kirki\Ecommerce\ServiceProvider;

class HookServiceProvider extends ServiceProvider
{
    /**
     * Register the hooks to the application.
     *
     * @return void
     */
    public function register()
    {
        $hooks_path = $this->app->config_path('hooks.php');

        if (!file_exists($hooks_path)) {
            return;
        }

        $hooks = include $hooks_path;

        $this->app->tag($hooks['actions'], 'hook.actions');
        $this->app->tag($hooks['filters'], 'hook.filters');
    }

    /**
     * Add the action hooks on after the application booted.
     *
     * @return void
     */
    public function boot()
    {
        $actions = $this->app->tagged('hook.actions');

        if (!empty($actions)) {
            foreach ($actions as $action) {
                add_action(
                    $action->get_name(),
                    [$action, 'handle'],
                    $action->get_priority(),
                    $action->get_args_count(),
                );
            }
        }

        $filters = $this->app->tagged('hook.filters');

        if (!empty($filters)) {
            foreach ($filters as $filter) {
                add_filter(
                    $filter->get_name(),
                    [$filter, 'handle'],
                    $filter->get_priority(),
                    $filter->get_args_count(),
                );
            }
        }
    }
}
