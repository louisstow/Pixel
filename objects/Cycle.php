<?php
class Cycle extends ORM {
	public static $table = "cycles";
	public static $key = array("cycleID");
	
	public static $attr = array(
		"cycleID" => INT,
		"positive" => STRING,
		"neutral" => STRING,
		"negative" => STRING,
		"hint" => STRING,
		"cycleTime" => DATE
	);
}