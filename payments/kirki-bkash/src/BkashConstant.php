<?php

namespace Kirki\Ecommerce\Payments;

defined('ABSPATH') || exit;

/**
 * Constants for the bKash Tokenized Checkout API, version 2.
 */
class BkashConstant
{
    const SANDBOX_BASE_URL = 'https://tokenized.sandbox.bka.sh/v2/tokenized-checkout';
    const LIVE_BASE_URL = 'https://tokenized.pay.bka.sh/v2/tokenized-checkout';

    const GRANT_TOKEN_PATH = '/auth/grant-token';
    const REFRESH_TOKEN_PATH = '/auth/refresh-token';
    const CREATE_PAYMENT_PATH = '/payment/create';
    const EXECUTE_PAYMENT_PATH = '/payment/execute';
    const QUERY_PAYMENT_PATH = '/query/payment';
    const REFUND_PATH = '/refund/payment/transaction';
    const REFUND_STATUS_PATH = '/refund/payment/status';

    const TIMEOUT_SECONDS = 30;

    const TOKEN_REFRESH_AFTER_SECONDS = 50 * MINUTE_IN_SECONDS;
    const TOKEN_LIFETIME_SECONDS = 60 * MINUTE_IN_SECONDS;
    const REFRESH_TOKEN_LIFETIME_SECONDS = 30 * DAY_IN_SECONDS;
    const TOKEN_LOCK_SECONDS = 60;

    const CURRENCY = 'BDT';
    const INTENT_SALE = 'sale';

    const CALLBACK_STATUS_SUCCESS = 'success';
    const TRANSACTION_COMPLETED = 'Completed';

    const ALREADY_COMPLETE_CODES = ['2062', '2068', '2117'];

    const STORED_PAYMENT_FIELDS = [
        'paymentId',
        'trxId',
        'transactionStatus',
        'amount',
        'currency',
        'intent',
        'merchantInvoiceNumber',
        'merchantInvoice',
        'paymentExecuteTime',
    ];

    const MAX_REASON_LENGTH = 255;
}
