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

    if ($_SERVER["REQUEST_METHOD"] == "PUT") {
        $rest_json = file_get_contents("php://input");
        $_PUT = json_decode($rest_json, true);
        extract($_PUT, EXTR_OVERWRITE, "_");
        // var_dump($_POST);

        $data = array();

        foreach ($detail as $ind => $val) {
            $val = (object)$val;
            // echo $val->stcode . '<br>';

            // if ($val->stcode == "0503") {
                $sql = "
            update items 
            set
            seq = :seq
            where stcode = :stcode";

                $stmt = $conn->prepare($sql);
                if (!$stmt) throw new PDOException("Insert data error => {$conn->errorInfo()}");


                $stmt->bindParam(":stcode", $val->stcode, PDO::PARAM_STR);
                $stmt->bindParam(":seq", $val->seq, PDO::PARAM_STR);
                // $stmt->bindParam(":action_date", date("Y-m-d H:i:s"), PDO::PARAM_STR);

                if (!$stmt->execute()) {
                    $error = $conn->errorInfo();
                    throw new PDOException("Insert data error => $error");
                    die;
                }

                array_push($data, array("stcode" => $val->stcode, "seq" => $val->seq));
            // }
        }


        $conn->commit();
        http_response_code(200);
        echo json_encode(array("id" => $data));
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
