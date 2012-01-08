<?php

/** MassPay NVP example; last modified 08MAY23.
 *
 *  Pay one or more recipients. 
*/

$environment = 'sandbox';	// or 'beta-sandbox' or 'live'

/**
 * Send HTTP POST Request
 *
 * @param	string	The API method name
 * @param	string	The POST Message fields in &name=value pair format
 * @return	array	Parsed HTTP Response body
 */
function PPHttpPost($methodName_, $nvpStr_) {
	global $environment;

	// Set up your API credentials, PayPal end point, and API version.
	$API_UserName = urlencode('louisstow_api1.gmail.com');
	$API_Password = urlencode('PW7MA7YV6ZM5MS6V');
	$API_Signature = urlencode('ActcUiQKPs9BXzkGx1aLSemWSlWSAy9aQEEjQ-lM6L-cCCA73S16HUkM');
	$API_Endpoint = "ssl://api-3t.paypal.com";
	
	if("sandbox" === $environment || "beta-sandbox" === $environment) {
		$API_Endpoint = "ssl://api-3t.$environment.paypal.com";
	}
	
	$version = urlencode('51.0');

	// Set the API operation, version, and API signature in the request.
	$nvpreq = "METHOD=$methodName_&VERSION=$version&PWD=$API_Password&USER=$API_UserName&SIGNATURE=$API_Signature$nvpStr_";
	
	$header  = "POST /nvp HTTP/1.0\r\n";
	$header .= "Content-Type: application/x-www-form-urlencoded\r\n";
	$header .= "Content-Length: " . strlen($nvpreq) . "\r\n\r\n";
	
	//send the request
	$fp = fsockopen($API_Endpoint, 80);
	if(!$fp) {
		die("Couldnt connect! " . $API_Endpoint);
	}
	
	fputs($fp, $header . $nvpreq);
	
	//get the response
	$res = "";
	while(!feof($fp)) $res .= fgets($fp, 1024);
	echo $res;
	
	fclose($fp);
	// Extract the response details.
	$data = explode("&", $res);

	print_r($data);

	return $data;
}

// Set request-specific fields.
$emailSubject = urlencode('Love Pixenomics');
$receiverType = urlencode('EmailAddress');
$currency = urlencode('USD');

// Add request-specific fields to the request string.
$nvpStr="&EMAILSUBJECT=$emailSubject&RECEIVERTYPE=$receiverType&CURRENCYCODE=$currency";

$receiversArray = array();

for($i = 0; $i < 3; $i++) {
	$receiverData = array(	'receiverEmail' => "user$i@paypal.com",
							'amount' => "1.00");
	$receiversArray[$i] = $receiverData;
}

foreach($receiversArray as $i => $receiverData) {
	$receiverEmail = urlencode($receiverData['receiverEmail']);
	$amount = urlencode($receiverData['amount']);
	$nvpStr .= "&L_EMAIL$i=$receiverEmail&L_Amt$i=$amount";
}

// Execute the API operation; see the PPHttpPost function above.
$resp = PPHttpPost('MassPay', $nvpStr);


?>