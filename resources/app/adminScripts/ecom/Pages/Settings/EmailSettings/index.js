import React, { useEffect, useState } from "react";
import { Button, Container, Flex, PageHeading, Card, Text } from "molecules";
import { ShowMoreIcon, AtSignIcon, BrushIcon } from "icons";
import { __ } from "wpi18n";
import { useNavigate, useOutletContext } from "react-router";
import { useDispatch, useSelector } from "react-redux";

import PageNavbar from "../../../components/PageNavbar";
import {
  getSettingsAPI,
  updateSettingsAPI,
  updateSettings,
} from "../../../store/settingsSlice";
import CustomerEmail from "./CustomerEmail";
import AdminEmail from "./AdminEmail";
import { EMAIL_CONFIG, findEmailKeyByName, buildTogglePayload } from "./utils";
import { checkUnsavedDataStatus, setUnsavedDataStatus } from "../utils";

const handleEditOrder = (item) => console.log("Edit:", item);

const EmailSettings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { confirmAction } = useOutletContext();
  const hasUnsavedData = useSelector((state) => state.unsaved?.hasUnsavedData);
  const { loaded, data: emailSettingsData } = useSelector(
    (state) => state.settings?.email,
  );
  const [dataObj, setDataObj] = useState({});
  const adminEmails = dataObj?.admin_emails;
  const customerEmails = dataObj?.customer_emails;

  useEffect(() => {
    if (Object.keys(emailSettingsData || {}).length) {
      setDataObj(emailSettingsData);
    }
  }, [emailSettingsData]);

  useEffect(() => {
    if (!loaded) dispatch(getSettingsAPI("email", {}));
  }, []);

  const handleSaveData = async () => {
    let result = {};
    result = await updateSettingsAPI("email", dataObj);
    if (result.success) {
      setUnsavedDataStatus(false);
      dispatch(updateSettings({ key: "email", value: result.data }));
    }
  };

  const handleToggleOrder = async (item) => {
    const matchedConfigKey = Object.keys(EMAIL_CONFIG).find((k) =>
      item.key.includes(k),
    );

    if (!matchedConfigKey) return;

    const { root, group } = EMAIL_CONFIG[matchedConfigKey];
    const groupData = emailSettingsData?.[root]?.[group];
    if (!groupData) return;

    const selectedKey = findEmailKeyByName(groupData, item.name);
    if (!selectedKey) return;
    setUnsavedDataStatus(true);
    const payload = buildTogglePayload({
      baseData: dataObj,
      rootKey: root,
      groupKey: group,
      selectedKey,
    });

    setDataObj(payload);
  };

  const handleBackButton = () => {
    checkUnsavedDataStatus({
      initialDataObj: emailSettingsData,
      updatedDataObj: dataObj,
      onUnsaved: () =>
        confirmAction({
          action: () => navigate(`/settings`),
        }),
      onClean: () => {
        navigate(`/settings`);
      },
    });
  };

  const handleDiscardData = () => {
    setDataObj(emailSettingsData);
    setUnsavedDataStatus(false);
  };

  return (
    <>
      <PageHeading
        text={__("Settings", "kirki-ecommerce")}
        size="sm"
        sticky
        type="primary"
        style={{ height: "32px" }}
        actions={
          hasUnsavedData ? (
            <>
              <Button
                type="ghost"
                text={__("Cancel", "kirki-ecommerce")}
                onClick={handleDiscardData}
                size="small"
              />
              <Button
                type="primary"
                text={__("Save", "kirki-ecommerce")}
                onClick={handleSaveData}
                size="small"
              />
            </>
          ) : (
            <></>
          )
        }
      />
      <Container size="sm">
        {loaded ? (
          <Flex direction="column" gap={16}>
            <PageNavbar
              textIcon={<AtSignIcon />}
              text={__("Email", "kirki-ecommerce")}
              handleBack={handleBackButton}
            />
            <Card style={{ borderRadius: "8px" }}>
              <Flex
                style={{
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Flex
                  direction="column"
                  style={{ alignItems: "flex-start" }}
                  gap={6}
                >
                  <Text
                    header={__("Default Template", "kirki-ecommerce")}
                    type="primary"
                    style={{ gap: "6px" }}
                    leftIcon={<BrushIcon />}
                  />
                  <Text
                    subHeader={__(
                      "Configure logo, colors, sender email, and more for emails",
                      "kirki-ecommerce",
                    )}
                  />
                </Flex>
                <Button
                  text={__("Edit", "kirki-ecommerce")}
                  type="secondary"
                  onClick={() => {
                    navigate("/settings/email/edit-template");
                  }}
                />
              </Flex>
            </Card>
            {/* Customer Email */}
            <CustomerEmail
              customerEmails={customerEmails}
              handleToggleOrder={handleToggleOrder}
              handleEditOrder={handleEditOrder}
            />
            {/* Admin Email */}
            <AdminEmail
              adminEmails={adminEmails}
              handleToggleOrder={handleToggleOrder}
              handleEditOrder={handleEditOrder}
            />
          </Flex>
        ) : (
          <div>{__("Loading ...", "kirki-ecommerce")}</div>
        )}
      </Container>
    </>
  );
};

export default EmailSettings;
