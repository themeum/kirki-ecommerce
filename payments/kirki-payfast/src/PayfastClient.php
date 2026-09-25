<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use InvalidArgumentException;
use Kirki\Ecommerce\Framework\Http\Superglobals;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

use function Kirki\Ecommerce\Framework\throw_if;

defined('ABSPATH') || exit;

/**
 * HTTP client for the PayMongo Payments API.
 */
class PayfastClient
{
    protected string $merchant_id;
    protected string $merchant_key;
    protected string $pass_phrase;
    protected bool $sandbox;

    /**
     * @param string $merchant_id PayMongo API secret key, used as the HTTP Basic Auth username.
     * @param string $merchant_key PayMongo webhook signing secret.
     * @param bool $sandbox True when the account is in test mode.
     */
    public function __construct(string $merchant_id, string $merchant_key, string $pass_phrase, bool $sandbox = false)
    {
        $this->merchant_id = $merchant_id;
        $this->merchant_key = $merchant_key;
        $this->pass_phrase = $pass_phrase;
        $this->sandbox = $sandbox;
    }

    public function is_verified($payload): bool
    {
        $query_string = $this->get_query_string($payload);
        $is_signature_valid = $this->verify_signature($payload, $query_string);
        $is_ip_valid = $this->verify_ip();
        $is_payment_amount_valid = $this->verify_payment_amount($payload);
        $is_server_confirmed = $this->verify_server_confirmation($query_string);

        return $is_ip_valid && $is_payment_amount_valid && $is_server_confirmed && $is_signature_valid;
    }

    public function render_checkout_form($payload)
    {
        $form_url = $this->sandbox ? PayfastConstant::SANDBOX_FORM_URL : PayfastConstant::PRODUCTION_FORM_URL;

        ob_start();
?>
        <form method="POST" id="payfast-form" action="<?php echo esc_url($form_url); ?>">
            <?php foreach ($payload as $field => $value) : ?>
                <input type="hidden" name="<?php echo $field; ?>" value="<?php echo $value; ?>" />
            <?php endforeach; ?>
            <input type="hidden" name="signature" value="<?php echo md5(http_build_query($payload)); ?>" />
        </form>
        <script>
            document.getElementById('payfast-form').submit();
        </script>
<?php
        return ob_get_clean();
    }

    protected function verify_signature($payload, $query_string)
    {
        $signature = md5($query_string);
        return $payload['signature'] === $signature;
    }

    protected function verify_ip()
    {
        $valid_ips = [];

        $valid_hosts = [
            'www.payfast.co.za',
            'sandbox.payfast.co.za',
            'w1w.payfast.co.za',
            'w2w.payfast.co.za',
        ];

        $referrer = Superglobals::server('HTTP_REFERER');
        if (!$referrer) {
            return false;
        }

        foreach ($valid_hosts as $host_name) {
            $ips = gethostbynamel($host_name);

            if ($ips && is_array($ips)) {
                array_push($valid_ips, ...$ips);
            }
        }

        // Remove duplicates
        $valid_ips   = array_unique($valid_ips);
        $referrer_ip = gethostbyname(parse_url($referrer)['host']);

        if (in_array($referrer_ip, $valid_ips, true)) {
            return true;
        }

        return false;
    }

    protected function verify_payment_amount($payload)
    {
        $order_amount = json_decode($payload['custom_str1'] ?? '');
        if (abs((float) $order_amount - (float) $payload['amount_gross']) > 0.01) {
            return false;
        }

        return true;
    }

    protected function verify_server_confirmation($query_string)
    {
        $url = $this->sandbox ? PayfastConstant::SANDBOX_SERVER_CONFIRMATION_URL : PayfastConstant::PRODUCTION_SERVER_CONFIRMATION_URL;
        $response = Http::as_form()->post($url, $query_string);

        throw_if($response->failed(), $response->body());

        return $response->body() === 'VALID';
    }

    protected function get_query_string($payload)
    {
        unset($payload['signature']);
        $payload['passphrase'] = $this->pass_phrase;

        return http_build_query($payload);
    }
}
