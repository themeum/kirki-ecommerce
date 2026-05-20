import { CLASS_PREFIX } from "conf";
import {
  Button,
  Card,
  Container,
  Flex,
  PageHeading,
  RichText,
  Text,
} from "molecules";
import {
  AccordionPreview,
  AlertboxPreview,
  ButtonPreview,
  CheckboxPreview,
  DrowdownPreview,
  GridTemplatePreview,
  HeadingPreview,
  InputPreview,
  PageHeadingPreview,
  PopoverPreview,
  RadioGroupPreview,
  SelectPreview,
  TablePreview,
  TabPreview,
  ToggleButtonPreview,
  MediaSelectorPreview,
  MediaGalleryPreview,
  TagManagerPreview,
  ActionGroupPreview,
  ThumbnailPreview,
  PlaceholderPreview,
  SelectInputPreview,
  PageNavbarPreview,
  OptionAccordionPreview,
  GroupOptionCardPreview,
  ProgressBarPreview,
  ColorPickerPreview,
} from "./PreviewPages";
import IconsPreview from "./PreviewPages/IconsPreview";
import { ShowMoreIcon } from "icons";
import axios from "axios";
import { getOptions } from "./store/utils";

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
            onClick={() => axios.request(getOptions("/app-config"))}
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
            <Flex direction="col" gap={12} style={{ marginTop: 16 }}>
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
