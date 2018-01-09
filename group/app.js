const postLoad = $('#post_load');
const DEFAULT = 'DEFAULT';
var progress = $('#progress');
const dialog = $('dialog')[0];
const timeline = $(".mdl-cell.mdl-cell--9-col");
var asyncCount = 0;
var defaultApp;
var defaultDatabase;
var user;
var groupJson;
var groupNodeJson;
var groupKey;
var isModalOpen = false;
var imgUrlMap = {};

function init() {

    var config = {
        apiKey: "AIzaSyBQnxP9d4R40iogM5CP0_HVbULRxoD2_JM",
        authDomain: "wordsupport3.firebaseapp.com",
        databaseURL: "https://wordsupport3.firebaseio.com",
        projectId: "wordsupport3",
        storageBucket: "wordsupport3.appspot.com",
        messagingSenderId: "60633268871"
    };
    defaultApp = firebase.initializeApp(config);
    defaultDatabase = defaultApp.database();

    firebase.auth().onAuthStateChanged(function(userObject) {
        if (userObject) {
            console.log("ユーザログインしてます");
            // progress.css("display", "none");
            user = userObject;
            onLoginSuccess();
        } else {
            firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                .then(function() {
                    var uiConfig = {
                        signInOptions: [
                            // Leave the lines as is for the providers you want to offer your users.
                            firebase.auth.GoogleAuthProvider.PROVIDER_ID,
                            firebase.auth.TwitterAuthProvider.PROVIDER_ID,
                            firebase.auth.EmailAuthProvider.PROVIDER_ID,
                            firebase.auth.PhoneAuthProvider.PROVIDER_ID
                        ],
                        // Terms of service url.
                        tosUrl: 'sampleTosUrl',
                        'callbacks': {
                            // Called when the user has been successfully signed in.
                            'signInSuccess': function(userObject, credential, redirectUrl) {
                                console.log(userObject);
                                user = userObject;
                                progress.css('display', "none");
                                $('#login_w').css('display', "none");
                                onLoginSuccess();
                                return false;
                            }
                        }
                    };

                    var ui = new firebaseui.auth.AuthUI(firebase.auth());
                    progress.css('display', "none");
                    $('#login_w').css('display', "inline");
                    ui.start('#firebaseui-auth-container', uiConfig);
                }).catch(function(error) {
                var errorCode = error.code;
                var errorMessage = error.message;
                console.log(errorCode, errorMessage);
                //todo エラー時の処理
            });
        }
    });
}

function onLoginSuccess() {
    if (!dialog.showModal) {
        dialogPolyfill.registerDialog(dialog);
    }

    groupKey = getGroupKey();
    console.log("onLoginSuccess:", user, groupKey);

    defaultDatabase.ref("group/" + groupKey).once("value").then(function (snapshot) {
        onGetGroupSnap(snapshot);
    });

    defaultDatabase.ref("userData/" + user.uid + "/group").once("value").then(function (snapshot) {
       onGetSnapOfGroupNode(snapshot);
    });

    //init dialog
    $(dialog).find(".close").on("click", function (e) {
        closeDialog();
    });
    $(dialog).find('#positive-btn').on("click", function (e) {
        console.log("click", "positive-btn");
        closeDialog();
    });
    window.onclick = function(event) {
        console.log("window.onclick");
        if (event.target == dialog) {
            closeDialog();
        }
    }
}

function onGetGroupSnap(snapshot) {
    if(!snapshot.exists()){
        // todo エラー処理
        console.log("snapShot存在せず" + snapshot);
        return;
    }

    groupJson = snapshot.toJSON();
    console.log(groupJson);
    
    initUserList();
    initContents();

    showAll();
}

function initUserList() {
    //userListを整備
    var userList = $('.card.user-list .mdl-list');
    var dpList = $('#dp-list');
    var keys = Object.keys(groupJson.member);
    var img = $(dialog).find('img');
    var userName = $(dialog).find('h4');

    keys.forEach(function (key) {
        if(key === DEFAULT || key === user.uid)
            return;

        var member = groupJson["member"][key];
        var photoUrl = avoidNullValue(member.photoUrl, 'img/icon.png');
        var li = $(
            '<li class="mdl-list__item mdl-pre-upgrade">'+
                '<span class="mdl-list__item-primary-content mdl-pre-upgrade">'+
                    '<img src="'+ photoUrl +'" alt="user-image">'+
                        '<span>'+ member.name +'</span>'+
                '</span>'+
                '<span class="mdl-list__item-secondary-action">'+
                    '<button id="'+ key +'" class="mdl-button mdl-js-button mdl-button--icon mdl-pre-upgrade">'+
                        '<I class="material-icons">more_vert</i>'+
                    '</button>'+
                '</span>'+
            '</li>'
        );

        if(!member.isChecked){//todo isCheckedなのか、isAddedなのか
            li.find('.mdl-list__item-secondary-action').remove();
            li.css('background-color', "#f9e4d8");
            li.attr("title", "招待中");
        } else {
            var dropDown = $(
                '<ul class="mdl-menu mdl-menu--bottom-right mdl-js-menu mdl-js-ripple-effect mdl-pre-upgrade" for="'+ key +'">'+
                '<li class="mdl-menu__item mdl-pre-upgrade">グループから退会させる</li>'+
                '</ul>'
            );

            dropDown.find('.mdl-menu__item').on("click", function (e) {
                if(!isModalOpen){
                    var index = $(this).index();
                    for(index; index < keys.length; index++){
                        if(keys[index] === DEFAULT || keys[index] ===  user.uid)
                            continue;
                        break;
                    }
                    var photoUrl = groupJson['member'][keys[index]]['photoUrl'];
                    img.attr('src', avoidNullValue(photoUrl, 'img/icon.png'));
                    var userNameVal = groupJson['member'][keys[index]]['name'];
                    userName.html(avoidNullValue(userNameVal, "ユーザ名未設定"));

                    openDialog();
                }
            });

            dpList.append(dropDown);
        }

        userList.append(li);
    });
}

