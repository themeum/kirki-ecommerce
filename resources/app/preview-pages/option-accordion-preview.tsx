import OptionAccordion from '@/components/option-accordion';
import GroupOptionCardPreview from './group-option-card-preview';
import { LocationIcon, ShowMoreIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import ToggleButton from '@/molecules/toggle-button';

const OptionAccordionPreview = () => {
  const rightActions = (
    <ActionGroup gap={8} style={{ alignItems: 'center' }}>
      <ToggleButton value={true} />
      <Button
        type="ghost"
        size="small"
        icon={<ShowMoreIcon />}
        style={{ transform: 'rotate(90deg)' }}
      />
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
