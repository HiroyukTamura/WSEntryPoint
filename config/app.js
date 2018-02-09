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
};

function onLoginSuccess() {
    setDrawerProfile(user);
}