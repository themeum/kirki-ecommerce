<?php

namespace Kirki\Ecommerce\App\Jobs;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Jobs\Concerns\SendsMail;
use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\App\Wordpress\User;
use Kirki\Ecommerce\Framework\Contracts\ShouldQueue;
use Kirki\Ecommerce\Framework\Queue\Concerns\Queueable;
use RuntimeException;
use WP_User;

/**
 * Sends one account email, carrying a password link, to one user in the background.
 *
 * The password reset key is generated when the job runs rather than when it
 * is dispatched, so no usable key is ever stored in the jobs table. The mailer
 * receives the user and the password link as its constructor arguments.
 *
 * @since 1.0.0
 */
class SendUserMailJob implements ShouldQueue
{
    use Queueable;
    use SendsMail;

    const QUEUE = 'emails';

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    protected $tries = 3;

    /**
     * The seconds to wait before retrying a failed attempt.
     *
     * @var int
     */
    protected $backoff = 60;

    /**
     * The WordPress user ID the email is sent to.
     *
     * @var int
     */
    public $user_id;

    /**
     * The Mailer subclass that builds the email content.
     *
     * @var string
     */
    public $mailer_class;

    /**
     * The recipient email address.
     *
     * @var string
     */
    public $email;

    /**
     * Create a new job instance.
     *
     * @since 1.0.0
     *
     * @param int    $user_id      The WordPress user ID the email is sent to.
     * @param string $mailer_class The Mailer subclass that builds the email.
     * @param string $email        The recipient email address.
     */
    public function __construct(int $user_id, string $mailer_class, string $email)
    {
        $this->user_id = $user_id;
        $this->mailer_class = $mailer_class;
        $this->email = $email;

        $this->on_queue(static::QUEUE);
    }

    /**
     * Send the email with a fresh password link, unless it is disabled or the user is gone.
     *
     * @since 1.0.0
     *
     * @return void
     * @throws RuntimeException When wp_mail() fails, so the queue retries the job.
     */
    public function handle()
    {
        if (empty($this->user_id) || !$this->can_send($this->mailer_class, $this->email)) {
            return;
        }

        $user = new User($this->user_id);
        $wp_user = $user->get();

        if (!$wp_user instanceof WP_User) {
            return;
        }

        /** @var Mailer $mailer */
        $mailer = new $this->mailer_class($user);

        if (!$mailer->is_enabled()) {
            return;
        }

        $key = get_password_reset_key($wp_user);

        if (is_wp_error($key)) {
            return;
        }

        $this->deliver(new $this->mailer_class($user, Url::get_password_reset_url($wp_user, $key)), $this->email);
    }
}
