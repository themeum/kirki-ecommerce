import { useEffect, useState } from 'react';

import ThumbnailSelector from '@/components/thumbnail-selector';
import {
  BrushIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  SendIcon,
} from '@/icons';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import ColorPicker from '@/molecules/color-picker';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import PageHeading from '@/molecules/page-heading';
import ProgressBar from '@/molecules/progressbar';
import Tab from '@/molecules/tab';
import Text from '@/molecules/text';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getSettingsAPI,
  updateSettings,
  updateSettingsAPI,
} from '@/store/settingsSlice';
import { getErrorsObject } from '@/store/utils';
import type { FormErrors, MediaChangePayload, SettingsSectionData } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

type EmailTemplateColors = {
  background?: string;
  text?: string;
  link?: string;
  label?: string;
  button?: string;
  button_bg?: string;
};

type EmailTemplate = {
  logo?: string;
  height?: string | number;
  position?: string;
  colors?: EmailTemplateColors;
  [key: string]: unknown;
};

const EditTemplate = () => {
  const POSITION_MAP: Record<string, number> = {
    start: 0,
    center: 1,
    end: 2,
  };

  const dispatch = useAppDispatch();
  const INDEX_TO_POSITION = ['start', 'center', 'end'];
  const { loaded, data: emailSettingsData } = useAppSelector(
    (state) => state.settings?.email,
  );
  const defaultEmail = emailSettingsData?.default_template as
    | EmailTemplate
    | undefined;
  const [dataObj, setDataObj] = useState<EmailTemplate>(defaultEmail || {});
  const [heightValue, setHeightValue] = useState(
    parseInt(String(defaultEmail?.height), 10) || 50,
  );
  const [logo, setLogo] = useState(defaultEmail?.logo || '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [position, setPosition] = useState(
    POSITION_MAP[defaultEmail?.position || ''] || 0,
  );

  useEffect(() => {
    if (!defaultEmail) {
      return;
    }
    setDataObj(defaultEmail);
    setHeightValue(parseInt(String(defaultEmail?.height), 10));
    setLogo(defaultEmail?.logo || '');
    setPosition(POSITION_MAP[defaultEmail.position || ''] || 0);
  }, [defaultEmail]);

  useEffect(() => {
    if (!loaded) {
      dispatch(getSettingsAPI('email', {}));
    }
  }, []);

  const handleOnchange = (key: string, value: unknown) => {
    const colors = [
      'background',
      'text',
      'link',
      'label',
      'button',
      'button_bg',
    ];
    setDataObj((prev) => {
      if (colors.includes(key)) {
        return {
          ...prev,
          colors: {
            ...(prev.colors as EmailTemplateColors),
            [key]: value,
          },
        };
      }
      if (key === 'position') {
        setPosition(value as number);
        const positionValue = INDEX_TO_POSITION[value as number];
        return {
          ...prev,
          [key]: positionValue,
        };
      }
      if (key === 'logo') {
        const media = value as MediaChangePayload;
        setLogo(media?.url || '');
        return {
          ...prev,
          [key]: media?.url,
        };
      }
      return { ...prev, [key]: value };
    });

    setErrors((prev) => ({
      ...prev,
      ['data.' + key]: null,
    }));
  };

  const handleSaveData = async () => {
    if (!emailSettingsData) {
      return;
    }

    const payload: SettingsSectionData = {
      ...emailSettingsData,
      default_template: {
        ...(emailSettingsData.default_template as EmailTemplate),
        ...dataObj,
        height: `${heightValue}px`,
      },
    };

    const result = await updateSettingsAPI('email', payload);
    if (isApiSuccess(result)) {
      dispatch(
        updateSettings({
          key: 'email',
          value: result.data as SettingsSectionData,
        }),
      );
    } else {
      const errorPayload = result as { errors?: Record<string, string[]> };
      setErrors(getErrorsObject(errorPayload.errors));
    }
  };

  const handleDiscard = () => {
    if (!defaultEmail) {
      return;
    }

    setDataObj(defaultEmail);
    setHeightValue(parseInt(String(defaultEmail.height), 10) || 50);
    setLogo(defaultEmail.logo || '');
    setPosition(POSITION_MAP[defaultEmail.position || ''] || 0);
    setErrors({});
  };

  return (
    <>
      <PageHeading
        text={__('Edit Template', 'kirki-ecommerce')}
        hasBack
        style={{
          fontSize: '16px',
          fontWeight: '400',
          lineHeight: '28px',
          padding: '0px 32px',
          height: '32px',
        }}
        leftIcon={<BrushIcon />}
        size="fullWidth"
        sticky
        actions={
          <>
            <Button
              type="ghost"
              text={__('Discard', 'kirki-ecommerce')}
              size="small"
              onClick={handleDiscard}
            />
            <Button
              type="primary"
              text={__('Save', 'kirki-ecommerce')}
              size="small"
              onClick={handleSaveData}
            />
          </>
        }
      />
      <Container
        size="fullWidth"
        style={{ width: '100%', padding: '16px 103px' }}
      >
        {loaded ? (
          <Flex gap={48} style={{ width: '100%' }}>
            <Flex direction="column" gap={20} style={{ width: '44%' }}>
              <Card type="large" style={{ borderRadius: '8px' }}>
                <Text
                  type="primary"
                  header={'Logo'}
                  subHeader={'Update the logo & style your way'}
                />
                <ThumbnailSelector
                  placeholder={__(
                    'Drag and drop, or upload images',
                    'kirki-ecommerce',
                  )}
                  src={logo || ''}
                  helpText={__('Set store logo', 'kirki-ecommerce')}
                  onChange={(img) => handleOnchange('logo', img)}
                  error={
                    errors['data.default_template.logo'] as
                      | string
                      | boolean
                      | undefined
                  }
                />
                <Input
                  label={__('Height', 'kirki-ecommerce')}
                  type="number"
                  value={heightValue}
                  onChange={(value) => setHeightValue(Number(value))}
                  error={
                    errors['data.default_template.height'] as
                      | string
                      | boolean
                      | undefined
                  }
                />
                <ProgressBar
                  value={heightValue}
                  onChange={setHeightValue}
                  label={'Height'}
                  rightText={`${heightValue}px`}
                />
                <Tab
                  key={position}
                  activeIndex={position}
                  onChange={(value) => handleOnchange('position', value)}
                >
                  <AlignLeftIcon />
                  <AlignCenterIcon />
                  <AlignLeftIcon style={{ transform: 'scaleX(-1)' }} />
                </Tab>
              </Card>
              <Card type="large" style={{ borderRadius: '8px' }}>
                <Text
                  header={'Colors'}
                  subHeader={'Style how the emails will look'}
                />
                <ColorPicker
                  value={dataObj?.colors?.background}
                  onChange={(value) => handleOnchange('background', value)}
                  label={'Background'}
                  error={
                    errors['data.default_template.colors.background'] as
                      | string
                      | boolean
                      | undefined
                  }
                />
                <ColorPicker
                  value={dataObj?.colors?.text}
                  onChange={(value) => handleOnchange('text', value)}
                  label={'Text'}
                  error={
                    errors['data.default_template.colors.text'] as
                      | string
                      | boolean
                      | undefined
                  }
                />
                <ColorPicker
                  value={dataObj?.colors?.link}
                  onChange={(value) => handleOnchange('link', value)}
                  label={'Link'}
                  error={
                    errors['data.default_template.colors.link'] as
                      | string
                      | boolean
                      | undefined
                  }
                />
                <ColorPicker
                  value={dataObj?.colors?.label}
                  onChange={(value) => handleOnchange('label', value)}
                  label={'Label'}
                  error={
                    errors['data.default_template.colors.label'] as
                      | string
                      | boolean
                      | undefined
                  }
                />
                <ColorPicker
                  value={dataObj?.colors?.button}
                  onChange={(value) => handleOnchange('button', value)}
                  label={'Button Color'}
                  error={
                    errors['data.default_template.colors.button'] as
                      | string
                      | boolean
                      | undefined
                  }
                />
                <ColorPicker
                  value={dataObj?.colors?.button_bg}
                  onChange={(value) => handleOnchange('button_bg', value)}
                  label={'Button BG'}
                  error={
                    errors['data.default_template.colors.button_bg'] as
                      | string
                      | boolean
                      | undefined
                  }
                />
              </Card>
            </Flex>

            <Flex style={{ width: '56%' }} direction="column" gap={16}>
              <Flex
                style={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text header={'Template Preview'} />
                <Text
                  style={{
                    fontSize: '12px',
                    lineHeight: '18px',
                  }}
                  header={'Send Text Mail'}
                  leftIcon={<SendIcon />}
                />
              </Flex>
              <Card style={{ borderRadius: '0px' }}></Card>
            </Flex>
          </Flex>
        ) : (
          <div>{__('Loading ...', 'kirki-ecommerce')}</div>
        )}
      </Container>
    </>
  );
};

export default EditTemplate;
