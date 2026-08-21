<?php

/**
 * Account - Account Details Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Template;
use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\view_data;

$user = view_data('user') ?: wp_get_current_user();
$first_name = $user->first_name ?: '';
$last_name = $user->last_name ?: '';
$email = $user->user_email ?: '';
$pages = view_data('pages');

$account_config = [
    'user' => [
        'first_name' => $first_name,
        'last_name'  => $last_name,
        'email'      => $email,
    ],
];
?>

<?php Template::get_header(); ?>

<div class="kecom-page-wrapper">
    <div class="kecom-account-page">
        <!-- Account Center 2-Column Grid -->
        <div class="kecom-account-grid">
            <!-- Left Sidebar Navigation -->
            <?php include_view('site.account.sidebar', ['current_page' => 'account-details', 'pages' => $pages]); ?>

            <!-- Right Content Area -->
            <main class="kecom-account-content" x-data="accountDetails(<?php echo esc_attr(wp_json_encode($account_config)); ?>)">
                <div class="kecom-account-details-page">
                    <h1 class="kecom-account-details-title"><?php esc_html_e('Account Details', 'kirki-ecommerce'); ?></h1>

                    <!-- Profile Form Card & Actions -->
                    <?php include_view('site.account.parts.account-form'); ?>

                    <!-- Change Password Modal -->
                    <?php include_view('site.account.parts.password-modal'); ?>
                </div>
            </main>
        </div>
    </div>
</div>

<?php Template::get_footer(); ?>
