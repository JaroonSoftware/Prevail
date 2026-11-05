import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

function ButtonBack({target}) {
    const navigate = useNavigate();
    const location = useLocation(); 
    return (<>
        <Button style={{ width: 120 }} icon={ <ArrowLeftOutlined /> } onClick={ () => { location.state?.documentReturn ? navigate(-1) : navigate(target, {replace:true}); } } >
            กลับ
        </Button>
    </>)
}

export default ButtonBack