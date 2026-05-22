import { CLASS_PREFIX } from "@/conf";
import { ArrowLeftIcon } from "@/icons";
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';

import Text from '@/molecules/text';
import React from "react";
import { __ } from "@/wpi18n";
import { Select } from '@/molecules/select';

const Pagination = (props) => {
  const { data, onChange } = props;
  const {
    current_page,
    last_page,
    from,
    total,
    has_more_pages,
    className = "",
    style = {},
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
      <Flex gap={8} style={{ alignItems: "center" }}>
        <Text header={__("Page", "kirki-ecommerce")} type="xsm" />
        <Select
          value={_current_page}
          optionsArray={pagesArray}
          onChange={(value) => onChange(value)}
          style={{ minWidth: "58px" }}
        />
        <Text header={`of ${last_page}`} type="xsm" />
      </Flex>
      <ActionGroup>
        <Button
          icon={<ArrowLeftIcon />}
          type="ghost"
          size="small"
          state={_current_page === 1 ? "disabled" : ""}
          onClick={() => onChange(_current_page - 1)}
        />
        {pagesArray.map((page, index) => (
          <Button
            key={index}
            type={_current_page === page.value ? "primary" : "link"}
            size="small"
            text={page.title}
            onClick={() => onChange(page.value)}
            style={{
              width: "32px",
              height: "32px",
            }}
          />
        ))}
        <Button
          icon={<ArrowLeftIcon />}
          style={{ transform: "rotate(180deg)" }}
          type="ghost"
          state={_current_page === last_page ? "disabled" : ""}
          size="small"
          onClick={() => onChange(_current_page + 1)}
        />
      </ActionGroup>
    </div>
  );
};

export default Pagination;
