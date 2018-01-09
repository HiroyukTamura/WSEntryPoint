const postLoad = $('#post_load');
const DEFAULT = 'DEFAULT';
var progress = $('#progress');
const dialog = $('dialog')[0];
const timeline = $('#left-pain');
var asyncCount = 0;
var defaultApp;
var defaultDatabase;
var user;
var groupJson;
var groupNodeJson;
var groupKey;
var isModalOpen = false;
const DELIMITER = '9mVSv';
const holidays = {
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

/////////////////EventCalendar(手を加えていない部分)////////////////////
!function() {

    var today = moment();

    function Calendar(selector, events) {
        this.el = document.querySelector(selector);
        this.events = events;
        this.current = moment().date(1);
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

        this.drawLegend();
    }

    Calendar.prototype.drawHeader = function() {
        var self = this;
        if(!this.header) {
            //Create the header elements
            this.header = createElement('div', 'header');
            this.header.className = 'header';

            this.title = createElement('h1');

            var right = createElement('div', 'right');
            right.addEventListener('click', function() { self.nextMonth(); });

            var left = createElement('div', 'left');
            left.addEventListener('click', function() { self.prevMonth(); });

            //Append the Elements
            this.header.appendChild(this.title);
            this.header.appendChild(right);
            this.header.appendChild(left);
            this.el.appendChild(this.header);
        }

        this.title.innerHTML = this.current.format('YYYY.MM');
    }

    Calendar.prototype.drawMonth = function() {
        var self = this;

        this.events.forEach(function(ev) {
            ev.date = self.current.clone().date(Math.random() * (29 - 1) + 1);
        });


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

        clone.subtract('days', dayOfWeek+1);

        for(var i = dayOfWeek; i > 0 ; i--) {
            this.drawDay(clone.add('days', 1));
        }
    }

    Calendar.prototype.fowardFill = function() {
        var clone = this.current.clone().add('months', 1).subtract('days', 1);
        var dayOfWeek = clone.day();

        if(dayOfWeek === 6) { return; }

        for(var i = dayOfWeek; i < 6 ; i++) {
            this.drawDay(clone.add('days', 1));
        }
    }

    Calendar.prototype.currentMonth = function() {
        var clone = this.current.clone();

        while(clone.month() === this.current.month()) {
            this.drawDay(clone);
            clone.add('days', 1);
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
        if(day.day() === 0){
            name.classList.add("sunday");
        }
        if(Object.keys(holidays).indexOf(day.format('YYYY-MM-DD')) !== -1) {
            name.classList.add("holiday");
        }

        //Day Number
        var number = createElement('div', 'day-number', day.format('DD'));


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
            var todaysEvents = this.events.reduce(function(memo, ev) {
                if(ev.date.isSame(day, 'day')) {
                    memo.push(ev);
                }
                return memo;
            }, []);

            todaysEvents.forEach(function(ev) {
                var evSpan = createElement('span', ev.color);
                element.appendChild(evSpan);
            });
        }
    }

    Calendar.prototype.getDayClass = function(day) {
        classes = ['day'];
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

        var currentOpened = document.querySelector('.details');

        //Check to see if there is an open detais box on the current row
        if(currentOpened && currentOpened.parentNode === el.parentNode) {
            details = currentOpened;
            arrow = document.querySelector('.arrow');
        } else {
            //Close the open events on differnt week row
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

        var todaysEvents = this.events.reduce(function(memo, ev) {
            if(ev.date.isSame(day, 'day')) {
                memo.push(ev);
            }
            return memo;
        }, []);

        this.renderEvents(todaysEvents, details);

        arrow.style.left = el.offsetLeft - el.parentNode.offsetLeft + 27 + 'px';
    }

    Calendar.prototype.renderEvents = function(events, ele) {
        //Remove any events in the current details element
        var currentWrapper = ele.querySelector('.events');
        var wrapper = createElement('div', 'events in' + (currentWrapper ? ' new' : ''));

        events.forEach(function(ev) {
            var div = createElement('div', 'event');
            var square = createElement('div', 'event-category ' + ev.color);
            var span = createElement('span', '', ev.eventName);

            div.appendChild(square);
            div.appendChild(span);
            wrapper.appendChild(div);
        });

        if(!events.length) {
            var div = createElement('div', 'event empty');
            var span = createElement('span', '', 'No Events');

            div.appendChild(span);
            wrapper.appendChild(div);
        }

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
        this.current.add('months', 1);
        this.next = true;
        this.draw();
    }

    Calendar.prototype.prevMonth = function() {
        this.current.subtract('months', 1);
        this.next = false;
        this.draw();
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
}();

// !function() {
    var data = [
        { eventName: 'Lunch Meeting w/ Mark', calendar: 'Work', color: 'orange' },
        { eventName: 'Interview - Jr. Web Developer', calendar: 'Work', color: 'orange' },
        { eventName: 'Demo New App to the Board', calendar: 'Work', color: 'orange' },
        { eventName: 'Dinner w/ Marketing', calendar: 'Work', color: 'orange' },

        { eventName: 'Game vs Portalnd', calendar: 'Sports', color: 'blue' },
        { eventName: 'Game vs Houston', calendar: 'Sports', color: 'blue' },
        { eventName: 'Game vs Denver', calendar: 'Sports', color: 'blue' },
        { eventName: 'Game vs San Degio', calendar: 'Sports', color: 'blue' },

        { eventName: 'School Play', calendar: 'Kids', color: 'yellow' },
        { eventName: 'Parent/Teacher Conference', calendar: 'Kids', color: 'yellow' },
        { eventName: 'Pick up from Soccer Practice', calendar: 'Kids', color: 'yellow' },
        { eventName: 'Ice Cream Night', calendar: 'Kids', color: 'yellow' },

        { eventName: 'Free Tamale Night', calendar: 'Other', color: 'green' },
        { eventName: 'Bowling Team', calendar: 'Other', color: 'green' },
        { eventName: 'Teach Kids to Code', calendar: 'Other', color: 'green' },
        { eventName: 'Startup Weekend', calendar: 'Other', color: 'green' }
    ];


    function addDate(ev) {
        data.push(ev);
        calendar.renderEvents()
    }

    var calendar = new Calendar('#calendar', data);
// }();

function onClickBtn() {
    console.log("btn clicked");
    var newData = {
        eventName: '全く新しい予定', calendar: 'Work', color: 'orange'
    };
    addDate(newData);
}
////////////////////////////////////////////////////////////////////////


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
    var sortedKeys = [];

    keys.forEach(function (key) {
        if(key === DEFAULT || key === user.uid)
            return;

        sortedKeys.push(key);

        var member = groupJson["member"][key];
        var photoUrl = avoidNullValue(member.photoUrl, 'img/icon.png');
        var li = $(
            '<li class="mdl-list__item mdl-pre-upgrade">'+
                '<span class="mdl-list__item-primary-content mdl-pre-upgrade">'+
                    '<img src="'+ photoUrl +'" alt="user-image">'+
                    '<span>'+ member.name +'</span>'+
                '</span>'+
                '<span class="mdl-list__item-secondary-action">'+
                    '<span class="mdl-chip health-rec-btn">'+
                        '<span class="mdl-chip__text">体調記録&nbsp;&nbsp;<i class="fas fa-external-link-square-alt fa-lg"></i></span>'+
                    '</span>'+
                '</span>'+
            '</li>'
        );

        if(!member.isChecked){//todo isCheckedなのか、isAddedなのか
            li.find('.health-rec-btn').removeClass('health-rec-btn').addClass('invited').find('.mdl-chip__text').html("招待中");
            // li.find('.mdl-list__item-secondary-action').remove();
            // li.find('div').addClass("mdl-badge").addClass('mdl-pre-upgrade').attr('data-badge', " ");
            // li.attr("title", "招待中");
        } else {

            li.find(".health-rec-btn").on('click', function (ev) {
                var userUid = sortedKeys[$(this).index()];
                console.log('clicked uid:' + userUid);
            });

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
            case "document":
                appendContentAsDoc(contentData, key);
                break;
            case "image/jpeg":
                new ContentAppenderForImg(contentData, key, timeline);
                break;
        }
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
            setAsMyComment(element, userUid);
        } else {
            var cardCont = createHtmlAsDocFollower(userName, ymd, comment, userPhotoUrl);
            setAsMyComment(cardCont, userUid);
            element.append(cardCont);
        }
    }

    timeline.append(element);
}

(function() {
    function ContentAppenderForImg (contentData, key, timeline) {
        this.mContentData = contentData;
        this.mKey = key;
        this.mTmeline = timeline;

        var ymd = moment(this.mContentData.lastEdit, "YYYYMMDD").format("YYYY.MM.DD");
        var userName = groupJson["member"][this.mContentData.lastEditor]["name"];//todo 辞めた人間はどうする？？
        var comment = this.mContentData.comment.replace(/(?:\r\n|\r|\n)/g, "<br />");
        var ele = createHtmlAsData(userName + " at " + ymd, this.mContentData.contentName, comment);

        this.mTmeline.append(ele);
        var img = ele.find('.show-img img');
        firebase.storage().ref("shareFile/" + groupKey +"/"+ this.mKey).getDownloadURL().then(function(url) {
            // Insert url into an <img> tag to "download"
            img.attr("src", url);
        }).catch(function(error) {
            // A full list of error codes is available at
            // https://firebase.google.com/docs/storage/web/handle-errors
            //todo エラー処理
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
    }

    window.ContentAppenderForImg = ContentAppenderForImg;
})();

function createHtmlAsData(header, title, comment) {
    var ele =  $(
        '<div class="card file">'+
            '<div class="ele_header">'+
                '<i class="fas fa-comments fa-lg ele-icon"></i>'+
                '<span class="event_title">'+ header +'</span>'+
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
                '<ul class="mdl-list mdl-pre-upgrade">'+
                    '<li class="mdl-list__item mdl-list__item--two-line mdl-pre-upgrade">'+
                        '<span class="mdl-list__item-primary-content mdl-pre-upgrade">'+
                            '<span>'+ title +'</span>'+
                            '<span class="mdl-list__item-sub-title mdl-pre-upgrade">' +comment+ '</span>'+
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
                '<img src="img/icon.png" alt="file-icon">'+
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
                '<button class="mdl-button mdl-js-button mdl-button--icon remove_btn ele_header_button">'+
                    '<i class="fas fa-times">'+'</i>'+
                '</button>'+
                '<button class="mdl-button mdl-js-button mdl-button--icon arrow_down ele_header_button">'+
                    '<i class="fas fa-angle-down">'+'</i>'+
                '</button>'+
                '<button class="mdl-button mdl-js-button mdl-button--icon arrow_up ele_header_button">'+
                    '<i class="fas fa-angle-up">'+'</i>'+
                '</button>'+
            '</div>'+

            '<hr class="seem">'+

            '<div class="card-cont">'+
                '<div class="comment-first space-horizontal">'+
                    '<ul class="demo-list-three mdl-list">'+
                        '<li class="mdl-list__item mdl-list__item--two-line">'+
                            '<span class="mdl-list__item-primary-content">'+
                                '<img src="'+ photoUrl +'" alt="userA" class="mdl-list__item-icon">'+
                                '<span>'+ whose +'</span>'+
                                '<span class="mdl-list__item-sub-title">'+ ymd +'</span>'+
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

function setAsMyComment(element, userUid) {
    if (userUid === user.uid) {
        element.find('.comment-first, comment-follow').addClass('author-right');
    }
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

function getColor(num) {
    switch(num){
        case 0:
            return "#C0504D";
        case 1:
            return "#9BBB59";
        case 2:
            return "#1F497D";
        case 3:
            return "#8064A2";
    }
}