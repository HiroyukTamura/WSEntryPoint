const postLoad = $('#post_load');
const DEFAULT = 'DEFAULT';
var progress = $('#progress');
const dialog = $('dialog')[0];
var asyncCount = 0;
var defaultApp;
var defaultDatabase;
var user;
var groupJson;
var groupNodeJson;

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
                                console.log(userObject);
                                user = userObject;
                                progress.css('display', "none");
                                $('#login_w').css('display', "none");
                                onLoginSuccess();
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
    if (!dialog.showModal) {
        dialogPolyfill.registerDialog(dialog);
    }

    var groupKey = getGroupKey();
    console.log("onLoginSuccess:", user, groupKey);

    defaultDatabase.ref("group/" + groupKey).once("value").then(function (snapshot) {
        onGetGroupSnap(snapshot);
    });

    defaultDatabase.ref("userData/" + user.uid + "/group").once("value").then(function (snapshot) {
       onGetSnapOfGroupNode(snapshot);
    });

    //init dialog
    $(dialog).find(".close").on("click", function (e) {
        dialog.close();
    });
    $(dialog).find('#positive-btn').on("click", function (e) {
        console.log("click", "positive-btn");
        dialog.close();
    });
}

function onGetGroupSnap(snapshot) {
    if(!snapshot.exists()){
        // todo エラー処理
        console.log("snapShot存在せず" + snapshot);
        return;
    }

    groupJson = snapshot.toJSON();
    console.log(groupJson);

    var userList = $('.card.user-list .mdl-list');
    var dpList = $('#dp-list');
    var keys = Object.keys(groupJson.member);

    keys.forEach(function (key) {
        if(key === DEFAULT || key === user.uid)
            return;

        var member = groupJson["member"][key];
        var photoUrl = avoidNullValue(member.photoUrl, 'img/icon.png');
        var li = $(
            '<li class="mdl-list__item mdl-pre-upgrade">'+
                '<span class="mdl-list__item-primary-content mdl-pre-upgrade">'+
                    '<img src="'+ photoUrl +'" alt="user-image">'+
                    '<span>'+ member.name +'</span>'+
                '</span>'+
                '<span class="mdl-list__item-secondary-action">'+
                    '<button id="'+ key +'" class="mdl-button mdl-js-button mdl-button--icon mdl-pre-upgrade">'+
                        '<I class="material-icons">more_vert</i>'+
                    '</button>'+
                '</span>'+
            '</li>'
        );
        userList.append(li);

        var dropDown = $(
            '<ul class="mdl-menu mdl-menu--bottom-right mdl-js-menu mdl-js-ripple-effect mdl-pre-upgrade" for="'+ key +'">'+
                '<li class="mdl-menu__item mdl-pre-upgrade">グループから退会させる</li>'+
            '</ul>'
        );

        dropDown.find('.mdl-menu__item').on("click", function (e) {
            console.log('click', dialog.showModal);
            if(!dialog.showModal)
                dialog.showModal();
        });

        dpList.append(dropDown);
    });

    showAll();
}

function getGroupKey() {
    var url = new URL(window.location.href);
    return url.searchParams.get("key");
}

function avoidNullValue(photoUrl, onErrVal) {
    if(photoUrl === "null")
        return onErrVal;
    else
        return photoUrl;
}

function onGetSnapOfGroupNode(snapshot) {
    if(!snapshot.exists()){
        // todo エラー処理
        console.log("snapShot存在せず" + snapshot);
        return;
    }

    groupNodeJson = snapshot.toJSON();
    var ul = $("#group-dp-ul");
    var count = 0;
    Object.values(groupNodeJson).forEach(function (value) {
        if(value === DEFAULT || !value.added)
            return;

        $('<li>', {
            class: "mdl-menu__item"
        }).html(value.name).appendTo(ul);

        count++;
    });

    if(count !== 0){
        $("#group-drp-btn").css('display', '');
    }

    showAll();
}

function setElementAsMdl(clone) {
    var ele = clone.find(".mdl-pre-upgrade");
    for (var i=0; i<ele.length; i++){
        componentHandler.upgradeElement(ele.eq(i)[0]);
    }
}

function showAll() {
    if(asyncCount !== 1){
        asyncCount++;
        return;
    }

    setElementAsMdl($('body'));
}