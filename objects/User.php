<?php
class User extends ORM {
	public static $table = "users";
	public static $key = array("userID");
	
	public static $attr = array(
		"userID" => INT,
		"userPass" => STRING,
		"userEmail" => STRING,
		"url" => STRING,
		"message" => STRING,
		"money" => INT
	);
	
	public static function updateCredit($user, $amount) {
		ORM::query("UPDATE users SET money = money + ? WHERE userID = ?", array($amount, $user));
	}
}
?>