/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom';
// import ReactDOMServer from "react-dom/server";
import { useReactToPrint } from 'react-to-print';

import "./quo.css";
import logo from "../../../assets/images/logo_nsf.png";
 
import { Button, Flex,  Table, Typography, message } from 'antd';
import { column} from './quo.model';

import dayjs from "dayjs";
import { comma } from "../../../utils/util";
import { PiPrinterFill } from 'react-icons/pi';
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from 'antd';
import QuotationService from '../../../service/Quotation.service';


const quoservice = QuotationService();

function QuoPrintPreview() {
    const { code } = useParams();
    const componentRef = useRef(null);
   
    const handlePrint = useReactToPrint({
      documentTitle: "Print This Document",
      onBeforePrint: () => handleBeforePrint(),
      onAfterPrint: () => handleAfterPrint(),
      removeAfterPrint: true,
    });

    const [hData, setHData] = useState({});
    const [details, setDetails] = useState([]);

    
    const columnDesc = column; 

    const [loading] = useState(false);

    const handleAfterPrint = () => { 
        // setNewPageContent([]);

    }
    const handleBeforePrint = (e) => {
        // console.log("before printing...")
    }


    useEffect( () =>  {
        const init = () => {
            quoservice.get( code ).then( async res => {
              const { data : { header, detail } } = res.data; 
           
              setHData( header );
              setDetails( detail );
            }).catch( err => {
              console.log(err);
              message.error("Error getting infomation Estimation.")
            }) 
        }

        init();
        return () => {}
    }, []);

    const HeaderForm = () => {
        return (
            <div className='print-head' style={{height:90}}> 
                <div className='print-title flex gap-5'> 
                    <div className='grow'>
                        <img src={logo} alt="" style={{paddingInline: 10, height: '100%'}}  />  
                    </div>
                    <div className='flex grow-0 justify-end items-center' style={{width: 278}}>
                        <Flex className='mb-0 '>
                            <Typography.Title level={3} align='end' className='m-0 min-w-28 text-end'>ใบเสนอราคา</Typography.Title> 
                        </Flex> 
                    </div> 
                </div> 
            </div>  
        )
    }

    const FooterForm = ({page}) => {
        return (
            <div className='print-foot' style={{height:34}}>  
                <div className='print-title flex justify-end'>   
                    <Flex className='mb-0'>
                        <Typography.Text className='text-sm min-w-8'>Page</Typography.Text>
                        <Typography.Text className='text-sm' strong>{page}</Typography.Text> 
                    </Flex> 
                </div> 
            </div>   
        )
    }

    
    const ContentHead = () => {
        return ( 
        <div className='content-head in-sample flex flex-col'> 
            <div className='print-title flex pb-2'>
                <div className='flex ps-3 grow-0' style={{width:600}}>
                    <Flex className='mb-1.5' vertical >
                        <Typography.Text className='tx-title min-w-48 weight600' strong>บริษัท วีระ ไดรคัทติ้ง จำกัด</Typography.Text>
                        <Typography.Text className='tx-info' strong>VEERA DRYCUTTING CO., LTD</Typography.Text> 
                        <Typography.Text className='tx-info' >102  หมู่  1  ถนนโพธิ์พระยาท่าเรือ  ตำบลบางนา</Typography.Text> 
                        <Typography.Text className='tx-info' >อำเภอมหาราช  จังหวัดพระนครศรีอยุธยา 13150</Typography.Text> 
                        <Typography.Text className='tx-info' >โทร. 081-948-3963 E-mail :gtopgta@gmail.com</Typography.Text> 
                        <Typography.Text className='tx-info' >เลขประจำตัวผู้เสียภาษี     0145546001142 (สำนักงานใหญ่)</Typography.Text> 
                    </Flex> 
                </div>                 
                <div className='flex ps-3 grow'>
                    <Flex className='mb-1.5' vertical>
                        {/* <Typography.Text className='tx-title min-w-48' strong>Info</Typography.Text> */}
                        <Flex justify='space-between'>
                            <Typography.Text className='tx-info' strong>เลขที่</Typography.Text> 
                            <Typography.Text className='tx-info'>&nbsp; {hData?.qtcode}</Typography.Text>  
                        </Flex>
                        <Flex justify='space-between'>
                            <Typography.Text className='tx-info' strong>วันที่</Typography.Text> 
                            <Typography.Text className='tx-info'>{dayjs(hData?.qtdate).format("DD/MM/YYYY")}</Typography.Text>  
                        </Flex>
                    </Flex>
                </div> 
            </div>              
        </div>
        )
    }

    const ContentHead2 = () => {
        return ( 
            <div className='content-head in-sample flex flex-col'> 
            <div className='print-title flex pb-2'>
                <div className='flex ps-3 grow-0' >
                    <Flex className='mb-1.5' vertical >
                        <Typography.Text className='tx-info' >ชื่อลูกค้า : {hData?.prename} {hData?.cusname}</Typography.Text> 
                        <Typography.Text className='tx-info' >{hData?.address} {hData?.zipcode}</Typography.Text> 
                        <Typography.Text className='tx-info' >โทร : {hData?.tel} แฟกซ์ : {hData?.fax}</Typography.Text> 
                        <Typography.Text className='tx-info' >เรียน : {hData?.contact}</Typography.Text> 
                    </Flex> 
                </div>                 
            </div>              
        </div>
        )
    }

    const QuotationSummary = (rec) => {
        return <>
            <Table.Summary.Row style={{height:24}}>
                <Table.Summary.Cell index={0} colSpan={5} className='!align-top'></Table.Summary.Cell>
            </Table.Summary.Row>

            <Table.Summary.Row className='r-sum'>
                <Table.Summary.Cell index={0} colSpan={2} rowSpan={4} className='!align-top !ps-0'>
                    <Flex vertical gap={12}>
                        <Flex vertical gap={2}>
                            <Typography.Text className='tx-title' strong>Remarks</Typography.Text>
                            <Typography.Text className='tx-info'>{hData?.remark}</Typography.Text> 
                        </Flex>
                    </Flex>
                </Table.Summary.Cell>
                <Table.Summary.Cell colSpan={2} className='text-summary text-start !align-top' >
                    <Typography.Text className='text-sm text-end'>รวมราคาทั้งสิ้น / Sub total</Typography.Text>
                </Table.Summary.Cell> 
                <Table.Summary.Cell className='text-summary text-end !align-top' >
                    <Typography.Text className='text-sm text-end'>{comma( Number(hData?.total_price || 0), 2, 2 )}</Typography.Text>
                </Table.Summary.Cell> 
            </Table.Summary.Row>  

            <Table.Summary.Row className='r-sum'>
                <Table.Summary.Cell colSpan={2} className='text-summary text-start !align-top' >
                    <Typography.Text className='text-sm text-end'>จำนวนภาษีมูลค่าเพิ่ม / VAT {comma( Number(hData?.vat || 0 ))}%</Typography.Text>
                </Table.Summary.Cell> 
                <Table.Summary.Cell className='text-summary text-end !align-top' >
                    <Typography.Text className='text-sm text-end'>{comma( Number((hData?.vat*hData?.total_price)/100 || 0 ))}</Typography.Text>
                </Table.Summary.Cell> 
            </Table.Summary.Row>    

            <Table.Summary.Row className='r-sum rl'>
                <Table.Summary.Cell colSpan={2} className='text-summary text-start !align-top' >
                    <Typography.Text className='text-sm text-end !text-white'>จำนวนเงินรวมภาษี / Net total</Typography.Text>
                </Table.Summary.Cell> 
                <Table.Summary.Cell className='text-summary text-end !align-top' >
                    <Typography.Text className='text-sm text-end !text-white'>{comma( Number(hData?.grand_total_price || 0), 2, 2 )}</Typography.Text>
                </Table.Summary.Cell> 
            </Table.Summary.Row>

            <Table.Summary.Row>
                <Table.Summary.Cell colSpan={2} className='!align-top'>{'\u00A0'}</Table.Summary.Cell>
            </Table.Summary.Row>

            <Table.Summary.Row>
                <Table.Summary.Cell colSpan={8} className='!align-top !ps-0 !pt-8'>
                    <Flex className='w-full' gap={32} >
                        <Flex vertical className='w-1/2' style={{ gap:10}}>
                            <Flex justify='center' gap={2}>
                                <Typography.Text className='tx-info' strong style={{ minWidth:48}}>ยืนยันการสั่งซื้อ </Typography.Text> 
                                <Typography.Text className='tx-info' >{'\u00A0'}</Typography.Text>
                            </Flex>
                            <Flex gap={2}>
                                <div className="w-full" style={{height: 90, border:'1px solid var(---color--1)'}}>{'\u00A0'}</div>
                            </Flex>
                        </Flex> 
                        <Flex vertical className='w-1/2' style={{ gap:10}}>
                            <Flex justify='center' gap={2}>
                                <Typography.Text className='tx-info' strong style={{ minWidth:48}}>ผู้จัดทำ ( VDC ) </Typography.Text> 
                                <Typography.Text className='tx-info' strong>{'\u00A0'}</Typography.Text>
                            </Flex>
                            <Flex gap={2}>
                                <div className="w-full" style={{height: 90, border:'1px solid var(---color--1)'}}>{'\u00A0'}</div>
                            </Flex>
                        </Flex>
                        <Flex vertical className='w-1/2' style={{ gap:10}}>
                            <Flex justify='center' gap={2}>
                                <Typography.Text className='tx-info' strong style={{ minWidth:48}}>ผู้อนุมัติ </Typography.Text> 
                                <Typography.Text className='tx-info' strong>{'\u00A0'}</Typography.Text>
                            </Flex>
                            <Flex gap={2}>
                                <div className="w-full" style={{height: 90, border:'1px solid var(---color--1)'}}>{'\u00A0'}</div>
                            </Flex>
                        </Flex>
                    </Flex>
                </Table.Summary.Cell>
            </Table.Summary.Row>              

            <Table.Summary.Row>
                <Table.Summary.Cell colSpan={8} className='!align-top !ps-0 !pt-3'>
                    <Flex className='w-full' gap={32} >
                        <Flex vertical className='w-1/2' style={{ gap:10}}>
                            <Flex gap={2} justify='space-between' className='w-full font-bold'> 
                                ( <Typography.Text className='tx-info font-normal' >{hData?.created_name}</Typography.Text>  )
                            </Flex>
                            <Flex gap={2} justify='space-between' className='w-full font-bold'> 
                                ( <Typography.Text className='tx-info font-normal' > {dayjs().format("DD/MM/YYYY")}</Typography.Text> )
                            </Flex>
                        </Flex> 
                        <Flex vertical className='w-1/2' style={{ gap:10}}>
                            <Flex gap={2} justify='space-between' className='w-full font-bold'> 
                                ( <Typography.Text className='tx-info' strong>{'\u00A0'}</Typography.Text> )
                            </Flex>
                            <Flex gap={2} justify='space-between' className='w-full font-bold'> 
                                ( <Typography.Text className='tx-info' strong>{'\u00A0'}</Typography.Text> )
                            </Flex>
                        </Flex>
                        <Flex vertical className='w-1/2' style={{ gap:10}}>
                            <Flex gap={2} justify='space-between' className='w-full font-bold'> 
                                ( <Typography.Text className='tx-info' strong>{'\u00A0'}</Typography.Text> )
                            </Flex>
                            <Flex gap={2} justify='space-between' className='w-full font-bold'> 
                                ( <Typography.Text className='tx-info' strong>{'\u00A0'}</Typography.Text> )
                            </Flex>
                        </Flex>
                    </Flex>
                </Table.Summary.Cell>
            </Table.Summary.Row>                
        </>
    }

    const ContentBody = () => {
        return ( 
        <div className='content-body in-sample flex flex-col'> 
                <Table 
                    size='small'
                    dataSource={details}
                    columns={columnDesc}
                    pagination={false}
                    rowKey="stcode"
                    bordered={false}
                    locale = {{ emptyText: <span>No data available, please add some data.</span> }}
                    onRow={(record, index)=>{ 
                        return { className: 'r-sub'}
                    }}
                    summary={QuotationSummary}
                />              
        </div>
        )
    }

    

    const Pages = () => (
        <div ref={componentRef}> 
            <ContentData> 
                <ContentHead />
                <ContentHead2 />
                <ContentBody />
            </ContentData>
        </div>    
    )

    const ContentData = ({ children, pageNum = 1, total = 1 }) => {
        return ( 
            <div className='quo-pages flex flex-col'>
                <HeaderForm />
                <div className='print-content grow'> 
                    {children}
                </div>
                <FooterForm page={`${pageNum} of ${total}`} />             
            </div>
        )
    }

    return (
        <>
            {/* <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 24, }} spin />} fullscreen /> */}
            <div className='page-show' id="quo"> 
                { loading && <Spin fullscreen indicator={<LoadingOutlined  />} /> }
                <div className="title-preview"> 
                    <Button
                        className='bn-center  bg-blue-400' 
                        // onClick={() => { handleCheckMultiPages() }}
                        onClick={() => { handlePrint(null, () => componentRef.current ); }}
                        icon={<PiPrinterFill style={{fontSize:'1.1rem'}} />}
                    >
                        PRINT
                    </Button>
                </div>         
                <div className="layout-preview">
                    <Pages />
                </div>
                {/* <div className='hidden'>
                    <div ref={printRef}>
                        {newPageContent?.map( (page, i) => ( 
                        <div key={i}>
                            <ContentData pageNum={i+1} total={(newPageContent.length)} > 
                                {page?.map( (eml, ind) => (<div key={ind} dangerouslySetInnerHTML={{ __html: eml.outerHTML }} ></div>) )}
                            </ContentData>
                            {i < (newPageContent.length-1) && <div className='page-break'></div>}
                        </div> 
                        ))}
                    </div>
                </div> */}
            </div>        
        </>


    )
}

export default QuoPrintPreview