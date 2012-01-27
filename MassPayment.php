<?php
function MassPay($nvpStr_) {
	$environment = "notsandbox";

	// Set up your API credentials, PayPal end point, and API version.
	$API_UserName = urlencode('louisstow_api1.gmail.com');
	$API_Password = urlencode('PW7MA7YV6ZM5MS6V');
	$API_Signature = urlencode('ActcUiQKPs9BXzkGx1aLSemWSlWSAy9aQEEjQ-lM6L-cCCA73S16HUkM');
	
	if($GLOBALS['paypal'] === "sandbox") {
		$API_Endpoint = "ssl://api-3t.sandbox.paypal.com";
	} else {
		$API_Endpoint = "ssl://api-3t.paypal.com";
	}
	
	$version = urlencode('51.0');

	// Set the API operation, version, and API signature in the request.
	$nvpreq = "METHOD=MassPay&VERSION=$version&PWD=$API_Password&USER=$API_UserName&SIGNATURE=$API_Signature$nvpStr_";
	
	$header  = "POST /nvp HTTP/1.0\r\n";
	$header .= "Content-Type: application/x-www-form-urlencoded\r\n";
	$header .= "Content-Length: " . strlen($nvpreq) . "\r\n\r\n";
	
	//send the request
	$fp = fsockopen($API_Endpoint, 443);
	if(!$fp) {
		die("Couldnt connect! " . $API_Endpoint);
	}
	
	fputs($fp, $header . $nvpreq);
	
	//get the response
	$res = "";
	while(!feof($fp)) $res .= fgets($fp, 1024);
	
	fclose($fp);
	// Extract the response details.
	$data = explode("&", $res);
	$result = array();
	
	foreach($data as $row) {
		$row = explode("=", $row);
		$result[$row[0]] = $row[1];
	}

	return $result;
}
?>