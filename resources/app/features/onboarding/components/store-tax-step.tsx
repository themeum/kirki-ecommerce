import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import BooleanRadioField from '@/features/onboarding/components/fields/boolean-radio-field';
import StepLayout from '@/features/onboarding/components/step-layout';
import StorePagesNote from '@/features/onboarding/components/store-pages-note';
import { __ } from '@/wpi18n';

type StoreTaxStepProps = {
  onBack: () => void;
  onCreateStore: () => void;
};

const StoreTaxStep = ({ onBack, onCreateStore }: StoreTaxStepProps) => {
  return (
    <StepLayout
      title={__('Tax Info', 'kirki-ecommerce')}
      onBack={onBack}
      footer={
        <>
          <StorePagesNote />
          <Button size="lg" onClick={onCreateStore}>
            {__('Create Store', 'kirki-ecommerce')}
          </Button>
        </>
      }
    >
      <BooleanRadioField
        name="is_tax_inclusive_price"
        label={__('Prices on your products', 'kirki-ecommerce')}
        options={[
          { value: true, label: __('Including tax', 'kirki-ecommerce') },
          { value: false, label: __('Excluding Tax', 'kirki-ecommerce') },
        ]}
      />
      <TextField
        name="store_tax_id"
        label={__('Tax ID (optional)', 'kirki-ecommerce')}
        placeholder={__('Permit or VAT number', 'kirki-ecommerce')}
        infoText={__('The Tax ID prints on your invoices.', 'kirki-ecommerce')}
      />
    </StepLayout>
  );
};

StoreTaxStep.displayName = 'StoreTaxStep';

export default StoreTaxStep;
