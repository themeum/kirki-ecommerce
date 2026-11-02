<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Jobs\SendUserMailJob;
use Kirki\Ecommerce\App\Mails\Customers\CustomerNewAccountMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerResetPasswordMail;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Queue\QueueFake;
use Kirki\Ecommerce\Framework\Queue\QueueManager;
use Kirki\Ecommerce\Framework\Supports\Facades\Queue;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class CustomerAccountEmailsTest extends RestTestCase
{
    /**
     * The queue fake recording dispatched jobs.
     *
     * @var QueueFake
     */
    protected $queue;

    /**
     * The WordPress version to restore after a test that fakes an older one.
     *
     * @var string
     */
    protected $original_wp_version;

    /**
     * Fake the queue and the mailer before each test.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();

        global $wp_version;
        $this->original_wp_version = $wp_version;

        $this->queue = Queue::fake();
        reset_phpmailer_instance();
    }

    /**
     * Restore the WordPress version and drop the faked queue manager.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        global $wp_version;
        $wp_version = $this->original_wp_version;

        static::forget_singleton(QueueManager::class);

        parent::tearDown();
    }

    /**
     * A customer's reset request queues the store's email instead of the WordPress one.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_customer_reset_request_queues_store_email_and_stops_core_email(): void
    {
        $user = $this->create_user('subscriber');

        $this->assertTrue(retrieve_password($user->user_login));

        $jobs = $this->pushed_user_mail(CustomerResetPasswordMail::class);
        $this->assertCount(1, $jobs);
        $this->assertSame($user->ID, $jobs[0]->user_id);
        $this->assertSame($user->user_email, $jobs[0]->email);
        $this->assertFalse(tests_retrieve_phpmailer_instance()->get_sent());
    }

    /**
     * An administrator's reset request keeps the WordPress email.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_administrator_reset_request_keeps_core_email(): void
    {
        $user = $this->create_user('administrator');

        retrieve_password($user->user_login);

        $this->assertSame([], $this->pushed_user_mail(CustomerResetPasswordMail::class));
        $this->assertSame($user->user_email, tests_retrieve_phpmailer_instance()->get_recipient('to')->address);
    }

    /**
     * A disabled reset-password template leaves the WordPress email in place.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_disabled_reset_template_keeps_core_email(): void
    {
        $this->disable('reset_password');
        $user = $this->create_user('subscriber');

        retrieve_password($user->user_login);

        $this->assertSame([], $this->pushed_user_mail(CustomerResetPasswordMail::class));
        $this->assertSame($user->user_email, tests_retrieve_phpmailer_instance()->get_recipient('to')->address);
    }

    /**
     * WordPress older than 6.0 cannot stop its reset email, so the store does not send one.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_older_wordpress_keeps_core_reset_email(): void
    {
        global $wp_version;
        $wp_version = '5.9';
        $user = $this->create_user('subscriber');

        $this->assertTrue(apply_filters(WPHookNames::SEND_RETRIEVE_PASSWORD_EMAIL, true, $user->user_login, $user));
        $this->assertSame([], $this->pushed_user_mail(CustomerResetPasswordMail::class));
    }

    /**
     * Creating a customer account queues the new-account email.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_new_customer_account_queues_new_account_email(): void
    {
        $user = $this->create_user('subscriber');

        $jobs = $this->pushed_user_mail(CustomerNewAccountMail::class);
        $this->assertCount(1, $jobs);
        $this->assertSame($user->ID, $jobs[0]->user_id);
        $this->assertSame($user->user_email, $jobs[0]->email);
    }

    /**
     * The delivered new-account email carries a set-password link WordPress accepts.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_new_account_email_carries_a_working_set_password_link(): void
    {
        $user = $this->create_user('subscriber');

        $this->pushed_user_mail(CustomerNewAccountMail::class)[0]->handle();

        $body = html_entity_decode(tests_retrieve_phpmailer_instance()->get_sent()->body);
        $this->assertSame(1, preg_match('/action=rp&key=([^&"]+)&login=([^"&\s]+)/', $body, $matches));
        $this->assertSame($user->user_login, rawurldecode($matches[2]));
        $this->assertInstanceOf(\WP_User::class, check_password_reset_key($matches[1], $user->user_login));
    }

    /**
     * An admin creating a customer with a WordPress account queues the new-account email.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_admin_created_customer_queues_new_account_email(): void
    {
        $email = 'customer-' . wp_generate_password(8, false) . '@example.com';

        $this->assert_api_success($this->request('POST', 'customers', [
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => $email,
            'create_wordpress_user' => true,
        ]), 201);

        $jobs = $this->pushed_user_mail(CustomerNewAccountMail::class);
        $this->assertCount(1, $jobs);
        $this->assertSame($email, $jobs[0]->email);
    }

    /**
     * An admin-created customer linked to an existing WordPress user gets no new-account email.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_customer_linked_to_existing_user_queues_nothing(): void
    {
        $user = $this->create_user('subscriber');
        $this->queue->clear();

        $payload = $this->assert_api_success($this->request('POST', 'customers', [
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => $user->user_email,
            'create_wordpress_user' => true,
        ]), 201);

        $this->assertSame($user->ID, (int) $payload['data']['user_id']);
        $this->assertSame([], $this->pushed_user_mail(CustomerNewAccountMail::class));
    }

    /**
     * An administrator account gets no store new-account email.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_administrator_account_queues_nothing(): void
    {
        $this->create_user('administrator');

        $this->assertSame([], $this->pushed_user_mail(CustomerNewAccountMail::class));
    }

    /**
     * The WordPress new-user email is stopped only for customers the store emails itself.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_core_new_user_email_is_suppressed_only_for_customers(): void
    {
        $customer = $this->create_user('subscriber');
        $administrator = $this->create_user('administrator');

        $this->assertFalse(apply_filters(WPHookNames::WP_SEND_NEW_USER_NOTIFICATION_TO_USER, true, $customer));
        $this->assertTrue(apply_filters(WPHookNames::WP_SEND_NEW_USER_NOTIFICATION_TO_USER, true, $administrator));

        wp_new_user_notification($customer->ID, null, 'user');

        $this->assertFalse(tests_retrieve_phpmailer_instance()->get_sent());
    }

    /**
     * A disabled new-account template leaves WordPress's new-user behaviour unchanged.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_disabled_new_account_template_keeps_core_behaviour(): void
    {
        $this->disable('new_account');
        $customer = $this->create_user('subscriber');

        $this->assertSame([], $this->pushed_user_mail(CustomerNewAccountMail::class));
        $this->assertTrue(apply_filters(WPHookNames::WP_SEND_NEW_USER_NOTIFICATION_TO_USER, true, $customer));
    }

    /**
     * WordPress older than 6.1 cannot stop its new-user email, so the store does not send one.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_older_wordpress_keeps_core_new_user_behaviour(): void
    {
        global $wp_version;
        $wp_version = '6.0';
        $customer = $this->create_user('subscriber');

        $this->assertSame([], $this->pushed_user_mail(CustomerNewAccountMail::class));
        $this->assertTrue(apply_filters(WPHookNames::WP_SEND_NEW_USER_NOTIFICATION_TO_USER, true, $customer));
    }

    /**
     * Create a WordPress user with the given role.
     *
     * @param string $role WordPress role.
     * @return \WP_User
     * @since 1.0.0
     */
    protected function create_user(string $role): \WP_User
    {
        return get_userdata(self::factory()->user->create(['role' => $role]));
    }

    /**
     * Disable one customer user notification in the email settings.
     *
     * @param string $key Notification key, such as reset_password.
     * @return void
     * @since 1.0.0
     */
    protected function disable(string $key): void
    {
        $settings = Settings::get('email');
        $values = $settings->to_array();
        $values['customer_emails']['user_notifications'][$key]['is_enabled'] = false;

        $settings->set($values, false);
    }

    /**
     * Get the queued user mail jobs for one mailer class.
     *
     * @param string $mailer_class The Mailer subclass.
     * @return SendUserMailJob[]
     * @since 1.0.0
     */
    protected function pushed_user_mail(string $mailer_class): array
    {
        return $this->queue->pushed(SendUserMailJob::class, fn(SendUserMailJob $job) => $job->mailer_class === $mailer_class);
    }
}
