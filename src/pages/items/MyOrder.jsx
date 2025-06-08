import React, { useContext, useMemo, useEffect } from "react";
import { Button, Flex, Table, Card, message } from "antd";
import { HolderOutlined } from "@ant-design/icons";
import { DndContext } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ButtonBack } from "../../components/button";
import { SaveFilled } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router";
import { columnsOrder } from "./model";
import Itemservice from "../../service/Items.Service";

const itemservice = Itemservice();

const from = "/items";
const RowContext = React.createContext({});

const DragHandle = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return (
    <Button
      type="text"
      size="small"
      icon={<HolderOutlined />}
      style={{ cursor: "move" }}
      ref={setActivatorNodeRef}
      {...listeners}
    />
  );
};
const columns = columnsOrder({ DragHandle });

const Row = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props["data-row-key"] });
  const style = Object.assign(
    Object.assign(Object.assign({}, props.style), {
      transform: CSS.Translate.toString(transform),
      transition,
    }),
    isDragging ? { position: "relative", zIndex: 9999 } : {}
  );
  const contextValue = useMemo(
    () => ({ setActivatorNodeRef, listeners }),
    [setActivatorNodeRef, listeners]
  );
  return (
    <RowContext.Provider value={contextValue}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes} />
    </RowContext.Provider>
  );
};

const ItemsOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { config } = location.state || { config: null };
  const [dataSource, setDataSource] = React.useState([]);

  useEffect(() => {
    // ดึงข้อมูลจาก API หรือแหล่งข้อมูลอื่น ๆ
    const data = {};
    itemservice
      .search(data, { ignoreLoading: Object.keys(data).length !== 0 })
      .then((res) => {
        const { data } = res.data;
        // const datamap = data
        setDataSource(
          data.map((item, index) => ({
            ...item,
            key: index + 1, // ใช้ index เป็น key
          }))
        );
      })
      .catch((err) => {
        console.log(err);
        message.error("Request error!");
      });
  }, []);

  const onDragEnd = ({ active, over }) => {
    if (active.id !== (over === null || over === void 0 ? void 0 : over.id)) {
      setDataSource((prevState) => {
        const activeIndex = prevState.findIndex(
          (record) =>
            record.key ===
            (active === null || active === void 0 ? void 0 : active.id)
        );
        const overIndex = prevState.findIndex(
          (record) =>
            record.key === (over === null || over === void 0 ? void 0 : over.id)
        );
        const newData = arrayMove(prevState, activeIndex, overIndex).map(
          (item, idx) => ({
            ...item,
            seq: idx + 1, // เพิ่มหรืออัปเดต seq ให้ตรงกับ index แถวใหม่
          })
        );
        // แสดง alert ข้อมูลแถวที่ถูกย้าย
        // alertAllRows(newData);
        return newData;
      });
    }
  };

  const handleConfirm = () => {
    const source = { detail: dataSource };
    itemservice
      .order(source)
      .then(async (r) => {
        message.success("Request success.");
        navigate(from, { replace: true });
        // await delay(300);
        console.clear();
      })
      .catch((err) => {
        console.warn(err);
        const data = err?.response?.data;
        message.error(data?.message || "บันทึกไม่สำเร็จ");
      });
  };

  const SectionTop = (
    <>
      <ButtonBack target={from} />
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
    </>
  );
  const Detail = (
    <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
      <SortableContext
        items={dataSource.map((i) => i.key)}
        strategy={verticalListSortingStrategy}
      >
        <Table
          rowKey="key"
          components={{ body: { row: Row } }}
          columns={columns}
          dataSource={dataSource}
          scroll={{ x: "max-content" }}
          pagination={{
            total: dataSource?.length || 0,
            showTotal: (_, range) =>
              `${range[0]}-${range[1]} of ${dataSource?.length || 0} items`,
            defaultPageSize: 30,
            pageSizeOptions: [30, 50, 100],
          }}
        />
      </SortableContext>
    </DndContext>
  );
  return (
    <>
      {SectionTop}
      <br></br>
      <br></br>
      <Card title={config?.title}>{Detail}</Card>
    </>
  );
};

export default ItemsOrder;
