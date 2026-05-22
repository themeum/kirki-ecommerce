import React from "react";
import Input from '@/molecules/input';

const InputPreview = () => {
  return (
    <>
      <Input
        label="Username"
        helpText="this field is for username" // TODO: make tooltip
        placeholder="Placeholder"
        type="text"
        onChange={(value) => console.log(value)}
        onBlur={(value) => console.log(value)}
      />
      <Input
        label="Description"
        placeholder="Write a description"
        onChange={(value) => console.log(value)}
        onBlur={(value) => console.log(value)}
        multiline={5}
        // state="disabled"
      />
      <Input
        label="Photo"
        // size="large"
        placeholder="Placeholder"
        helpText="choos a file"
        type="file"
        accept=".jpeg"
        multiple
        onChange={(value) => console.log(value)}
        onBlur={(value) => console.log(value)}
        error="There is an error"
      />
    </>
  );
};

export default InputPreview;
