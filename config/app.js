"use strict";

const postLoad = $('#post_load');
var progress = $('#progress');
var defaultApp;
var defaultDatabase;
var loginedUser;

window.onload = function (ev) {
    defaultApp = firebase.initializeApp(CONFIG);
    defaultDatabase = defaultApp.database();

    firebase.auth().onAuthStateChanged(function(userObject) {
        if (userObject) {
            console.log("ユーザログインしてます");
            progress.hide();
            loginedUser = userObject;
            onLoginSuccess();
        } else {
            firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                .then(function() {
                    var uiConfig = createFbUiConfig(function (userObject, credential, redirectUrl) {
                        console.log(userObject);
                        loginedUser = userObject;
                        progress.hide();
                        $('#login_w').hide();
                        return false;
                    });

                    var ui = new firebaseui.auth.AuthUI(firebase.auth());
                    progress.hide();
                    postLoad.hide();
                    $('#login_w').show();
                    ui.start('#firebaseui-auth-container', uiConfig);
                }).catch(function(error) {
                console.log(error.code, error.message);
                showOpeErrNotification(defaultDatabase, -1);
            });
        }
    });

    initDrawerDecoration();
    new UiListeners().initSocialBtns();
};

function onLoginSuccess() {
    setDrawerProfile(loginedUser);

    $('#login_w').hide();
    postLoad.show();
}

(function () {
    function UiListeners() {}

    UiListeners.prototype.initSocialBtns = function () {
        $('#btn-github').on('click', function (e) {
            window.open('https://github.com/HiroyukTamura');
            return false;
        });

        $('#btn-fb').on('click', function (e) {
            window.open('https://www.facebook.com/profile.php?id=100005318946062');
            return false;
        });
    };

    window.UiListeners = UiListeners;
}());