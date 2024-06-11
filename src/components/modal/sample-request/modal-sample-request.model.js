import { Typography } from "antd";
import dayjs from 'dayjs';

/** get items column */
export const columns = ({handleChoose})=>{
    const { Paragraph, Link } = Typography;
    return [
      {
        title: "SR No.",
        key: "srcode",
        dataIndex: "srcode", 
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}>{v}</Link>
      },
      {
        title: "Sample Request Date",
        dataIndex: "srdate",
        key: "srdate",
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}> {dayjs(v).format("DD/MM/YYYY")}</Link>
      },
      {
        title: "Due Date",
        dataIndex: "duedate",
        key: "duedate",
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}> {dayjs(v).format("DD/MM/YYYY")}</Link>
      },
      {
        title: "Customer",
        dataIndex: "cuscode",
        key: "cuscode",
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}> {`${record.cuscode} - ${record.cusname}`}</Link>
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
        render: (v) => (
          <Paragraph style={{margin:'0px'}}>
            <pre style={{margin:'0px', backgroundColor:'transparent', border:'0px solid', padding:'0px'}}>{v}</pre>
          </Paragraph>
        )
      } 
    ]
};
/** get items column */
export const columnsDetail = ({handleChoose})=>{
    const { Link } = Typography;
    return [
      {
        title: "SR No.",
        key: "srcode",
        dataIndex: "srcode", 
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}>{v}</Link>
      },
      {
        title: "Sample Name.",
        key: "spname",
        dataIndex: "spname", 
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}>{v}</Link>
      },
      {
        title: "Sample Request Date",
        dataIndex: "srdate",
        key: "srdate",
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}> {dayjs(v).format("DD/MM/YYYY")}</Link>
      },
      {
        title: "Due Date",
        dataIndex: "duedate",
        key: "duedate",
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}> {dayjs(v).format("DD/MM/YYYY")}</Link>
      },
      {
        title: "Customer",
        dataIndex: "cuscode",
        key: "cuscode",
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}> {`${record.cuscode} - ${record.cusname}`}</Link>
      } 
    ]
};

export const srmaster = {
    srcode: null,
    srdate: null,
    cuscode: null,
    description: null,
    srstatus: null,
    create_date: null,
    create_by : null,
}
