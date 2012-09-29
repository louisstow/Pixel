<?php
load("Pixel");
data("from, to");

if(preg_match("/[^0-9,|]/i", $from)) {
    error("Invalid pixels");
}

if(preg_match("/[^0-9,]/i", $to)) {
    error("Invalid pixels");
}

$cto = explode(",", $to);
if(count($cto) != 2 || $cto[0] >= 1200 || $cto[1] >= 1000) {
    error("Invalid pixel range");
}

chunk($from . " t " . $to . " " . dechex(USER) . " " . getTime());

ok();
?>
