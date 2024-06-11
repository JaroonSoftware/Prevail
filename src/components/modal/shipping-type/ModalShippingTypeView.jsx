/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Drawer, Table, Typography } from "antd";

import { shippingTermsColumn } from "./modal-shipping-type.model";
import { formatCommaNumber } from '../../../utils/util';
 
 
const ModalShippingTypeView = ({ open, close, source}) => {   
    const [openDrawer, setOpenDrawer] = useState(false);
    // const [packageTypeOption, setPackageTypeOption] = useState([]); 
    const init = async () => { 
        // console.log( source );
    }
 
    useEffect( ()=>{   
        init(); 

        setOpenDrawer(open); 
        return () => { }
    }, [open]); 

    return (
        <div className='modal-loading-type-view xs:px-0 sm:px-0 md:px-8 lg:px-8'>
            <Drawer
                title='More information'
                onClose={() => { setOpenDrawer(false); }}
                open={openDrawer}
                className="responsive-drawer"
                getContainer={false}
                afterOpenChange={(e)=>{
                    if(!e) { 
                        close(false);
                    }
                }}
                maskClosable={false}
            >  
                <Table
                   title={()=><><Typography.Title level={5} className='m-0'>Shipping Terms</Typography.Title></>} 
                   dataSource={source?.shipping_terms}
                   columns={shippingTermsColumn}
                   rowKey="id"
                   pagination={false}
                   locale = {{ emptyText: <span>No data available, please choose data.</span> }}
                   size='small'
                   summary={() => {
                        const total = source?.shipping_terms?.reduce( (ac, v) => ac += Number( v?.price || 0), 0);
                        return (<>
                        <Table.Summary.Row>
                            <Table.Summary.Cell >รวม</Table.Summary.Cell>
                            <Table.Summary.Cell className='!pe-4 text-end border-right-0' style={{borderRigth:"0px solid"}} >
                                <Typography.Text type="danger">{ formatCommaNumber(total) }</Typography.Text>
                            </Table.Summary.Cell>
                        </Table.Summary.Row>                    
                        </>);
                   }}
                />         
            </Drawer> 
        </div>
    );
}

export default ModalShippingTypeView;
