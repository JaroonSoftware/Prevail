import React from 'react'
import { Tag } from "antd"
import { CheckCircleFilled, ClockCircleFilled } from "@ant-design/icons"
import { CloseCircleFilledIcon } from '../../icon';


function TagSamplePreparationApproveStatus({result}) {
  let elementToRender;

  switch (result) {
    case 'approved':
      elementToRender = <Tag icon={<CheckCircleFilled />} color="#87d068"> Approved </Tag>;
      break;
    case 'not_approved':
      elementToRender = <Tag icon={<CloseCircleFilledIcon />} color="#cd201f"> Not Approved </Tag>;
      break;
    case 'waiting_approve':
      elementToRender = <Tag icon={<ClockCircleFilled />} color="#ffab47"> Waiting Approve </Tag>;
      break;
    case 'cancel':
      elementToRender = <Tag icon={<CloseCircleFilledIcon />} color="#ababab"> Cancel </Tag>;
      break;
    default:
      elementToRender = <Tag > Not found </Tag>;
  }
  return <>{elementToRender}</>
}

export default TagSamplePreparationApproveStatus