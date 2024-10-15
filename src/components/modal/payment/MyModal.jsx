/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from "react";

import {
  Modal,
  Card,
  Table,
  message,
  Form,
  Button,
  Typography,
  Select,
} from "antd";
import { Row, Col, Space, Spin, Flex } from "antd";
import { Input } from "antd";
import { BankTwoTone, SearchOutlined } from "@ant-design/icons";
import { useForm } from "antd/es/form/Form";

import { bankListColumn } from "./model";
import { BsUiChecks } from "react-icons/bs";

import OptionService from "../../../service/Options.service";
import BankService from "../../../service/Bank.service";

const opservice = OptionService();
const bnkservice = BankService();
const mngConfig = {
  title: "",
  textOk: null,
  textCancel: null,
  action: "create",
  code: null,
};
export default function ModalBanks({ show, close, values, selected = [] }) {
  const [form] = useForm();
  const inputRef = useRef(null);
  const [modalData, setModalData] = useState([]);
  const [modalDataWrap, setModalDataWrap] = useState([]);

  const [openModal, setOpenModel] = useState(show);
  const [loading, setLoading] = useState(true);

  const [rowKeySelect, setRowKeySelect] = useState([]);

  const [banksOption, setBanksOption] = useState([]);
  const [banksOptionData, setBanksOptionDate] = useState([]);

  const [openManage, setOpenManage] = useState(false);
  const [config, setConfig] = useState(mngConfig);
  // console.log( itemsTypeData )

  /** handle logic component */
  const handleClose = () => {
    setTimeout(() => {
      close(false);
    }, 140);

    //setTimeout( () => close(false), 200 );
  };

  // const handleConfirm = () => {
  //     // console.log(itemsList);
  //     // values([...itemsList, ...selected]);
  //     // setItemsList([]);
  //     setOpenModel(false);
  // }

  const handleSearch = (value) => {
    const input = value?.toLowerCase();
    if (!!value) {
      const f = modalData.filter((d) => {
        const text =
          d.acc_no?.toLowerCase()?.includes(input) ||
          d.bank_name?.toLowerCase()?.includes(input) ||
          d.bank_name_th?.toLowerCase()?.includes(input) ||
          d.acc_name?.toLowerCase()?.includes(input);
        return text;
      });
      setModalDataWrap(f);
    } else setModalDataWrap(modalData);
  };

  const onFinish = (values) => {
    // console.log( values )
    const { bank, acc_name, acc_no, remark } = values;
    const bnk = banksOptionData.find((d) => d.key === bank);
    if (!bnk) {
      message.error("Bank data error please choose bank");
      throw new Error("Bank Data is not empty.");
    }
    values({
      bank,
      acc_name,
      acc_no,
      remark,
      bank_name: bnk?.official_name,
      bank_name_th: bnk?.thai_name,
      bank_nickname: bnk?.nice_name,
    });
  };

  /** setting initial component */
  const column = bankListColumn();
  const onload = async () => {
    setLoading(true);
      const [lbanksRes] = await Promise.all([opservice.optionsBanks()]).finally(
        () =>
          setTimeout(() => {
            setLoading(false);
          }, 400)
      );
      const { data: banksOptionData } = lbanksRes.data;

      const opnLtd = banksOptionData.map((v) => ({
        value: v.key,
        label: (
          <>
            <Flex align="center" gap={8}>
              <i
                className={`bank bank-${v.key} shadow huge`}
                style={{ height: 30, width: 30 }}
              ></i>
              <Flex align="start" gap={1} vertical>
                {/* <Typography.Text ellipsis style={{ fontSize: 13 }}>{v.thai_name}</Typography.Text>  */}
                <Typography.Text
                  ellipsis={true}
                  style={{ fontSize: 11, color: "#8c8386" }}
                >
                  {v.official_name}
                </Typography.Text>
              </Flex>
            </Flex>
          </>
        ),
        record: v,
      }));
      setBanksOption(opnLtd);
      setBanksOptionDate(banksOptionData);
  };

  useEffect(() => {
    if (!!openModal) {
      onload();
      // console.log("modal-packages")
    }
  }, [openModal]);

  const handleCheckDuplicate = (itemCode) =>
    !!selected.find((item) => item?.acc_no === itemCode);

  const itemSelection = {
    selectedRowKeys: rowKeySelect,
    type: "checkbox",
    fixed: true,
    hideSelectAll: true,
    onChange: (selectedRowKeys, selectedRows) => {
      // setRowKeySelect([...new Set([...selectedRowKeys, ...rowKeySelect])]);
      // setItemsList(selectedRows);
      //setRowKeySelect(selectedRowKeys);
    },
    getCheckboxProps: (record) => {
      return {
        disabled: handleCheckDuplicate(record.acc_no),
        name: record.acc_no,
      };
    },
    onSelect: (record, selected, selectedRows, nativeEvent) => {
      //console.log(record, selected, selectedRows, nativeEvent);
      if (selected) {
        setRowKeySelect([...new Set([...rowKeySelect, record.acc_no])]);
      } else {
        const ind = rowKeySelect.findIndex((d) => d === record.acc_no);
        const tval = [...rowKeySelect];
        tval.splice(ind, 1);
        setRowKeySelect([...tval]);
        //console.log(ind, rowKeySelect);
      }
    },
  };
  /** setting child component */
  const ButtonManageModal = (
    <Row
      gutter={[{ xs: 32, sm: 32, md: 32, lg: 12, xl: 12 }, 8]}
      className="m-0"
    >
      <Col span={24}>
        <Typography.Link
          onClick={() => {
            setConfig({ ...mngConfig, title: "Create Bank", action: "create" });
            setOpenManage(true);
          }}
          className="ps-1"
        >
          <span className="hover:underline underline-offset-1">
            Create Bank master data.
          </span>
        </Typography.Link>
      </Col>
    </Row>
  );
  /** */

  return (
    <>
      <Modal
        open={openModal}
        title={
          <>
            <BankTwoTone />
            <Typography.Text className="ms-1 mb-0">บันทึกการชำระเงิน</Typography.Text>
          </>
        }
        afterClose={() => handleClose()}
        onCancel={() => setOpenModel(false)}
        maskClosable={false}
        style={{ top: 20 }}
        width={800}
        className="modal-payment"
        footer={
          <Row>
            <Col span={24}>{/* Ignore */}</Col>
            <Col span={24}>
              <Flex justify="flex-end">
                <Button
                  className="bn-center bn-primary"
                  icon={<BsUiChecks />}
                  onClick={() => onFinish()}
                >
                  {" "}
                  Confirm{" "}
                </Button>
              </Flex>
            </Col>
          </Row>
        }
      >
        <Spin spinning={loading}>
          <Space
            direction="vertical"
            size="middle"
            style={{ display: "flex", position: "relative" }}
          >
            <Card style={{ backgroundColor: "#f0f0f0" }}>
              <Row gutter={[8, 8]} className="m-0">
                <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
                  <Form.Item
                    className=""
                    name="bank"
                    label="Choose Banks"
                    rules={[{ required: true, message: "Missing Bank" }]}
                  >
                    {/* <Input placeholder='Enter Loading type Name.' /> */}
                    <Select
                      showSearch
                      autoClearSearchValue
                      style={{ height: 42, width: "100%" }}
                      options={banksOption}
                      optionFilterProp="children"
                      filterOption={(input, option) => {
                        const { record: v } = option;
                        const val = input?.toLowerCase();
                        return (
                          (v?.official_name?.toLowerCase() ?? "").includes(
                            val
                          ) ||
                          (v?.thai_name?.toLowerCase() ?? "").includes(val) ||
                          (v?.key?.toLowerCase() ?? "").includes(val)
                        );
                      }}
                      filterSort={(optionA, optionB) => {
                        const { record: v1 } = optionA;
                        const { record: v2 } = optionB;

                        return (v1?.official_name ?? "")
                          .toLowerCase()
                          .localeCompare(
                            (v2?.official_name ?? "").toLowerCase()
                          );
                      }}
                      optionLabelProp="label"
                      optionRender={(option) => {
                        const { record: v } = option.data;
                        return (
                          <>
                            <Flex align="self-end" gap={8}>
                              <i
                                className={`bank bank-${v.key} shadow huge flex flex-grow-1`}
                                style={{ height: 34, width: 34, minWidth: 34 }}
                              ></i>
                              <Flex align="start" gap={1} vertical>
                                <Typography.Text
                                  ellipsis
                                  style={{ fontSize: 13, maxWidth: "100%" }}
                                >
                                  {v.thai_name}
                                </Typography.Text>
                                <Typography.Text
                                  ellipsis
                                  style={{
                                    fontSize: 11,
                                    color: "#8c8386",
                                    maxWidth: "100%",
                                  }}
                                >
                                  {v.official_name}
                                </Typography.Text>
                              </Flex>
                            </Flex>
                          </>
                        );
                      }}
                      allowClear
                      placeholder="Select Bank Name."
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Space>
        </Spin>
      </Modal>
    </>
  );
}
