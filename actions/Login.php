<?php
load("User");
data("username, password");

$password = encrypt($password);
$result = I("User")->getMany(array("userName" => $username, "userPass" => $password));

if($result->count()) {
	//get the first user
	$arr = $result->result();
	$arr = $arr[0];
	
	$_SESSION['id'] = $arr->userID;
	
	unset($arr->userPass);
	unset($arr->_updateFlag);
	echo json_encode($arr);
} else {
	error("Details incorrect");
}
?>