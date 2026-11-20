import type {
  CouponDiscountType,
  CouponDiscountValueType,
} from '@/features/coupons/schemas/catalog/coupon';
import { isDefined } from '@/utils/object';

export const isAmountOff = (discountType?: CouponDiscountType) => discountType === 'amount-off';

export const hasDiscount = (discountType?: CouponDiscountType, amount?: number | string | null) =>
  isDefined(discountType) && isDefined(amount);

export const isPercentageDiscount = (discountValueType?: CouponDiscountValueType | null) =>
  discountValueType === 'percentage';
