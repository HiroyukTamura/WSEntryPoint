"use strict";

const ERR_MSG_GROUP = "メンバーが一人も選択されていません";
const postLoad = $('#post_load');
const progress = $('#progress');
const createGroupC = $('#create-group');
const addGroupC = $('#add-group');
const dialog = $('#add-group-dialog')[0];
const dialogPsBtn = $('#add-group-btn');
const dialogNgBtn = $('#cancel');
var initialErr = false;
var currentDialogShown;
var defaultApp;
var defaultDatabase;
var user;
var fbCoumpleteCount = 0;
var userDataJson;

window.onload = function (ev) {
    defaultApp = firebase.initializeApp(CONFIG);
    defaultDatabase = defaultApp.database();

    firebase.auth().onAuthStateChanged(function(userObject) {
        if (userObject) {
            console.log("ユーザログインしてます");
            progress.hide();
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
                                user = userObject;
                                progress.hide();
                                $('#login_w').hide();
                                return false;
                            }
                        }
                    };

                    var ui = new firebaseui.auth.AuthUI(firebase.auth());
                    progress.hide();
                    $('#login_w').show();
                    ui.start('#firebaseui-auth-container', uiConfig);

                }).catch(function(error) {
                    console.log(error.code, error.message);
                    showOpeErrNotification(defaultDatabase, -1);
            });
        }
    });

    initDrawerDecoration();
};

function onLoginSuccess() {
    postLoad.show();

    setDrawerProfile(user);

    console.log("onLoginSuccess:", user);

    defaultDatabase.ref("userData/" + user.uid).once("value").then(function (snapshot) {
        onGetGroupNodeData(snapshot);
        showAll();
    }).catch(function (reason) {
        console.log(reason);
        onSnapShotVanished();
    });

    defaultDatabase.ref("friend/" + user.uid).once("value").then(function (snapshot) {
        onGetFriendSnap(snapshot);
        showAll();
    }).catch(function (reason) {
        console.log(reason);
        onSnapShotVanished();
    });

    setOnClickEditProfBtn();
}

function onSnapShotVanished() {
    if (!initialErr)
        showOpeErrNotification(defaultDatabase, -1);
    initialErr = true;
}

function onGetGroupNodeData(snapshot) {
    if(!snapshot.exists()){
        showNotification(ERR_MSG_OPE_FAILED, 'danger', -1);
        console.log("snapShot存在せず" + snapshot);
        fbCoumpleteCount++;
        return;
    }

    userDataJson = snapshot.toJSON();

    //グループに参加していない場合
    if(snapshot.child("group").numChildren() === 1){
        $("#group .group-w-title-w p").show();
    }

    var sectionGroup = $('#group');

    snapshot.child("group").forEach(function (childSnap) {
        console.log("groupKey", childSnap.key);

        if(childSnap.key === DEFAULT)
            return;

        var groupName = avoidNullValue(childSnap.child("name").val(), "ユーザ名未設定");
        var groupPhotoUrl = avoidNullValue(childSnap.child('photoUrl').val(), "img/icon.png");


        if(childSnap.child('added').val() == true) {

            // todo 未読を記録するnodeを作らないとね
            var html = $(
                '<div class="demo-card-image mdl-card mdl-shadow--2dp mdl-pre-upgrade">'+
                    '<div class="mdl-card__title mdl-card--expand mdl-pre-upgrade"></div>'+
                        '<div class="mdl-card__actions mdl-pre-upgrade">'+
                            '<span class="demo-card-image__filename mdl-pre-upgrade">'+groupName+'</span>'+
                        '</div>'+
                    '</div>'+
                '</div>');

            // $('#group #add-btn-w').insertBefore($(html));
            html.css('background', photoUrl);
            html.insertBefore($('#group #add-btn-w'));

        } else {
            var section = $(
                '<section class="notification">'+
                    '<div>'+
                        '<ul class="demo-list-two mdl-list mdl-pre-upgrade">'+
                            '<li class="mdl-list__item mdl-list__item--three-line mdl-pre-upgrade">'+
                                '<span class="mdl-list__item-primary-content mdl-pre-upgrade">'+
                                    '<img class="invite-group-icon rounded-circle mdl-list__item-avatar mdl-shadow--2dp mdl-pre-upgrade" src="'+ groupPhotoUrl +'">'+
                                    '<span>'+ groupName +'</span>'+
                                    '<span class="mdl-list__item-text-body mdl-pre-upgrade">'+
                                        '<span class="sub-title">グループに招待されています</span>'+
                                            '<span class="tool-tips"></span>'+
                                        '</span>'+
                                    '</span>'+
                                '</span>'+
                            '</li>'+
                            '<li class="mdl-list__item btns-li">'+
                                '<span class="mdl-list__item-secondary-content mdl-pre-upgrade">'+
                                    '<button class="mdl-button mdl-js-button mdl-button--colored add-btn mdl-pre-upgrade">参加する</button>'+
                                    '<button class="mdl-button mdl-js-button mdl-button--colored reject-btn mdl-pre-upgrade">拒否する</button>'+
                                '</span>'+
                            '</li>'+
                        '</ul>'+
                    '</div>'+
                    '<hr class="seem">'+
                '</section>'
            );

            var tooltips = section.find('.tool-tips');
            defaultDatabase.ref(makeRefScheme(['group', childSnap.key, 'member'])).once('value').then(function (memberSnap) {
                if (!memberSnap.exists())
                    return;//グループにメンバーがいない→メンバーから全員が退会した

                memberSnap.forEach(function (childMemberSnap) {
                    //自分は当然除外(論理的に未参加なので冗長ではあるが一応除外しておく)
                    if(childMemberSnap.key === DEFAULT || childMemberSnap.key === user.uid)
                        return;

                    //未参加の場合はメンバーとして表示しない
                    if(childMemberSnap.child('isChecked').val() == false)
                        return;

                    var memberName = avoidNullValue(childMemberSnap.child('name').val(), "ユーザ名未設定");
                    var memberPhotoUrl = avoidNullValue(childMemberSnap.child('photoUrl').val(), 'img/icon.png');

                    var chipsHtml =
                        '<span class="mdl-chip mdl-chip--contact mdl-pre-upgrade">' +
                            '<img class="mdl-chip__contact mdl-pre-upgrade" src="'+ memberPhotoUrl +'">' +
                            '<span class="mdl-chip__text mdl-pre-upgrade">'+ memberName +'</span>' +
                        '</span>';
                    tooltips.append(chipsHtml);
                });

                section.find('.reject-btn').on('click', function (e) {
                    section.fadeOut('slow', function (e) {
                       section.remove();
                       showNotification('招待を拒否しました', 'success');
                    });
                });

                section.find('.add-btn').on('click', function (e) {
                    //todo 参加動作を実装すること　多分バックエンドと連携するんだろうね
                    section.fadeOut('slow', function (e) {
                        section.remove();
                        showNotification('参加しました', 'success');
                    });
                });

                setElementAsMdl(section);

                section.insertBefore(sectionGroup);

            }).catch(function (reason) {
                console.log(reason);
                showOpeErrNotification(defaultDatabase);
            });
        }
    });

    var userName = avoidNullValue(snapshot.child('displayName').val(), "ユーザ名未設定");

    //プロフィール欄を表示
    $('#user-name').html(userName);

    var userEmail = avoidNullValue(snapshot.child('email').val(), "アドレス未設定");
    $('#user-email').html(userEmail);

    var photoUrl = avoidNullValue(snapshot.child("photoUrl").val(), "img/icon.png");
    $('#profile').find('img').attr("src", photoUrl);
}

