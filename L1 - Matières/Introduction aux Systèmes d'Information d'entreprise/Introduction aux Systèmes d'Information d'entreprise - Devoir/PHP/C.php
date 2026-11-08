<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="C.css">
    <title>Document</title>
</head>
<body>
    
 <form action="C.php" method="post">
    <fieldset id="A1">
        <h2>CARTE ETUDIANT</h2>
        <img id="M1" src="logo_esgis.png" alt="Logo de ESGIS"><br>
        <img id="M2" src="Screenshot_20231021_234722.jpg" alt="Photo de la personne"><br>
    <label for="text">Nom <br><input type="text" placeholder="Veillez écrire votre nom en majuscule"></label><br>
    <label for="text">Prénoms <br><input type="text"></label><br>
    <label for="text">Filière <br><input type="text"></label><br>
    <label for="text">Numéro d'identification <br><input type="text"></label><br>
        
    
 </fieldset>
 <fieldset id="A2">
    maman
 </fieldset>

 </form>   

if(isset($_POST)){
    echo La connexion à échoué <br>Veillez ressayer

}

<?php


?>
</body>
</html>
