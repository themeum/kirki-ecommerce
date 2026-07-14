import { ShowMoreIcon } from '@/icons';
import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import RichText from '@/molecules/rich-text';
import Text from '@/molecules/text';
import AccordionPreview from '@/preview-pages/accordion-preview';
import ActionGroupPreview from '@/preview-pages/action-group-preview';
import AlertboxPreview from '@/preview-pages/alertbox-preview';
import ButtonPreview from '@/preview-pages/button-preview';
import CheckboxPreview from '@/preview-pages/checkbox-preview';
import ColorPickerPreview from '@/preview-pages/color-picker-preview';
import DrowdownPreview from '@/preview-pages/drowdown-preview';
import GridTemplatePreview from '@/preview-pages/grid-template-preview';
import GroupOptionCardPreview from '@/preview-pages/group-option-card-preview';
import HeadingPreview from '@/preview-pages/heading-preview';
import IconsPreview from '@/preview-pages/icons-preview';
import InputPreview from '@/preview-pages/input-preview';
import MediaGalleryPreview from '@/preview-pages/media-gallery-preview';
import MediaSelectorPreview from '@/preview-pages/media-selector-preview';
import OptionAccordionPreview from '@/preview-pages/option-accordion-preview';
import PageNavbarPreview from '@/preview-pages/page-navbar-preview';
import PlaceholderPreview from '@/preview-pages/placeholder-preview';
import PopoverPreview from '@/preview-pages/popover-preview';
import ProgressBarPreview from '@/preview-pages/progress-bar-preview';
import RadioGroupPreview from '@/preview-pages/radio-group-preview';
import SelectInputPreview from '@/preview-pages/select-input-preview';
import SelectPreview from '@/preview-pages/select-preview';
import TablePreview from '@/preview-pages/table-preview';
import TabPreview from '@/preview-pages/tab-preview';
import TagManagerPreview from '@/preview-pages/tag-manager-preview';
import ThumbnailPreview from '@/preview-pages/thumbnail-preview';
import ToggleButtonPreview from '@/preview-pages/toggle-button-preview';
import type { FlexDirection } from '@/types';

const Tryouts = () => {
  return (
    <>
      <PageHeading
        text="New Collection"
        type="primary"
        sticky
        actions={
          <>
            <Button type="ghost" icon={<ShowMoreIcon />} />
            <Button type="ghost" text="Save as Draft" />
            <Button type="primary" text="Create" />
          </>
        }
        hasBack
      />
      <Container>
        <Flex direction="column" gap={16}>
          <Button
            type="primary"
            text="App Config"
            onClick={() => {
              void apiClient.get(endpoints.APP_CONFIG);
            }}
          />
          Page Navigation
          <PageNavbarPreview />
          Option Accordion
          <Card>
            <OptionAccordionPreview />
          </Card>
          Group Option Card
          <Card>
            <GroupOptionCardPreview />
          </Card>
          <Card>
            <ProgressBarPreview />
          </Card>
          <Card>
            <ColorPickerPreview />
          </Card>
          RichText
          <Card>
            <RichText
              onChange={(content) => console.log(content)}
              label="Rich Text Editor"
            />
          </Card>
          <Card>
            <SelectInputPreview />
          </Card>
          <Card>
            <PlaceholderPreview />
          </Card>
          <Card>
            <ThumbnailPreview />
          </Card>
          <GridTemplatePreview />
          <Card>
            <ActionGroupPreview />
          </Card>
          <Card type="form">
            Tag Manager
            <TagManagerPreview />
          </Card>
          <Card type="form">
            <span>Tab Preview</span>
            <Flex direction="column" gap={16}>
              <TabPreview />
            </Flex>
          </Card>
          <Card type="form">
            Page Heading
            <Flex direction="column" gap={16}>
              <HeadingPreview />
            </Flex>
          </Card>
          <Card type="form">
            Button Component
            <ButtonPreview />
          </Card>
          <Card type="form">
            Flex
            <Flex gap={40}>
              <div>Flex Item 1</div>
              <div>Flex Item 2</div>
              <div>Flex Item 3</div>
            </Flex>
            <Flex
              direction={'col' as FlexDirection}
              gap={12}
              style={{ marginTop: 16 }}
            >
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
            Checkbox Component
            <CheckboxPreview />
          </Card>
          <Card type="form">
            Input Molecule
            <InputPreview />
          </Card>
          <Card type="form">
            Select Component
            <SelectPreview />
          </Card>
          <Card type="form">
            Accordion
            <AccordionPreview />
          </Card>
          <Card type="form">
            General Popover
            <PopoverPreview />
          </Card>
          <Card type="form">
            Alertbox Component
            <AlertboxPreview />
          </Card>
          <Card type="form">
            Dropdown Component
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
          <Card>
            <Text header="Icons Preview" type="primary" />
            <IconsPreview />
          </Card>
        </Flex>
      </Container>
    </>
  );
};

export default Tryouts;
