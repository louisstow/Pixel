<?php
load("Pixel, Transaction");
data("pixels");

//check for sql injection
if(preg_match("/[^0-9,]/i", implode($pixels, ""))) {
    error("Invalid pixels");
}

$list = implode($pixels, "','");



//check price of every pixel, if not for sale skip, if not exists 1
//add up total
//change owner of pixels
?>
