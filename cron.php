<?php
include 'lib.php';
include 'ORM.php';
include 'objects/Cycle.php';
include 'objects/Pixel.php';
include 'MassPayment.php';

//get the latest cycle information
$cycle = Cycle::getCurrent();

//start the daemon cron job and get a summary
$owners = queryDaemon("c");
/*
1,0,2|5,1,3|
*/

//generate event SQL
$esql = "INSERT INTO events VALUES ";
foreach($pixelcount as $owner => $pix) {
	$text = "You won {$pix['win']} and lost {$pix['lose']}";
	$esql .= "(?, ?, ?),";
	
	$eprep[] = $owner;
	$eprep[] = NOW();
	$eprep[] = $text;
}

$esql = substr($esql, 0, strlen($esql) - 1);

ORM::query($esql, $eprep);

$q = ORM::query("SELECT userEmail, money FROM users WHERE money >= 2000");

$i = 0;
$r = 0;

$nvp = "&EMAILSUBJECT=Love%20Pixenomics&RECEIVERTYPE=EmailAddress&CURRENCYCODE=USD";

$req = array();
while($row = $q->fetch(PDO::FETCH_ASSOC)) {
	//create empty request string
	if(!isset($req[$r])) $req[$r] = "";
	
	//build the string
	$receiverEmail = urlencode($row['userEmail']);
	$amount = urlencode($row['money'] / 100);
	$req[$r] .= "&L_EMAIL{$i}={$receiverEmail}&L_AMT{$i}={$amount}";
	
	//split up requests in chunks of 100 payments
	if($i == 200) {
		$i = 0;
		$r++;
	} else {
		$i++;
	}
}

print_r($req);
//send seperate payment requests
foreach($req as $r) {
	MassPay($r);
}

//when the cycle starts
$time = time() + (3 * 60 * 60);
I("Cycle")->create(D, date('Y-m-d H:i:s', $time));
?>
