<?php
load("User, Pixel");
data("username, email, password, url, message, pixel, color");

if(I("Pixel")->get($pixel)) {
	error("Pixel taken");
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

I("Pixel")->create($pixel, $player->userID, 0, $color);

unset($player->userPass);
unset($player->_updateFlag);
echo json_encode($player);
?>