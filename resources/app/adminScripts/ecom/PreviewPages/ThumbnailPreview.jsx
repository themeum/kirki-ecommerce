import { Flex, Thumbnail } from "molecules";
import React from "react";

const ThumbnailPreview = () => {
  const media_items = [
    {
      id: 1,
      url: "https://images.pexels.com/photos/11136517/pexels-photo-11136517.jpeg",
      alt: "Image 1",
    },
    {
      id: 2,
      url: "https://images.pexels.com/photos/11136517/pexels-photo-11136517.jpeg",
      alt: "Image 2",
    },
    {
      id: 3,
      url: "https://images.pexels.com/photos/11136517/pexels-photo-11136517.jpeg",
      alt: "Image 3",
    },
    {
      id: 4,
      url: "https://images.pexels.com/photos/11136517/pexels-photo-11136517.jpeg",
      alt: "img 4",
    },
  ];
  return (
    <Flex gap={16} style={{ alignItems: "center" }}>
      <Thumbnail />
      <Thumbnail border="dashed" src="" />
      <Thumbnail type="circle" />
      <Thumbnail size="small" />
      <Thumbnail size="small" objectFit="contain" src={media_items[0].url} />
      <Thumbnail src={media_items[1].url} />
      <Thumbnail src={media_items[2].url} />
      <Thumbnail src={media_items[3].url} />
    </Flex>
  );
};

export default ThumbnailPreview;
