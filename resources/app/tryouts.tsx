import Button from '@/components/ui/button';
import { ShowMoreIcon } from '@/icons';
import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { Card } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import RichText from '@/components/rich-text';
import Text from '@/components/ui/text';
import AccordionPreview from '@/preview-pages/accordion-preview';
import ActionGroupPreview from '@/preview-pages/action-group-preview';
import AlertboxPreview from '@/preview-pages/alertbox-preview';
import ButtonPreview from '@/preview-pages/button-preview';
import CardPreview from '@/preview-pages/card-preview';
import CheckboxPreview from '@/preview-pages/checkbox-preview';
import ColorPickerPreview from '@/preview-pages/color-picker-preview';
import DialogPreview from '@/preview-pages/dialog-preview';
import DrowdownPreview from '@/preview-pages/drowdown-preview';
import DropdownMenuPreview from '@/preview-pages/dropdown-menu-preview';
import GridPreview from '@/preview-pages/grid-preview';
import GridTemplatePreview from '@/preview-pages/grid-template-preview';
import GroupOptionCardPreview from '@/preview-pages/group-option-card-preview';
import HeadingPreview from '@/preview-pages/heading-preview';
import IconsPreview from '@/preview-pages/icons-preview';
import InputPreview from '@/preview-pages/input-preview';
import MediaGalleryPreview from '@/preview-pages/media-gallery-preview';
import MediaSelectorPreview from '@/preview-pages/media-selector-preview';
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
import TablePreview from '@/preview-pages/table-preview';
import TabPreview from '@/preview-pages/tab-preview';
import TabsPreview from '@/preview-pages/tabs-preview';
import TagManagerPreview from '@/preview-pages/tag-manager-preview';
import ThumbnailPreview from '@/preview-pages/thumbnail-preview';
import ToggleButtonPreview from '@/preview-pages/toggle-button-preview';
import UiButtonPreview from '@/preview-pages/ui-button-preview';
import UiCheckboxPreview from '@/preview-pages/ui-checkbox-preview';
import UiFormPreview from '@/preview-pages/ui-form-preview';
import UiInputPreview from '@/preview-pages/ui-input-preview';
import UiLabelPreview from '@/preview-pages/ui-label-preview';
import UiPopoverPreview from '@/preview-pages/ui-popover-preview';
import UiRadioGroupPreview from '@/preview-pages/ui-radio-group-preview';
import UiSelectPreview from '@/preview-pages/ui-select-preview';
import UiSwitchPreview from '@/preview-pages/ui-switch-preview';
import UiTextareaPreview from '@/preview-pages/ui-textarea-preview';
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
        <Flex direction="column" gap={16}>
          <Text header="UI Components" type="primary" />

          <Card type="form">
            Button
            <UiButtonPreview />
          </Card>
          <Card type="form">
            Input
            <UiInputPreview />
          </Card>
          <Card type="form">
            Textarea
            <UiTextareaPreview />
          </Card>
          <Card type="form">
            Label
            <UiLabelPreview />
          </Card>
          <Card type="form">
            Checkbox
            <UiCheckboxPreview />
          </Card>
          <Card type="form">
            Radio Group
            <UiRadioGroupPreview />
          </Card>
          <Card type="form">
            Select
            <UiSelectPreview />
          </Card>
          <Card type="form">
            Switch
            <UiSwitchPreview />
          </Card>
          <Card type="form">
            Form
            <UiFormPreview />
          </Card>
          <Card type="form">
            Card
            <CardPreview />
          </Card>
          <Card type="form">
            Dialog
            <DialogPreview />
          </Card>
          <Card type="form">
            Dropdown Menu
            <DropdownMenuPreview />
          </Card>
          <Card type="form">
            Popover
            <UiPopoverPreview />
          </Card>
          <Card type="form">
            Separator
            <SeparatorPreview />
          </Card>
          <Card type="form">
            Tabs
            <TabsPreview />
          </Card>

          <Text header="Composites & Layout" type="primary" />

          <Button
            variant="primary"
            onClick={() => {
              void apiClient.get(endpoints.APP_CONFIG);
            }}
          >
            App Config
          </Button>
          <Card type="form">
            Page Navigation
            <PageNavbarPreview />
          </Card>
          <Card type="form">
            Option Accordion
            <OptionAccordionPreview />
          </Card>
          <Card type="form">
            Group Option Card
            <GroupOptionCardPreview />
          </Card>
          <Card type="form">
            Progress Bar
            <ProgressBarPreview />
          </Card>
          <Card type="form">
            Color Picker
            <ColorPickerPreview />
          </Card>
          <Card type="form">
            Rich Text
            <RichText
              onChange={(content) => console.log(content)}
              label="Rich Text Editor"
            />
          </Card>
          <Card type="form">
            Select Input
            <SelectInputPreview />
          </Card>
          <Card type="form">
            Placeholder
            <PlaceholderPreview />
          </Card>
          <Card type="form">
            Thumbnail
            <ThumbnailPreview />
          </Card>
          <Card type="form">
            Grid
            <GridPreview />
          </Card>
          <GridTemplatePreview />
          <Card type="form">
            Action Group
            <ActionGroupPreview />
          </Card>
          <Card type="form">
            Tag Manager
            <TagManagerPreview />
          </Card>
          <Card type="form">
            Tab
            <Flex direction="column" gap={16}>
              <TabPreview />
            </Flex>
          </Card>
          <Card type="form">
            Heading
            <Flex direction="column" gap={16}>
              <HeadingPreview />
            </Flex>
          </Card>
          <Card type="form">
            Page Heading
            <PageHeadingPreview />
          </Card>
          <Card type="form">
            Button + Tooltip
            <ButtonPreview />
          </Card>
          <Card type="form">
            Flex
            <Flex gap={40}>
              <div>Flex Item 1</div>
              <div>Flex Item 2</div>
              <div>Flex Item 3</div>
            </Flex>
            <Flex direction="column" gap={12} style={{ marginTop: 16 }}>
              <div>Flex Item 1</div>
              <div>Flex Item 2</div>
              <div>Flex Item 3</div>
            </Flex>
          </Card>
          <Card type="form">
            Toggle Button
            <ToggleButtonPreview />
          </Card>
          <Card type="form">
            Radio Group
            <RadioGroupPreview />
          </Card>
          <Card type="form">
            Checkbox
            <CheckboxPreview />
          </Card>
          <Card type="form">
            Input
            <InputPreview />
          </Card>
          <Card type="form">
            Combobox Select
            <SelectPreview />
          </Card>
          <Card type="form">
            Accordion
            <AccordionPreview />
          </Card>
          <Card type="form">
            Dialog (legacy popover)
            <PopoverPreview />
          </Card>
          <Card type="form">
            Alert Dialog
            <AlertboxPreview />
          </Card>
          <Card type="form">
            Dropdown
            <DrowdownPreview />
          </Card>
          <Card type="form">
            Media Selector
            <MediaSelectorPreview />
            Media Gallery
            <MediaGalleryPreview />
          </Card>
          <Card type="table">
            <TablePreview />
          </Card>
          <Card type="form">
            <Text header="Icons Preview" type="primary" />
            <IconsPreview />
          </Card>
        </Flex>
      </Container>
    </>
  );
};

export default Tryouts;
