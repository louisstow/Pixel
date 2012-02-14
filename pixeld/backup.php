<?php
$data = file_get_contents("restore");
$data = explode("\n", $data);

foreach($data as $row) {
    $fp = fsockopen("localhost", 5607);
    fwrite($fp, $row);
    fclose($fp);
}
?>
