import React, { useState } from 'react'; 

import { Button, Drawer } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import FileControl from '../../../pages/file-control/FileControl';

function ButtonUpload({code, refer, showExpire = false}) { 
    const [openUpload, setOpenUpload] = useState(false);
    return (<>
        <Button  
            type="primary" 
            icon={ <InboxOutlined style={{fontSize: '1.4rem'}} /> } 
            onClick={ () => { setOpenUpload(true)} }
            className='bn-center'
        > อัพโหลด </Button>

        <Drawer title="Upload" placement="right" size="large" open={openUpload} onClose={()=>{ setOpenUpload(false) }} > 
            { openUpload && (<FileControl title={`แนบไฟล์ สำหรับ Code : `} refcode = {code} refs={refer} noExpire={!showExpire} />)} 
        </Drawer>
    </>)
}

export default ButtonUpload