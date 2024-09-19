import React from 'react'
import { Tag } from "antd" 
import { IoIosCheckmarkCircle, IoIosCloseCircle  } from "react-icons/io";


function TagIs({result}) {
  let elementToRender;

  switch (result) {
    case 1:
      elementToRender =(<>
        <Tag 
            icon={<IoIosCheckmarkCircle />} 
            // color="transparent" 
            color="#fff" 
            className='!m-0 !p-0 !bg-transparent !block'
            style={{fontSize:'1.3rem', borderRadius:'100%', color:"#87d068"}}
        />
      </>)
      break;
    case 0:
      elementToRender =(<>
        <Tag 
            icon={<IoIosCloseCircle />} 
            // color="transparent" 
            color="#fff" 
            className='!m-0 !p-0 !bg-transparent !block'
            style={{fontSize:'1.3rem', borderRadius:'100%', color:"#cd201f"}}
        />
      </>) 
      break;
    default:
      elementToRender = <Tag  className='!m-0 !p-0 !bg-transparent !block' />;
  }
  return <>{elementToRender}</>
}

export default TagIs