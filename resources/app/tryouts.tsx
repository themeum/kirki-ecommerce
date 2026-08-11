import RichText from '@/components/rich-text';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import Switch from '@/components/ui/switch';
import Text from '@/components/ui/text';
import { endpoints } from '@/config/endpoints';
import { ShowMoreIcon } from '@/icons';
import { apiClient } from '@/libs/api';
import AccordionPreview from '@/preview-pages/accordion-preview';
import ActionGroupPreview from '@/preview-pages/action-group-preview';
import AlertboxPreview from '@/preview-pages/alertbox-preview';
import ButtonPreview from '@/preview-pages/button-preview';
import CardPreview from '@/preview-pages/card-preview';
import CheckboxPreview from '@/preview-pages/checkbox-preview';
import ColorPickerPreview from '@/preview-pages/color-picker-preview';
import DialogPreview from '@/preview-pages/dialog-preview';
import DropdownMenuPreview from '@/preview-pages/dropdown-menu-preview';
import DrowdownPreview from '@/preview-pages/drowdown-preview';
import GridPreview from '@/preview-pages/grid-preview';
import GridTemplatePreview from '@/preview-pages/grid-template-preview';
import HeadingPreview from '@/preview-pages/heading-preview';
import IconsPreview from '@/preview-pages/icons-preview';
import InputPreview from '@/preview-pages/input-preview';
import MediaGalleryPreview from '@/preview-pages/media-gallery-preview';
import MediaSelectorPreview from '@/preview-pages/media-selector-preview';
import MultiSelectPreview from '@/preview-pages/multi-select-preview';
import OptionAccordionPreview from '@/preview-pages/option-accordion-preview';
import PageHeadingPreview from '@/preview-pages/page-heading-preview';
import PageNavbarPreview from '@/preview-pages/page-navbar-preview';
import PlaceholderPreview from '@/preview-pages/placeholder-preview';
import PopoverPreview from '@/preview-pages/popover-preview';
import ProgressBarPreview from '@/preview-pages/progress-bar-preview';
import RadioGroupPreview from '@/preview-pages/radio-group-preview';
import SelectInputPreview from '@/preview-pages/select-input-preview';
import SelectPreview from '@/preview-pages/select-preview';
import SeparatorPreview from '@/preview-pages/separator-preview';
import StackedItemsPreview from '@/preview-pages/stacked-items-preview';
import TabPreview from '@/preview-pages/tab-preview';
import TablePreview from '@/preview-pages/table-preview';
import TabsPreview from '@/preview-pages/tabs-preview';
import ThumbnailPreview from '@/preview-pages/thumbnail-preview';
import UiBadgePreview from '@/preview-pages/ui-badge-preview';
import UiButtonPreview from '@/preview-pages/ui-button-preview';
import UiCheckboxPreview from '@/preview-pages/ui-checkbox-preview';
import UiFormPreview from '@/preview-pages/ui-form-preview';
import UiInputPreview from '@/preview-pages/ui-input-preview';
import UiLabelPreview from '@/preview-pages/ui-label-preview';
import UiPopoverPreview from '@/preview-pages/ui-popover-preview';
import UiRadioGroupPreview from '@/preview-pages/ui-radio-group-preview';
import UiSelectPreview from '@/preview-pages/ui-select-preview';
import UiSwitchPreview from '@/preview-pages/ui-switch-preview';
import UiTextPreview from '@/preview-pages/ui-text-preview';
import UiTextareaPreview from '@/preview-pages/ui-textarea-preview';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const Tryouts = () => {
  return (
    <>
      <PageHeading
        text="New Collection"
        type="primary"
        sticky
        actions={
          <>
            <Button
              variant="ghost"
              aria-label={__('More options', 'kirki-ecommerce')}
            >
              <ShowMoreIcon />
            </Button>
            <Button variant="ghost">
              {__('Save as Draft', 'kirki-ecommerce')}
            </Button>
            <Button variant="primary">{__('Create', 'kirki-ecommerce')}</Button>
          </>
        }
        hasBack
      />
      <Container>
        <Flex direction="column" gap={4}>
          <Text weight="semibold">UI Components</Text>

          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
            </CardHeader>
            <CardContent>
              <UiButtonPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Badge</CardTitle>
            </CardHeader>
            <CardContent>
              <UiBadgePreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Text</CardTitle>
            </CardHeader>
            <CardContent>
              <UiTextPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Input</CardTitle>
            </CardHeader>
            <CardContent>
              <UiInputPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Textarea</CardTitle>
            </CardHeader>
            <CardContent>
              <UiTextareaPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Label</CardTitle>
            </CardHeader>
            <CardContent>
              <UiLabelPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Checkbox</CardTitle>
            </CardHeader>
            <CardContent>
              <UiCheckboxPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Radio Group</CardTitle>
            </CardHeader>
            <CardContent>
              <UiRadioGroupPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Select</CardTitle>
            </CardHeader>
            <CardContent>
              Select
              <UiSelectPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Switch</CardTitle>
            </CardHeader>
            <CardContent>
              <UiSwitchPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Form</CardTitle>
            </CardHeader>
            <CardContent>
              <UiFormPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Card</CardTitle>
            </CardHeader>
            <CardContent>
              <CardPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Dialog</CardTitle>
            </CardHeader>
            <CardContent>
              <DialogPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Dropdown Menu</CardTitle>
            </CardHeader>
            <CardContent>
              <DropdownMenuPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Popover</CardTitle>
            </CardHeader>
            <CardContent>
              <UiPopoverPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Separator</CardTitle>
            </CardHeader>
            <CardContent>
              <SeparatorPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Tabs</CardTitle>
            </CardHeader>
            <CardContent>
              <TabsPreview />
            </CardContent>
          </Card>

          <Text weight="semibold">Composites & Layout</Text>

          <Button
            variant="primary"
            onClick={() => {
              void apiClient.get(endpoints.APP_CONFIG);
            }}
          >
            App Config
          </Button>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Page Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <PageNavbarPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardContent>
              <OptionAccordionPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Stacked Items</CardTitle>
            </CardHeader>
            <CardContent>
              <StackedItemsPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Progress Bar</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressBarPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardContent>
              <ColorPickerPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Rich Text</CardTitle>
            </CardHeader>
            <CardContent>
              <RichText
                onChange={(content) => console.log(content)}
                label="Rich Text Editor"
              />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Select Input</CardTitle>
            </CardHeader>
            <CardContent>
              <SelectInputPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Placeholder</CardTitle>
            </CardHeader>
            <CardContent>
              <PlaceholderPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Thumbnail</CardTitle>
            </CardHeader>
            <CardContent>
              <ThumbnailPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Grid</CardTitle>
            </CardHeader>
            <CardContent>
              <GridPreview />
            </CardContent>
          </Card>
          <GridTemplatePreview />
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Action Group</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionGroupPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Multi Select</CardTitle>
            </CardHeader>
            <CardContent>
              <MultiSelectPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Tab</CardTitle>
            </CardHeader>
            <CardContent>
              <Flex direction="column" gap={4}>
                <TabPreview />
              </Flex>
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Heading</CardTitle>
            </CardHeader>
            <CardContent>
              <Flex direction="column" gap={4}>
                <HeadingPreview />
              </Flex>
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Page Heading</CardTitle>
            </CardHeader>
            <CardContent>
              <PageHeadingPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Button + Tooltip</CardTitle>
            </CardHeader>
            <CardContent>
              <ButtonPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Flex</CardTitle>
            </CardHeader>
            <CardContent>
              <Flex gap={10}>
                <div>Flex Item 1</div>
                <div>Flex Item 2</div>
                <div>Flex Item 3</div>
              </Flex>
              <Flex direction="column" gap={3} cssOverride={{ marginTop: 16 }}>
                <div>Flex Item 1</div>
                <div>Flex Item 2</div>
                <div>Flex Item 3</div>
              </Flex>
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Toggle Button</CardTitle>
            </CardHeader>
            <CardContent>
              <Switch />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Radio Group</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroupPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Checkbox</CardTitle>
            </CardHeader>
            <CardContent>
              <CheckboxPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Input</CardTitle>
            </CardHeader>
            <CardContent>
              <InputPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Combobox Select</CardTitle>
            </CardHeader>
            <CardContent>
              <SelectPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Accordion</CardTitle>
            </CardHeader>
            <CardContent>
              <AccordionPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Dialog (legacy popover)</CardTitle>
            </CardHeader>
            <CardContent>
              <PopoverPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Alert Dialog</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertboxPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Dropdown</CardTitle>
            </CardHeader>
            <CardContent>
              <DrowdownPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardHeader>
              <CardTitle>Media Selector</CardTitle>
            </CardHeader>
            <CardContent>
              <MediaSelectorPreview />
              <MediaGalleryPreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.tableCard}>
            <CardContent cssOverride={cardStyles.tableContent}>
              <TablePreview />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardContent>
              <Text weight="semibold">Icons Preview</Text>
              <IconsPreview />
            </CardContent>
          </Card>
        </Flex>
      </Container>
    </>
  );
};

export default Tryouts;

