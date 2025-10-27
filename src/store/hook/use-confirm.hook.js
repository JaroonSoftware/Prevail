import { ExclamationCircleFilled, WarningFilled } from '@ant-design/icons';
import { Modal } from 'antd';

const useConfirm = () => {

  const createConfirm = (defaultConfig, options) => {
    return new Promise((resolve, reject) => {
      try {
        const config = { ...defaultConfig, ...options };

        // ** The Magic Logic **
        // If getContainer is provided, it means we are inside a Drawer/Modal.
        // So, we add the special class to override the `position: fixed` style.
        if (options.getContainer) {
          config.wrapClassName = `confirm-in-container ${options.wrapClassName || ''}`.trim();
        }

        Modal.confirm({
          ...config,
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      } catch (err) {
        console.warn(err);
        reject(err);
      }
    });
  };

  const createAlert = (type, content, options) => {
    return new Promise((resolve, reject) => {
      try {
        const config = { content, ...options };
        if (options.getContainer) {
          config.wrapClassName = `confirm-in-container ${options.wrapClassName || ''}`.trim();
        }

        Modal[type]({
          ...config,
          onOk: () => resolve(true),
        });
      } catch (err) {
        console.warn(err);
        reject(err);
      }
    });
  };

  const confirm = (options = {}) => createConfirm({ 
    title: 'ยืนยันการทำรายการ',
    content: 'คุณต้องการทำรายการหรือไม่',
    icon: <ExclamationCircleFilled className='!text-blue-600 me-1' style={{fontSize: '1.4rem'}} />,
    okText: 'ยืนยัน',
    okType: 'primary',
    cancelText: 'ไม่',
  }, options);

  const saved = (options = {}) => createConfirm({ 
    title:'ยืนยันการบันทึกข้อมูล',
    content:'คุณต้องการบันทึกรายการหรือไม่',
    icon: <ExclamationCircleFilled className='!text-green-600 me-1' style={{fontSize: '1.4rem'}} />,
    okText: 'ยืนยัน',
    okType: 'primary',
    cancelText: 'ไม่',
  }, options);

  const deleted = (options = {}) => createConfirm({ 
    title:'ยืนยันการลบข้อมูลข้อมูล',
    content:'คุณต้องการลบรายการหรือไม่',
    icon: <ExclamationCircleFilled className='text-red-500 me-1' style={{fontSize: '1.4rem'}} />,
    okText: 'ยืนยัน',
    okType: 'danger',
    cancelText: 'ไม่',
  }, options);

  const warninged = (options = {}) => createConfirm({ 
    title:'ยืนยันการทำรายการ',
    content:'คุณต้องการทำรายการต่อหรือไม่',
    icon: <WarningFilled className='text-orange-500 me-1' style={{fontSize: '1.4rem'}} />,
    okText: 'ยืนยัน',
    okType: undefined,
    cancelText: 'ไม่',
    okButtonProps: { className:'!bg-orange-500' },
  }, options);

  const success = (content = null, options = {}) => createAlert('success', content || 'การทำงานสำเร็จ!', { title:'ทำรายการเสร็จสิ้น', ...options });

  const error = (content = null, options = {}) => createAlert('error', content || 'การทำรายการไม่สำเร็จ', { title:'เกิดข้อผิดพลาด!', ...options });

  const warn = (content = null, options = {}) => createAlert('warning', content || 'โปรดตรวจสอบการทำรายการ', { title:'แจ้งเตือน!', ...options });

  return {
    confirm,
    saved,
    deleted,
    warninged,
    success,
    error,
    warn,
  }
};

export default useConfirm;