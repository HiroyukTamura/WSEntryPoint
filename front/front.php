<?php
/**
 * Created by PhpStorm.
 * User: hiroyuki2
 * Date: 2017/12/16
 * Time: 17:54
 */

?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="">
    <meta name="author" content="">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/css/bootstrap.min.css" integrity="sha384-PsH8R72JQ3SOdhVi3uxftmaW6Vc51MKb0q5P2rRUpPvrszuE4W1povHYgTpBfshb" crossorigin="anonymous">
    <link type="text/css" rel="stylesheet" href="https://www.gstatic.com/firebasejs/ui/2.4.1/firebase-ui-auth.css" />
    <link rel="stylesheet" href="style.css"/>
    <script defer src="https://use.fontawesome.com/releases/v5.0.1/js/all.js"></script>
    <title>ChalengedKit(β)</title>
</head>


<body>
<header>
    <div id="header">
        <h3 id="chart-title"></h3>
    </div>
</header>

<!--<div id="firebaseui-auth-container"></div>-->
<!--<div id="sign-in-status"></div>-->
<!--<div id="sign-in"></div>-->
<!--<div id="account-details"></div>-->
<div id="contents">
    <div id="month-wrapper">
<!--        <button id="mon-btn-back" class="mon-btn"><img id="btn-img-back" class="btn-img" src="../img/ic_play_arrow_black_48px.svg"></button>-->
        <a class="mon_btn" href="#"><i class="fas fa-arrow-circle-left fa-2x" id="btn-img-back"></i></a>
        <h1 id="month">4月</h1>
        <a class="mon_btn" href="#"><i class="fas fa-arrow-circle-right fa-2x" id="btn-img-next"></i></a>
<!--        <button id="mon-btn-next" class="mon-btn"><img id="btn-img-next" class="btn-img" src="../img/ic_play_arrow_black_48px.svg"></button>-->
    </div>
    <canvas id="chart_div" ></canvas>

    <div class="card">
        <div class="card-block">
            <h4 class="card-title">Card title</h4>
            <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
            <a href="#" class="btn btn-primary">Go somewhere</a>
        </div>
    </div>
</div>

<!--<div id="onLogin">-->
<!--<p id="userName"></p>-->
<!--<p id="uid"></p>-->
<!--</div>-->
<script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.3/umd/popper.min.js" integrity="sha384-vFJXuSJphROIrBnz7yo7oB41mKfc8JzQZiCq4NCceLEaO4IHwicKwpJf9c9IpFgh" crossorigin="anonymous"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/js/bootstrap.min.js" integrity="sha384-alpBpkh1PFOepccYVYDB4do5UnbKysX5WZXm3XxPqe5iKTfUKjNkCk9SaVuEZflJ" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.1/Chart.js"></script>
<script src="https://www.gstatic.com/firebasejs/4.8.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/4.8.0/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/4.8.0/firebase-database.js"></script>
<script src="https://www.gstatic.com/firebasejs/ui/2.4.1/firebase-ui-auth__ja.js"></script>
<script type="text/javascript" src="js/app.js" ></script>
<script>
    window.onload = function(ev){
        initApp();
    }
</script>
</body>
</html>