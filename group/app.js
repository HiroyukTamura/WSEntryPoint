"use strict";

const postLoad = $('#post_load');
var progress = $('#progress');
var initialErr = false;

/////////dialogまわり////////
const dialog = $('dialog')[0];
const dialogAddSch = $('#add-sch-cnt');
const dialogExclude = $('#dialog-img-w');
const dialogRemoveContents = $('#remove-contents');
const dialogEditComment = $('#edit-comment');
const dialogConfigGroup = $('#group-config');
const dialogAddFile = $('#add-file-modal');
const dialogNewDoc = $('#modal-new-doc');
const dialogShareRec = $('#share-rec');
const dialogPositibeBtn = $('#add-group-btn');
const dialogInvite =$('#invite-group');
var clickedColor = 0;
var inputVal = null;
var removeContentsKey;//これモーダルまわりで触る際にcontentKeyをぶち込みます　変数名変えるべきかも
var uploadTask;
var uploadingData;
var groupImageTask;
var friendJson;

const timeline = $('#left-pain');
var asyncCount = 0;
var defaultApp;
var defaultDatabase;
var user;
var groupJson;
var groupNodeJson;
var groupKey;
var isModalOpen = false;
var calendar;

//region/////////////////EventCalendar(手を加えていない部分)////////////////////
!function() {

    var today = moment();

    function Calendar(selector, events) {
        console.log(events);
        this.el = document.querySelector(selector);
        this.events = events;
        this.current = moment().date(1);
        this.openedDay = moment();
        this.draw();
        var current = document.querySelector('.today');
        if(current) {
            var self = this;
            window.setTimeout(function() {
                self.openDay(current);
            }, 500);
        }
    }

    Calendar.prototype.draw = function() {
        //Create Header
        this.drawHeader();

        //Draw Month
        this.drawMonth();

        // this.drawLegend();
    }

    Calendar.prototype.drawHeader = function() {
        var self = this;
        if(!this.header) {
            //Create the header elements
            this.header = createElement('div', 'header');
            this.header.className = 'header';

            this.title = createElement('h1');

            var right = createMonthBtn('right');
            right.addEventListener('click', function() { self.nextMonth(); });

            var left = createMonthBtn('left');
            left.addEventListener('click', function() { self.prevMonth(); });

            //Append the Elements
            this.header.appendChild(left);
            this.header.appendChild(this.title);
            this.header.appendChild(right);
            this.el.appendChild(this.header);
        }

        this.title.innerHTML = this.current.format('YYYY.MM');
    }

    Calendar.prototype.drawMonth = function() {
        var self = this;

        // this.events.forEach(function(ev) {
        //     ev.date = self.current.clone().date(Math.random() * (29 - 1) + 1);
        // });

        if(this.month) {
            this.oldMonth = this.month;
            this.oldMonth.className = 'month out ' + (self.next ? 'next' : 'prev');
            this.oldMonth.addEventListener('webkitAnimationEnd', function() {
                self.oldMonth.parentNode.removeChild(self.oldMonth);
                self.month = createElement('div', 'month');
                self.backFill();
                self.currentMonth();
                self.fowardFill();
                self.el.appendChild(self.month);
                window.setTimeout(function() {
                    self.month.className = 'month in ' + (self.next ? 'next' : 'prev');
                }, 16);
            });
        } else {
            this.month = createElement('div', 'month');
            this.el.appendChild(this.month);
            this.backFill();
            this.currentMonth();
            this.fowardFill();
            this.month.className = 'month new';
        }
    }

    Calendar.prototype.backFill = function() {
        var clone = this.current.clone();
        var dayOfWeek = clone.day();

        if(!dayOfWeek) { return; }

        clone.subtract(dayOfWeek+1, 'days');

        for(var i = dayOfWeek; i > 0 ; i--) {
            this.drawDay(clone.add(1, 'days'));
        }
    }

    Calendar.prototype.fowardFill = function() {
        var clone = this.current.clone().add(1, 'months').subtract(1, 'days');
        var dayOfWeek = clone.day();

        if(dayOfWeek === 6) { return; }

        for(var i = dayOfWeek; i < 6 ; i++) {
            this.drawDay(clone.add(1, 'days'));
        }
    }

    Calendar.prototype.currentMonth = function() {
        var clone = this.current.clone();

        while(clone.month() === this.current.month()) {
            this.drawDay(clone);
            clone.add(1, 'days');
        }
    }

    Calendar.prototype.getWeek = function(day) {
        if(!this.week || day.day() === 0) {
            this.week = createElement('div', 'week');
            this.month.appendChild(this.week);
        }
    }

    Calendar.prototype.drawDay = function(day) {
        var self = this;
        this.getWeek(day);

        //Outer Day
        var outer = createElement('div', this.getDayClass(day));
        outer.addEventListener('click', function() {
            self.openDay(this);
        });

        //Day Name
        var name = createElement('div', 'day-name', day.format('ddd'));

        //Day Number
        var number = createElement('div', 'day-number', day.format('DD'));

        if(day.month() === this.current.month()) {
            if(day.day() === 0){
                name.classList.add("sunday");
                number.classList.add("sunday");
            }
            if(Object.keys(HOLIDAYS).indexOf(day.format('YYYY-MM-DD')) !== -1) {
                name.classList.add("holiday");
                number.classList.add("holiday");
            }
        }

        //Events
        var events = createElement('div', 'day-events');
        this.drawEvents(day, events);

        outer.appendChild(name);
        outer.appendChild(number);
        outer.appendChild(events);
        this.week.appendChild(outer);
    }

    Calendar.prototype.drawEvents = function(day, element) {
        if(day.month() === this.current.month()) {

            var monthlyData = this.events[day.format('YYYYMM')];
            if(!monthlyData) return;

            var dailyData = monthlyData[day.date()];
            if(!dailyData) return;

            console.log(dailyData);

            for (var scheduleKey in dailyData) {
                if(!dailyData.hasOwnProperty(scheduleKey))
                    continue;

                console.log("ほげほげ");

                var colorNum = "colorNum" + dailyData[scheduleKey]['colorNum'];
                var evSpan = createElement('span', colorNum);
                element.appendChild(evSpan);
            }
        }
    }

    Calendar.prototype.getDayClass = function(day) {
        var classes = ['day'];
        if(day.month() !== this.current.month()) {
            classes.push('other');
        } else if (today.isSame(day, 'day')) {
            classes.push('today');
        }
        return classes.join(' ');
    }

    Calendar.prototype.openDay = function(el) {
        var details, arrow;
        var dayNumber = +el.querySelectorAll('.day-number')[0].innerText || +el.querySelectorAll('.day-number')[0].textContent;
        var day = this.current.clone().date(dayNumber);
        this.openedDay.date(dayNumber);

        var currentOpened = document.querySelector('.details');

        //Check to see if there is an open details box on the current row
        if(currentOpened && currentOpened.parentNode === el.parentNode) {
            details = currentOpened;
            arrow = document.querySelector('.arrow');
        } else {
            //Close the open events on different week row
            //currentOpened && currentOpened.parentNode.removeChild(currentOpened);
            if(currentOpened) {
                currentOpened.addEventListener('webkitAnimationEnd', function() {
                    currentOpened.parentNode.removeChild(currentOpened);
                });
                currentOpened.addEventListener('oanimationend', function() {
                    currentOpened.parentNode.removeChild(currentOpened);
                });
                currentOpened.addEventListener('msAnimationEnd', function() {
                    currentOpened.parentNode.removeChild(currentOpened);
                });
                currentOpened.addEventListener('animationend', function() {
                    currentOpened.parentNode.removeChild(currentOpened);
                });
                currentOpened.className = 'details out';
            }

            //Create the Details Container
            details = createElement('div', 'details in');

            //Create the arrow
            var arrow = createElement('div', 'arrow');

            //Create the event wrapper

            details.appendChild(arrow);
            el.parentNode.appendChild(details);
        }

        // var todaysEvents = this.events.reduce(function(memo, ev) {
        //     if(ev.date.isSame(day, 'day')) {
        //         memo.push(ev);
        //     }
        //     return memo;
        // }, []);
        var todaysEvents = null;
        var monthlyData = this.events[day.format('YYYYMM')];
        if(monthlyData) {
            var dailyData = monthlyData[day.date()];
            if(dailyData){
                todaysEvents = dailyData;
            }
        }

        this.renderEvents(todaysEvents, details);

        arrow.style.left = el.offsetLeft - el.parentNode.offsetLeft + 27 + 'px';
    }

    Calendar.prototype.renderEvents = function(events, ele) {
        //Remove any events in the current details element
        var currentWrapper = ele.querySelector('.events');
        var wrapper = createElement('div', 'events in' + (currentWrapper ? ' new' : ''));
        var self = this;

        if(events) {
            console.log(events);
            for(var eventKey in events) {
                if (!events.hasOwnProperty(eventKey)) continue;
                var colorNum = 'colorNum' + events[eventKey]["colorNum"];
                var chips = this.createChips(events[eventKey]["title"], colorNum);
                $(chips).find('i').on('click', function (ev) {
                    var toolTip = $(this).parent().parent();
                    var chipsNum = toolTip.index();
                    var clickedEventKey = Object.keys(events)[chipsNum];
                    var scheme = makeRefScheme(['calendar', groupKey, self.openedDay.format('YYYYMM'), self.openedDay.date(), clickedEventKey]);
                    defaultDatabase.ref(scheme).set(null).then(function (value) {
                        delete events[clickedEventKey];
                        toolTip.remove();
                        if($('.events.in').children().length === 1){
                            $(createEmptySpan()).insertBefore($('#add-schedule'));
                        }
                    }).catch(function (err) {
                        console.log('foirebase err', err);
                        showNotification('処理に失敗しました', 'danger');
                    });
                });
                wrapper.appendChild(chips);
            }

        } else {
            wrapper.appendChild(createEmptySpan());
        }

        wrapper.appendChild(createChipAddBtn());
        wrapper.appendChild(createTooltip());

        if(currentWrapper) {
            currentWrapper.className = 'events out';
            currentWrapper.addEventListener('webkitAnimationEnd', function() {
                currentWrapper.parentNode.removeChild(currentWrapper);
                ele.appendChild(wrapper);
            });
            currentWrapper.addEventListener('oanimationend', function() {
                currentWrapper.parentNode.removeChild(currentWrapper);
                ele.appendChild(wrapper);
            });
            currentWrapper.addEventListener('msAnimationEnd', function() {
                currentWrapper.parentNode.removeChild(currentWrapper);
                ele.appendChild(wrapper);
            });
            currentWrapper.addEventListener('animationend', function() {
                currentWrapper.parentNode.removeChild(currentWrapper);
                ele.appendChild(wrapper);
            });
        } else {
            ele.appendChild(wrapper);
        }
    }

    Calendar.prototype.drawLegend = function() {
        var legend = createElement('div', 'legend');
        var calendars = this.events.map(function(e) {
            return e.calendar + '|' + e.color;
        }).reduce(function(memo, e) {
            if(memo.indexOf(e) === -1) {
                memo.push(e);
            }
            return memo;
        }, []).forEach(function(e) {
            var parts = e.split('|');
            var entry = createElement('span', 'entry ' +  parts[1], parts[0]);
            legend.appendChild(entry);
        });
        this.el.appendChild(legend);
    }

    Calendar.prototype.nextMonth = function() {
        this.current.add(1, 'months');
        this.openedDay.add(1, 'months');
        this.next = true;
        this.draw();
    }

    Calendar.prototype.prevMonth = function() {
        this.current.subtract(1, 'months');
        this.openedDay.subtract(1, 'months');
        this.next = false;
        this.draw();
    }

    Calendar.prototype.createChips = function (innerText, color) {
        var ele = document.createElement('span');
        ele.className = "mdl-chip mdl-chip--deletable mdl-pre-upgrade " + color;
        ele.innerHTML =
            '<span class="mdl-chip__text mdl-pre-upgrade mdl-color-text--white">'+ innerText +'</span>'+
            '<a href="#" class="mdl-chip__action mdl-pre-upgrade"><i class="material-icons">cancel</i></a>';
        return ele;
    }

    window.Calendar = Calendar;

    function createElement(tagName, className, innerText) {
        var ele = document.createElement(tagName);
        if(className) {
            ele.className = className;
        }
        if(innerText) {
            ele.innderText = ele.textContent = innerText;
        }
        return ele;
    }
    
    function createChipAddBtn() {
        var ele = document.createElement('button');
        ele.className = 'mdl-button mdl-js-button mdl-button--icon mdl-pre-upgrade schedule-add';
        // ele.setAttribute('title', 'スケジュールを追加');
        ele.setAttribute('id', 'add-schedule');
        ele.innerHTML = '<i class="material-icons">add_circle</i>';
        return ele;
    }

    function createTooltip() {
        var ele = document.createElement('div');
        ele.className = "mdl-tooltip mdl-pre-upgrade";
        ele.setAttribute("data-mdl-for", "add-schedule");
        ele.innerHTML = 'スケジュールを追加';
        return ele;
    }
    
    function createMonthBtn(direction) {
        var btn = $('<button>', {
            class: "mdl-button mdl-js-button mdl-button--icon mdl-pre-upgrade " + direction
        });
        btn.html('<i class="fas fa-caret-'+ direction +'"></i>');
        return btn[0];
    }

    function createEmptySpan() {
        var div = createElement('div', 'event empty');
        var span = createElement('span', '', 'スケジュールがありません');
        div.appendChild(span);
        return div;
    }
}();

