<?php

namespace Kirki\Ecommerce\App\Actions\Order;

defined('ABSPATH') || exit;

use Exception;
use Kirki\Ecommerce\App\Constants\Order\OrderAction;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\DTO\Order\PerformOrderActionDTO;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\Supports\TrackingUrl;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;

use function Kirki\Ecommerce\Framework\throw_anyway;
use function Kirki\Ecommerce\Framework\throw_exception;
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Performs an order lifecycle action such as shipping, cancelling or sending an invoice.
 *
 * @since 1.0.0
 */
class PerformOrderAction
{
    /** @var OrderService */
    protected $order_service;

    /** @var ShippingService */
    protected $shipping_service;

    /**
     * Set up the action.
     *
     * @since 1.0.0
     *
     * @param OrderService    $order_service    Order lookup service.
     * @param ShippingService $shipping_service Resolves the carriers of an order's shipping zone.
     */
    public function __construct(OrderService $order_service, ShippingService $shipping_service)
    {
        $this->order_service = $order_service;
        $this->shipping_service = $shipping_service;
    }

    /**
     * Perform a lifecycle action on an order.
     *
     * The action must be allowed for the order's current state, and runs in a transaction.
     *
     * @since 1.0.0
     *
     * @param PerformOrderActionDTO $dto Order ID, the action to perform and its parameters.
     * @return Order The order reloaded with its refunds, items and coupons.
     * @throws ValidationException When the action is not allowed for the current order state or is unknown, or when mark-as-paid names an unregistered payment provider.
     * @throws Exception When performing the action fails; the transaction is rolled back.
     */
    public function execute(PerformOrderActionDTO $dto)
    {
        DB::begin_transaction();

        try {
            // Lock first and check after, so an action another request just finished is seen by the guard.
            $this->order_service->lock_order($dto->order_id);
            $order = $this->order_service->find_order_or_fail($dto->order_id);

            $this->guard($order, $dto->action);

            switch ($dto->action) {
                case OrderAction::MARK_AS_PROCESSING:
                case OrderAction::RESUME_FULFILLMENT:
                    OrderManager::mark_as_processing($order->id);
                    break;
                case OrderAction::MARK_AS_SHIPPED:
                    OrderManager::mark_as_shipped($order->id);
                    break;
                case OrderAction::MARK_AS_DELIVERED:
                    OrderManager::mark_as_delivered($order->id);
                    break;
                case OrderAction::MARK_AS_HOLD:
                    OrderManager::mark_as_on_hold($order->id);
                    break;
                case OrderAction::CANCEL_FULFILLMENT:
                case OrderAction::CANCEL_ORDER:
                    OrderManager::mark_as_cancel($order->id, $dto->reason);
                    break;
                case OrderAction::ADD_TRACKING:
                    OrderManager::add_tracking($order->id, $this->resolve_tracking($order, $dto));
                    break;
                case OrderAction::MARK_AS_PAID:
                    throw_if(!empty($dto->payment_provider) && !Payment::get_provider($dto->payment_provider), __('Invalid payment method.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);
                    OrderManager::mark_payment_as_paid($order->id, $dto->payment_provider);
                    break;
                case OrderAction::SEND_PAYMENT_LINK:
                    OrderManager::send_payment_link($order->id);
                    break;
                case OrderAction::SEND_INVOICE:
                    OrderManager::send_invoice_email($order->id);
                    break;
                case OrderAction::RESEND_ORDER_EMAIL:
                    OrderManager::resend_order_email($order->id);
                    break;
                case OrderAction::ARCHIVE_ORDER:
                    OrderManager::mark_as_archive($order->id);
                    break;

                // @todo: refund actions are pending a dedicated refund state machine.
                // case OrderAction::INITIATE_REFUND:
                //     OrderManager::create_refund(CreateRefundPayloadDTO::from_array([
                //         'order_id' => $order->id,
                //         'amount' => $dto->amount,
                //         'reason' => $dto->reason,
                //         'created_by' => $dto->updated_by,
                //     ]));
                //     break;
                // case OrderAction::APPROVE_REFUND:
                //     OrderManager::approve_refund($order->id, $dto->refund_id, $dto->reason, $dto->updated_by);
                //     break;
                // case OrderAction::DECLINE_REFUND:
                //     OrderManager::decline_refund($order->id, $dto->refund_id, $dto->reason, $dto->updated_by);
                //     break;
                // case OrderAction::MARK_REFUND_COMPLETE:
                //     OrderManager::mark_refund_as_completed($order->id);
                //     break;

                default:
                    throw_anyway(__('No action performed.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);
            }

            DB::commit();
        } catch (Exception $error) {
            DB::rollback();
            throw $error;
        }

        return $order->fresh('refunds', 'items', 'order_coupons.order_item_coupons');
    }

    /**
     * Work out the carrier name, tracking number and tracking URL to store on an order.
     *
     * A carrier id picks an enabled carrier of the order's shipping zone and fills its URL template.
     * Without an id, a URL holding the tracking-number placeholder is filled in as an ad-hoc template,
     * and a plain http(s) URL is stored as sent.
     *
     * @since 1.0.0
     *
     * @param Order                 $order Order the tracking is for.
     * @param PerformOrderActionDTO $dto   Carrier reference or name, tracking number and URL.
     * @return array{carrier: string, tracking_number: string, tracking_url: string|null}
     * @throws ValidationException When the carrier is missing or unknown, or the URL is not an http(s) URL.
     */
    protected function resolve_tracking(Order $order, PerformOrderActionDTO $dto)
    {
        $tracking_number = trim((string) $dto->tracking_number);
        $tracking_url = trim((string) $dto->tracking_url);

        if (!empty($dto->carrier_id)) {
            $carrier = $this->shipping_service->find_carrier_for_address([
                'country' => $order->shipping_country,
                'state' => $order->shipping_state,
            ], (string) $dto->carrier_id);

            if ($carrier === null) {
                throw_exception(ValidationException::with_errors([
                    'carrier_id' => [__('This carrier is not available for the order\'s shipping zone.', 'kirki-ecommerce')],
                ]));
            }

            return [
                'carrier' => $carrier['name'],
                'tracking_number' => $tracking_number,
                'tracking_url' => TrackingUrl::resolve($carrier['tracking_url'], $tracking_number),
            ];
        }

        if (trim((string) $dto->carrier) === '') {
            throw_exception(ValidationException::with_errors([
                'carrier' => [__('The carrier field is required.', 'kirki-ecommerce')],
            ]));
        }

        if ($tracking_url !== '' && !TrackingUrl::has_allowed_scheme($tracking_url)) {
            throw_exception(ValidationException::with_errors([
                'tracking_url' => [__('The URL must start with http:// or https://.', 'kirki-ecommerce')],
            ]));
        }

        return [
            'carrier' => trim((string) $dto->carrier),
            'tracking_number' => $tracking_number,
            'tracking_url' => $tracking_url === '' ? null : TrackingUrl::resolve($tracking_url, $tracking_number),
        ];
    }

    /**
     * Reject an action that the order's current state does not allow.
     *
     * @since 1.0.0
     *
     * @param Order  $order  Order the action targets.
     * @param string $action Action to check.
     * @return void
     * @throws ValidationException When a refund is in progress or the order's status does not allow the action.
     */
    protected function guard(Order $order, string $action)
    {
        // @todo: refund-cluster order statuses are not part of OrderStatus::get_transition_matrix()
        // yet, so every action is blocked until the refund state machine is defined.
        throw_if($order->is_refund_initiated, __('This action is not available while a refund is in progress.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

        $state = OrderStatus::get_state($order->order_status);
        $allowed_actions = array_merge($state['fulfillment_actions'], $state['payment_actions'], $state['order_actions']);

        throw_if(!in_array($action, $allowed_actions, true), __('This action is not available for the order\'s current status.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);
    }

    public function get_message(PerformOrderActionDTO $dto)
    {
        switch ($dto->action) {
            case OrderAction::MARK_AS_PROCESSING:
                return __('Order marked as processing.', 'kirki-ecommerce');
            case OrderAction::RESUME_FULFILLMENT:
                return __('Fulfillment resumed.', 'kirki-ecommerce');
            case OrderAction::MARK_AS_SHIPPED:
                return __('Order marked as shipped.', 'kirki-ecommerce');
            case OrderAction::MARK_AS_DELIVERED:
                return __('Order delivered.', 'kirki-ecommerce');
            case OrderAction::MARK_AS_HOLD:
                return __('Order on hold.', 'kirki-ecommerce');
            case OrderAction::CANCEL_FULFILLMENT:
                return __('Fulfillment cancelled.', 'kirki-ecommerce');
            case OrderAction::CANCEL_ORDER:
                return __('Order cancelled.', 'kirki-ecommerce');
            case OrderAction::ADD_TRACKING:
                return __('Tracking number added.', 'kirki-ecommerce');
            case OrderAction::MARK_AS_PAID:
                return __('Order marked as paid.', 'kirki-ecommerce');
            case OrderAction::SEND_PAYMENT_LINK:
                return __('Payment link sent.', 'kirki-ecommerce');
            case OrderAction::SEND_INVOICE:
                return __('Invoice sent.', 'kirki-ecommerce');
            case OrderAction::RESEND_ORDER_EMAIL:
                return __('Order email resent.', 'kirki-ecommerce');
            case OrderAction::ARCHIVE_ORDER:
                return __('Order archived.', 'kirki-ecommerce');
            case OrderAction::INITIATE_REFUND:
                return __('Refund initiated.', 'kirki-ecommerce');
            case OrderAction::APPROVE_REFUND:
                return __('Refund approved.', 'kirki-ecommerce');
            case OrderAction::DECLINE_REFUND:
                return __('Refund declined.', 'kirki-ecommerce');
            case OrderAction::MARK_REFUND_COMPLETE:
                return __('Refund marked as completed.', 'kirki-ecommerce');
            default:
                return '';
        }
    }
}
