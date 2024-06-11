import { Tag, Typography } from "antd";
import dayjs from "dayjs";
import { IoMdTime } from "react-icons/io";
import { comma } from "../../utils/util";
export const sampleListColumn = ({handleShowDetail}) => [
    {
      title: "SR Code",
      key: "srcode",
      dataIndex: "srcode", 
      align: "left",  
    },
    {
      title: "SR Date",
      key: "srdate",
      dataIndex: "srdate", 
      render : (v) => dayjs(v).format("DD/MM/YYYY")
    },
    {
      title: "Sample Name",
      key: "count_srdetail",
      dataIndex: "count_srdetail", 
      align: "left",
      render : (v, record) => <Typography.Link onClick={() => handleShowDetail(record)}>({comma(Number(v || 0))}) samples</Typography.Link>
    }, 
    {
      title: "Customer",
      key: "cusname",
      dataIndex: "cusname", 
      align: "left",  
    }, 
    {
      title: "Due Date",
      key: "duedate",
      dataIndex: "duedate", 
      render : (v) => dayjs(v).format("DD/MM/YYYY")
    },
]

export const sampleWaitingApproveColumn = [
    {
      title: "",
      key: "ind",
      dataIndex: "ind", 
      width:20,
      render:() => <IoMdTime color="#ff7e23" style={{fontSize: '1.3rem'}} />
    },
    {
      title: "Sample Code",
      key: "spcode",
      dataIndex: "spcode", 
      align: "left",  
    },
    {
      title: "Sample Name",
      key: "spname",
      dataIndex: "spname", 
      align: "left",  
    },
    {
      title: "Sample Date",
      key: "spdate",
      dataIndex: "spdate", 
      render : (v) => dayjs(v).format("DD/MM/YYYY")
    },
    {
      title: "Sample Date",
      key: "spdate",
      dataIndex: "spdate", 
      render: (v) => {     
        const parsedDate1 = dayjs(v);
        const parsedDate2 = dayjs(new Date());
        
        // // Calculate the difference in days
        const diffInDays = parsedDate2.diff(parsedDate1, 'day');
        
        // console.log(`The difference between ${parsedDate1.format("DD/MM/YYYY")} and ${parsedDate2.format("DD/MM/YYYY")} is ${diffInDays} days.`);
        // <Tag icon={<MdOutlineFiberNew />} color="#cd201f"> </Tag>
        return diffInDays < 1 ? <Tag color="#3ab38a" >today.</Tag> : <Tag  color="#b4b4b1">{diffInDays} days ago.</Tag>;
      }
    },
]

export const itemFileExpireColumn = [
    {
      title: "Item Code",
      key: "itemcode",
      dataIndex: "itemcode", 
    },
    {
      title: "Item Name",
      key: "stname",
      dataIndex: "stname", 
      align: "left",  
    },
    {
      title: "Title Name",
      key: "title_name",
      dataIndex: "title_name", 
      align: "left",  
    },
    {
      title: "Exprie Date",
      key: "expire_date",
      dataIndex: "expire_date", 
      render : (v) => dayjs(v).format("DD/MM/YYYY")
    },
    {
      title: "Will expire on",
      key: "diff_days",
      dataIndex: "diff_days", 
      render: (v) => {     
        const inDay = Number( v );
        return  inDay > 0 
        ? <Tag color={ inDay <= 5 ? "#cd201f" : "#ebb539" } >Expires in {inDay} days.</Tag> 
        : <Tag color="#292626cc" >Expired.</Tag>;
      }
    },
];

export const sampleDetailColumn = [
    {
      title: "Sample Name",
      key: "spname",
      dataIndex: "spname", 
    },
    {
      title: "Packaging",
      key: "pkname",
      dataIndex: "pkname", 
      align: "left",  
    },
    {
      title: "Amount",
      key: "amount",
      dataIndex: "amount", 
      align: "left",
      render:(v) => comma( Number(v || 0) )
    },
];


export const statisticValue = {
  daily : 0,
  monthly : 0,
  yearly : 0,
  waiting : 0,
}