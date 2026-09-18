<?php

use Kirki\Ecommerce\App\Supports\HtmlStyle;
use function Kirki\Ecommerce\Framework\view_data;

$data = view_data();
$body = $data['body'] ?? '';
?>
<tr>
    <td>
        <div data-email-part="body">
            <?php HtmlStyle::print_richtext_styles(); ?>
            <?php echo wp_kses_post($body); ?>
        </div>
    </td>
</tr>