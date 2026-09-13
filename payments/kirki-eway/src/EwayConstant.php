<?php

namespace Kirki\Ecommerce\Payments;

defined('ABSPATH') || exit;

/**
 * Constants for the Eway Rapid API integration.
 */
final class EwayConstant
{
    public const API_VERSION = '47';

    public const BASE_URL_SANDBOX = 'https://api.sandbox.ewaypayments.com/';
    public const BASE_URL_PRODUCTION = 'https://api.ewaypayments.com/';

    public const PATH_ACCESS_CODES_SHARED = 'AccessCodesShared';
    public const PATH_TRANSACTION = 'Transaction/';

    public const METHOD_PROCESS_PAYMENT = 'ProcessPayment';
    public const TRANSACTION_TYPE_PURCHASE = 'Purchase';

    public const NAME_MAX_LENGTH = 30;
    public const POSTAL_CODE_MAX_LENGTH = 30;
    public const FIELD_MAX_LENGTH = 50;
}
