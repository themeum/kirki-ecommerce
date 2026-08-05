import OptionAccordion from '@/components/option-accordion';
import ActionGroup from '@/components/ui/action-group';
import { LocationIcon } from '@/icons';
import GroupOptionCardPreview from '@/preview-pages/group-option-card-preview';

const OptionAccordionPreview = () => {
  const rightActions = (
    <ActionGroup gap={2}>

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
