/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Button, Drawer, Flex, message } from "antd";
import { Row, Col } from "antd";
 
import { LeftOutlined, SaveFilled } from "@ant-design/icons" ;
 
// import { delay } from '../../utils/util';
// import OptionService from '../../service/Options.service';
import BankService from '../../../service/Bank.service'; 
import BanksManageForm from '../../../pages/banks/BanksManageForm';
// import OptionService from '../../service/Options.service';

const bnservice = BankService();
const formName = 'banks-form';
// const opservice = OptionService();
const ModalBanksManage = ({config, open, close, complete}) => {  
     
    const [formData, setFormData] = useState(null); 
    const [openDrawer, setOpenDrawer] = useState(false);
    // const [packageTypeOption, setPackageTypeOption] = useState([]); 
    const init = async () => { 
        if(config?.action !== "create"){
            bnservice.get(config?.code, { ignoreLoading : true }).then( async (res) => {
                const {data} = res.data;  
                formData(data);
            })
            .catch( err => {
                // console.warn(err);
                const {data} = err.response;
                message.error( data?.message || "error request"); 
            });
        }
    }
 
    useEffect( ()=>{   
        init(); 

        setOpenDrawer(open); 
        return () => {
            setFormData(null); 
        }
    }, [open]);

    const handleConfirm = (res) => { 
        const parm = { ...res };
        const conf = { ignoreLoading : true };
        const actions = config?.action !== "create" ? bnservice.update( parm, conf ) : bnservice.create( parm, conf );

        actions.then( async(r) => { 
            message.success("Request success."); 
            complete(false);
        })
        .catch( err => {
            console.warn(err);
            const data = err?.response?.data;
            message.error( data?.message || "error request");
        });        
    }
     
    const SectionBottom = (
        <Row gutter={[{xs:32, sm:32, md:32, lg:12, xl:12}, 8]} className='m-0'>
            <Col span={12} className='p-0'>
                <Flex gap={4} justify='start'>
                    <Button  
                        icon={<LeftOutlined style={{fontSize:'1rem'}} />} 
                        style={{ width:'9.5rem' }}
                        className='bn-center'
                        onClick={()=>setOpenDrawer(false)}
                    >Back</Button>
                </Flex>
            </Col>
            <Col span={12} className='p-0'>
                <Flex gap={4} justify='end'>
                    <Button 
                        form={formName}
                        htmlType='submit'
                        icon={<SaveFilled style={{fontSize:'1rem'}} />} 
                        type='primary' style={{ width:'9.5rem' }} 
                    >Save</Button>
                </Flex>
            </Col>
        </Row>         
    );


    return (
        <div className='modal-banks-manage xs:px-0 sm:px-0 md:px-8 lg:px-8'>
            <Drawer
                title={config?.title}
                onClose={() => { setOpenDrawer(false); }}
                open={openDrawer}
                width={668}
                className="responsive-drawer"
                // getContainer={() => document.querySelector(".loadingtype-manage")}
                footer={SectionBottom}
                afterOpenChange={(e)=>{
                    if(!e) { 
                        close(false);
                    }
                }}
                maskClosable={false}
            > 
                { openDrawer && 
                <BanksManageForm 
                    formName={formName}
                    confirm={handleConfirm} 
                    source={formData} 
                    mode={config?.action}  
                /> }
            </Drawer> 
        </div>
    );
}

export default ModalBanksManage;
