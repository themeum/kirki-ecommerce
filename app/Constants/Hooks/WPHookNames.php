<?php

namespace Kirki\Ecommerce\App\Constants\Hooks;

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
}
