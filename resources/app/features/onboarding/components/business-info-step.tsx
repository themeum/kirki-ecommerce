import { MinusCircle, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import CountryField from '@/components/form/country-field';
import StateField from '@/components/form/state-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import StepLayout from '@/features/onboarding/components/step-layout';
import { detectCountry } from '@/features/onboarding/lib/detect-country';
import type { OnboardingFormInput } from '@/features/onboarding/schemas/forms/onboarding-form';
import { useCountriesQuery } from '@/services/country';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type BusinessInfoStepProps = {
  onBack: () => void;
  onContinue: () => void;
};

const hasAddressValues = (address: OnboardingFormInput['store_address']) =>
  Object.values(address ?? {}).some(Boolean);

const BusinessInfoStep = ({ onBack, onContinue }: BusinessInfoStepProps) => {
  const { getValues, setValue } = useFormContext<OnboardingFormInput>();
  const country = useWatch<OnboardingFormInput, 'country'>({ name: 'country' });
  const { data: countries = [] } = useCountriesQuery({ limit: -1 });
  const [isAddressOpen, setIsAddressOpen] = useState(() =>
    hasAddressValues(getValues('store_address')),
  );
  const hasAttemptedDetection = useRef(false);

  useEffect(() => {
    if (hasAttemptedDetection.current || countries.length === 0) {
      return;
    }

    hasAttemptedDetection.current = true;

    if (getValues('country')) {
      return;
    }

    const detectedCountry = detectCountry(countries.map((item) => item.code));

    if (detectedCountry) {
      setValue('country', detectedCountry, { shouldDirty: true });
    }
  }, [countries, getValues, setValue]);

  return (
    <StepLayout
      title={__('Where do you sell from?', 'kirki-ecommerce')}
      onBack={onBack}
      footer={
        <Button size="lg" onClick={onContinue}>
          {__('Continue', 'kirki-ecommerce')}
        </Button>
      }
    >
      <CountryField name="country" label={__('Country', 'kirki-ecommerce')} />

      {isAddressOpen ? (
        <Flex direction="column" gap={4}>
          <div css={scoped({ position: 'relative' })}>
            <TextField
              name="store_address.address_line_1"
              label={__('Address Line 1', 'kirki-ecommerce')}
              placeholder={__('Enter Address Line 1', 'kirki-ecommerce')}
            />
            <Button
              variant="ghost"
              size="icon-xs"
              cssOverride={{
                position: 'absolute',
                top: 0,
                right: 0,
              }}
              onClick={() => setIsAddressOpen(false)}
            >
              <MinusCircle />
            </Button>
          </div>
          <TextField
            name="store_address.address_line_2"
            label={__('Address Line 2', 'kirki-ecommerce')}
            placeholder={__('Enter Address Line 2', 'kirki-ecommerce')}
          />
          <Grid columns={3} gap={3}>
            <TextField
              name="store_address.city"
              label={__('City', 'kirki-ecommerce')}
              placeholder={__('Enter City', 'kirki-ecommerce')}
            />
            <StateField
              name="store_address.state"
              country={country}
              label={__('State / Province', 'kirki-ecommerce')}
            />
            <TextField
              name="store_address.postal_code"
              label={__('Postcode / Zip', 'kirki-ecommerce')}
              placeholder={__('Postcode / Zip', 'kirki-ecommerce')}
            />
          </Grid>
        </Flex>
      ) : (
        <Button
          variant="link"
          onClick={() => setIsAddressOpen(true)}
          cssOverride={styles.addAddress}
        >
          <Plus size={16} />
          {__('Add address', 'kirki-ecommerce')}
        </Button>
      )}
    </StepLayout>
  );
};

BusinessInfoStep.displayName = 'BusinessInfoStep';

export default BusinessInfoStep;

const styles = defineStyles({
  addAddress: {
    ...theme.typography.small('medium'),
    alignSelf: 'flex-start',
    color: theme.colors.text.emphasis,
    '&:hover': {
      color: theme.colors.text.emphasis,
    },
  },
});
