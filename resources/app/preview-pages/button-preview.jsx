import React from "react";
import { ButtonDefaultIcon } from "@/icons";
import { CLASS_PREFIX } from "@/conf";
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Tooltip from '@/molecules/tooltip';
import { useRef } from "react";

const ButtonPreview = () => {
  const size = ["default", "large", "small"];
  const state = ["default", "hover", "active", "disabled", "loading"];
  const type = [
    "primary",
    "secondary",
    "destructive",
    "destructiveSoft",
    "primarySoft",
    "outlined",
    "ghost",
    "link",
  ];
  const buttonRef = useRef(null);

  return (
    <Flex gap={8}>
      <Tooltip tip="This is tooltip" position="bottom">
        <Button
          className=""
          type="primary"
          leftIcon={<ButtonDefaultIcon />}
          text="Button"
          onClick={() => {
            console.log("primary");
          }}
        />
      </Tooltip>
      <Tooltip tip="This is tooltip" position="top">
        <Button
          className=""
          type="primary"
          state="hover"
          leftIcon={<ButtonDefaultIcon />}
          text="Button"
          onClick={() => {
            console.log("primary");
          }}
        />
      </Tooltip>
      <Tooltip tip="This is tooltip" position="left">
        <Button
          className=""
          type="primary"
          state="active"
          leftIcon={<ButtonDefaultIcon />}
          text="Button"
          onClick={() => {
            console.log("primary");
          }}
        />
      </Tooltip>

      <Tooltip tip="This is tooltip" position="right">
        <Button
          className=""
          type="primary"
          leftIcon={<ButtonDefaultIcon />}
          text="Button"
          state="disabled"
          onClick={() => {
            console.log("clicked");
          }}
          href="https://www.google.com"
        />
      </Tooltip>
      <Tooltip tip="This is tooltip" position="bottom" type="dark">
        <Button
          className=""
          type="primary"
          text="Button"
          onClick={() => {
            console.log("clicked");
          }}
          state="loading"
          href="https://www.google.com"
          target="blank"
        />
      </Tooltip>
      <Tooltip tip="This is tooltip" position="top" type="dark">
        <Button
          className=""
          type="primary"
          icon={<ButtonDefaultIcon />}
          onClick={() => {
            console.log("clicked");
          }}
          href="https://www.google.com"
          target
        />
      </Tooltip>
      <Button
        className=""
        type="primary"
        state="hover"
        icon={<ButtonDefaultIcon />}
        onClick={() => {
          console.log("clicked");
        }}
        href="https://www.google.com"
        target
      />
      <Button
        className=""
        type="primary"
        state="active"
        icon={<ButtonDefaultIcon />}
        onClick={() => {
          console.log("clicked");
        }}
        href="https://www.google.com"
        target
      />
      <Button
        className=""
        type="primary"
        icon={<ButtonDefaultIcon />}
        onClick={() => {
          console.log("clicked");
        }}
        state="disabled"
        href="https://www.google.com"
        target
      />
      <Button
        className=""
        type="primary"
        icon
        onClick={() => {
          console.log("clicked");
        }}
        state="loading"
        href="https://www.google.com"
        target
      />
    </Flex>
  );
};

export default ButtonPreview;
