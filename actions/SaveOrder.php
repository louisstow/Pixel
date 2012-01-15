<?php
data("pixels");
load("Order");

$q = I("Order")->create(D, USER, NOW(), $pixels);

echo json_encode(array("orderID" => $q->orderID));
?>