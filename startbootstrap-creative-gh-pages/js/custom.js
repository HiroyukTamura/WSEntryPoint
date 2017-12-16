var config = {
    apiKey: "AIzaSyBQnxP9d4R40iogM5CP0_HVbULRxoD2_JM",
    authDomain: "wordsupport3.firebaseapp.com",
    databaseURL: "https://wordsupport3.firebaseio.com",
    projectId: "wordsupport3",
    storageBucket: "wordsupport3.appspot.com",
    messagingSenderId: "60633268871"
};

firebase.initializeApp(config);

var uiConfig = {
    signInSuccessUrl: '../front/front.php',
    signInOptions: [
        // Leave the lines as is for the providers you want to offer your users.
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        firebase.auth.PhoneAuthProvider.PROVIDER_ID
    ],
    // Terms of service url.
    tosUrl: 'samplaTosUrl',
    'callbacks': {
        // Called when the user has been successfully signed in.
        'signInSuccess': function(user, credential, redirectUrl) {
            console.log(user.uid);
            redirectUrl = '../front/front.php' + "?uid=" + user.uid;
            window.location.href = redirectUrl;
            return false;
        }
    }
};

// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());
// The start method will wait until the DOM is loaded.
ui.start('#firebaseui-auth-container', uiConfig);