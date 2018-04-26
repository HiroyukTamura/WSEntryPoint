"use strict";

!function(){
    const defaultApp = firebase.initializeApp(CONFIG);
    const defaultDatabase = defaultApp.database();
    let loginedUser;
    const current = moment();
    let groupCreator;
    let socialOperator;

    window.onload = function init() {
        new Main().init();
    };

    class Main {

        constructor(){
            this.postLoad = $('#post_load');
            this.progress = $('#progress');
            this.loginUi = $('#login_w');
            this.mainContent = $('.page-content');
        }

        init(){
            const self = this;
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
                    console.log("ユーザログインしてます");
                    loginedUser = user;
                    self.onLoginSuccess();
                } else {
                    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                        .then(function() {
                            const uiConfig = createFbUiConfig(function (user, credential, redirectUrl) {
                                self.progress.hide();
                                self.loginUi.hide();
                                loginedUser = user;
                                self.onLoginSuccess();
                                return false;
                            });

                            self.progress.hide();
                            self.postLoad.hide();
                            const ui = new firebaseui.auth.AuthUI(firebase.auth());
                            $('#login_w').show();
                            ui.start('#firebaseui-auth-container', uiConfig);

                        }).catch(function(error) {
                        console.log(error.code, error.message);
                        showOpeErrNotification(defaultDatabase);
                    });
                }
            });

            initDrawerDecoration();

            GroupCreator.tippyForDialog('.group-icon', 'top', 5);
            tippy('[title]');
        }

        onLoginSuccess() {
            console.log("onLoginSuccess");
            this.progress.hide();
            this.loginUi.hide();
            this.postLoad.show();

            setDrawerProfile(loginedUser);

            // const calendar = new Calendar('#calendar', null);
            Main.setDomStatus();
            socialOperator = new SocialDataOperator();
            socialOperator.retrieveGroupList();
            // fgRetriever.retrieveFriendList();

            new CalendarOperator().init();
            groupCreator = new GroupCreator();
        }

        static setDomStatus(){
            new MetaRecordRetriever('#meta-total', 'analytics', loginedUser.uid, 'totalCount')
                .retrieveData();
            new MetaRecordRetriever('#meta-continue', 'analytics', loginedUser.uid, 'continuousCount')
                .retrieveData();
            new MonthTotalRetriever('#meta-month', 'analytics', loginedUser.uid, current.format('YYYYMM'), 'recordedDate')
                .retrieveData();
        }
    }

    class MetaRecordRetriever{
        constructor(selector, ...scheme){
            this.scheme = makeRefScheme(scheme);
            this.$dom = $(selector);
            this.val = 0;
        }

        retrieveData(){
            const self = this;
            defaultDatabase.ref(this.scheme).once('value').then(snapshot=> {
                if (snapshot.exists()) {
                    self.setVal(snapshot);
                } else {
                    //todo エラーロギング
                    console.log('snapshotなし', self.scheme);
                }
            }).catch(error => {
                console.log(error.code, error.message);
                //todo エラーロギング
            }).finally(() => {
                self.setDom(self.val);
            });
        }

        setDom(){
            this.$dom.html(this.val + '日');
        }

        setVal(snapshot){
            this.val = snapshot.val();
        }
    }

    class MonthTotalRetriever extends MetaRecordRetriever {
        setVal(snapshot){
            this.val = snapshot.val().split(',').length;
        }
    }

    class SocialDataOperator {
        constructor(){
            this.groupDefIconPath = '../dist/img/icon.png';//todo 変更する？？
            this.userDefIconPath = '../dist/img/icon.png';//todo 変更する？？
            this.UNSET_GROUP_NAME = '新しいグループ';//todo 変更する？？
            this.schemeFriend = makeRefScheme(['friend', loginedUser.uid]);
            this.schemeGroupNode = makeRefScheme(['userData', loginedUser.uid, 'group']);
            this.$friendLi = $('#user-list > div > ul');
            this.$groupList = $('#group-list > div > ul');
            this.$groupCard = $('#group-list');
            this.$friendCard = $('#user-list');

            this.$liFrame = $(
                '<li class="mdl-list__item mdl-button mdl-js-button mdl-pre-upgrade">\n' +
                    '<span class="mdl-list__item-primary-content mdl-pre-upgrade">\n' +
                        '<img alt="user-image" class="mdl-list__item-avatar mdl-pre-upgrade">\n' +
                        '<span class="name"></span>\n' +
                    '</span>\n' +
                    // '<button class="mdl-list__item-secondary-action mdl-button mdl-js-button mdl-button--icon config">\n' +
                    //     '<i class="fas fa-cog fa-sm"></i>\n' +
                    // '</button>\n' +//todo これどうするのか後で決めること
                '</li>'
            );
        }

        retrieveFriendList(){
            const self = this;
            defaultDatabase.ref(this.schemeFriend).once('value').then(snapshot =>{
                snapshot.forEach(function (childSnap) {
                    if (childSnap.key === DEFAULT)
                        return;
                    let json = childSnap.toJSON();
                    let $li = self.$liFrame.clone();

                    SocialDataOperator.setDomDetails(childSnap.key, json, $li, UNSET_USER_NAME, self.userDefIconPath);//todo 変更する？？

                    self.$friendLi.append($li);
                });
                setElementAsMdl(self.$friendCard);
                self.$friendCard.removeClass('pre-load');
            }).catch(error => {
                //todo エラー処理 Ntfを出す
            });
        }

        retrieveGroupList(){
            const self = this;
            const $groupActLi = $('#group-act-list');
            defaultDatabase.ref(this.schemeGroupNode).once('value').then(snapshot =>{
                snapshot.forEach(function (childSnap) {
                    if (childSnap.key === DEFAULT)
                        return;
                    let json = childSnap.toJSON();
                    let $li = self.$liFrame.clone();

                    SocialDataOperator.setDomDetails(childSnap.key, json, $li, self.UNSET_GROUP_NAME, self.groupDefIconPath);//todo 変更する？？

                    self.$groupList.append($li);

                    let groupScheme = makeRefScheme(['group', snapshot.key]);
                    defaultDatabase.ref(groupScheme).once('value').then(snapshot =>{
                        if (!snapshot.exists()) {
                            //todo エラーロギング
                            return;
                        }
                        let groupJson = snapshot.toJSON();
                        //todo 次はここから
                    }).catch(err => {

                    });
                });
                $('#group-list .list-card__header .mdl-button').on('click', function () {
                    groupCreator.onClickGroupCreateBtn();
                });
                setElementAsMdl(self.$groupCard);
                self.$groupCard.removeClass('pre-load');
            }).catch(error => {
                //todo エラー処理 グループログも
            });
        }

        static setDomDetails(key, json, $li, errName, errIcon){
            $li.prop('key', key);
            const name = (!!json['name'] && json.name !== 'null') ?
                json.name : errName;
            $li.find('.name').html(name);
            const photoUrl = (!!json['photoUrl'] && json.photoUrl !== 'null') ?
                json.photoUrl : errIcon;
            $li.find('img').attr('src', photoUrl);
        }
    }

    class CalendarOperator {
        constructor(){
            console.log('CalendarOperator');
            this.json = JSON.stringify([]);
        }

        init(){
            const self = this;
            const scheme = makeRefScheme(['combinedCalendar', loginedUser.uid]);
            defaultDatabase.ref(scheme).once('value').then(snapshot =>{
                console.log(snapshot);
                if (snapshot.exists()) {
                    self.json = snapshot.toJSON();
                }
                this.calendar = new Calendar('#calendar', self.json);
            }).catch(error => {
                console.log(error);
                //todo エラー処理 Ntfを出す
            });
        }
    }

    class GroupCreator {
        constructor() {
            this.$dialog = $('.mdl-dialog');
            this.$friendUl = $('#friend-list');
            this.$fileInput = $('#file-input');
            this.$groupIcon = this.$dialog.find('.group-icon');

            this.isReady = false;
            this.task = null;

            this.userDefIconPath = '../dist/img/icon.png';//todo 変更する？？
            this.$liFrame = $(
                '<li class="mdl-list__item mdl-pre-upgrade">\n' +
                '<span class="mdl-list__item-primary-content mdl-pre-upgrade">\n' +
                '<img src="../dist/img/icon.png" alt="user-image" class="mdl-list__item-avatar mdl-pre-upgrade">\n' +
                '<span class="name">' + UNSET_USER_NAME + '</span>\n' +
                '</span>\n' +
                '<span class="mdl-list__item-secondary-action mdl-pre-upgrade">\n' +
                '<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-pre-upgrade" for="list-checkbox-1">\n' +
                '<input type="checkbox" id="list-checkbox-1" class="mdl-checkbox__input mdl-pre-upgrade" />\n' +
                '</label>\n' +
                '</span>\n' +
                '</li>'
            );

            this.dlFriendList();
            this.initListeners();
        }

        initListeners() {
            const self = this;
            this.$dialog.on('cancel', function (e) {
                e.preventDefault();
            }).on('close', function (e) {
                if (this.returnValue === 'yes') {
                    console.log('positive');
                } else {
                    console.log('negative');
                }
            });
            this.$groupIcon.on('click', function (e) {
                e.preventDefault();
                if (!self.task)
                    self.$fileInput.click();
                return false;
            });
            this.$fileInput.on('change', function (e) {
                console.log('ファイル選択された');
                self.onChooseGroupIcon(e);
            });
        }

        dlFriendList() {
            const self = this;
            const scheme = makeRefScheme(['friend', loginedUser.uid]);
            defaultDatabase.ref(scheme).once('value').then(function (snapshot) {
                console.log('dlFriendList', snapshot);
                if (snapshot.exists()) {
                    console.log('友達いる');
                    self.setDomAsFriendList(snapshot);
                    self.isReady = true;
                    console.log(self.isReady);
                } else {
                    console.log('友達いない');
                    //todo 友達いない
                }
            }).catch(err => {
                console.log(err);
                //todo エラー処理
            });
        }

        onClickGroupCreateBtn() {
            if (this.isReady && !this.$dialog.attr('opened')) {
                this.$dialog[0].showModal();
            }
        }

        setDomAsFriendList(snapshot) {
            const self = this;
            snapshot.forEach(function (childSnap) {
                if (childSnap.key === DEFAULT)
                    return;
                let $li = self.$liFrame.clone();
                let json = childSnap.toJSON();
                SocialDataOperator.setDomDetails(childSnap.key, json, $li, UNSET_USER_NAME, self.userDefIconPath);
                self.$friendUl.append($li);
            });
            setElementAsMdl(this.$friendUl);
        }

        onChooseGroupIcon(e) {
            if (this.task)
                return;
            const mimeType = e.target.files[0].type;

            if (!GroupCreator.validateMimeType(mimeType)) {
                showNotification(NTF_FILE_IMG_W, 'warning');
                return;
            }

            if (!GroupCreator.validateSuffix(e.target.files[0].name)) {
                showNotification(NTF_FILE_IMG_W, 'warning');
                return;
            }

            if (!GroupCreator.validateSize(e.target.files[0].size)) {
                showNotification(NTF_LIMIT_SIZE5, 'warning');
                return;
            }

            let notification = this.showProgressNotification();

            const key = defaultDatabase.ref('keyPusher').push().key;
            const suf = mimeType.split('.')[1];
            console.log(suf);
            /*!!!!!つまり、グループアイコンのストレージURLは、グループkeyに一致しない!!!!*/
            this.task = firebase.storage().ref(makeRefScheme(['group_icon', key + '.' + suf]))
                .put(e.target.files[0]);
            new UploadTaskOperator(this.task, notification, this.$groupIcon.find('img')).init();
        }

        static tippyForDialog(selectorVal, placement, distance) {
            tippy(selectorVal, {
                updateDuration: 0,
                appendTo: $('dialog')[0],
                distance: distance,
                placement: placement,
                popperOptions: {
                    modifiers: {
                        preventOverflow: {
                            enabled: false
                        }
                    }
                }
            });
        }

        static validateMimeType(mimeType) {
            const whiteList = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            return whiteList.indexOf(mimeType.toLowerCase()) !== -1;
        }

        static validateSuffix(fileName) {
            const dotPos = fileName.indexOf('.');
            if (dotPos === -1)
                return false;
            if (fileName.split('.').length !== 2)
                return false;

            const suf = fileName.substring(dotPos + 1);
            const whiteList = ['jpeg', 'jpg', 'png', 'gif'];
            return whiteList.indexOf(suf.toLowerCase()) !== -1;
        }

        static validateSize(fileSize) {
            return fileSize <= 5 * 1000 * 1000;
        }

        showProgressNotification() {
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
                onclosed: this.cancelUpload()
            });
        }

        static updateProgressNtf(notification, progress) {
            const msg = '<strong>'+progress+'%</strong>';
            notification.update({
                'message': msg,
                'progress': progress
            });
        }

        cancelUpload() {
            if (this.task)
                this.task.cancel();
        }
    }

    class UploadTaskOperator {
        constructor(task, notification, $iconImg) {
            this.task = task;
            this.notification = notification;
            this.$iconImg = $iconImg;
        }

        init() {
            const self = this;
            this.task.on('state_changed', function (snapshot) {
                const progress = Math.floor((snapshot.bytesTransferred / snapshot.totalBytes) * 95);//残りの5%は完了動作
                console.log('Upload is ' + progress + '% done');
                switch (snapshot.state) {
                    case firebase.storage.TaskState.PAUSED: // or 'paused'
                        console.log('Upload is paused');
                        break;
                    case firebase.storage.TaskState.RUNNING: // or 'running'
                        console.log('Upload is running');
                        GroupCreator.updateProgressNtf(self.notification, progress);
                        break;
                }
            }, function (error) {
                //todo エラーデバッグすること
                this.task = null;//これで「キャンセルしました」が出なくなる
                this.notification.close();
                let errMsg = ERR_MSG_OPE_FAILED;
                switch (error.code) {
                    case 'storage/retry_limit_exceeded':
                        errMsg = 'タイムアウトしました';
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
                let downloadURL = self.task.snapshot.downloadURL;
                console.log(downloadURL);

                GroupCreator.updateProgressNtf(self.notification, 100);
                self.task = null;
                self.notification.close();
                showNotification(NTF_UPLOAD_SUCCESS, 'success');
                self.$iconImg.attr('src', downloadURL);
            });
        }
    }
}();
