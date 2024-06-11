import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';

import logo from "../../../assets/images/logo_nsf.png"
import "./quo.css";
import { Flex, Modal, Table, Typography } from 'antd';

import dayjs from "dayjs";
import EstimationService from '../../../service/Estimation.service';
import {column} from "./quo.model";
import { formatCommaNumber } from '../../../utils/util';

const estservice = EstimationService();
function QuoPrintPreview(){
    const { code } = useParams();
    const [header, setHeader] = useState({});
    const [details, setDetails] = useState([]);
    useEffect( () => {  
        const getData = () => {
            estservice.get(code).then( (res) => {  
                const { data : { head, detail } } = res.data; 
                setHeader(head);
                setDetails(detail);
 
            }).catch( err => { 
                console.log(err);
                const { data :{ message } } = err.response
                Modal.error({
                  title: 'Error Request.',
                  content: message || 'Request Fail. Please try again.',
                  onOk: () => window.close()
                })
            });
        }
        getData();
    }, [code]);

    const Summary = (s) => {
        console.log(s);

        return (
            <>
                <Table.Summary.Row style={{height:55}}>
                    <Table.Summary.Cell index={0} rowSpan={4} className='!align-top'>
                        <Typography.Title level={5}>Note.</Typography.Title>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} colSpan={2} className='text-summary text-start !border-b !align-top' >
                        <Typography.Text className='text-sm'>Sub Total</Typography.Text>
                    </Table.Summary.Cell> 
                    <Table.Summary.Cell index={3} className='text-summary text-end !border-b !align-top' >
                        <Typography.Text className='text-sm'>฿{ 
                            formatCommaNumber(s.reduce( (a,v) => a += Number(v?.exworkcost_carton || 0), 0) || 0) 
                        }</Typography.Text>
                    </Table.Summary.Cell> 
                </Table.Summary.Row>
                <Table.Summary.Row style={{height:55}}> 
                    <Table.Summary.Cell index={1} colSpan={2} className='text-summary text-start !border-b !align-top' >
                        <Typography.Text className='text-base'>Total</Typography.Text>
                    </Table.Summary.Cell> 
                    <Table.Summary.Cell index={3} className='text-summary text-end !border-b !align-top' >
                        <Typography.Text className='text-base' strong>฿{ 
                            formatCommaNumber(s.reduce( (a,v) => a += Number(v?.exworkcost_carton || 0), 0) || 0) 
                        }</Typography.Text>
                    </Table.Summary.Cell> 
                </Table.Summary.Row>
                <Table.Summary.Row> 
                    <Table.Summary.Cell index={1} colSpan={3} ></Table.Summary.Cell>                    
                </Table.Summary.Row>     
                <Table.Summary.Row> 
                    <Table.Summary.Cell index={1} colSpan={3} ></Table.Summary.Cell>
                </Table.Summary.Row>     
            </>
        )
    }
  return (
    <div className='page-show' id="quo">
        <div className="print-layout">
            <div className='print-head'> 
                <div className='print-title'> 
                    <Typography.Title level={3}>Quotation</Typography.Title>
                    <Flex className='mb-1.5'>
                        <Typography.Text className='text-sm min-w-28'>Quotation#</Typography.Text>
                        <Typography.Text className='text-sm' strong>004</Typography.Text>

                    </Flex>
                    <Flex className='mb-1.5'>
                        <Typography.Text className='text-sm min-w-28'>Quotation Date</Typography.Text> 
                        <Typography.Text className='text-sm' strong>{dayjs().format("MMM DD, YYYY").toUpperCase()}</Typography.Text> 

                    </Flex>
                </div>
                <div className='print-logo'>
                    <img src={logo} alt="" style={{paddingInline: 6}} /> 
                </div>
            </div>
            <div className='print-head-content'>
                <Flex gap={20}>
                    <Flex className='w-2/4 p-3 rounded-md' vertical style={{backgroundColor:'#659ad14a'}}>
                        <Flex wrap='nowrap'>
                            <Typography.Text className='min-w-24 text-sm'>Quotation By</Typography.Text>
                            <Typography.Text className='text-sm'>Nine Star Food Co., Ltd.</Typography.Text> 
                        </Flex>
                        <Flex wrap='nowrap'>
                            <Typography.Text className='min-w-24 text-sm'>Address</Typography.Text>
                            <Typography.Text className='text-sm'>99/9 Moo8, Tambon Kongdkin, Amphoe Klaneng, Rayong 22160</Typography.Text> 
                        </Flex> 
                    </Flex>
                    <Flex className='w-2/4 p-3 rounded-md' vertical style={{backgroundColor:'#659ad14a'}}>
                        <Flex wrap='nowrap'>
                            <Typography.Text className='min-w-24 text-sm'>Quotation To</Typography.Text>
                            <Typography.Text className='text-sm'>{header.cusname}</Typography.Text> 
                        </Flex>
                        <Flex wrap='nowrap'>
                            <Typography.Text className='min-w-24 text-sm'>Address</Typography.Text>
                            <Typography.Text className='text-sm'>{header.idno} {header.road} {header.subdistrict} {header.district}  {header.province} {header.zipcode} {header.tel}</Typography.Text> 
                        </Flex>
                    </Flex>                 
                </Flex>
            </div>
            <div className='print-content'> 
                <Table columns={column} dataSource={details} rowKey='id' pagination={false} summary={(s) => Summary(s)} />
            </div>        
        </div>
    </div>
  )
}

export default QuoPrintPreview