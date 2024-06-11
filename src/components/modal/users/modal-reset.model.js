import { TagsFilled } from "@ant-design/icons";
import { Flex, Tag, Typography } from "antd";
import dayjs from 'dayjs';

/** get items column */
export const columns = ({handleChoose})=>{
    const { Link } = Typography;
    return [
      {
        title: "SP No.",
        key: "spcode",
        dataIndex: "spcode", 
        sorter: (a, b) => (a.spcode).localeCompare(b.spcode),
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}>{v}</Link>
      },
      {
        title: "Sample Praparation Name",
        dataIndex: "spname",
        key: "spname",
        sorter: (a, b) => (a.spname).localeCompare(b.spname),
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}>{v}</Link>
      },
      {
        title: "SR No.",
        dataIndex: "srcode",
        key: "srcode",
        sorter: (a, b) => (a?.srcode || "").localeCompare(b?.srcode || ""),
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}>{v}</Link>
      },
      {
        title: "Preparation Date",
        dataIndex: "spdate",
        key: "spdate",
        sorter: (a, b) => (a.spdate).localeCompare(b.spdate),
        render: (v, record) => <Link className="text-select" onClick={()=>handleChoose(record)}>{dayjs(v).format("DD/MM/YYYY")}</Link>
      },
      {
        title: "Tag",
        dataIndex: "tag",
        key: "tag",
        width: 210,
        render: (data) => {
            const tags = JSON.parse(data)?.map((str, i) =>
            <Tag icon={<TagsFilled />} color="#3b5999" key={i} className="m-0" >
              {str}
            </Tag>
          );
  
          return <>
            <Flex wrap="wrap" gap={2}>{tags}</Flex>
          </>
        },
      } 
    ]
};

export const spmaster = {
    spcode: null,
    spname: null,
    spdate: null,
    srcode: null,
    pkcode: null,
    netweight: null,
    specific_gravity: null,
    description: null,
    spstatus: null,
    create_date: null,
    create_by : null,
}
