import type {
  CouponDiscountTarget,
  CouponDiscountType,
  CouponDiscountValueType,
  CouponMethod,
} from '@/schemas/catalog/coupon';

export type { Coupon } from '@/schemas/catalog/coupon';

type CouponFormData = {
  method: CouponMethod;
  title: string;
  code?: string | null;
  discount_type: CouponDiscountType;
  discount_target?: CouponDiscountTarget | null;
  discount_value_type?: CouponDiscountValueType | null;
  discount_amount?: number | null;
  start_datetime?: Date | null;
  has_end_datetime: boolean;
  end_datetime?: Date | null;
  has_usage_limit: boolean;
  usage_limit?: number | null;
  has_customer_limit: boolean;
  customer_limit?: number | null;
};

export type { CouponFormData };
