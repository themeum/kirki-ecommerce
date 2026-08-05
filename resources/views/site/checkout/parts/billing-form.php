<?php
/**
 * Billing Form Part
 *
 * @package Kirki\Ecommerce\Templates
 */

defined('ABSPATH') || exit;
extract($data);

$billing_address = $customer->get_billing_address();

// Billing Info.
$billing_first_name = $billing_address->first_name ?? '';
$billing_last_name = $billing_address->last_name ?? '';
$billing_address_line1 = $billing_address->address_line1 ?? '';
$billing_address_line2 = $billing_address->address_line2 ?? '';

$billing_city = $billing_address->city ?? '';
$billing_state = $billing_address->state ?? '';
$billing_country = $billing_address->country ?? '';
$billing_postal_code = $billing_address->postal_code ?? '';

$billing_phone = $billing_address->phone ?? '';
$billing_email = $billing_address->email ?? '';
?>

<!-- Billing Form -->
<div class="kecom-billing-section">
    <h2 class="kecom-section-title"><?php esc_html_e('Billing Details', 'kirki-ecommerce'); ?></h2>
    <form id="billing-form" class="kecom-billing-form kecom-form" x-data="form({
        defaultValues: {
            country: '<?php echo esc_js($billing_country); ?>',
            first_name: '<?php echo esc_js($billing_first_name); ?>',
            last_name: '<?php echo esc_js($billing_last_name); ?>',
            address_line1: '<?php echo esc_js($billing_address_line1); ?>',
            address_line2: '<?php echo esc_js($billing_address_line2); ?>',
            city: '<?php echo esc_js($billing_city); ?>',
            state: '<?php echo esc_js($billing_state); ?>',
            postal_code: '<?php echo esc_js($billing_postal_code); ?>',
            phone: '<?php echo esc_js($billing_phone); ?>',
            email: '<?php echo esc_js($billing_email); ?>'
        },
        mode: 'onBlur'
   })" @validate-billing-form.window="await validateForm(); $dispatch('billing-form-validated', { isValid })">
        <div class="kecom-field">
            <label class="kecom-field-label" for="billing-country"><?php esc_html_e('Country/region', 'kirki-ecommerce'); ?></label>
            <select class="kecom-select" id="billing-country" name="country" x-bind="register('country', { required: '<?php esc_html_e('Country is required', 'kirki-ecommerce'); ?>' })">
                <option value=""><?php esc_html_e('Select Country', 'kirki-ecommerce'); ?></option>
                <?php foreach ($countries as $country) : ?>
                    <option value="<?php echo esc_attr($country['code']); ?>">
                        <?php echo esc_html($country['name']); ?>
                    </option>
                <?php endforeach; ?>
            </select>
            <span class="kecom-field-error" x-show="errors.country" x-text="errors.country"></span>
        </div>
        <div class="kecom-billing-form-row">
            <div class="kecom-field">
                <label class="kecom-field-label" for="billing-first-name"><?php esc_html_e('First Name', 'kirki-ecommerce'); ?></label>
                <input 
                    class="kecom-input" 
                    type="text" 
                    id="billing-first-name" 
                    name="first_name" 
                    x-bind="register('first_name', { required: '<?php esc_html_e('First name is required', 'kirki-ecommerce'); ?>' })">
                <span class="kecom-field-error" x-show="errors.first_name" x-text="errors.first_name"></span>
            </div>
            <div class="kecom-field">
                <label class="kecom-field-label" for="billing-last-name"><?php esc_html_e('Last Name', 'kirki-ecommerce'); ?></label>
                <input 
                    class="kecom-input" 
                    type="text" 
                    id="billing-last-name" 
                    name="last_name" 
                    x-bind="register('last_name', { required: '<?php esc_html_e('Last name is required', 'kirki-ecommerce'); ?>' })">
                <span class="kecom-field-error" x-show="errors.last_name" x-text="errors.last_name"></span>
            </div>
        </div>
        <div class="kecom-field">
            <label class="kecom-field-label" for="billing-address-line1"><?php esc_html_e('Address', 'kirki-ecommerce'); ?></label>
            <input 
                class="kecom-input" 
                type="text" 
                id="billing-address-line1" 
                name="address_line1" 
                x-bind="register('address_line1', { required: '<?php esc_html_e('Address is required', 'kirki-ecommerce'); ?>' })">
            <span class="kecom-field-error" x-show="errors.address_line1" x-text="errors.address_line1"></span>
        </div>
        <div class="kecom-field">
            <label class="kecom-field-label" for="billing-address-line2">
                <?php esc_html_e('Apartment, suit, etc.', 'kirki-ecommerce'); ?> <span class="kecom-text-subdued">(<?php esc_html_e('optional', 'kirki-ecommerce'); ?>)</span>
            </label>
            <input class="kecom-input" type="text" id="billing-address-line2" name="address_line2" x-bind="register('address_line2')">
        </div>
        <div class="kecom-billing-form-row">
            <div class="kecom-field">
                <label class="kecom-field-label" for="billing-city"><?php esc_html_e('City', 'kirki-ecommerce'); ?></label>
                <input 
                    class="kecom-input" 
                    type="text" 
                    id="billing-city" 
                    name="city" 
                    x-bind="register('city', { required: '<?php esc_html_e('City is required', 'kirki-ecommerce'); ?>' })">
                <span class="kecom-field-error" x-show="errors.city" x-text="errors.city"></span>
            </div>
            <div class="kecom-field">
                <label class="kecom-field-label" for="billing-state"><?php esc_html_e('State', 'kirki-ecommerce'); ?></label>
                <input 
                    class="kecom-input" 
                    type="text" 
                    id="billing-state" 
                    name="state" 
                    x-bind="register('state', { required: '<?php esc_html_e('State is required', 'kirki-ecommerce'); ?>' })">
                <span class="kecom-field-error" x-show="errors.state" x-text="errors.state"></span>
            </div>
            <div class="kecom-field">
                <label class="kecom-field-label" for="billing-postal-code"><?php esc_html_e('Postal code', 'kirki-ecommerce'); ?></label>
                <input 
                    class="kecom-input" 
                    type="text" 
                    id="billing-postal-code" 
                    name="postal_code" 
                    x-bind="register('postal_code', { required: '<?php esc_html_e('Postal code is required', 'kirki-ecommerce'); ?>' })">
                <span class="kecom-field-error" x-show="errors.postal_code" x-text="errors.postal_code"></span>
            </div>
        </div>
        <div class="kecom-field">
            <label class="kecom-field-label" for="billing-phone"><?php esc_html_e('Phone Number', 'kirki-ecommerce'); ?></label>
            <input 
                class="kecom-input" 
                type="tel" 
                id="billing-phone" 
                name="phone" 
                x-bind="register('phone', { required: '<?php esc_html_e('Phone number is required', 'kirki-ecommerce'); ?>' })">
            <span class="kecom-field-error" x-show="errors.phone" x-text="errors.phone"></span>
        </div>
    </form>
</div>
