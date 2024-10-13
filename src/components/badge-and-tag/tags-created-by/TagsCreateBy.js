import React from 'react'
import { Tag } from "antd"
import { UsergroupAddOutlined,UserOutlined } from "@ant-design/icons"
// import { CloseCircleFilledIcon } from '../../icon';



export default function TagsCreateBy({result,role}) {
  let elementToRender;

  if(role.role==='customer')
    elementToRender = <Tag icon={<UsergroupAddOutlined />} color="#347C98"> {result} </Tag>;
  else
  elementToRender = <Tag icon={<UserOutlined />} color="#ababab"> {result} </Tag>;
  return <>{elementToRender}</>
}