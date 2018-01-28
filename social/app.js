"use strict";

const ERR_MSG_GROUP = "メンバーが一人も選択されていません";
const postLoad = $('#post_load');
const progress = $('#progress');
const createGroupC = $('#create-group');
const addGroupC = $('#add-group');
const changePwC =$('#change-pw');
const reauthC =$('#re-auth');
const dialog = $('#add-group-dialog')[0];
const dialogPsBtn = $('#add-group-btn');
const dialogNgBtn = $('#cancel');
const pwNew =$('#pw-new');
const pwOld =$('#pw-old');
const inputReAuth = $('#pw-re-auth');
const imgDot = $('#my-img-dot');
const myImg = $('#my-img img');
const nameInput = $('#my-name');
const mailInput = $('#user-email');
var initialErr = false;
var currentDialogShown;
var defaultApp;
var defaultDatabase;
var user;
var fbCoumpleteCount = 0;
var userDataJson;
var currentPwVal;
var storage;
var task;

window.onload = function (ev) {
    defaultApp = firebase.initializeApp(CONFIG);
    defaultDatabase = defaultApp.database();
    storage= firebase.storage();

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

            createGroupHtml(groupName, groupPhotoUrl, childSnap.key).insertBefore($('#group #add-btn-w'));

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
                    if(!childMemberSnap.child('isChecked').val())
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
                    var commandKey = defaultDatabase.ref('keyPusher').push().key;
                    var obj = createFbCommandObj(LEAVE_GROUP, user.uid);
                    obj['groupKey'] = childSnap.key;
                    defaultDatabase.ref('writeTask/'+ commandKey).update(obj).then(function () {

                        section.fadeOut('slow', function (e) {
                            section.remove();
                            showNotification('招待を拒否しました', 'success');
                        });

                    }).catch(function (error) {
                        console.log(error.code, error.message);
                    });
                });

                section.find('.add-btn').on('click', function (e) {
                    console.log(userDataJson);
                    var commandKey = defaultDatabase.ref('keyPusher').push().key;
                    var obj = createFbCommandObj(ADD_GROUP_AS_INVITED, user.uid);
                    obj['groupKey'] = childSnap.key;
                    defaultDatabase.ref('writeTask/'+ commandKey).update(obj).then(function () {

                        section.fadeOut('slow', function (e) {
                            section.remove();
                            var html = createGroupHtml(groupName, groupPhotoUrl, childSnap.key);
                            html.insertBefore($('#group #add-btn-w'));

                            showNotification('グループに参加しました', 'success');
                        });

                    }).catch(function (error) {
                        console.log(error.code, error.message);
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
    nameInput.attr('value', userName);

    var userEmail = avoidNullValue(snapshot.child('email').val(), "アドレス未設定");
    mailInput.attr('value', userEmail);

    var photoUrl = avoidNullValue(snapshot.child("photoUrl").val(), "img/icon.png");
    $('#profile').find('img').attr("src", photoUrl);

    var pwBtn = $('#user-pw-old .mdl-button');
    var editProfBtn = $('#edit-prof');
    var saveBtn =$('#save-prof');
    pwBtn.on('click', function (e) {
        console.log('clicked');
        displayDialogContent('change-pw');
    });
    saveBtn.on('click', function (e) {
        e.preventDefault();
        displayDialogContent('re-auth');
        return false;
    });

    editProfBtn.on('click', function (e) {
        showEditToggleMode(true)
    });

    // var oldInput = $('#user-pw-old input');
}

function createGroupHtml(groupName, photoUrl, groupKey) {
    // todo 未読を記録するnodeを作らないとね
    var html = $(
        '<div class="demo-card-image mdl-card mdl-shadow--2dp mdl-pre-upgrade">'+
            '<div class="mdl-card__title mdl-card--expand mdl-badge mdl-pre-upgrade" data-badge="44"></div>'+
                '<div class="mdl-card__actions mdl-pre-upgrade">'+
                    '<span class="demo-card-image__filename mdl-pre-upgrade">'+groupName+'</span>'+
                '</div>'+
            '</div>'+
        '</div>');

    // $('#group #add-btn-w').insertBefore($(html));
    html.css('background', photoUrl);
    html.on('click', function (e) {
        window.location.href = "../group/index.html?key=" + groupKey;
    });
    return html;
}

function showEditToggleMode(isShow) {
    var editProfBtn = $('#edit-prof');
    var saveBtn =$('#save-prof');
    var postProfInner = $('#post-prof-inner');
    var rightCol = $('#right-col');
    var dummyPw = $('#user-pw-old .mdl-list__item-primary-content span');
    var pwBtn = $('#user-pw-old .mdl-button');

    if(isShow){
        $('#post-prof-inner').fadeOut(function (e2) {
            console.log('clicked');
            rightCol.find('.mdl-textfield__input')
                .removeAttr('readonly')
                .css('border-bottom', '1px solid rgba(0,0,0,.12)');
            rightCol.find('label').show();
            // oldInput.attr('value', '');
            imgDot.css('display', 'flex');
            // $(e.target).html('<i class="material-icons mdl-pre-upgrade">save</i>')
            //     .css('color', '#E57C3E')
            //     .css('height', '24px')
            //     .attr('title', 'プロフィールを保存');
            dummyPw.hide();
            pwBtn.show();
            editProfBtn.hide();
            // $(this).parent().css('height', '32px');
            $(this).fadeIn();
            saveBtn.fadeIn();

            myImg.css('cursor', 'pointer');
            imgDot.css('cursor', 'pointer');
        });

    } else {
        postProfInner.fadeOut(function () {
            var rightCol = $('#right-col');
            var dummyPw = $('#user-pw-old .mdl-list__item-primary-content span');
            var pwBtn = $('#user-pw-old .mdl-button');

            rightCol.find('.mdl-textfield__input')
                .attr('readonly', '')
                .css('border-bottom', 'none');
            rightCol.find('label').hide();
            imgDot.css('display', 'none');
            dummyPw.show();
            pwBtn.hide();
            editProfBtn.show();
            // $(this).parent().css('height', '32px');
            $(this).fadeIn();

            myImg.css('cursor', 'default');
            imgDot.css('cursor', 'default');
        });

        saveBtn.fadeOut();
    }
}

function onGetFriendSnap(snapshot) {
        if(!snapshot.exists()){
            showNotification(ERR_MSG_OPE_FAILED, 'danger', -1);
            console.log("snapShot存在せず" + snapshot);
            fbCoumpleteCount++;
            return;
        }

        var pool = $("#other-users");
        var addUserBtn = $('#add-btn-user-w');

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

            ele.insertBefore(addUserBtn);

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

    // var clickedAndMovePage = false;
    if(!dialog.showModal){
        dialogPolyfill.registerDialog(dialog);
    }

    dialog.addEventListener('close', function () {
        console.log('dialog close');

        if(currentDialogShown === 'createGroup' && this.returnValue){
            console.log(this.returnValue);

            var input = $(this).find('#new-group-name');
            var groupName = input.val();//dialogのokボタン押した際にバリデーション済
            var img = $(this).find('#create-group .group-icon img');
            var photoUrlE = avoidNullValue(img.attr('src'), 'null');
            if (photoUrlE === 'img/icon.png')
                photoUrlE = 'null';

            var checked = [];
            var inputs = $(this).find('#friend-list .mdl-checkbox.is-checked input');
            for(var i=0; i<inputs.length; i++) {
                var id = inputs.eq(i).attr('id');
                checked.push(id);
            }

            var newGroupKey = defaultDatabase.ref('keyPusher').push().key;

            var update = createFbCommandObj(CREATE_GROUP, user.uid);
            update['groupName'] = groupName;
            update['keys'] = checked.join('_');
            update['photoUrl'] = photoUrlE;
            update['newGroupKey'] = newGroupKey;

            var commandKey = defaultDatabase.ref('keyPusher/').push().key;
            defaultDatabase.ref('writeTask/'+ commandKey).update(update).then(function () {

                showNotification('グループを作成しました', 'success');
                var html = createGroupHtml(groupName, photoUrlE, newGroupKey);
                html.insertBefore($('#group #add-btn-w'));

            }).catch(function (reason) {
                console.log(reason);
                showOpeErrNotification(defaultDatabase);
            });

        } else if(currentDialogShown === 'change-pw') {

            if (this.returnValue) {
                var newPw = this.returnValue;
                console.log('newPw', this.returnValue);
                var currentUser = firebase.auth().currentUser;

                if(user.uid !== currentUser.uid){
                    //別のユーザがログインしているようだ
                    showNotification('処理に失敗しました', 'danger');
                } else {

                    //todo ん？EmailAuthProviderだけでいいのか？要デバッグ
                    var credential = firebase.auth.EmailAuthProvider.credential(
                        currentUser.email,
                        currentPwVal
                    );

                    currentUser.reauthenticateWithCredential(credential).then(function() {
                        user.updatePassword(newPw).then(function() {

                            showNotification('パスワードを変更しました', 'success');

                        }).catch(function(error) {
                            console.log(error);
                            showOpeErrNotification(defaultDatabase);
                        });
                    }).catch(function(error) {
                        console.log(error);
                        showOpeErrNotification(defaultDatabase);
                    });
                }

                currentPwVal = null;//現在のPwを代入してある変数は即刻削除
            }

            pwOld.val('').parent().removeClass('is-invalid');
            pwNew.val('').parent().removeClass('is-invalid');

        } else if(currentDialogShown === 're-auth' && this.returnValue) {

            if (this.returnValue) {

                var currentUserE = firebase.auth().currentUser;

                if(user.uid !== currentUserE.uid){
                    //別のユーザがログインしているようだ
                    showNotification('処理に失敗しました', 'danger');
                    return;
                }

                if (!nameInput.val())
                    showNotification('warning', 'ユーザ名を入力してください');
                if (!mailInput.val())
                    showNotification('warning', 'アドレスを入力してください');
                if(!nameInput.val() || !mailInput.val())
                    return;

                var photoUrl = myImg.attr('src');
                var objToUpdate = {};
                // if(nameInput.val() !== currentUserE.displayName)
                objToUpdate['displayName'] = nameInput.val();
                // if(mailInput.val() !== user.email)
                objToUpdate['email'] = mailInput.val();
                // if(photoUrl !== currentUserE.photoURL)
                objToUpdate['photoURL'] = photoUrl;

                //todo ん？EmailAuthProviderだけでいいのか？要デバッグ
                var credentialE = firebase.auth.EmailAuthProvider.credential(
                    currentUserE.email,
                    this.returnValue
                );

                currentUserE.reauthenticateWithCredential(credentialE).then(function() {

                    currentUserE.updateProfile(objToUpdate).then(function() {

                        showNotification('プロフィールを変更しました', 'success');

                    }).catch(function(error) {
                        console.log(error);
                        showOpeErrNotification(defaultDatabase);
                    });

                }).catch(function(error) {
                    console.log(error.code, error.message);
                    switch (error.code){
                        case 'auth/wrong-password':
                            showNotification('パスワードが間違っています', 'warning');
                            showEditToggleMode(false);
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
                });
            }

            inputReAuth.val('').parent().removeClass('is-invalid');

        } else if(currentDialogShown === 're-auth' && !this.returnValue) {
            inputReAuth.val('').parent().removeClass('is-invalid');
            console.log('re-auth', 'キャンセルされた');
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
        switch (currentDialogShown) {
            case 'createGroup':
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
                // checked.push(groupNameInput.val());
                // var joinedVal = checked.join(DELIMITER+DELIMITER+DELIMITER);

                dialog.close('いいよいいよー');
                return;

            case 'change-pw':
                console.log('pw変更でOKおしたよ！');

                if(changePwC.find('.is-invalid').length){
                    console.log('文字長足りず');
                    return;
                }

                var isValid = true;
                if (pwOld.val().length < 6) {
                    pwOld.parent().addClass('is-invalid');
                    isValid = false;
                }
                if (pwOld.val().length < 6) {
                    pwNew.parent().addClass('is-invalid');
                    isValid = false
                }

                if(isValid){
                    currentPwVal = pwOld.val();
                    dialog.close(pwNew.val());
                }
                return;

            case 're-auth':
                if(!inputReAuth.val() || inputReAuth.val().length < 6) {
                    if(!reauthC.find('.is-invalid').length)
                        inputReAuth.parent().addClass('is-invalid');

                    return;
                }

                dialog.close(inputReAuth.val());
                return;
        }

        dialog.close();
    });

    pwOld.keyup(function (e) {
        setPwKeyUpLisntener($(this));
    }).val("");

    pwNew.keyup(function (e) {
        setPwKeyUpLisntener($(this));
    }).val("");

    inputReAuth.keyup(function (e) {
        setPwKeyUpLisntener($(this));
    });

    myImg.on('click', function (e) {
        onClickMyImg(e);
        return false;
    });

    imgDot.on('click', function (e) {
        onClickMyImg(e);
        return false;
    });

    $('#add-btn-user').on('click', function (e) {
        console.log('clicked');
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

    $('#my-img input').on('change', function (e) {

        console.log('input change');

        if(task)
            return;

        var mimeType = e.target.files[0].type;
        if(mimeType.toLowerCase() !== 'image/jpeg' && mimeType.toLowerCase() !== 'image/png' && mimeType.toLowerCase() !== 'image/gif') {
            showNotification('JPEGまたはPNGファイルのみアップロードできます', 'warning');
            return;
        }

        var fileName = e.target.files[0].name;
        var dotPos = fileName.indexOf('.');
        if(dotPos === -1){
            showNotification('JPEGまたはPNGファイルのみアップロードできます', 'warning');
            return;
        }

        var extension = fileName.substring(dotPos+1);
        if (extension.toLowerCase() !== 'jpeg' && extension.toLowerCase() !== 'jpg' && extension.toLowerCase() !== 'png' && extension.toLowerCase() !== 'gif') {
            showNotification('JPEG・PNG・gifファイルのみアップロードできます', 'warning');
            return;
        }

        if(e.target.files[0].size > 5 * 1000 * 1000) {
            showNotification('5MBを超えるファイルはアップロードできません', 'warning');
            return;
        }

        // var reader  = new FileReader();
        // reader.addEventListener("load", function () {
        //     showProgressNotification(reader.result);
        // }, false);
        // reader.readAsDataURL(e.target.files[0]);

        // window.URL.revokeObjectURL(blob);
        var notification = showProgressNotification();

        var key = defaultDatabase.ref('keyPusher').push().key;
        var suf = mimeType.substring(4);//sufは'/'を含む
        console.log(suf);
        task = storage.ref().child('profile_icon').child(key+'.'+suf)
            .put(e.target.files[0]);

        task.on('state_changed', function(snapshot){
            var progress = Math.floor((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            console.log('Upload is ' + progress + '% done');
            switch (snapshot.state) {
                case firebase.storage.TaskState.PAUSED: // or 'paused'
                    console.log('Upload is paused');
                    break;
                case firebase.storage.TaskState.RUNNING: // or 'running'
                    console.log('Upload is running');
                    var msg = '<strong>'+progress+'%</strong>';
                    notification.update({
                        'message': msg,
                        'progress': progress
                    });
                    break;
            }
        }, function (error) {
            //todo エラーデバッグすること
            task = null;//これで「キャンセルしました」が出なくなる
            notification.close();
            var errMsg = ERR_MSG_OPE_FAILED;
            switch (error.code){
                case 'storage/retry_limit_exceeded':
                    errMsg ='タイムアウトしました';
                    break;
                case 'storage/invalid_checksum':
                    errMsg = errMsg + '。もう一度アップロードしてみてください。';
                    break;
                case 'storage/canceled':
                    errMsg = 'キャンセルしました';
                    break;
                case 'storage/cannot_slice_blob':
                    errMsg = errMsg + '。ファイルを確かめてもう一度アップロードしてみてください。';
                    break;
                case 'storage/server_wrong_file_size':
                    errMsg = errMsg + '。もう一度アップロードしてみてください。';
                    break;
            }
            showNotification(errMsg, 'danger');

        }, function () {
            var downloadURL = task.snapshot.downloadURL;
            console.log(downloadURL);
            myImg.attr('src', downloadURL);

            task = null;
            notification.close();
            showNotification('ファイルをアップロードしました', 'success');
        });
    });
}

function onClickMyImg(e) {
    e.preventDefault();
    console.log('onClickMyImg');
    if(imgDot.css('display') === 'none' || task)
        return false;

    $('#my-img input')[0].click();
}

function setPwKeyUpLisntener(input) {
    var val = input.val();
    if(!val || val.length <6) {
        input.parent().addClass('is-invalid');
    } else {
        input.parent().removeClass('is-invalid');
    }
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
            changePwC.hide();
            addGroupC.show();
            reauthC.hide();
            dialogPsBtn.html('参加する');
            dialogNgBtn.html('拒否する');
            break;
        case 'createGroup':
            createGroupC.show();
            addGroupC.hide();
            changePwC.hide();
            reauthC.hide();
            dialogPsBtn.html('グループを作成');
            dialogNgBtn.html('キャンセル');

            var checkBoxes = $('#friend-list .mdl-checkbox');
            if(checkBoxes.length)
                checkBoxes[0].MaterialCheckbox.uncheck();
            $('#new-group-name').val('');


            break;
        case 'change-pw':
            addGroupC.hide();
            createGroupC.hide();
            changePwC.show();
            reauthC.hide();
            dialogPsBtn.html('変更');
            dialogNgBtn.html('キャンセル');
            break;
        case 're-auth':
            addGroupC.hide();
            createGroupC.hide();
            changePwC.hide();
            reauthC.show();
            dialogPsBtn.html('OK');
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

function showProgressNotification() {
    return $.notify({
        title: 'アップロードしています...',
        message: '<strong>0%</strong>',
        icon: 'fas fa-cloud-upload-alt',
        progressbar: 0
    }, {
        type: 'info',
        newest_on_top: true,
        allow_dismiss: true,
        showProgressbar: true,
        delay: 0,
        onclosed: cancelUpload()
    });
}

function cancelUpload() {
    if(task)
        task.cancel();
}