<?php
load("Pixel");
data("from, to");

//get pixel data
$f = queryDaemon($from . " g");
$color = substr($f, 0, 6);
$cents = substr($f, 6, 3);
$owner = substr($f, 9, 4);

//write to daemon
$time = time();
queryDaemon("{$to} w {$color} {$cents} {$owner} " . $time);
queryDaemon("{$from} d " . $time);

ok();
?>