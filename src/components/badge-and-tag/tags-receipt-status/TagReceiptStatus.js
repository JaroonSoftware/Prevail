import React from 'react'
import { Tag } from "antd"
import { CheckCircleFilled } from "@ant-design/icons"
import { CloseCircleFilledIcon } from '../../icon';


export default function TagReceiptStatus({result}) {
  let elementToRender;

  switch (result) {
    case 'Y':
      elementToRender = <Tag icon={<CheckCircleFilled />} color="#87d068"> ชำระสำเร็จ </Tag>;
      break;
    case 'N':
      elementToRender = <Tag icon={<CloseCircleFilledIcon />} color="#ababab"> ยกเลิก </Tag>;
      break;
    default:
      elementToRender = <Tag > Not found </Tag>;
  }
  return <>{elementToRender}</>
}