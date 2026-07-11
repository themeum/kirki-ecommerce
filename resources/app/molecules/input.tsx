import type {
  ReactNode,
  CSSProperties,
  ChangeEvent,
  KeyboardEvent,
  FocusEvent,
  MouseEvent,
  Ref,
} from 'react';
import { useState, forwardRef } from 'react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';
import Label from '@/molecules/label';
import Flex from '@/molecules/flex';
import { __ } from '@/wpi18n';
import { CloseIcon } from '@/icons';
import type { InputState } from '@/types';

type InputProps = {
  id?: string;
  value?: string | number;
  type?: string;
  label?: string;
  helpText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  state?: InputState;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  onChange?: (value: string | number) => void;
  onClick?: (value: string | number) => void;
  onBlur?: (value: string | number) => void;
  onFocus?: () => void;
  onKeyDown?: (value: string | number) => void;
  onKeyPress?: (value: string | number) => void;
  onEnter?: (value: string | number) => void;
  accept?: string;
  multiple?: boolean;
  multiline?: boolean | number;
  step?: number;
  min?: number;
  max?: number;
  error?: string | boolean;
  invisible?: boolean;
  readOnly?: boolean;
  leftSymbol?: ReactNode;
  onClearInput?: () => void;
  handleRightAction?: () => void;
};

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  (props, ref) => {
    const {
      id,
      value,
      type = 'text',
      label,
      helpText,
      leftIcon,
      rightIcon,
      state,
      placeholder,
      className,
      style,
      onChange = () => {},
      onClick = () => {},
      onBlur = () => {},
      onFocus = () => {},
      onKeyDown = () => {},
      onKeyPress = () => {},
      onEnter = () => {},
      accept,
      multiple = false,
      multiline,
      step = 1,
      min = 0,
      max = 1000000000000,
      error,
      invisible,
      readOnly,
      leftSymbol,
      onClearInput,
      handleRightAction = () => {},
    } = props;

    const inputVariants = {
      default: `${CLASS_PREFIX}-input`,
      type: {
        text: `${CLASS_PREFIX}-text-input`,
        file: `${CLASS_PREFIX}-file-input`,
        number: `${CLASS_PREFIX}-number-input`,
      } as Record<string, string>,
      state: {
        muted: `${CLASS_PREFIX}-input-muted`,
        disabled: `${CLASS_PREFIX}-input-disabled`,
        active: `${CLASS_PREFIX}-input-active`,
      },
      error: `${CLASS_PREFIX}-input-error`,
      invisible: `${CLASS_PREFIX}-input-invisible`,
    };

    const allClassNames = classNames(
      inputVariants.default,
      inputVariants.type[type],
      state && inputVariants.state[state],
      invisible && inputVariants.invisible,
      error && inputVariants.error,
      className,
    );

    const [fileName, setFileName] = useState<string | string[]>([
      'No file chosen',
    ]);
    const inputRef = ref;

    const focusHandler = () => {
      onFocus();
    };

    const onKeyDownHandler = (e: KeyboardEvent<HTMLInputElement>) => {
      const { value: targetValue } = e.target as HTMLInputElement;
      e.stopPropagation();
      const isNumeric = type === 'number' || isFinite(Number(targetValue));
      if (isNumeric) {
        const numericValue = parseFloat(targetValue) || 0;
        const stepCount = e.shiftKey ? 10 : step;

        if (e.key === 'ArrowUp' || e.keyCode === 38) {
          e.preventDefault();
          const newValue = Math.min(numericValue + stepCount, max);
          (e.target as HTMLInputElement).value = String(newValue);
          onChange?.(newValue);
        }

        if (e.key === 'ArrowDown' || e.keyCode === 40) {
          e.preventDefault();
          const newValue = Math.max(numericValue - stepCount, min);
          (e.target as HTMLInputElement).value = String(newValue);
          onChange?.(newValue);
        }
      }
      if (e.which === 13 || e.keyCode === 13) {
        e.preventDefault();
        e.currentTarget.blur();

        if (Number(value) > max) {
          (e.target as HTMLInputElement).value = String(max);
        } else if (Number(value) < min) {
          (e.target as HTMLInputElement).value = String(min);
        }

        onEnter((e.target as HTMLInputElement).value);
      }
      onKeyDown((e.target as HTMLInputElement).value);
    };

    const onKeyPressHandler = (e: KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      onKeyPress((e.target as HTMLInputElement).value);
    };

    const handleInputChange = (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      if (type === 'file') {
        const fileList = Array.from(
          (e.target as HTMLInputElement).files || [],
        );
        setFileName((prev) =>
          fileList.length > 1
            ? `${fileList.length} files chosen`
            : fileList?.[0]?.name || prev,
        );
      } else {
        const { value: inputValue } = e.target;
        if (type === 'number') {
          onChange(parseFloat(inputValue));
        } else {
          onChange(inputValue);
        }
      }
    };

    const handleInputClick = (e: MouseEvent<HTMLInputElement>) => {
      const { value: clickValue } = e.target as HTMLInputElement;
      if (onClick) {
        onClick(clickValue);
      }
    };
    const handleInputBlur = (e: FocusEvent<HTMLInputElement>) => {
      const { value: blurValue } = e.target;

      if (Number(blurValue) > max) {
        e.target.value = String(max);
      } else if (Number(blurValue) < min) {
        e.target.value = String(min);
      }

      if (onBlur) {
        onBlur(e.target.value);
      }
    };

    const handleOnClearInput = () => {
      if (onClearInput) {
        onClearInput();
      }
    };
    const inputHasIcon = leftIcon || leftSymbol || rightIcon || onClearInput;

    const inputActionProps = {
      onClick: handleInputClick,
      onBlur: handleInputBlur,
      onFocus: focusHandler,
      onChange: handleInputChange,
      onKeyDown: onKeyDownHandler,
      onKeyPress: onKeyPressHandler,
    };

    return (
      <div className={`${CLASS_PREFIX}-input-wrapper`}>
        {type === 'file' ? (
          <Flex direction="column" gap={8}>
            {label && (
              <Label
                text={label}
                type={error ? 'error' : ''}
                helpText={error ? error : helpText}
              />
            )}
            <span className={allClassNames} style={style}>
              <label>
                <input
                  id={id}
                  ref={inputRef as Ref<HTMLInputElement>}
                  type="file"
                  onChange={handleInputChange}
                  hidden
                  accept={accept}
                  multiple={multiple}
                />
                <span className={`${CLASS_PREFIX}-input-file-upload-btn`}>
                  {__('Choose file', 'kirki-ecommerce')}
                </span>
              </label>
              <span className={`${CLASS_PREFIX}-filename-placeholder`}>
                {fileName}
              </span>
            </span>
          </Flex>
        ) : (
          <div className={`${CLASS_PREFIX}-input-controller`}>
            {label && (
              <Label
                text={label}
                type={error ? 'error' : ''}
                helpText={error ? error : helpText}
              />
            )}

            {multiline ? (
              <textarea
                id={id}
                ref={inputRef as Ref<HTMLTextAreaElement>}
                onChange={handleInputChange}
                className={`${CLASS_PREFIX}-textarea ${allClassNames}`}
                style={style}
                value={value}
                placeholder={placeholder}
                rows={multiline ? 5 : 1}
              />
            ) : (
              <div
                className={`${
                  inputHasIcon ? `${CLASS_PREFIX}-input-has-icon` : ''
                } ${leftSymbol ? `${CLASS_PREFIX}-input-has-left-symbol` : ''} ${
                  leftIcon ? `${CLASS_PREFIX}-input-has-left-icon` : ''
                } ${
                  rightIcon || onClearInput
                    ? `${CLASS_PREFIX}-input-has-right-icon`
                    : ''
                }`}
              >
                {(leftIcon || leftSymbol) && (
                  <span className={`${CLASS_PREFIX}-input-left-icon`}>
                    {leftIcon || leftSymbol}
                  </span>
                )}
                <input
                  id={id}
                  ref={inputRef as Ref<HTMLInputElement>}
                  type={type}
                  min={min}
                  max={max}
                  {...inputActionProps}
                  className={allClassNames}
                  style={style}
                  value={value}
                  placeholder={placeholder}
                  readOnly={readOnly}
                />
                {rightIcon && (
                  <span
                    className={`${CLASS_PREFIX}-input-right-icon`}
                    onClick={handleRightAction}
                  >
                    {rightIcon}
                  </span>
                )}
                {onClearInput && (
                  <span
                    className={`${CLASS_PREFIX}-input-right-icon`}
                    onClick={handleOnClearInput}
                  >
                    <CloseIcon />
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

export default Input;
