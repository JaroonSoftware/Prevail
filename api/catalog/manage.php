<?php

require_once dirname(__DIR__) . "/common/packing.php";
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");
include_once(dirname(__FILE__, 2) . "/common/fnc-code.php");

/* รายการที่ยังไม่มีสินค้าในระบบ (ตาราง catalog_pending) — บันทึกแบบลบแล้วใส่ใหม่ทั้งชุด
   ถ้ายังไม่ได้รัน SQL 2026-11-03_catalog_pending.sql ข้ามไปเงียบๆ */
function catalog_has_pending(PDO $conn): bool
{
    return (bool)$conn->query("SHOW TABLES LIKE 'catalog_pending'")->fetch();
}
function save_catalog_pending(PDO $conn, string $code, $pending): void
{
    if (!is_array($pending) || !catalog_has_pending($conn)) return;
    $conn->prepare("DELETE FROM catalog_pending WHERE catalog_code = :c")->execute(array('c' => $code));
    $st = $conn->prepare("INSERT INTO catalog_pending (catalog_code, raw_name, name_en, unit, price, group_name, cust_code, source_file)
                          VALUES (:c, :n, :e, :u, :p, :g, :cc, :f)");
    foreach ($pending as $p) {
        $name = trim((string)($p['raw_name'] ?? ''));
        if ($name === '') continue;
        $price = isset($p['price']) && is_numeric($p['price']) ? $p['price'] : null;
        $st->execute(array(
            'c' => $code, 'n' => mb_substr($name, 0, 255), 'e' => isset($p['name_en']) ? mb_substr((string)$p['name_en'], 0, 255) : null,
            'u' => isset($p['unit']) ? mb_substr((string)$p['unit'], 0, 30) : null, 'p' => $price,
            'g' => isset($p['group_name']) ? mb_substr((string)$p['group_name'], 0, 150) : null,
            'cc' => isset($p['cust_code']) ? mb_substr((string)$p['cust_code'], 0, 50) : null,
            'f' => isset($p['source_file']) ? mb_substr((string)$p['source_file'], 0, 255) : null,
        ));
    }
}

$db = new DbConnect;
$conn = $db->connect();
$conn->beginTransaction();
http_response_code(400);
try {
    $action_datetime = date("Y-m-d H:i:s");
    $action_user = $token->userid;

    if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT'], true)) {
        $payload = json_decode(file_get_contents('php://input'), true);
        $inputHeader = $payload['header'] ?? [];
        if (trim($inputHeader['catalog_name'] ?? '') === '') throw new Exception('กรุณากรอกชื่อแคตตาล็อก');
        foreach (['start_date', 'stop_date'] as $field) {
            $value = $inputHeader[$field] ?? '';
            $date = DateTime::createFromFormat('!Y-m-d', $value);
            if (!$date || $date->format('Y-m-d') !== $value) throw new Exception('กรุณาระบุวันที่ใช้งานให้ครบถ้วนและถูกต้อง');
        }
        if ($inputHeader['start_date'] > $inputHeader['stop_date']) throw new Exception('วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น');
        $customers = $payload['customer'] ?? [];
        if (!is_array($customers) || !$customers) throw new Exception('กรุณาเลือกลูกค้าอย่างน้อย 1 ราย');
        $lookup = $conn->prepare('SELECT cuscode FROM customer WHERE cuscode = :code');
        $duplicates = [];
        $exclude = $_SERVER['REQUEST_METHOD'] === 'PUT' ? ($inputHeader['catalog_code'] ?? '') : '';
        $check = $conn->prepare("SELECT DISTINCT c.cuscode,c.cusname,m.catalog_code,m.catalog_name FROM catalog_link l
            JOIN catalog_master m ON m.catalog_code=l.catalog_code JOIN customer c ON c.cuscode=l.cuscode
            WHERE l.cuscode=:customer AND m.active_status='Y' AND m.catalog_code<>:exclude ORDER BY m.catalog_code");
        foreach ($customers as $customerRow) {
            $customerCode = $customerRow['cuscode'] ?? '';
            $lookup->execute(['code' => $customerCode]);
            if (!$lookup->fetchColumn()) throw new Exception('ข้อมูลลูกค้าไม่ถูกต้อง กรุณาเลือกลูกค้าใหม่');
            $check->execute(['customer' => $customerCode, 'exclude' => $exclude]);
            $duplicates = array_merge($duplicates, $check->fetchAll(PDO::FETCH_ASSOC));
        }
        if ($duplicates && ($payload['confirm_duplicate_customers'] ?? false) !== true) {
            $conn->rollBack();
            http_response_code(409);
            echo json_encode(['code' => 'DUPLICATE_CATALOG_CUSTOMERS', 'duplicates' => $duplicates]);
            exit;
        }
    }

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        lock_document_numbers($conn);
        $rest_json = file_get_contents("php://input");
        $_POST = json_decode($rest_json, true);
        extract($_POST, EXTR_OVERWRITE, "_");

        $source = trim($_POST['duplicate_source'] ?? '');
        $catalog_code = $source !== ''
            ? catalog_duplicate_number($conn, $source, true)
            : catalog_document_number($conn, true);


        // var_dump($_POST);

        $sql = " insert catalog_master (catalog_code,catalog_name,start_date,stop_date,remark, active_status,created_date,created_by) 
        values (:catalog_code,:catalog_name,:start_date,:stop_date,:remark,'N',:action_datetime,:action_user)";

        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $header = (object)$header;
        $stmt->bindParam(":catalog_code", $catalog_code, PDO::PARAM_STR);
        $stmt->bindParam(":catalog_name", $header->catalog_name, PDO::PARAM_STR);
        $stmt->bindParam(":start_date", $header->start_date, PDO::PARAM_STR);
        $stmt->bindParam(":stop_date", $header->stop_date, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR);
        $stmt->bindParam(":action_datetime", $action_datetime, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_STR);

        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }


        $sql = "insert into catalog_link (catalog_code,cuscode,updated_date,created_by,updated_by)
        values (:catalog_code,:cuscode,:updated_date,:created_by,:updated_by)";
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        foreach ($customer as $ind => $val) {
            $val = (object)$val;

            $stmt->bindParam(":catalog_code", $catalog_code, PDO::PARAM_STR);
            $stmt->bindParam(":cuscode", $val->cuscode, PDO::PARAM_STR);
            $stmt->bindParam(":updated_date", $val->updated_date, PDO::PARAM_STR);
            $stmt->bindParam(":created_by", $val->created_by, PDO::PARAM_STR);
            $stmt->bindParam(":updated_by", $val->updated_by, PDO::PARAM_STR);
          
            if (!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
            }
        }

        $sql = "insert into catalog_detail (catalog_code,stcode,price)  
        values (:catalog_code,:stcode,:price) ";
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        // $detail = $detail;  
        foreach ($detail as $ind => $val) {
            $val = (object)$val;

            $stmt->bindParam(":catalog_code", $catalog_code, PDO::PARAM_STR);
            $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            $stmt->bindParam(":price", $val->price, PDO::PARAM_STR);

            if (!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
            }
        }
        packing_save_catalog($conn, $catalog_code, $detail, $customer);
        save_catalog_pending($conn, $catalog_code, $pending ?? null);

        {
            $conn->commit();
            http_response_code(200);
            echo json_encode(array("data" => array("id" => "ok", "catalog_code" => $catalog_code, 'message' => 'เพิ่ม Catalog สำเร็จ')));
        }
    } else if ($_SERVER["REQUEST_METHOD"] == "DELETE") {
        $code = trim($_GET['code'] ?? '');
        if ($code === '') throw new Exception('กรุณาระบุแคตตาล็อกที่ต้องการลบ');
        $lock = $conn->prepare('SELECT catalog_code FROM catalog_master WHERE catalog_code = :code FOR UPDATE');
        $lock->execute(['code' => $code]);
        $tables = [];
        if (catalog_has_pending($conn)) $tables[] = 'catalog_pending';
        if ($conn->query("SHOW TABLES LIKE 'catalog_customer_packing'")->fetch()) $tables[] = 'catalog_customer_packing';
        $tables = array_merge($tables, ['catalog_link', 'catalog_detail', 'catalog_master']);
        foreach ($tables as $table) {
            $stmt = $conn->prepare("DELETE FROM `$table` WHERE catalog_code = :code");
            $stmt->execute(['code' => $code]);
        }
        $conn->commit();
        http_response_code(200);
        echo json_encode(['status' => 1]);
    } else  if ($_SERVER["REQUEST_METHOD"] == "PUT") {
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true);
        extract($_PUT, EXTR_OVERWRITE, "_");
        $lock = $conn->prepare('SELECT catalog_code FROM catalog_master WHERE catalog_code = :code FOR UPDATE');
        $lock->execute(['code' => $header['catalog_code'] ?? '']);
        if (!$lock->fetchColumn()) throw new Exception('ไม่พบแคตตาล็อก หรือแคตตาล็อกถูกลบแล้ว');
        // var_dump($_POST);
        $sql2 = "
        update catalog_link 
        set
        cuscode = :cuscode,
        cusname = :cusname,
        created_date = CURRENT_TIMESTAMP(),
        updated_date = CURRENT_TIMESTAMP(),
        where catalog_code = :catalog_code";
        
        $stmt = $conn->prepare($sql2);
        $sql = "
        update catalog_master 
        set
        catalog_name = :catalog_name,
        start_date = :start_date,
        stop_date = :stop_date,
        active_status = :active_status,
        remark = :remark,
        created_date = CURRENT_TIMESTAMP(),
        updated_date = CURRENT_TIMESTAMP(),
        updated_by = :action_user
        where catalog_code = :catalog_code";
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        $header = (object)$header;

        $stmt->bindParam(":catalog_name", $header->catalog_name, PDO::PARAM_STR);
        $stmt->bindParam(":start_date", $header->start_date, PDO::PARAM_STR);
        $stmt->bindParam(":stop_date", $header->stop_date, PDO::PARAM_STR);
        $stmt->bindParam(":active_status", $header->active_status, PDO::PARAM_STR);
        $stmt->bindParam(":remark", $header->remark, PDO::PARAM_STR);
        $stmt->bindParam(":action_user", $action_user, PDO::PARAM_INT);
        $stmt->bindParam(":catalog_code", $header->catalog_code, PDO::PARAM_STR);

        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            throw new PDOException("Insert data error => $error");
            die;
        }

        // var_dump($master); exit;
       
        $sql = "delete from catalog_link where catalog_code = :catalog_code";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['catalog_code' => $header->catalog_code])) {
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }
        $sql = "insert into catalog_link (catalog_code,cuscode,updated_date,created_by,updated_by)
        values (:catalog_code,:cuscode,:updated_date,:created_by,:updated_by)";
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        foreach ($customer as $ind => $val) {
            $val = (object)$val;

           
            $stmt->bindParam(":catalog_code", $header->catalog_code, PDO::PARAM_STR);
            $stmt->bindParam(":cuscode", $val->cuscode, PDO::PARAM_STR);
            $stmt->bindParam(":updated_date", $val->updated_date, PDO::PARAM_STR);
            $stmt->bindParam(":created_by", $val->created_by, PDO::PARAM_STR);
            $stmt->bindParam(":updated_by", $val->updated_by, PDO::PARAM_STR);
          
        
            if (!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
            }
        }
        $sql = "delete from catalog_detail where catalog_code = :catalog_code";
        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['catalog_code' => $header->catalog_code])) {
            $error = $conn->errorInfo();
            throw new PDOException("Remove data error => $error");
        }
        $sql = "insert into catalog_detail (catalog_code,stcode,price)
        values (:catalog_code,:stcode,:price)";
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");

        // $detail = $detail;  
        foreach ($detail as $ind => $val) {
            $val = (object)$val;
            $stmt->bindParam(":catalog_code", $header->catalog_code, PDO::PARAM_STR);
            $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
            $stmt->bindParam(":price", $val->price, PDO::PARAM_STR);
            if (!$stmt->execute()) {
                $error = $conn->errorInfo();
                throw new PDOException("Insert data error => $error");
            }
        }

        packing_save_catalog($conn, (string)$header->catalog_code, $detail, $customer);
        save_catalog_pending($conn, (string)$header->catalog_code, $pending ?? null);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array("data" => array("code" => $code)));
    } else  if ($_SERVER["REQUEST_METHOD"] == "GET") {
        $code = $_GET["code"];

        $sql = "SELECT a.catalog_code,a.catalog_name,a.start_date,a.stop_date,a.remark,a.active_status ";
        $sql .= " FROM `catalog_master` as a ";
        $sql .= " where a.catalog_code = :code";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $header = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$header) throw new Exception('ไม่พบแคตตาล็อก หรือแคตตาล็อกถูกลบแล้ว');

        /* หมวดแคตตาล็อกของสินค้า (ใช้แบ่งแท็บในหน้ากรอก) — ถ้ายังไม่มีคอลัมน์ ให้เป็น NULL */
        $hasGroup = (bool)$conn->query("SHOW COLUMNS FROM items LIKE 'catalog_group_id'")->fetch();
        $sql = "SELECT a.catalog_code,a.stcode,i.stname,i.unit,i.packing_weight,a.price," . ($hasGroup ? "i.catalog_group_id" : "NULL AS catalog_group_id") . " ";
        $sql .= " FROM `catalog_detail` as a inner join `items` as i on (a.stcode=i.stcode)  ";
        $sql .= " where a.catalog_code = :code";
        $sql .= " order by i.seq";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $detail = packing_load_catalog($conn, $code, $stmt->fetchAll(PDO::FETCH_ASSOC));

        $sql = "SELECT a.catalog_code,a.cuscode,a.updated_date,a.created_by,a.updated_by,i.cusname,i.prename ";
        $sql .= " FROM `catalog_link` as a inner join `customer` as i on (a.cuscode=i.cuscode)  ";
        $sql .= " where a.catalog_code = :code";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute(['code' => $code])) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $customer = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $pending = array();
        if (catalog_has_pending($conn)) {
            $st = $conn->prepare("SELECT pending_id, raw_name, name_en, unit, price, group_name, cust_code, source_file
                                  FROM catalog_pending WHERE catalog_code = :code ORDER BY pending_id");
            $st->execute(array('code' => $code));
            $pending = $st->fetchAll(PDO::FETCH_ASSOC);
        }

        $conn->commit();
        http_response_code(200);
        echo json_encode(array('status' => 1, 'data' => array("header" => $header, "detail" => $detail, "customer" => $customer, "pending" => $pending)));
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
