<?php
class Event extends ORM {
    public static $table = "events";
    public static $key = array("userID", "eventDate");

    public static $attr = array(
        "userID" => INT,
        "eventDate" => DATE,
        "event" => STRING
    );

    public static function getLatest($user) {
        $q = ORM::query("SELECT cycleID, event 
                        FROM events 
                        WHERE userID = ? 
                        ORDER BY cycleID desc", array($user));
        return $q;
    }
}
?>
