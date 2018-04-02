let config = {
    apiKey: "AIzaSyBQnxP9d4R40iogM5CP0_HVbULRxoD2_JM",
    authDomain: "wordsupport3.firebaseapp.com",
    databaseURL: "https://wordsupport3.firebaseio.com",
    projectId: "wordsupport3",
    storageBucket: "wordsupport3.appspot.com",
    messagingSenderId: "60633268871"
};

const CLIENT_ID = "60633268871-8nm9rv1hlobl0s2bptb4917b88j8vmar.apps.googleusercontent.com";

firebase.initializeApp(config);

const ui = new firebaseui.auth.AuthUI(firebase.auth());

firebase.auth().onAuthStateChanged(user => {
    if(user) {
        console.log("onAuthStateChanged", "user login");
        // window.location.href = "../record/index.html";
    } else {
        ui.disableAutoSignIn();
    }
});

const uiConfig = {
    signInOptions: [
        // Leave the lines as is for the providers you want to offer your users.
        firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        {
            provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
            defaultCountry: 'JP',
            recaptchaParameters: {
                size: getRecaptchaMode()
            }
        },
        {
            provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            // Required to enable this provider in One-Tap Sign-up.
            authMethod: 'https://accounts.google.com',
            // Required to enable ID token credentials for this provider.
            clientId: CLIENT_ID
        },
    ],
    callbacks: {
        signInFailure: function(error) {
            // Some unrecoverable error occurred during sign-in.
            // Return a promise when error handling is completed and FirebaseUI
            // will reset, clearing any UI. This commonly occurs for error code
            // 'firebaseui/anonymous-upgrade-merge-conflict' when merge conflict
            // occurs. Check below for more details on this.
            // todo エラー処理
            console.log(error.message);
            // return handleUIError(error);
        },
        uiShown: function () {
            $('.firebaseui-list-item').eq(1).find('.firebaseui-idp-text-long').html('メールアドレスでログイン・会員登録');
            console.log("uiShown");
        }
    },
    credentialHelper: CLIENT_ID && CLIENT_ID != 'YOUR_OAUTH_CLIENT_ID' ?
        firebaseui.auth.CredentialHelper.GOOGLE_YOLO :
        firebaseui.auth.CredentialHelper.ACCOUNT_CHOOSER_COM,
    // Terms of service url.
    tosUrl: 'https://github.com/HiroyukTamura/WSEntryPoint/wiki/%E3%83%97%E3%83%A9%E3%82%A4%E3%83%90%E3%82%B7%E3%83%BC%E3%83%9D%E3%83%AA%E3%82%B7%E3%83%BC',//todo tos変更すること
    signInSuccessUrl: '../record/index.html'
};

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(function() {
        ui.start('#firebaseui-auth-container', uiConfig);

    }).catch(function(error) {
        console.log(error.code, error.message);
        $('#about').hide();
    });

showDefaultNtf();

$('#firebase-register .mdl-button').on('click', function (e) {
    $(this).css('visibility', 'hidden');
    $('.firebaseui-idp-button[data-provider-id="password"]').click();
    return false;
});

function showDefaultNtf() {
    let setting = {
        type: 'info',
        newest_on_top: true,
        delay: -1,
        placement: {
            from: "bottom",
            align: "right"
        }
    };

    $.notify({
        title: '<strong>本サービスはβ版です</strong></br>',
        message: '不具合が発生したり、入力したデータが失われる場合があります。あらかじめご了承ください。',
    }, setting);
}

function getRecaptchaMode() {
    // Quick way of checking query params in the fragment. If we add more config
    // we might want to actually parse the fragment as a query string.
    return location.hash.indexOf('recaptcha=invisible') !== -1 ?
        'invisible' : 'normal';
}