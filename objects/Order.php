<?php
class Order extends ORM {
	public static $table = "orders";
	public static $key = array("orderID");
	
	public static $attr = array(
		"orderID" => INT,
		"userID" => INT,
		"orderDate" => DATE,
		"pixels" => STRING
	);
}
?>