var defaultApp;

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

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log("ユーザログインしてます");
            onLoginSuccess(user.uid);
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
                            'signInSuccess': function(user, credential, redirectUrl) {
                                console.log(user.uid);
                                //urlとは別のuidのユーザとしてログインすることもある。
                                if(user.uid !== getUid()){
                                    var currentUrl = $(location).attr('href');
                                    window.location.href = currentUrl.substring(0, currentUrl.indexOf("?"));
                                } else {
                                    onLoginSuccess(user.uid);
                                }
                                return false;
                            }
                        }
                    };

                    var ui = new firebaseui.auth.AuthUI(firebase.auth());
                    $('#progress').css('display', "none");
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

// function getUid() {
//     var url = new URL(window.location.href);
//     return url.searchParams.get("uid");
// }

function getDaysOfWeek() {
    var now = moment();
    var dayOfWeek = now.day();
    now.add( -dayOfWeek, 'd');
    var days = [];
    for(var i=0; i<6; i++){
        days.push(now.format('YYYYMMDD'));
        now.add(1, 'd');
    }
    return days;
}

function onLoginSuccess(uid) {
    var defaultDatabase = defaultApp.database();

    getDaysOfWeek().forEach(function (day) {
        console.log(day);
        var node = "usersParam/" + uid + "/" + day;
        defaultDatabase.ref(node).once('value').then(function(snapshot) {
            console.log(snapshot.toJSON());
        });
    });
}