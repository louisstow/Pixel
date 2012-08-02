<?php
load("User, Pixel");
data("email, password, url, message, pixel, respfield, chafield");

require_once('recaptchalib.php');
$privatekey = "6Ldq1ssSAAAAAAjIAHb9K0OkYlac5AKFO77pD3Cr";
$resp = recaptcha_check_answer ($privatekey,
		$_SERVER["REMOTE_ADDR"],
		$chafield,
		$respfield);

if(!$resp->is_valid) {
	error("Invalid CAPTCHA. Please try again.");
}

if(!is_array($pixel)) {
	error("Invalid pixels");
}

if(strlen($password) > 250 || strlen($email) > 250) {
	error("All fields must be less than 250 characters");
}

$email = substr(trim($email), 0, 250);
$url = substr(trim($url), 0, 250);
$message = substr(trim($message), 0, 250);

//basic field validation
if($email == "" || $url == "" || $message == "" || $password == "") {
	error("Please fill in all fields.");
}

if(count($pixel) > 30) {
	$pixel = array_slice($pixel, 0, 30);
}

if(!realValidation($pixel))
	error("Invalid pixels");

//validate the selected pixels
$list = implode($pixel, "|");

$q = queryDaemon("{$list} g");

//should be 30 dots
if(strlen($q) > 30) {
	error("Pixels taken: " . $q);
}

$password = encrypt($password);
$player = I("User")->create(D, $password, $email, $url, $message, 0);

if(!$player) {
	//if username taken
	error("Email taken. Please choose one registered with PayPal to recieve payments.");
}

$_SESSION['id'] = $player->userID;

queryDaemon("{$list} w 000000 1f4 " . dechex($player->userID) . " " . time());

unset($player->userPass);
unset($player->_updateFlag);
echo json_encode($player);
?>