function initContents() {
    if(!groupJson.contents){
        //todo データがない旨表示
        return;
    }

    for (var key in groupJson.contents){
        if(!groupJson.contents.hasOwnProperty(key))
            return;

        var contentData = groupJson["contents"][key];
        console.log(contentData);
        switch (contentData.type){
            case "image/jpeg":
                new initContentsAsImg(contentData, key);
                break;
        }
    }
}

var initContentsAsImg = function(contentData, key) {
    var ele = createHtmlAsData();
    var ymd = moment(contentData.lastEdit, "YYYYMMDD").format("YYYY.MM.DD");
    var userName = groupJson["member"][contentData.lastEditor]["name"];//todo 辞めた人間はどうする？？
    ele.find('.event_title').html(userName + " at " + ymd);
    var liText = ele.find(".mdl-list__item-primary-content");
    liText.eq(0).html(contentData.contentName);
    if(contentData.comment){
        liText.eq(1).html(contentData.comment);
    }
    timeline.append(ele);
    var img = ele.find('.show-img img');
    firebase.storage().ref("shareFile/" + groupKey +"/"+ key).getDownloadURL().then(function(url) {
        // Insert url into an <img> tag to "download"
        img.attr("src", url);
    }).catch(function(error) {
        // A full list of error codes is available at
        // https://firebase.google.com/docs/storage/web/handle-errors
        switch (error.code) {
            case 'storage/object_not_found':
                // File doesn't exist
                break;

            case 'storage/unauthorized':
                // User doesn't have permission to access the object
                break;

            case 'storage/canceled':
                // User canceled the upload
                break;
            case 'storage/unknown':
                // Unknown error occurred, inspect the server response
                break;
        }
    });
};

function createHtmlAsData() {
    return $(
        '<div class="card file">'+
            '<div class="ele_header">'+
                '<i class="fas fa-comments fa-lg ele-icon"></i>'+
                '<span class="event_title">田村ピロシキ at 2017.4.5</span>'+
                '<div class="mdl-layout-spacer mdl-pre-upgrade"></div>'+
                '<button class="mdl-button mdl-js-button mdl-button--icon remove_btn ele_header_button mdl-pre-upgrade">'+
                    '<i class="fas fa-times"></i>'+
                '</button>'+
                '<button class="mdl-button mdl-js-button mdl-button--icon arrow_down ele_header_button mdl-pre-upgrade">'+
                    '<i class="fas fa-angle-down">'+'</i>'+
                '</button>'+
                '<button class="mdl-button mdl-js-button mdl-button--icon arrow_up ele_header_button mdl-pre-upgrade">'+
                    '<i class="fas fa-angle-up"></i>'+
                '</button>'+
            '</div>'+

            '<div class="flex-box file-wrapper">'+
                '<img class="file-icon" src="img/icon.png" alt="file-icon">'+
                '<ul class="demo-list-three mdl-list mdl-pre-upgrade">'+
                    '<li class="mdl-list__item mdl-list__item--three-line mdl-pre-upgrade">'+
                        '<span class="mdl-list__item-primary-content mdl-pre-upgrade">'+
                            '<span>image.jpg</span>'+
                            '<span class="mdl-list__item-text-body mdl-pre-upgrade">事務所の地図あげておきます</span>'+
                        '</span>'+
                        '<span class="mdl-list__item-secondary-content mdl-pre-upgrade">'+
                            '<button id="hogehogeef" class="mdl-button mdl-js-button mdl-button--ico mdl-pre-upgrade">'+
                                '<i class="material-icons">more_ver</i>'+
                            '</button>'+
                        '</span>'+
                    '</li>'+
                '</ul>'+
            '</div>'+
            '<div class="show-img">'+
                '<img src="img/icon.png" alt="file-icon">'+
            '</div>'+
        '</div>');
}

function closeDialog() {
    dialog.close();
    isModalOpen = false;
}

function openDialog() {
    isModalOpen = true;
    dialog.showModal();
}

function getGroupKey() {
    var url = new URL(window.location.href);
    return url.searchParams.get("key");
}

function avoidNullValue(photoUrl, onErrVal) {
    if(photoUrl === "null")
        return onErrVal;
    else
        return photoUrl;
}

function onGetSnapOfGroupNode(snapshot) {
    if(!snapshot.exists()){
        // todo エラー処理
        console.log("snapShot存在せず" + snapshot);
        return;
    }

    groupNodeJson = snapshot.toJSON();
    var ul = $("#group-dp-ul");
    var count = 0;
    Object.values(groupNodeJson).forEach(function (value) {
        if(value === DEFAULT || !value.added)
            return;

        $('<li>', {
            class: "mdl-menu__item"
        }).html(value.name).appendTo(ul);

        count++;
    });

    if(count !== 0){
        $("#group-drp-btn").css('display', '');
    }

    showAll();
}

function setElementAsMdl(clone) {
    var ele = clone.find(".mdl-pre-upgrade");
    for (var i=0; i<ele.length; i++){
        componentHandler.upgradeElement(ele.eq(i)[0]);
    }
}

function showAll() {
    if(asyncCount !== 1){
        asyncCount++;
        return;
    }

    setElementAsMdl($('body'));

    tippy('[title]', {
        updateDuration: 0,
        popperOptions: {
            modifiers: {
                preventOverflow: {
                    enabled: false
                }
            }
        }
    });
}