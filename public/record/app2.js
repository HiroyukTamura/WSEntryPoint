"use strict";

!function () {
    const mainContent = $('.page-content');
    const defaultApp = firebase.initializeApp(CONFIG);
    const defaultDatabase = defaultApp.database();
    let loginedUser;
    window.onload = function init() {
        new Main().init();
    };

    class Main {

        constructor(){
            this.defaultApp = defaultApp;
            this.postLoad = $('#post_load');
            this.progress = $('#progress');
            this.loginUi = $('#login_w');
            this.mainContent = $('.page-content');
            // this.defaultDatabase;
        }

        init(){
            const self = this;
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
                    console.log("ユーザログインしてます");
                    loginedUser = user;
                    self.onLoginSuccess();
                } else {
                    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                        .then(function() {
                            const uiConfig = createFbUiConfig(function (user, credential, redirectUrl) {
                                self.progress.hide();
                                self.loginUi.hide();
                                loginedUser = user;
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

            setDrawerProfile(loginedUser);

            new MetaRecord();
        }
    }


    class MetaRecord {

        constructor(){
            this.$dayCont = $('#meta-continue');

            this.setDomAsTotalOfMon();
        }

        setDomAsTotalOfMon(){
            const scheme = makeRefScheme(['analytics', loginedUser.uid, currentMoment.format('YYYYMM'), 'recordedDate']);
            const $totalOfMon = $('#meta-month');
            defaultDatabase.ref(scheme).once('value').then(snapshot=> {
                let days = 0;
                if (snapshot.exists())
                    days = snapshot.val().split[','].length;
                $totalOfMon.html(days+'日');
            }).catch(err => {

            });
        }

        setDomAsTotal(){
            const scheme = makeRefScheme(['analytics', loginedUser.uid, 'totalCount']);
            const $total = $('#meta-total');
            defaultDatabase.ref(scheme).once('value').then(snapshot=> {
                if (!snapshot.exists()) {
                    //todo エラー処理
                } else {
                    $total.html(snapshot.val() + '日');
                }
            }).catch(err => {

            });
        }

        setDomAsCont() {

        }
    }
}();