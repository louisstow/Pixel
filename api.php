<?php
include 'lib.php';
include 'ORM.php';

$a = trim($_GET['action']);
//if the action contains non-alpha hacking attempt
if($a === "" && preg_match("/[^a-zA-Z\-]/", $a)) {
	error("Action not available: " . $a);
}
//if the action does not exist, label as hacking attempt
if(!file_exists("actions/" . $a . ".php")) {
	error("Action not available: " . $a);
}

if(!isset($_SESSION['id'])) {
	//if user is not intending to Login or Register
	if($a != "Login" && $a != "Register" && $a != "GetBoard" && $a != "GetUsers" && $a != "Status" && $a != "LostPass") 
		error("Please login");
		
} else {
	load("User");
	$me = I("User")->get(USER);
}

include "actions/" . $a . ".php";
?>