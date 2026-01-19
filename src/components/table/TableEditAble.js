import React, { useContext, useEffect, useState, useRef } from "react";
import {
  Form,
  Input,
  AutoComplete,
  Space,
  Button,
  InputNumber,
  Select,
  Switch,
} from "antd";
import { CheckOutlined, CloseOutlined, SearchOutlined } from "@ant-design/icons";
import { MenuOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const EditableRow = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false} autoComplete="off">
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const EditableContext = React.createContext(null);

export const EditableCell = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleEditCell,
  fieldType,
  required,
  readonly,
  type,
  autocompleteOption,
  modalSelect,
  optionsItems,
  optionsStcode,
  childProps,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const tdRef = useRef(null);
  const lastValueRef = useRef(undefined);
  const pendingNavRef = useRef(null);
  const form = useContext(EditableContext);

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  type = type || "input";

  useEffect(() => {
    if (editing && !readonly) {
      inputRef.current?.focus();
      inputRef.current?.select?.();
    }
  }, [editing, readonly]);

  const toggleEdit = (force) => {
    const next = typeof force === "boolean" ? force : !editing;
    if (readonly) return;
    setEditing(next);
    if (next) {
      lastValueRef.current = record[dataIndex];
      form.setFieldsValue({ [dataIndex]: record[dataIndex] });
    }
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      setEditing(false);
      handleEditCell({
        ...record,
        ...values,
        key: dataIndex,
      });
      if (pendingNavRef.current) {
        const dir = pendingNavRef.current;
        pendingNavRef.current = null;
        setTimeout(() => moveToNeighbor(dir), 0);
      }
    } catch {}
  };

  const select = async () => {
    try {
      const values = await form.validateFields();
      setEditing(false);
      handleEditCell({
        ...record,
        ...values,
        key: dataIndex,
      });
      // If navigation not already scheduled by keydown, schedule it
      if (!pendingNavRef.current) {
        pendingNavRef.current = "right";
      }
      setTimeout(() => {
        const dir = pendingNavRef.current;
        pendingNavRef.current = null;
        moveToNeighbor(dir);
      }, 0);
    } catch {}
  };

  const selectStcode = async (data, v) => {
    try {
      setEditing(false);
      handleEditCell({
        ...record,
        _rid: record._rid,
        stcode: v.stcode,
        stname: v.stname,
        price: v.price,
        unit: v.unit,
        vat: v.vat,
        key: dataIndex,
      });
      // After updating row data, focus price editor in same row
      setTimeout(() => {
        focusColInSameRow("price");
      }, 0);
    } catch {}
  };

  const switced = async () => {
    try {
      const values = await form.validateFields();
      handleEditCell({
        ...record,
        ...values,
        key: dataIndex,
      });
    } catch {}
  };

  const findEditableTdByKey = (rowEl, colKey, fallbackIndex) => {
    if (!rowEl) return null;
    if (colKey) {
      const m = Array.from(rowEl.children).find(
        (c) => c.getAttribute && c.getAttribute("data-col") === colKey
      );
      if (m && m.getAttribute("data-editable") === "1") return m;
    }
    const td = rowEl.children[fallbackIndex];
    if (td && td.getAttribute("data-editable") === "1") return td;
    return Array.from(rowEl.children).find(
      (c) => c.getAttribute && c.getAttribute("data-editable") === "1"
    );
  };

  const findHorizontal = (startTd, stepKey) => {
    let cur = startTd;
    while (cur && cur[stepKey]) {
      cur = cur[stepKey];
      if (
        cur.getAttribute &&
        cur.getAttribute("data-editable") === "1" &&
        !(cur.getAttribute && cur.getAttribute("data-type") === "select-stcode-skip")
      )
        return cur;
    }
    return null;
  };
  const findFirstEditableInRow = (rowEl) => {
    if (!rowEl) return null;
    return Array.from(rowEl.children).find(
      (c) =>
        c.getAttribute &&
        c.getAttribute("data-editable") === "1" &&
        !(c.getAttribute && c.getAttribute("data-type") === "select-stcode-skip")
    );
  };

  const moveToNeighbor = (dir) => {
    const td = tdRef.current;
    if (!td) return;
    const tr = td.closest("tr");
    if (!tr) return;
    const colKey = td.getAttribute("data-col");
    const colIndex = Array.from(tr.children).indexOf(td);

    let targetTd = null;
    if (dir === "down") {
      const nextTr = tr.nextElementSibling;
      targetTd = findEditableTdByKey(nextTr, colKey, colIndex);
    } else if (dir === "right") {
      // try same row to the right
      targetTd = findHorizontal(td, "nextElementSibling");
      // if none, jump to first editable cell of next row
      if (!targetTd) {
        const nextTr = tr.nextElementSibling;
        targetTd = findFirstEditableInRow(nextTr);
      }
    }

    if (targetTd) {
      const clickable = targetTd.querySelector(".editable-cell-value-wrap");
      if (clickable) {
        clickable.focus();
        clickable.click();
      } else {
        targetTd.focus();
        targetTd.click();
      }
      setTimeout(() => focusEditor(targetTd), 0);
    }
  };

  const handleWrapperKeyDown = (e) => {
    if (!editable || readonly) return;
    if (!editing) {
      if (e.key === "Enter") {
        e.preventDefault();
        toggleEdit(true);
        setTimeout(() => focusEditor(tdRef.current), 0);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        moveToNeighbor("right");
        return;
      }
    }
  };

  const focusColInSameRow = (colKey) => {
    let attempt = 0;
    const MAX = 12;
    const tryFocus = () => {
      const baseTd = tdRef.current;
      const tr = baseTd?.closest("tr");
      const targetTd = tr?.querySelector(`td[data-col='${colKey}']`);
      if (targetTd && targetTd.getAttribute("data-editable") === "1") {
        const clickable = targetTd.querySelector(".editable-cell-value-wrap");
        (clickable || targetTd).click();
        requestAnimationFrame(() => focusEditor(targetTd));
      } else if (attempt < MAX) {
        attempt++;
        requestAnimationFrame(tryFocus);
      }
    };
    requestAnimationFrame(tryFocus);
  };

  const handleEditorKeyDown = (e) => {
    if (!editable || readonly) return;

    // Enter หรือ Tab: จะบันทึก แล้วขยับไปขวา หรือถ้าเป็นช่องแบบ so-last ในแถวสุดท้าย ให้เพิ่มแถวใหม่
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      pendingNavRef.current = "right";

      const td = tdRef.current;
      const tr = td?.closest("tr");
      const isLastRow = !tr?.nextElementSibling; // ถ้าไม่มี tr ถัดไป = แถวสุดท้าย

      // ถ้า column นี้เป็น trigger (so-last) และเป็นแถวสุดท้าย และ parent มี handleAddRow
      if (type === "so-last" && isLastRow && childProps?.handleAddRow) {
        // save แล้วเพิ่มแถวใหม่ จากนั้นเลือกเซลล์แรกของแถวใหม่
        save().then(() => {
          // ให้เวลา React อัพเดท state แล้วค่อยเพิ่มแถว (เล็กน้อย)
          setTimeout(() => {
            try {
              childProps.handleAddRow();
            } catch (err) {
              console.warn("handleAddRow error", err);
            }
            // หลังเพิ่มเสร็จ ให้ focus เซลล์แรก editable ของแถวใหม่
            setTimeout(() => {
              const table = tr?.closest("table");
              const newLastTr = table?.querySelector("tbody tr:last-child");
              if (newLastTr) {
                const firstEditableTd = Array.from(newLastTr.children).find(
                  (c) => c.getAttribute?.("data-editable") === "1"
                );
                if (firstEditableTd) {
                  const clickable = firstEditableTd.querySelector(".editable-cell-value-wrap");
                  (clickable || firstEditableTd).click();
                  setTimeout(() => focusEditor(firstEditableTd), 50);
                }
              }
            }, 80);
          }, 40);
        });
        return;
      }

      // ปกติ: บันทึก และให้ behavior เดิม (moveToNeighbor triggered in save)
      save();
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      form.setFieldsValue({ [dataIndex]: lastValueRef.current });
      setEditing(false);
    }
  };

  let childNode = children;
  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
        rules={[{ required: !!required, message: `${title} is required.` }]}
      >
        <>
          {type === "input" && (
            <Input
              placeholder="Enter value"
              ref={inputRef}
              onKeyDown={handleEditorKeyDown}
              onBlur={save}
              style={{
                height: 32,
                minWidth: "none",
                textAlign: "end",
                ...restProps.style,
              }}
              className="ant-input"
              autoComplete="off"
              readOnly={readonly}
            />
          )}
          {type === "textarea" && (
            <textarea
              rows={2}
              ref={inputRef}
              onBlur={save}
              onKeyDown={handleEditorKeyDown}
              style={{ width: "100%", height: 64 }}
              className="ant-input"
              readOnly={readonly}
            />
          )}
          {type === "autocomplete" && (
            <AutoComplete
              children={
                <Input
                  ref={inputRef}
                  style={{ height: 32, ...restProps.style }}
                  onKeyDown={handleEditorKeyDown}
                />
              }
              onBlur={save}
              onSelect={save}
              options={autocompleteOption}
              placeholder="Enter value"
              filterOption={(inputValue, option) =>
                option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />
          )}
          {type === "modal-select" && (
            <Space.Compact style={{ width: "100%", height: 32, minWidth: "none" }}>
              <Input
                readOnly
                placeholder="Choose value"
                value={record[dataIndex]}
                style={{ height: 32, ...restProps.style }}
                onKeyDown={handleEditorKeyDown}
                onBlur={save}
              />
              <Button
                className="bn-secondary bn-center bn-action"
                size="small"
                icon={<SearchOutlined />}
                onClick={(e) => modalSelect(e, record)}
                style={{
                  minWidth: 40,
                  height: 32,
                  borderRadius: 6,
                  borderStartStartRadius: 0,
                  borderEndStartRadius: 0,
                }}
              />
            </Space.Compact>
          )}
          {type === "number" && (
            <InputNumber
              placeholder="กรอกข้อมูล"
              ref={inputRef}
              onKeyDown={(e) => {
                if (childProps?.onKeyDown) childProps.onKeyDown(e);
                handleEditorKeyDown(e);
              }}
              onBlur={save}
              style={{
                height: 32,
                minWidth: "none",
                textAlign: "end",
                ...restProps.style,
              }}
              className="width-100 input-30 !text-end"
              autoComplete="off"
              readOnly={readonly}
              controls={false}
              {...childProps}
            />
          )}
          {type === "switch" && (
            <Switch
              checkedChildren={<CheckOutlined />}
              unCheckedChildren={<CloseOutlined />}
              onChange={switced}
              onKeyDown={handleEditorKeyDown}
            />
          )}
          {type === "select" && (
            <Select
              allowClear
              autoClearSearchValue={false}
              showSearch
              style={{ width: "100%" }}
              className="input-30"
              placeholder="เลือกข้อมูล"
              options={(optionsItems || []).map((m) => ({ label: m.label, value: m.value }))}
              filterOption={filterOption}
              onSelect={select}
              onBlur={save}
              onKeyDown={handleEditorKeyDown}
              onInputKeyDown={handleEditorKeyDown}
              disabled={readonly}
            />
          )}
          {type === "select-stcode" && (
            <Select
              allowClear
              autoClearSearchValue={false}
              showSearch
              style={{ width: "100%" }}
              className="input-30"
              placeholder="เลือกข้อมูล"
              options={(optionsStcode || []).map((m) => ({ label: m.label, value: m.value,stcode:m.value,stname:m.label,price:m.price,unit:m.unit,vat:m.vat }))}
              filterOption={filterOption}
              onSelect={(data,value)=>selectStcode(data,value)}
              onBlur={save}
              disabled={readonly}
            />
          )}
          {type === "select-stcode-skip" && (
            <Select
              allowClear
              autoClearSearchValue={false}
              showSearch
              style={{ width: "100%" }}
              className="input-30"
              placeholder="เลือกข้อมูล"
              options={(optionsStcode || []).map((m) => ({ label: m.label, value: m.value,stcode:m.value,stname:m.label,price:m.price,unit:m.unit,vat:m.vat }))}
              filterOption={filterOption}
              onSelect={(data,value)=>selectStcode(data,value)}
              onBlur={save}
              onKeyDown={handleEditorKeyDown}
              onInputKeyDown={handleEditorKeyDown}
              disabled={readonly}
            />
          )}
          {type === "so-last" && (
            <InputNumber
              placeholder="กรอกข้อมูล"
              ref={inputRef}
              onKeyDown={(e) => {
                if (childProps?.onKeyDown) childProps.onKeyDown(e);
                handleEditorKeyDown(e);
              }}
              onBlur={save}
              style={{
                height: 32,
                minWidth: "none",
                textAlign: "end",
                ...restProps.style,
              }}
              className="width-100 input-30 !text-end"
              autoComplete="off"
              readOnly={readonly}
              controls={false}
              {...childProps}
            />
          )}
        </>
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        tabIndex={0}
        style={{
          paddingRight: 8,
          height: !!fieldType ? 64 : 32,
          border: "1px solid #eee",
          borderRadius: 6,
          lineHeight: "1.4rem",
          outline: "none",
        }}
        onClick={() => toggleEdit(true)}
        onKeyDown={handleWrapperKeyDown}
      >
        {children}
      </div>
    );
  }

  return (
    <td
      {...restProps}
      ref={tdRef}
      data-col={dataIndex}
      data-type={type}
      data-editable={editable ? "1" : "0"}
      tabIndex={editable ? 0 : -1}
    >
      {childNode}
    </td>
  );
};

