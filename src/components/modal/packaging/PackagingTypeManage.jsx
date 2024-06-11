import { Button, Flex, Form, Input, Space, Switch } from 'antd'
import React, { useState } from 'react'
import { FaRegSave } from "react-icons/fa";

function PackagingTypeManage({submit, initial = {}}) {
    const [form] = Form.useForm();

    // const [statusValue,]
    const handleSave = () => {
        form.validateFields( ).then( v => {
            if( typeof submit !== "function") return;

            submit( {...initial, ...v, status: v.status ? 'Y' : 'N'} );
        })
    }

    const initialValues = {
        status: true, // Set the default value for the Switch\
        ...initial
    };

    useState( () => {
        // console.log(initial);
        form.setFieldsValue(initialValues);

    }, []);

    return (
        <div className='packaging-type-manage px-0 md:px-5 lg:px-5'>
            <Form layout='vertical' form={form} autoComplete='off'>
                <Space direction='vertical' className='width-100'>
                    <Form.Item label='Packaging Type' name='pktype' rules={[ { required: true, message: "Please input your data!", } ]}>
                        <Input placeholder='Enter Packaing Type' />
                    </Form.Item>
                    <Form.Item label='Status' name='status' valuePropName="checked">
                        <Switch checkedChildren="Enable" unCheckedChildren="Disable" defaultChecked />
                    </Form.Item>
                    <Flex justify='flex-end'>
                        <div className='flex justify-end'>
                            <Button className='bn-primary bn-center' icon={<FaRegSave className='text-base' />} onClick={()=>handleSave()} >Save</Button>
                        </div>
                    </Flex>
                </Space>
            </Form>
        </div>
    )
}

export default PackagingTypeManage