import { Button, Card, Container, Flex, PageHeading } from "@/molecules";
import React from "react";
import TagTable from "./TagTable";
import NewTag from "./NewTag";
import { Pagination } from "@/components";
import { useDispatch, useSelector } from "react-redux";
import { useGetListAPI } from "@/hooks";
import { getTagsAPI, setKeyValue } from "../../store/tagsSlice";
import { __ } from "@/wpi18n";

const Tags = () => {
  const dispatch = useDispatch();
  const { loaded, data } = useSelector((state) => state.tags);
  useGetListAPI({ reducerName: "tags", apiCallBack: getTagsAPI });

  const handlePaginationChange = (value) => {
    dispatch(setKeyValue({ key: "page", value: value }));
  };
  return (
    <>
      <PageHeading text={__("Tags", "kirki-ecommerce")} actions={<NewTag />} />
      <Container>
        {loaded ? (
          <Flex direction="column" gap={16}>
            <Card type="table">
              <TagTable />
            </Card>
            <Pagination
              data={data}
              onChange={(page) => handlePaginationChange(page)}
            />
          </Flex>
        ) : (
          <div>Loading...</div>
        )}
      </Container>
    </>
  );
};

export default Tags;
