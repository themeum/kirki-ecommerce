import React from "react";
import { Grid } from "@/molecules";
import { MediaSelector } from "@/components";

const MediaSelectorPreview = () => {

    
  return (
    <Grid>
        <MediaSelector
            onSelect={(image) => console.log(image)}
            multiple={true}
        >
            + Upload Multiple Images
        </MediaSelector>

        <MediaSelector
            onSelect={(image) => console.log(image)}
            multiple={false}
        >
            + Upload Single Image
        </MediaSelector>
    </Grid>
  );
}

export default MediaSelectorPreview;