const DEFAULT = 'DEFAULT';
const DELIMITER = "9mVSv";
const colors = ["#C0504D", "#9BBB59", "#1F497D", "#8064A2"];
const highlightColors = ["#D79599", "#C5D79D", "#5C8BBF", "#AEA3C5"];
const ERR_MSG_OPE_FAILED = '処理に失敗しました';
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

function showNotification(msg, type, delay) {
    var icon = null;
    switch (type){
        case 'danger':
        case 'warning':
            icon = '<i class="fas fa-info-circle fa-lg"></i>';
            break;
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
    }

    var setting = {
        type: type,
        newest_on_top: true
    };
    if(delay)
        setting['delay'] = delay;

    $.notify({
        title: icon,
        message: '  ' + msg
    }, setting);
}