// !function() {
//     var data = [
//         { eventName: 'Lunch Meeting w/ Mark', calendar: 'Work', color: 'orange' },
//         { eventName: 'Interview - Jr. Web Developer', calendar: 'Work', color: 'orange' },
//         { eventName: 'Demo New App to the Board', calendar: 'Work', color: 'orange' },
//         { eventName: 'Dinner w/ Marketing', calendar: 'Work', color: 'orange' },
//
//         { eventName: 'Game vs Portalnd', calendar: 'Sports', color: 'blue' },
//         { eventName: 'Game vs Houston', calendar: 'Sports', color: 'blue' },
//         { eventName: 'Game vs Denver', calendar: 'Sports', color: 'blue' },
//         { eventName: 'Game vs San Degio', calendar: 'Sports', color: 'blue' },
//
//         { eventName: 'School Play', calendar: 'Kids', color: 'yellow' },
//         { eventName: 'Parent/Teacher Conference', calendar: 'Kids', color: 'yellow' },
//         { eventName: 'Pick up from Soccer Practice', calendar: 'Kids', color: 'yellow' },
//         { eventName: 'Ice Cream Night', calendar: 'Kids', color: 'yellow' },
//
//         { eventName: 'Free Tamale Night', calendar: 'Other', color: 'green' },
//         { eventName: 'Bowling Team', calendar: 'Other', color: '0' },
//         { eventName: 'Teach Kids to Code', calendar: 'Other', color: 'green' },
//         { eventName: 'Startup Weekend', calendar: 'Other', color: 'green' }
//     ];
//
//
//     function addDate(ev) {
//         data.push(ev);
//         calendar.renderEvents()
//     }
// }();

