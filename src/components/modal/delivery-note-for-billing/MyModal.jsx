/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import { message } from "antd";

import OptionService from "../../../service/Options.service"
import DeliveryNoteService from "../../../service/DeliveryNote.service";
import DnSummaryModal from "./DnSummaryModal";

const opnService = OptionService();
const dnService = DeliveryNoteService();

const getShippingRowKey = (item) => (
    item?._rowKey || [item?.dncode, item?.socode, item?.code].filter(Boolean).join("::")
);

export default function ModalDeliverynoteBilling({show, close, cuscode, values, selected}) {
    /** handle state */
    const [dnSummaryData, setDnSummaryData] = useState([]);

    const [loadingDn, setLoadingDn] = useState(true);

    /** handle logic component */
    const handleClose = () => {
        setDnSummaryData([]);
        close(false);
    }

    const loadDnSummaryOptions = () => {
        setLoadingDn(true);
        opnService.optionsShipping({ cuscode: cuscode, ignoreLoading: true }).then((res) => {
            let { status, data } = res;
            if (status === 200) {
                setDnSummaryData(data.data || []);
            }
        })
        .catch(() => {
            message.error("Request error!");
        })
        .finally(() => setTimeout(() => { setLoadingDn(false) }, 400));
    };

    // เลือกใบส่งของแล้ว ดึงรายการสินค้าทั้งหมดเข้าใบวางบิลทันที (ไม่ต้องติ๊กเลือกรายสินค้า)
    const handleChosenDn = async (chosen) => {
        if (!chosen || chosen.length < 1) return;
        setLoadingDn(true);
        try {
            const payload = chosen.map((item) => ({ dncode: item.dncode }));
            const res = await dnService.getlist(payload, { ignoreLoading: true });
            const detail = (res?.data?.data?.detail || [])
                .map((item) => ({ ...item, _rowKey: getShippingRowKey(item) }))
                .sort((a, b) => (a.socode || "").localeCompare(b.socode || "", undefined, { numeric: true }));

            const merged = [...selected, ...detail].filter(
                (item, index, array) =>
                    array.findIndex((row) => getShippingRowKey(row) === getShippingRowKey(item)) === index
            );

            if (merged.length < 1) {
                message.warning("ไม่พบรายการสินค้าในใบส่งของ");
                return;
            }

            values(merged);
            close(false);
        } catch (error) {
            console.warn(error);
            message.error("โหลดรายการสินค้าใบส่งของไม่สำเร็จ");
        } finally {
            setLoadingDn(false);
        }
    };

    useEffect( () => {
        if( !!show ){
            loadDnSummaryOptions();
        }
    }, [selected,show]);

    /** */
    return (
        <>
        <DnSummaryModal
            show={show}
            dimmed={false}
            close={() => handleClose()}
            values={(chosen) => {
                handleChosenDn(chosen);
            }}
            selected={selected}
            dnData={dnSummaryData}
            loading={loadingDn}
        />
        </>
    )
}
