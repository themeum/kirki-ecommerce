# Findings noticed while adding docblocks (not changed)

Collected from the 16 batch reports plus the enforcement run. Nothing here was fixed: the change is docblock-only. Line numbers are approximate and may have shifted.

- Also: `OnlinePaymentService::__discover_installable_providers` (app/Services/OnlinePaymentService.php:78) triggers a wporg phpcs warning, PHP reserves double-underscore method names.

## B4 (Http/Requests second half)
- app/Http/Requests/TagRequest.php: nothing references it (dead?); rules() requires search+sort_by but sort_order only in filters()
- app/Http/Requests/Variant/BulkUpdateVariantRequest.php ~55-57: base_unit/total_unit validated vs WeightUnit; ProductCreate/UpdateRequest use Unit for same fields
- app/Http/Requests/Product/ProductCreateRequest.php ~116: variants.*.base_sale_price closure reads $data['variants'][$index]['base_price'] with no isset
- app/Http/Requests/Product/ProductUpdateRequest.php: variants.*.sku has @todo about unique rule
- app/Http/Requests/Site/ShopPageFilterRequest.php: filters() has //TODO, array-field sanitizers commented out (category_ids, brand_ids, price filters unsanitized)
- app/Http/Requests/ShippingBox/ShippingBoxUpdateRequest.php: width/height/length lack gt:0 (create request has it)
- SettingsUpdateRequest/SendTestEmailRequest: key colors.background.info_cads looks like typo for info_cards (consistent in both)
- Deviation: B4 removed a stale @package tag from ShopPageFilterRequest header; ran one read-only git diff (harmless)
## B3 (Http/Requests first half)
- Coupon/CouponCreateRequest.php:12-19 converts discount to minor units only when type === FIXED; CouponUpdateRequest converts whenever type !== PERCENTAGE (null/absent too). Inconsistent.
- CouponCreate uses required_if:has_usage_limit,true; CouponUpdate uses required_if:has_usage_limit,1 (same for has_customer_limit).
- Account/AddressCreateRequest & AddressUpdateRequest near-duplicates; CustomerCreate/UpdateRequest duplicate prepare_for_validation.
- Notes: B3 used an insertion script + manual review (3.4 spot-check wording: formulaic "Validates and sanitizes the payload for ..." class summaries); fixed wrong @package in WishlistFilterRequest header; dropped some historical wording in prepare_for_validation docblocks (Address/Customer requests).
## B5 (DTO)
- Order/CreateOrderDTO.php:154 & UpdateOrderDTO.php:121: no-arg constructors override DTO::__construct(array $data = []) without calling parent -> from_array()/from_request() would silently ignore data (works today since actions use new + assign).
- @var types disagree with defaults: `bool $is_active = 1` (Brand, Category), `bool $accepts_marketing = 0` (Create/UpdateCustomerDTO).
- Money type inconsistency: base_sale_price/base_cost_of_goods float|null in CreateVariantDTO but int|null in UpdateVariantDTO; Create/UpdateOrderItemDTO use float for money where Order DTOs use int; CalculationItemDTO::$weight int vs Variant DTOs float.
- Attribute/UpdateAttributeDTO & Tag/UpdateTagDTO type $id as string; other Update DTOs use int.
- OfflinePayment/*::$icon documented int|string|null: request sanitizes as text but PaymentProvider::from_offline accepts only int media ID.
- Attribute/AttributeListFilterDTO.php still has trailing `// list, color` comment (left).
- Docblock TYPE corrections by B5 (verify in 3.4): is_active/is_deletable string->bool in Brand/Category/Collection/Currency DTOs; is_base string|null->bool|null in Currency DTOs; additional_info string|null->array|null in Create/UpdateProductDTO.
## B2 (Site controllers, Middlewares, Blocks, Shortcodes, Hooks)
- AccountController.php:29: `use ...\Http\Response;` now unused (docblocks no longer name it).
- BlockRegister.php:6: file header @package says Shortcodes but file is in Blocks (left).
- RenderRegisterConsents.php uses RendersLoginConsents trait, named for login only.
- MiniCartBlock.php:56 / MiniCartShortcode.php:47: get_mimi_cart_html looks like typo of get_mini_cart_html (real method name in MiniCartService).
- AccountController.php:249-253: wishlist() formatting (missing spaces after commas).
- AccountController.php:94: handle_email_verification() returns null silently on empty token / not logged in.
- SiteController.php:242: `@TODO:: Will be removed later` on design_system_page() kept.
- Docblock corrections by B2 (verify in 3.4): AccountController/SiteController/OrderActivityController return types (View / RedirectResponse|null / JsonResponse), SiteAuthMiddleware @throws removed, BlockRegister get_blocks summary.
## B6 (Constants, Contracts, Events, Listeners, Jobs, Policies, Traits, Facades)
- app/Constants/Cart.php: COOKIE_TOKEN_EXPIRE_IN_MINUTES = 43200 has existing constant docblock `@var string` but value is int (constant docblocks left, out of scope).
- self:: instead of static:: (project convention) in Constants/Order/FulfillmentStatus, OrderActivityType, PageKeys, PaymentStatus, OrderStatus::get_list.
- Constants/Order/OrderStatus.php ~72: find_by_pair ends with throw_anyway(...), no explicit return; fine only if throw_anyway always throws.
- Listeners/SyncCartAddress.php:14-22: reads $cart->shipping_address['id'] / billing_address['id'] without key check -> possible notice if no address.
- Unused imports: Log in Listeners/SendNotificationEmail & AddActivityLog; Exception in Jobs/SendEmailJob. Unordered imports in Listeners/UpdateCurrencyRates (cosmetic).
- Events/OrderShipped.php: never dispatched anywhere (OrderManager::resend_order_email notes it); listeners registered in config/listeners.cache.php never fire. $order typed mixed for that reason.
- Contracts/RecurrableScheduler.php: nothing implements/uses it; should_stop/get_additional_args summaries inferred from names (least certain text in B6).
- Jobs/SendEmailJob, AddActivityLog, SendNotificationEmail: empty/commented stubs; docblocks say "no-op"/"placeholder".
## B15 (database/migrations)
- CreateOrderActivitiesTable.php (created_by FK): references users.id but WP users PK is ID (other migrations use ID); SchemaKeys may mask.
- CreateShippingBoxesTable.php (unit column): leftover inline comment "Assuming 'cm' as default, or maybe 'in'".
- CreateMediaProductTable.php FKs named fk_media_product_* not fk_kirki_ecommerce_* (AlterSchemaKeysToExplicitNames probably renames).
- CreateProductTagsTable.php: two FKs have no explicit names, unlike most Create migrations.
- Note: AlterSchemaKeysToExplicitNames.php: file-level docblock before namespace moved into class docblock (text unchanged); old down() sentence became description under new summary "Do nothing on rollback." Class summaries in Create* migrations are generic (inferred from columns).
## B16 (database/seeders)
- SettingsSeeder.php:376 create_currency_settings() is public; sibling create_*_settings() are protected.
- SettingsSeeder create_payment/tax/checkout/currency_settings use literal keys 'payment','tax','checkout','currency' instead of OptionKeys::* constants; run() builds method names from those constants so they must stay in sync.
- TagSeeder.php:18 run() has no `: void` return type unlike other seeders.
- CurrencySeeder.php vs OnBoarding/CurrencySeeder.php differ (first inserts "code" => "usd", "id" => 1 with double quotes; onboarding guards with exists()).
- ProductSeeder.php: @param \Faker\Generator kept fully qualified (not imported).
## B7 (Resources)
- SettingResource.php:43-45: CURRENCY_SETTINGS case has no break -> falls through into get_email_settings (email keys added to currency array).
- SettingResource.php:15,18: `dd` and other imports look unused; dd in production resource is odd.
- AttributeResource.php:5: `use Dom\Attr;` unused (IDE auto-import).
- Product/ProductListResource.php:20-21 & ProductListWithVariantsResource.php:22-23: $this->variants->first()->base_price fatals for a product with no variants; min($min_base_sale_price, $variant->base_sale_price) returns null if any variant has null sale price (min(null,5) is null).
- Site/Order/OrderResource.php:391: catch (Exception $e) in resolve_payment_next_step swallows gateway failure and returns checkout-success redirect; method ends with bare `return;`.
- Site/Order/OrderResource.php:275: strict === on order_item_id; fails silently if one side is a string.
- Order/OrderCalculationResource.php: to_array uses $this->result->currency_code and $this->currency_code with different fallback logic. Cart/CartResource.php assigns computed values via magic __set.
- Wishlist/WishlistResource.php & Shop/ShopProductResource.php: private methods contradict "never private" rule; `$paren_data` typo for $parent_data.
- Site/Order/OrderActivityResource.php:1: trailing space after `<?php `, no final newline.
- Docblock corrections by B7 (verify in 3.4): to_array summaries in Attribute/AttributeValue/Variant/OrderCalculation resources; SettingResource::get_advanced_settings; WishlistResource::resolve_pricing; tax breakdown "by name" -> "by name and rate".
## B1 (Http/Controllers/Api)
- CurrencyController.php:56 message typo 'Currencys retrieved successfully.'; :71 create() assigns $currencies from insert() and never uses it.
- ProductController.php:51,62 and Site/SiteController.php: list endpoints say 'Product retrieved successfully.' (singular).
- OnlinePaymentController.php:33 install(): $id assigned but unused. OrderCalculationController.php:9: FulfillmentStatus import unused.
- CustomerController::bulk_actions: DELETE_ALL builds ListFilterDTO instead of CustomerListFilterDTO -> customer-specific filters dropped.
- ShippingBoxController, ShippingProfileController, TaxProfileController, ProductSchemaController read $request->all() in bulk_actions; other CRUD controllers use $request->validated().
- TestController.php: test() calls Settings::update('general.industry','tech') (writes real settings), imports unused Stripe; dev-only controller risky if routed in prod.
- OnlinePaymentController::download and OnboardingController::store carry @todo about mock/unfinished behaviour (kept).
- Site/WishlistController::remove_item: route param `id` is used as the variant ID.
- Note: AccountController/AddressController/SiteController/WishlistController (Api) have an extra @since in a file-level header docblock above namespace, left as-is. Existing docblock corrections (verify in 3.4): @return Response -> \Kirki\Ecommerce\Framework\Http\JsonResponse in Site/* controllers and VariantController::generate_skus; AccountController::$list_limit @since removed from property. Returns use fully qualified JsonResponse since not imported.
## B10 (Models, Concerns, Parsers, Wordpress)
- Models/Coupon.php scope_apply_status_filter: switch has no default -> unrecognised non-empty status returns null (documented QueryBuilder|null).
- Models/Cart.php $fillable lists 'shipping_method' twice.
- Models/Variant.php media(): belongs_to(Post::class, 'media', 'id') uses owner key `id` but Post PK is `ID`.
- Models/Tag.php: $casts has `count` but not in $fillable.
- Wordpress/User.php is_email_verification_expired: `null === $expires_at` branch unreachable (get_email_verification_expires_at returns 0, never null); result still correct.
- Models/Product.php attributes() relation name shadows the model's $attributes concept.
- Wordpress/Hooks/Actions/SMTPConfig.php: double blank line; From/FromName ?? fallbacks don't apply to empty strings.
- Docblock TYPE corrections by B10 (verify in 3.4): Wordpress/User get_email_verification_token string|null->string; sent_at/expires_at int|null->int (returns 0); mark_email_as_(un)verified & set_email_verification_* bool -> int|bool; @throws Exception added to methods calling throw_if in Concerns/PersistsOrderCoupons & PersistsOrderTaxes (CONFLICTS with spec "throws directly" - check in 3.4); RendersLoginConsents file-level docblock merged into trait docblock.
## B9 (Services second half)
- MiniCartService.php:27 method name typo get_mimi_cart_html.
- PageService.php:18 get(PageFilterDTO $filters = null) dereferences $filters->status without null check -> fatal when called w/o filter.
- OrderService.php:503 merge_guest_orders sets last_name from get_first_name().
- VariantService.php:148 update() calls $variant->attribute_values() before the !$variant check; update_variant() can return false.
- ShippingService.php:48,54 `(int) $method['base_amount'] ?? null` - ?? is dead (cast binds first).
- ShippingService.php:306-310 redundant `if (!empty($ranges)) return null;` before `return null;`.
- ShippingBoxService.php:128 NotFoundException with 400 for "At least one default shipping box is required."
- OrderService.php:347 apply_order_action has second throw_if repeating "Order not found." for a failed update.
- OfflinePaymentService find/update/delete iterate $offline_payments without a null guard; update silently no-ops when ID not found.
- OnlinePaymentService::install throw_if for already-installed provider uses Response::NOT_FOUND.
- TagService.php:161-162 stray blank lines.
- Docblock corrections by B9 (verify in 3.4): OrderService::paginated_orders, ShippingBoxService::delete_all, OfflinePaymentService::update @throws removed, TagService::delete/update, UserService::partial_update/verify_email_token (now mentions kecom_user_email_verified hook -> MergeGuestOrder), VariantService::update slug text removed, ProductService::create/update slug from title, ProductService::bulk_restore, ShippingService::find_shipping_zone stray @param removed. B9 used a helper script (scratchpad b9/) to insert docblocks. ShippingService::get_final_available_shipping_options wrote base_cost: int though DecisionContext::get_shipping_cost() is untyped.
## B14 (Managers, Payment)
- Payment/PaymentManager.php:104 get_available_offline_providers ends in ->to_array(); siblings use ->all(); documented PaymentProvider[] but to_array() could convert items.
- Payment/PaymentProvider.php:494 sanitize_settings never called (PayPal::sanitize_settings dead code).
- Payment/PaymentProvider.php:579 format_amount always 2 decimals (wrong for JPY / 3-decimal currencies).
- Payment/PaymentProvider.php:79 $has_fields no default (null) yet used as bool.
- Payment/Providers/PayPal.php:284 webhook() runs handlers without verifying PayPal signature or webhook_id setting.
- Managers/OrderManager.php:100 mark_as_cancel: apply_order_action returns true even with no transition -> "True when transition applied" is generous.
- Docblock corrections by B14 (verify in 3.4): MoneyManager to_dto/from_minor/load_base_currency($this)/convert_to_currency; OrderManager mark_as_cancel, get_refund (Refund|null FQN), send_invoice_email (/* */ malformed comment converted to real docblock - comment-only); PaymentProvider payment_fields, $availability typo, $icon string|null; WebhookController::handle_return now Kirki Framework JsonResponse.
## B13 (Menu, Scheduler, Settings, Providers, Mails, AppSettings, KirkiEcommerce, helpers)
- Mails/admins/AdminResetPasswordMail.php:23 option_key() returns customer_emails key; :33 & customers/CustomerResetPasswordMail.php:33 hardcoded 'sample-reset-token' (preview-only?).
- AppSettings.php:34 get() with null key returns $default, not all settings.
- Scheduler/Concerns/Dispatchable.php:58 store() treats get_delay() as date object (->to_sql_datetime_string()) while Queueable documented int; no caller in app/ passes a delay. Documented mixed.
- KirkiEcommerce.php: all three handle_* effectively empty (activation steps commented out).
- Mails/Mailer.php is_enabled() unused in class.
- Settings/SettingsFactory.php:35,60 strpos($key,'.') falsy for a key starting with '.'.
- Menu/Home.php slug same as Products (kirki-ecommerce#/products); @todo says hiding style is temporary.
- Scheduler/DTO/JobDTO.php uses typed properties (public int $id) - contradicts "no native types" note; fine on 7.4.
- Docblock corrections by B13 (verify in 3.4): AppSettings get/get_default; helpers.php settings() @return now `AppSettings|mixed` (awkward - mixed absorbs); SettingsFactory get (@throws added)/get_settings_instance (@throws removed); Scheduler::run @return void, run_async_worker; QueueRepository mark_as_failed int|null, cleanup; Queueable $delay/delay()/get_delay() int|null -> mixed; Providers register() summaries -> @inheritDoc; Runner::validate tag order. Some property docblocks sit directly above next method with no blank line (whitespace left untouched).
## B8 (Services first half: AddressService .. InventoryService)
- CustomerService.php:265 and VariantService.php:186 call DB::roll_back(); connection only has rollback() -> probably a bug.
- CurrencyService.php:206 `if ($data->is_base && !$currency->is_base)` runs after $currency->update(...); model likely already holds new value so exchange-rate sync may never fire.
- CategoryService.php:156 update failure throws NotFoundException with BAD_REQUEST (class/status mismatch).
- CouponService.php:183 on update failure message reads "Coupon could not be found."
- CouponService.php:320 change_activation_state() uses $coupon->is_active with no null check on find().
- CartService.php:355 on guest-cart merge, existing item's quantity is replaced with guest quantity rather than added.
- CartService.php:211,247 `$item->cart_id !== $cart_id` strict comparison depends on same types.
- Docblock corrections by B8 (verify in 3.4): AttributeService/BrandService delete @throws; BrandService::delete_all bool|int; CurrencyService insert/create/update (false slug text removed, insert() returns bool); CustomerService create/update slug text, find_by_user_id param name; EmailPreviewService::get_sample_user returns user() not Customer. Documented throw_if() as @throws (now confirmed policy).
## B12 (Supports, Currency, Tax)
- Supports/Flex.php:183 offsetGet() calls $this->value($offset), which doesn't exist -> falls into __call (sets attribute true, returns $this).
- Supports/Currency.php:36,53 `$from->exchange_rate === 0` never true (column cast to float; 0.0 === 0 false); zero-rate guard never fires.
- Currency/CurrencyExchangeManager.php:71,117 get_rates()/sync() call get_active_provider()->... which returns null when no provider configured -> fatal.
- Currency/Providers/ExchangeRatesApiProvider.php:96 DTO timestamp is time_next_update_unix (next update), not fetch time.
- Supports/Icon.php uses private members (rule), line 119 mis-indented. Supports/Template.php: most of the file below line 98 indented as if nested in get_header(); hard-coded untranslated English default titles.
- Tax/Strategies/DefaultTaxStrategy & EUTaxStrategy: TaxLineDTO puts computed tax amount in field named base_amount (misleading).
- Supports/Tax.php:69-76 stray blank line between is_tax_inclusive() docblock and method.
- Docblock corrections by B12 (verify in 3.4): ExchangeRatesApiProvider::get_usage; Utils generate_site_pages (@throws removed), registration_enabled int, get_countries array[], is_nonce_verified string|null, duplicate docblock above get_account_page_id removed. Extra @since in file-level header docblocks of Template.php, Url.php, Utils.php (left).
## FOLLOW-UP for 3.x
- B12 removed @throws where code uses throw_if()/throw_anyway() (original brief). Policy changed after B9: those DO get @throws. Re-add for: Currency/Providers/CurrencyApiProvider::get_usage, Currency/SchemaKeys::expected_name (check path), Supports/Currency::exchange_rate. Check B11 for same.
## B11 (Actions, Decisions)
- Actions/Order/UpdateOrderAction.php prepare_order_item_dto: $product->media->first()->id fails when product has no media (CreateOrderAction guards it). Constructor param $shippingService camelCase.
- Actions/Order/PerformOrderAction.php execute catches Exception rather than Throwable unlike other actions.
- Actions/Order/CreateRefundAction.php: `$dto->invoiced_amount === $refundable_amount` strict int-vs-float never matches; $inventory_service never used.
- Unused imports left by docblock corrections (cannot remove without changing code): NotFoundException in UpdateAccountProfileAction, Throwable in DuplicateCouponAction. Already unused: PaymentStatus in UpdateRefundAction.
- CreateOrderAction::prepare_context_items uses ->all() for product_categories; UpdateOrderAction uses ->to_array().
- SetProductTaxExemptAction writes product_tax as 0; Set*TaxRate write raw rate; documented as percentages (AbstractTaxStrategy divides by 100).
- Docblock corrections by B11 (verify in 3.4): UpdateProductAction description (created->updated); UpdateCustomerAction @param order (shipping then billing); DuplicateCouponAction @throws removed; UpdateAccountProfileAction @throws removed; CreateOrderAction::create_address @throws removed.
- B11 followed old @throws policy: throw_if/throw_anyway raises described in summary text, not tagged (except PerformOrderAction keeps @throws ValidationException). Re-add per new policy in 3.x.
