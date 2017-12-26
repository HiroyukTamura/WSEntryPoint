function getDaysOfWeek() {
    var now = moment();
    var dayOfWeek = now.getDay();
    now.add('d', -dayOfWeek);
    var days = [];
    for(var i=0; i<6; i++){
        days.push(now);
        now.add('d', 1);
    }
    return days;
}

function init() {
    var config = {
        apiKey: "AIzaSyBQnxP9d4R40iogM5CP0_HVbULRxoD2_JM",
        authDomain: "wordsupport3.firebaseapp.com",
        databaseURL: "https://wordsupport3.firebaseio.com",
        projectId: "wordsupport3",
        storageBucket: "wordsupport3.appspot.com",
        messagingSenderId: "60633268871"
    };
    var defaultApp = firebase.initializeApp(config);
    var defaultDatabase = defaultApp.database();

    console.log(getUid());
}

function getUid() {
    var url = new URL(window.location.href);
    return url.searchParams.get("uid");
}