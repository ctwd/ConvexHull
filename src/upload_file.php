<?php

if ($_FILES["upload_file"]["error"] > 0)
{
       echo "<textarea>".$_FILES["upload_file"]["error"] ."</textarea>";
}
  else  
{
 
  if (file_exists("upload/" . $_FILES["upload_file"]["name"]))
    {
      unlink("upload/" . $_FILES["upload_file"]["name"]);
  
    }
    move_uploaded_file($_FILES["upload_file"]["tmp_name"],
    "upload/" . $_FILES["upload_file"]["name"]);
    echo "<textarea>上传成功！</textarea>";
      
}

?>