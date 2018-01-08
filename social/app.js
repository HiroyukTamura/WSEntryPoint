"use strict";

const postLoad = $('#post_load');
const DEFAULT = "DEFAULT";
const progress = $('#progress');
var defaultApp;
var defaultDatabase;
var user;
var fbCoumpleteCount = 0;
var userDataJson;

function init() {
    var config = {
        apiKey: "AIzaSyBQnxP9d4R40iogM5CP0_HVbULRxoD2_JM",
        authDomain: "wordsupport3.firebaseapp.com",
        databaseURL: "https://wordsupport3.firebaseio.com",
        projectId: "wordsupport3",
        storageBucket: "wordsupport3.appspot.com",
        messagingSenderId: "60633268871"
    };
    defaultApp = firebase.initializeApp(config);
    defaultDatabase = defaultApp.database();

    firebase.auth().onAuthStateChanged(function(userObject) {
        if (userObject) {
            console.log("ユーザログインしてます");
            // progress.css("display", "none");
            user = userObject;
            onLoginSuccess();
        } else {
            firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                .then(function() {
                    var uiConfig = {
                        signInOptions: [
                            // Leave the lines as is for the providers you want to offer your users.
                            firebase.auth.GoogleAuthProvider.PROVIDER_ID,
                            firebase.auth.TwitterAuthProvider.PROVIDER_ID,
                            firebase.auth.EmailAuthProvider.PROVIDER_ID,
                            firebase.auth.PhoneAuthProvider.PROVIDER_ID
                        ],
                        // Terms of service url.
                        tosUrl: 'sampleTosUrl',
                        'callbacks': {
                            // Called when the user has been successfully signed in.
                            'signInSuccess': function(userObject, credential, redirectUrl) {
                                user = userObject;
                                progress.css('display', "none");
                                $('#login_w').css('display', "none");
                                return false;
                            }
                        }
                    };

                    var ui = new firebaseui.auth.AuthUI(firebase.auth());
                    progress.css('display', "none");
                    $('#login_w').css('display', "inline");
                    ui.start('#firebaseui-auth-container', uiConfig);
                }).catch(function(error) {
                var errorCode = error.code;
                var errorMessage = error.message;
                console.log(errorCode, errorMessage);
                //todo エラー時の処理
            });
        }
    });
}

function onLoginSuccess() {
    console.log("onLoginSuccess:", user);

    defaultDatabase.ref("userData/" + user.uid).once("value").then(function (snapshot) {

        if(!snapshot.exists()){
            // todo エラー処理
            console.log("snapShot存在せず" + snapshot);
            return;
        }

        userDataJson = snapshot.toJSON();

        //グループに参加していない場合
        if(snapshot.child("group").numChildren() === 1){
            $("#group .group-w-title-w p").css('display', 'inline');
        }

        snapshot.child("group").forEach(function (childSnap) {
            console.log("groupKey", childSnap.key);

            if(childSnap.key === DEFAULT)
                return;

            var userName = avoidNullValue(childSnap.child("name").val(), "ユーザ名未設定");

            var photoUrl = avoidNullValue(childSnap.child("photoUrl").val(), 'img/icon.png');
            photoUrl = "url('"+ photoUrl + "') center / cover";

            // todo 未読を記録するnodeを作らないとね
            var html = $(
                '<div class="demo-card-image mdl-card mdl-shadow--2dp mdl-pre-upgrade">'+
                    '<div class="mdl-card__title mdl-card--expand mdl-badge mdl-pre-upgrade" data-badge="44"></div>'+
                        '<div class="mdl-card__actions mdl-pre-upgrade">'+
                            '<span class="demo-card-image__filename mdl-pre-upgrade">'+userName+'</span>'+
                        '</div>'+
                    '</div>'+
                '</div>');

            // $('#group #add-btn-w').insertBefore($(html));
            html.css('background', photoUrl);
            html.insertBefore($('#group #add-btn-w'));
        });

        //プロフィール欄を表示
        $('#profile-w h3').html('<i class="fas fa-user"></i>' + "&nbsp;&nbsp;" + snapshot.child('displayName').val());

        var userEmail = avoidNullValue(snapshot.child('email').val(), "アドレス未設定");
        $('#user-email').html(userEmail);

        var photoUrl = avoidNullValue(snapshot.child("photoUrl").val());
        if(photoUrl)
            $('#profile').find('img').attr("src", photoUrl);

        showAll();
    });

    //友達のユーザを表示
    retrieveFriendSnap();
}

function retrieveFriendSnap() {
    defaultDatabase.ref("friend/" + user.uid).once("value").then(function (snapshot) {
        if(!snapshot.exists()){
            // todo エラー処理
            console.log("snapShot存在せず" + snapshot);
            return;
        }

        var pool = $("#other-users");

        snapshot.forEach(function (childSnap) {
            if(childSnap.key === DEFAULT)
                return;

            var userName = avoidNullValue(childSnap.child("name").val(), "ユーザ名未設定");
            var photoUrl = avoidNullValue(childSnap.child("photoUrl").val(), "img/icon.png");
            var ele = $(
                '<div class="user-img-w">'+
                    '<div class="mdl-card mdl-shadow--2dp user-image mdl-pre-upgrade">'+
                        '<div ="'+ photoUrl +'" class="user-image-i">'+
                    '</div>'+
                    '<p class="user-name">'+ userName +'</p>'+
                '</div>'
            );

            pool.append(ele);

            console.log("おともだち", userName);
        });

        showAll();
    });
}

function avoidNullValue(photoUrl, onErrVal) {
    if(photoUrl === "null")
        return onErrVal;
    else
        return photoUrl;
}

function setOnClickListeners() {
    $('#group #add-btn-w').on("click", function (ev) {
        console.log("groupAddBtn clicked");
    });

    $('#edit-prof').on("click", function (ev) {
        console.log("edit-prof clicked");
    });

    var clickedAndMovePage = false;
    var dialog = $('#add-group-dialog')[0];
    if(!dialog.showModal){
        dialogPolyfill.registerDialog(dialog);
    }

    $('.close').on("click", function (ev) {
        dialog.close();
    });
    $('#add-group-btn').on("click", function (ev) {
        dialog.close();
        console.log("参加するってよ！");
    });

    $('#group .demo-card-image').on("click", function (ev) {

        var groupKeys = Object.keys(userDataJson["group"]);
        var index = $(this).index();
        var groupKey = groupKeys[index];
        if(groupKey === DEFAULT){
            groupKey = groupKeys[index + 1];
        }

        console.log(groupKey, userDataJson["group"]);
        if(userDataJson["group"][groupKey]["added"]){
            if(clickedAndMovePage){
               clickedAndMovePage = true;
            } else {
                window.location.href = "../group/index.html?key=" + groupKey;
            }
        } else {
            if(!dialog.showModal){
                dialog.showModal();
            }
        }
    });
}

function showAll() {
    if(fbCoumpleteCount !== 1){
        fbCoumpleteCount++;
        return;
    }

    setOnClickListeners();

    setElementAsMdl($("body"));

    tippy('[title]', {
        updateDuration: 0,
        popperOptions: {
            modifiers: {
                preventOverflow: {
                    enabled: false
                }
            }
        }
    });
}

function setElementAsMdl(clone) {
    var ele = clone.find(".mdl-pre-upgrade");
    for (var i=0; i<ele.length; i++){
        componentHandler.upgradeElement(ele.eq(i)[0]);
    }
}