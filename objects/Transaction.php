<?php
class Transaction extends ORM {
    public static $table = "transaction";
    public static $key = array("transID");

    public static $attr = array(
        "transID" => INT,
        "buyerID" => INT,
        "sellerID" => INT,
        "pixelLocation" => STRING,
        "price" => INT
    );
}
?>
