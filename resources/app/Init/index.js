import { useGetListAPI } from "@/hooks";
import { getAttributesAPI } from "../store/attributesSlice";
import { useDispatch } from "react-redux";
import { getDefaultSettingsAPI } from "../store/settingsSlice";

const Init = ({ children }) => {
  const dispatch = useDispatch();
  // app config
  const handleMigration = async () => {
    try {
      const result = await dispatch(getDefaultSettingsAPI());
      if (result) {
        console.log(result, "initial data fetch successful");
      } else {
        console.log("data fetch failed");
      }
    } catch (error) {
      console.error("data fetch error:", error);
    }
  };
  handleMigration();
  useGetListAPI({
    reducerName: "attributes",
    apiCallBack: getAttributesAPI,
    limit: -1,
  });
  return children;
};

export default Init;
