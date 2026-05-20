import React from "react";
import CollectionTable from "./CollectionTable";
import { Button, Card, Container, Flex, PageHeading } from "molecules";
import { useDispatch, useSelector } from "react-redux";
import { getCollectionsAPI, setKeyValue } from "../../store/collectionsSlice";
import { useGetListAPI } from "hooks";
import { Pagination } from "components";
import { useNavigate } from "react-router";
import { NEW_ITEM_ID } from "conf";
import { __ } from "wpi18n";

const Collections = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loaded, data } = useSelector((state) => state.collections);
  useGetListAPI({ reducerName: "collections", apiCallBack: getCollectionsAPI });
  const handlePaginationChange = (value) => {
    dispatch(setKeyValue({ key: "page", value: value }));
  };
  return (
    <>
      <PageHeading
        text={__("Collections", "kirki-ecommerce")}
        actions={
          <Button
            type="primary"
            size="small"
            text={__("Add Collection", "kirki-ecommerce")}
            onClick={() => {
              navigate("/collections/" + NEW_ITEM_ID);
            }}
          />
        }
      />
      <Container>
        {loaded ? (
          <Flex direction="column" gap={16}>
            <Card type="table">
              <CollectionTable />
            </Card>
            <Pagination
              data={data}
              onChange={(page) => handlePaginationChange(page)}
            />
          </Flex>
        ) : (
          <div>{__("Loading...", "kirki-ecommerce")}</div>
        )}
      </Container>
    </>
  );
};

export default Collections;
