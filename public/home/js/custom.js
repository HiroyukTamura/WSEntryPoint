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


// window.onGoogleYoloLoad = (googleyolo) => {
//     // The 'googleyolo' object is ready for use.
//     const retrievePromise = googleyolo.retrieve({
//         supportedAuthMethods: [
//             "https://accounts.google.com",
//             "googleyolo://id-and-password"
//         ],
//         supportedIdTokenProviders: [
//             {
//                 uri: "https://accounts.google.com",
//                 clientId: CLIENT_ID
//             }
//         ]
//     });
//
//     retrievePromise.then((credential) => {
//         if (credential.password) {
//             // An ID (usually email address) and password credential was retrieved.
//             // Sign in to your backend using the password.
//             firebase.auth().signInWithEmailAndPassword(credential.id, credential.password).then(() => {
//                 console.log("signInWithEmailAndPassword succeed", credential.id, credential.password);
//             }).catch(function(error) {
//                 //todo Handle Errors here.
//                 let errorCode = error.code;
//                 let errorMessage = error.message;
//             });
//             console.log("login succeed", credential.id, credential.password);
//         } else {
//             // A Google Account is retrieved. Since Google supports ID token responses,
//             // you can use the token to sign in instead of initiating the Google sign-in
//             // flow.
//             firebase.auth().useGoogleIdTokenForAuth(credential.idToken).then(() => {
//                 console.log("signInWithEmailAndPassword succeed", credential.id, credential.password);
//
//             }).catch(function(error) {
//                 //todo Handle Errors here.
//                 let errorCode = error.code;
//                 let errorMessage = error.message;
//             });
//             console.log("login succeed", credential.idToken);
//         }
//     }, (error) => {
//         //todo debug
//         // Credentials could not be retrieved. In general, if the user does not
//         // need to be signed in to use the page, you can just fail silently; or,
//         // you can also examine the error object to handle specific error cases.
//
//         // If retrieval failed because there were no credentials available, and
//         // signing in might be useful or is required to proceed from this page,
//         // you can call `hint()` to prompt the user to select an account to sign
//         // in or sign up with.
//
//         if (error.type === 'noCredentialsAvailable') {
//             googleyolo.hint({
//                 supportedAuthMethods: [
//                     "https://accounts.google.com"
//                 ],
//                 supportedIdTokenProviders: [
//                     {
//                         uri: "https://accounts.google.com",
//                         clientId: CLIENT_ID
//                     }
//                 ]
//             }).then((credential) => {
//                 if (credential.password) {
//                     // Send the token to your auth backend.
//                     signInWithEmailAndPassword(credential.id, credential.password).then(() => {
//                         console.log("signInWithEmailAndPassword succeed", credential.id, credential.password);
//                     }).catch(function(error) {
//                         //todo Handle Errors here.
//                         let errorCode = error.code;
//                         let errorMessage = error.message;
//                     });
//                     console.log(credential.password);
//                 } else  {
//                     useGoogleIdTokenForAuth(credential.idToken).then(() => {
//                         console.log("signInWithEmailAndPassword succeed", credential.id, credential.password);
//
//                     }).catch(function(error) {
//                         //todo Handle Errors here.
//                         let errorCode = error.code;
//                         let errorMessage = error.message;
//                     });
//                     console.log("login succeed", credential.idToken);
//                 }
//             }, (error) => {
//                 console.log("error 100", error.type);
//                 switch (error.type) {
//                     case "userCanceled":
//                         // The user closed the hint selector. Depending on the desired UX,
//                         // request manual sign up or do nothing.
//                         break;
//                     case "noCredentialsAvailable":
//                         // No hint available for the session. Depending on the desired UX,
//                         // request manual sign up or do nothing.
//                         break;
//                     case "requestFailed":
//                         // The request failed, most likely because of a timeout.
//                         // You can retry another time if necessary.
//                         break;
//                     case "operationCanceled":
//                         // The operation was programmatically canceled, do nothing.
//                         break;
//                     case "illegalConcurrentRequest":
//                         // Another operation is pending, this one was aborted.
//                         break;
//                     case "initializationError":
//                         // Failed to initialize. Refer to error.message for debugging.
//                         break;
//                     case "configurationError":
//                         // Configuration error. Refer to error.message for debugging.
//                         break;
//                     default:
//                     // Unknown error, do nothing.
//                 }
//             });
//         }
//     });
// };
//
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
        delay: -1
    };

    $.notify({
        title: '<strong>本サービスはβ版です</strong></br>',
        message: '不具合が発生したり、入力したデータが失われる場合があります。あらかじめご了承ください。'
    }, setting);
}

function getRecaptchaMode() {
    // Quick way of checking query params in the fragment. If we add more config
    // we might want to actually parse the fragment as a query string.
    return location.hash.indexOf('recaptcha=invisible') !== -1 ?
        'invisible' : 'normal';
}