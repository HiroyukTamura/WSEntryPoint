"use strict";

var DEFAULT = 'DEFAULT';
var DELIMITER = "9mVSv";

var colors = ["#C0504D", "#9BBB59", "#1F497D", "#8064A2"];
var highlightColors = ["#D79599", "#C5D79D", "#5C8BBF", "#AEA3C5"];
var wodList = ["日", "月", "火", "水", "木", "金", "土"];
var HOLIDAYS = {
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
var ERR_MSG_OPE_FAILED = '処理に失敗しました';
var ERR_MSG_NULL_VAL = "項目名を入力してください";
var ERR_MSG_NO_INTERNET = 'インターネットに接続されていません';
var ERR_MSG_CONTAIN_BAD_CHAR = ["文字列「", "」は使用できません"];
var ERR_MSG_TRANSFER = '通信に失敗しました';

var SUCCESS_MSG_SAVE = '保存しました';

var INVITE_GROUP = 'INVITE_GROUP';
var ADD_GROUP_AS_INVITED = 'ADD_GROUP_AS_INVITED';
var ADD_FRIEND = 'ADD_FRIEND';
var LEAVE_GROUP = 'LEAVE_GROUP';
var CREATE_GROUP = 'CREATE_GROUP';
var UPDATE_PROFILE = 'UPDATE_PROFILE';
var UPDATE_EMAIL = 'UPDATE_EMAIL';
var UPDATE_DISPLAY_NAME = 'UPDATE_DISPLAY_NAME';
var UPDATE_PROF_PHOTO = 'UPDATE_PROF_PHOTO';
var ADD_DOC_COMMENT = 'ADD_DOC_COMMENT';

var UNSET_USER_NAME = 'ユーザ名未設定';
var UNSET_EMAIL = 'アドレス未設定';

var NTF_FILE_IMG_W = 'JPEG・PNG・GIFファイルのみアップロードできます';
var NTF_LIMIT_SIZE5 = '5MBを超えるファイルはアップロードできません';
var NTF_UPDATED_PROF_IMG = 'プロフィール画像を変更しました';
var NTF_DELETE_SCHE = 'スケジュールを削除しました';

var CONFIG = {
    apiKey: "AIzaSyBQnxP9d4R40iogM5CP0_HVbULRxoD2_JM",
    authDomain: "wordsupport3.firebaseapp.com",
    databaseURL: "https://wordsupport3.firebaseio.com",
    projectId: "wordsupport3",
    storageBucket: "wordsupport3.appspot.com",
    messagingSenderId: "60633268871"
};

Array.prototype.move = function (from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};

function makeRefScheme(parasArr) {
    return parasArr.join('/');
}

function showNotification(msg, type, delay) {
    var icon = null;
    switch (type) {
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
    if (delay) setting['delay'] = delay;

    $.notify({
        title: icon,
        message: '  ' + msg
    }, setting);
}

function setElementAsMdl(clone) {
    var ele = clone.find(".mdl-pre-upgrade");
    for (var i = 0; i < ele.length; i++) {
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
    var photoUrl = avoidNullValue(loginedUser.photoURL, '../dist/img/icon.png');
    $('.demo-avatar img').attr('src', photoUrl);
    var displayName = avoidNullValue(loginedUser.displayName, "ユーザ名未設定");
    $('.user-name').html(displayName);

    $('#accbtn').show();

    $('#dr-header-logout').on('click', function (e) {
        e.preventDefault();
        firebase.auth().signOut().then(function () {
            window.location.href = '../home/';
        }).catch(function (error) {
            onErrorAuth(error);
        });
        return false;
    });

    $('#analytics-link').on('click', function (e) {
        e.preventDefault();
        if (!$(this).hasClass('.current-page')) window.location.href = '../analytics/index.html?key=' + loginedUser.uid;
        return false;
    });

    $('.current-page').on('click', function (e) {
        e.preventDefault();
        return false;
    });
}

function avoidNullValue(photoUrl, onErrVal) {
    if (!photoUrl || photoUrl === "null") return onErrVal;else return photoUrl;
}

function isValidAboutNullAndDelimiter(input, errSpan) {
    if (!input.val()) {
        errSpan.html(ERR_MSG_NULL_VAL);
        input.parent().addClass('is-invalid').addClass('wrong-val');
        return false;
    }
    if (input.val().indexOf(DELIMITER) !== -1) {
        errSpan.html(ERR_MSG_CONTAIN_BAD_CHAR.join(DELIMITER));
        input.parent().addClass('is-invalid').addClass('wrong-val');
        return false;
    }
    return true;
}

function showOpeErrNotification(defaultDatabase, delay) {
    var connectedRef = defaultDatabase.ref(".info/connected");
    connectedRef.on("value", function (snap) {
        if (snap.val() === true) {
            showNotification(ERR_MSG_OPE_FAILED, 'danger', delay);
        } else {
            showNotification(ERR_MSG_NO_INTERNET, 'danger', delay);
        }
    });
}

function getFileTypeImageUrl(type) {
    switch (type) {
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
    if (e.originalEvent && e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files) {
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

function onErrorAuth(error) {
    switch (error.code) {
        case 'auth/wrong-password':
            showNotification('パスワードが間違っています', 'warning');
            break;
        case 'auth/network-request-failed':
            showNotification('通信に失敗しました', 'warning');
            break;
        case 'auth/too-many-requests':
            showNotification('アクセスが集中しています。時間をおいて再度試してみてください。', 'warning');
            break;
        case 'auth/web-storage-unsupported':
            showNotification('ブラウザがウェブストレージを許可していません。設定を変更するか、別のブラウザでアクセスしてください。', 'warning');
            break;
        default:
            showOpeErrNotification(defaultDatabase);
            break;
    }
}

function createFbUiConfig(onSignInSuccess) {
    return {
        signInOptions: [
        // Leave the lines as is for the providers you want to offer your users.
        firebase.auth.GoogleAuthProvider.PROVIDER_ID, firebase.auth.TwitterAuthProvider.PROVIDER_ID, firebase.auth.PhoneAuthProvider.PROVIDER_ID, {
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
            requireDisplayName: false
        }],
        // Terms of service url.
        tosUrl: 'https://github.com/HiroyukTamura/ChallengedKit/wiki/%E3%83%97%E3%83%A9%E3%82%A4%E3%83%90%E3%82%B7%E3%83%BC%E3%83%9D%E3%83%AA%E3%82%B7%E3%83%BC',
        'callbacks': {
            // Called when the user has been successfully signed in.
            'signInSuccess': onSignInSuccess
        }
    };
}
//# sourceMappingURL=common.js.map