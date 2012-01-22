<?php
include 'lib.php';
include 'ORM.php';
include 'objects/Cycle.php';
include 'objects/Pixel.php';
include 'MassPayment.php';

$TO = "louisstow+pixenomics@gmail.com";

//get the latest cycle information
$cycle = Cycle::getCurrent();

//start the daemon cron job and get a summary
$owners = queryDaemon("c");
echo "[" . $owners . "]";

$summary = explode("|", $owners);
/*
1,0,2|5,1,3|
*/

//generate event SQL
$esql = "INSERT INTO events VALUES ";
$eprep = array();

foreach($summary as $sum) {
	$line = explode(",", $sum);
	if(count($line) != 3) continue;
	
	$text = "You won {$line[1]} and lost {$line[2]}";
	$esql .= "(?, ?, ?, ?),";
	
	$eprep[] = hexdec($line[0]);
	$eprep[] = NOW();
	$eprep[] = $cycle['cycleID'];
	$eprep[] = $text;
}

$esql = substr($esql, 0, strlen($esql) - 1);

ORM::query($esql, $eprep);

ORM::query("DELETE FROM orders WHERE DATE_ADD(orderDate, INTERVAL 1 DAY) < NOW()");
ORM::query("DELETE FROM events WHERE DATE_ADD(eventDate, INTERVAL 5 DAY) < NOW()");

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
	$res = MassPay($nvp . $r);
	if($res['ACK'] == "Failure") {
		$message = print_r($res, true) . "\r\n\r\n";
		$message .= print_r($req, true);
		
		mail($TO, "Sending payment failure", $message);
	}
}

ORM::query("UPDATE users SET money = 0 WHERE money >= 2000");

//when the cycle starts
$time = time() + (3 * 60 * 60);
I("Cycle")->create(D, date('Y-m-d H:i:s', $time));
?>
