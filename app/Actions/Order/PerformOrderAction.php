<?php

namespace Kirki\Ecommerce\App\Actions\Order;

use Kirki\Ecommerce\App\Constants\Order\OrderAction;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\DTO\Order\PerformOrderActionDTO;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;

class PerformOrderAction
{
    protected $order_service;

    public function __construct(OrderService $order_service)
    {
        $this->order_service = $order_service;
    }

    /**
     * Perform a lifecycle action on an order.
     *
     * @param PerformOrderActionDTO $dto
     *
     * @return Order
     * @throws ValidationException When the action is not allowed for the current order state.
     */
    public function execute(PerformOrderActionDTO $dto)
    {
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
                OrderManager::add_tracking($order->id, [
                    'carrier' => $dto->carrier,
                    'tracking_number' => $dto->tracking_number,
                    'tracking_url' => $dto->tracking_url,
                ]);
                break;
            case OrderAction::MARK_AS_PAID:
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
                throw new ValidationException(__('No action performed.', 'kirki-ecommerce'), Response::UNPROCESSABLE_ENTITY);
        }

        return $order->fresh('refunds', 'items');
    }

    /**
     * Reject an action that the order's current state does not allow.
     *
     * @param Order $order
     * @param string $action
     *
     * @return void
     * @throws ValidationException
     */
    protected function guard(Order $order, string $action)
    {
        // @todo: refund-cluster order statuses are not part of OrderStatus::get_transition_matrix()
        // yet, so every action is blocked until the refund state machine is defined.
        if ($order->is_refund_initiated) {
            throw new ValidationException(__('This action is not available while a refund is in progress.', 'kirki-ecommerce'), Response::UNPROCESSABLE_ENTITY);
        }

        $state = OrderStatus::get_state($order->order_status);
        $allowed_actions = array_merge($state['fulfillment_actions'], $state['payment_actions'], $state['order_actions']);

        if (!in_array($action, $allowed_actions, true)) {
            throw new ValidationException(__('This action is not available for the order\'s current status.', 'kirki-ecommerce'), Response::UNPROCESSABLE_ENTITY);
        }
    }
}
