/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Flex,
  message,
  Badge,
  Card,
  Select,
  Modal,
  InputNumber,
} from "antd";
import { Row, Col, Space, Upload } from "antd";
import { SaveFilled } from "@ant-design/icons";
import { ButtonBack, uploadButton } from "../../components/button";
import { Items } from "./model";
import { useLocation, useNavigate } from "react-router";
import { delay, BACKEND_URL_MAIN } from "../../utils/util";
import Swal from "sweetalert2";
// import OptionService from '../../service/Options.service';
import Itemservice from "../../service/Items.Service";
import OptionService from "../../service/Options.service";

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
const itemservice = Itemservice();
const opService = OptionService();
const from = "/items";

const ItemsManage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { config } = location.state || { config: null };
  const [form] = Form.useForm();
  // const [formImage] = Form.useForm();
  const [formDetail, setFormDetail] = useState(Items);
  const [optionUnit, setOptionUnit] = useState([]);
  const [optionType, setOptionType] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");

  useEffect(() => {
    // setLoading(true);
    GetItemsUnit();
    GetItemsType();

    if (config?.action !== "create") {
      getsupData(config.code);
    } else {
      form.setFieldValue("vat", 0);
      form.setFieldValue("weight_stable", "N");
      form.setFieldValue("packing_weight", 1);
    }
    // console.log(config);

    return () => {
      form.resetFields();
    };
  }, []);

  const GetItemsType = () => {
    opService.optionsItemstype().then((res) => {
      let { data } = res.data;
      setOptionType(data);
    });
  };

  const GetItemsUnit = () => {
    opService.optionsUnit().then((res) => {
      let { data } = res.data;
      setOptionUnit(data);
    });
  };

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const getsupData = (v) => {
    itemservice
      .get(v)
      .then(async (res) => {
        const { data, file } = res.data;

        const init = {
          ...data,
        };

        setFormDetail(init);
        form.setFieldsValue({ ...init });

        let fileurl = file.map((data) => ({
          ...data,
          file_name: `${BACKEND_URL_MAIN}/uploads/` + data.file_name,
        }));
        // console.log(fileurl) ;
        const formattedFileList = fileurl.map((data) => ({
          img_id: data.img_id,
          uid: data.uid,
          name: data.name,
          status: "done",
          url: data.file_name,
        }));
        setFileList(formattedFileList);
        form.setFieldsValue({ prod_img: formattedFileList });
      })
      .catch((err) => {
        console.log(err);
        message.error("Error getting infomation Product.");
      });
  };

  const handleConfirm = () => {
    form.validateFields().then((v) => {
      const source = { ...formDetail, ...v };
      const actions =
        config?.action !== "create"
          ? itemservice.update(source)
          : itemservice.create(source);

      actions
        .then(async (r) => {
          message.success("Request success.");
          navigate(from, { replace: true });
          await delay(300);
          console.clear();
        })
        .catch((err) => {
          console.warn(err);
          const data = err?.response?.data;
          message.error(data?.message || "บันทึกไม่สำเร็จ");
        });
    });
  };

  const handlePreview = async (file) => {
    // console.log(file)
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
    setPreviewTitle(
      file.name || file.url.substring(file.url.lastIndexOf("/") + 1)
    );
  };
  const handleCancel = () => setPreviewOpen(false);

  const onRemove = (file) => {
    // console.log(file);
    //debugger
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          const formData_Del = new FormData();
          formData_Del.append("img_id", file.img_id);
          formData_Del.append("file", file);
          formData_Del.append("uid", file.uid);

          const actions =
            config?.action !== "create"
              ? itemservice.deletePicUpdate(formData_Del)
              : itemservice.deletePic(formData_Del);

          actions.then(async (res) => {
            //debugger
            let { status, data } = res;
            if (status === 200 && data.status === "1") {
              handleRemove(file);
            } else {
              // alert(data.message)
            }
          });
        } catch (error) {
          message.error("Failed to delete file");
        }
      }
    });

    // console.log(fileList);
  };

  const onUploadSuccess = (file) => {
    //debugger
    // alert(`${BACKEND_URL_MAIN}/uploads/` + file.uid + "_" + file.name);
    const newFile = {
      uid: file.uid,
      name: file.name,
      status: "done",
      url: `${BACKEND_URL_MAIN}/uploads/` + file.uid + "_" + file.name,
    };
    setFileList((prevFileList) => [...prevFileList, newFile]);
    // console.log(file);
    // console.log('-----');
    // console.log(fileList);
  };

  // const handleChange = (info) => {
  //   console.log('FileList:', info.fileList);
  //   //setFileList(info.fileList);
  // };

  const handleRemove = (file) => {
    //debugger
    // Your logic to remove the file
    const newFileList = fileList.filter((f) => f.uid !== file.uid);
    setFileList(newFileList);
    //message.success(`File deleted successfully`);
  };

  const propsAdd = {
    customRequest: async ({ file, onSuccess, onError }) => {
      if (
        form.getFieldValue("stcode") !== "" &&
        form.getFieldValue("stcode") !== undefined
      ) {
        // console.log(fileList);
        const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif"]; // รายการสกุลไฟล์ที่อนุญาต
        const fileExtension = file.name.slice(
          ((file.name.lastIndexOf(".") - 1) >>> 0) + 2
        ); // สกุลไฟล์ของไฟล์ที่อัพโหลด
        if (!allowedExtensions.includes(`.${fileExtension.toLowerCase()}`)) {
          message.error("สกุลไฟล์ไม่ถูกต้อง");
          onError();
          return false;
        } else {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("uid", file.uid);
          formData.append("stcode", form.getFieldValue("stcode"));
          // console.log(file)
          try {
            itemservice.uploadPic(formData).then(async (res) => {
              //debugger
              let { status, data } = res;
              if (status === 200 && data.status === "1") {
                onUploadSuccess(file);
                onSuccess();
                message.success(`${file.name} file uploaded successfully`);
              } else {
                // alert(data.message)
              }
            });
          } catch (error) {
            onError(error);
            message.error(`${file.name} file upload failed.`);
          }
        }
        // console.log(fileList);
      } else message.error(`กรุณากรอกรหัสสินค้าก่อน.`);
    },
  };

  const Detail = (
    <>
      <Row gutter={[8, 8]} className="px-2 sm:px-4 md:px-4 lg:px-4">
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={4}>
          <Form.Item
            label="รหัสสินค้า"
            value=" "
            name="stcode"
            rules={[{ required: true, message: "โปรดกรอกข้อมูล" }]}
          >
            <Input
              disabled={config.action === "edit"}
              placeholder="กรอกรหัสสินค้า"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={8}>
          <Form.Item
            label="ชื่อสินค้า"
            name="stname"
            rules={[{ required: true, message: "โปรดกรอกข้อมูล" }]}
          >
            <Input placeholder="กรอกชื่อสิ" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={8}>
          <Form.Item
            label="ชื่อสินค้าภาษาอังกฤษ"
            name="stnameEN"
            rules={[{ required: true, message: "โปรดกรอกข้อมูล" }]}
          >
            <Input placeholder="กรอกชื่อสินค้าภาษาอังกฤษ" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={4}>
          <Form.Item label="หน่วยสินค้า" name="unit">
            <Select
              size="large"
              showSearch
              filterOption={filterOption}
              placeholder="เลือกหน่วยสินค้า"
              options={optionUnit.map((item) => ({
                value: item.value,
                label: item.value,
              }))}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[8, 8]} className="px-2 sm:px-4 md:px-4 lg:px-4">
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={4}>
          <Form.Item label="ประเภทสินค้า" name="typecode">
            <Select
              size="large"
              showSearch
              filterOption={filterOption}
              placeholder="เลือกประเภทสินค้า"
              options={optionType.map((item) => ({
                value: item.typecode,
                label: item.typename,
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={4}>
          <Form.Item label="ราคาซื้อ" name="buyprice">
            <Input placeholder="กรอกราคาซื้อ" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={4}>
          <Form.Item label="ราคาขาย" name="price">
            <Input placeholder="กรอกราคาขาย" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={4} lg={4}>
          <Form.Item label="น้ำหนักต่อถุง" name="packing_weight">
            <InputNumber
              className="width-100 input-30 text-end"
              style={{ height: 40 }}
              min={0}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={4} lg={4}>
          <Form.Item label="ภาษี" name="vat">
            <InputNumber
              className="width-100 input-30 text-end"
              style={{ height: 40 }}
              min={0}
            />
          </Form.Item>
        </Col>        
      </Row>
      <Row gutter={[8, 8]} className="px-2 sm:px-4 md:px-4 lg:px-4">
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={4}>
          <Form.Item label="โหมดน้ำหนักคงที่" name="weight_stable">
            <Select
              size="large"
              options={[
                {
                  value: "N",
                  label: <Badge status="error" text="ชั่งน้ำหนักตามหน้างาน" />,
                },
                {
                  value: "Y",
                  label: <Badge status="success" text="ใช้น้ำหนักคงที่" />,
                },
              ]}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={4}>
          <Form.Item label="น้ำหนักที่ตั้งไว้ให้คงที่" name="weight">
            <Input placeholder="น้ำหนัก" />
          </Form.Item>
        </Col>
        <Col
          xs={24}
          sm={24}
          md={12}
          lg={12}
          xl={12}
          xxl={4}
          style={
            config.action === "edit"
              ? { display: "inline" }
              : { display: "none" }
          }
        >
          <Form.Item label="สถานะการใช้งาน" name="active_status">
            <Select
              size="large"
              options={[
                {
                  value: "Y",
                  label: <Badge status="success" text="เปิดการใช้งาน" />,
                },
                {
                  value: "N",
                  label: <Badge status="error" text="ปิดการใช้งาน" />,
                },
              ]}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={4} lg={4} xl={4}>
          รูปสินค้า
          <Form.Item
            name="prod_img"
            getValueFromEvent={(event) => {
              return event?.fileList;
            }}
            // rules={[
            //   {
            //     required: true,
            //     message: "กรุณาอัพโหลดรูปสินค้า!",
            //   },
            // ]}
          >
            <Upload
              {...propsAdd}
              fileList={fileList}
              listType="picture-card"
              onPreview={handlePreview}
              onRemove={onRemove}
            >
              {fileList.length >= 1 ? null : uploadButton}
            </Upload>
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  const SectionBottom = (
    <Row
      gutter={[{ xs: 32, sm: 32, md: 32, lg: 12, xl: 12 }, 8]}
      className="m-0"
    >
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start">
          <ButtonBack target={from} />
        </Flex>
      </Col>
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex gap={4} justify="end">
          <Button
            icon={<SaveFilled style={{ fontSize: "1rem" }} />}
            type="primary"
            style={{ width: "9.5rem" }}
            onClick={() => {
              handleConfirm();
            }}
          >
            บันทึก
          </Button>
        </Flex>
      </Col>
    </Row>
  );
  return (
    <div className="item-manage xs:px-0 sm:px-0 md:px-8 lg:px-8">
      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={handleCancel}
      >
        <img
          alt="example"
          style={{
            width: "100%",
          }}
          src={previewImage}
        />
      </Modal>
      <Space direction="vertical" className="flex gap-2">
        <Form
          form={form}
          name="form_in_modal_add"
          layout="vertical"
          autoComplete="off"
          initialValues={{
            modifier: "public",
          }}
        >
          <Card title={config?.title}>{Detail}</Card>
        </Form>
        {SectionBottom}
      </Space>
    </div>
  );
};

export default ItemsManage;
