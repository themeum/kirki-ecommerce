import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';

import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Spinner from '@/components/ui/spinner';
import { RouteConfig } from '@/config/route-config';
import { useSampleDataImport } from '@/features/home';
import {
  type MigrationStatus,
  useAutoMigration,
  useMigrationSourcesQuery,
} from '@/features/migration';
import BusinessInfoStep from '@/features/onboarding/components/business-info-step';
import EssentialsStep from '@/features/onboarding/components/essentials-step';
import OnboardingShell from '@/features/onboarding/components/onboarding-shell';
import SampleDataLink from '@/features/onboarding/components/sample-data-link';
import SetupCompleteStep, {
  type SetupFooterMode,
  type SetupSummaryRow,
} from '@/features/onboarding/components/setup-complete-step';
import StoreBasicsStep from '@/features/onboarding/components/store-basics-step';
import StoreTaxStep from '@/features/onboarding/components/store-tax-step';
import {
  type SetupRowState,
  type SetupStatus,
  useStaggeredRows,
} from '@/features/onboarding/hooks/use-staggered-rows';
import { readDraft, writeDraft } from '@/features/onboarding/lib/onboarding-draft';
import { beginSetupSession, endSetupSession } from '@/features/onboarding/lib/onboarding-status';
import { toFormPrefill } from '@/features/onboarding/lib/prefill';
import { getCompletionProgress } from '@/features/onboarding/lib/progress';
import {
  COMPLETION_STEP,
  getFormStepCount,
  getStepTitle,
  type OnboardingStep,
  STEP_FIELDS,
  TAX_STEP,
} from '@/features/onboarding/lib/steps';
import type { StoreSetupSummary } from '@/features/onboarding/schemas/catalog/store-setup';
import {
  type OnboardingFormInput,
  type OnboardingFormPayload,
  OnboardingFormSchema,
} from '@/features/onboarding/schemas/forms/onboarding-form';
import {
  useCreateStoreMutation,
  useOnboardingDefaultsQuery,
} from '@/features/onboarding/services/onboarding';
import { useAllCurrenciesQuery } from '@/features/settings';
import { getDefaults } from '@/libs/zod';
import { useCountriesQuery } from '@/services/country';
import { getErrorMessage } from '@/services/helpers';
import { defineStyles } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

const buildSummary = (
  payload: OnboardingFormPayload,
  countryName: string | undefined,
  currencySymbol: string | null | undefined,
): StoreSetupSummary => ({
  country: { code: payload.country, name: countryName ?? payload.country },
  currency: { code: payload.currency, symbol: currencySymbol },
  pages: [
    __('Shop', 'kirki-ecommerce'),
    __('Cart', 'kirki-ecommerce'),
    __('Checkout', 'kirki-ecommerce'),
    __('Account', 'kirki-ecommerce'),
  ],
  tax: payload.is_tax_enabled ? { is_tax_inclusive_price: payload.is_tax_inclusive_price } : null,
});

const toSummaryRows = (summary: StoreSetupSummary): SetupSummaryRow[] => {
  const rows: SetupSummaryRow[] = [
    { label: __('Location', 'kirki-ecommerce'), value: summary.country.name },
    {
      label: __('Currency', 'kirki-ecommerce'),
      value: summary.currency.symbol
        ? `${summary.currency.code} (${summary.currency.symbol})`
        : summary.currency.code,
    },
    { label: __('Store pages', 'kirki-ecommerce'), value: summary.pages.join(', ') },
  ];

  if (summary.tax) {
    rows.push({
      label: __('Tax', 'kirki-ecommerce'),
      value: summary.tax.is_tax_inclusive_price
        ? __('Included in price', 'kirki-ecommerce')
        : __('Added at checkout', 'kirki-ecommerce'),
    });
  }

  rows.push({
    label: __('Configurations', 'kirki-ecommerce'),
    value: [
      __('Essentials', 'kirki-ecommerce'),
      __('Shipping', 'kirki-ecommerce'),
      ...(summary.tax ? [__('Tax', 'kirki-ecommerce')] : []),
      __('Legal pages', 'kirki-ecommerce'),
    ].join(', '),
  });

  return rows;
};

const getInitialStep = (draft: ReturnType<typeof readDraft>): OnboardingStep => {
  if (!draft) {
    return 0;
  }

  if (draft.step === TAX_STEP && draft.values.is_tax_enabled !== true) {
    return 2;
  }

  return draft.step;
};

type OnboardingWizardFormProps = {
  prefill: Partial<OnboardingFormInput>;
};

