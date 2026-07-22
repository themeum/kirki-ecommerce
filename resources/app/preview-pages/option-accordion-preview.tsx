import OptionAccordion from '@/components/option-accordion';
import Button from '@/components/ui/button';
import GroupOptionCardPreview from '@/preview-pages/group-option-card-preview';
import { LocationIcon, ShowMoreIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import ToggleButton from '@/components/ui/toggle-button';
import { __ } from '@/wpi18n';

const OptionAccordionPreview = () => {
  const rightActions = (
    <ActionGroup gap={8} style={{ alignItems: 'center' }}>
      <ToggleButton value={true} />
      <Button
        variant="ghost"
        size="sm"
        aria-label={__('More options', 'kirki-ecommerce')}
        style={{ transform: 'rotate(90deg)' }}
      >
        <ShowMoreIcon />
      </Button>
    </ActionGroup>
  );

  return (
    <div>
      <OptionAccordion
        header={'Zone 1- EU Countries'}
        subHeader={'3 Regions, 2 Shipping Methods'}
        leftIcon={<LocationIcon height={20} width={20} />}
        rightActions={rightActions}
      >
        <GroupOptionCardPreview />
      </OptionAccordion>
      <OptionAccordion
        header={'Zone 2- South Asia'}
        subHeader={'3 Regions, 2 Shipping Methods'}
        leftIcon={<LocationIcon height={20} width={20} />}
      >
        <GroupOptionCardPreview />
      </OptionAccordion>
      <OptionAccordion
        header={'Zone 3- International Shipping'}
        subHeader={'3 Regions, 2 Shipping Methods'}
        leftIcon={<LocationIcon height={20} width={20} />}
        rightActions={rightActions}
      >
        <GroupOptionCardPreview />
      </OptionAccordion>
    </div>
  );
};

OptionAccordionPreview.displayName = 'OptionAccordionPreview';

export default OptionAccordionPreview;
