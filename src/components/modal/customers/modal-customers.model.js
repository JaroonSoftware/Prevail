import { Badge, Typography } from "antd";


/** get items column */
export const customersColumn = ({handleChoose, showPendingSO = false, showPendingDN = false, showPendingBL = false})=>{
    const Link = Typography.Link;
    const hasBadge = showPendingSO || showPendingDN || showPendingBL;
    const cols = [
      {
        title: "รหัสลูกค้า",
        key: "cuscode",
        dataIndex: "cuscode",
        width: hasBadge ? "25%" : "30%",
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}>{v}</Link>
      },
      {
        title: "ชื่อลูกค้า",
        dataIndex: "cusname",
        key: "cusname",
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}>{v}</Link>
      },
    ];

    if (showPendingSO) {
      cols.push({
        title: "ใบขายรอส่ง",
        key: "pending_so_count",
        dataIndex: "pending_so_count",
        align: "center",
        width: 120,
        render: (v) => (
          <Badge
            count={Number(v || 0)}
            showZero
            style={{ backgroundColor: Number(v) > 0 ? "#fa8c16" : "#d9d9d9" }}
          />
        ),
      });
    }

    if (showPendingDN) {
      cols.push({
        title: "ใบส่งค้างวางบิล",
        key: "pending_dn_count",
        dataIndex: "pending_dn_count",
        align: "center",
        width: 130,
        render: (v) => (
          <Badge
            count={Number(v || 0)}
            showZero
            style={{ backgroundColor: Number(v) > 0 ? "#fa8c16" : "#d9d9d9" }}
          />
        ),
      });
    }

    if (showPendingBL) {
      cols.push({
        title: "ใบวางบิลรอออกใบเสร็จ",
        key: "pending_bl_count",
        dataIndex: "pending_bl_count",
        align: "center",
        width: 160,
        render: (v) => (
          <Badge
            count={Number(v || 0)}
            showZero
            style={{ backgroundColor: Number(v) > 0 ? "#fa8c16" : "#d9d9d9" }}
          />
        ),
      });
    }

    return cols;
  };