import React, { useEffect, useState } from "react";
import PageHeading from '@/molecules/page-heading';
import Button from '@/molecules/button';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import Card from '@/molecules/card';
import PageNavbar from '@/components/page-navbar';
import { ColorPaletteIcon } from "@/icons";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import { __, sprintf } from "@/wpi18n";
import VariationTable from './variation-table/variation-table';
import VariationValuePopup from './variation-value-popup';

const ColorVariation = () => {
  let { id } = useParams();
  const attributeList = useSelector((state) => state.attributes?.data) || [];

  const [colorList, setColorList] = useState([]);
  const [addVariantPopup, setAddVariantPopup] = useState(false);
  const selectedItem = attributeList.find(
    (attribute) => attribute?.id === Number(id)
  );
  const tableHeaders = [
    { title: sprintf(__("%s", "kirki-ecommerce"), selectedItem?.name) },
    { title: __("Hex code", "kirki-ecommerce") },
    { title: __("Updated", "kirki-ecommerce") },
    { title: __("", "kirki-ecommerce") },
  ];

  useEffect(() => {
    setColorList(selectedItem?.values);
  }, [selectedItem]);

  return (
    <div>
      <PageHeading
        text={__("Settings", "kirki-ecommerce")}
        size="sm"
        sticky
        type="primary"
        style={{ height: "32px" }}
      />
      <Container size="sm">
        <Flex direction="column" gap={16}>
          <PageNavbar
            textIcon={<ColorPaletteIcon />}
            text={__("Color", "kirki-ecommerce")}
            rightAction={
              <div>
                <Button
                  type="link"
                  text={__("Add color", "kirki-ecommerce")}
                  style={{ color: "var(--decom-color-blue-3)", padding: 0 }}
                  onClick={() => setAddVariantPopup(true)}
                />
              </div>
            }
          />
          {!colorList?.length ? (
            <Card
              type="large"
              style={{ borderRadius: "8px", padding: "36px 0" }}
            >
              <Flex direction="column" gap={8} style={{ alignItems: "center" }}>
                <ColorPaletteIcon />
                <span style={{ color: "#878593" }}>
                  {__("No color added yet", "kirki-ecommerce")}
                </span>
              </Flex>
            </Card>
          ) : (
            <Card type="table">
              <VariationTable
                results={colorList}
                updateDataList={setColorList}
                tableHeaders={tableHeaders}
                selectedItem={selectedItem}
              />
            </Card>
          )}
        </Flex>
      </Container>
      <VariationValuePopup
        isOpen={addVariantPopup}
        selectedItem={selectedItem}
        type={selectedItem?.type}
        onClose={() => setAddVariantPopup(false)}
      />
    </div>
  );
};

export default ColorVariation;
