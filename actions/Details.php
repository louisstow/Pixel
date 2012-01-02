<?php
load("User");
data("message, url");

ORM::query("UPDATE users SET message = ?, url = ? WHERE userID = ?",
	array($message, $url, USER));
	
ok();
?>