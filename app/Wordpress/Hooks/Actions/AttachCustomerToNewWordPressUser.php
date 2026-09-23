<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Actions;

use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;

/**
 * Links a newly created WordPress user to a matching, unlinked customer.
 *
 * @since 1.0.0
 */
class AttachCustomerToNewWordPressUser extends BaseHook
{
    /** @var CustomerService */
    protected $customer_service;

    /**
     * Set up the hook.
     *
     * @since 1.0.0
     *
     * @param CustomerService $customer_service Customer persistence service.
     */
    public function __construct(CustomerService $customer_service)
    {
        $this->customer_service = $customer_service;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name()
    {
        return WPHookNames::USER_REGISTER;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return HookTypes::ACTION;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_args_count()
    {
        return 1;
    }

    /**
     * Link the new WordPress user to a customer sharing its email, if any.
     *
     * Runs on the `user_register` action, which fires for every new WordPress
     * user, not just ones created through this plugin. Does nothing when no
     * customer matches, or when the matching customer is already linked.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments: the new user's ID.
     * @return void
     */
    public function handle(...$args)
    {
        [$user_id] = $args;

        $user = get_userdata($user_id);

        if (empty($user)) {
            return;
        }

        $this->customer_service->attach_wordpress_user($user->user_email, $user_id);
    }
}
