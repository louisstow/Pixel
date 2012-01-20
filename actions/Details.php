<?php
data("message, url, oldp, newp");

ORM::query("UPDATE users SET message = ?, url = ? WHERE userID = ?",
	array($message, $url, USER));

//if there was a new password	
if(trim($newp) != "" && $oldp != $newp) {
	$oldp = encrypt($oldp);
	$newp = encrypt($newp);
	
	$q = ORM::query("UPDATE users SET userPass = ? WHERE userID = ? AND userPass = ?",
		array($newp, USER, $oldp));
		
	if($q->rowCount() == 0) {
		error("Incorrect old password.");
	}
}	

ok();
?>