<?php
// ob_clean();
error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', 1);

// header("Access-Control-Allow-Origin: *");
// header("Access-Control-Allow-Headers: *");
// header("Access-Control-Allow-Methods: *");
date_default_timezone_set('Asia/Bangkok');   

include_once( dirname(__FILE__, 1)."/conn.php");
include_once( dirname(__FILE__, 1)."/authenticate.php");