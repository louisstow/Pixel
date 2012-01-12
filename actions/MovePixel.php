<?php
load("Pixel");
data("from, to");

//get pixel data
$f = queryDaemon($from . " g");
$color = substr($f, 0, 6);
$cents = substr($f, 6, 3);
$owner = substr($f, 9, 4);

//write to daemon
queryDaemon("{$to} w {$color} {$cost} {$owner} " . time());
queryDaemon("{$from} d " . time());

ok();
?>