function onGetFriendSnap(snapshot) {
        if(!snapshot.exists()){
            showNotification(ERR_MSG_OPE_FAILED, 'danger', -1);
            console.log("snapShot存在せず" + snapshot);
            fbCoumpleteCount++;
            return;
        }

        var pool = $("#other-users");

        snapshot.forEach(function (childSnap) {
            if(childSnap.key === DEFAULT)
                return;

            var userName = avoidNullValue(childSnap.child("name").val(), "ユーザ名未設定");
            var photoUrl = avoidNullValue(childSnap.child("photoUrl").val(), "img/icon.png");
            console.log(photoUrl);
            var ele = $(
                '<div class="user-img-w">'+
                    '<div class="mdl-card mdl-shadow--2dp user-image mdl-pre-upgrade">'+
                        '<img src="'+ photoUrl +'" class="user-image-i">'+
                    '</div>'+
                    '<p class="user-name">'+ userName +'</p>'+
                '</div>'
            );

            pool.append(ele);

            var li = $(
                '<li class="mdl-list__item mdl-pre-upgrade">'+
                    '<span class="mdl-list__item-primary-content mdl-pre-upgrade">'+
                        '<img src="'+photoUrl+'" class="rounded-circle"><span>'+userName+'</span>'+
                    '</span>'+
                    '<span class="mdl-list__item-secondary-action mdl-pre-upgrade">'+
                        '<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-pre-upgrade" for="'+childSnap.key+'">'+
                            '<input type="checkbox" id="'+ childSnap.key +'" class="mdl-checkbox__input mdl-pre-upgrade" />'+
                        '</label>'+
                    '</span>'+
                '</li>'
            );
            ($('#friend-list')).append(li);
        });
}


