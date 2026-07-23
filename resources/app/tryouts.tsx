import RichText from '@/components/rich-text';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import Text from '@/components/ui/text';
import { ShowMoreIcon } from '@/icons';
import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
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
import TabPreview from '@/preview-pages/tab-preview';
import TablePreview from '@/preview-pages/table-preview';
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
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
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

          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
            </CardHeader>
            <CardContent>
              <UiButtonPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Input</CardTitle>
            </CardHeader>
            <CardContent>
              <UiInputPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Textarea</CardTitle>
            </CardHeader>
            <CardContent>
              <UiTextareaPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Label</CardTitle>
            </CardHeader>
            <CardContent>
              <UiLabelPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Checkbox</CardTitle>
            </CardHeader>
            <CardContent>
              <UiCheckboxPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Radio Group</CardTitle>
            </CardHeader>
            <CardContent>
              <UiRadioGroupPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Select</CardTitle>
            </CardHeader>
            <CardContent>
              Select
              <UiSelectPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Switch</CardTitle>
            </CardHeader>
            <CardContent>
              <UiSwitchPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Form</CardTitle>
            </CardHeader>
            <CardContent>
              <UiFormPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Card</CardTitle>
            </CardHeader>
            <CardContent>
              <CardPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Dialog</CardTitle>
            </CardHeader>
            <CardContent>
              <DialogPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Dropdown Menu</CardTitle>
            </CardHeader>
            <CardContent>
              <DropdownMenuPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Popover</CardTitle>
            </CardHeader>
            <CardContent>
              <UiPopoverPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Separator</CardTitle>
            </CardHeader>
            <CardContent>
              <SeparatorPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Tabs</CardTitle>
            </CardHeader>
            <CardContent>
              <TabsPreview />
            </CardContent>
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
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Page Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <PageNavbarPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardContent>
              <OptionAccordionPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Group Option Card</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupOptionCardPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Progress Bar</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressBarPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardContent>
              <ColorPickerPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
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
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Select Input</CardTitle>
            </CardHeader>
            <CardContent>
              <SelectInputPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Placeholder</CardTitle>
            </CardHeader>
            <CardContent>
              <PlaceholderPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Thumbnail</CardTitle>
            </CardHeader>
            <CardContent>
              <ThumbnailPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Grid</CardTitle>
            </CardHeader>
            <CardContent>
              <GridPreview />
            </CardContent>
          </Card>
          <GridTemplatePreview />
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Action Group</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionGroupPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Tag Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <TagManagerPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Tab</CardTitle>
            </CardHeader>
            <CardContent>
              <Flex direction="column" gap={16}>
                <TabPreview />
              </Flex>
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Heading</CardTitle>
            </CardHeader>
            <CardContent>
              <Flex direction="column" gap={16}>
                <HeadingPreview />
              </Flex>
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Page Heading</CardTitle>
            </CardHeader>
            <CardContent>
              <PageHeadingPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Button + Tooltip</CardTitle>
            </CardHeader>
            <CardContent>
              <ButtonPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Flex</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Toggle Button</CardTitle>
            </CardHeader>
            <CardContent>
              <ToggleButtonPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Radio Group</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroupPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Checkbox</CardTitle>
            </CardHeader>
            <CardContent>
              <CheckboxPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Input</CardTitle>
            </CardHeader>
            <CardContent>
              <InputPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Combobox Select</CardTitle>
            </CardHeader>
            <CardContent>
              <SelectPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Accordion</CardTitle>
            </CardHeader>
            <CardContent>
              <AccordionPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Dialog (legacy popover)</CardTitle>
            </CardHeader>
            <CardContent>
              <PopoverPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Alert Dialog</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertboxPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Dropdown</CardTitle>
            </CardHeader>
            <CardContent>
              <DrowdownPreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardHeader>
              <CardTitle>Media Selector</CardTitle>
            </CardHeader>
            <CardContent>
              <MediaSelectorPreview />
              <MediaGalleryPreview />
            </CardContent>
          </Card>
          <Card css={styles.tableCard}>
            <CardContent css={styles.tableContent}>
              <TablePreview />
            </CardContent>
          </Card>
          <Card css={styles.formCard}>
            <CardContent>
              <Text header="Icons Preview" type="primary" />
              <IconsPreview />
            </CardContent>
          </Card>
        </Flex>
      </Container>
    </>
  );
};

export default Tryouts;

const styles = {
  formCard: scoped({
    rowGap: theme.spacing['2xl'],
  }),
  tableCard: scoped({
    overflow: 'hidden',
    border: '1px solid #e6e6e6',
    gap: 0,
    padding: theme.spacing.none,
  }),
  tableContent: scoped({
    padding: theme.spacing.none,
  }),
};
