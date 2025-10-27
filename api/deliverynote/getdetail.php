<?php
ob_start();
include_once(dirname(__FILE__, 2) . "/onload.php");
include_once(dirname(__FILE__, 2) . "/common/fnc-code.php");

$db = new DbConnect;
$conn = $db->connect();
$conn->beginTransaction();
http_response_code(400);
try {
    $action_date = date("Y-m-d H:i:s");
    $action_user = $token->userid;
    // echo $action_user;

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $rest_json = file_get_contents("php://input");
        $_POST = json_decode($rest_json, true);
        extract($_POST, EXTR_OVERWRITE, "_");
        // $detail = (object)$detail;
        $tmp_array=array();
        foreach ($detail as $ind => $val) {
            $val = (object)$val;
            array_push($tmp_array,"'".$val->socode."'");
        }

        $sql = "SELECT a.*,i.stname ";
        $sql .= " FROM `sodetail` as a";
        $sql .= " left outer join `items` i on (a.stcode=i.stcode)  ";
        $sql .= " where a.socode IN (". implode(',',$tmp_array) . ") ";

        $stmt = $conn->prepare($sql);
        if (!$stmt->execute()) {
            $error = $conn->errorInfo();
            http_response_code(404);
            throw new PDOException("Geting data error => $error");
        }
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $conn->commit();
        http_response_code(200);
        echo json_encode(array('status' => 1, "header" => $header, "data" => $data));

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
