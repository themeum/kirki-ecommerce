<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Resources\Site\Order\OrderListResource;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;

defined('ABSPATH') || exit;

/**
 * Tracks the Home page's first-sale card and its one-time celebration.
 *
 * The first order is the oldest order that is not archived. Each admin is
 * celebrated once and can close the card for themself. A click on "Fulfill
 * order" marks the store as done, which hides the card for every admin and
 * clears every close record.
 *
 * @since 1.0.2
 */
class FirstSaleService
{
    /**
     * Get the card state for a user.
     *
     * @since 1.0.2
     *
     * @param int $user_id
     * @return array{is_visible: bool, should_celebrate: bool, order: array<string, mixed>|null}
     */
    public function get_state(int $user_id)
    {
        $state = $this->read();
        $order = $this->first_order();
        $is_visible = $order !== null
            && $state['done_at'] === null
            && !isset($state['dismissed'][$user_id]);

        return [
            'is_visible' => $is_visible,
            'should_celebrate' => $is_visible && !isset($state['celebrated'][$user_id]),
            'order' => $order === null ? null : $this->order_summary($order),
        ];
    }

    /**
     * Record that a user was celebrated, keeping the first time.
     *
     * @since 1.0.2
     *
     * @param int $user_id
     * @return array{is_visible: bool, should_celebrate: bool, order: array<string, mixed>|null}
     */
    public function celebrate(int $user_id)
    {
        $state = $this->read();

        if (!isset($state['celebrated'][$user_id])) {
            $state['celebrated'][$user_id] = time();
            $this->write($state);
        }

        return $this->get_state($user_id);
    }

    /**
     * Record that a user closed the card, keeping the first time.
     *
     * @since 1.0.2
     *
     * @param int $user_id
     * @return array{is_visible: bool, should_celebrate: bool, order: array<string, mixed>|null}
     */
    public function dismiss(int $user_id)
    {
        $state = $this->read();

        if (!isset($state['dismissed'][$user_id])) {
            $state['dismissed'][$user_id] = time();
            $this->write($state);
        }

        return $this->get_state($user_id);
    }

    /**
     * Mark the store as done and remove every close record.
     *
     * @since 1.0.2
     *
     * @param int $user_id The user who clicked "Fulfill order".
     * @return array{is_visible: bool, should_celebrate: bool, order: array<string, mixed>|null}
     */
    public function fulfill(int $user_id)
    {
        $state = $this->read();
        $state['done_at'] = $state['done_at'] ?? time();
        $state['dismissed'] = [];
        $this->write($state);

        return $this->get_state($user_id);
    }

    /**
     * Get the store's oldest order that is not archived.
     *
     * @since 1.0.2
     *
     * @return Order|null
     */
    protected function first_order()
    {
        return Order::query()
            ->with('items')
            ->where_null('archived_at')
            ->order_by('created_at', 'asc')
            ->order_by('id', 'asc')
            ->first();
    }

    /**
     * Get the order fields the card shows.
     *
     * @since 1.0.2
     *
     * @param Order $order
     * @return array<string, mixed> The id, order number, customer name and total money object.
     */
    protected function order_summary(Order $order)
    {
        $resource = OrderListResource::make($order);

        return [
            'id' => $resource['id'],
            'order_number' => $resource['order_number'],
            'customer_name' => $resource['customer_name'],
            'invoiced_total_money_object' => $resource['invoiced_total_money_object'],
        ];
    }

    /**
     * Read the stored state, filling in what is missing.
     *
     * @since 1.0.2
     *
     * @return array{done_at: int|null, celebrated: array<int, int>, dismissed: array<int, int>}
     */
    protected function read()
    {
        $state = Option::get(OptionKeys::FIRST_SALE);
        $state = is_array($state) ? $state : [];

        return [
            'done_at' => isset($state['done_at']) ? (int) $state['done_at'] : null,
            'celebrated' => is_array($state['celebrated'] ?? null) ? $state['celebrated'] : [],
            'dismissed' => is_array($state['dismissed'] ?? null) ? $state['dismissed'] : [],
        ];
    }

    /**
     * Store the state without autoloading it.
     *
     * @since 1.0.2
     *
     * @param array{done_at: int|null, celebrated: array<int, int>, dismissed: array<int, int>} $state
     * @return void
     */
    protected function write(array $state)
    {
        Option::set(OptionKeys::FIRST_SALE, $state, false);
    }
}
