<?php
load("User, Pixel");
data("email, password, url, message, pixel, color, respfield, chafield");

require_once('recaptchalib.php');
$privatekey = "6Ldq1ssSAAAAAAjIAHb9K0OkYlac5AKFO77pD3Cr";
$resp = recaptcha_check_answer ($privatekey,
		$_SERVER["REMOTE_ADDR"],
		$chafield,
		$respfield);

if(!$resp->is_valid) {
	error("Invalid CAPTCHA. Please try again.");
}

//detect SQL injection 
if(preg_match("/[^0-9,]/i", implode("", $pixel))) {
    error("Invalid pixels");
}

$password = encrypt($password);
$player = I("User")->create(D, $password, $email, $url, $message, 0);

if(!$player) {
	//if username taken
	error("Email taken. Please choose one registered with PayPal to recieve payments.");
}

//ensure color is valid
$icolor = intval($color, 16);
if($icolor < 0 || $color > 16777215) {
    error("Invalid color provided.");
}

$color = dechex($icolor);
$color = str_repeat("0", 6 - strlen($color)) . $color;

$_SESSION['id'] = $player->userID;

$isql = "INSERT INTO pixels VALUES ";
$iprep = array();

foreach($pixel as $pix) {
	$isql .= "(?, ?, 5000, ?, 0),";
	
	$iprep[] = $pix;
	$iprep[] = $player->userID;
	$iprep[] = $color;
}

$isql = substr($isql, 0, strlen($isql) - 1);

ORM::query($isql, $iprep);

unset($player->userPass);
unset($player->_updateFlag);
echo json_encode($player);
?>