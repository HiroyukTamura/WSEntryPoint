const DEFAULT = 'DEFAULT';
const DELIMITER = "9mVSv";
const colors = ["#C0504D", "#9BBB59", "#1F497D", "#8064A2"];
const highlightColors = ["#D79599", "#C5D79D", "#5C8BBF", "#AEA3C5"];
const CONFIG = {
    apiKey: "AIzaSyBQnxP9d4R40iogM5CP0_HVbULRxoD2_JM",
    authDomain: "wordsupport3.firebaseapp.com",
    databaseURL: "https://wordsupport3.firebaseio.com",
    projectId: "wordsupport3",
    storageBucket: "wordsupport3.appspot.com",
    messagingSenderId: "60633268871"
};

Array.prototype.move = function(from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};

function makeRefScheme(parasArr) {
    return parasArr.join('/');
}

function showNotification(msg, type) {
    $.notify({
        title: '<i class="fas fa-info-circle fa-lg"></i>',
        message: '  ' + msg
    },{
        type: type
    });
}