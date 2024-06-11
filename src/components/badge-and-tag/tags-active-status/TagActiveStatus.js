import React from 'react'
import { Tag } from "antd" 
import { IoIosCheckmarkCircle, IoIosCloseCircle  } from "react-icons/io";


function TagActiveStatus({result = ""}) {
  let elementToRender;

  switch (result?.toLowerCase()) {
    case 'y':
      elementToRender = <Tag icon={<IoIosCheckmarkCircle />} color="#87d068" className='flex gap-2 justify-center items-center' > Enable </Tag>;
      break;
    case 'n':
      elementToRender = <Tag icon={<IoIosCloseCircle />} color="#cd201f" className='flex gap-2 justify-center items-center' > Disable </Tag>;
      break;
    default:
      elementToRender = <Tag  className='flex gap-2 justify-center items-center' > Not found </Tag>;
  }
  return <>{elementToRender}</>
}

export default TagActiveStatus