import { CLASS_PREFIX } from '@/conf';
import { ArrowLeftIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import { Select } from '@/molecules/select';
import Text from '@/molecules/text';
import type { PaginationData } from '@/types';
import { __ } from '@/wpi18n';

type PaginationProps = {
  data: PaginationData;
  onChange: (page: number) => void;
};

const Pagination = (props: PaginationProps) => {
  const { data, onChange } = props;
  const {
    current_page,
    last_page,
    from,
    total,
  } = data;

  const pagesArray = [...Array(last_page)].map((_, i) => ({
    title: `${i + 1}`,
    value: i + 1,
  }));

  const _current_page = current_page * 1;

  if (_current_page == last_page && last_page == from) {
    return null;
  }

  if (total == 0) {
    return null;
  }

  return (
    <div className={`${CLASS_PREFIX}-pagination-wrapper`}>
      <Flex gap={8} style={{ alignItems: 'center' }}>
        <Text header={__('Page', 'kirki-ecommerce')} type="xsm" />
        <Select
          value={_current_page}
          optionsArray={pagesArray}
          onChange={(value) => onChange(Number(Array.isArray(value) ? value[0] : value))}
          style={{ minWidth: '58px' }}
        />
        <Text header={`of ${last_page}`} type="xsm" />
      </Flex>
      <ActionGroup>
        <Button
          icon={<ArrowLeftIcon />}
          type="ghost"
          size="small"
          state={_current_page === 1 ? 'disabled' : ''}
          onClick={() => onChange(_current_page - 1)}
        />
        {pagesArray.map((page, index) => (
          <Button
            key={index}
            type={_current_page === page.value ? 'primary' : 'link'}
            size="small"
            text={page.title}
            onClick={() => onChange(page.value)}
            style={{
              width: '32px',
              height: '32px',
            }}
          />
        ))}
        <Button
          icon={<ArrowLeftIcon />}
          style={{ transform: 'rotate(180deg)' }}
          type="ghost"
          state={_current_page === last_page ? 'disabled' : ''}
          size="small"
          onClick={() => onChange(_current_page + 1)}
        />
      </ActionGroup>
    </div>
  );
};

export default Pagination;
