<?php
load("User, Pixel");
data("username, email, password, url, message, pixel, color");

//detect SQL injection 
if(preg_match("/[^0-9,]/i", implode("", $pixel))) {
    error("Invalid pixels");
}

$password = encrypt($password);
$player = I("User")->create(D, $username, $password, $email, $url, $message);

if(!$player) {
	//if username taken
	$err = ORM::error();
	if($err[0] == "23000") {
		error("Username taken");
	}
	
	error("Error registering");
}

$_SESSION['id'] = $player->userID;

$isql = "INSERT INTO pixels VALUES ";
$iprep = array();

foreach($pixel as $pix) {
	$isql .= "(?, ?, 0, ?, 0),";
	
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