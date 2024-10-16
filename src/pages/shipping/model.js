
export const accessColumn = ({ handleEdit, handleDelete, handleView }) => [
  {
    title: "รหัส Shipping",
    key: "unitcode",
    dataIndex: "unitcode",
    align: "left",
    width: "20%",
    sorter: (a, b) => (a?.unitcode || "").localeCompare(b?.unitcode || ""),
  },
  {
    title: "ผู้รับ",
    dataIndex: "unitname",
    key: "unitname",
    width: "60%",
    sorter: (a, b) => (a?.unitname || "").localeCompare(b?.unitname || ""),
  },
  // {
  //   title: "สถานะ",
  //   dataIndex: "active_status",
  //   key: "active_status",
  //   width: "20%",
  //   sorter: (a, b) => (a?.active_status || "").localeCompare(b?.active_status || ""),
  //   render: (data) => (
  //     <div>
  //       {data === "Y" ? (
  //         <Badge status="success" text="เปิดการใช้งาน" />
  //       ) : (
  //         <Badge status="error" text="ปิดการใช้การ" />
  //       )}
  //     </div>
  //   ),
  // },
  // {
  //   title: "Action",
  //   key: "operation",
  //   width: "10%",
  //   fixed: "right",
  //   render: (text, record) => (
  //     <Space>
  //       <Button
  //         icon={<EditOutlined />}
  //         className="bn-primary-outline"
  //         style={{
  //           cursor: "pointer",
  //           display: "flex",
  //           alignItems: "center",
  //           justifyContent: "center",
  //         }}
  //         onClick={(e) => handleEdit(record)}
  //         size="small"
  //       />
  //     </Space>
  //   ),
  // },
];
export const DEFALUT_CHECK_DELIVERY = {
  dncode: null,
  dndate: null,
  qtcode: null,  
  payment: null,
  cuscode: null,
  remark: null,
  total_weight: 0,
}

export const Items = {
  id: null,
  unitcode: null,
  stname: null,
  prename: null,
  idno: null,
  road: null,
  subdistrict: null,
  district: null,
  province: null,
  zipcode: null,
  country: null,
  delidno: null,
  delroad: null,
  delsubdistrict: null,
  deldistrict: null,
  delprovince: null,
  delzipcode: null,
  delcountry: null,
  tel: null,
  fax: null,
  taxnumber: null,
  email: null,
  active_status: "Y",
};
