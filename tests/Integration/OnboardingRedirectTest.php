<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\KirkiEcommerce;
use Kirki\Ecommerce\App\Supports\Onboarding;
use Kirki\Ecommerce\App\Wordpress\Hooks\Actions\RedirectToOnboarding;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use RuntimeException;

class OnboardingRedirectTest extends RestTestCase
{
    /**
     * Prepare state before each test.
     *
     * Redirects are turned into exceptions so the action's `exit` is never reached.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();

        add_filter('wp_redirect', [$this, 'throw_redirect']);
    }

    /**
     * Clean up state after each test.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        remove_filter('wp_redirect', [$this, 'throw_redirect']);
        unset($_GET['activate-multi']);
        delete_transient(Onboarding::ACTIVATION_REDIRECT_TRANSIENT);

        parent::tearDown();
    }

    /**
     * A single activation redirects to the wizard on the next admin request.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_single_activation_redirects_to_onboarding(): void
    {
        KirkiEcommerce::handle_activation(false);

        $this->assertSame(Onboarding::get_url(), $this->run_redirect_action());
    }

    /**
     * The redirect fires only once per activation.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_redirect_is_one_shot(): void
    {
        KirkiEcommerce::handle_activation(false);
        $this->run_redirect_action();

        $this->assertNull($this->run_redirect_action());
    }

    /**
     * Bulk activation does not redirect and leaves no redirect pending.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_activation_does_not_redirect(): void
    {
        KirkiEcommerce::handle_activation(false);
        $_GET['activate-multi'] = 'true';

        $this->assertNull($this->run_redirect_action());
        $this->assertFalse(get_transient(Onboarding::ACTIVATION_REDIRECT_TRANSIENT));
    }

    /**
     * Network-wide activation queues no redirect.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_network_activation_does_not_redirect(): void
    {
        KirkiEcommerce::handle_activation(true);

        $this->assertFalse(get_transient(Onboarding::ACTIVATION_REDIRECT_TRANSIENT));
    }

    /**
     * Re-activating an onboarded store queues no redirect.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_activation_after_onboarding_does_not_redirect(): void
    {
        Onboarding::mark_completed();

        KirkiEcommerce::handle_activation(false);

        $this->assertFalse(get_transient(Onboarding::ACTIVATION_REDIRECT_TRANSIENT));
    }

    /**
     * Users who cannot manage the store are not redirected.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_user_without_capability_is_not_redirected(): void
    {
        KirkiEcommerce::handle_activation(false);
        wp_set_current_user(static::factory()->user->create(['role' => 'editor']));

        $this->assertNull($this->run_redirect_action());
    }

    /**
     * Throw the redirect location instead of letting the redirect happen.
     *
     * @param string $location Redirect location.
     *
     * @return string
     * @throws RuntimeException Always, carrying the location.
     * @since 1.0.0
     */
    public function throw_redirect($location)
    {
        throw new RuntimeException($location);
    }

    /**
     * Run the redirect action and capture where it redirected to.
     *
     * @return string|null The redirect location, or null when no redirect happened.
     * @since 1.0.0
     */
    protected function run_redirect_action()
    {
        try {
            (new RedirectToOnboarding())->handle();
        } catch (RuntimeException $redirect) {
            return $redirect->getMessage();
        }

        return null;
    }
}
