<?php
load("Pixel, Transaction");
data("pixels, cost");

//detect SQL injection 
if(preg_match("/[^0-9,]/i", implode("", $pixels))) {
    error("Invalid pixels");
}

//ensure cost is a number between 1,00 and 100,00
$cost = ((float) $cost) * 100;
if($cost < 0 || $cost > 10000) {
    error("Price must be less between $0.00 and $100");
}

$list = implode($pixels, "','");

ORM::query("UPDATE pixels SET cost = ? WHERE ownerID = ? AND pixelLocation IN('{$list}')",
    array($cost, USER));

ok();
?>
