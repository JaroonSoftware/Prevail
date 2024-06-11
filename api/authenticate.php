<?php 
// include('./onload.php'); 
include_once( dirname(__FILE__, 1).'/src/JWT.php');  
use Firebase\JWT\JWT; 
try{ 
    $isAuth = preg_match('/Bearer\s(\S+)/', $_SERVER['HTTP_AUTHORIZATION'], $matches) == 1;
    $jwt = $matches[1]; 
    $secretKey =  "A3ZjYzAyYmNiLTQxMjM=Jaroon";// ?? 'bGS6lzFqvvSQ8ALbOxatm7/Vk7mLQyzqaS34Q4oR1ew='; 
    if (!$isAuth) {
        // 
        // http_response_code(400);
        // header('HTTP/1.0 400 Bad Request');
        echo 'Token not found in request';
        exit;
    }
    
    // var_dump($jwt , $matches, $secretKey);  exit;

    if (!$jwt) {
        // No token was able to be extracted from the authorization header
        header('HTTP/1.0 400 Bad Request');
        http_response_code(400);
        exit;
    }

    
    $token = JWT::decode($jwt, $secretKey, ['HS512']);
    // var_dump($token);  exit;
    $now = new DateTimeImmutable();
    $serverName = "vr";

    if ($token->iss !== $serverName ||
        $token->nbf > $now->getTimestamp() ||
        $token->exp < $now->getTimestamp())
    {
        header('HTTP/1.1 401 Unauthorized');
        exit;
    }    
} catch( Exception $e){
    
    header('HTTP/1.1 401 Unauthorized');
    echo("Token expire");
    exit;    
}


// Show the page
