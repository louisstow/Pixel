<?php
if(!$me) {
	session_destroy();
	session_unset();
	error("Please register");
}

unset($me->_updateFlag);
unset($me->userPass);
echo json_encode($me);
?>