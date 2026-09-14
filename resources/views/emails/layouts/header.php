<?php
defined('ABSPATH') || exit;

$logo_url = $data['logo_url'] ?? '';
$height = $data['height'] ?? '30px';
$height = is_numeric($height) ? $height . 'px' : $height;
$position = $data['position'] ?? 'center';
$align_map = [
    'start' => 'left',
    'center' => 'center',
    'end' => 'right',
];
$align = $align_map[$position] ?? 'center';
?>
<tr>
    <td
        data-email-part="position"
        style="padding: 24px 0; text-align: <?php echo esc_attr($align); ?>; border-bottom: 1px solid #E6E6E6; width: 100%;">
        <?php if (!empty($logo_url)) : ?>
            <img
                src="<?php echo esc_url($logo_url); ?>"
                alt="<?php echo esc_attr(get_bloginfo('name')); ?>"
                data-email-part="logo"
                style="height: <?php echo esc_attr($height); ?>; width: auto; display: inline-block; border: 0;" />
        <?php else : ?>
            <span
                data-email-part="logo"
                style="font-size: 18px; font-weight: 700; color: <?php echo esc_attr($data['colors']['text'] ?? '#111111'); ?>;">
                <?php echo esc_html(get_bloginfo('name')); ?>
            </span>
        <?php endif; ?>
    </td>
</tr>