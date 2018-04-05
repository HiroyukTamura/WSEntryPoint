"use strict";

const postLoad = $('#post_load');
const progress = $('#progress');
const loginUi = $('#login_w');
const mainContent = $('.page-content');
let defaultDatabase;
let loginedUser;

window.onload = function init() {
    const defaultApp = firebase.initializeApp(CONFIG);
    defaultDatabase = defaultApp.database();

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log("ユーザログインしてます");
            loginedUser = user;
            onLoginSuccess();
        } else {
            firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                .then(function() {
                    const uiConfig = createFbUiConfig(function (user, credential, redirectUrl) {
                        progress.hide();
                        loginUi.hide();
                        loginedUser = user;
                        onLoginSuccess();
                        return false;
                    });

                    progress.hide();
                    postLoad.hide();
                    const ui = new firebaseui.auth.AuthUI(firebase.auth());
                    $('#login_w').show();
                    ui.start('#firebaseui-auth-container', uiConfig);

                }).catch(function(error) {
                    console.log(error.code, error.message);
                    showOpeErrNotification(defaultDatabase);
            });
        }
    });

    initDrawerDecoration();
};

function onLoginSuccess() {
    console.log("onLoginSuccess");
    progress.hide();
    loginUi.hide();
    postLoad.show();

    setDrawerProfile(loginedUser);
}