"use strict";

!function(){
    const defaultApp = firebase.initializeApp(CONFIG);
    const defaultDatabase = defaultApp.database();
    let loginedUser;

    window.onload = function init() {
        new Main().init();
    };

    class Main {

        constructor(){
            this.postLoad = $('#post_load');
            this.progress = $('#progress');
            this.loginUi = $('#login_w');
            this.mainContent = $('.page-content');
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

            // const calendar = new Calendar('#calendar', null);
            Main.setDomStatus();
        }

        static setDomStatus(){
            new MetaRecordRetriever('#meta-total', 'analytics', loginedUser.uid, 'totalCount')
                .retrieveData();
            new MetaRecordRetriever('#meta-continue', 'analytics', loginedUser.uid, 'continuousCount')
                .retrieveData();
            new MonthTotalRetriever('#meta-month', 'analytics', loginedUser.uid, moment().format('YYYYMM'), 'recordedDate')
                .retrieveData();
        }
    }

    class MetaRecordRetriever{
        constructor(selector, ...scheme){
            this.scheme = makeRefScheme(scheme);
            this.$dom = $(selector);
            this.val = 0;
        }

        retrieveData(){
            const self = this;
            defaultDatabase.ref(this.scheme).once('value').then(snapshot=> {
                if (snapshot.exists()) {
                    self.setVal(snapshot);
                } else {
                    //todo エラーロギング
                    console.log('snapshotなし', self.scheme);
                }
            }).catch(error => {
                console.log(error.code, error.message);
                //todo エラーロギング
            }).finally(() => {
                self.setDom(self.val);
            });
        }

        setDom(){
            this.$dom.html(this.val + '日');
        }

        setVal(snapshot){
            this.val = snapshot.val();
        }
    }

    class MonthTotalRetriever extends MetaRecordRetriever {
        setVal(snapshot){
            this.val = snapshot.val().split(',').length;
        }
    }
}();
