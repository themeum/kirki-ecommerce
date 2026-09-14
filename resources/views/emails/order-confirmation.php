<?php
defined('ABSPATH') || exit;

use function Kirki\Ecommerce\Framework\end_section;
use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\start_section;
use function Kirki\Ecommerce\Framework\view_data;

$shared = view_data();

$data = $shared['data'] ?? [];

start_section('email-content');
include_view('emails.parts.order.order-content', $data);
include_view('emails.parts.order.view-order-button', $data);
include_view('emails.parts.order.order-summary', $data);
include_view('emails.parts.order.customer-note', $data);
include_view('emails.parts.order.order-details', $data);
end_section();
