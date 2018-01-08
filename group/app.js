const postLoad = $('#post_load');
var progress = $('#progress');
var defaultApp;
var defaultDatabase;
var user;
var groupJson;

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
    var groupKey = getGroupKey();
    console.log("onLoginSuccess:", user, groupKey);

    defaultDatabase.ref("group/" + groupKey).once("value").then(function (snapshot) {
        if(!snapshot.exists()){
            // todo エラー処理
            console.log("snapShot存在せず" + snapshot);
            return;
        }

        groupJson = snapshot.toJSON();
        console.log(groupJson);
    });
}

function getGroupKey() {
    var url = new URL(window.location.href);
    return url.searchParams.get("key");
}