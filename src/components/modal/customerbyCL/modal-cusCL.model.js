/** get items column */
export const columns = ()=>{
  return [
    {
      title: "รหัสลูกค้า",
      key: "cuscode",
      dataIndex: "cuscode", 
    },
    {
      title: "ชื่อลูกค้า",
      dataIndex: "cusname",
      key: "cusname",
    },
  ]
};