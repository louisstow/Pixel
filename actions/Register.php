<?php
load("User");
data("username, email, password, url, message");

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

unset($player->userPass);
unset($player->_updateFlag);
echo json_encode($player);
?>