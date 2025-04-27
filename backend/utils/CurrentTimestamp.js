import moment from "moment-timezone";

const getCurrentManilaTimestamp = () => {
  return moment().tz("Asia/Manila").format("YYYY-MM-DD HH:mm:ss");
};

export default getCurrentManilaTimestamp;
