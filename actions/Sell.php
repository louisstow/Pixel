<?php
load("Pixel, Transaction");
data("pixels, cost");

//detect SQL injection 
if(preg_match("/[^0-9,]/i", implode("", $pixels))) {
    error("Invalid pixels");
}

//ensure cost is a number between 1,00 and 100,00
$cost = ((float) $cost) * 100;
if($cost < 10 || $cost > 5000) {
    error("Price must be less between $0.00 and $50");
}

$list = implode($pixels, "','");

$sql = "UPDATE pixels SET cost = ? WHERE ownerID = ? AND pixelLocation IN(";
$sql .= str_repeat("?,", count($pixels));
$sql = substr($sql, 0, strlen($sql) - 1) . ")";

$prep = array($cost, USER);
$prep = array_merge($prep, $pixels);

ORM::query($sql, $prep);

ok();
?>
