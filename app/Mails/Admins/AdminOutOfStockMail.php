<?php

namespace Kirki\Ecommerce\App\Mails\Admins;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Mails\Concerns\DescribesStockAlertVariants;
use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Models\Variant;

/**
 * Email sent to the store admin when variants go out of stock.
 *
 * @since 1.0.0
 */
class AdminOutOfStockMail extends Mailer
{
    use DescribesStockAlertVariants;

    /**
     * Create the mail for the given variants.
     *
     * @since 1.0.0
     *
     * @param Variant ...$variants Variants that ran out of stock.
     */
    public function __construct(Variant ...$variants)
    {
        $this->variants = $variants;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function option_key()
    {
        return 'admin_emails.inventory_notifications.out_of_stock';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function with()
    {
        return $this->get_stock_alert_variables();
    }
}
