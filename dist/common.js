const DEFAULT = 'DEFAULT';
const DELIMITER = "9mVSv";

const colors = ["#C0504D", "#9BBB59", "#1F497D", "#8064A2"];
const highlightColors = ["#D79599", "#C5D79D", "#5C8BBF", "#AEA3C5"];
const wodList = ["日", "月", "火", "水", "木", "金", "土"];
const HOLIDAYS = {
    "2017-01-01": "元日",
    "2017-01-02": "元日 振替休日",
    "2017-01-09": "成人の日",
    "2017-02-11": "建国記念の日",
    "2017-03-20": "春分の日",
    "2017-04-29": "昭和の日",
    "2017-05-03": "憲法記念日",
    "2017-05-04": "みどりの日",
    "2017-05-05": "こどもの日",
    "2017-07-17": "海の日",
    "2017-08-11": "山の日",
    "2017-09-18": "敬老の日",
    "2017-09-23": "秋分の日",
    "2017-10-09": "体育の日",
    "2017-11-03": "文化の日",
    "2017-11-23": "勤労感謝の日",
    "2017-12-23": "天皇誕生日",
    "2018-01-01": "元日",
    "2018-01-08": "成人の日",
    "2018-02-11": "建国記念の日",
    "2018-02-12": "建国記念の日 振替休日",
    "2018-03-21": "春分の日",
    "2018-04-29": "昭和の日",
    "2018-04-30": "昭和の日 振替休日",
    "2018-05-03": "憲法記念日",
    "2018-05-04": "みどりの日",
    "2018-05-05": "こどもの日",
    "2018-07-16": "海の日",
    "2018-08-11": "山の日",
    "2018-09-17": "敬老の日",
    "2018-09-23": "秋分の日",
    "2018-09-24": "秋分の日 振替休日",
    "2018-10-08": "体育の日",
    "2018-11-03": "文化の日",
    "2018-11-23": "勤労感謝の日",
    "2018-12-23": "天皇誕生日",
    "2018-12-24": "天皇誕生日 振替休日",
    "2019-01-01": "元日",
    "2019-01-14": "成人の日",
    "2019-02-11": "建国記念の日",
    "2019-03-21": "春分の日",
    "2019-04-29": "昭和の日",
    "2019-05-03": "憲法記念日",
    "2019-05-04": "みどりの日",
    "2019-05-05": "こどもの日",
    "2019-05-06": "こどもの日 振替休日",
    "2019-07-15": "海の日",
    "2019-08-11": "山の日",
    "2019-08-12": "山の日 振替休日",
    "2019-09-16": "敬老の日",
    "2019-09-23": "秋分の日",
    "2019-10-14": "体育の日",
    "2019-11-03": "文化の日",
    "2019-11-04": "文化の日 振替休日",
    "2019-11-23": "勤労感謝の日",
    "2019-12-23": "天皇誕生日"
};
//bootstrap_notifyで用いられるエラー
const ERR_MSG_OPE_FAILED = '処理に失敗しました';
const ERR_MSG_NULL_VAL = "項目名を入力してください";
const ERR_MSG_NO_INTERNET = 'インターネットに接続されていません';
const ERR_MSG_CONTAIN_BAD_CHAR = ["文字列「", "」は使用できません"];
const ERR_MSG_TRANSFER = '通信に失敗しました';

const INVITE_GROUP = 'INVITE_GROUP';
const ADD_GROUP_AS_INVITED ='ADD_GROUP_AS_INVITED';
const ADD_FRIEND = 'ADD_FRIEND';
const LEAVE_GROUP = 'LEAVE_GROUP';
const CREATE_GROUP = 'CREATE_GROUP';
const UPDATE_PROFILE = 'UPDATE_PROFILE';
const UPDATE_EMAIL = 'UPDATE_EMAIL';

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

function setElementAsMdl(clone) {
    var ele = clone.find(".mdl-pre-upgrade");
    for (var i=0; i<ele.length; i++){
        componentHandler.upgradeElement(ele.eq(i)[0]);
    }
}

function initDrawerDecoration() {
    $('.mdl-navigation .mdl-navigation__link:not(.current-page)').hover(function (e) {
        $(this).find('.drawer_icon').css('color', '#E57C3E');
        $(this).css('color', '#E57C3E');
    }, function (e) {
        $(this).find('.drawer_icon').css('color', '#757575');
        $(this).css('color', '#757575');
    });
}

function setDrawerProfile(loginedUser) {
    var photoUrl = avoidNullValue(loginedUser.photoURL, 'img/icon.png');
    $('.demo-avatar img').attr('src', photoUrl);
    var displayName = avoidNullValue(loginedUser.displayName, "ユーザ名未設定");
    $('.user-name').html(displayName);
}

function avoidNullValue(photoUrl, onErrVal) {
    if(!photoUrl || photoUrl === "null")
        return onErrVal;
    else
        return photoUrl;
}

function isValidAboutNullAndDelimiter(input, errSpan) {
    if (!input.val()){
        errSpan.html(ERR_MSG_NULL_VAL);
        input.parent().addClass('is-invalid').addClass('wrong-val');
        return false;
    }
    if (input.val().indexOf(DELIMITER) !== -1){
        errSpan.html(ERR_MSG_CONTAIN_BAD_CHAR.join(DELIMITER));
        input.parent().addClass('is-invalid').addClass('wrong-val');
        return false;
    }
    return true;
}

function showOpeErrNotification(defaultDatabase, delay) {
    var connectedRef = defaultDatabase.ref(".info/connected");
    connectedRef.on("value", function(snap) {
        if (snap.val() === false) {
            showNotification(ERR_MSG_NO_INTERNET, 'danger', delay);
        } else {
            showNotification(ERR_MSG_OPE_FAILED, 'danger', delay);
        }
    });
}

function getFileTypeImageUrl(type) {
    switch (type){
        case "text/plain":
        case "text/txt":
            return 'img/txt.png';
        case "text/html":
            return 'img/html.png';
        case "text/css":
            return 'img/css.png';
        case "text/xml":
            return 'img/xml.png';
        case "application/pdf":
            return 'img/pdf.png';
        case "image/jpeg":
            return 'img/jpg.png';
        case "image/png":
            return 'img/png.png';
        case "image/gif":
            return 'img/file.png';
    }
}

function getFileFromTranfer(e) {
    if(e.originalEvent && e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files){
        return e.originalEvent.dataTransfer.files[0];
    } else {
        return e.target.files[0];
    }
}

function createFbCommandObj(code, userUid) {
    return {
        whose: userUid,
        time: moment().format('YYYYMMDD'),
        code: code
    };
}