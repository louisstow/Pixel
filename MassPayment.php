<?php
function MassPay($nvpStr_) {
	$environment = "sandbox";

	// Set up your API credentials, PayPal end point, and API version.
	$API_UserName = urlencode('louiss_1325993264_biz_api1.gmail.com');
	$API_Password = urlencode('1325993289');
	$API_Signature = urlencode('A00vXqh.LZyEwG.O.JDIt52uJlP6A7XfVGKzZXK9wJLDrKE4e6u8ESPN');
	$API_Endpoint = "ssl://api-3t.paypal.com";
	
	if("sandbox" === $environment || "beta-sandbox" === $environment) {
		$API_Endpoint = "ssl://api-3t.$environment.paypal.com";
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