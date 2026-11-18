import type {
  CouponDiscountType,
  CouponDiscountValueType,
} from '@/features/coupons/schemas/catalog/coupon';
import { isDefined } from '@/utils/object';

export const isAmountOff = (discountType?: CouponDiscountType) => discountType === 'amount-off';

export const hasDiscountAmount = (
  discountType?: CouponDiscountType,
  amount?: number | string | null,
) => isAmountOff(discountType) && isDefined(amount);

export const isPercentageDiscount = (discountValueType?: CouponDiscountValueType | null) =>
  discountValueType === 'percentage';
