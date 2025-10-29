import { Tag } from "antd"
import { CheckCircleFilled,ClockCircleFilled } from "@ant-design/icons"
import { CloseCircleFilledIcon } from '../../icon';


export default function TagReceiptStatus({result}) {
  let elementToRender;

  switch (result) {
    case 'ชำระเงินครบแล้ว':
      elementToRender = <Tag icon={<CheckCircleFilled />} color="#87d068"> ชำระเงินครบแล้ว </Tag>;
      break;
    case 'ชำระเงินไม่ครบ':
      elementToRender = <Tag icon={<CloseCircleFilledIcon />} color="#ffab47"> ชำระเงินไม่ครบ </Tag>;
      break;
    case 'รอชำระเงิน':
      elementToRender = <Tag icon={<ClockCircleFilled />} color="#347C98"> รอชำระเงิน </Tag>;
      break;
    case 'ยกเลิก':
      elementToRender = <Tag icon={<CloseCircleFilledIcon />} color="#ababab"> ยกเลิก </Tag>;
      break;
    default:
      elementToRender = <Tag > Not found </Tag>;
  }
  return <>{elementToRender}</>
}