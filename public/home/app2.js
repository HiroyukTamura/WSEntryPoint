"use strict";

const mainContent = $('.page-content');

window.onload = function init() {
    new Main().init();
};

class Main {

    constructor(){
        this.postLoad = $('#post_load');
        this.progress = $('#progress');
        this.loginUi = $('#login_w');
        this.mainContent = $('.page-content');
        // this.defaultDatabase;
        this.loginedUser;
    }

    init(){
        const defaultApp = firebase.initializeApp(CONFIG);
        const defaultDatabase = defaultApp.database();
        const self = this;

        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                console.log("ユーザログインしてます");
                self.loginedUser = user;
                self.onLoginSuccess();
            } else {
                firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                    .then(function() {
                        const uiConfig = createFbUiConfig(function (user, credential, redirectUrl) {
                            self.progress.hide();
                            self.loginUi.hide();
                            self.loginedUser = user;
                            self.onLoginSuccess();
                            return false;
                        });

                        self.progress.hide();
                        self.postLoad.hide();
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
    }

    onLoginSuccess() {
        console.log("onLoginSuccess");
        this.progress.hide();
        this.loginUi.hide();
        this.postLoad.show();

        setDrawerProfile(this.loginedUser);
    }
}

