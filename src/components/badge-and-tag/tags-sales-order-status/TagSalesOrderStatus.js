import React from 'react'
import { Tag } from "antd"
import { CheckCircleFilled, ClockCircleFilled } from "@ant-design/icons"
import { CloseCircleFilledIcon } from '../../icon';


function TagSalesOrderStatus({result}) {
  let elementToRender;

  switch (result) {
    case 'ชำระครบแล้ว':
      elementToRender = <Tag icon={<CheckCircleFilled />} color="#87d068"> ชำระครบแล้ว </Tag>;
      break;
    case 'ปริ้นหน้าถุงครบแล้ว':
      elementToRender = <Tag icon={<CheckCircleFilled />} color="#87d068"> ปริ้นหน้าถุงครบแล้ว </Tag>;
      break;
    case 'รอออกใบเสร็จรับเงิน':
      elementToRender = <Tag icon={<ClockCircleFilled />} color="#347C98"> รอออกใบเสร็จรับเงิน </Tag>;
      break;
    case 'รอออกใบส่งของ':
      elementToRender = <Tag icon={<ClockCircleFilled />} color="#ffab47"> รอออกใบส่งของ </Tag>;
      break;
    case 'ยกเลิก':
      elementToRender = <Tag icon={<CloseCircleFilledIcon />} color="#ababab"> ยกเลิก </Tag>;
      break;
    case 'ชำระยังไม่ครบ':
      elementToRender = <Tag icon={<ClockCircleFilled />} color="#454545"> ชำระยังไม่ครบ </Tag>;
      break;
    case 'รอออกใบวางบิล':
      elementToRender = <Tag icon={<ClockCircleFilled />} color="#a569bd"> รอออกใบวางบิล </Tag>;
      break;
    case 'รอจัดเตรียมสินค้า':
      elementToRender = <Tag icon={<ClockCircleFilled />} color="#008080"> รอจัดเตรียมสินค้า </Tag>;
      break;
    case 'รอปริ้นใบปะหน้าถุง':
      elementToRender = <Tag icon={<ClockCircleFilled />} color="#6495ED"> รอปริ้นใบปะหน้าถุง </Tag>;
      break;
    case 'ปริ้นใบปะยังไม่ครบ':
      elementToRender = <Tag icon={<ClockCircleFilled />} color="#40E0D0"> ปริ้นใบปะยังไม่ครบ </Tag>;
      break;
   
    default:
      elementToRender = <Tag > Not found </Tag>;
  }
  return <>{elementToRender}</>
}

export default TagSalesOrderStatus