export const RowDrag = ({ children, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props["data-row-key"],
  });
  const [form] = Form.useForm();
  const style = {
    ...props.style,
    transform: CSS.Transform.toString(
      transform && {
        ...transform,
        scaleY: 1,
      }
    ),
    transition,
    ...(isDragging
      ? {
          position: "relative",
          zIndex: 999,
        }
      : {}),
  };
  return (
    <Form form={form} component={false} autoComplete="off">
      <EditableContext.Provider value={form}>
        <tr {...props} ref={setNodeRef} style={style} {...attributes}>
          {React.Children.map(children, (child) => {
            if (child.key === "sort") {
              return React.cloneElement(child, {
                children: (
                  <MenuOutlined
                    ref={setActivatorNodeRef}
                    style={{
                      touchAction: "none",
                      cursor: "move",
                    }}
                    {...listeners}
                  />
                ),
              });
            }
            return child;
          })}
        </tr>
      </EditableContext.Provider>
    </Form>
  );
};

const focusEditor = (cellEl) => {
  if (!cellEl) return;
  const el =
    cellEl.querySelector("input, textarea") ||
    cellEl.querySelector(".ant-input-number input") ||
    cellEl.querySelector(".ant-select-selector input") ||
    cellEl.querySelector(".ant-select-selection-search-input");

  if (el) {
    el.focus();
    try { el.select?.(); } catch {}
    return;
  }

  // Fallback: open Select to expose its input, then focus it
  const sel = cellEl.querySelector(".ant-select");
  if (sel) {
    sel.querySelector(".ant-select-selector")?.click();
    const sInput =
      sel.querySelector(".ant-select-selector input") ||
      sel.querySelector(".ant-select-selection-search-input");
    sInput?.focus();
  }
};
