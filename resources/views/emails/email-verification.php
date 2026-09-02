<?php

/**
 * Email Verification Template.
 *
 * @package Kirki\Ecommerce\Views
 * @subpackage Emails
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

$user_name = $data['user_name'];
$verify_url = $data['verify_url'];
$site_name = $data['site_name'];
?>
<div>
    <p><?php echo esc_html(sprintf(__('Hi %s,', 'kirki-ecommerce'), $user_name)); ?></p>
    <p>
        <?php echo esc_html__('Please click the link below to verify your email address and link any past orders to your account:', 'kirki-ecommerce'); ?>
    </p>
    <p>
        <a href="<?php echo esc_url($verify_url); ?>"><?php echo esc_html__('Verify Email', 'kirki-ecommerce'); ?></a>
    </p>
    <p><?php echo esc_html__('This link will expire in 24 hours.', 'kirki-ecommerce'); ?></p>
    <p><?php echo esc_html__('Regards,', 'kirki-ecommerce'); ?></p>
    <p><?php echo esc_html($site_name); ?></p>
</div>
