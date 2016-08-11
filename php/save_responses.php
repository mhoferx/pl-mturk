<?php

$subjectIDent = $_POST["sid"];
$filePath = "../data/".$subjectIDent."_results.txt";

$myfile = fopen($filePath, "w");

$txt = $_POST["data"];

fwrite($myfile, $txt);

fclose($myfile);

?>