const OnboardingWizardForm = ({ prefill }: OnboardingWizardFormProps) => {
  const navigate = useNavigate();
  const [initialDraft] = useState(readDraft);
  const [step, setStep] = useState<OnboardingStep>(() => getInitialStep(initialDraft));
  const [submittedPayload, setSubmittedPayload] = useState<OnboardingFormPayload | null>(null);
  const [setupRunId, setSetupRunId] = useState(0);
  const { data: countries = [] } = useCountriesQuery({ limit: -1 });
  const { data: currencies = [] } = useAllCurrenciesQuery();
  const createStore = useCreateStoreMutation();

  const form = useForm<OnboardingFormInput, unknown, OnboardingFormPayload>({
    resolver: zodResolver(OnboardingFormSchema),
    // Steps are checked with `trigger()`, which doesn't count as a submit, so the default
    // re-validation never kicks in. Validating on change clears an error as it's fixed.
    mode: 'onChange',
    defaultValues: { ...getDefaults(OnboardingFormSchema), ...prefill, ...initialDraft?.values },
  });
  const isTaxCollected = useWatch({ control: form.control, name: 'is_tax_enabled' }) === true;

  useEffect(() => {
    if (step === COMPLETION_STEP) {
      return;
    }

    writeDraft({ step, values: form.getValues() });

    const subscription = form.watch((values) => {
      writeDraft({ step, values });
    });

    return () => subscription.unsubscribe();
  }, [form, step]);

  const goToNextStep = async () => {
    if (step === COMPLETION_STEP || step === TAX_STEP) {
      return;
    }

    const isStepValid = await form.trigger(STEP_FIELDS[step]);

    if (isStepValid) {
      setStep((step + 1) as OnboardingStep);
    }
  };

  const goToPreviousStep = () => {
    setStep((current) => Math.max(0, current - 1) as OnboardingStep);
  };

  const handleCreateStore = form.handleSubmit((payload) => {
    if (createStore.isPending) {
      return;
    }

    beginSetupSession();
    setSubmittedPayload(payload);
    setStep(COMPLETION_STEP);
    createStore.mutate(payload);
  });

  const handleRetry = () => {
    if (submittedPayload && !createStore.isPending) {
      setSetupRunId((runId) => runId + 1);
      createStore.mutate(submittedPayload);
    }
  };

  useEffect(() => endSetupSession, []);

  const leaveTo = (path: string) => {
    void navigate(path, { replace: true });
  };

  const sampleData = useSampleDataImport({
    onLoaded: () => leaveTo(RouteConfig.Products.template),
    loadedPauseMs: 0,
  });

  const summaryRows = useMemo(() => {
    if (createStore.data?.data) {
      return toSummaryRows(createStore.data.data);
    }

    if (!submittedPayload) {
      return [];
    }

    const countryName = countries.find((item) => item.code === submittedPayload.country)?.name;
    const currencySymbol = currencies.find(
      (item) => item.code === submittedPayload.currency,
    )?.symbol;

    return toSummaryRows(buildSummary(submittedPayload, countryName, currencySymbol));
  }, [createStore.data, submittedPayload, countries, currencies]);

  const setupStatus: SetupStatus = createStore.isError
    ? 'error'
    : createStore.isSuccess
      ? 'success'
      : 'pending';

  const rowStates = useStaggeredRows({
    rowCount: summaryRows.length,
    setupStatus,
    runId: setupRunId,
  });
  const isSetupReady = rowStates.length > 0 && rowStates.every((state) => state === 'completed');
  const migrationSources = useMigrationSourcesQuery();
  const migrationSource = migrationSources.data?.find((source) => source.version.supported);
  const migration = useAutoMigration({
    source: migrationSource?.id ?? '',
    isEnabled: migrationSource !== undefined && step === COMPLETION_STEP && isSetupReady,
  });
  const isMigrationPending =
    migrationSource !== undefined &&
    (migration.status === 'waiting' || migration.status === 'running');
  const isBusy = !isSetupReady || migrationSources.isPending === true || isMigrationPending;

  const completionRows = useMemo((): SetupSummaryRow[] => {
    if (!migrationSource || summaryRows.length === 0) {
      return summaryRows;
    }

    return [
      ...summaryRows,
      {
        label: sprintf(
          /* translators: %s: name of the plugin the data comes from. */
          __('%s Migration', 'kirki-ecommerce'),
          migrationSource.label,
        ),
        value: __('Products, customers, orders and settings', 'kirki-ecommerce'),
        percent: migration.percent,
      },
    ];
  }, [summaryRows, migrationSource, migration.percent]);

  const completionRowStates = useMemo((): SetupRowState[] => {
    if (completionRows.length === rowStates.length) {
      return rowStates;
    }

    const migrationRowStates: Record<MigrationStatus, SetupRowState> = {
      waiting: isSetupReady ? 'in-progress' : 'waiting',
      running: 'in-progress',
      done: 'completed',
      failed: 'stopped',
    };

    return [...rowStates, migrationRowStates[migration.status]];
  }, [completionRows, rowStates, migration.status, isSetupReady]);

  const getFooterMode = (): SetupFooterMode => {
    if (createStore.isError) {
      return 'retry-setup';
    }

    if (isBusy) {
      return 'hidden';
    }

    if (!migrationSource) {
      return 'default';
    }

    return migration.status === 'failed' ? 'retry-migration' : 'dashboard-only';
  };

  const footerMode = getFooterMode();

  const getProgressMessage = () => {
    const activeRow = rowStates.indexOf('in-progress');

    if (activeRow !== -1) {
      return sprintf(
        /* translators: %s: the setup row that is in progress now, for example Currency. */
        __('Setting up · %s', 'kirki-ecommerce'),
        summaryRows[activeRow]?.label ?? '',
      );
    }

    if (migrationSource && isSetupReady && isMigrationPending) {
      return sprintf(
        /* translators: %s: the part of the migration that is running now, for example Products 1-30 of 100. */
        __('Migrating · %s', 'kirki-ecommerce'),
        migration.detail,
      );
    }

    return '';
  };

  const completionProgress = {
    percent: getCompletionProgress({
      stepCount: getFormStepCount(isTaxCollected),
      rowStates,
      hasMigration: migrationSource !== undefined,
      migrationPercent: migration.percent,
    }),
    title: getStepTitle(COMPLETION_STEP),
    message: getProgressMessage(),
  };

  const errorMessage = createStore.isError
    ? createStore.error
      ? getErrorMessage(createStore.error)
      : __('Store setup failed.', 'kirki-ecommerce')
    : footerMode === 'retry-migration'
      ? (migration.errorMessage ?? __('The migration stopped.', 'kirki-ecommerce'))
      : undefined;

  return (
    <OnboardingShell
      step={step}
      stepCount={getFormStepCount(isTaxCollected)}
      progressOverride={step === COMPLETION_STEP ? completionProgress : undefined}
      afterCard={
        step === COMPLETION_STEP &&
        footerMode === 'default' && (
          <SampleDataLink
            phase={sampleData.phase}
            progress={sampleData.progress}
            isDisabled={!isSetupReady}
            onLoad={() => void sampleData.start()}
          />
        )
      }
    >
      <Form {...form}>
        {step === 0 && <StoreBasicsStep onContinue={() => void goToNextStep()} />}
        {step === 1 && (
          <BusinessInfoStep onBack={goToPreviousStep} onContinue={() => void goToNextStep()} />
        )}
        {step === 2 && (
          <EssentialsStep
            onBack={goToPreviousStep}
            onContinue={() => void goToNextStep()}
            onCreateStore={() => void handleCreateStore()}
          />
        )}
        {step === TAX_STEP && (
          <StoreTaxStep onBack={goToPreviousStep} onCreateStore={() => void handleCreateStore()} />
        )}
        {step === COMPLETION_STEP && (
          <SetupCompleteStep
            rows={completionRows}
            rowStates={completionRowStates}
            footerMode={footerMode}
            errorMessage={errorMessage}
            isActionDisabled={sampleData.isImporting}
            onRetry={createStore.isError ? handleRetry : migration.retry}
            onAddFirstProduct={() => leaveTo(RouteConfig.Products.get('CreateProduct').buildLink())}
            onGoToDashboard={() => leaveTo(RouteConfig.Home.template)}
          />
        )}
      </Form>
    </OnboardingShell>
  );
};

