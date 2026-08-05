<?php
/**
 * Shipping Form Part
 *
 * @package Kirki\Ecommerce\Templates
 */

defined('ABSPATH') || exit;
extract($data);

// Shipping Info.
$shipping_first_name = $shipping_address["first_name"] ?? '';
$shipping_last_name = $shipping_address["last_name"] ?? '';
$shipping_address_line1 = $shipping_address["address_line1"] ?? '';
$shipping_address_line2 = $shipping_address["address_line2"] ?? '';

$shipping_city = $shipping_address["city"] ?? '';
$shipping_state = $shipping_address["state"] ?? '';
$shipping_country = $shipping_address["country"] ?? '';
$shipping_postal_code = $shipping_address["postal_code"] ?? '';

$shipping_phone = $shipping_address["phone"] ?? '';
$shipping_email = $shipping_address["email"] ?? '';
?>

<!-- Shipping Form -->
<div class="kecom-billing-section">
    <h2 class="kecom-section-title"><?php esc_html_e('Shipping Details', 'kirki-ecommerce'); ?></h2>
    <form id="shipping-form" class="kecom-billing-form kecom-form" x-data="form({
        defaultValues: {
            country: '<?php echo esc_js($shipping_country); ?>',
            first_name: '<?php echo esc_js($shipping_first_name); ?>',
            last_name: '<?php echo esc_js($shipping_last_name); ?>',
            address_line1: '<?php echo esc_js($shipping_address_line1); ?>',
            address_line2: '<?php echo esc_js($shipping_address_line2); ?>',
            city: '<?php echo esc_js($shipping_city); ?>',
            state: '<?php echo esc_js($shipping_state); ?>',
            postal_code: '<?php echo esc_js($shipping_postal_code); ?>',
            phone: '<?php echo esc_js($shipping_phone); ?>',
            email: '<?php echo esc_js($shipping_email); ?>',
        },
        mode: 'onBlur'
   })" @validate-shipping-form.window="await validateForm(); $dispatch('shipping-form-validated', { isValid })">
        <div class="kecom-field">
            <label class="kecom-field-label" for="shipping-country"><?php esc_html_e('Country/region', 'kirki-ecommerce'); ?></label>
            <select class="kecom-select" id="shipping-country" name="country" x-bind="register('country', { required: '<?php esc_html_e('Country is required', 'kirki-ecommerce'); ?>' })">
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
                <label class="kecom-field-label" for="shipping-first-name"><?php esc_html_e('First Name', 'kirki-ecommerce'); ?></label>
                <input 
                    class="kecom-input" 
                    type="text" 
                    id="shipping-first-name" 
                    name="first_name" 
                    x-bind="register('first_name', { required: '<?php esc_html_e('First name is required', 'kirki-ecommerce'); ?>' })">
                <span class="kecom-field-error" x-show="errors.first_name" x-text="errors.first_name"></span>
            </div>
            <div class="kecom-field">
                <label class="kecom-field-label" for="shipping-last-name"><?php esc_html_e('Last Name', 'kirki-ecommerce'); ?></label>
                <input 
                    class="kecom-input" 
                    type="text" 
                    id="shipping-last-name" 
                    name="last_name" 
                    x-bind="register('last_name', { required: '<?php esc_html_e('Last name is required', 'kirki-ecommerce'); ?>' })">
                <span class="kecom-field-error" x-show="errors.last_name" x-text="errors.last_name"></span>
            </div>
        </div>
        <div class="kecom-field">
            <label class="kecom-field-label" for="shipping-address-line1"><?php esc_html_e('Address', 'kirki-ecommerce'); ?></label>
            <input 
                class="kecom-input" 
                type="text" 
                id="shipping-address-line1" 
                name="address_line1" 
                x-bind="register('address_line1', { required: '<?php esc_html_e('Address is required', 'kirki-ecommerce'); ?>' })">
            <span class="kecom-field-error" x-show="errors.address_line1" x-text="errors.address_line1"></span>
        </div>
        <div class="kecom-field">
            <label class="kecom-field-label" for="shipping-address-line2">
                <?php esc_html_e('Apartment, suit, etc.', 'kirki-ecommerce'); ?> <span class="kecom-text-subdued">(<?php esc_html_e('optional', 'kirki-ecommerce'); ?>)</span>
            </label>
            <input class="kecom-input" type="text" id="shipping-address-line2" name="address_line2" x-bind="register('address_line2')">
        </div>
        <div class="kecom-billing-form-row">
            <div class="kecom-field">
                <label class="kecom-field-label" for="shipping-city"><?php esc_html_e('City', 'kirki-ecommerce'); ?></label>
                <input 
                    class="kecom-input" 
                    type="text" 
                    id="shipping-city" 
                    name="city" 
                    x-bind="register('city', { required: '<?php esc_html_e('City is required', 'kirki-ecommerce'); ?>' })">
                <span class="kecom-field-error" x-show="errors.city" x-text="errors.city"></span>
            </div>
            <div class="kecom-field" x-data="{ states: [] }" x-init="
                const loadStates = (countryCode) => {
                    if (!countryCode) { states = []; return; }
                    const countries = window.kirki_ecommerce?.countries ?? [];
                    const country = countries.find(c => c.code === countryCode);
                    states = country?.states || [];
                };

                $watch('values.country', (newCountry) => {
                    loadStates(newCountry);
                    // Dispatch address-changed event to update cart
                    window.dispatchEvent(new CustomEvent('address-changed'));
                });

                $watch('values.state', () => {
                    // Dispatch address-changed event when state changes
                    window.dispatchEvent(new CustomEvent('address-changed'));
                });

                // Initial load
                $nextTick(() => loadStates(values.country));
            ">
                <label class="kecom-field-label" for="shipping-state"><?php esc_html_e('State', 'kirki-ecommerce'); ?></label>
                <select
                    class="kecom-select"
                    id="shipping-state"
                    name="state"
                    x-bind="register('state', { required: '<?php esc_html_e('State is required', 'kirki-ecommerce'); ?>' })">
                    <option value=""><?php esc_html_e('Select State', 'kirki-ecommerce'); ?></option>
                    <template x-for="state in states" :key="state.id">
                        <option :value="state.id" x-text="state.name"></option>
                    </template>
                </select>
                <span class="kecom-field-error" x-show="errors.state" x-text="errors.state"></span>
            </div>
            <div class="kecom-field">
                <label class="kecom-field-label" for="shipping-postal-code"><?php esc_html_e('Postal code', 'kirki-ecommerce'); ?></label>
                <input
                    class="kecom-input"
                    type="text"
                    id="shipping-postal-code"
                    name="postal_code"
                    x-bind="register('postal_code', { required: '<?php esc_html_e('Postal code is required', 'kirki-ecommerce'); ?>' })">
                <span class="kecom-field-error" x-show="errors.postal_code" x-text="errors.postal_code"></span>
            </div>
        </div>
        <div class="kecom-field">
            <label class="kecom-field-label" for="shipping-phone"><?php esc_html_e('Phone Number', 'kirki-ecommerce'); ?></label>
            <input 
                class="kecom-input" 
                type="tel" 
                id="shipping-phone" 
                name="phone" 
                x-bind="register('phone', { required: '<?php esc_html_e('Phone number is required', 'kirki-ecommerce'); ?>' })">
            <span class="kecom-field-error" x-show="errors.phone" x-text="errors.phone"></span>
        </div>
        <div class="kecom-field">
            <label class="kecom-checkbox">
                <input class="kecom-checkbox-input" type="checkbox" x-model="billingSameAsShipping">
                <span class="kecom-checkbox-label"><?php esc_html_e('The billing address is same as shipping address.', 'kirki-ecommerce'); ?></span>
            </label>
        </div>
    </form>
</div>
