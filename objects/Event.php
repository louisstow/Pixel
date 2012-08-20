<?php
class Event extends ORM {
    public static $table = "events";
    public static $key = array("userID", "eventDate", "cycleID");

    public static $attr = array(
        "userID" => INT,
        "eventDate" => DATE,
		"cycleID" => INT,
        "event" => STRING
    );

    public static function getLatest($user) {
        $q = ORM::query("SELECT eventDate, cycleID, event 
                        FROM events 
                        WHERE userID = ? 
                        ORDER BY eventDate desc
						LIMIT 30", array($user));
        return $q;
    }
}
?>
