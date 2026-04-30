/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useState} from 'react'; 
import CountUp from 'react-countup'; 
import { Drawer, Card, Col, Flex, Row, Space, Statistic, Table, Typography } from 'antd';
import { 
    salesOrderListColumn,
    deliveryNoteListColumn,
    itemFileExpireColumn,
    statisticValue,
    salesOrderDetailColumn,
} from './model';

import { FiFileText } from "react-icons/fi";
import { LuFileClock } from "react-icons/lu";

import dayjs from 'dayjs';
import SOService from '../../service/SO.service';
import DeliveryNoteService from '../../service/DeliveryNote.service';

const pagging = { pagination: { current: 1, pageSize: 10, }, };
const soservice = SOService();
const dnservice = DeliveryNoteService();

function DashBoard() {
    const [salesOrderListSource, setSalesOrderListSource] = useState([]);
    const [salesOrderListloading, setSalesOrderListLoading] = useState(false);
    const [salesOrderListParams, setSalesOrderListParams] = useState({ ...pagging });

    const [deliveryNoteSource, setDeliveryNoteSource] = useState([]);
    const [deliveryNoteLoading, setDeliveryNoteLoading] = useState(false);
    const [deliveryNoteParams, setDeliveryNoteParams] = useState({ ...pagging });

    const [salesOrderDetailSource, setSalesOrderDetailSource] = useState([]);
    const [salesOrderDetailLoading,setSalesOrderDetailLoading] = useState(false);
    const [salesOrderDetailParams, setSalesOrderDetailParams] = useState({ ...pagging });
    
    const [salesOrderDetailOpen, setSalesOrderDetailOpen] = useState(false);
    const [salesOrderDetailSelected, setSalesOrderDetailSelected] = useState(null);

    const [filesExpireSource,  setFilesExpireSource] = useState([]);
    const [filesExpireLoading, setFilesExpireLoading] = useState(false);
    const [filesExpireParams,  setFilesExpireParams] = useState({ ...pagging });

    const [statisticData,  setStatistic] = useState({ ...statisticValue });
    
    const formatter = (value) => <CountUp end={value} separator="," delay={1.4} />;
    const showTotal = (total, range) => {
        return `${range.join("-")} of ${total} items`;
    }

    const showSalesOrderDetail = (value) => {
        const { socode } = value;

        setSalesOrderDetailSelected( socode );
        setSalesOrderDetailOpen(true);
    }

    const buildStatisticData = (salesOrders = [], deliveryNotes = []) => {
        const now = dayjs();
        const daily = salesOrders.filter((item) => dayjs(item?.sodate).isSame(now, 'day')).length;
        const monthly = salesOrders.filter((item) => dayjs(item?.sodate).isSame(now, 'month')).length;
        const yearly = salesOrders.filter((item) => dayjs(item?.sodate).isSame(now, 'year')).length;
        const waiting = deliveryNotes.filter((item) => item?.doc_status === 'รอจัดเตรียมสินค้า' || item?.issue_status === 'ยังไม่ตัดสต๊อก').length;

        return { daily, monthly, yearly, waiting };
    };

    const CardStatistic = ({bgColor, title, value, icon})=>{
        return (
        <> 
            <Card className='flex w-full' style={{backgroundColor:bgColor, borderRadius:'2rem',  color:'#fff', height:'100%' }} >
                <Flex className='w-full' gap={10} align='center'>
                    <Flex justify='center'>
                        <div className='p-4 text-4xl' style={{backgroundColor:'rgb(255 255 255 / 35%)', borderRadius:'calc( 2rem - 16px )'}} >{icon}</div>
                    </Flex>
                    <Flex vertical>
                        <Typography.Title style={{fontSize: 'clamp( 14px, 1.12vw, 20px)'}} className='!mb-2 font-semibold !text-slate-100 uppercase' >{title}</Typography.Title>
                        <Statistic 
                            value={value} 
                            className='font-semibold !text-slate-100 uppercase' 
                            formatter={formatter} 
                            suffix="รายการ" 
                            valueStyle={{fontSize: 'clamp( 11px, .9vw, 17.6px)', color:'rgb(241 245 249 / var(--tw-text-opacity))'}} 
                        />
                    </Flex>
                </Flex> 
            </Card>         
        </>
        )
    }

    const CardSalesOrderList = ()=>{ 
        return (
        <> 
            <Card 
            className='w-full' 
            style={{borderRadius:'2rem', height:'100%'}} 
            title={(
                <Typography.Title level={4} className='m-0 font-semibold !text-slate-700 uppercase' >
                    ใบขายสินค้า
                </Typography.Title>
            )}> 
                <Table 
                    bordered={false}
                    size='small'
                    columns={salesOrderListColumn({handleShowDetail : showSalesOrderDetail})} 
                    dataSource={salesOrderListSource} 
                    rowKey="socode" 
                    pagination={{...salesOrderListParams.pagination, showSizeChanger:false, showTotal:showTotal}}
                    loading={salesOrderListloading}
                    onChange={handleSalesOrderListChange}
                    scroll={{ x: 'max-content' }}
                /> 
            </Card>
        </>
        )
    }

    const CardDeliveryNoteList = ()=>{ 
        return (
        <> 
            <Card 
            className='w-full' 
            style={{borderRadius:'2rem', height:'100%'}} 
            title={(
                <Typography.Title level={4} className='m-0 font-semibold !text-slate-700 uppercase' >
                    ใบส่งของ
                </Typography.Title>
            )}> 
                <Table 
                    bordered={false}
                    size='small'
                    columns={deliveryNoteListColumn} 
                    dataSource={deliveryNoteSource} 
                    rowKey="dncode" 
                    pagination={{...deliveryNoteParams.pagination, showSizeChanger:false, showTotal:showTotal}}
                    loading={deliveryNoteLoading}
                    onChange={handleDeliveryNoteChange}
                    scroll={{ x: 'max-content' }}
                /> 
            </Card>
        </>
        )
    } 

    const CardSalesOrderDetail = () => { 
        return (
        <> 
            <Card 
            className='w-full' 
            style={{ height:'100%'}} 
            title={(
                <Typography.Title level={5} className='m-0 font-semibold !text-slate-700 uppercase' >
                    รายการสินค้าในใบขายสินค้า
                </Typography.Title>
            )}> 
                <Table 
                    bordered={false}
                    size='small'
                    columns={salesOrderDetailColumn} 
                    dataSource={salesOrderDetailSource} 
                    rowKey={(record, index) => `${record?.stcode || 'item'}-${index}`}
                    pagination={{...salesOrderDetailParams.pagination, showSizeChanger:false, showTotal:showTotal}}
                    loading={salesOrderDetailLoading}
                    onChange={handleSalesOrderDetailChange}
                    scroll={{ x: 'max-content' }}
                    locale = {{ emptyText: <span>{'\u00A0'}</span> }}
                /> 
            </Card>
        </>
        )
    }

    // const CardFilesExpire = ()=>{ 
    //     return (
    //     <> 
    //         <Card 
    //         className='w-full' 
    //         style={{borderRadius:'2rem', height:'100%'}} 
    //         title={(
    //             <Typography.Title level={4} className='m-0 font-semibold !text-slate-700 uppercase' >
    //                 Files Expiry Alert
    //             </Typography.Title>
    //         )}> 
    //             <Table 
    //                 bordered={false}
    //                 size='small'
    //                 columns={itemFileExpireColumn} 
    //                 dataSource={filesExpireSource} 
    //                 rowKey="id" 
    //                 pagination={{...filesExpireParams.pagination, showSizeChanger:false, showTotal:showTotal}}
    //                 loading={filesExpireLoading}
    //                 onChange={handleFilesExpireChange}
    //                 scroll={{ x: 'max-content' }}
    //             /> 
    //         </Card>
    //     </>
    //     )
    // }

    const fetchDeliveryNoteData = async (load = false) => {
        setDeliveryNoteLoading(true && load);
        const res = await dnservice.search({}, { ignoreLoading: !load });
        const source = res?.data?.data || [];

        setDeliveryNoteSource(source);
        setDeliveryNoteLoading(false && load);

        return source;
    }

    const fetchSalesOrderData = async (load = false) => {
        setSalesOrderListLoading(true && load);
        const res = await soservice.search({}, { ignoreLoading: !load });
        const source = res?.data?.data || [];

        setSalesOrderListSource(source);
        setSalesOrderListLoading(false && load);

        return source;
    }

    const fetchSalesOrderDetailData = async (load = false) => {
        if( !salesOrderDetailSelected ) return;

        setSalesOrderDetailLoading(true && load);
        const res = await soservice.get(salesOrderDetailSelected, { ignoreLoading: !load });
        const source = res?.data?.data?.detail || [];

        setSalesOrderDetailSource(source);
        setSalesOrderDetailLoading(false && load);
    }

    // const fetchFilesExpireData = async (load = false) => {
    //     setFilesExpireLoading(true && load);
    //     const res = await dsbservice.filesexpire( { ...filesExpireParams }, load );
    //     const { data:{source, pagination} } = res.data;
    //     setFilesExpireSource(source);
    //     setFilesExpireLoading(false && load);
    //     setFilesExpireParams( (state) => ({ ...state, pagination, }));
    // }

        useEffect(() => {
                setStatistic(buildStatisticData(salesOrderListSource, deliveryNoteSource));
        }, [salesOrderListSource, deliveryNoteSource]);

        useEffect(() => {
                if( salesOrderDetailOpen && salesOrderDetailSelected ) fetchSalesOrderDetailData( true );
        }, [JSON.stringify(salesOrderDetailParams), salesOrderDetailOpen, salesOrderDetailSelected]);

    useEffect(() => {
        const initeial = async () => {
                        await Promise.all([
                                fetchSalesOrderData( false ), 
                                fetchDeliveryNoteData( false ),
                        ]);
        } 

                initeial();
    }, []);

        const handleSalesOrderListChange = (pagination, filters, sorter) => {
            setSalesOrderListParams({ pagination, filters, ...sorter, }); 
    };    

        const handleDeliveryNoteChange = (pagination, filters, sorter) => {
            setDeliveryNoteParams({ pagination, filters, ...sorter, }); 
    };    

        const handleSalesOrderDetailChange = (pagination, filters, sorter) => {
            setSalesOrderDetailParams({ pagination, filters, ...sorter, }); 
    };    

    const handleFilesExpireChange = (pagination, filters, sorter) => {
      setFilesExpireParams({ pagination, filters, ...sorter, }); 
    };    

    return (
        <>
        <div className='layout-content px-3 sm:px-5 md:px-5'>
            <Space direction="vertical" size="middle" style={{ display: 'flex', position: 'relative', paddingInline:"1.34rem" }} className='dashboard' id='dashboard' >
                <Row gutter={[12, 12]}>
                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                        <div style={{height:'100%'}}> 
                            <CardStatistic bgColor="#8f8df9" title="ใบขายสินค้าวันนี้" icon={<FiFileText />} value={statisticData.daily} />
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                        <div style={{height:'100%'}}>
                            <CardStatistic bgColor="#fe8992" title="ใบขายสินค้าเดือนนี้" icon={<FiFileText />} value={statisticData.monthly} />
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                        <div style={{height:'100%'}}>
                            <CardStatistic bgColor="#3987d3" title="ใบขายสินค้าปีนี้" icon={<FiFileText />} value={statisticData.yearly} />
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                        <div style={{height:'100%'}}>
                            <CardStatistic bgColor="#ffd19d" title="ใบส่งของรอจัดเตรียม" icon={<LuFileClock />} value={statisticData.waiting} />
                        </div>
                    </Col>
                </Row>
                <Row gutter={[18, 12]} style={{minHeight:380}}>
                    <Col xs={24} sm={12} md={12} lg={14} xl={14} >
                        <div style={{height:'100%'}}>
                            <CardSalesOrderList />
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={12} lg={10} xl={10} >
                        <div style={{height:'100%'}}>
                            <CardDeliveryNoteList /> 

                        </div>
                    </Col>
                </Row>
            </Space> 
        </div>
            <div className='drawer-dashboard'> 
                <Drawer 
                title="รายละเอียดใบขายสินค้า"
                className="responsive-drawer"
                width={668}
                onClose={() => { 
                    setSalesOrderDetailOpen(false);
                    setSalesOrderDetailSelected( null );
                    setSalesOrderDetailSource([]);
                }} 
                getContainer={() => document.querySelector(".drawer-dashboard")}
                open={salesOrderDetailOpen}
                >
                    { salesOrderDetailOpen && <CardSalesOrderDetail /> }
                </Drawer> 
            </div> 
        </>

    )
}

export default DashBoard