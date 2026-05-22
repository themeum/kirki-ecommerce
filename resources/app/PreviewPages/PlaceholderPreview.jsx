import { MediaSelector } from "@/components";
import { ThumbnailPlaceholder } from "@/Icons";
import { Flex, Placeholder } from "@/molecules";
import React from "react";

const PlaceholderPreview = () => {
  return (
    <Flex direction="column" gap={16}>
      <MediaSelector label="Small Placeholder" style={{ width: "max-content" }}>
        <Placeholder size="small" />
      </MediaSelector>

      <MediaSelector
        label="Small Primary Placeholder"
        style={{ width: "max-content" }}
      >
        <Placeholder size="small" type="primary" />
      </MediaSelector>

      <Placeholder label="Default Placeholder" type="primary">
        <ThumbnailPlaceholder />
        <MediaSelector multiple={true}>
          <span>Add Image</span>
        </MediaSelector>
      </Placeholder>

      <Placeholder type="secondary" label="Secondary Placeholder">
        <ThumbnailPlaceholder />
        <MediaSelector multiple={true}>
          <span>Add Image</span>
        </MediaSelector>
      </Placeholder>

      <Placeholder
        label="Large Secondary Placeholder"
        type="secondary"
        size="large"
        onClick={() => {
          console.log("clicked");
        }}
      >
        <ThumbnailPlaceholder />
        <MediaSelector>
          <span>Add Image</span>
        </MediaSelector>
      </Placeholder>
    </Flex>
  );
};

export default PlaceholderPreview;
