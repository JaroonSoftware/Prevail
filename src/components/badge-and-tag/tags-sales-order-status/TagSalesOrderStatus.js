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
    case 'รอชำระเงิน':
      elementToRender = <Tag icon={<ClockCircleFilled />} color="#347C98"> รอชำระเงิน </Tag>;
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
    case 'รอออกใบส่งของ':
      elementToRender = <Tag icon={<ClockCircleFilled />} color="#d35400"> รอออกใบส่งของ </Tag>;
      break;
    case 'โหลดสินค้ายังไม่ครบ':
      elementToRender = <Tag icon={<ClockCircleFilled />} color="#008080"> โหลดสินค้ายังไม่ครบ </Tag>;
      break;
    case 'รอโหลดสินค้า':
      elementToRender = <Tag icon={<ClockCircleFilled />} color="#800000"> รอโหลดสินค้า </Tag>;
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