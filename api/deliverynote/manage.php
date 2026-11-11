<?php
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");
include_once(dirname(__FILE__, 2) . "/common/fnc-code.php");
require_once __DIR__ . "/source-line-map.php";

$db = new DbConnect;
$conn = $db->connect();
$conn->beginTransaction();
http_response_code(400);
try {
    $action_date = date("Y-m-d H:i:s");
    $action_user = $token->userid;
    // echo $action_user;

    // $doc_status = "รอออกใบส่งของ";
    $doc_status = "รอออกใบวางบิล";
    
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        lock_document_numbers($conn);
        $rest_json = file_get_contents("php://input");
        $_POST = json_decode($rest_json, true);
        extract($_POST, EXTR_OVERWRITE, "_");

        // var_dump($_POST);
        // $sql = "insert dnmaster (`dncode`, `dndate`, `cuscode`,`total_price`,`remark`,doc_status,created_by,updated_by) 
        // values (:dncode,:dndate,:cuscode,:total_price,:remark,'รอจัดเตรียมสินค้า',:action_user,:action_user)";

        // เลขที่ใบส่งของ = เลขที่ใบขายสินค้า เปลี่ยนหน้าเป็น DN (IV6911017 -> DN6911017) 1 SO : 1 DN
        $socodes = array_values(array_unique(array_filter(array_map(function ($d) {
            return ((object)$d)->socode ?? null;
        }, $detail))));

        if (count($socodes) !== 1) {
            throw new PDOException("ใบส่งของ 1 ใบ ต้องมาจากใบขายสินค้าเพียง 1 ใบเท่านั้น");
        }
        $socodeSrc = (string)$socodes[0];
        $dncode = 'DN' . (strncmp($socodeSrc, 'IV', 2) === 0 ? substr($socodeSrc, 2) : $socodeSrc);

        // Incoming row codes refer to sodetail while creating a delivery note.
        // Resolve legacy callers without row codes only when the match is provable.
        $sourceQuery = $conn->prepare('SELECT code,stcode,qty,price,unit FROM sodetail WHERE socode = :s ORDER BY code FOR UPDATE');
        $sourceQuery->execute(['s' => $socodeSrc]);
        $availableSources = [];
        foreach ($sourceQuery->fetchAll(PDO::FETCH_ASSOC) as $source) {
            $availableSources[(string)$source['code']] = $source;
        }
        $createSourceMap = [];
        foreach ($detail as $index => $value) {
            $line = (array)$value;
            $sourceCode = (string)($line['code'] ?? '');
            if ($sourceCode === '') {
                $candidates = array_values(array_filter($availableSources, function ($source) use ($line) {
                    return (string)$source['stcode'] === (string)$line['stcode'];
                }));
                $legacyRow = array_merge($line, ['code' => (string)$index]);
                $matched = dn_source_line_map([$legacyRow], $candidates);
                $sourceCode = (string)($matched[(string)$index] ?? '');
            }
            if (!isset($availableSources[$sourceCode])
                || (string)$availableSources[$sourceCode]['stcode'] !== (string)$line['stcode']) {
                throw new Exception('รายการสินค้าอ้างอิงซ้ำหรือเปลี่ยนแปลง กรุณาโหลดใบขายใหม่');
            }
            $createSourceMap[$index] = $sourceCode;
            unset($availableSources[$sourceCode]);
        }

        // กันออกใบส่งของซ้ำจากใบขายสินค้าเดิม (เช็คทั้งเลข DN ใหม่ และเลข IV แบบเดิมที่ยังไม่ได้แปลง)
        $stmtChk = $conn->prepare("SELECT doc_status FROM dnmaster where dncode IN (:dncode, :socode) AND COALESCE(doc_status, '') <> 'ยกเลิก' FOR UPDATE");
        $stmtChk->execute(['dncode' => $dncode, 'socode' => $socodeSrc]);
        if ($stmtChk->rowCount() > 0) {
            $chk = $stmtChk->fetch(PDO::FETCH_ASSOC);
            throw new PDOException("ใบขายสินค้า $socodeSrc ออกใบส่งของแล้ว (สถานะ: {$chk['doc_status']})");
        }

        $sql = "insert dnmaster (`dncode`, `dndate`, `cuscode`,`total_price`,`remark`,doc_status,created_by,updated_by)
        values (:dncode,:dndate,:cuscode,:total_price,:remark,'จัดเตรียมสินค้าแล้ว',:action_user,:action_user)";

        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $header = (object)$header;
        $stmt->bindParam(":dncode", $dncode, PDO::PARAM_STR);
        $stmt->bindParam(":dndate", $header->dndate, PDO::PARAM_STR);
        $stmt->bindParam(":cuscode", $header->cuscode, PDO::PARAM_STR);
        $stmt->bindParam(":total_price", $header->total_price, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_STR);

        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }
        
        // ไม่ต้อง update running number แล้ว เพราะใช้เลขที่ใบขายสินค้าโดยตรง
        $code = $conn->lastInsertId();

        $sql = "insert into dndetail (dncode,socode,stcode,qty,price,unit)
        values (:dncode,:socode,:stcode,:qty,:price,:unit)";
        $stmt2 = $conn->prepare($sql);
        if (!$stmt2) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        // $detail = $detail;  
        foreach ($detail as $ind => $val) {
            $val = (object)$val;
            $stmt2->bindParam(":dncode", $dncode, PDO::PARAM_STR);
            $stmt2->bindParam(":socode", $val->socode, PDO::PARAM_STR);
            $stmt2->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            $stmt2->bindParam(":qty", $val->qty, PDO::PARAM_STR);
            $stmt2->bindParam(":price", $val->price, PDO::PARAM_STR);
            $stmt2->bindParam(":unit", $val->unit, PDO::PARAM_STR);

            if (!$stmt2->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
            }            

            $sql = "update sodetail set delamount = IFNULL(delamount,0)+:qty where code = :source_code and socode = :socode and stcode = :stcode";

            $stmt3 = $conn->prepare($sql);
            if (!$stmt3) throw new PDOException("Insert data error => {$conn->errorInfo()}");

            $stmt3->bindParam(":qty", $val->qty, PDO::PARAM_STR);
            $stmt3->bindValue(":source_code", $createSourceMap[$ind], PDO::PARAM_STR);
            $stmt3->bindParam(":socode", $val->socode, PDO::PARAM_STR);
            $stmt3->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);

            if (!$stmt3->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }

            $strSQL = "SELECT count(code) as count FROM `sodetail` where socode = :socode and qty>IF(delamount IS NULL,0,delamount) ";
            $stmt5 = $conn->prepare($strSQL);
            if (!$stmt5) throw new PDOException("Insert data error => {$conn->errorInfo()}");

            $stmt5->bindParam(":socode", $val->socode, PDO::PARAM_STR);

            if (!$stmt5->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }

            $res = $stmt5->fetch(PDO::FETCH_ASSOC);
            extract($res, EXTR_OVERWRITE, "_");
            if ($count == 0) {

                $sql = "
                update somaster 
                set
                doc_status = '$doc_status',
                updated_date = CURRENT_TIMESTAMP(),
                updated_by = :action_user
                where socode = :socode";
            } else {
                $sql = "
                update somaster 
                set
                doc_status = 'รอจัดเตรียมสินค้า',
                updated_date = CURRENT_TIMESTAMP(),
                updated_by = :action_user
                where socode = :socode";
            }

            $stmt4 = $conn->prepare($sql);
            if (!$stmt4) throw new PDOException("Insert data error => {$conn->errorInfo()}");

            $stmt4->bindParam(":action_user", $action_user, PDO::PARAM_INT);
            $stmt4->bindParam(":socode", $val->socode, PDO::PARAM_STR);

            if (!$stmt4->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data" => array("code" => $code, "document_code" => $dncode)));
    } else  if ($_SERVER["REQUEST_METHOD"] == "PUT") {
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true);
        extract($_PUT, EXTR_OVERWRITE, "_");
        $header = (object)$header;
        $lockDn = $conn->prepare("SELECT cuscode, doc_status FROM dnmaster WHERE dncode = :d FOR UPDATE");
        $lockDn->execute(array('d' => $header->dncode));
        $lockedDn = $lockDn->fetch(PDO::FETCH_ASSOC);
        if (!$lockedDn) throw new Exception('ไม่พบใบส่งสินค้า');
        $blockedStatuses = array('ชำระเงินไม่ครบ','ชำระเงินครบแล้ว','ชำระเงินยังไม่ครบ','ชำระครบแล้ว','ยกเลิก');
        if (in_array($lockedDn['doc_status'], $blockedStatuses, true)) throw new Exception('สถานะเอกสารไม่อนุญาตให้แก้ไข');
        $linkedReceipts = array();
        $bills = $conn->prepare("SELECT b.blcode, b.cuscode FROM bl_master b
            WHERE b.active_status = 'Y' AND EXISTS (SELECT 1 FROM bl_detail d WHERE d.blcode = b.blcode AND d.dncode = :d)
            ORDER BY b.blcode FOR UPDATE");
        $bills->execute(array('d' => $header->dncode));
        $linkedBills = $bills->fetchAll(PDO::FETCH_ASSOC);
        foreach ($linkedBills as $bill) {
            $receipt = $conn->prepare("SELECT r.recode, r.doc_status FROM receipt_detail rd JOIN receipt r ON r.recode = rd.recode
                WHERE rd.blcode = :b ORDER BY r.recode FOR UPDATE");
            $receipt->execute(array('b' => $bill['blcode']));
            foreach ($receipt->fetchAll(PDO::FETCH_ASSOC) as $receiptRow) {
                if (in_array($receiptRow['doc_status'], $blockedStatuses, true)) {
                    throw new Exception('ไม่สามารถแก้ไขได้: ใบเสร็จชำระเงินไม่ครบ ชำระครบแล้ว หรือยกเลิก');
                }
                $linkedReceipts[$receiptRow['recode']] = true;
            }
            if ($bill['cuscode'] !== $header->cuscode) throw new Exception('กรุณานำใบส่งสินค้าออกจากใบวางบิลก่อนเปลี่ยนลูกค้า');
        }

        // var_dump($_POST);
        $sql = "
        update dnmaster 
        set
        cuscode = :cuscode,
        dndate = :dndate,
        remark = :remark,
        total_price = :total_price,
        updated_date = CURRENT_TIMESTAMP(),
        updated_by = :action_user
        where dncode = :dncode";

        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $header = (object)$header;

        $stmt->bindParam(":cuscode", $header->cuscode, PDO::PARAM_STR);
        $stmt->bindParam(":dndate", $header->dndate, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR);
        $stmt->bindParam(":total_price", $header->total_price, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
        $stmt->bindParam(":dncode", $header->dncode, PDO::PARAM_STR);

        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        $oldRows = $conn->prepare("SELECT code,socode,stcode,qty,price,unit FROM dndetail WHERE dncode = :d ORDER BY code FOR UPDATE");
        $oldRows->execute(array('d' => $header->dncode));
        $oldByCode = array();
        $groups = array();
        foreach ($oldRows->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $oldByCode[(string)$row['code']] = $row;
            $groups[$row['socode']][$row['stcode']][] = $row;
        }
        $submittedCodes = array();
        foreach ($detail as $value) {
            $line = (array)$value;
            $id = (string)($line['code'] ?? '');
            if (!isset($oldByCode[$id]) || isset($submittedCodes[$id])) {
                throw new Exception('รายการสินค้าเปลี่ยนแปลงหรืออ้างอิงซ้ำ กรุณาโหลดหน้าใหม่ก่อนบันทึก');
            }
            $old = $oldByCode[$id];
            if ((string)$line['socode'] !== (string)$old['socode'] || (string)$line['stcode'] !== (string)$old['stcode']) {
                throw new Exception('รายการสินค้าไม่ตรงกับใบส่งสินค้าเดิม กรุณาโหลดหน้าใหม่');
            }
            $submittedCodes[$id] = true;
        }
        $sourceMap = array();
        ksort($groups);
        foreach ($groups as $sourceSo => $products) {
            $lockSo = $conn->prepare("SELECT socode FROM somaster WHERE socode = :s FOR UPDATE");
            $lockSo->execute(array('s' => $sourceSo));
            foreach ($products as $product => $rows) {
                $sourceQuery = $conn->prepare("SELECT code,qty,price,unit FROM sodetail WHERE socode = :s AND stcode = :c ORDER BY code FOR UPDATE");
                $sourceQuery->execute(array('s' => $sourceSo, 'c' => $product));
                $sources = $sourceQuery->fetchAll(PDO::FETCH_ASSOC);
                $sourceMap += dn_source_line_map($rows, $sources);
            }
        }

        $updateLine = $conn->prepare("UPDATE dndetail SET qty = :q, price = :p, unit = :u WHERE code = :id AND dncode = :d");
        foreach ($detail as $value) {
            $line = (array)$value;
            $updateLine->execute(array('q' => $line['qty'], 'p' => $line['price'], 'u' => $line['unit'],
                'id' => $line['code'], 'd' => $header->dncode));
        }
        foreach ($oldByCode as $id => $old) {
            if (!isset($submittedCodes[$id])) {
                $conn->prepare("DELETE FROM dndetail WHERE code = :id AND dncode = :d")
                    ->execute(array('id' => $id, 'd' => $header->dncode));
            }
        }

        // Each submitted line targets one source line, never a product-wide UPDATE.
        $changedOrders = array();
        $usedSourceCodes = array();
        foreach ($detail as $value) {
            $line = (array)$value;
            $sourceCode = $sourceMap[(string)($line['code'] ?? '')] ?? null;
            if ($sourceCode === null) {
                throw new Exception('ไม่พบรายการสินค้าในใบขายต้นทาง กรุณาตรวจสอบก่อนบันทึก');
            }
            if (isset($usedSourceCodes[$sourceCode])) throw new Exception('รายการสินค้าอ้างอิงซ้ำ กรุณาโหลดหน้าใหม่');
            $usedSourceCodes[$sourceCode] = true;
            $original = $oldByCode[(string)$line['code']];
            if ($line['socode'] !== $original['socode'] || $line['stcode'] !== $original['stcode']) {
                throw new Exception('รายการสินค้าเปลี่ยนแปลง กรุณาโหลดหน้าใหม่');
            }
            $conn->prepare("UPDATE sodetail SET qty = :qty, price = :price, unit = :unit, delamount = :delqty
                WHERE code = :id AND socode = :s AND stcode = :c")
                ->execute(array('qty' => $line['qty'], 'price' => $line['price'], 'unit' => $line['unit'],
                    'delqty' => $line['qty'], 'id' => $sourceCode, 's' => $line['socode'], 'c' => $line['stcode']));
            $changedOrders[$line['socode']] = true;
        }
        foreach (array_keys($changedOrders) as $socode) {
            $conn->prepare("UPDATE somaster SET total_price =
                (SELECT COALESCE(SUM(qty * price * (1 + COALESCE(vat,0) / 100)),0) FROM sodetail WHERE socode = :s),
                updated_date = CURRENT_TIMESTAMP(), updated_by = :u WHERE socode = :code")
                ->execute(array('s' => $socode, 'u' => $action_user, 'code' => $socode));
        }

        foreach ($linkedBills as $bill) {
            $conn->prepare("DELETE FROM bl_detail WHERE blcode = :b AND dncode = :d")
                ->execute(array('b' => $bill['blcode'], 'd' => $header->dncode));
            $conn->prepare("INSERT INTO bl_detail (blcode,socode,dncode,stcode,qty,price,unit)
                SELECT :b,socode,dncode,stcode,qty,price,unit FROM dndetail WHERE dncode = :d")
                ->execute(array('b' => $bill['blcode'], 'd' => $header->dncode));
            $conn->prepare("UPDATE bl_master SET total_price = (SELECT COALESCE(SUM(qty * price),0) FROM bl_detail WHERE blcode = :b),
                updated_date = CURRENT_TIMESTAMP(), updated_by = :u WHERE blcode = :code")
                ->execute(array('b' => $bill['blcode'], 'u' => $action_user, 'code' => $bill['blcode']));
        }
        // Keep unpaid receipts consistent with the updated billing totals.
        foreach (array_keys($linkedReceipts) as $recode) {
            $conn->prepare("UPDATE receipt_detail rd JOIN bl_master b ON b.blcode = rd.blcode
                SET rd.total_price = b.total_price, rd.grand_total_price = b.total_price - COALESCE(rd.discount,0)
                WHERE rd.recode = :r")
                ->execute(array('r' => $recode));
            $conn->prepare("UPDATE receipt SET total_price = (SELECT COALESCE(SUM(total_price),0) FROM receipt_detail WHERE recode = :r),
                grand_total_price = (SELECT COALESCE(SUM(total_price),0) FROM receipt_detail WHERE recode = :r2) - COALESCE(total_discount,0),
                updated_date = CURRENT_TIMESTAMP(), updated_by = :u WHERE recode = :code")
                ->execute(array('r' => $recode, 'r2' => $recode, 'u' => $action_user, 'code' => $recode));
        }
        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data" => array("code" => $code)));
    } else  if ($_SERVER["REQUEST_METHOD"] == "DELETE") {
        // $code = $_DELETE["code"];
        $code = $_GET["code"];

        $strSQL = "SELECT socode FROM dndetail where dncode = :code ";
        $stmt5 = $conn->prepare($strSQL);
        if (!$stmt5) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $stmt5->bindParam(":code", $code, PDO::PARAM_STR);

            if (!$stmt5->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
                die;
            }            

            $res = $stmt5->fetchAll(PDO::FETCH_ASSOC);

            foreach ($res as $row) {

                // $sql = "update somaster set doc_status = 'รอออกใบส่งของ' where socode = :code";
                $sql = "update somaster set doc_status = '$doc_status' where socode = :code";
                $stmt2 = $conn->prepare($sql);
                if (!$stmt2->execute(['code' => $row['socode']])) {
                    $error = $conn->errorInfo();
                    throw new PDOException("Remove data error => $error");
                }

                $sql = "update sodetail set delamount = 0 where socode = :code";
                $stmt2 = $conn->prepare($sql);
                if (!$stmt2->execute(['code' => $row['socode']])) {
                    $error = $conn->errorInfo();
                    throw new PDOException("Remove data error => $error");
                }

            }
       
        
        $sql = "update dnmaster set doc_status = 'ยกเลิก' where dncode = :code";
        $stmt = $conn->prepare($sql); 
        if (!$stmt->execute([ 'code' => $code ])){
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }       

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("status"=> 1));
    } else  if ($_SERVER["REQUEST_METHOD"] == "GET") {
        $code = $_GET["code"];
        $sql = "SELECT * ,a.remark,co.county_name,a.doc_status, a.issue_status,a.created_date, a.updated_date,
        concat(IFNULL(u.firstname, ''), ' ', IFNULL(u.lastname, '')) as created_by,concat(IFNULL(u2.firstname, ''), ' ', IFNULL(u2.lastname, '')) as updated_by ";
        $sql .= " FROM `dnmaster` as a ";
        $sql .= " left outer join `customer` as c on (a.cuscode)=(c.cuscode)";
        $sql .= " left outer join `county` as co on (c.county_code)=(co.county_code) ";
        $sql .= " left join user u on a.created_by = u.code";
        $sql .= " left join user u2 on a.updated_by = u2.code";
        $sql .= " where a.dncode = :code";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $header = $stmt->fetch(PDO::FETCH_ASSOC);

        $sql = "SELECT a.code,a.dncode,a.stcode,a.socode, a.price, a.unit, a.qty ,i.stname,a.del_qty";
        $sql .= " FROM `dndetail` as a";
        $sql .= " inner join `items` as i on (a.stcode=i.stcode)  ";
        $sql .= " where a.dncode = :code";
        $sql .= " order by i.seq";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $detail = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array('status' => 1, "header" => $header, "detail" => $detail));
    }
} catch (PDOException $e) {
    $conn->rollback();
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(400);
    echo json_encode(array('status' => '0', 'message' => $e->getMessage()));
} finally {
    $conn = null;
}
ob_end_flush();
exit;
