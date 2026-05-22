import React from "react";
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import ProductTable from './product-table/product-table';
import { useDispatch, useSelector } from "react-redux";
import { getProductsAPI, setKeyValue } from "../../store/productsSlice";
import { useGetListAPI } from "@/hooks";
import Pagination from '@/components/pagination';
import { __ } from "@/wpi18n";
import { NEW_ITEM_ID } from "@/conf";
import { useNavigate } from "react-router";

const Products = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loaded, data } = useSelector((state) => state.products);
  useGetListAPI({ reducerName: "products", apiCallBack: getProductsAPI });
  const handlePaginationChange = (value) => {
    dispatch(setKeyValue({ key: "page", value: value }));
  };
  return (
    <>
      <PageHeading
        text={__("Products", "kirki-ecommerce")}
        actions={
          <>
            <Button text={__("Import", "kirki-ecommerce")} type="ghost" size="small" />
            <Button text={__("Export", "kirki-ecommerce")} type="ghost" size="small" />
            <Button
              text={__("Add Product", "kirki-ecommerce")}
              type="primary"
              size="small"
              onClick={() => {
                navigate("/products/" + NEW_ITEM_ID);
              }}
            />
          </>
        }
      />
      <Container>
        {loaded ? (
          <Flex direction="column" gap={16}>
            <Card type="table">
              <ProductTable />
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

export default Products;
