<?php
class User extends ORM {
	public static $table = "users";
	public static $key = array("userID");
	
	public static $attr = array(
		"userID" => INT,
		"userName" => STRING,
		"userPass" => STRING,
		"userEmail" => STRING,
		"url" => STRING,
		"message" => STRING
	);
}
?>