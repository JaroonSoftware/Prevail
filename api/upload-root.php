<?php
/* ============================================================================
   ตำแหน่งโฟลเดอร์ uploads (ไฟล์ที่ผู้ใช้อัปโหลด : รูปสินค้า, รูป Ink, ไฟล์แนบ COA/PO, สแกน AI)

   บนเซิร์ฟเวอร์ : แอปอยู่ใน public_html/deploy/  ส่วน uploads อยู่ public_html/uploads/
                  (อยู่นอก deploy เพื่อ deploy ใหม่ = ลบ deploy/ ทั้งโฟลเดอร์ได้ ไม่โดนไฟล์ผู้ใช้)
   ในเครื่อง dev  : uploads อยู่ใน NSF/uploads/ เหมือนเดิม

   UPLOAD_ROOT         path เต็มของโฟลเดอร์ uploads (ไม่มี / ท้าย)
   UPLOAD_PARENT       โฟลเดอร์ที่มี uploads อยู่ข้างใน (ใช้ต่อกับ path สัมพัทธ์ "uploads/...")
   upload_resolve($p)  แปลง path ที่เคยเก็บไว้ใน DB (path เต็มของเครื่อง/ตำแหน่งเก่า)
                       ให้ชี้ไปที่ไฟล์จริงใน UPLOAD_ROOT ปัจจุบัน
   ============================================================================ */
if (!defined('UPLOAD_ROOT')) {
    $__app = dirname(__FILE__, 2);                 // root ของแอป : NSF/ หรือ public_html/deploy/
    $__outside = dirname($__app) . '/uploads';
    define('UPLOAD_ROOT', (basename($__app) === 'deploy' && is_dir($__outside)) ? $__outside : $__app . '/uploads');
    unset($__app, $__outside);
}
if (!defined('UPLOAD_PARENT')) define('UPLOAD_PARENT', dirname(UPLOAD_ROOT));

if (!function_exists('upload_resolve')) {
    function upload_resolve($stored)
    {
        $stored = (string)$stored;
        if ($stored === '') return $stored;
        if (file_exists($stored)) return $stored;
        $norm = str_replace('\\', '/', $stored);
        $pos = strrpos($norm, '/uploads/');
        if ($pos === false) {
            /* path สัมพัทธ์ เช่น uploads/ai-docscan/... */
            if (strpos($norm, 'uploads/') === 0) return UPLOAD_ROOT . '/' . substr($norm, 8);
            return $stored;
        }
        return UPLOAD_ROOT . '/' . substr($norm, $pos + 9);
    }
}
