<?php
class Pixel extends ORM {
	public static $table = "pixels";
	public static $key = array("pixelLocation");
	
	public static $attr = array(
		"pixelLocation" => STRING,
		"ownerID" => INT,
		"cost" => INT,
		"color" => STRING
	);
	
	public static function getAll() {
		$q = ORM::query("SELECT p.*, u.url, u.message FROM pixels p INNER JOIN users u ON p.ownerID = u.userID");
		return $q;
	}
}
?>