<?php
data("pixels");
load("Order");

$q = ORM::query("SELECT orderID FROM orders WHERE pixels = ? AND userID = ?", array($pixels, USER));
$data = $q->fetch(PDO::FETCH_ASSOC);

if($data) {
	echo json_encode($data);
	exit;
}

$q = I("Order")->create(D, USER, NOW(), $pixels);

echo json_encode(array("orderID" => $q->orderID));
?>