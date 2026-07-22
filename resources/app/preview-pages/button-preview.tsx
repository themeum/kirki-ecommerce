import type { ReactNode } from 'react';

import Button from '@/components/ui/button';
import { ButtonDefaultIcon } from '@/icons';
import Flex from '@/molecules/flex';
import Tooltip from '@/molecules/tooltip';

const ButtonPreview = () => {
  return (
    <Flex gap={8}>
      <Tooltip tip="This is tooltip" position="bottom">
        <Button
          className=""
          variant="primary"
          onClick={() => {
            console.log('primary');
          }}
        >
          <ButtonDefaultIcon />
          Button
        </Button>
      </Tooltip>
      <Tooltip tip="This is tooltip" position="top">
        <Button
          className=""
          variant="primary"
          onClick={() => {
            console.log('primary');
          }}
        >
          <ButtonDefaultIcon />
          Button
        </Button>
      </Tooltip>
      <Tooltip tip="This is tooltip" position="left">
        <Button
          className=""
          variant="primary"
          onClick={() => {
            console.log('primary');
          }}
        >
          <ButtonDefaultIcon />
          Button
        </Button>
      </Tooltip>

      <Tooltip tip="This is tooltip" position="right">
        <Button
          className=""
          variant="primary"
          disabled
          onClick={() => {
            console.log('clicked');
          }}
          asChild
        >
          <a href="https://www.google.com">
            <ButtonDefaultIcon />
            Button
          </a>
        </Button>
      </Tooltip>
      <Tooltip tip="This is tooltip" position="bottom" type="dark">
        <Button
          className=""
          variant="primary"
          onClick={() => {
            console.log('clicked');
          }}
          loading
          asChild
        >
          <a href="https://www.google.com" target="_blank" rel="noreferrer">
            Button
          </a>
        </Button>
      </Tooltip>
      <Tooltip tip="This is tooltip" position="top" type="dark">
        <Button
          className=""
          variant="primary"
          onClick={() => {
            console.log('clicked');
          }}
          asChild
        >
          <a href="https://www.google.com" target="_blank" rel="noreferrer">
            <ButtonDefaultIcon />
          </a>
        </Button>
      </Tooltip>
      <Button
        className=""
        variant="primary"
        onClick={() => {
          console.log('clicked');
        }}
        asChild
      >
        <a href="https://www.google.com" target="_blank" rel="noreferrer">
          <ButtonDefaultIcon />
        </a>
      </Button>
      <Button
        className=""
        variant="primary"
        onClick={() => {
          console.log('clicked');
        }}
        asChild
      >
        <a href="https://www.google.com" target="_blank" rel="noreferrer">
          <ButtonDefaultIcon />
        </a>
      </Button>
      <Button
        className=""
        variant="primary"
        disabled
        onClick={() => {
          console.log('clicked');
        }}
        asChild
      >
        <a href="https://www.google.com" target="_blank" rel="noreferrer">
          <ButtonDefaultIcon />
        </a>
      </Button>
      <Button
        className=""
        variant="primary"
        onClick={() => {
          console.log('clicked');
        }}
        loading
        asChild
      >
        <a href="https://www.google.com" target="_blank" rel="noreferrer">
          {true as unknown as ReactNode}
        </a>
      </Button>
    </Flex>
  );
};

ButtonPreview.displayName = 'ButtonPreview';

export default ButtonPreview;
