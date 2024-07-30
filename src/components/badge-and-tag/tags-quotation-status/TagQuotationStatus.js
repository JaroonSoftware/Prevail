import React from 'react'
import { Tag } from "antd"
import { CheckCircleFilled, ClockCircleFilled } from "@ant-design/icons"
import { CloseCircleFilledIcon } from '../../icon';


export default function TagQuotationStatus({result}) {
  let elementToRender;

  switch (result) {
    case 'ออกใบแจ้งหนี้แล้ว':
      elementToRender = <Tag icon={<CheckCircleFilled />} color="#87d068"> ออกใบแจ้งหนี้แล้ว </Tag>;
      break;
    case 'กำลังรอดำเนินการ':
      elementToRender = <Tag icon={<ClockCircleFilled />} color="#347C98"> กำลังรอดำเนินการ </Tag>;
      break;
    case 'ยกเลิก':
      elementToRender = <Tag icon={<CloseCircleFilledIcon />} color="#ababab"> ยกเลิก </Tag>;
      break;
    default:
      elementToRender = <Tag > Not found </Tag>;
  }
  return <>{elementToRender}</>
}