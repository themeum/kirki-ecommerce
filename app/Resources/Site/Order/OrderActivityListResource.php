<?php

namespace Kirki\Ecommerce\App\Resources\Site\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Resources\Order\OrderActivityResource as BaseOrderActivityResource;

/**
 * API resource for an entry in the customer activity timeline endpoint.
 *
 * @since 1.0.0
 */
class OrderActivityListResource extends BaseOrderActivityResource
{
    /**
     * Convert the order activity resource to an array.
     *
     * Same fields as the admin resource, without the admin-only notify_customer flag.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The activity data.
     */
    public function to_array()
    {
        $data = parent::to_array();

        unset($data['notify_customer']);

        return $data;
    }
}