OnboardingWizardForm.displayName = 'OnboardingWizardForm';

const OnboardingWizard = () => {
  const defaults = useOnboardingDefaultsQuery();
  const countries = useCountriesQuery({ limit: -1 });
  const currencies = useAllCurrenciesQuery();
  const isLoading = defaults.isPending || countries.isPending || currencies.isPending;

  const prefill = useMemo(
    () =>
      toFormPrefill(defaults.data, {
        countryCodes: (countries.data ?? []).map((item) => item.code),
        currencyCodes: (currencies.data ?? []).map((item) => item.code),
      }),
    [defaults.data, countries.data, currencies.data],
  );

  if (isLoading) {
    return (
      <OnboardingShell step={0} stepCount={getFormStepCount(false)}>
        <Flex align="center" justify="center" cssOverride={styles.loading}>
          <Spinner cssOverride={styles.spinner} />
        </Flex>
      </OnboardingShell>
    );
  }

  return <OnboardingWizardForm prefill={prefill} />;
};

OnboardingWizard.displayName = 'OnboardingWizard';

export default OnboardingWizard;

const styles = defineStyles({
  loading: {
    flex: 1,
  },
  spinner: {
    width: '20px',
    height: '20px',
    '& svg': {
      width: '20px',
      height: '20px',
    },
  },
});
