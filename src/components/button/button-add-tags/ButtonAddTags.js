import React, {useState} from 'react';
import { Button } from "antd";
import { TagOutlined } from '@ant-design/icons';

import { ModalSamplePreparationTags } from "../../modal/tags/modal-sp-tags"

function ButtonAddTags({code, added}) {
    const [openAddTagModal, setOpenAddtegModal] = useState(false);


    return (
        <>
            <Button
                icon={<TagOutlined />} 
                className='bn-info-outline'
                style={{ cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                onClick={(e) => setOpenAddtegModal(true) }
                size="small"
            />


        { openAddTagModal && (
            <ModalSamplePreparationTags code={code} show={openAddTagModal} close={() => { setOpenAddtegModal(false) }} values={(v)=>{  if( typeof added === 'function' ) added(v) } } />
        )}
        </>
    )
}

export default ButtonAddTags