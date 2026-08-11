import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import PageHeading from '@/components/ui/page-heading';
import { NEW_ITEM_ID } from '@/conf';
import { RouteConfig } from '@/config/route-config';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import {
  CouponFormSchema,
  type CouponFormInput,
  type CouponFormPayload,
} from '@/schemas/forms/coupon-form';
import {
  useCouponQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
} from '@/services/coupon';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import Page from '@/components/ui/page';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { getCouponBadgeInfo } from '@/pages/coupons/edit-coupon/config/coupon-badge';
import { isDefined } from '@/utils/object';
import CouponPreview from './components/coupon-preview';
// import ConditionsTab from './components/tabs/conditions-tab';
import Badge from '@/components/ui/badge';
import DetailsTab from './components/tabs/details-tab';
import { splitIsoDateTime } from './config/coupon-datetime';

// const DETAILS_TAB_FIELDS: (keyof CouponFormValues)[] = [
//   'method',
//   'title',
//   'code',
//   'discount_type',
//   'discount_target',
//   'discount_value_type',
//   'discount_amount',
//   'start_date',
//   'start_time',
//   'has_end_datetime',
//   'end_date',
//   'end_time',
// ];

// const CONDITIONS_TAB_FIELDS: (keyof CouponFormValues)[] = [
//   'has_usage_limit',
//   'usage_limit',
//   'has_customer_limit',
//   'customer_limit',
// ];

// TODO: Add tabs later
// const tabOptions = [
//   {
//     index: 'detail',
//     title: __('Details', 'kirki-ecommerce'),
//     icon: <Tag size={16} />,
//     fields: DETAILS_TAB_FIELDS,
//     hasTabError: (errors: FieldErrors<CouponFormValues>) =>
//       DETAILS_TAB_FIELDS.some((field) => Boolean(errors[field])),
//   },
//   {
//     index: 'targeting',
//     title: __('Targeting', 'kirki-ecommerce'),
//     icon: <CheckSquare size={16} />,
//     fields: [],
//     hasTabError: () => false,
//   },
//   {
//     index: 'conditions',
//     title: __('Conditions', 'kirki-ecommerce'),
//     icon: <CheckSquare size={16} />,
//     fields: CONDITIONS_TAB_FIELDS,
//     hasTabError: (errors: FieldErrors<CouponFormValues>) =>
//       CONDITIONS_TAB_FIELDS.some((field) => Boolean(errors[field]))
//     ,
//   }
// ] as const;


const EditCoupon = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === NEW_ITEM_ID;
  const activeTab = 'detail';
  // const [activeTab, setActiveTab] = useState(0);
  const [couponId, setCouponId] = useState<number>();

  const { data: couponInfo } = useCouponQuery(id ?? '');
  const createMutation = useCreateCouponMutation();
  const updateMutation = useUpdateCouponMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<CouponFormInput, unknown, CouponFormPayload>({
    resolver: zodResolver(CouponFormSchema),
    defaultValues: getDefaults(CouponFormSchema),
  });

  // TODO: uncomment later
  // const { errors } = form.formState;

  useEffect(() => {
    if (!couponInfo) {
      return;
    }

    setCouponId(couponInfo.id);

    const start = splitIsoDateTime(couponInfo.start_datetime);
    const end = splitIsoDateTime(couponInfo.end_datetime);

    form.reset(
      pickFormValues(CouponFormSchema, couponInfo, {
        discount_amount: couponInfo.base_discount_amount,
        start_date: start.date,
        start_time: start.time,
        end_date: end.date,
        end_time: end.time,
      }),
    );
  }, [couponInfo, form]);

  const handleSubmit = async (payload: CouponFormPayload) => {
    try {
      if (couponId) {
        await updateMutation.mutateAsync({ id: couponId, data: payload });
      } else {
        const response = await createMutation.mutateAsync(payload);

        if (isDefined(response.data) && isDefined(response.data.id)) {
          navigate(RouteConfig.Coupons.get('EditCoupon').buildLink({ id: response.data.id }));
        }
      }
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const couponBadgeInfo = useMemo(() => {
    if (isNew || !isDefined(couponInfo?.status)) {
      return null;
    }

    return getCouponBadgeInfo(couponInfo.status);
  }, [isNew, couponInfo?.status]);

  return (
    <Page>
      <Form {...form}>
        <PageHeading
          text={
            isNew
              ? __('New Coupon', 'kirki-ecommerce')
              : __('Edit Coupon', 'kirki-ecommerce')
          }
          type="primary"
          sticky
          actions={
            <>
              <Button variant="ghost" onClick={() => navigate(RouteConfig.Coupons.buildLink())}>
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                onClick={form.handleSubmit(handleSubmit)}
                loading={isSubmitting}
              >
                {isNew
                  ? __('Create', 'kirki-ecommerce')
                  : __('Save', 'kirki-ecommerce')}
              </Button>
            </>
          }
          hasBack
          onBack={() => navigate(RouteConfig.Coupons.buildLink())}
        >
          {
            !isNew && isDefined(couponBadgeInfo) && (
              <Badge variant={couponBadgeInfo.variant} >{couponBadgeInfo.text}</Badge>
            )
          }
        </PageHeading>

        <Container>
          <Flex gap={4}>
            <Flex direction="column" gap={4} basis="70%" grow={1}>
              {/* TODO: Tab will implement later */}
              {/* <Tabs
                value={String(activeTab)}
                onValueChange={(value) => setActiveTab(Number(value))}
              >
                <TabsList cssOverride={styles.tabsList}>
                  {
                    tabOptions.map((option, index) => {
                      const hasError = option.hasTabError(errors);
                      return (
                        <TabsTrigger
                          value={String(option.index)}
                          cssOverride={{ ...styles.tab, ...(hasError && activeTab !== option.index ? styles.tabError : {}) }}
                          key={index}
                        >
                          {option.icon}
                          <Text variant="small" weight='medium'>{option.title} {hasError && activeTab !== option.index && <span css={styles.tabErrorMark}>*</span>}</Text>
                        </TabsTrigger>
                      );
                    })
                  }
                </TabsList>
              </Tabs> */}

              {activeTab === 'detail' && <DetailsTab />}
              {/* {activeTab === 'targeting' && (
                <></>
              )}
              {activeTab === 'conditions' && <ConditionsTab />} */}
            </Flex>

            <div css={scoped(styles.sidebar)}>
              <CouponPreview />
            </div>
          </Flex>
        </Container>
      </Form>
    </Page>
  );
};

EditCoupon.displayName = 'EditCoupon';

export default EditCoupon;

const styles = defineStyles({
  tabsList: {
    backgroundColor: theme.colors.background.surface,
  },
  tab: {
    gap: theme.spacing[2],
    '&[data-state="active"]': {
      backgroundColor: theme.colors.background.fillSecondary,
      boxShadow: 'none',
    },
  },
  tabError: {
    border: '1px solid',
    borderColor: theme.colors.border.critical,
  },
  tabErrorMark: {
    color: theme.colors.text.critical,
  },
  sidebar: {
    flexBasis: '30%',
    position: 'sticky',
    top: '96px',
    alignSelf: 'flex-start',
  },
});
