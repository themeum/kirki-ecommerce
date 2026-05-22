import React, { useEffect, useState } from "react";
import PageHeading from '@/molecules/page-heading';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Text from '@/molecules/text';
import Input from '@/molecules/input';
import Tab from '@/molecules/tab';
import ThumbnailSelector from '@/components/thumbnail-selector';
import { useSelector, useDispatch } from "react-redux";
import { BrushIcon, AlignLeftIcon, AlignCenterIcon, SendIcon } from "@/icons";
import { __ } from "@/wpi18n";
import ProgressBar from '@/molecules/progressbar';
import ColorPicker from '@/molecules/color-picker'
import { getErrorsObject } from "../../../store/utils";
import {
  getSettingsAPI,
  updateSettingsAPI,
  updateSettings,
} from "../../../store/settingsSlice";

const EditTemplate = () => {
  const POSITION_MAP = {
    start: 0,
    center: 1,
    end: 2,
  };

  const dispatch = useDispatch();
  const INDEX_TO_POSITION = ["start", "center", "end"];
  const { loaded, data: emailSettingsData } = useSelector(
    (state) => state.settings?.email,
  );
  const defaultEmail = emailSettingsData?.default_template;
  const [dataObj, setDataObj] = useState(defaultEmail || {});
  const [heightValue, setHeightValue] = useState(
    parseInt(defaultEmail?.height, 10) || 50,
  );
  const [logo, setLogo] = useState(defaultEmail?.logo || "");
  const [errors, setErrors] = useState({});
  const [position, setPosition] = useState(
    POSITION_MAP[defaultEmail?.position] || 0,
  );

  useEffect(() => {
    if (!defaultEmail) return;
    setDataObj(defaultEmail);
    setHeightValue(parseInt(defaultEmail?.height, 10));
    setLogo(defaultEmail?.logo);
    setPosition(POSITION_MAP[defaultEmail.position]);
  }, [defaultEmail]);

  useEffect(() => {
    if (!loaded) dispatch(getSettingsAPI("email", {}));
  }, []);

  const handleOnchange = (key, value) => {
    const colors = [
      "background",
      "text",
      "link",
      "label",
      "button",
      "button_bg",
    ];
    setDataObj((prev) => {
      if (colors.includes(key)) {
        return {
          ...prev,
          colors: {
            ...prev.colors,
            [key]: value,
          },
        };
      }
      if (key === "position") {
        setPosition(value);
        const positionValue = INDEX_TO_POSITION[value];
        return {
          ...prev,
          [key]: positionValue,
        };
      }
      if (key === "logo") {
        setLogo(value?.url);
        return {
          ...prev,
          [key]: value?.url,
        };
      }
      return { ...prev, [key]: value };
    });

    setErrors((prev) => ({
      ...prev,
      ["data." + key]: null,
    }));
  };

  const handleSaveData = async () => {
    if (!emailSettingsData) return;

    const payload = {
      ...emailSettingsData,
      default_template: {
        ...emailSettingsData.default_template,
        ...dataObj,
        height: `${heightValue}px`,
      },
    };

    const result = await updateSettingsAPI("email", payload);
    if (result.success) {
      dispatch(updateSettings({ key: "email", value: result.data }));
    } else {
      setErrors(getErrorsObject(result.errors));
    }
  };

  const handleDiscard = () => {
    if (!defaultEmail) return;

    setDataObj(defaultEmail);
    setHeightValue(parseInt(defaultEmail.height, 10) || 50);
    setLogo(defaultEmail.logo || "");
    setPosition(POSITION_MAP[defaultEmail.position] || 0);
    setErrors({});
  };

  return (
    <>
      <PageHeading
        text={__("Edit Template", "kirki-ecommerce")}
        hasBack
        style={{
          fontSize: "16px",
          fontWeight: "400",
          lineHeight: "28px",
          padding: "0px 32px",
          height: "32px",
        }}
        leftIcon={<BrushIcon />}
        size="fullWidth"
        sticky
        actions={
          <>
            <Button
              type="ghost"
              text={__("Discard", "kirki-ecommerce")}
              size="small"
              onClick={handleDiscard}
            />
            <Button
              type="primary"
              text={__("Save", "kirki-ecommerce")}
              size="small"
              onClick={handleSaveData}
            />
          </>
        }
      />
      <Container
        size="fullWidth"
        style={{ width: "100%", padding: "16px 103px" }}
      >
        {loaded ? (
          <Flex gap={48} style={{ width: "100%" }}>
            <Flex direction="column" gap={20} style={{ width: "44%" }}>
              <Card type="large" style={{ borderRadius: "8px" }}>
                <Text
                  type="primary"
                  header={"Logo"}
                  subHeader={"Update the logo & style your way"}
                />
                <ThumbnailSelector
                  placeholder={__("Drag and drop, or upload images", "kirki-ecommerce")}
                  src={logo || ""}
                  helpText={__("Set store logo", "kirki-ecommerce")}
                  onChange={(img) => handleOnchange("logo", img)}
                  error={errors["data.default_template.logo"]}
                />
                <Input
                  label={__("Height", "kirki-ecommerce")}
                  type="number"
                  value={heightValue}
                  onChange={(value) => setHeightValue(Number(value))}
                  error={errors["data.default_template.height"]}
                />
                <ProgressBar
                  value={heightValue}
                  onChange={setHeightValue}
                  label={"Height"}
                  rightText={`${heightValue}px`}
                />
                <Tab
                  key={position}
                  activeIndex={position}
                  onChange={(value) => handleOnchange("position", value)}
                >
                  <AlignLeftIcon />
                  <AlignCenterIcon />
                  <AlignLeftIcon style={{ transform: "scaleX(-1)" }} />
                </Tab>
              </Card>
              <Card type="large" style={{ borderRadius: "8px" }}>
                <Text
                  header={"Colors"}
                  subHeader={"Style how the emails will look"}
                />
                <ColorPicker
                  value={dataObj?.colors?.background}
                  onChange={(value) => handleOnchange("background", value)}
                  label={"Background"}
                  error={errors["data.default_template.colors.background"]}
                />
                <ColorPicker
                  value={dataObj?.colors?.text}
                  onChange={(value) => handleOnchange("text", value)}
                  label={"Text"}
                  error={errors["data.default_template.colors.text"]}
                />
                <ColorPicker
                  value={dataObj?.colors?.link}
                  onChange={(value) => handleOnchange("link", value)}
                  label={"Link"}
                  error={errors["data.default_template.colors.link"]}
                />
                <ColorPicker
                  value={dataObj?.colors?.label}
                  onChange={(value) => handleOnchange("label", value)}
                  label={"Label"}
                  error={errors["data.default_template.colors.label"]}
                />
                <ColorPicker
                  value={dataObj?.colors?.button}
                  onChange={(value) => handleOnchange("button", value)}
                  label={"Button Color"}
                  error={errors["data.default_template.colors.button"]}
                />
                <ColorPicker
                  value={dataObj?.colors?.button_bg}
                  onChange={(value) => handleOnchange("button_bg", value)}
                  label={"Button BG"}
                  error={errors["data.default_template.colors.button_bg"]}
                />
              </Card>
            </Flex>

            <Flex style={{ width: "56%" }} direction={"column"} gap={16}>
              <Flex
                style={{
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text header={"Template Preview"} />
                <Text
                  style={{
                    fontSize: "12px",
                    lineHeight: "18px",
                  }}
                  header={"Send Text Mail"}
                  leftIcon={<SendIcon />}
                />
              </Flex>
              <Card style={{ borderRadius: "0px" }}></Card>
            </Flex>
          </Flex>
        ) : (
          <div>{__("Loading ...", "kirki-ecommerce")}</div>
        )}
      </Container>
    </>
  );
};

export default EditTemplate;
