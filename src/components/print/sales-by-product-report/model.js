import { Flex, Typography, Image } from "antd";
import { comma } from "../../../utils/utils";

export const column = (code) => [
  {
    title: "CHARGE NO.",
    dataIndex: "charge",
    key: "charge",
    align: "center",
    onCell: (_, index) => {
      if (index === 0) {
        return {
          rowSpan: 3,
        };
      }
      if (index === 1 || index === 2) {
        return {
          rowSpan: 0,
        };
      }

      return {};
    },
  },
  {
    title: "COIL NO.",
    dataIndex: "coilno",
    key: "coilno",
    align: "center",
  },
  {
    title: "WEIGHT",
    dataIndex: "weight",
    key: "weight",
    align: "center",
  },
  {
    title: <div style={{ textAlign: "center" }}>DIAMETER (mm.)</div>,
    dataIndex: "diameter",
    key: "diameter",
    onCell: (_, index) => {
      if (index === 0 || index === 2) {
        return {
          align: "right",
        };
      }
      if (index === 1) {
        return {
          align: "left",
        };
      }
      return {
        align: "center",
      };
    },
  },
  {
    title: "AREA sq.mm.",
    dataIndex: "area",
    key: "area",
    align: "center",
    render: (area) => (area ? area : ""),
  },
  {
    title: "TENSILE LOAD (Kgf.)",
    dataIndex: "tens_ld",
    key: "tens_ld",
    align: "center",
    render: (tens_ld) => (tens_ld ? tens_ld : ""),
  },
  {
    title: "TENSILE STRENGTH (Kgf/sq.mm)",
    dataIndex: "tensile",
    key: "tensile",
    align: "center",
    render: (tensile) => (tensile ? tensile : ""),
  },
  {
    title: "YIELD LOAD (Kgf.)",
    dataIndex: "yield_ld",
    key: "yield_ld",
    align: "center",
    render: (yield_ld) => (yield_ld ? yield_ld : ""),
  },
  {
    title: "YIELD STRENGTH (Kgf/sq.mm)",
    dataIndex: "yield_str",
    key: "yield_str",
    align: "center",
    render: (yield_str) => (yield_str ? yield_str : ""),
  },
  // {
  //   title: "REDUCTION AREA",
  //   dataIndex: "re_area",
  //   key: "re_area",
  //   align: "center",
  //   render: (re_area) => (re_area ? re_area : ""),
  // },
  {
    title: "REVERSE BENDING",
    dataIndex: "reverse",
    key: "reverse",
    align: "center",
    render: (reverse) => (reverse ? reverse : ""),
  },
  {
    title: code !== "PCW43" ? "INDENT DEPTH" : "WAVE HEIGHT",
    dataIndex: "indent",
    key: "indent",
    align: "center",
    render: (indent) => (indent ? indent : ""),
  },
  {
    title: "ELONG",
    dataIndex: "elong",
    key: "elong",
    align: "center",
    render: (elong) => (elong ? elong : ""),
  },
  {
    title: "CAMBER",
    dataIndex: "camber",
    key: "camber",
    align: "center",
    render: (camber) => (camber ? camber : ""),
  },
  {
    title: "UNIT WEIGHT",
    dataIndex: "u_weight",
    key: "u_weight",
    align: "center",
    render: (u_weight) => (u_weight ? u_weight : ""),
  },
  {
    title: "ลักษณะลวด",
    key: "testdate",
    dataIndex: "testdate",
    align: "center",
    render: (testdate) => (testdate ? "ลวดดี" : ""),
  },
];

export const columns2 = [
  {
    title: "LAB INSPECTOR",
    dataIndex: "lab_insp",
    key: "lab_insp",
    align: "center",
  },
  {
    title: "Q.C. ENGINEER",
    dataIndex: "qc_en",
    key: "qc_en",
    align: "center",
  },
];