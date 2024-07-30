import React from 'react'
import { Tag } from "antd"
import { CheckCircleFilled, ClockCircleFilled } from "@ant-design/icons"
import { CloseCircleFilledIcon } from '../../icon';


function TagPurchaseOrderStatus({result}) {
  let elementToRender;

  switch (result) {
    case 'รับของครบแล้ว':
      elementToRender = <Tag icon={<CheckCircleFilled />} color="#87d068"> รับของครบแล้ว </Tag>;
      break;
    case 'ยังรับของไม่ครบ':
      elementToRender = <Tag icon={<CloseCircleFilledIcon />} color="#ffab47"> ยังรับของไม่ครบ </Tag>;
      break;
    case 'ยังไม่ได้รับของ':
      elementToRender = <Tag icon={<ClockCircleFilled />} color="#347C98"> ยังไม่ได้รับของ </Tag>;
      break;
    case 'ยกเลิก':
      elementToRender = <Tag icon={<CloseCircleFilledIcon />} color="#ababab"> ยกเลิก </Tag>;
      break;
    default:
      elementToRender = <Tag > Not found </Tag>;
  }
  return <>{elementToRender}</>
}

export default TagPurchaseOrderStatus