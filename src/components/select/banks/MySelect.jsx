import { Flex, message, Select, Typography } from 'antd';
import React from 'react';
import { useBanksSimple } from "../../../hooks/useBanksSimple";
import "../../../assets/styles/banks.css";

export default function MySelect({ value, onChange, keyValue = "key", style = {}, className = "", placeholder, disabled }) {
  const { 
    banks, 
    loading, 
    error
  } = useBanksSimple({ 
    keyValue, 
    autoFetch: true 
  });

  const [options, setOptions] = React.useState([]);

  React.useEffect(() => {
    if (error) {
      console.error("Error fetching bank options:", error);
      message.error(error.message || "เกิดข้อผิดพลาดจากการดึงข้อมูลธนาคาร");
    }
  }, [error]);

  React.useEffect(() => {
    if (banks.length > 0) {
      const opnNew = banks.map(v => ({
        value: v[keyValue] || v.key,
        label: (
          <>
            <Flex align='center' gap={8}>
              <i className={`bank bank-${v.key} shadow huge`} style={{ height: 30, width: 30 }}></i>
              <Flex align='start' gap={1} vertical>
                {/* <Typography.Text ellipsis style={{ fontSize: 13 }}>{v.thai_name}</Typography.Text> */}
                <Typography.Text ellipsis={true} style={{ fontSize: 11, color: '#8c8386' }}>{v.official_name}</Typography.Text>
              </Flex>
            </Flex>
          </>
        ),
        record: v,
      }));
      setOptions(opnNew);
    }
  }, [banks, keyValue]);

  // Simplify handleChange: AntD Select's onChange already passes the value as the first argument
  const handleChange = (selectedValue, option) => {
    // console.log(e, selectedValue, option);
    const { record: v } = option;
    if (typeof onChange === "function") {
      onChange(selectedValue, v); // Pass only the selected value to Form.Item
    }
  }

  return (
    <Select
      showSearch
      autoClearSearchValue
      style={{ height: 42, width: '100%', ...style }} // Merge external style
      className={className} // Pass className
      options={options}
      optionFilterProp="children"
      filterOption={(input, option) => {
        const { record: v } = option;
        const val = input?.toLowerCase();
        return (
          // (v?.key?.toLowerCase() ?? '').includes(val) ||
          (v?.official_name?.toLowerCase() ?? '').includes(val) ||
          (v?.thai_name?.toLowerCase() ?? '').includes(val)
        )
      }}
      filterSort={(optionA, optionB) => {
        const { record: v1 } = optionA;
        const { record: v2 } = optionB;

        return (v1?.official_name ?? '').toLowerCase().localeCompare((v2?.official_name ?? '').toLowerCase())
      }
      }
      optionLabelProp="label"
      optionRender={(option) => {
        const { record: v } = option.data;
        return (
          <>
            <Flex align='self-end' gap={8}>
              <i className={`bank bank-${v.key} shadow huge flex flex-grow-1`} style={{ height: 34, width: 34, minWidth: 34}} ></i>
              <Flex align='start' gap={1} vertical>
                <Typography.Text ellipsis style={{ fontSize: 13, maxWidth: '100%' }}>{v.thai_name}</Typography.Text>
                <Typography.Text ellipsis style={{ fontSize: 11, color: '#8c8386', maxWidth: '100%'}}>{v.official_name}</Typography.Text>
              </Flex>
            </Flex>
          </>
        )
      }}
      allowClear
      placeholder={placeholder || 'กรุณาเลือกธนาคาร'} // Use prop or default
      onChange={handleChange}
      value={value} // Pass the value prop here
      loading={loading} // Pass loading state
      disabled={disabled} // Pass disabled prop
    />
  )
}