// function onClickBtn() {
//     console.log("btn clicked");
//     var newData = {
//         eventName: '全く新しい予定', calendar: 'Work', color: 'orange'
//     };
//     addDate(newData);
// }
//endregion////////////////////////////////////////////////////////////////////////


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
                    var uiConfig = createFbUiConfig(function (userObject, credential, redirectUrl) {
                        console.log(userObject);
                        user = userObject;
                        progress.hide();
                        $('#login_w').hide();
                        return false;
                    });

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
    setDrawerProfile(user);
    if (!dialog.showModal) {
        dialogPolyfill.registerDialog(dialog);
    }

    groupKey = getGroupKey();
    console.log("onLoginSuccess:", user, groupKey);

    defaultDatabase.ref("userData/" + user.uid + "/group").once("value").then(function (snapshot) {
       onGetSnapOfGroupNode(snapshot);
    });

    //カレンダーデータごっそりとっちゃう！すごいね！
    defaultDatabase.ref('calendar/' + groupKey).once("value").then(function (snapshot) {
        if(snapshot.exists()){
            calendar = new Calendar('#calendar', snapshot.toJSON());
        } else {
            onSnapShotVanished();
        }
        showAll();
    });

    defaultDatabase.ref('friend/'+ user.uid).once('value').then(function (snapshot) {
        if (snapshot.exists()) {
            friendJson = snapshot.toJSON();
            delete friendJson[DEFAULT];

            defaultDatabase.ref("group/" + groupKey).once("value").then(function (snapshot) {
                onGetGroupSnap(snapshot);
            });

        } else {
            console.log('friendJson !snapshot.exist()');
            onSnapShotVanished();
        }
    });

    //init dialog
    $(dialog).find(".close").on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('キャンセルクリック');
        if (isModalOpen === dialogAddFile && uploadTask) {
            uploadTask.cancel();
            uploadingData = null;
        }
        closeDialog();
        return false;
    });

    dialogPositibeBtn.on("click", function (e) {
        console.log("click", "add-group-btn");
        if(isModalOpen === dialogAddSch){
            addSchedule();
        } else if (isModalOpen === dialogRemoveContents) {

            var scheme = makeRefScheme(['group', groupKey, "contents", removeContentsKey]);
            defaultDatabase.ref(scheme).set(null).then(function (value) {
                delete groupJson['contents'][removeContentsKey];
                $('.card[key="' + removeContentsKey + '"]').remove();
                showNotification('削除しました', 'success');

            }).catch(function (err) {
                showOpeErrNotification(defaultDatabase);
                console.log(err);
            });

        } else if (isModalOpen === dialogExclude){
            //todo ユーザ削除動作
        } else if (isModalOpen === dialogEditComment) {

            var schemeE = makeRefScheme(['group', groupKey, "contents", removeContentsKey, "comment"]);
            var inputVal = $('#edit-comment-dialog').val();

            defaultDatabase.ref(schemeE).set(inputVal).then(function (value) {
                console.log("よろしい");
                var card = $('.file[key="'+ removeContentsKey +'"]');
                var subTitle = card.find(".mdl-list__item-sub-title");
                if(subTitle.length !== 0){
                    subTitle.html(inputVal);
                } else {
                    var insertEle = $('<span class="mdl-list__item-sub-title mdl-pre-upgrade">'+ inputVal +'</span>');
                    card.find('.mdl-list__item-primary-content').append(insertEle);
                    card.find('.mdl-list__item').addClass('mdl-list__item--two-line');
                    // insertEle.append(card.find('.mdl-list__item-primary-content'));
                    setElementAsMdl(insertEle);
                }
                groupJson['contents'][removeContentsKey]['comment'] = inputVal;

            }).catch(function (err) {
                showOpeErrNotification(defaultDatabase);
                console.log(err);
            });

        } else if (isModalOpen === dialogConfigGroup) {
            var input = $('#new-group-name');
            if(!input.val()){
                input.parent().addClass('is-invalid');
                return;
            }
            var photoUrl = $('#group-config img').attr('src');
            defaultDatabase.ref('group/'+groupKey+"/").update({
                photoUrl: photoUrl,
                groupName: input.val()

            }).then(function (value) {//todo バックエンドちゃんと動いてませんけど！

                showNotification('更新しました', 'success');

            }).catch(function (reason) {
                console.log(reason);
                showOpeErrNotification(defaultDatabase);
            });

        } else if (isModalOpen === dialogAddFile) {
            console.log('okボタンおされたよね');
            var inputComment =$('#new-file-comment');
            if (inputComment.val().indexOf(DELIMITER) !== -1) {
                inputComment.parent().addClass('is-invalid');
                return;
            } else if (!$('.drop-space').hasClass('is-uploaded') || !uploadingData) {
                console.log('is-uploaded');
                showNotification('ファイルを選択してください', 'warning');
                return;
            }

            uploadingData['comment'] = inputComment.val();
            defaultDatabase.ref('group/'+ groupKey +'/contents/'+ uploadingData.contentKey).update(uploadingData).then(function (value) {

                showNotification('更新しました', 'success');
                groupJson.contents[uploadingData.contentKey] = uploadingData;
                addOneContent(uploadingData.contentKey);

                uploadingData = null;

            }).catch(function (error) {
                console.log(error.code, error.message);
                showOpeErrNotification(defaultDatabase);
                uploadingData = null;
            });

        } else if (isModalOpen === dialogNewDoc) {
            var titleInput =$('#new-doc-title');
            var span = titleInput.parent().find('.mdl-textfield__error');
            var isValid = isValidAboutNullAndDelimiter(titleInput, span);
            if (!isValid) {
                titleInput.removeClass('is-invalid').removeClass('wrong-val');
                return;
            }

            var contInput = $('#new-doc-cont');
            var errSpanCont = contInput.parent().find('.mdl-textfield__error');
            var isValidCont = isValidAboutNullAndDelimiter(contInput, errSpanCont);
            if (!isValidCont) {
                contInput.removeClass('is-invalid').removeClass('wrong-val');
                return;
            }

            var key = defaultDatabase.ref('keyPusher').push().key;
            var ymd = moment().format('YYYYMMDD');
            var comment = {
                "title": titleInput.val(),
                "eleList": [
                    {
                        "content": contInput.val(),
                        "lastEdit": ymd,
                        "user": {
                            "isChecked": false,
                            "name": user.displayName,
                            "photoUrl": user.photoURL,
                            "userUid": user.uid
                        }
                    }
                ]
            };
            var updateObject ={
                contentKey: key,
                contentName: titleInput.val(),
                lastEdit: ymd,
                lastEditor: user.uid,
                whose: user.uid,
                type: 'document',
                comment: JSON.stringify(comment)
            };
            defaultDatabase.ref('group/'+ groupKey +'/contents/'+ key).set(updateObject).then(function (value) {

                groupJson.contents[updateObject.contentKey] = updateObject;
                showNotification('更新しました', 'success');
                addOneContent(updateObject.contentKey);

            }).catch(function (error) {
                console.log(error.code, error.message);
                showOpeErrNotification(defaultDatabase);
            });

        } else if (isModalOpen === dialogShareRec) {
            var keyD = defaultDatabase.ref('keyPusher').push().key;
            var ymdD = moment().format('YYYYMMDD');
            var updateObjectD ={
                contentKey: keyD,
                contentName: user.displayName + 'さんの記録',
                lastEdit: ymdD,
                lastEditor: user.uid,
                whose: user.uid,
                type: 'data'
            };
            defaultDatabase.ref('group/'+ groupKey +'/contents/'+ keyD).set(updateObjectD).then(function (value) {

                groupJson.contents[updateObjectD.contentKey] = updateObjectD;
                showNotification('更新しました', 'success');
                $('#add-record').fadeOut();
                $('#remove-my-rec').show();

            }).catch(function (error) {
                console.log(error.code, error.message);
                showOpeErrNotification(defaultDatabase);
            });

        } else if (isModalOpen === dialogInvite) {

            console.log('招待するでごんす');
            var checked = $('#invite-group').find('.mdl-checkbox.is-checked');
            if (!checked.length){
                closeDialog();
                return;
            }

            var commandKey = defaultDatabase.ref('keyPusher').push().key;
            var obj = createFbCommandObj(INVITE_GROUP, user.uid);
            obj['groupKey'] = groupKey;
            var keys = [];
            for (var i=0; i<checked.length; i++) {
                keys.push(checked.eq(i).find('.mdl-checkbox__input').attr('id'));
            }

            obj['keys'] = keys.join('_');//keyは絶対に'_'が含まれないためこのような実装が可能。

            //todo デバッグ済です
            defaultDatabase.ref('writeTask/'+ commandKey).update(obj).then(function () {

                var friends = Object.keys(friendJson);
                keys.forEach(function (key) {
                    showNotification('招待しました', 'success');
                    var invitedUser ={
                        isChecked: false,
                        photoUrl: friendJson[key]['photoUrl'],
                        name: friendJson[key]['name']
                    };
                    groupJson['member'][key] = invitedUser;
                    console.log(groupJson);

                    var li = createUserLi(key, friends);
                    $('#column2 .mdl-list').append(li);
                });

            }).catch(function (error) {
                console.log(error.code, error.message);
                showOpeErrNotification(defaultDatabase);
            });
        }
        closeDialog();
        return false;
    });

    $(".modal-circle-i").on("click", function (e){
        onClickModalCircleI($(this));
        return false;
    });
}

