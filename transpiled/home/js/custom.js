"use strict";

var config = {
    apiKey: "AIzaSyBQnxP9d4R40iogM5CP0_HVbULRxoD2_JM",
    authDomain: "wordsupport3.firebaseapp.com",
    databaseURL: "https://wordsupport3.firebaseio.com",
    projectId: "wordsupport3",
    storageBucket: "wordsupport3.appspot.com",
    messagingSenderId: "60633268871"
};

var CLIENT_ID = "60633268871-kf9j3roee7lk81521rs9r0vq77mrjagd.apps.googleusercontent.com";

firebase.initializeApp(config);

window.onGoogleYoloLoad = function (googleyolo) {
    // The 'googleyolo' object is ready for use.
    var retrievePromise = googleyolo.retrieve({
        supportedAuthMethods: ["https://accounts.google.com", "googleyolo://id-and-password"],
        supportedIdTokenProviders: [{
            uri: "https://accounts.google.com",
            clientId: "60633268871-kf9j3roee7lk81521rs9r0vq77mrjagd.apps.googleusercontent.com"
        }]
    });

    if (error.type === 'noCredentialsAvailable') {
        googleyolo.hint({
            supportedAuthMethods: ["https://accounts.google.com"],
            supportedIdTokenProviders: [{
                uri: "https://accounts.google.com",
                clientId: "60633268871-kf9j3roee7lk81521rs9r0vq77mrjagd.apps.googleusercontent.com"
            }]
        }).then(function (credential) {
            if (credential.idToken) {
                // Send the token to your auth backend.
                useGoogleIdTokenForAuth(credential.idToken);
            }
        }, function (error) {
            switch (error.type) {
                case "userCanceled":
                    // The user closed the hint selector. Depending on the desired UX,
                    // request manual sign up or do nothing.
                    break;
                case "noCredentialsAvailable":
                    // No hint available for the session. Depending on the desired UX,
                    // request manual sign up or do nothing.
                    break;
                case "requestFailed":
                    // The request failed, most likely because of a timeout.
                    // You can retry another time if necessary.
                    break;
                case "operationCanceled":
                    // The operation was programmatically canceled, do nothing.
                    break;
                case "illegalConcurrentRequest":
                    // Another operation is pending, this one was aborted.
                    break;
                case "initializationError":
                    // Failed to initialize. Refer to error.message for debugging.
                    break;
                case "configurationError":
                    // Configuration error. Refer to error.message for debugging.
                    break;
                default:
                // Unknown error, do nothing.
            }
        });
    }

    // retrievePromise.then((credential) => {
    //     if (credential.password) {
    //         // An ID (usually email address) and password credential was retrieved.
    //         // Sign in to your backend using the password.
    //         firebase.auth().signInWithEmailAndPassword(credential.id, credential.password).then(() => {
    //             console.log("signInWithEmailAndPassword succeed", credential.id, credential.password);
    //
    //         }).catch(function(error) {
    //             //todo Handle Errors here.
    //             let errorCode = error.code;
    //             let errorMessage = error.message;
    //
    //         });
    //         console.log("login succeed", credential.id, credential.password);
    //     } else {
    //         // A Google Account is retrieved. Since Google supports ID token responses,
    //         // you can use the token to sign in instead of initiating the Google sign-in
    //         // flow.
    //         firebase.auth().useGoogleIdTokenForAuth(credential.idToken).then(() => {
    //             console.log("signInWithEmailAndPassword succeed", credential.id, credential.password);
    //
    //         }).catch(function(error) {
    //             //todo Handle Errors here.
    //             let errorCode = error.code;
    //             let errorMessage = error.message;
    //         });
    //         console.log("login succeed", credential.idToken);
    //     }
    // }, (error) => {
    //     //todo debug
    //     // Credentials could not be retrieved. In general, if the user does not
    //     // need to be signed in to use the page, you can just fail silently; or,
    //     // you can also examine the error object to handle specific error cases.
    //
    //     // If retrieval failed because there were no credentials available, and
    //     // signing in might be useful or is required to proceed from this page,
    //     // you can call `hint()` to prompt the user to select an account to sign
    //     // in or sign up with.
    // });
};

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        console.log("onAuthStateChanged", "user login");
        window.location.href = "../../../public/record/index.html";
    }
});

var uiConfig = {
    // signInSuccessUrl: '../front/front.php',
    signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    firebase.auth.GoogleAuthProvider.PROVIDER_ID, firebase.auth.TwitterAuthProvider.PROVIDER_ID, firebase.auth.EmailAuthProvider.PROVIDER_ID, firebase.auth.PhoneAuthProvider.PROVIDER_ID],
    // Terms of service url.
    tosUrl: 'https://github.com/HiroyukTamura/WSEntryPoint/wiki/%E3%83%97%E3%83%A9%E3%82%A4%E3%83%90%E3%82%B7%E3%83%BC%E3%83%9D%E3%83%AA%E3%82%B7%E3%83%BC',
    signInSuccessUrl: '../record/index.html'
};

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(function () {
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start('#firebaseui-auth-container', uiConfig);
}).catch(function (error) {
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
    var setting = {
        type: 'info',
        newest_on_top: true,
        delay: -1
    };

    $.notify({
        title: '<strong>本サービスはβ版です</strong></br>',
        message: '不具合が発生したり、入力したデータが失われる場合があります。あらかじめご了承ください。'
    }, setting);
}
//# sourceMappingURL=custom.js.map