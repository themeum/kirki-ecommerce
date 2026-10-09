<?php

namespace Kirki\Ecommerce\App\Constants\Hooks;

defined('ABSPATH') || exit;

/**
 * Names of WordPress core hooks the plugin attaches to, extending the framework hook list.
 *
 * @since 1.0.0
 */
class WPHookNames extends \Kirki\Ecommerce\Framework\Wordpress\Constants\HookNames
{
    public const WP_HEAD = 'wp_head';
    public const LOGIN_FORM = 'login_form';
    public const REGISTER_FORM = 'register_form';
    public const DISPLAY_POST_STATES = 'display_post_states';
    public const PRE_GET_DOCUMENT_TITLE = 'pre_get_document_title';
    public const AUTHENTICATE = 'authenticate';
    public const REGISTRATION_ERRORS = 'registration_errors';
    public const ADMIN_BAR_MENU = 'admin_bar_menu';
    public const PROFILE_UPDATE = 'profile_update';
    public const USER_REGISTER = 'user_register';
    public const SEND_RETRIEVE_PASSWORD_EMAIL = 'send_retrieve_password_email';
    public const WP_SEND_NEW_USER_NOTIFICATION_TO_USER = 'wp_send_new_user_notification_to_user';
}
