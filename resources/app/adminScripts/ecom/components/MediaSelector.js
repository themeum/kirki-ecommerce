import React, { useEffect, useRef, useState } from "react";
import { Button, Flex, Label } from "molecules";
import { __ } from "wpi18n";

const MediaSelector = ({
  multiple = false,
  onSelect,
  children,
  label,
  className = "",
  style = {},
}) => {
  const mediaFrameRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState({ url: "" });
  const [onSelectToggler, setOnSelectToggler] = useState(false);

  useEffect(() => {
    if (onSelect && onSelectToggler) {
      onSelect(selectedImage);
      setOnSelectToggler(false);
    }
  }, [onSelectToggler]);

  useEffect(() => {
    if (typeof wp !== "undefined" && wp.media) {
      // Initialize the WordPress Media Frame
      mediaFrameRef.current = wp.media({
        title: __("Select Image(s)", "kirki-ecommerce"),
        library: { type: "image" },
        multiple: multiple, // true or false
        button: {
          text: multiple
            ? __("Use These Images", "kirki-ecommerce")
            : __("Use This Image", "kirki-ecommerce"),
        },
      });

      // Add the select handler
      mediaFrameRef.current.on("select", () => {
        const selection = mediaFrameRef.current.state().get("selection");
        const images = selection.map((attachment) => attachment.toJSON());

        if (multiple) {
          // Multiple images selected
          setSelectedImage(images); // Store array of images
          if (onSelect) {
            // onSelect(images); // Pass array
            setOnSelectToggler(true);
          }
        } else {
          // Single image selected
          const image = images[0];
          setSelectedImage(image); // Store single image
          if (onSelect) {
            // onSelect(image); // Pass single image
            setOnSelectToggler(true);
          }
        }
      });
    }

    return () => {
      // Clean up the media frame on unmount
      if (mediaFrameRef.current) {
        mediaFrameRef.current.off("select");
      }
    };
  }, []);

  const openMediaFrame = () => {
    if (mediaFrameRef.current) {
      mediaFrameRef.current.open(); // Open the WordPress Media Frame
    }
  };

  return (
    <Flex direction="column" gap={8}>
      {label && <Label text={label} />}
      <div
        onClick={openMediaFrame}
        className={className}
        style={{ cursor: "pointer", ...style }}
      >
        {children || <Button text={__("Select Image", "kirki-ecommerce")} />}
      </div>
    </Flex>
  );
};

export default MediaSelector;
