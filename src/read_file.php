<?php
$filename  = $_POST['name'];
$path = "upload/" . $filename;
$content = file_get_contents($path); //读取文件中的内容
echo $content;

?>