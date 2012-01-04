<?php
class Stat extends ORM {
	public static $table = "stats";
	
	public static function updateProfit($amount) {
		ORM::query("UPDATE stats SET profit = profit + ?", array($amount));
	}
}
?>