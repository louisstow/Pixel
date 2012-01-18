<?php
load("Pixel");
data("from, to");

if(preg_match("/[^0-9,]/i", $from)) {
    error("Invalid pixels");
}

if(preg_match("/[^0-9,]/i", $to)) {
    error("Invalid pixels");
}

//get pixel data
$f = queryDaemon($from . " g");
$color = substr($f, 0, 6);
$cents = substr($f, 6, 3);
$owner = substr($f, 9, 4);

$t = queryDaemon($to . " g");
if($t !== ".") {
	error("Pixel already there");
}

//write to daemon
$time = time();
queryDaemon("{$to} w {$color} {$cents} {$owner} " . $time);
queryDaemon("{$from} d " . $time);

ok();
?>