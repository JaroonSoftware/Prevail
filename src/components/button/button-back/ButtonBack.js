import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

function ButtonBack({target}) {
    const navigate = useNavigate(); 
    return (<>
        <Button style={{ width: 120 }} icon={ <ArrowLeftOutlined /> } onClick={ () => { navigate(target, {replace:true}); } } >
            กลับ
        </Button>
    </>)
}

export default ButtonBack