<?php

/**
 * Auth Controller
 *
 * @package Kirki\Ecommerce\App\Http\Controllers\Site
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Http\Controllers\Site;

use Kirki\Ecommerce\App\Http\Requests\Account\LoginRequest;
use Kirki\Ecommerce\App\Http\Requests\Account\RegistrationRequest;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Route;

use function Kirki\Ecommerce\Framework\redirect;
use function Kirki\Ecommerce\Framework\view;

/**
 * Class AuthController
 *
 * @since 1.0.0
 */
class AuthController
{
    /**
     * Login page
     *
     * @since 1.0.0
     *
     * @param Request $request request.
     *
     * @return string Template path.
     */
    public function login_page(Request $request)
    {
        if (is_user_logged_in()) {
            wp_safe_redirect(Url::get_account_url());
            exit;
        }

        return view('site.login')->layout(false);
    }

    /**
     * Registration page
     *
     * @since 1.0.0
     *
     * @param Request $request request.
     *
     * @return string Template path.
     */
    public function register_page(Request $request)
    {
        if (! Utils::registration_enabled()) {
            wp_die(
                esc_html__('Registration is disabled for now. Please contact the administrator for more information.', 'kirki-ecommerce'),
                esc_html__('Registration Disabled', 'kirki-ecommerce'),
                [
                    'response' => Response::FORBIDDEN, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- HTTP status code passed to wp_die()'s response argument, not rendered as content.
                ]
            );
        }

        if (is_user_logged_in()) {
            wp_safe_redirect(Url::get_account_url());
            exit;
        }

        return view('site.register')->layout(false);
    }

    /**
     * Handle login
     *
     * @since 1.0.0
     *
     * @param LoginRequest $request request.
     *
     * @return Response response.
     */
    public function handle_login(LoginRequest $request)
    {
        if (is_user_logged_in()) {
            return redirect(Url::get_account_url());
        }

        $redirect_url = $request->input('redirect') ?? '';

        if (! Utils::is_nonce_verified()) {
            return redirect(Url::get_login_url($redirect_url))
                ->with('errors', [__('Invalid nonce', 'kirki-ecommerce')]);
        }

        $sanitized_input = $request->sanitized();

        $creds = [
            'user_login'    => $sanitized_input['email'],
            'user_password' => $sanitized_input['password'],
            'remember'      => $sanitized_input['remember'] ?? false,
        ];

        $user = wp_signon($creds, is_ssl());

        if (is_wp_error($user)) {
            return redirect(Url::get_login_url($redirect_url))
                ->with('errors', [__('Invalid email or password', 'kirki-ecommerce')]);
        }

        if (! empty($redirect_url)) {
            return redirect($redirect_url);
        }

        return redirect(Url::get_account_url());
    }

    /**
     * Handle registration
     *
     * @since 1.0.0
     *
     * @param RegistrationRequest $request request.
     *
     * @return Response response.
     */
    public function handle_registration(RegistrationRequest $request)
    {
        if (is_user_logged_in()) {
            return redirect(Url::get_account_url());
        }

        if (! Utils::is_nonce_verified()) {
            return redirect(Route::site_url('register'))
                ->with('errors', [__('Invalid nonce', 'kirki-ecommerce')]);
        }

        $sanitized_input = $request->sanitized();

        $user = wp_insert_user([
            'user_login' => $sanitized_input['email'],
            'user_email' => $sanitized_input['email'],
            'user_pass'  => $sanitized_input['password'],
            'first_name' => $sanitized_input['first_name'],
            'last_name'  => $sanitized_input['last_name'],
        ]);

        if (is_wp_error($user)) {
            return redirect(Route::site_url('register'))
                ->with('errors', [$user->get_error_message()]);
        }

        return redirect(Url::get_login_url())
            ->with('success', __('Your account has been created successfully. Please Log In.', 'kirki-ecommerce'));
    }
}
