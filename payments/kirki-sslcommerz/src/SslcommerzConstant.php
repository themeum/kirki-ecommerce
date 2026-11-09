<?php

namespace Kirki\Ecommerce\Payments;

defined('ABSPATH') || exit;

/**
 * Constants for the SSLCommerz API, version 4.
 */
class SslcommerzConstant
{
    const SANDBOX_BASE_URL = 'https://sandbox.sslcommerz.com';
    const LIVE_BASE_URL = 'https://securepay.sslcommerz.com';

    const SESSION_PATH = '/gwprocess/v4/api.php';
    const VALIDATION_PATH = '/validator/api/validationserverAPI.php';
    const TRANSACTION_PATH = '/validator/api/merchantTransIDvalidationAPI.php';

    const TIMEOUT_SECONDS = 30;

    const RETURN_ARGUMENT = 'sslcommerz_return';
    const RETURN_SUCCESS = 'success';
    const RETURN_FAIL = 'fail';
    const RETURN_CANCEL = 'cancel';

    const API_CONNECT_DONE = 'DONE';

    const SESSION_SUCCESS = 'SUCCESS';
    const STORE_CREDENTIAL_ERROR = 'Store Credential';

    const STATUS_VALID = 'VALID';
    const STATUS_VALIDATED = 'VALIDATED';
    const STATUS_PENDING = 'PENDING';
    const SUCCESS_STATUSES = [self::STATUS_VALID, self::STATUS_VALIDATED];

    const LOW_RISK_LEVEL = '0';

    const REFUND_SUCCESS = 'success';
    const REFUND_PROCESSING = 'processing';
    const REFUND_FAILED = 'failed';
    const REFUND_REFUNDED = 'refunded';
    const REFUND_CANCELLED = 'cancelled';

    const MAX_REFUND_REMARKS_LENGTH = 255;
    const MAX_FIELD_LENGTH = 50;
    const MAX_POSTCODE_LENGTH = 30;
    const MAX_PHONE_LENGTH = 20;
    const MAX_PRODUCT_NAME_LENGTH = 255;

    const RANDOM_TRAN_ID_BYTES = 6;

    const PRODUCT_CATEGORY = 'General';
    const PROFILE_PHYSICAL = 'physical-goods';
    const PROFILE_NON_PHYSICAL = 'non-physical-goods';
    const SHIPPING_YES = 'YES';
    const SHIPPING_NO = 'NO';

    /**
     * The payment fields to store on the order. The card number and the customer data are not
     * among them.
     */
    const STORED_PAYMENT_FIELDS = [
        'val_id',
        'bank_tran_id',
        'risk_level',
        'risk_title',
        'currency_rate',
        'store_amount',
    ];

    /**
     * The PHP default for the code argument of an exception. The plugin does not read this
     * code.
     */
    const DEFAULT_EXCEPTION_CODE = 0;

    const OUTCOME_PAID = 'paid';
    const OUTCOME_ALREADY_PAID = 'already_paid';
    const OUTCOME_HELD = 'held';
    const OUTCOME_CANCELLED = 'cancelled';
    const OUTCOME_NOT_CONFIRMED = 'not_confirmed';
    const OUTCOME_UNKNOWN = 'unknown';
    const OUTCOME_FAILED = 'failed';
    const SETTLED_OUTCOMES = [self::OUTCOME_PAID, self::OUTCOME_ALREADY_PAID];

    /**
     * The delay before each scheduled check: 5 minutes, 15 minutes, 1 hour, 6 hours, and
     * 24 hours after the payment starts.
     */
    const PAYMENT_CHECK_DELAYS_SECONDS = [300, 600, 2700, 18000, 64800];

    /**
     * The delay before each refund check: 1 hour, 6 hours, 24 hours, 72 hours, and 168 hours
     * after the refund starts.
     */
    const REFUND_CHECK_DELAYS_SECONDS = [3600, 18000, 64800, 172800, 345600];
}
