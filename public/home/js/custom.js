firebase.initializeApp(CONFIG);

const CLIENT_ID = "60633268871-8nm9rv1hlobl0s2bptb4917b88j8vmar.apps.googleusercontent.com";
const NODE_CODE_CREATE_ACCOUNT = 'CREATE_ACCOUNT_FROM_WEB';
const ui = new firebaseui.auth.AuthUI(firebase.auth());

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
            return handleUIError(error);
        },
        uiShown: function () {
            console.log("uiShown");
            $('#spinner-fb').hide();
        }
    },
    credentialHelper: CLIENT_ID && CLIENT_ID != 'YOUR_OAUTH_CLIENT_ID' ?
        firebaseui.auth.CredentialHelper.GOOGLE_YOLO :
        firebaseui.auth.CredentialHelper.ACCOUNT_CHOOSER_COM,
    // Terms of service url.
    tosUrl: '../info/index.html#disclaimer',
    signInSuccessUrl: '../record/index.html'
};

firebase.auth().onAuthStateChanged(user => {
    if(user) {
        console.log("onAuthStateChanged", "user login");
        // window.location.href = "../record/index.html";
    } else
        ui.disableAutoSignIn();
});

(function () {
    const formName = $('#form_username');
    const formEmail = $('#form_email');
    const formPw = $('#form_pw');

    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(function() {
            ui.start('#firebaseui-auth-container', uiConfig);
        }).catch(function(error) {
        console.log(error.code, error.message);
        $('#about').hide();
    });

    showDefaultNtf();

    $('#firebase-register .mdl-button').on('click', function (e) {
        let name = formName.val();
        let email = formEmail.val();
        let pw = formPw.val();
        //todo 例外処理
        let key = firebase.database().ref('keyPusher').push().key;
        firebase.database().ref(makeRefScheme(['writeTask', key])).set({
            email: email,
            password: pw,
            displayName: name,
            code: NODE_CODE_CREATE_ACCOUNT,
            time: moment().format('YYYYMMDD')
        });
        return false;
    });
}());

function showDefaultNtf() {
    const isMobi = isMobile();
    const align = isMobi ? 'center' : 'right';
    let setting = {
        type: 'info',
        newest_on_top: true,
        placement: {
            align: align
        }
    };
    if (!isMobi){
        setting.delay = -1;
        setting.placement.from = 'bottom';
    }

    $.notify({
        title: '<strong>本サービスはβ版です</strong></br>',
        message: '不具合が発生したり、データが失われる場合があります。あらかじめご了承ください。',
    }, setting);
}

function getRecaptchaMode() {
    // Quick way of checking query params in the fragment. If we add more config
    // we might want to actually parse the fragment as a query string.
    return location.hash.indexOf('recaptcha=invisible') !== -1 ?
        'invisible' : 'normal';
}

function handleUIError(error) {
    showNotification(ERR_MSG_OPE_FAILED, 'danger');
    console.log(error.code, error.message);
}