import classNames from "classnames";
import { CLASS_PREFIX } from "conf";
import { ReplaceIcon, ThumbnailPlaceholder, TrashEmptyIcon } from "icons";
import React from "react";
import Label from "../Label";
import Flex from "../Flex";
import Button from "../Button";
import { useState, useEffect } from "react";
import { MediaSelector } from "components";

const Thumbnail = (props) => {
  const {
    src,
    style = {},
    className = "",
    size,
    type,
    alt,
    objectFit = "cover",
    label,
    error,
    onChange = () => {},
    helpText,
  } = props;

  const thumbnailVariants = {
    size: {
      fullWidth: `${CLASS_PREFIX}-thumbnail-full-width`,
      small: `${CLASS_PREFIX}-thumbnail-small`,
      xsm: `${CLASS_PREFIX}-thumbnail-xsm`,
    },
    type: {
      circle: `${CLASS_PREFIX}-thumbnail-circle`,
    },
    error: `${CLASS_PREFIX}-thumbnail-error`,
    default: `${CLASS_PREFIX}-thumbnail`,
  };
  const allClassNames = classNames(
    thumbnailVariants.default,
    thumbnailVariants.size[size],
    thumbnailVariants.type[type],
    error && thumbnailVariants.error,
    className,
  );

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Flex direction="column" gap={8} style={{ maxWidth: "100%" }}>
      {label && (
        <Label
          text={label}
          type={error ? "error" : ""}
          helpText={error ? error : helpText}
        />
      )}
      <div className={allClassNames} style={style}>
        {imgSrc ? (
          <>
            <img
              src={imgSrc}
              alt={alt || "thumbnail"}
              style={{ objectFit: objectFit }}
            />
            {size === "fullWidth" && (
              <div className={`${CLASS_PREFIX}-thumbnail-overlay`}>
                <Flex gap={8} className={`${CLASS_PREFIX}-action-buttons`}>
                  <MediaSelector onSelect={(img) => onChange(img)}>
                    <Button size="small" type="ghost" icon={<ReplaceIcon />} />
                  </MediaSelector>
                  <Button
                    size="small"
                    type="ghost"
                    icon={<TrashEmptyIcon />}
                    onClick={() => onChange("")}
                  />
                </Flex>
              </div>
            )}
          </>
        ) : (
          <ThumbnailPlaceholder />
        )}
      </div>
    </Flex>
  );
};

export default Thumbnail;
