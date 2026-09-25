<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\Framework\Http\Superglobals;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

use function Kirki\Ecommerce\Framework\throw_if;

defined('ABSPATH') || exit;

/**
 * Signs PayFast checkout requests and verifies its ITN callbacks.
 */
class PayfastClient
{
    protected string $pass_phrase;
    protected bool $sandbox;

    /**
     * @param string $pass_phrase The passphrase PayFast signatures are salted with.
     * @param bool $sandbox True when the sandbox environment should be used.
     */
    public function __construct(string $pass_phrase, bool $sandbox = false)
    {
        $this->pass_phrase = $pass_phrase;
        $this->sandbox = $sandbox;
    }

    /**
     * Build an auto-submitting form that POSTs the order to PayFast's checkout.
     *
     * @param array<string, string|int> $fields The checkout fields to post.
     * @return string
     */
    public function render_checkout_form(array $fields): string
    {
        $form_url = $this->sandbox ? PayfastConstant::SANDBOX_FORM_URL : PayfastConstant::PRODUCTION_FORM_URL;
        $signature = $this->sign($fields);

        ob_start();
?>
        <form method="POST" id="payfast-form" action="<?php echo esc_url($form_url); ?>">
            <?php foreach ($fields as $name => $value) : ?>
                <input type="hidden" name="<?php echo esc_attr($name); ?>" value="<?php echo esc_attr($value); ?>" />
            <?php endforeach; ?>
            <input type="hidden" name="signature" value="<?php echo esc_attr($signature); ?>" />
        </form>
        <script>
            document.getElementById('payfast-form').submit();
        </script>
<?php
        return ob_get_clean();
    }

    /**
     * Verify an ITN payload, stopping at the first check that fails.
     *
     * Ordered cheapest first: the local checks run before the DNS lookups and
     * the round trip to PayFast.
     *
     * @param array<string, string> $payload The ITN payload.
     * @return bool
     * @throws Exception If PayFast's validation endpoint is unreachable.
     */
    public function is_verified(array $payload): bool
    {
        return $this->verify_signature($payload)
            && $this->verify_amount($payload)
            && $this->verify_source_ip()
            && $this->verify_with_payfast($payload);
    }

    /**
     * Sign a set of fields with the merchant passphrase.
     *
     * @param array<string, string|int> $fields
     * @return string
     */
    protected function sign(array $fields): string
    {
        return md5($this->build_signature_string($fields));
    }

    /**
     * Build the query string a PayFast signature is calculated over.
     *
     * The passphrase is appended last, as PayFast's signature spec requires,
     * and any signature already present is excluded.
     *
     * @param array<string, string|int> $fields
     * @return string
     */
    protected function build_signature_string(array $fields): string
    {
        unset($fields['signature']);

        $fields['passphrase'] = $this->pass_phrase;

        return http_build_query($fields);
    }

    /**
     * Check the ITN's signature against one calculated locally.
     *
     * @param array<string, string> $payload
     * @return bool
     */
    protected function verify_signature(array $payload): bool
    {
        $given_signature = $payload['signature'] ?? '';

        if (empty($given_signature)) {
            return false;
        }

        return hash_equals($this->sign($payload), $given_signature);
    }

    /**
     * Check the ITN's gross amount against the total recorded at checkout.
     *
     * @param array<string, string> $payload
     * @return bool
     */
    protected function verify_amount(array $payload): bool
    {
        $recorded = json_decode($payload['custom_str1'] ?? '');
        $expected_amount = (float) ($recorded->total_amount ?? 0);
        $paid_amount = (float) ($payload['amount_gross'] ?? 0);

        return abs($expected_amount - $paid_amount) <= PayfastConstant::AMOUNT_TOLERANCE;
    }

    /**
     * Check that the ITN came from one of PayFast's own servers.
     *
     * @return bool
     */
    protected function verify_source_ip(): bool
    {
        $valid_ips = array();

        foreach (PayfastConstant::NOTIFICATION_HOSTS as $pf_hostname) {
            $ips = gethostbynamel($pf_hostname);

            if (false !== $ips) {
                $valid_ips = array_merge($valid_ips, $ips);
            }
        }

        // Remove duplicates.
        $valid_ips = array_unique($valid_ips);

        // Adds support for X_Forwarded_For.
        $x_forwarded_http_header = Superglobals::server('HTTP_X_FORWARDED_FOR', '');
        $source_ip = Superglobals::server('REMOTE_ADDR', '');
        if (!empty($x_forwarded_http_header)) {
            $x_forwarded_http_header = trim(current(preg_split('/[,:]/', Sanitizer::apply_rule(wp_unslash($x_forwarded_http_header), Sanitizer::TEXT))));
            $source_ip = rest_is_ip_address($x_forwarded_http_header) ? rest_is_ip_address($x_forwarded_http_header) : $source_ip;
        }

        return in_array($source_ip, $valid_ips, true);
    }

    /**
     * Ask PayFast to confirm the ITN it just sent.
     *
     * @param array<string, string> $payload
     * @return bool
     * @throws Exception If the validation request fails.
     */
    protected function verify_with_payfast(array $payload): bool
    {
        $url = $this->sandbox ? PayfastConstant::SANDBOX_VALIDATE_URL : PayfastConstant::PRODUCTION_VALIDATE_URL;
        $response = Http::as_form()->post($url, $this->build_signature_string($payload));

        throw_if($response->failed(), $response->body());

        return PayfastConstant::VALID_RESPONSE === trim($response->body());
    }
}
