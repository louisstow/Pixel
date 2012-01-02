<?php
class Cycle extends ORM {
	public static $table = "cycles";
	public static $key = array("cycleID");
	
	public static $attr = array(
		"cycleID" => INT,
		"cycleTime" => DATE
	);
	
	public static function getCurrent() {
		$q = ORM::query("SELECT * FROM cycles WHERE cycleID = (SELECT MAX(cycleID) FROM cycles)");
		return $q->fetch(PDO::FETCH_ASSOC);
	}
}