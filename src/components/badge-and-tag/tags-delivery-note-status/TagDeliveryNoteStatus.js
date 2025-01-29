import React from 'react'
import { Tag } from "antd"
import { CheckCircleFilled, ClockCircleFilled } from "@ant-design/icons"
import { CloseCircleFilledIcon } from '../../icon';


export default function TagDeliveryNoteStatus({ result }) {
  let elementToRender;

  switch (result) {
    case 'จัดเตรียมสินค้าแล้ว':
      elementToRender = <Tag icon={<CheckCircleFilled />} color="#87d068"> จัดเตรียมสินค้าแล้ว </Tag>;
      break;
    case 'จัดเตรียมสินค้ายังไม่ครบ':
      elementToRender = <Tag icon={<CloseCircleFilledIcon />} color="#ffab47"> จัดเตรียมสินค้ายังไม่ครบ </Tag>;
      break;
    case 'รอจัดเตรียมสินค้า':
      elementToRender = <Tag icon={<ClockCircleFilled />} color="#347C98"> รอจัดเตรียมสินค้า </Tag>;
      break;
    case 'ยกเลิก':
      elementToRender = <Tag icon={<CloseCircleFilledIcon />} color="#ababab"> ยกเลิก </Tag>;
      break;
    default:
      elementToRender = <Tag > Not found </Tag>;
  }
  return <>{elementToRender}</>
}