import { message, Select } from "antd";
import React from "react";
import { filterOption } from "../../../utils/util";
// import OptionService from "../../../service/Options.service";

// const optrequest = OptionService();
export default function MySelect({
  name = "payment",
  onChange,
  value = null,
  style = {},
  className = "",
}) {
  const [options, setOptions] = React.useState([]);
  React.useEffect(() => {
    const init = async () => {
      try {
        setOptions([
          { value: "เงินสด", label: "เงินสด" },
          { value: "โอน", label: "โอน" },
          { value: "เช็คธนาคาร", label: "เช็คธนาคาร" },
        ]);
      } catch (e) {
        console.log(e);
        message.error("เกิดข้อผิดพลาดจากการดึงข้อมูล");
      }
    };

    init();
  }, []);

  const handleChange = (e, res) => {
    if (typeof onChange === "function") {
      onChange(e, res);
    }
  };

  return (
    <Select
      defaultValue={value}
      style={{ ...{ width: "100%", height: "40px" }, ...style }}
      name={name}
      placeholder="เลือกวิธีชำระ"
      className={className}
      showSearch
      filterOption={filterOption}
      options={options}
      onChange={handleChange}
      autoClearSearchValue={false}
      allowClear
    />
  );
}
