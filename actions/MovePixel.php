<?php
load("Pixel");
data("from, to");

if(preg_match("/[^0-9,]/i", $from)) {
    error("Invalid pixels");
}

if(preg_match("/[^0-9,]/i", $to)) {
    error("Invalid pixels");
}

$cto = explode(",", $to);
if(count($cto) != 2 || $cto[0] >= 1200 || $cto[1] >= 1000) {
    error("Invalid pixel range");
}

//get pixel data
$f = queryDaemon($from . " g");

if($f == ".") {
	error("Invalid pixels");
}

$color = substr($f, 0, 6);
$cents = substr($f, 6, 3);
$owner = substr($f, 9, 4);

if(hexdec($owner) != USER) {
	error("Not your pixel");
}

$t = queryDaemon($to . " g");
if($t !== ".") {
	error("Pixel already there ({$to}) [{$t}]");
}

//write to daemon
$time = time();
queryDaemon("{$to} w {$color} {$cents} {$owner} " . $time);
queryDaemon("{$from} d " . $time);

ok();
?>
