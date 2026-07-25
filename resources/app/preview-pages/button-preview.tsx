import Button from '@/components/ui/button';
import { ButtonDefaultIcon } from '@/icons';
import Flex from '@/components/ui/flex';
import Tooltip from '@/components/ui/tooltip';

const ButtonPreview = () => {
  return (
    <Flex gap={2} wrap="wrap" align="center">
      <Tooltip tip="This is tooltip" position="bottom">
        <Button
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
          variant="primary"
          onClick={() => {
            console.log('clicked');
          }}
          loading
        >
          Button
        </Button>
      </Tooltip>
      <Tooltip tip="This is tooltip" position="top" type="dark">
        <Button
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
        variant="primary"
        onClick={() => {
          console.log('clicked');
        }}
        loading
      >
        Button
      </Button>
    </Flex>
  );
};

ButtonPreview.displayName = 'ButtonPreview';

export default ButtonPreview;
