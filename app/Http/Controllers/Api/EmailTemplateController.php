<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Constants\EmailDefaultTemplate;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Http\Requests\Settings\SendTestEmailRequest;
use Kirki\Ecommerce\App\Services\EmailService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Http\Request;

use function Kirki\Ecommerce\Framework\json_decoded_data;
use function Kirki\Ecommerce\Framework\resource_path;
use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\template_engine;
use function Kirki\Ecommerce\Framework\user;
use function Kirki\Ecommerce\Framework\view;

class EmailTemplateController
{
    public function preview(Request $request)
    {
        $branding = Settings::get('email')->get('default_template') ?? [];
        $data = $this->build_view_data($branding);

        template_engine()->share('data', $data);

        return response()->json([
            'data' => ['html' => view('emails.order-confirmation')->layout('emails.layouts.email-layout')->__toString()],
            'message' => __('Template preview rendered successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function send_test_mail(SendTestEmailRequest $request)
    {
        $branding = $request->all();
        $to = user()->get_email();

        if (empty($to)) {
            return response()->json([
                'message' => __('Could not determine your account email address.', 'kirki-ecommerce'),
            ], 422);
        }

        $subject = sprintf(
            /* translators: %s: site name */
            __('[%s] Test order confirmation email', 'kirki-ecommerce'),
            get_bloginfo('name')
        );

        $sent = (new EmailService())->send_html_email(
            $to,
            $subject,
            'emails.order-confirmation',
            $this->build_view_data($branding)
        );

        if (!$sent) {
            return response()->json([
                'message' => __('The test email could not be sent.', 'kirki-ecommerce'),
            ], 500);
        }

        return response()->json([
            'message' => __('Test email sent successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Build the order-confirmation view data from branding settings and the
     * hardcoded sample order fixture, pre-formatting every money field the
     * same way OrderResource does so the views stay free of currency math.
     *
     * @return array
     */
    protected function build_view_data(array $branding)
    {
        $sample = json_decoded_data(resource_path('data/emails/order-confirmation-sample.json')) ?? [];
        $currency_code = $sample['currency_code'] ?? '';
        $colors = $this->merge_colors($branding['colors'] ?? []);

        $items = array_map(function ($item) use ($currency_code) {
            $item['invoiced_price_display'] = Money::prepare_amount_object_from_minor($item['invoiced_price'], $currency_code)->display;
            $item['invoiced_total_display'] = Money::prepare_amount_object_from_minor($item['invoiced_total'], $currency_code)->display;

            return $item;
        }, $sample['items'] ?? []);

        $totals = $sample['totals'] ?? [];
        $totals['invoiced_total_before_shipping'] = ($totals['invoiced_subtotal'] ?? 0) - ($totals['invoiced_discount'] ?? 0);

        foreach (['invoiced_subtotal', 'invoiced_discount', 'invoiced_total_before_shipping', 'invoiced_shipping', 'invoiced_tax', 'invoiced_total'] as $key) {
            if (isset($totals[$key])) {
                $totals[$key . '_display'] = Money::prepare_amount_object_from_minor($totals[$key], $currency_code)->display;
            }
        }

        if (isset($totals['base_tax'])) {
            $totals['base_tax_display'] = Money::prepare_amount_object_from_minor($totals['base_tax'])->display;
        }

        $logo_id = $branding['logo'] ?? null;

        return array_merge($sample, [
            'items' => $items,
            'totals' => $totals,
            'logo_url' => $logo_id ? (wp_get_attachment_image_url($logo_id, 'full') ?: '') : '',
            'height' => $branding['height'] ?? EmailDefaultTemplate::HEIGHT,
            'position' => $branding['position'] ?? EmailDefaultTemplate::POSITION,
            'colors' => $colors,
            'additional_description' => $branding['additional_description'] ?? '',
            'footer' => $branding['footer'] ?? '',
        ]);
    }

    /**
     * @return array
     */
    protected function default_colors()
    {
        return [
            'background' => [
                'email_body' => EmailDefaultTemplate::BACKGROUND_COLOR_EMAIL_BODY,
                'outer_area' => EmailDefaultTemplate::BACKGROUND_COLOR_OUTER_AREA,
                'info_cards' => EmailDefaultTemplate::BACKGROUND_COLOR_INFO_CARDS,
                'divider' => EmailDefaultTemplate::BACKGROUND_COLOR_DIVIDER,
            ],
            'typography' => [
                'headings' => EmailDefaultTemplate::TYPOGRAPHY_COLOR_HEADINGS,
                'body' => EmailDefaultTemplate::TYPOGRAPHY_COLOR_BODY,
                'muted' => EmailDefaultTemplate::TYPOGRAPHY_COLOR_MUTED,
                'link' => EmailDefaultTemplate::TYPOGRAPHY_COLOR_LINK,
                'exceptions' => EmailDefaultTemplate::TYPOGRAPHY_COLOR_EXCEPTIONS,
            ],
            'button' => [
                'background' => EmailDefaultTemplate::BUTTON_COLOR_BACKGROUND,
                'text' => EmailDefaultTemplate::BUTTON_COLOR_TEXT,
            ],
        ];
    }

    /**
     * @param array $branding_colors
     *
     * @return array
     */
    protected function merge_colors(array $branding_colors)
    {
        $colors = $this->default_colors();

        foreach (['background', 'typography', 'button'] as $group) {
            $colors[$group] = array_merge($colors[$group], array_filter((array) ($branding_colors[$group] ?? [])));
        }

        return $colors;
    }
}
