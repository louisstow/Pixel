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
        $q = ORM::query("SELECT event 
                        FROM events 
                        WHERE userID = ? 
                        ORDER BY eventDate desc", array($user));
        return $q;
    }
}
?>
