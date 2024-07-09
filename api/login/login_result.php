<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
// header('Content-Type: application/json');
// header('Access-Control-Allow-Origin: *');
// header('Access-Control-Allow-Headers: *'); 
date_default_timezone_set('Asia/Bangkok');
session_start();
// include('../../conn.php');
include('../conn.php');
include('../src/JWT.php');

use Firebase\JWT\JWT; 
// $db = new DbConnect;
// $conn = $db->connect();

$rest_json = file_get_contents("php://input");
$_POST = json_decode($rest_json, true);

if (!isset($_POST['username'], $_POST['password'])) {
	exit($_POST['username']);
}

// $sql = 'SELECT firstname, lastname, user_id, password, LOWER(`type`) `type` ,active_status FROM user WHERE username = :username';
$sql = 'SELECT username,password,role FROM `login` WHERE username = :username' ;
$stmt = $conn->prepare($sql);
$stmt->bindParam(':username', $_POST["username"]);
// $stmt->execute(); 
if ($stmt->execute()) {
	if ($stmt->rowCount() > 0) {
		$res = $stmt->fetch(PDO::FETCH_ASSOC);
		extract($res, EXTR_OVERWRITE, "_");

		// Account exists, now we verify the password.
		// Note: remember to use password_hash in your registration file to store the hashed passwords.
		if (password_verify($_POST['password'], $password)) {

			if($role=='user')
			$sql2 = "SELECT user_code,firstname, lastname, LOWER(`type`) `type` ,'user' as rule,active_status FROM user WHERE login_code = (SELECT login_code FROM `login` WHERE username = :username)";
			else
			$sql2 = "SELECT cuscode as user_code,cusname as firstname, '' as lastname, '' as `type`,'customer' as rule ,active_status FROM customer WHERE login_code = (SELECT login_code FROM `login` WHERE username = :username)";

			$stmt2 = $conn->prepare($sql2);
			$stmt2->bindParam(':username', $_POST["username"]);
			$stmt2->execute();
			$res2 = $stmt2->fetch(PDO::FETCH_ASSOC);
			extract($res2, EXTR_OVERWRITE, "_");

			if ($active_status == 'Y') {
				// session_regenerate_id();
				$sKey = base64_encode(vsprintf('C%s%s-%s', str_split(bin2hex(random_bytes(16)), 4)));
				$_SESSION['loggedin'] = TRUE;
				$_SESSION['name'] = $_POST['username'];
				$_SESSION['id'] = $user_code;
				$_SESSION['firstname'] = $firstname;
				$_SESSION['lastname'] = $lastname;
				$_SESSION['type'] = $type;
				$_SESSION['rule'] = $rule;				
				$_SESSION['skey'] = "{$sKey}Jaroon";
				$secretKey = "Q2ZjYZSyYmNiLTQwMjM=Jaroon"; // ?? 'bGS6lzFqvvSQ8ALbOxatm7/Vk7mLQyzqaS34Q4oR1ew=';   
				$issuedAt = new DateTimeImmutable(); 
				
				$expire = $issuedAt->modify('+1 day');      // Add 60 seconds
				$serverName = "tidmun";
				$username = $_POST['username'];
				$userid = $user_code;
				$data = [
					'iat'  => $issuedAt->getTimestamp(),         // Issued at: time when the token was generated
					'iss'  => $serverName,                       // Issuer
					'nbf'  => $issuedAt->getTimestamp(),         // Not before
					'exp'  => $expire->getTimestamp(), 			 // Expire
					'username' => $username,                     // User name
					'userid' => $user_code,                      // User Id
					'firstname' => $firstname,                   // First Name
					'lastname' => $lastname,                     // Last Name
					'type' => $type,                         	 // User Type
					'rule' => $rule,                         	 // User Rule					
					'expd' => $expire //test
				];

				$jwt = JWT::encode($data, $secretKey, 'HS512');
				// echo 'Welcome ' . $_SESSION['name'] . '!';
				echo json_encode(array('status' => '1', 'message' => 'สำเร็จ', "token" => $jwt));
			} else {
				echo json_encode(array('status' => '0', 'message' => 'User นี้ถูกยกเลิกการใช้งานแล้ว'));
			}
		} else {
			echo json_encode(array('status' => '0', 'message' => 'Password ไม่ถูกต้อง'));
		}
	} else {
		// $stmt->debugDumpParams();
		echo json_encode(array('status' => '0', 'message' => 'Username ไม่ถูกต้อง'));
	}
}else {
	// $stmt->debugDumpParams();
	echo json_encode(array('status' => '0', 'message' => 'ไม่สามารถ Connect Database ได้'));
}
