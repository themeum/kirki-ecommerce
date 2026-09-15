<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Hooks\Filters\ValidateLoginConsents;
use Kirki\Ecommerce\App\Hooks\Filters\ValidateRegisterConsents;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use WP_Error;

class LegalConsentHooksTest extends RestTestCase
{
    public function tear_down(): void
    {
        unset($_POST['log'], $_POST['kecom_consents']);

        parent::tear_down();
    }

    protected function seed_consent(string $location, string $method = 'mandatory_checkbox'): void
    {
        Settings::update('legal.consents', [
            [
                'id' => 'consent-1',
                'title' => 'Terms',
                'locations' => [$location],
                'message' => 'You agree to our terms.',
                'method' => $method,
                'is_enabled' => true,
            ],
        ]);
    }

    protected function make_user(): \WP_User
    {
        return new \WP_User(static::factory()->user->create());
    }

    /**
     * The authenticate filter runs after the credential check.
     *
     * At the default priority a wrong password would be reported as a consent
     * failure instead of a bad password.
     *
     * @return void
     */
    public function test_login_filter_runs_after_the_credential_check(): void
    {
        $this->assertSame(30, (new ValidateLoginConsents())->get_priority());
    }

    /**
     * An existing credential error is passed through untouched.
     *
     * @return void
     */
    public function test_login_filter_preserves_a_credential_error(): void
    {
        $this->seed_consent('login');

        $_POST['log'] = 'someone';

        $credential_error = new WP_Error('incorrect_password', 'Wrong password.');
        $result = (new ValidateLoginConsents())->handle($credential_error, '', '');

        $this->assertSame($credential_error, $result);
        $this->assertSame('incorrect_password', $result->get_error_code());
    }

    /**
     * Authentication that did not come from the login form is untouched.
     *
     * Without this guard the filter also fires for REST application
     * passwords, XML-RPC and programmatic wp_signon() calls.
     *
     * @return void
     */
    public function test_login_filter_ignores_non_form_authentication(): void
    {
        $this->seed_consent('login');

        $user = $this->make_user();
        $result = (new ValidateLoginConsents())->handle($user, '', '');

        $this->assertSame($user, $result);
    }

    /**
     * A form sign-in without the mandatory consent is rejected.
     *
     * @return void
     */
    public function test_login_filter_blocks_an_unaccepted_mandatory_consent(): void
    {
        $this->seed_consent('login');

        $_POST['log'] = 'someone';

        $result = (new ValidateLoginConsents())->handle($this->make_user(), '', '');

        $this->assertInstanceOf(WP_Error::class, $result);
        $this->assertSame('kecom_consent_required', $result->get_error_code());
    }

    /**
     * A form sign-in with the consent accepted proceeds.
     *
     * @return void
     */
    public function test_login_filter_allows_an_accepted_consent(): void
    {
        $this->seed_consent('login');

        $_POST['log'] = 'someone';
        $_POST['kecom_consents'] = ['consent-1'];

        $user = $this->make_user();
        $result = (new ValidateLoginConsents())->handle($user, '', '');

        $this->assertSame($user, $result);
    }

    /**
     * An optional consent never blocks a sign-in.
     *
     * @return void
     */
    public function test_login_filter_ignores_an_optional_consent(): void
    {
        $this->seed_consent('login', 'optional_checkbox');

        $_POST['log'] = 'someone';

        $user = $this->make_user();
        $result = (new ValidateLoginConsents())->handle($user, '', '');

        $this->assertSame($user, $result);
    }

    /**
     * A checkout consent does not apply at the login form.
     *
     * @return void
     */
    public function test_login_filter_ignores_a_consent_for_another_location(): void
    {
        $this->seed_consent('checkout');

        $_POST['log'] = 'someone';

        $user = $this->make_user();
        $result = (new ValidateLoginConsents())->handle($user, '', '');

        $this->assertSame($user, $result);
    }

    /**
     * Registration without the mandatory consent collects an error.
     *
     * @return void
     */
    public function test_register_filter_blocks_an_unaccepted_mandatory_consent(): void
    {
        $this->seed_consent('signup');

        $errors = (new ValidateRegisterConsents())->handle(new WP_Error(), 'someone', 'a@b.test');

        $this->assertInstanceOf(WP_Error::class, $errors);
        $this->assertContains('kecom_consent_required', $errors->get_error_codes());
    }

    /**
     * Registration with the consent accepted collects no error.
     *
     * @return void
     */
    public function test_register_filter_allows_an_accepted_consent(): void
    {
        $this->seed_consent('signup');

        $_POST['kecom_consents'] = ['consent-1'];

        $errors = (new ValidateRegisterConsents())->handle(new WP_Error(), 'someone', 'a@b.test');

        $this->assertNotContains('kecom_consent_required', $errors->get_error_codes());
    }

    /**
     * Only one aggregate error is added, matching WordPress's own style.
     *
     * @return void
     */
    public function test_register_filter_adds_a_single_aggregate_error(): void
    {
        Settings::update('legal.consents', [
            [
                'id' => 'consent-1',
                'title' => 'Terms',
                'locations' => ['signup'],
                'message' => 'Terms.',
                'method' => 'mandatory_checkbox',
                'is_enabled' => true,
            ],
            [
                'id' => 'consent-2',
                'title' => 'Privacy',
                'locations' => ['signup'],
                'message' => 'Privacy.',
                'method' => 'mandatory_checkbox',
                'is_enabled' => true,
            ],
        ]);

        $errors = (new ValidateRegisterConsents())->handle(new WP_Error(), 'someone', 'a@b.test');

        $this->assertCount(1, $errors->get_error_messages('kecom_consent_required'));
    }
}
