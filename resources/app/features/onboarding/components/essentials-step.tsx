import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import Button from '@/components/ui/button';
import ChoiceButtonsField from '@/features/onboarding/components/fields/choice-buttons-field';
import CurrencyField from '@/features/onboarding/components/fields/currency-field';
import StepLayout from '@/features/onboarding/components/step-layout';
import StorePagesNote from '@/features/onboarding/components/store-pages-note';
import type { OnboardingFormInput } from '@/features/onboarding/schemas/forms/onboarding-form';
import { useAllCurrenciesQuery } from '@/features/settings';
import { useCountriesQuery } from '@/services/country';
import { __ } from '@/wpi18n';

type EssentialsStepProps = {
  onBack: () => void;
  onContinue: () => void;
  onCreateStore: () => void;
};

const EssentialsStep = ({ onBack, onContinue, onCreateStore }: EssentialsStepProps) => {
  const { getValues, setValue } = useFormContext<OnboardingFormInput>();
  const isTaxCollected = useWatch<OnboardingFormInput, 'is_tax_collected'>({
    name: 'is_tax_collected',
  });
  const { data: countries = [] } = useCountriesQuery({ limit: -1 });
  const { data: currencies = [] } = useAllCurrenciesQuery();
  const hasAttemptedPreselection = useRef(false);

  useEffect(() => {
    if (hasAttemptedPreselection.current || countries.length === 0 || currencies.length === 0) {
      return;
    }

    hasAttemptedPreselection.current = true;

    if (getValues('currency')) {
      return;
    }

    const countryCurrency = countries.find((item) => item.code === getValues('country'))?.currency;
    const isKnownCurrency = currencies.some((currency) => currency.code === countryCurrency);

    if (countryCurrency && isKnownCurrency) {
      setValue('currency', countryCurrency, { shouldDirty: true });
    }
  }, [countries, currencies, getValues, setValue]);

  return (
    <StepLayout
      title={__('Setup the essentials', 'kirki-ecommerce')}
      onBack={onBack}
      footer={
        isTaxCollected ? (
          <Button size="lg" onClick={onContinue}>
            {__('Continue', 'kirki-ecommerce')}
          </Button>
        ) : (
          <>
            <StorePagesNote />
            <Button size="lg" onClick={onCreateStore}>
              {__('Create Store', 'kirki-ecommerce')}
            </Button>
          </>
        )
      }
    >
      <CurrencyField name="currency" />
      <ChoiceButtonsField
        name="is_tax_collected"
        label={__('Collect sales tax?', 'kirki-ecommerce')}
        options={[
          { value: true, label: __('Yes', 'kirki-ecommerce') },
          { value: false, label: __('No, not yet', 'kirki-ecommerce') },
        ]}
      />
    </StepLayout>
  );
};

EssentialsStep.displayName = 'EssentialsStep';

export default EssentialsStep;
