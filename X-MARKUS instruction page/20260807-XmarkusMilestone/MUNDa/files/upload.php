<?php

if ($_FILES["file"]["error"] > 0) {
  echo "Error: " . $_FILES["file"]["error"] . "<br>";
} else {
  $fileName = $_FILES["file"]["name"];
  $fileTmpName = $_FILES["file"]["tmp_name"];
  $fileSize = $_FILES["file"]["size"];
  $fileType = $_FILES["file"]["type"];

  // Move the uploaded file to a specified directory
  if (move_uploaded_file($fileTmpName, "users/excel/" . $fileName)) {
    echo "File uploaded successfully.";
  } else {
    echo "Error uploading file.";
  }
}

// include_once("db_connect.php");
// if(!empty($_FILES)){     
//     $upload_dir = "uploads/";
//     $fileName = $_FILES['file']['name'];
//     $uploaded_file = $upload_dir.$fileName;    
//     // if(move_uploaded_file($_FILES['file']['tmp_name'],$uploaded_file)){
//     //     //insert file information into db table
// 	// 	$mysql_insert = "INSERT INTO uploads (file_name, upload_time)VALUES('".$fileName."','".date("Y-m-d H:i:s")."')";
// 	// 	mysqli_query($conn, $mysql_insert) or die("database error:". mysqli_error($conn));
//     // }    
//}
?>

