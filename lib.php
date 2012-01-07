<?php
session_start();

define("SALT", "AND PEPPER");

/**
* Include the methods from this file
*/
function load($list) {
	$vars = explode(',',$list);
	foreach($vars as $var) {
		$var = trim($var);
		if(!class_exists($var) && file_exists("objects/" . $var . ".php")) {
			include "objects/" . $var . ".php";
		}
	}
}

/**
* Grab the data from URL variables and
* create constants
*/
function data($list) {
	$vars = explode(',',$list);
	foreach($vars as $var) {
		$var = trim($var);
		if(isset($_GET[$var])) {
			$GLOBALS[$var] = $_GET[$var];
		}
	}
}

/**
* Encrypt a string with SHA1 and a salt
*/
function encrypt($str) {
	return sha1(SALT . $str);
}

/**
* Send an error to the client
*/
function error($msg) {
	echo "{\"error\": \"{$msg}\"}";
	exit;
}

/**
* Request was Okelydokely
*/
function ok() {
	echo "{\"status\": \"ok\"}";
	exit;
}

/**
* Send PQL to reth's shitty daemon
*/
function queryDaemon($req) {
	$fp = fsockopen("192.168.1.8", 5607);
	$len = fwrite($fp, $req);
	
	//shit wnet wrong
	if($len !== strlen($req)) {
		echo $len . " (" . $req . ")";
	}
	
	$r = "";
	$str = "";
	while(!feof($fp)) {
		$r = fgets($fp, 1050);
		$str .= $r;
	}
	
	fclose($fp);
	
	return $str;
}

/**
* Convert PQL to Assoc Array
*/
function toArray($resp) {
	$result = array();
	
	$len = strlen($resp);
	for($i = 0; $i < $len; $i++) {
		if(substr($resp, $i, 1) == ".") {
			$result[] = false;
			continue;
		}
		
		//every 13th char
		$result[] = array(
			"color" => substr($resp, $i, 6),
			"cost" => substr($resp, $i + 6, 3),
			"owner" => substr($resp, $i + 9, 4)
		);
		
		$i += 13;
	}
	
	return $result;
}

if(isset($_SESSION['id'])) define("USER", $_SESSION['id']);
?>