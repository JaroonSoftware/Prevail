import React from 'react'
import { Tag } from "antd"
import { CheckCircleFilled, ClockCircleFilled } from "@ant-design/icons"
import { CloseCircleFilledIcon } from '../../icon';


export default function TagDeliveryNoteStatus({result}) {
  let elementToRender;

  switch (result) {
    case 'ออกใบแจ้งหนี้แล้ว':
      elementToRender = <Tag icon={<CheckCircleFilled />} color="#87d068"> ออกใบแจ้งหนี้แล้ว </Tag>;
      break;
    case 'รอออกใบแจ้งหนี้':
      elementToRender = <Tag icon={<ClockCircleFilled />} color="#347C98"> รอออกใบแจ้งหนี้ </Tag>;
      break;
    case 'ยกเลิก':
      elementToRender = <Tag icon={<CloseCircleFilledIcon />} color="#ababab"> ยกเลิก </Tag>;
      break;
    default:
      elementToRender = <Tag > Not found </Tag>;
  }
  return <>{elementToRender}</>
}