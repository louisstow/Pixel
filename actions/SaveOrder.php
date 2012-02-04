<?php
data("pixels");
load("Order");

if(strlen($pixels) > 1000000) {
	error("Too many pixels. Limit of 100,000 pixels.");
}

$pixels = validate($pixels, false);

$q = ORM::query("SELECT orderID FROM orders WHERE userID = ?", array(USER));
$data = $q->fetch(PDO::FETCH_ASSOC);

if($data) {
	echo json_encode($data);
	ORM::query("UPDATE orders SET pixels = ?, orderDate = NOW() WHERE orderID = ?", array($pixels, $data['orderID']));
	exit;
}

$q = I("Order")->create(D, USER, NOW(), $pixels);

echo json_encode(array("orderID" => $q->orderID));
?>