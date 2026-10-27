<?php

namespace Kirki\Ecommerce\App\Mails\Admins;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Mails\Concerns\DescribesStockAlertVariants;
use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Models\Variant;

/**
 * Email sent to the store admin when variants' stock runs low.
 *
 * @since 1.0.0
 */
class AdminLowStockMail extends Mailer
{
    use DescribesStockAlertVariants;

    /**
     * Create the mail for the given variants.
     *
     * @since 1.0.0
     *
     * @param Variant ...$variants Variants whose stock is low.
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
        return 'admin_emails.inventory_notifications.low_stock';
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