function setOnClickMenu(menus) {
    menus.eq(0).on('click', function (e) {
        e.preventDefault();
        console.log('click');
        openDialog(dialogConfigGroup, groupJson.groupName);
        return false;
    });
    menus.eq(1).on('click', function (e) {
        e.preventDefault();
        console.log('click');

        var key = null;
        if(groupJson.contents){
            for(var contentKey in groupJson.contents)
                if (groupJson.contents.hasOwnProperty(contentKey))
                    if(groupJson['contents'][contentKey]['type'] === 'data' && groupJson['contents'][contentKey]['whose'] === user.uid) {
                        key = contentKey;
                        break;
                    }
        }

        if(key) {
            defaultDatabase.ref('group/'+ groupKey + '/contents/' + contentKey).set(null).then(function (value) {
                delete groupJson['contents'][contentKey];
                menus.eq(1).hide();
                console.log(groupJson);
                showNotification('体調記録の共有を停止しました');
                $('#add-record').show();

            }).catch(function (error) {
                console.log(error.code, error.message);
                showOpeErrNotification(defaultDatabase);
            });
        } else
            showNotification(ERR_MSG_OPE_FAILED, 'danger');

        return false;
    });
}

function setOnClickGroupMemberConfigLis() {
    $('#member_conf').on('click', function (e) {
        e.preventDefault();
        console.log('click');

        if ($.isEmptyObject(friendJson)){
            showNotification('フレンドユーザが一人もいません。');
            return;
        }

        //誰か一人でもグループに参加していない友人がいるかチェック
        var isAddedFrined = false;
        for(var friendKey in friendJson) {
            if (!friendJson.hasOwnProperty(friendKey)) continue;

            var isAdded = false;
            for (var key in groupJson['member']) {
                if (!groupJson['member'].hasOwnProperty(key) || key === user.uid)
                    continue;
                if (friendKey === key) {
                    isAdded = true;
                    break;
                }
            }

            if(!isAdded){
                isAddedFrined = true;
                break;
            }
        }

        if (!isAddedFrined) {
            showNotification('このグループに参加していないフレンドユーザが一人もいません');
        } else {
            openDialog(dialogInvite);
        }
        return false;
    });
}

function setOnGroupImageClickLis() {
    $('.group-icon img').on('click', function (e) {
        console.log('click');
        e.preventDefault();
        $('#group-config input')[0].click();
        return false;
    });
}

function setOnGroupImageInputChange() {
    $('#group-config input').on('change', function (e) {
        e.preventDefault();
        console.log('input change');

        if(groupImageTask || !e.target.files || !e.target.files[0])
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
        if (extension.toLowerCase() !== 'jpeg' && extension.toLowerCase() !== 'jpg' && extension.toLowerCase() !== 'png') {
            showNotification('JPEGまたはPNGファイルのみアップロードできます', 'warning');
            return;
        }

        if(e.target.files[0].size > 5 * 1000 * 1000) {
            showNotification('5MBを超えるファイルはアップロードできません', 'warning');
            return;
        }

        var notification = showProgressNotification();

        var key = defaultDatabase.ref('keyPusher').push().key;
        var suf = mimeType.substring(4);//sufは'/'を含む
        console.log(suf);
        groupImageTask = firebase.storage().ref().child('group_icon').child(key+'.'+suf)
            .put(e.target.files[0]);

        groupImageTask.on('state_changed', function(snapshot){
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
            groupImageTask = null;//これで「キャンセルしました」が出なくなる
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
            var downloadURL = groupImageTask.snapshot.downloadURL;
            console.log(downloadURL);
            $('.group-icon img').attr('src', downloadURL);

            groupImageTask = null;
            notification.close();
            showNotification('ファイルをアップロードしました', 'success');
        });
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
        allow_dismiss: false,
        showProgressbar: true,
        delay: 0
    });
}

function setLisnters() {
    window.onclick = function(event) {
        // event.preventDefault();
        // if (event.target == dialog && isModalOpen !== dialogConfigGroup) {
        //     closeDialog();
        //     return false;
        // } else
        if($(event.target).hasClass('schedule-add') || $(event.target).parent().hasClass('schedule-add')){
            console.log("schedule-add");
            openDialog(dialogAddSch);
            return false;
        } else if ($(event.target).parent().parent().hasClass("modal-circle-i")) {
            return false;
            onClickModalCircleI($(event.target).parent().parent());
        } else if($(event.target) === $('#dummy-overlay')) {
            event.preventDefault();
            event.stopPropagation();
            console.log('こっち');
            return false;
        } else if ($(event.target) === $('#invite-group .mdl-checkbox__ripple-container')) {
            event.preventDefault();
            event.stopPropagation();
            console.log('こっち');
            return false;
        }
        console.log($(event.target));
        // return false;
    };

    $('#modal_input').keyup(function () {
        inputVal = $(this).val();
        if(inputVal && dialogPositibeBtn.attr('disabled')){
            dialogPositibeBtn.removeAttr('disabled');
        }
    });

    var menus = $('#setting-dp-ul').find('.mdl-menu__item');
    setOnClickMenu(menus);
    setOnClickGroupMemberConfigLis();
    setOnGroupImageClickLis();
    setOnGroupImageInputChange();
    $('#setting-dp-ul').show();
    setOnClickFabBtns();
    setFileModalListeners();
}

function setFileModalListeners() {
    var dropDiv = $('.drop-space');
    var isAdvancedUpload = function() {
        var div = document.createElement('div');
        return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
    }();

    if(isAdvancedUpload){
        dropDiv.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
        }).on('dragover dragenter', function() {
            if(!uploadingData && !uploadTask)
                dropDiv.addClass('is-dragover');
        }).on('dragleave dragend drop', function() {
            dropDiv.removeClass('is-dragover');
        }).on('drop', function(e) {
            if(!uploadingData && !uploadTask) {
                onNewFileInputChange(getFileFromTranfer(e));
            }
        });
    } else {
        dropDiv.find('.drag-cont i, .drag-cont p').hide();//todo 整備
    }

    $('.choose-file').on('click', function (e) {
        console.log('click');
        e.preventDefault();
        $('#dummy-overlay').trigger('click');
        return false;
    });

    $('#dummy-overlay').on('change', function (e) {
        console.log('input change');
        onNewFileInputChange(getFileFromTranfer(e));
        return false;
    });
}

function setOnClickFabBtns() {
    $('.overlay-fab').show();

    $('#overlay').on('click', function (e) {
        console.log('add-contents');
        openDialog(dialogAddFile);
        return false;
    });

    $('#add-doc').on('click', function (e) {
        openDialog(dialogNewDoc);
        return false;
    });

    var recordBtn = $('#add-record').on('click', function (e) {
        openDialog(dialogShareRec);
        return false;
    });

    if (groupJson.contents) {
        var contents = Object.values(groupJson.contents);
        var isMine = false;
        for(var i=0; i<contents.length; i++) {
            if(contents[i]['type'] === 'data' && contents[i]['whose'] === user.uid){
                isMine = true;
                break;
            }
        }

        if (isMine)
            recordBtn.hide();
        else {
            console.log('こっち');
            $('#setting-dp-ul .mdl-menu__item').eq(1).hide();
        }

    } else
        recordBtn.hide();
}

/**
 * if(uploadTask) -> アップロード最中
 * if(uploadingData) -> アップロードは完了済み
 */