function setOnClickListeners() {
    $('#group #add-btn-w').on("click", function (ev) {
        console.log("groupAddBtn clicked");

        displayDialogContent('createGroup');
    });

    // $('#edit-prof').on("click", function (ev) {
    //     console.log("edit-prof clicked");
    // });

    var clickedAndMovePage = false;
    if(!dialog.showModal){
        dialogPolyfill.registerDialog(dialog);
    }

    dialog.addEventListener('close', function () {
        console.log('dialog close');
        var checkBoxes = $('#friend-list .mdl-checkbox');
        if(checkBoxes.length)
            checkBoxes[0].MaterialCheckbox.uncheck();

        if(currentDialogShown === 'createGroup' && this.returnValue){
            console.log(this.returnValue);
            var dataArr = this.returnValue.split(DELIMITER);
            var groupKey = defaultDatabase.ref('group').push().key;
            var map = {
                host: user.uid,
                groupName: dataArr[0],
                member: dataArr.shift()
            };

            defaultDatabase.ref('groupSample/'+groupKey).update(map).then(function () {
                console.log('うまいこといったよ！よかったね！');
                //ここで、memberのkeyのみを書き込んでいることに注意してください。photoUrlやdisplayNameと整合性がとれない場合があるため、
                // 必ずcloudFunction側で検査を行い、検査にpassしたら、書き込みを許します。
            }).catch(function (reason) {
                console.log(reason);
                showOpeErrNotification(defaultDatabase);
            });
        }
    });
    //escキー押下で離脱した場合
    dialog.addEventListener('cancel', function(e) {
        console.log('cancel');
        e.preventDefault();
    });

    dialogNgBtn.on("click", function (ev) {
        dialog.close();
    });
    dialogPsBtn.on("click", function (ev) {
        if(currentDialogShown === 'createGroup'){
            //todo 禁則処理に文字長は含まれていません
            if (!isValidAboutNullAndDelimiter(groupNameInput, errSpan))
                return false;
            groupNameInput.parent().removeClass('is-invalid');

            var checked = [];
            var inputs = $('#friend-list .mdl-checkbox.is-checked input');
            for(var i=0; i<inputs.length; i++) {
                var id = inputs.eq(i).attr('id');
                checked.push(id);
            }

            if (!checked.length) {
                showNotification(ERR_MSG_GROUP, 'warning');
                return;
            }

            //配列の先頭にグループ名、その後メンバーのuidを追加していく。
            checked.push(groupNameInput.val());
            var joinedVal = checked.join(DELIMITER);

            dialog.close(joinedVal);
        }

        dialog.close();
    });

    const groupNameInput = $('#new-group-name');
    const errSpan = groupNameInput.parent().find('.mdl-textfield__error');
    $('.group-icon .group-icon').on('click', function (e) {
        e.preventDefault();
        if(currentDialogShown === 'createGroup')
            return;

        console.log('image clicked');

        return false;
    });

    $('#group .demo-card-image').on("click", function (ev) {
        var groupKeys = Object.keys(userDataJson["group"]);
        var index = $(this).index();
        var groupKey = groupKeys[index];
        if(groupKey === DEFAULT){
            groupKey = groupKeys[index + 1];
        }

        console.log(groupKey, userDataJson["group"]);
        if(userDataJson["group"][groupKey]["added"]){
            if(clickedAndMovePage){
               clickedAndMovePage = true;
            } else {
                window.location.href = "../group/index.html?key=" + groupKey;
            }
        } else {
            displayDialogContent('addGroup');
        }
    });
}

function displayDialogContent(witch) {
    if(dialog.hasAttribute('opened')) {
        console.log(dialog.hasAttribute('opened'), witch);
        return;
    }

    currentDialogShown = witch;
    switch (witch){
        case 'addGroup':
            createGroupC.hide();
            addGroupC.show();
            dialogPsBtn.html('参加する');
            dialogNgBtn.html('拒否する');
            break;
        case 'createGroup':
            createGroupC.show();
            addGroupC.hide();
            dialogPsBtn.html('グループを作成');
            dialogNgBtn.html('キャンセル');
            break;
    }

    dialog.showModal();
}

function showAll() {
    if(fbCoumpleteCount !== 1){
        fbCoumpleteCount++;
        return;
    }

    setOnClickListeners();

    setElementAsMdl($("body"));

    tippy('[title]:non(.group-icon)', {
        updateDuration: 0,
        appendTo: $('body')[0],
        popperOptions: {
            modifiers: {
                preventOverflow: {
                    enabled: false
                }
            }
        }
    });

    tippy('.group-icon', {
        updateDuration: 0,
        appendTo: $('dialog')[0],
        distance: 0,
        popperOptions: {
            modifiers: {
                preventOverflow: {
                    enabled: false
                }
            }
        }
    });

    notifyInvitation();
}

function notifyInvitation() {
    $.notify({
        icon: 'https://randomuser.me/api/portraits/med/men/77.jpg',
        title: '田中貴金属コーポレート部',
        message: 'グループに招待されています'
    },{
        type: 'minimalist',
        allow_dismiss: true,
        newest_on_top: true,
        delay: -1,
        icon_type: 'image',
        template: '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0}" role="alert">' +
                        '<div>'+
                            '<img data-notify="icon" class="rounded-circle img-circle pull-left">' +
                            '<span data-notify="title">{1}</span>' +
                            '<span data-notify="message">{2}</span>' +
                        '</div>'+
                        '<button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>'+
                    '</div>'
    });
}

function setOnClickEditProfBtn() {
    console.log('setOnClickEditProfBtn');

    $('#edit-prof').on('click', function (e) {
        console.log('clicked');
    });

    // firebase.auth().onAuthStateChanged(function (userObject) {
    //     if (userObject && user.uid === userObject.uid) {
    //
    //     } else {
    //         location.reload();
    //     }
    // });
}