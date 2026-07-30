import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckSquare, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FieldErrors, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import PageHeading from '@/components/ui/page-heading';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NEW_ITEM_ID } from '@/conf';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import {
  CouponFormSchema,
  type CouponFormOutput,
  type CouponFormValues,
} from '@/schemas/forms/coupon-form';
import {
  useCouponQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
} from '@/services/coupon';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import type { CouponFormData } from '@/types';
import { __ } from '@/wpi18n';

import Page from '@/components/ui/page';
import Text from '@/components/ui/text';
import { END_OF_DAY_TIME, START_OF_DAY_TIME } from '@/libs/date';
import { getDefaults } from '@/libs/zod';
import CouponPreview from './components/coupon-preview';
import ConditionsTab from './components/tabs/conditions-tab';
import DetailsTab from './components/tabs/details-tab';
import { mergeDateTime, splitIsoDateTime } from './config/coupon-datetime';

const DETAILS_TAB_FIELDS: (keyof CouponFormValues)[] = [
  'method',
  'title',
  'code',
  'discount_type',
  'discount_target',
  'discount_value_type',
  'discount_amount',
  'start_date',
  'start_time',
  'has_end_datetime',
  'end_date',
  'end_time',
];

const CONDITIONS_TAB_FIELDS: (keyof CouponFormValues)[] = [
  'has_usage_limit',
  'usage_limit',
  'has_customer_limit',
  'customer_limit',
];

const tabOptions = [
  {
    index: 0,
    title: __('Details', 'kirki-ecommerce'),
    icon: <Tag size={16} />,
    fields: DETAILS_TAB_FIELDS,
    hasTabError: (errors: FieldErrors<CouponFormValues>) =>
      DETAILS_TAB_FIELDS.some((field) => Boolean(errors[field])),
    hidden: false,
  },
  {
    index: 1,
    title: __('Targeting', 'kirki-ecommerce'),
    icon: <CheckSquare size={16} />,
    fields: [],
    hasTabError: () => false,
    hidden: true,
  },
  {
    index: 2,
    title: __('Conditions', 'kirki-ecommerce'),
    icon: <CheckSquare size={16} />,
    fields: CONDITIONS_TAB_FIELDS,
    hasTabError: (errors: FieldErrors<CouponFormValues>) =>
      CONDITIONS_TAB_FIELDS.some((field) => Boolean(errors[field]))
    ,
    hidden: true,
  }
] as const;


const EditCoupon = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === NEW_ITEM_ID;
  const [activeTab, setActiveTab] = useState(0);
  const [couponId, setCouponId] = useState<number | undefined>();

  const { data: couponResponse } = useCouponQuery(id ?? '');
  const createMutation = useCreateCouponMutation();
  const updateMutation = useUpdateCouponMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<CouponFormValues, unknown, CouponFormOutput>({
    resolver: zodResolver(CouponFormSchema),
    defaultValues: getDefaults(CouponFormSchema._def.schema),
  });

  const { errors } = form.formState;

  useEffect(() => {
    if (!couponResponse) {
      return;
    }

    const start = splitIsoDateTime(couponResponse.start_datetime);
    const end = splitIsoDateTime(couponResponse.end_datetime);

    setCouponId(couponResponse.id);
    form.reset({
      method: couponResponse.method,
      title: couponResponse.title ?? '',
      code: couponResponse.code ?? '',
      discount_type: couponResponse.discount_type,
      discount_target: couponResponse.discount_target ?? 'order',
      discount_value_type: couponResponse.discount_value_type ?? null,
      discount_amount:
        couponResponse.discount_amount != null
          ? String(couponResponse.discount_amount)
          : '',
      start_date: start.date,
      start_time: start.time,
      has_end_datetime: couponResponse.has_end_datetime,
      end_date: end.date,
      end_time: end.time,
      has_usage_limit: couponResponse.has_usage_limit,
      usage_limit:
        couponResponse.usage_limit != null
          ? String(couponResponse.usage_limit)
          : '',
      has_customer_limit: couponResponse.has_customer_limit,
      customer_limit:
        couponResponse.customer_limit != null
          ? String(couponResponse.customer_limit)
          : '',
    });
  }, [couponResponse, form]);

  const handleSubmit = async (values: CouponFormOutput) => {
    const isAmountOff = values.discount_type === 'amount-off';

    const payload: CouponFormData = {
      method: values.method,
      title: values.title,
      code: values.method === 'code' ? values.code?.trim() || null : null,
      discount_type: values.discount_type,
      discount_target: isAmountOff ? values.discount_target ?? null : null,
      discount_value_type: isAmountOff
        ? values.discount_value_type ?? null
        : null,
      discount_amount:
        isAmountOff && values.discount_amount
          ? Number(values.discount_amount)
          : null,
      start_datetime: mergeDateTime(
        values.start_date ?? '',
        values.start_time ?? START_OF_DAY_TIME,
      ),
      has_end_datetime: values.has_end_datetime,
      end_datetime: values.has_end_datetime
        ? mergeDateTime(values.end_date ?? '', values.end_time ?? END_OF_DAY_TIME)
        : null,
      has_usage_limit: values.has_usage_limit,
      usage_limit: values.has_usage_limit ? Number(values.usage_limit) : null,
      has_customer_limit: values.has_customer_limit,
      customer_limit: values.has_customer_limit
        ? Number(values.customer_limit)
        : null,
    };

    try {
      if (couponId) {
        await updateMutation.mutateAsync({ id: couponId, data: payload });
      } else {
        const response = await createMutation.mutateAsync(payload);
        navigate('/coupons/' + response.data.id);
      }
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

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
              <Button variant="ghost" onClick={() => navigate('/coupons')}>
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
        />

        <Container>
          <Flex gap={4}>
            <Flex direction="column" gap={4} basis="70%" grow={1}>
              <Tabs
                value={String(activeTab)}
                onValueChange={(value) => setActiveTab(Number(value))}
              >
                <TabsList css={styles.tabsList}>
                  {
                    tabOptions.map((option, index) => {
                      const hasError = option.hasTabError(errors);

                      if (option?.hidden) {
                        return null;
                      }

                      return (
                        <TabsTrigger
                          value={String(option.index)}
                          css={css([styles.tab, hasError && activeTab !== option.index && styles.tabError])}
                          key={index}
                        >
                          {option.icon}
                          <Text variant="small" weight='medium'>{option.title} {hasError && activeTab !== option.index && <span css={styles.tabErrorMark}>*</span>}</Text>
                        </TabsTrigger>
                      );
                    })
                  }
                </TabsList>
              </Tabs>

              {activeTab === 0 && <DetailsTab />}
              {activeTab === 1 && (
                // TODO: Targeting will implement later
                <></>
              )}
              {activeTab === 2 && <ConditionsTab />}
            </Flex>

            <div css={styles.sidebar}>
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

const styles = {
  tabsList: scoped({
    backgroundColor: theme.colors.background.surface,
  }),
  tab: scoped({
    gap: theme.spacing[2],
    '&[data-state="active"]': {
      backgroundColor: theme.colors.background.fillSecondary,
      boxShadow: 'none',
    },
  }),
  tabError: scoped({
    border: '1px solid',
    borderColor: theme.colors.border.critical,
  }),
  tabErrorMark: scoped({
    color: theme.colors.text.critical,
  }),
  sidebar: scoped({
    flexBasis: '30%',
    position: 'sticky',
    top: '96px',
    alignSelf: 'flex-start',
  }),
};
