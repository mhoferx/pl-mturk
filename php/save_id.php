<?php

$filePath = "../data/_sids.txt";

$filler = "";

if (file_exists($filePath)) {
    $filler = "\n";
}

$myfile = fopen($filePath, "a") or die("Unable to open file!");

$txt = $_POST["sid"];
fwrite($myfile, $filler . $txt);
fclose($myfile);

?>


