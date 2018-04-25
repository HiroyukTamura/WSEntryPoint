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
        constructor(){
            this.dialog = $('.mdl-dialog');
            this.friendUl = $('#friend-list');
            this.isReady = false;
            this.userDefIconPath = '../dist/img/icon.png';//todo 変更する？？
            this.$liFrame = $(
                '<li class="mdl-list__item mdl-button mdl-js-button mdl-pre-upgrade">\n' +
                    '<span class="mdl-list__item-primary-content mdl-pre-upgrade">\n' +
                        '<img src="../dist/img/icon.png" alt="user-image" class="mdl-list__item-avatar mdl-pre-upgrade">\n' +
                        '<span class="name">'+ UNSET_USER_NAME +'</span>\n' +
                    '</span>\n' +
                    '<span class="mdl-list__item-secondary-action">\n' +
                        '<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="list-checkbox-1">\n' +
                            '<input type="checkbox" id="list-checkbox-1" class="mdl-checkbox__input" checked />\n' +
                        '</label>\n' +
                    '</span>\n' +
                '</li>'
            );

            this.dlFriendList();
            this.initListeners();
        }
        
        initListeners(){
            this.dialog.on('cancel', function (e) {
                e.preventDefault();
            }).on('close', function (e) {
                if (this.returnValue === 'yes') {
                    console.log('positive');
                } else  {
                    console.log('negative');
                }
            });
        }

        dlFriendList(){
            const self = this;
            const scheme = makeRefScheme(['friend', loginedUser.uid]);
            defaultDatabase.ref(scheme).once('value').then(function (snapshot) {
                console.log('dlFriendList', snapshot);
                if (snapshot.exists()) {
                    console.log('友達いる');
                    self.setDomAsFriendList(snapshot);
                    // let friendJson = snapshot.toJSON();
                    // friendJson.forEach(function (childSnap) {
                    //     if (childSnap.key === DEFAULT)
                    //         return;
                    //     let $li = self.$liFrame.clone();
                    //     SocialDataOperator.setDomDetails(childSnap.key, childSnap, $li, UNSET_USER_NAME, self.userDefIconPath);
                    //     friendUl.append($li);
                    // });
                    // setElementAsMdl(friendUl);
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

        onClickGroupCreateBtn(){
            if (this.isReady && !this.dialog.attr('opened')){
                this.dialog[0].showModal();
            }
        }

        setDomAsFriendList(snapshot){
            const self = this;
            snapshot.forEach(function (childSnap) {
                if (childSnap.key === DEFAULT)
                    return;
                let $li = self.$liFrame.clone();
                let json = childSnap.toJSON();
                SocialDataOperator.setDomDetails(childSnap.key, json, $li, UNSET_USER_NAME, self.userDefIconPath);
                self.friendUl.append($li);
            });
            setElementAsMdl(this.friendUl);
        }
    }
}();
