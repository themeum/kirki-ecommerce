import { Button, Placeholder, Text, Thumbnail } from "@/molecules";
import React from "react";
import MediaSelector from "../MediaSelector";
import { CloudUpload } from "@/Icons";
import { __ } from "@/wpi18n";

const ThumbnailSelector = (props) => {
  const {
    onChange = () => {},
    error,
    src,
    placeholder = __("Drag and drop, or upload image", "kirki-ecommerce"),
    btnText = __("Upload image", "kirki-ecommerce"),
    label,
    helpText,
    size = "fullWidth",
  } = props;
  return (
    <>
      {src ? (
        <>
          {size === "small" ? (
            <MediaSelector onSelect={onChange}>
              <Thumbnail
                src={src}
                size={size}
                label={label}
                onChange={onChange}
                helpText={helpText}
              />
            </MediaSelector>
          ) : (
            <Thumbnail
              src={src}
              size="fullWidth"
              label={label}
              onChange={onChange}
              helpText={helpText}
            />
          )}
        </>
      ) : size === "small" ? (
        <MediaSelector onSelect={onChange}>
          <Placeholder
            size={size}
            type="primary"
            error={error}
            helpText={helpText}
          />
        </MediaSelector>
      ) : (
        <Placeholder
          type="primary"
          label={label}
          error={error}
          helpText={helpText}
        >
          <MediaSelector onSelect={onChange}>
            <Button type="ghost" text={btnText} leftIcon={<CloudUpload />} />
          </MediaSelector>
          <Text type="primary" subHeader={placeholder} />
        </Placeholder>
      )}
    </>
  );
};

export default ThumbnailSelector;
