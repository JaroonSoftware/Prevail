/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useMemo, useState} from 'react'; 
import CountUp from 'react-countup'; 
import { Drawer, Card, Col, Flex, Row, Space, Statistic, Table, Typography } from 'antd';
import { 
    sampleListColumn, 
    sampleWaitingApproveColumn, 
    itemFileExpireColumn,
    statisticValue,
    sampleDetailColumn,
} from './model';

import { FiFileText } from "react-icons/fi";
import { LuFileClock } from "react-icons/lu";

import DashBoardService from '../../service/DashBoard.service';

const pagging = { pagination: { current: 1, pageSize: 10, }, };
const dsbservice = DashBoardService();
function DashBoard() {
    const [mounted, setMounted] = useState( false );
    const [sampleListSource, setSampleListSource] = useState([]);
    const [sampleListloading, setSampleListLoading] = useState(false);
    const [sampleListParams, setSampleListParams] = useState({ ...pagging });

    const [sampleWaitingApproveSource, setSampleWaitingApproveSource] = useState([]);
    const [sampleWaitingApproveLoading, setSampleWaitingApproveLoading] = useState(false);
    const [sampleWaitingApproveParams, setSampleWaitingApproveParams] = useState({ ...pagging });

    const [sampleDetailSource, setSampleDetailSource] = useState([]);
    const [sampleDetailLoading,setSampleDetailLoading] = useState(false);
    const [sampleDetailParams, setSampleDetailParams] = useState({ ...pagging });
    
    const [srDetailOpen, setSrDetailOpen] = useState(false);
    const [srDetailSelected, setSrDetailSelected] = useState(null);

    const [filesExpireSource,  setFilesExpireSource] = useState([]);
    const [filesExpireLoading, setFilesExpireLoading] = useState(false);
    const [filesExpireParams,  setFilesExpireParams] = useState({ ...pagging });

    const [statisticData,  setStatistic] = useState({ ...statisticValue });
    
    const formatter = (value) => <CountUp end={value} separator="," delay={1.4} />;
    const showTotal = (total, range) => {
        // console.log( total, range); 
        return `${range.join("-")} of ${total} items.`;
    }

    const showSrDetail = (value) => {
        const { srcode } = value;

        setSrDetailSelected( srcode );

        fetchSampleDetailData(false);
        setSrDetailOpen(true);
    }

    const CardStatistic = useMemo( () =>({bgColor, title, value, icon})=>{ 
        // console.log( value );
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
                            suffix="Case." 
                            valueStyle={{fontSize: 'clamp( 11px, .9vw, 17.6px)', color:'rgb(241 245 249 / var(--tw-text-opacity))'}} 
                        />
                    </Flex>
                </Flex> 
            </Card>         
        </>
        )
    }, [statisticData])

    const CardSampleList = ()=>{ 
        return (
        <> 
            <Card 
            className='w-full' 
            style={{borderRadius:'2rem', height:'100%'}} 
            title={(
                <Typography.Title level={4} className='m-0 font-semibold !text-slate-700 uppercase' >
                    Sample List
                </Typography.Title>
            )}> 
                <Table 
                    bordered={false}
                    size='small'
                    columns={sampleListColumn({handleShowDetail : showSrDetail})} 
                    dataSource={sampleListSource} 
                    rowKey="srcode" 
                    pagination={{...sampleListParams.pagination, showSizeChanger:false, showTotal:showTotal}}
                    loading={sampleListloading}
                    onChange={handleSampleListChange}
                    scroll={{ x: 'max-content' }}
                /> 
            </Card>
        </>
        )
    }

    // const CardSampleList = ()=>{ 
    //     return (
    //     <> 
    //         <Card 
    //         className='w-full' 
    //         style={{borderRadius:'2rem', height:'100%'}} 
    //         title={(
    //             <Typography.Title level={4} className='m-0 font-semibold !text-slate-700 uppercase' >
    //                 Sample List
    //             </Typography.Title>
    //         )}> 
    //             <Table 
    //                 bordered={false}
    //                 size='small'
    //                 columns={sampleWaitingApproveColumn} 
    //                 dataSource={sampleListSource} 
    //                 rowKey="spcode" 
    //                 pagination={{...sampleListParams.pagination, showSizeChanger:false, showTotal:showTotal}}
    //                 loading={sampleListloading}
    //                 onChange={handleSampleListChange}
    //                 scroll={{ x: 'max-content' }}
    //             /> 
    //         </Card>
    //     </>
    //     )
    // }

    const CardSampleWaitingApprove = ()=>{ 
        return (
        <> 
            <Card 
            className='w-full' 
            style={{borderRadius:'2rem', height:'100%'}} 
            title={(
                <Typography.Title level={4} className='m-0 font-semibold !text-slate-700 uppercase' >
                    Sample Waiting Approve
                </Typography.Title>
            )}> 
                <Table 
                    bordered={false}
                    size='small'
                    columns={sampleWaitingApproveColumn} 
                    dataSource={sampleWaitingApproveSource} 
                    rowKey="spcode" 
                    pagination={{...sampleWaitingApproveParams.pagination, showSizeChanger:false, showTotal:showTotal}}
                    loading={sampleWaitingApproveLoading}
                    onChange={handleSampleWaitingApproveChange}
                    scroll={{ x: 'max-content' }}
                /> 
            </Card>
        </>
        )
    } 

    const CardSampleDetail = () => { 
        return (
        <> 
            <Card 
            className='w-full' 
            style={{ height:'100%'}} 
            title={(
                <Typography.Title level={5} className='m-0 font-semibold !text-slate-700 uppercase' >
                    Sample Name List
                </Typography.Title>
            )}> 
                <Table 
                    bordered={false}
                    size='small'
                    columns={sampleDetailColumn} 
                    dataSource={sampleDetailSource} 
                    rowKey="id" 
                    pagination={{...sampleDetailParams.pagination, showSizeChanger:false, showTotal:showTotal}}
                    loading={sampleDetailLoading}
                    onChange={handleSampleDetailChange}
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

    const fetchSampleWaitingApproveData = async (load = false) => {
        setSampleWaitingApproveLoading(true && load);
        const res = await dsbservice.samplelist(  { ...sampleWaitingApproveParams, result:'waiting_approve' }, load );
        const { data:{source, pagination} } = res.data;
        setSampleWaitingApproveSource(source);
        setSampleWaitingApproveLoading(false && load);
        setSampleWaitingApproveParams( (state) => ({ ...state, pagination, }));
    }

    const fetchSampleData = async (load = false) => {
        setSampleListLoading(true && load);
        // const res = await dsbservice.samplelist( { ...sampleListParams, result:'approved' }, load );
        const res = await dsbservice.sample_requestlist( { ...sampleListParams }, load );
        const { data:{source, pagination} } = res.data;
        setSampleListSource(source);
        setSampleListLoading(false && load);
        setSampleListParams( (state) => ({ ...state, pagination, }));
    }

    const fetchSampleDetailData = async (load = false) => {
        setSampleDetailLoading(true && load);
        const res = await dsbservice.sample_requestdetail( { ...sampleDetailParams, code: srDetailSelected }, !load );
        const { data:{source, pagination} } = res.data;
        setSampleDetailSource(source);
        setSampleDetailLoading(false && load);
        setSampleDetailParams( (state) => ({ ...state, pagination, }));
    }

    // const fetchFilesExpireData = async (load = false) => {
    //     setFilesExpireLoading(true && load);
    //     const res = await dsbservice.filesexpire( { ...filesExpireParams }, load );
    //     const { data:{source, pagination} } = res.data;
    //     setFilesExpireSource(source);
    //     setFilesExpireLoading(false && load);
    //     setFilesExpireParams( (state) => ({ ...state, pagination, }));
    // }

    const fetchStatisticData = async () => {
        const res = await dsbservice.statistics();
        const { data } = res.data;
        setStatistic( state => ({...state, ...data}))
    }

    // useEffect(() => {
    //   if( mounted ) fetchSampleData( true );
    // }, [JSON.stringify(sampleListParams)]);

    // useEffect(() => {
    //   if( mounted ) fetchSampleWaitingApproveData( true );
    // }, [JSON.stringify(sampleWaitingApproveParams)]);

    // useEffect(() => {
    //   if( mounted ) fetchSampleDetailData( false );
    // }, [JSON.stringify(sampleDetailParams)]);

    // useEffect(() => {
    //   if( mounted ) fetchFilesExpireData( true );
    // }, [JSON.stringify(filesExpireParams)]);

    // useEffect(() => {
    //     const initeial = async () => {
    //         await Promise.all([
    //             fetchSampleData( false ), 
    //             fetchSampleWaitingApproveData( false ),
    //             // fetchFilesExpireData( false ),
    //             fetchStatisticData(),
    //         ]); 

    //         setTimeout( () =>setMounted(true) , 400);
    //     } 

    //     if( !mounted ) initeial();
    // }, []);

    const handleSampleListChange = (pagination, filters, sorter) => {
      setSampleListParams({ pagination, filters, ...sorter, }); 
      // `dataSource` is useless since `pageSize` changed
      if (pagination.pageSize !== sampleListParams.pagination?.pageSize) {
        setSampleListSource([]);
      }
    };    

    const handleSampleWaitingApproveChange = (pagination, filters, sorter) => {
      setSampleWaitingApproveParams({ pagination, filters, ...sorter, }); 
      // `dataSource` is useless since `pageSize` changed
      if (pagination.pageSize !== sampleWaitingApproveParams.pagination?.pageSize) {
        setSampleWaitingApproveSource([]);
      }
    };    

    const handleSampleDetailChange = (pagination, filters, sorter) => {
      setSampleDetailParams({ pagination, filters, ...sorter, }); 
      // `dataSource` is useless since `pageSize` changed
      if (pagination.pageSize !== sampleDetailParams.pagination?.pageSize) {
        setSampleDetailSource([]);
      }
    };    

    const handleFilesExpireChange = (pagination, filters, sorter) => {
      setFilesExpireParams({ pagination, filters, ...sorter, }); 
      // `dataSource` is useless since `pageSize` changed
      if (pagination.pageSize !== sampleListParams.pagination?.pageSize) {
        setFilesExpireSource([]);
      }
    };    

    return (
        <>
        <div className='layout-content px-3 sm:px-5 md:px-5'>
            <Space direction="vertical" size="middle" style={{ display: 'flex', position: 'relative', paddingInline:"1.34rem" }} className='dashboard' id='dashboard' >
                {/* <Row gutter={[12, 12]}>
                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                        <div style={{height:'100%'}}> 
                            <CardStatistic bgColor="#8f8df9" title="Sample Daily" icon={<FiFileText />} value={statisticData.daily} />
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                        <div style={{height:'100%'}}>
                            <CardStatistic bgColor="#fe8992" title="Sample Monthly" icon={<FiFileText />} value={statisticData.monthly} />
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                        <div style={{height:'100%'}}>
                            <CardStatistic bgColor="#3987d3" title="Sample Yearly" icon={<FiFileText />} value={statisticData.yearly} />
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                        <div style={{height:'100%'}}>
                            <CardStatistic bgColor="#ffd19d" title="Sample Waiting Approve" icon={<LuFileClock />} value={statisticData.waiting} />
                        </div>
                    </Col>
                </Row>
                <Row gutter={[18, 12]} style={{minHeight:380}}>
                    <Col xs={24} sm={12} md={12} lg={14} xl={14} >
                        <div style={{height:'100%'}}>
                            <CardSampleList />
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={12} lg={10} xl={10} >
                        <div style={{height:'100%'}}>
                            <CardSampleWaitingApprove /> 

                        </div>
                    </Col>
                </Row>  */}
            </Space> 
        </div>
            <div className='drawer-dashboard'> 
                <Drawer 
                title="Sample Details"
                className="responsive-drawer"
                width={668}
                onClose={() => { 
                    setSrDetailOpen(false);
                    setSrDetailSelected( null );
                    setSampleDetailSource([]);
                }} 
                getContainer={() => document.querySelector(".drawer-dashboard")}
                open={srDetailOpen}
                >
                    { srDetailOpen && <CardSampleDetail /> }
                </Drawer> 
            </div> 
        </>

    )
}

export default DashBoard