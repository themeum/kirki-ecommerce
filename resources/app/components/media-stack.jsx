import Thumbnail from '@/molecules/thumbnail';
import React from "react";

const MediaStack = (props) => {
  const { mediaArray = [], size = "small", style = {}, className = "" } = props;
  return (
    <div
      style={{
        position: "relative",
      }}
    >
      {mediaArray.length === 0 ? (
        <Thumbnail src="" size={size} />
      ) : mediaArray.length === 1 ? (
        <Thumbnail size={size} src={mediaArray[0]?.url} />
      ) : (
        <>
          <Thumbnail size={size} src={mediaArray[1]?.url} />
          <div
            style={{
              position: "absolute",
              transform: "rotate(12deg)",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: "2",
            }}
          >
            <Thumbnail size={size} src={mediaArray[0]?.url} />
          </div>
        </>
      )}
    </div>
  );
};

export default MediaStack;