function onNewFileInputChange(file) {
    console.log('input change', file);

    if(uploadTask || !file || uploadingData)
        return;

    var mimeType = file.type.toLowerCase();
    if(mimeType !== 'image/jpeg' && mimeType !== 'image/png' && mimeType !== 'image/gif' && mimeType !== "text/plain" &&
        mimeType !== "text/txt" && mimeType !== "text/html" && mimeType !== "text/css" && mimeType !== "text/xml" && mimeType !== "application/pdf") {
        console.log(mimeType);
        showNotification('そのファイル形式はアップロードできません', 'warning');
        return;
    }

    var fileName = file.name;
    var dotPos = fileName.indexOf('.');
    if(dotPos === -1){
        showNotification('そのファイル形式はアップロードできません', 'warning');
        return;
    }

    var extension = fileName.substring(dotPos+1);
    if(extension !== 'jpeg' && extension !== 'jpg' && extension !==  'png' && extension !== 'gif' && extension !== "txt" &&
        extension !== "html" && extension !== "css" && extension !== "xml" && extension !== "pdf") {
        showNotification('そのファイル形式はアップロードできません', 'warning');
        console.log(extension);
        return;
    }

    if(file.size > 10 * 1000 * 1000) {
        showNotification('10MBを超えるファイルはアップロードできません', 'warning');
        return;
    }

    $('.drop-space').addClass('is-uploading');

    // var notification = showProgressNotification();

    var key = defaultDatabase.ref('keyPusher').push().key;
    var suf = mimeType.substring(4);//sufは'/'を含む
    console.log(suf);

    uploadingData = {
        contentKey: key,
        contentName: fileName,
        type: mimeType,
        whose: user.uid,
        lastEditor: user.uid,
        lastEdit: moment().format('YYYYMMDD')
    };
    uploadTask = firebase.storage().ref().child('sample_share_file/'+ groupKey).child(key+'.'+suf)
        .put(file);

    var bar = $('.progress .mdl-progress');
    var p = $('.progress p');

    uploadTask.on('state_changed', function(snapshot){
        var progress = Math.floor((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        console.log('Upload is ' + progress + '% done');
        p.html(progress +'%アップロード');
        switch (snapshot.state) {
            case firebase.storage.TaskState.PAUSED: // or 'paused'
                console.log('Upload is paused');
                break;
            case firebase.storage.TaskState.RUNNING: // or 'running'
                console.log('Upload is running', progress);
                bar[0].MaterialProgress.setProgress(progress);
                break;
        }
    }, function (error) {
        //todo エラーデバッグすること
        uploadTask = null;//これで「キャンセルしました」が出なくなる
        uploadingData = null;
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
        $('.drop-space').removeClass('is-uploading');

    }, function () {
        var downloadURL = uploadTask.snapshot.downloadURL;
        console.log(downloadURL);

        $('.file-name').html(fileName);
        $('.box__success img').prop('src', getFileTypeImageUrl(mimeType));

        $('.drop-space').removeClass('is-uploading').addClass('is-uploaded');

        uploadTask = null;
        showNotification('ファイルをアップロードしました', 'success');
    });
}

function onClickModalCircleI(target) {
    $(".modal-circle-check.show").removeClass("show");
    target.next().addClass("show");
    clickedColor = target.parent().index();
    console.log("さーくるくりっく！");
}

function addSchedule() {
    console.log(clickedColor, inputVal, calendar.openedDay.format('YYYYMMDD'));
    var ym = calendar.openedDay.format('YYYYMM');
    var scheme = makeRefScheme(["calendar", groupKey, ym, calendar.openedDay.date()]);
    var eventKey = defaultDatabase.ref(scheme).push().key;
    var newData = {
        'colorNum' : clickedColor,
        'title' : inputVal
    };
    defaultDatabase.ref(makeRefScheme([scheme, eventKey])).update(newData).then(function () {
        if(!calendar.events[ym])
            calendar.events[ym] = {};
        if(!calendar.events[ym][calendar.openedDay.date()])
            calendar.events[ym][calendar.openedDay.date()] = {};

        calendar.events[ym][calendar.openedDay.date()][eventKey] = newData;
        var chips = calendar.createChips(inputVal, 'colorNum' + clickedColor);
        var eventEmpty = $('.events.in').find('.event.empty');
        if(eventEmpty){
            eventEmpty.remove();
        }
        $(chips).insertBefore($('#add-schedule'));
        console.log(calendar.events);

    }).catch(function (err) {
        console.log('firebase update err', err);
        showOpeErrNotification(defaultDatabase);
    });
}

function onGetGroupSnap(snapshot) {
    if(!snapshot.exists()){
        onSnapShotVanished();
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
    var keys = Object.keys(groupJson.member);
    var sortedKeys = [];
    var friends = Object.keys(friendJson);

    keys.forEach(function (key) {
        if(key === DEFAULT || key === user.uid)
            return;
        userList.append(createUserLi(key, friends));
    });

    $('.btn-group').dropdown();
}

function createUserLi(key, friends) {
    var member = groupJson["member"][key];
    var photoUrl = avoidNullValue(member.photoUrl, 'img/icon.png');
    var li = $(
        '<li class="mdl-list__item mdl-pre-upgrade" key="'+key+'">'+
            '<span class="mdl-list__item-primary-content mdl-pre-upgrade">'+
                '<img src="'+ photoUrl +'" alt="user-image">'+
                '<span>'+ member.name +'&nbsp;&nbsp;' +
                // '<span class="config"><i class="fas fa-cog" id='+ key +'></i></span>' +
                    '<div class="btn-group">'+
                        '<button type="button" class="btn btn-secondary dropdown-toggle rounded-circle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                            '<i class="fas fa-cog"></i>' +
                        '</button>'+
                        '<div class="dropdown-menu dropdown-menu-right">'+
                            '<button class="dropdown-item stop-share" type="button">体調記録のシェアをやめる</button>'+
                            '<button class="dropdown-item reg-my-user" type="button">自分のユーザリストに登録する</button>'+
                            '<button class="dropdown-item discourage" type="button">退会させる</button>'+
                            // '<button class="dropdown-item cancel-inv" type="button">招待をとりやめる</button>'+
                        '</div>'+
                    '</div>'+
                    // '</span>'+
                '</span>'+
            '</span>'+

            '<span class="mdl-list__item-secondary-action">'+
                '<span class="mdl-chip health-rec-btn">'+
                    '<span class="mdl-chip__text">体調記録&nbsp;&nbsp;<i class="fas fa-external-link-square-alt fa-lg"></i></span>'+
                '</span>'+
            '</span>'+
        '</li>'
    );

    //退会・招待とりやめ項目のセッティング
    var isAdded = groupJson["member"][key]['isChecked'];
    if (!isAdded)
        li.find('.discourage').hide();

    li.find('.discourage').on('click', function (e) {
        console.log('discourage');
        var li = $(this).parents('.mdl-list__item');
        var userKey = li.attr('key');
        var updates = {};
        updates['/group/'+ groupKey +'/member/'+ userKey] = null;
        updates['/userData/'+ userKey + '/group/'+ groupKey] = null;//todo バックエンドでは体調管理の共有があった場合にそのコンテンツを削除します。そのデバッグをやってください。

        defaultDatabase.ref().update(updates).then(function () {

            showNotification('ユーザを退会させました', 'success');
            li.remove();//todo これアニメつけたいなあ。
            delete groupJson["member"][userKey];
            //もし、退会させたユーザが友達ユーザである場合、そのユーザはグループに招待可能とならないといけない。でも、modalはその都度friendJsonから作成するから問題ない

        }).catch(function (error) {
            console.log(error.code, error.message);
            showOpeErrNotification(defaultDatabase);
        });
    });

    //体調記録シェア取りやめ項目のセッティング
    var isSharedRecord = false;
    for(var data in groupJson['contents']) {
        if (!groupJson['contents'].hasOwnProperty(data)) continue;

        if(data.type === 'data' && data.whose === key) {
            isSharedRecord = true;
            break;
        }
    }
    if (!isSharedRecord)
        li.find('.stop-share').hide();
    li.find('.stop-share').on('click', function (e) {
        console.log('stop-share clicked');
        //todo 未デバッグ バックエンドは不要
        defaultDatabase.ref('group/'+ groupKey +'/contents/' + key).set(null).then(function (value) {

            showNotification('体調記録の共有を停止しました', 'success');
            delete  groupJson['contents'][key];
            li.find('.health-rec-btn').hide();

        }).catch(function (error) {
            console.log(error.code, error.message);
            showOpeErrNotification(defaultDatabase);
        });
    });

    //ユーザ登録項目のセッティング
    var isFriend = friends.indexOf(key) !== -1;
    if (isFriend)
        li.find('.reg-my-user').hide();

    li.find('.reg-my-user').on('click', function (e) {

        var commandKey = defaultDatabase.ref('keyPusher').push().key;
        var targetUserKey = $(e.target).parents('.mdl-list__item').attr('key');
        var obj = createFbCommandObj(ADD_FRIEND, user.uid);
        obj['key'] = user.uid;
        obj['targetUserKey'] = targetUserKey;
        var self = $(this).closest('.mdl-list__item');

        defaultDatabase.ref('writeTask/'+ commandKey).update(obj).then(function () {

            showNotification('フレンドユーザに登録しました');
            friendJson[targetUserKey] = {
                name: groupJson['member'][targetUserKey]['name'],
                photoUrl: groupJson['member'][targetUserKey]['photoUrl'],
                isChecked: false
            };
            self.find('.reg-my-user').hide();
            if (!self.find('.dropdown-item:visible').length) {
                self.find('.dropdown-menu').hide();
            }

        }).catch(function (reason) {
            console.log(reason.code, reason.message);
            showOpeErrNotification(defaultDatabase);
        });
    });

    //全ての項目を表示させない場合、ドロップダウンを表示させない
    if (!isAdded && !isSharedRecord && isFriend)
        li.find('.dropdown-menu').hide();

    //chipsのセッティング
    if(!member.isChecked){//todo isCheckedなのか、isAddedなのか
        li.find('.health-rec-btn').removeClass('health-rec-btn').addClass('invited').find('.mdl-chip__text').html("招待中");
        // li.find('.mdl-list__item-secondary-action').remove();
        // li.find('div').addClass("mdl-badge").addClass('mdl-pre-upgrade').attr('data-badge', " ");
        // li.attr("title", "招待中");
    } else {

        li.find(".health-rec-btn").on('click', function (e) {
            e.preventDefault();
            var userUid = sortedKeys[$(this).index()];
            console.log('clicked uid:' + userUid);

            return false;
        });
    }

    return li;
}

function initContents() {
    if(groupJson.contents)
        for (var key in groupJson.contents)
            if (groupJson.contents.hasOwnProperty(key))
                addOneContent(key);
}

function addOneContent(key) {
    var contentData = groupJson["contents"][key];
    console.log(contentData);
    switch (contentData.type){
        case "document":
            appendContentAsDoc(contentData, key);
            break;
        case "image/jpeg":
        case "image/png":
        case "image/gif":
            new ContentAppenderForImg(contentData, key, timeline);
            break;
        case "data":
            break;
        case "text/plain":
        case "text/txt":
        case "text/html":
        case "text/css":
        case "text/xml":
        case "application/pdf":
            new ContentAppenderAsOtherFile(contentData, key, timeline);
            break;
    }
}

//todo 複数人数が話したときの用意
function appendContentAsDoc(contentData, key) {
    // var userName = groupJson["member"][contentData.whose]["name"];//todo 辞めた人間はどうする？？
    var json = JSON.parse(contentData.comment);
    var ymd = moment(contentData.lastEdit, "YYYYMMDD").format("YYYY.MM.DD");
    var element = null;

    for(var i=0; i<json.eleList.length; i++){
        console.log(json["eleList"][i]);
        var comments = json["eleList"][i]["content"].replace(/(?:\r\n|\r|\n)/g, DELIMITER).split(DELIMITER);
        var comment = '<p>'+ comments.join('</p><p>') +'</p>';
        var userName = json["eleList"][i]['user']['name'];
        var userUid = json["eleList"][i]['user']['userUid'];
        var userPhotoUrl = avoidNullValue(json["eleList"][i]['user']['photoUrl'], 'img/icon.png');
        if(i === 0) {
            element = createHtmlAsDoc(contentData.contentName, ymd, userName, comment, userPhotoUrl);
            element.attr('key', key);
            element.addClass('author-right');
            element.find('.comment-first').addClass('author-right');
            // setAsMyComment(element, userUid);
        } else {
            var cardCont = createHtmlAsDocFollower(userName, ymd, comment, userPhotoUrl);
            // setAsMyComment(cardCont, userUid);
            element.find('comment-follow').addClass('author-right');
            element.append(cardCont);
        }
    }

    element.find('.remove_btn').on('click', function (ev) {
        removeContentsKey = key;
        openDialog(dialogRemoveContents, contentData.contentName);
        return false;
    });

    timeline.prepend(element);
}

(function() {
    function ContentAppenderForImg (contentData, key, timeline) {
        this.mContentData = contentData;
        this.mKey = key;
        this.mTmeline = timeline;

        var ymd = moment(this.mContentData.lastEdit, "YYYYMMDD").format("YYYY.MM.DD");
        var userName = groupJson["member"][this.mContentData.lastEditor]["name"];//todo 辞めた人間はどうする？？
        var commentPre = this.mContentData.comment;
        var comment = commentPre ?
            commentPre.replace(/(?:\r\n|\r|\n)/g, "<br />") : null;
        var photoUrl = avoidNullValue(groupJson["member"][this.mContentData.whose]["photoUrl"], 'img/icon.png');

        var fileUrl = getFileTypeImageUrl(contentData.type);
        // ele.find('.file-icon').attr('src', fileUrl);
        console.log("fileUrl: ", fileUrl);
        var ele = createHtmlAsData(userName + " at " + ymd, this.mContentData.contentName, comment, key, photoUrl, fileUrl);

        if (contentData.whose === user.uid) {
            ele.find('.edit-comment').on('click', function (ev) {
                console.log(commentPre);
                removeContentsKey = key;
                dialogEditComment.find('#edit-comment-dialog').val(commentPre);
                openDialog(dialogEditComment);
                return false;
            });
        } else {
            ele.find('.edit-comment').hide();
        }

        ele.find('.remove_btn').on('click', function (ev) {
            removeContentsKey = key;
            openDialog(dialogRemoveContents, contentData.contentName);
            return false;
        });

        this.mTmeline.prepend(ele);
        var img = ele.find('.show-img img');
        firebase.storage().ref("shareFile/" + groupKey +"/"+ this.mKey).getDownloadURL().then(function(url) {
            // Insert url into an <img> tag to "download"
            img.attr("src", url);
            img.on('click', function (ev) {
                window.open(url);
            });
        }).catch(function(error) {
            var errIcon = $(
                '<span class="mdl-list__item-secondary-content mdl-pre-upgrade">'+
                    '<i class="material-icons error-icon" title="画像を取得できませんでした">sms_failed</i>'+
                '</span>'
                );

            ele.find('li.mdl-list__item').append(errIcon);
            ele.find('.show-img').hide();
            setElementAsMdl(ele);
            initTippyNormal();

            // A full list of error codes is available at
            // https://firebase.google.com/docs/storage/web/handle-errors
            //todo ここ未デバッグなんでデバッグして
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

            console.log(error);
        });
    }

    window.ContentAppenderForImg = ContentAppenderForImg;
})();


(function () {
    function ContentAppenderAsOtherFile(contentData, key, timeline) {
        this.mContentData = contentData;
        this.mKey = key;
        this.mTmeline = timeline;

        var ymd = moment(this.mContentData.lastEdit, "YYYYMMDD").format("YYYY.MM.DD");
        var userName = groupJson["member"][this.mContentData.lastEditor]["name"];//todo 辞めた人間はどうする？？
        var commentPre = this.mContentData.comment;
        var comment = commentPre ?
            commentPre.replace(/(?:\r\n|\r|\n)/g, "<br />") : null;
        var photoUrl = avoidNullValue(groupJson["member"][this.mContentData.whose]["photoUrl"], 'img/icon.png');

        var fileUrl = getFileTypeImageUrl(contentData.type);

        var ele = createHtmlAsData(userName + " at " + ymd, this.mContentData.contentName, comment, key, photoUrl, fileUrl);

        if (contentData.whose === user.uid) {
            ele.find('.edit-comment').on('click', function (ev) {
                console.log(commentPre);
                removeContentsKey = key;
                dialogEditComment.find('#edit-comment-dialog').val(commentPre);
                openDialog(dialogEditComment);
                return false;
            });
        } else {
            ele.find('.edit-comment').hide();
        }

        ele.find('.show-img').hide();

        this.mTmeline.prepend(ele);

        firebase.storage().ref("shareFile/" + groupKey +"/"+ this.mKey).getDownloadURL().then(function(url) {
            var openFileIcon = $(
                '<span class="mdl-list__item-secondary-content mdl-pre-upgrade">'+
                    '<span class="mdl-chip mdl-pre-upgrade show-file">'+
                        '<span class="mdl-chip__text mdl-pre-upgrade">ファイルを表示&nbsp;&nbsp;<i class="fas fa-external-link-square-alt fa-lg"></i></span>'+
                    '</span>'+
                '</span>'
            );
            ele.find('li.mdl-list__item').append(openFileIcon);

            setElementAsMdl(ele);

            openFileIcon.on('click', function (ev) {
                window.open(url);
                return false;
            });

        }).catch(function(error) {
            var errIcon = $(
                '<span class="mdl-list__item-secondary-content mdl-pre-upgrade">'+
                    '<i class="material-icons" title="ファイルを取得できませんでした">sms_failed</i>'+
                '</span>'
            );

            ele.find('.mdl-list__item').append(errIcon);
            setElementAsMdl(ele);

            // A full list of error codes is available at
            // https://firebase.google.com/docs/storage/web/handle-errors
            //todo ここ未デバッグなんでデバッグして
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

            console.log(error);
        });
    }

    window.ContentAppenderAsOtherFile = ContentAppenderAsOtherFile;
})();

function createHtmlAsData(header, title, comment, key, photoUrl, fileUrl) {
    var ele =  $(
        '<div class="card file" key="'+ key +'">'+
            '<div class="ele_header">'+
                '<img class="user-icon" src="'+ photoUrl +'" alt="user-icon">'+
                '<span class="event_title">'+ header +'</span>'+
                '<div class="mdl-layout-spacer mdl-pre-upgrade"></div>'+
                '<button class="mdl-button mdl-js-button mdl-button--icon edit-comment ele_header_button mdl-pre-upgrade" title="コメントを編集">'+
                    '<i class="fas fa-comment"></i>'+
                '</button>'+
                '<button class="mdl-button mdl-js-button mdl-button--icon remove_btn ele_header_button mdl-pre-upgrade" title="コンテンツを削除">'+
                    '<i class="fas fa-times"></i>'+
                '</button>'+
                // '<button class="mdl-button mdl-js-button mdl-button--icon arrow_down ele_header_button mdl-pre-upgrade">'+
                //     '<i class="fas fa-angle-down">'+'</i>'+
                // '</button>'+
                // '<button class="mdl-button mdl-js-button mdl-button--icon arrow_up ele_header_button mdl-pre-upgrade">'+
                //     '<i class="fas fa-angle-up"></i>'+
                // '</button>'+
            '</div>'+

            '<div class="flex-box file-wrapper">'+
                '<img class="file-icon" src="'+ fileUrl +'" alt="file-icon">'+
                '<ul class="mdl-list mdl-pre-upgrade">'+
                    '<li class="mdl-list__item mdl-list__item--two-line mdl-pre-upgrade">'+
                        '<span class="mdl-list__item-primary-content mdl-pre-upgrade">'+
                            '<span>'+ title +'</span>'+
                            '<span class="mdl-list__item-sub-title mdl-pre-upgrade">'+ comment +'</span>'+
                        '</span>'+
                        // '<span class="mdl-list__item-secondary-content mdl-pre-upgrade">'+
                        //     '<button id="hogehogeef" class="mdl-button mdl-js-button mdl-button--ico mdl-pre-upgrade">'+
                        //         '<i class="material-icons">more_ver</i>'+
                        //     '</button>'+
                        // '</span>'+
                    '</li>'+
                '</ul>'+
            '</div>'+
            '<div class="show-img">'+
                '<img alt="file-icon">'+
            '</div>'+
        '</div>');

    if(!comment){
        ele.find('.mdl-list__item-sub-title').remove();
        ele.find(".mdl-list__item--two-line").removeClass('mdl-list__item--two-line');
    }

    return ele;
}

function createHtmlAsDoc(title, ymd, whose, comment, photoUrl) {
    return $(
        '<div class="card comments">'+
            '<div class="ele_header">'+
                '<i class="fas fa-comments fa-lg ele-icon"></i>'+
                '<span class="event_title">'+ title +'</span>'+
                '<div class="mdl-layout-spacer"></div>'+
                '<button class="mdl-button mdl-js-button mdl-button--icon remove_btn ele_header_button mdl-pre-upgrade">'+
                    '<i class="fas fa-times"></i>'+
                '</button>'+
                // '<button class="mdl-button mdl-js-button mdl-button--icon arrow_up ele_header_button">'+
                //     '<i class="fas fa-angle-up">'+'</i>'+
                // '</button>'+
            '</div>'+

            '<hr class="seem">'+

            '<div class="card-cont">'+
                '<div class="comment-first space-horizontal">'+
                    '<ul class="demo-list-three mdl-list">'+
                        '<li class="mdl-list__item mdl-list__item--two-line mdl-pre-upgrade">'+
                            '<span class="mdl-list__item-primary-content mdl-pre-upgrade">'+
                                '<img src="'+ photoUrl +'" alt="userA" class="mdl-list__item-icon mdl-pre-upgrade">'+
                                '<span>'+ whose +'</span>'+
                                '<span class="mdl-list__item-sub-title mdl-pre-upgrade">'+ ymd +'</span>'+
                            '</span>'+
                        '</li>'+
                    '</ul>'+
                '<div class="comment-cont">'+ comment +'</div>'+
            '</div>'+

            // '<hr class="seem">'+

            // '<div class="comment-follow">'+
            //     '<header class="flex-box">'+
            //         '<img src="img/icon.png" alt="userA" class="mdl-list__item-icon author-left">'+
            //         '<div>'+
            //             '<p class="comment-author">田村ピロシキ</p>'+
            //             '<p class="comment-time">2017.11.15</p>'+
            //         '</div>'+
            //     '</header>'+
            // '<div class="comment-cont">'+
            //     '<p>流石としかいいようがない。三行目の「Z」は「G」と表記しているサイトもあったが、</p>'+
            // '</div>'+
        '</div>');
}

function createHtmlAsDocFollower(userName, ymd, comment, userPhotoUrl) {
    return $(
        '<div>'+
            '<hr class="seem">'+
            '<div class="comment-follow">'+
            '<header class="flex-box">'+
                '<img src="'+ userPhotoUrl +'" alt="userA" class="mdl-list__item-icon author-left">'+
                '<div>'+
                    '<p class="comment-author">'+ userName +'</p>'+
                    '<p class="comment-time">'+ ymd +'</p>'+
                '</div>'+
            '</header>'+
            '<div class="comment-cont">'+ comment +'</div>'+
        '</div>');
}

// function setAsMyComment(element, userUid) {
//     if (userUid === user.uid) {
//         element.find('.comment-first, comment-follow').addClass('author-right');
//     }
// }

function closeDialog() {
    dialog.close();
    isModalOpen = false;
}

//todo ここセレクタ使ってまとめるべし
function openDialog(toShowEle, fileName) {
    if(isModalOpen)
        return;

    isModalOpen = toShowEle;
    toShowEle.css('display', 'inline');

    if(toShowEle === dialogAddSch){
        dialogPositibeBtn.html('追加');
        dialogPositibeBtn.attr('disabled', '');
        dialogExclude.hide();
        dialogRemoveContents.hide();
        dialogEditComment.hide();
        dialogConfigGroup.hide();
        dialogAddFile.hide();
        dialogNewDoc.hide();
        dialogShareRec.hide();
        dialogInvite.hide();
        $('#modal_input').val('');

    } else if (toShowEle === dialogExclude){
        dialogPositibeBtn.html('退会させる');
        dialogAddSch.hide();
        dialogRemoveContents.hide();
        dialogEditComment.hide();
        dialogConfigGroup.hide();
        dialogAddFile.hide();
        dialogNewDoc.hide();
        dialogShareRec.hide();
        dialogInvite.hide();
        dialogPositibeBtn.removeAttr('disabled');

    } else if (toShowEle === dialogRemoveContents){
        dialogPositibeBtn.html('削除する');
        dialogPositibeBtn.removeAttr('disabled');
        dialogExclude.hide();
        dialogAddSch.hide();
        dialogEditComment.hide();
        dialogConfigGroup.hide();
        dialogAddFile.hide();
        dialogNewDoc.hide();
        dialogShareRec.hide();
        dialogInvite.hide();
        dialogRemoveContents.find('p').html("本当に「" + fileName + "」を削除しますか？");

    } else if (toShowEle === dialogConfigGroup) {
        dialogPositibeBtn.removeAttr('disabled');
        dialogPositibeBtn.html('OK');
        dialogExclude.hide();
        dialogRemoveContents.hide();
        dialogAddSch.hide();
        dialogEditComment.hide();
        dialogAddFile.hide();
        dialogNewDoc.hide();
        dialogShareRec.hide();
        dialogInvite.hide();
        $(dialog).removeClass('modal-new-doc-m');

        var input = $('#new-group-name').val(fileName);
        var img = $('#group-config img');
        console.log(img, img.length, groupJson.photoUrl);
            img.attr('src', groupJson.photoUrl);
        dialog.showModal();//これつけないとlabelがテキストに重なってしまう
        input.parent().addClass('is-dirty').removeClass('is-invalid');
        return;

    } else if (toShowEle === dialogEditComment) {
        dialogPositibeBtn.removeAttr('disabled');
        dialogPositibeBtn.html('OK');
        dialogExclude.hide();
        dialogRemoveContents.hide();
        dialogAddSch.hide();
        dialogConfigGroup.hide();
        dialogAddFile.hide();
        dialogNewDoc.hide();
        dialogShareRec.hide();
        dialogInvite.hide();

    } else if (toShowEle === dialogAddFile) {
        dialogPositibeBtn.removeAttr('disabled');
        dialogPositibeBtn.html('OK');
        dialogExclude.hide();
        dialogRemoveContents.hide();
        dialogAddSch.hide();
        dialogEditComment.hide();
        dialogConfigGroup.hide();
        dialogNewDoc.hide();
        dialogShareRec.hide();
        dialogInvite.hide();
        $('#new-file-comment').val('').parent().removeClass('is-invalid');
        $('.drop-space').removeClass('is-uploading').removeClass('is-uploaded');

    } else if (toShowEle === dialogNewDoc) {
        dialogPositibeBtn.removeAttr('disabled');
        dialogPositibeBtn.html('OK');
        dialogExclude.hide();
        dialogRemoveContents.hide();
        dialogAddSch.hide();
        dialogEditComment.hide();
        dialogAddFile.hide();
        dialogConfigGroup.hide();
        dialogShareRec.hide();
        dialogInvite.hide();

        $('#new-doc-title').val('').parent().removeClass('is-invalid').removeClass('wrong-val');
        $('#new-doc-cont').val('').parent().removeClass('is-invalid').removeClass('wrong-val');

    } else if (toShowEle === dialogShareRec) {
        dialogPositibeBtn.removeAttr('disabled');
        dialogPositibeBtn.html('OK');
        dialogExclude.hide();
        dialogRemoveContents.hide();
        dialogAddSch.hide();
        dialogEditComment.hide();
        dialogAddFile.hide();
        dialogConfigGroup.hide();
        dialogNewDoc.hide();
        dialogInvite.hide();

    } else if (toShowEle === dialogInvite) {

        var ul = $('#invite-group .mdl-list');
        ul.children().remove();
        console.log(friendJson);
        for(var friendKey in friendJson) {
            if (!friendJson.hasOwnProperty(friendKey)) continue;

            var isAdded = false;
            for (var key in groupJson['member']) {
                if (!groupJson['member'].hasOwnProperty(key) || key === user.uid)
                    continue;
                if (friendKey === key) {
                    isAdded = true;
                    break;
                }
            }

            if (isAdded) continue;

            var friendName = avoidNullValue(friendJson[friendKey]['name'], 'ユーザ名未設定');
            var photoUrl = avoidNullValue(friendJson[friendKey]['photoUrl'], '../dist/img/icon.png');
            $(
                '<li class="mdl-list__item mdl-pre-upgrade" key="'+ friendKey +'">'+
                    '<span class="mdl-list__item-primary-content mdl-pre-upgrade">'+
                        '<img src="'+ photoUrl +'" class="mdl-list__item-avatar mdl-pre-upgrade">'+
                        '<span>'+ friendName +'</span>'+
                    '</span>'+
                    '<div class="mdl-layout-spacer"></div>'+
                    '<div class="mdl-list__item-secondary-action mdl-pre-upgrade">'+
                        '<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-pre-upgrade" for="'+ friendKey +'">'+
                            '<input type="checkbox" id="'+ friendKey +'" class="mdl-checkbox__input mdl-pre-upgrade">'+
                        '</label>'+
                    '</div>'+
                '</li>'
            ).appendTo(ul);
        }

        // if(ul.children().length === 0){
        //     showNotification('追加できるユーザがいません', 'warning');
        //     return;
        // }

        setElementAsMdl(ul);

        dialogPositibeBtn.removeAttr('disabled');
        dialogPositibeBtn.html('OK');
        dialogExclude.hide();
        dialogRemoveContents.hide();
        dialogAddSch.hide();
        dialogEditComment.hide();
        dialogAddFile.hide();
        dialogConfigGroup.hide();
        dialogNewDoc.hide();
        dialogShareRec.hide();
    }

    if(toShowEle === dialogNewDoc) {
        $(dialog).addClass('modal-new-doc-m');
    } else {
        $(dialog).removeClass('modal-new-doc-m');
    }

    dialog.showModal();
}

function getGroupKey() {
    var url = new URL(window.location.href);
    return url.searchParams.get("key");
}

function onSnapShotVanished() {
    if (!initialErr)
        showOpeErrNotification(defaultDatabase, -1);
    initialErr = true;
}

function onGetSnapOfGroupNode(snapshot) {
    if(!snapshot.exists()){
        onSnapShotVanished();
        console.log("snapShot存在せず" + snapshot);
        return;
    }

    groupNodeJson = snapshot.toJSON();
    console.log(groupJson);
    var ul = $("#group-dp-ul");
    var count = 0;
    console.log(groupNodeJson);
    var liGroupKeys = [];
    Object.keys(groupNodeJson).forEach(function (key) {
        if(key === DEFAULT || !groupNodeJson[key]["added"])//todo 招待中のグループはどうする？
            return;

        if(key === groupKey) {
            $('.mdl-layout__header-row .mdl-layout-title').html(groupNodeJson[key]['name']);
            $('.mdl-layout__header-row img').attr('src', avoidNullValue(groupNodeJson[key]['photoUrl'], 'img/icon.png'));
        } else {
            var li = $('<li>', {
                class: "mdl-menu__item"
            }).html(groupNodeJson[key]['name']);

            li.on('click', function (ev) {
                var index = $(this).index();
                window.location.href = 'WSEntryPoint/group/index.html?key=' + liGroupKeys[index];//todo ここリリース時は変更してね
                return false;
            });

            li.appendTo(ul);

            liGroupKeys.push(key);
            count++;
        }
    });

    if(count === 0)
        $("#group-drp-btn").hide();

    showAll();
}

function showAll() {
    console.log("showAll()");
    if(asyncCount !== 2){
        asyncCount++;
        return;
    }

    setLisnters();

    setElementAsMdl($('body'));

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

    tippy('.overlay-fab', {
        updateDuration: 0,
        dynamicTitle: false,
        distance: 10,
        placement: 'left',
        popperOptions: {
            modifiers: {
                preventOverflow: {
                    enabled: false
                }
            }
        }
    });

    initTippyNormal();

    postLoad.show();
}

function initTippyNormal() {
    tippy('[title]', {
        updateDuration: 0,
        dynamicTitle: false,
        popperOptions: {
            modifiers: {
                preventOverflow: {
                    enabled: false
                }
            }
        }
    });
}