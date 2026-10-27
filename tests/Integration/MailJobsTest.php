<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Jobs\SendUserMailJob;
use Kirki\Ecommerce\App\Jobs\SendInventoryMailJob;
use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Wordpress\User;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use RuntimeException;

class MailJobsTest extends RestTestCase
{
    use CreatesTestProducts;

    /**
     * Reset the mailer doubles before each test.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();

        FakeUserMail::reset();
        FakeVariantMail::reset();
    }

    /**
     * A queued user mail holds only ids and never a password reset key.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_user_mail_job_does_not_store_a_reset_key(): void
    {
        $user_id = self::factory()->user->create(['user_email' => 'shopper@example.com']);

        $payload = serialize(new SendUserMailJob($user_id, FakeUserMail::class, 'shopper@example.com'));

        $this->assertStringNotContainsString('action=rp', $payload);
        $this->assertEmpty(get_userdata($user_id)->user_activation_key);
    }

    /**
     * The user mail job generates a fresh password link when it runs.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_user_mail_job_sends_a_fresh_password_link(): void
    {
        $user_id = self::factory()->user->create(['user_email' => 'shopper@example.com']);

        (new SendUserMailJob($user_id, FakeUserMail::class, 'shopper@example.com'))->handle();

        $this->assertSame(['shopper@example.com'], FakeUserMail::$recipients);
        $this->assertStringContainsString('action=rp', FakeUserMail::$last_link);
        $this->assertStringContainsString('login=' . rawurlencode(get_userdata($user_id)->user_login), FakeUserMail::$last_link);
    }

    /**
     * A disabled user mail is skipped without generating a reset key.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_user_mail_job_skips_disabled_mail(): void
    {
        FakeUserMail::$enabled = false;
        $user_id = self::factory()->user->create(['user_email' => 'shopper@example.com']);

        (new SendUserMailJob($user_id, FakeUserMail::class, 'shopper@example.com'))->handle();

        $this->assertSame([], FakeUserMail::$recipients);
        $this->assertEmpty(get_userdata($user_id)->user_activation_key);
    }

    /**
     * A user mail for a deleted user is skipped.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_user_mail_job_skips_missing_user(): void
    {
        $user_id = self::factory()->user->create();
        wp_delete_user($user_id);

        (new SendUserMailJob($user_id, FakeUserMail::class, 'shopper@example.com'))->handle();

        $this->assertSame([], FakeUserMail::$recipients);
    }

    /**
     * A failed user mail send throws so the queue retries the job.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_user_mail_job_throws_when_sending_fails(): void
    {
        FakeUserMail::$sent = false;
        $user_id = self::factory()->user->create(['user_email' => 'shopper@example.com']);

        $this->expectException(RuntimeException::class);

        (new SendUserMailJob($user_id, FakeUserMail::class, 'shopper@example.com'))->handle();
    }

    /**
     * The inventory mail job sends to its recipient.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_inventory_mail_job_sends_mail(): void
    {
        (new SendInventoryMailJob([$this->variant()->id], FakeVariantMail::class, 'admin@example.com'))->handle();

        $this->assertSame(['admin@example.com'], FakeVariantMail::$recipients);
    }

    /**
     * A disabled inventory mail is skipped.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_inventory_mail_job_skips_disabled_mail(): void
    {
        FakeVariantMail::$enabled = false;

        (new SendInventoryMailJob([$this->variant()->id], FakeVariantMail::class, 'admin@example.com'))->handle();

        $this->assertSame([], FakeVariantMail::$recipients);
    }

    /**
     * A failed inventory mail send throws so the queue retries the job.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_inventory_mail_job_throws_when_sending_fails(): void
    {
        FakeVariantMail::$sent = false;

        $this->expectException(RuntimeException::class);

        (new SendInventoryMailJob([$this->variant()->id], FakeVariantMail::class, 'admin@example.com'))->handle();
    }

    /**
     * An inventory mail job whose variants are all gone sends nothing.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_inventory_mail_job_skips_missing_variants(): void
    {
        (new SendInventoryMailJob([PHP_INT_MAX], FakeVariantMail::class, 'admin@example.com'))->handle();

        $this->assertSame([], FakeVariantMail::$recipients);
    }

    /**
     * Create a product and return its default variant.
     *
     * @return Variant
     * @since 1.0.0
     */
    protected function variant(): Variant
    {
        return Variant::find($this->default_variant_id($this->create_product()));
    }
}

/**
 * Account mailer double that records its recipients and password link.
 */
class FakeUserMail extends Mailer
{
    /** @var bool */
    public static $enabled = true;

    /** @var bool */
    public static $sent = true;

    /** @var string[] */
    public static $recipients = [];

    /** @var string */
    public static $last_link = '';

    /** @var string */
    protected $link;

    /**
     * Accept the user and link like a real account mail does.
     *
     * @param User   $user User the email is sent to.
     * @param string $link Password link.
     */
    public function __construct(User $user, string $link = '')
    {
        $this->link = $link;
    }

    /**
     * Restore the default state.
     *
     * @return void
     */
    public static function reset()
    {
        static::$enabled = true;
        static::$sent = true;
        static::$recipients = [];
        static::$last_link = '';
    }

    /**
     * @inheritDoc
     */
    public function option_key()
    {
        return 'test';
    }

    /**
     * @inheritDoc
     */
    public function with()
    {
        return [];
    }

    /**
     * @inheritDoc
     */
    public function is_enabled()
    {
        return static::$enabled;
    }

    /**
     * Record the send and report the configured result.
     *
     * @param string $to Recipient.
     * @return bool
     */
    public function send(string $to)
    {
        if (static::$sent) {
            static::$recipients[] = $to;
            static::$last_link = $this->link;
        }

        return static::$sent;
    }
}

/**
 * Inventory mailer double that records its recipients.
 */
class FakeVariantMail extends Mailer
{
    /** @var bool */
    public static $enabled = true;

    /** @var bool */
    public static $sent = true;

    /** @var string[] */
    public static $recipients = [];

    /**
     * Accept the variants like a real inventory mail does.
     *
     * @param Variant ...$variants The variants.
     */
    public function __construct(Variant ...$variants) {}

    /**
     * Restore the default state.
     *
     * @return void
     */
    public static function reset()
    {
        static::$enabled = true;
        static::$sent = true;
        static::$recipients = [];
    }

    /**
     * @inheritDoc
     */
    public function option_key()
    {
        return 'test';
    }

    /**
     * @inheritDoc
     */
    public function with()
    {
        return [];
    }

    /**
     * @inheritDoc
     */
    public function is_enabled()
    {
        return static::$enabled;
    }

    /**
     * Record the send and report the configured result.
     *
     * @param string $to Recipient.
     * @return bool
     */
    public function send(string $to)
    {
        if (static::$sent) {
            static::$recipients[] = $to;
        }

        return static::$sent;
    }
}
