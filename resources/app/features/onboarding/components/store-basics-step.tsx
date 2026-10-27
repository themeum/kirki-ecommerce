import ComboboxField from '@/components/form/combobox-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import StepLayout from '@/features/onboarding/components/step-layout';
import { getIndustryOptions } from '@/features/onboarding/lib/steps';
import { __ } from '@/wpi18n';

type StoreBasicsStepProps = {
  onContinue: () => void;
};

const StoreBasicsStep = ({ onContinue }: StoreBasicsStepProps) => {
  return (
    <StepLayout
      title={__("Let's set up your store", 'kirki-ecommerce')}
      footer={
        <Button size="lg" onClick={onContinue}>
          {__('Continue', 'kirki-ecommerce')}
        </Button>
      }
    >
      <TextField
        name="store_name"
        label={__('Store name', 'kirki-ecommerce')}
        placeholder={__('e.g., Acme Store', 'kirki-ecommerce')}
      />
      <ComboboxField
        name="industry"
        label={__('Industry', 'kirki-ecommerce')}
        placeholder={__('Select an industry', 'kirki-ecommerce')}
        searchPlaceholder={__('Search industries', 'kirki-ecommerce')}
        options={getIndustryOptions()}
      />
    </StepLayout>
  );
};

StoreBasicsStep.displayName = 'StoreBasicsStep';

export default StoreBasicsStep;
