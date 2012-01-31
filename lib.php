<?php
include 'config.php';

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
		} else if(isset($_POST[$var])) {
			$GLOBALS[$var] = $_POST[$var];
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
	
	$fp = fsockopen($GLOBALS['daemon'], 5607, $errno, $errstr, 2);
	
	if(!$fp) {
		return FALSE;
	}
	
	fwrite($fp, $req, strlen($req));
	
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
			"cost" => hexdec(substr($resp, $i + 6, 3)) * 10,
			"owner" => hexdec(substr($resp, $i + 9, 4))
		);
		
		$i += 12;
	}
	
	return $result;
}

function chunk($req) {
	$cmd = strstr($req, ' ');
	$i = 0;
	$l = strpos($req, ' ');
	$max = 8000;
	$n = ceil($l / $max);
	$next = 0;

	while($i < $n) {
		$tail = ($i + 1) * $max;
		$head = $next;
		
		if(substr($req, $tail, 1) !== '|') {
			$next = $tail;
			
			while(substr($req, $next, 1) !== '|' && substr($req, $next, 1) !== ' ' && $next < $l) {
				$next++;
			}
			
			$tail = $next;
			$next += 1;
		} else {
			$next = $tail + 1;
			$start = $i;
		}
		
		$tail = min($l, $tail);
		
		$str = substr($req, $head, $tail - $head) . $cmd;
		queryDaemon($str);
		
		$i++;
	}
}

if(isset($_SESSION['id'])) define("USER", $_SESSION['id']);
?>
