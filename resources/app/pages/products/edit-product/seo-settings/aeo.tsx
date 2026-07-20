import TextareaField from '@/components/form/textarea-field';
import { __ } from '@/wpi18n';

const AEO = () => {
  return (
    <TextareaField
      name="llm_instructions"
      label={__('LLM Instruction', 'kirki-ecommerce')}
      placeholder={__('llm instructions', 'kirki-ecommerce')}
      rows={5}
    />
  );
};

AEO.displayName = 'AEO';

export default AEO;
