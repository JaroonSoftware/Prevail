import React from 'react'
import { Tag } from "antd"
import { CheckCircleFilled, ClockCircleFilled } from "@ant-design/icons"
import { CloseCircleFilledIcon } from '../../icon';


function TagGoodsReceiptStatus({result}) {
  let elementToRender;

  switch (result) {
    case 'ชั่งสินค้าครบแล้ว':
      elementToRender = <Tag icon={<CheckCircleFilled />} color="#87d068"> ชั่งสินค้าครบแล้ว </Tag>;
      break;
    case 'รอชั่งสินค้า':
      elementToRender = <Tag icon={<ClockCircleFilled />} color="#347C98"> รอชั่งสินค้า </Tag>;
      break;
    case 'ยกเลิก':
      elementToRender = <Tag icon={<CloseCircleFilledIcon />} color="#ababab"> ยกเลิก </Tag>;
      break;
    default:
      elementToRender = <Tag > Not found </Tag>;
  }
  return <>{elementToRender}</>
}

export default TagGoodsReceiptStatus