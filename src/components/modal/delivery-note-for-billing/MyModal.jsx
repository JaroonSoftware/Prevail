/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import { message } from "antd";

import OptionService from "../../../service/Options.service"
import DnSummaryModal from "./DnSummaryModal";
import ShippingModal from "./ShippingModal";

const opnService = OptionService();
export default function ModalDeliverynoteBilling({show, close, cuscode, values, selected}) {
    /** handle state */
    const [dnSummaryData, setDnSummaryData] = useState([]);
    const [chosenDnData, setChosenDnData] = useState([]);

    const [loadingDn, setLoadingDn] = useState(true);
    const [openShippingModal, setOpenShippingModal] = useState(false);

    /** handle logic component */
    const handleClose = () => {
        setDnSummaryData([]);
        setChosenDnData([]);
        setOpenShippingModal(false);
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

    useEffect( () => {
        if( !!show ){
            setChosenDnData([]);
            setOpenShippingModal(false);
            loadDnSummaryOptions();
        }
    }, [selected,show]);

    /** */
    return (
        <>
        <DnSummaryModal
            show={show}
            dimmed={openShippingModal}
            close={() => handleClose()}
            values={(chosen) => {
                setChosenDnData(chosen);
                setOpenShippingModal(true);
            }}
            selected={selected}
            dnData={dnSummaryData}
            loading={loadingDn}
        />
        <ShippingModal
            show={show && openShippingModal}
            close={(state) => {
                if (state === false) {
                    setOpenShippingModal(false);
                }
            }}
            values={(v) => {
                values(v);
                close(false);
            }}
            selected={selected}
            shippingData={chosenDnData}
            loading={false}
        />
        </>
    )
}
