<?php

use function Kirki\Ecommerce\Framework\view_data;

$data = view_data();
$body = $data['body'] ?? '';
?>
<tr>
    <td>
        <div data-email-part="body" class="kirki-ecommerce-rich-text">
            <?php echo wp_kses_post($body); ?>
        </div>
    </td>
</tr>