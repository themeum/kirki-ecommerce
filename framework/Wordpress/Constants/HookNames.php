<?php

namespace Kirki\Ecommerce\Wordpress\Constants;

class HookNames
{
    const WP = 'wp';
    const PLUGINS_LOADED = 'plugins_loaded';
    const INIT = 'init';
    const ADMIN_INIT = 'admin_init';
    const ADMIN_NOTICES = 'admin_notices';
    const REST_API_INIT = 'rest_api_init';
    const ADMIN_MENU = 'admin_menu';
    const ADMIN_ENQUEUE_SCRIPT = 'admin_enqueue_scripts';
    const WP_ENQUEUE_SCRIPT = 'wp_enqueue_scripts';
    const REGISTER_ROLE = 'register_role';
    const REGISTER_TAXONOMY = 'register_taxonomy';
    const REGISTER_POST_TYPE = 'register_post_type';
    const AJAX_QUERY_ATTACHMENTS_ARGS = 'ajax_query_attachments_args';
    const ADMIN_COMMENT_TYPES_DROPDOWN = 'admin_comment_types_dropdown';
    const WP_MAIL_FROM = 'wp_mail_from';
    const WP_MAIL_FROM_NAME = 'wp_mail_from_name';
    const WP_PHP_MAILER_INIT = 'phpmailer_init';
    const EDITABLE_ROLES = 'editable_roles';
    const WP_TRASH_POST = 'wp_trash_post';
    const LOGIN_REDIRECT = 'login_redirect';
    const TEMPLATE_INCLUDE = 'template_include';
    const GET_BLOCK_TEMPLATES = 'get_block_templates';

    // Ecommerce
    const ECOMMERCE_ALL_PAYMENT_GATEWAYS = 'kirki_ecommerce_all_payment_gateways';
}
