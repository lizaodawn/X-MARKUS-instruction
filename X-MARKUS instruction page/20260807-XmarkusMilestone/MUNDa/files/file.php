<?php 
// echo phpinfo();
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);

if ((isset($_SERVER['HTTP_REFERER']) && !empty($_SERVER['HTTP_REFERER']))) {
    if (strtolower(parse_url($_SERVER['HTTP_REFERER'], PHP_URL_HOST)) != strtolower(parse_url($_SERVER['HTTP_HOST'], PHP_URL_HOST))) {
    // referer not from the same domain
        die("<marquee><h1>Unauthorized Access!</h1></marquee>");
    }
}



// data get from html post (json)
$posts = $_POST['json'];
$fn = $_POST['fn'];
$ty = $_POST['ty'];
// encode array to json
$json = json_encode($posts, JSON_UNESCAPED_UNICODE);
//$uuid = uniqid(); 
// $fn="test";
// $json="ssss";
$bytes = file_put_contents( "users/" . $ty . "/" . $fn , $json); //generate json file
//$bytes = file_put_contents( $fn . ".json", $json); //generate json file
echo "The file was created. ". $bytes;

?>