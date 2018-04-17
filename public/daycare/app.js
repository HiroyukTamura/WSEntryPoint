"use strict";

var defaultDatabase = void 0;
var masterJson = {};
var myChart = void 0;
var MODE_WEEK = 7;
var MODE_MONTH = 0;
var displayMode = void 0;
var loginedUser = void 0;
var menuMon = $('#dpdn-month');
var menuWeek = $('#dpdn-week');
var currentMoment = moment();
var bgParam = $('#bg-param');
var smParam = $('#sm-param');
var tbody = $(".chart-ave").eq(0).find('tbody');
var chartWrapper = $('#chart_w');
var errNonData = $('.err-non-data');

/*---------loading系------*/
var postLoad = $('#post_load');
var headerBtnEnable = false; //これがfalseのとき、ヘッダボタンを押しても動作させない。
var progress = $('#progress');
var pageContent = $('.page-content');
// var innerProgress =$('.inner-progress');
var query = "1JLRZXEkNuPSzC1iIWrJFmPd9ry2";

window.onload = function init() {

    var defaultApp = firebase.initializeApp(CONFIG);
    defaultDatabase = defaultApp.database();
    progress.hide();
    $('#login_w').hide();
    onLoginSuccess();
    initDrawerDecoration();
};

function setDisplayMode(mode) {
    switch (mode) {
        case MODE_WEEK:
            menuWeek.attr('disabled', '');
            break;
        case MODE_MONTH:
            menuMon.attr('disabled', '');
            break;
    }
    displayMode = mode;
}

function getDaysOfWeek() {
    var now = moment(currentMoment);
    var dayOfWeek = now.day();
    now.add(-dayOfWeek, 'd');
    var days = [];
    for (var i = 0; i < 7; i++) {
        days.push(now.format('YYYYMMDD'));
        now.add(1, 'd');
    }
    return days;
}

function getDaysOfMonth() {
    var now = moment(currentMoment);
    var start = moment(now).startOf('month');
    var end = now.endOf('month').date();
    var days = [];
    for (var i = 0; i < end; i++) {
        days.push(start.format('YYYYMMDD'));
        start.add(1, 'd');
    }
    return days;
}

function onLoginSuccess() {
    console.log('ご本人でーす');
    new ScheduleParser().getScheduleAsync();

    if (!displayMode) {
        menuWeek.on('click', function (e) {
            if (displayMode !== MODE_WEEK && headerBtnEnable) {
                headerBtnEnable = false;
                displayMode = MODE_WEEK;
                $(this).attr('disabled', '');
                menuMon.removeAttr('disabled');
                setDisplayMode(MODE_WEEK);

                pageContent.hide();
                // innerProgress.scss('display', "inline");
                resetUi();
                showData(query);
                new ScheduleParser().getScheduleAsync();
                new SummeryParser().getSummeryDataAsync();
            }
            return false;
        });

        menuMon.on('click', function (e) {
            if (displayMode !== MODE_MONTH && headerBtnEnable) {
                headerBtnEnable = false;
                displayMode = MODE_MONTH;
                $(this).attr('disabled', '');
                menuWeek.removeAttr('disabled');
                setDisplayMode(MODE_MONTH);

                pageContent.hide();
                // innerProgress.scss('display', "inline");
                resetUi();
                showData(query);
                new ScheduleParser().getScheduleAsync();
                new SummeryParser().getSummeryDataAsync();
            }
            return false;
        });

        $('#prev_btn').on({ "click": function click(ev) {
                if (!headerBtnEnable) return false;

                switch (displayMode) {
                    case MODE_WEEK:
                        currentMoment.add(-7, 'd');
                        break;
                    case MODE_MONTH:
                        currentMoment.add(-1, 'M');
                        break;
                }

                pageContent.hide();
                // innerProgress.scss('display', "inline");
                resetUi();
                showData(query);
                new ScheduleParser().getScheduleAsync();
                new SummeryParser().getSummeryDataAsync();

                return false;
            } });

        $('#next_btn').on({ "click": function click(ev) {
                if (!headerBtnEnable) return false;

                switch (displayMode) {
                    case MODE_WEEK:
                        currentMoment.add(7, 'd');
                        break;
                    case MODE_MONTH:
                        currentMoment.add(1, 'M');
                        break;
                }

                pageContent.css('display', 'none');
                // innerProgress.scss('display', "inline");
                resetUi();
                showData(query);
                new ScheduleParser().getScheduleAsync();
                new SummeryParser().getSummeryDataAsync();

                return false;
            } });
    }

    setDisplayMode(MODE_MONTH);

    showData(query);

    new SummeryParser().getSummeryDataAsync();
}

//todo モード別
(function () {

    var tbodyE = $('#third-card tbody');

    // var userDataSnap, scheduleSnap;

    function ScheduleParser() {
        console.log('ScheduleParser()');
        tbodyE.empty();
    }

    ScheduleParser.prototype.getScheduleAsync = function () {
        var scheme = makeRefScheme(['combinedCalendar', query, currentMoment.format('YYYYMM')]);

        defaultDatabase.ref(scheme).once('value').then(function (snapshot) {
            if (!snapshot.exists()) {
                //todo スケジュールがありません
                return;
            }

            var specMoment = moment(snapshot.key, 'YYYYMM');

            var count = 1;
            snapshot.forEach(function (childSnap) {
                var date = childSnap.key;
                specMoment.date(date);
                var htmlE = date + '(' + wodList[specMoment.day()] + ')';
                var tr = $('<tr>');
                var td = $('<td>', {
                    rowspan: childSnap.numChildren(),
                    class: 'left-column'
                }).html(htmlE);
                tr.append(td).appendTo(tbodyE);

                var isFirstItem = true;
                childSnap.forEach(function (schSnap) {
                    // $('<tr><td class="seem" colspan="2"></td></tr>').appendTo(tbody);
                    var title = schSnap.child('title').val();
                    var groupName = schSnap.child('groupName').val();
                    var colorVal = schSnap.child('colorNum').val();
                    var tdItem = createTd(title, groupName);
                    tdItem.find('.mdl-list__item-primary-content').css('border-left-color', colors[parseInt(colorVal)]);
                    if (isFirstItem) {
                        isFirstItem = false;
                        tr.append(tdItem);
                        count++;
                        if (count % 2 === 1) tr.addClass('colored');
                    } else {
                        var trSingle = $('<tr>');
                        if (count % 2 === 1) trSingle.addClass('colored');
                        trSingle.append(tdItem).appendTo(tbodyE);
                    }
                });
            });

            setElementAsMdl(tbodyE);
        });
    };

    function createTd(title, groupName) {
        return $('<td class="right-column mdl-list__item mdl-list__item--two-line mdl-pre-upgrade">' + '<span class="mdl-list__item-primary-content mdl-pre-upgrade ">' + '<span>' + title + '</span>' + '<span class="mdl-list__item-sub-title mdl-pre-upgrade">' + groupName + '</span>' + '</span>' + '</td>');
    }

    window.ScheduleParser = ScheduleParser;
})();

//todo モード別
(function () {

    var scheme = void 0,
        schemePrev = void 0;
    var snap = void 0,
        snapPrev = void 0;
    var recordCount = void 0;
    var ratio = void 0;
    var clonedMoment = void 0;
    var prevMoment = void 0;
    var regExp = new RegExp(DELIMITER, "g");
    var spaceRow = generateTableBorder("table-space");
    var rangeDatas = {};
    var eveDatas = {};
    var cap = $('#date-cap');
    var radioCap = $('#ratio-cap');

    function SummeryParser() {
        console.log('SummeryParser()');
        clonedMoment = currentMoment.clone();
        prevMoment = clonedMoment.clone().add('M', -1);
        cap.empty();
        radioCap.empty();
        this.setSchemes();
    }

    SummeryParser.prototype.getSummeryDataAsync = function () {
        var self = this;
        defaultDatabase.ref(scheme).once('value').then(function (snapshot) {
            if (!snapshot.exists()) {
                //todo データがありません(右上のテーブルにも)
                errNonData.css('display', "block");
                $('#table-others').hide();
                return;
            }

            errNonData.hide();
            $('#table-others').css('display', "block");

            snap = snapshot;
            recordCount = snapshot.child('recordCount').val();
            $('#date-bg-cap').html(recordCount + '日');
            ratio = self.calcRatio(recordCount, clonedMoment);
            $('#ratio-bg-cap').html(ratio + '%');

            self.setAverageTable();

            defaultDatabase.ref(schemePrev).once('value').then(function (snapshot) {
                snapPrev = snapshot;
                self.onGetPrevData();
            });
        });
    };

    SummeryParser.prototype.setSchemes = function () {
        scheme = makeRefScheme(['analytics', query, clonedMoment.format('YYYYMM')]);
        schemePrev = makeRefScheme(['analytics', query, prevMoment.format('YYYYMM')]);
    };

    SummeryParser.prototype.onGetPrevData = function () {
        if (!snapPrev.exists()) {
            console.log('データなし onGetPrevData');
            //todo データがありません?
            return;
        }

        var recordCountPrev = snapPrev.child('recordCount').val();
        var diffCount = snapPrev.child('recordCount').val() - recordCount;
        var symbol = diffCount < 0 ? '' : '+';
        var html = '先月より' + symbol + diffCount + '日';
        $('#date-cap').html(html);

        var ratioPrev = this.calcRatio(recordCount, prevMoment);
        var diffRatio = ratioPrev - ratio;
        var symbol2 = diffRatio < 0 ? '' : '+';
        var ratioHtml = '先月より' + symbol2 + diffRatio + '%';
        $('#ratio-cap').html(ratioHtml);

        this.setPrevCaption();
    };

    SummeryParser.prototype.calcRatio = function (recordCount, moment) {
        return Math.floor(recordCount / moment.daysInMonth() * 100);
    };

    SummeryParser.prototype.setAverageTable = function () {

        var rowCount = 0;
        snap.child('rangeEve').forEach(function (snapshot) {

            var rangeTitle = snapshot.key.replace(regExp, '  <i class="fas fa-angle-double-right color-orange"></i>  ');
            var startMinTotal = snapshot.child('startMin').val();
            var endMinTotal = snapshot.child('endMin').val();
            var count = snapshot.child('count').val();

            var startMin = Math.floor(startMinTotal / count);
            var startTime = min2TimeVal(startMin);
            var endMin = Math.floor(endMinTotal / count);
            var endTime = min2TimeVal(endMin);
            var timeLen = roundWithDigit(Math.abs(startMin - endMin) / 60, 10);
            rangeDatas[snapshot.key] = {};
            rangeDatas[snapshot.key]['startMin'] = startMin;
            rangeDatas[snapshot.key]['endMin'] = endMin;
            rangeDatas[snapshot.key]['hourLen'] = timeLen;
            rangeDatas[snapshot.key]['count'] = count;
            var lenTime = timeLen + "h";

            var dom = '<tr class="ave-digit">' + '<td></td>' + '<td class="range-title" rowspan="2">' + rangeTitle + '</td>' + '<td class="range-title">' + count + '回' + '</td>' + '<td class="ave-digit-td no-wrap">' + startTime + '</td>' + '<td class="ave-digit-td ave-angle no-wrap" rowspan="2">' + '<i class="fas fa-angle-double-right fa-lg color-orange"></i>' + '</td>' + '<td class="ave-digit-td no-wrap">' + endTime + '</td>' + '<td class="ave-digit-td no-wrap">' + lenTime + '</td>' + '<td></td>' + '</tr>';

            var row1 = $(dom);
            // row1.find('.fa-angle-double-right').scss('color', colors[0]);
            var caption = '<tr class="caption">' + '<td></td>' + '<td class="no-wrap cap-count" data-title="' + snapshot.key + '"></td>' + '<td class="no-wrap cap-start" data-title="' + snapshot.key + '"></td>' + '<td class="no-wrap cap-end" data-title="' + snapshot.key + '"></td>' + '<td class="no-wrap cap-length" data-title="' + snapshot.key + '"></td>' + '<td></td>' + '</tr>';
            var row2 = $(caption);
            var space = spaceRow.clone(true);

            if (rowCount % 2 === 1) {
                space.addClass("back-orange");
                row1.addClass("back-orange");
                row2.addClass("back-orange");
            }

            tbody.append(space).append(row1).append(row2).append(space.clone(true));

            rowCount++;
        });

        snap.child('timeEve').forEach(function (snapshot) {
            var rangeTitle = snapshot.key.replace(regExp, '  <i class="fas fa-angle-double-right color-orange"></i>  ');
            var min = snapshot.child('min').val();
            var count = snapshot.child('count').val();
            var hour = Math.floor(min / count);
            var timeVal = min2TimeVal(hour);
            eveDatas[snapshot.key] = {};
            eveDatas[snapshot.key]['min'] = min;
            eveDatas[snapshot.key]['count'] = count;

            // var average = min2HHMM(getAverage(eveList[eveKey]));
            var row = $('<tr class="ave-digit">' + '<td></td>' + '<td class="range-title" rowspan="2">' + rangeTitle + '</td>' + '<td class="range-title">' + count + '回' + '</td>' + '<td class="ave-digit-td no-wrap centering" colspan="4">' + timeVal + '</td>' + '<td></td>' + '</tr>' + '<tr class="caption">' + '<td></td>' + '<td class="no-wrap cap-count" data-title="' + snapshot.key + '"></td>' + '<td class="no-wrap centering cap-time-eve" colspan="4" data-title="' + snapshot.key + '"></td>' + '<td></td>' + '</tr>');

            var space0 = spaceRow.clone(true);
            var space1 = spaceRow.clone(true);
            if (rowCount % 2 === 1) {
                space0.addClass("back-orange");
                space1.addClass("back-orange");
                row.addClass("back-orange");
            }

            tbody.append(space0).append(row).append(space1);

            rowCount++;
        });
    };

    SummeryParser.prototype.setPrevCaption = function () {
        snapPrev.child('rangeEve').forEach(function (snapshot) {
            if (!rangeDatas[snapshot.key])
                //todo 前月データなしの時の表示
                return;

            var startMinTotal = snapshot.child('startMin').val();
            var endMinTotal = snapshot.child('endMin').val();
            var count = snapshot.child('count').val();

            var startMin = Math.floor(startMinTotal / count);
            var endMin = Math.floor(endMinTotal / count);
            var specStartMin = rangeDatas[snapshot.key]['startMin'];
            var specEndMin = rangeDatas[snapshot.key]['endMin'];
            var diffLenTime = roundWithDigit(roundWithDigit(Math.abs(specStartMin - specEndMin) / 60, 10) - roundWithDigit(Math.abs(startMin - endMin) / 60, 10), 10); //ここ、なぜか四捨五入した数値を足し引きすると値がおかしくなる
            var symbol = diffLenTime < 0 ? '' : '+';
            var val = '先月より' + symbol + diffLenTime + 'h';
            $('.cap-length[data-title=' + snapshot.key + ']').html(val);

            var diffHourStart = roundWithDigit((specStartMin - startMin) / 60, 10);
            var symbolStart = diffHourStart < 0 ? '' : '+';
            var valStart = '先月より' + symbolStart + diffHourStart + 'h';
            $('.cap-start[data-title=' + snapshot.key + ']').html(valStart);

            var diffHourEnd = roundWithDigit((specEndMin - endMin) / 60, 10);
            var symbolEnd = diffHourEnd < 0 ? '' : '+';
            var valEnd = '先月より' + symbolEnd + diffHourEnd + 'h';
            $('.cap-end[data-title=' + snapshot.key + ']').html(valEnd);

            var diffCount = rangeDatas[snapshot.key]['count'] - count;
            var symbolCount = diffCount < 0 ? '' : '+';
            var valCount = '先月より' + symbolCount + diffCount + '回';
            $('.cap-count[data-title=' + snapshot.key + ']').html(valCount);
        });

        snapPrev.child('timeEve').forEach(function (snapshot) {
            if (!eveDatas[snapshot.key])
                //todo 前月データなしの時の表示
                return;

            var min = snapshot.child('min').val();
            var count = snapshot.child('count').val();
            var hour = roundWithDigit(Math.floor(min / count), 10);
            var diffHour = roundWithDigit(eveDatas[snapshot.key]['min'], 10) - hour;
            var symbol = diffHour < 0 ? '' : '+';
            var val = '先月より' + symbol + diffHour + 'h';
            $('.cap-time-eve[data-title=' + snapshot.key + ']').html(val);

            var diffCount = eveDatas[snapshot.key]['count'] - count;
            var symbolCount = diffCount < 0 ? '' : '+';
            var valCount = '先月より' + symbolCount + diffCount + '回';
            $('.cap-count[data-title=' + snapshot.key + ']').html(valCount);
        });
    };

    function min2TimeVal(min) {
        // var min = Math.abs(minTotal / count);
        if (min >= 60 * 24) {
            min = min - 60 * 24;
            return moment({
                hour: Math.floor(min / 60),
                minute: min % 60
            }).format('HH:mm') + '(翌日)';
        } else if (min <= 0) {
            min = min + 60 * 24;
            return moment({
                hour: Math.floor(min / 60),
                minute: min % 60
            }).format('HH:mm') + '(前日)';
        } else {
            console.log(min % 60, Math.floor(min / 60));
            return moment({
                hour: Math.floor(min / 60),
                minute: min % 60
            }).format('HH:mm');
        }
    }

    window.SummeryParser = SummeryParser;
})();

function showData(uid) {
    var dates = void 0;
    switch (displayMode) {
        case MODE_WEEK:
            dates = getDaysOfWeek(currentMoment);
            break;
        case MODE_MONTH:
            dates = getDaysOfMonth(currentMoment);
            break;
    }

    var getCount = 0;
    console.log(dates);

    dates.forEach(function (day) {
        var node = "usersParam/" + uid + "/" + day;
        defaultDatabase.ref(node).once('value').then(function (snapshot) {
            if (!snapshot.exists()) {
                masterJson[day] = null;
            } else {
                var masterData = [];
                snapshot.forEach(function (arr) {
                    arr = arr.toJSON();
                    if (arr["dataType"] === 2 || arr["dataType"] === 3) {
                        var newArr = [];
                        Object.values(arr["data"]).forEach(function (value) {
                            newArr.push(value);
                        });
                        arr["data"] = newArr;
                    }
                    masterData.push(arr);
                });
                masterJson[day] = masterData;
            }

            getCount++;

            //最後のデータかどうかをチェック
            if (getCount === dates.length) {
                console.log(masterJson);
                displayTest();
            }
        });
    });
}

function resetUi() {
    bgParam.html("");
    smParam.html("");
    bgParam.parent().next().html("");
    chartWrapper.children().remove();

    $('<canvas>', {
        id: 'chart_div'
    }).appendTo(chartWrapper);
    tbody.html("");
    myChart = null;
    masterJson = {};
}

function displayTest() {
    //dataType === 1のものを集計する。
    var keys = Object.keys(masterJson);
    var timeData = {};
    setTitle(displayMode, keys[0]);
    chart(displayMode, keys[0]);

    keys.forEach(function (key) {
        if (masterJson[key]) {
            masterJson[key].forEach(function (data) {
                if (data["dataType"] === 1) {
                    var json = JSON.parse(data["data"]["0"]);
                    console.log(json);
                    timeData[key] = json;
                    json.rangeList.forEach(function (entry) {
                        var date = moment(key, "YYYYMMDD").date();

                        var start = getTime(entry.start);
                        var end = getTime(entry.end);
                        var timeVal = getTimeVal(entry.start) + " → " + getTimeVal(entry.end);
                        console.log(entry.start);
                        var label = entry.start.name + " → " + entry.end.name;

                        if (entry.start.offset === entry.end.offset) {

                            pushData(getRangeArr(date, start, end, entry.start.offset), date, entry.colorNum, label, timeVal, true, true);
                        } else if (entry.end.offset - entry.start.offset === 1) {

                            date += entry.start.offset;
                            pushData(getRangeStart(date, start), date, entry.colorNum, label, timeVal, true, false);
                            date += 1;
                            pushData(getRangeEnd(date, end), date, entry.colorNum, label, timeVal, false, true);
                        } else if (entry.end.offset - entry.start.offset === 2) {

                            date -= entry.start.offset;
                            pushData(getRangeStart(date, start), date, entry.colorNum, label, timeVal, true, false);

                            date += 1;
                            var arrH = [];
                            for (var i = 0; i <= 24; i++) {
                                arrH.push(date);
                            }

                            pushData(arrH, date, false, false);

                            date += 1;
                            pushData(getRangeEnd(date, start), date, entry.colorNum, label, timeVal, false, true);
                        }
                    });

                    json.eventList.forEach(function (entry) {
                        var date = moment(key, "YYYYMMDD").date();

                        var time = getTime(entry);
                        var timeVal = getTimeVal(entry);
                        pushData(getRangeArr(date, time, time, 0), date, entry.colorNum, entry.name, timeVal);
                    });
                }
            });
        }
    });

    // showAverage(timeData);

    initTabLayout2();
    // var table = $('#table-others');
    // var tableWidth = table.scss({ position: "absolute", visibility: "hidden", display: "block" });
    // table.scss({ position: "", visibility: "", display: "" });
    // $('.mdl-mini-footer').scss('min-width', tableWidth+1);

    // innerProgress.scss('display', "none");
    progress.hide();
    pageContent.css('display', 'block');
    postLoad.css('display', 'block');

    myChart.update();

    headerBtnEnable = true;
}

function setTitle(mode, firstDate) {
    console.log(firstDate);
    var titleMonth = $('#chart_title_w_month');
    var titleWeek = $('#chart_title_w');
    var momentO = moment(firstDate.toString(), "YYYYMMDD");
    switch (mode) {
        case MODE_WEEK:
            var start = momentO.format('MM.DD') + "(" + wodList[0] + ")";
            momentO.add(mode - 1, 'd');
            var end = momentO.format('MM.DD') + "(" + wodList[MODE_WEEK - 1] + ")";
            console.log(end);
            $('#chart_title_start').html(start);
            $('#chart_title_end').html(end);
            titleMonth.css('display', 'none');
            titleWeek.css('display', 'inline');
            break;
        case MODE_MONTH:
            titleMonth.html(momentO.month() + 1 + "月");
            titleMonth.css('display', 'inline');
            titleWeek.css('display', 'none');
            break;
    }
}

function chart(mode, firstKey) {
    var maximum = getMaximumFromMode(mode);
    var startCal = getStartCal(mode, firstKey);

    // var dates = getDateYmds(mode, startCal, maximum);
    var yAxis = getYaxis(mode, startCal, maximum);
    // var fontColors = [];
    // yAxis.forEach(function (value) {
    //    if(value.indexOf('日')){
    //        fontColors.push('#dd3734');
    //    } else {
    //        fontColors.push(null);
    //    }
    // });

    var ctx = $('#chart_div');
    switch (mode) {
        case MODE_MONTH:
            chartWrapper.css('height', 1000); //todo これはこれでいいのか？
            break;
        case MODE_WEEK:
            chartWrapper.removeAttr('style');
            break;
    }

    // var keys = Object.keys(masterJson);
    myChart = new Chart(ctx[0].getContext("2d"), {
        type: 'line',
        data: {
            labels: makeXaxis(),
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: mode !== MODE_MONTH,
            scales: {
                yAxes: [{
                    ticks: {
                        suggestedMin: 0,
                        suggestedMax: maximum,
                        reverse: true,
                        stepSize: 1,
                        // fontColor: fontColors,
                        callback: function callback(value, index, values) {
                            if (index === maximum) return null;

                            return yAxis[value];
                        }
                    }
                }],
                xAxes: [{
                    ticks: {
                        callback: function callback(value, index, values) {
                            if (value) return value;
                        },
                        autoSkip: true,
                        maxRotation: 0,
                        minRotation: 0
                    },
                    display: true
                }]
            },
            legend: {
                display: false
            },
            tooltips: {
                callbacks: {
                    intersect: false,
                    mode: 'point',
                    title: function title(toolTips, data) {
                        console.log(toolTips, data);
                        return yAxis[toolTips[0]["yLabel"]];
                    },
                    label: function label(tooltipItem, data) {
                        var arr = data["datasets"][tooltipItem.datasetIndex];
                        return arr.label + " " + arr.timeVal;
                    }
                }
            }
        }
    });
}

function getStartCal(mode, firstKey) {
    var cal = moment(firstKey, 'YYYYMMDD');
    if (mode === MODE_MONTH) {
        cal = cal.startOf('month');
        console.log("getStartCal", "こっち");
    }
    return cal;
}

function getYaxis(mode, firstCal, maximum) {
    var cal = moment(firstCal);
    var yAxis = [];
    var month = null;
    for (var i = 0; i < maximum; i++) {
        var value = void 0;
        if (mode === MODE_WEEK && (i === 0 || cal.month() !== month)) {
            month = cal.month();
            value = cal.format('MM/DD');
        } else {
            value = cal.format('DD');
        }
        yAxis.push(value + "(" + wodList[cal.day()] + ")");
        cal.add(1, 'd');
    }

    return yAxis;
}

function getMaximumFromMode(mode) {
    switch (mode) {
        case MODE_WEEK:
            return 7;
        case MODE_MONTH:
            return currentMoment.endOf('month').date();
    }
}

/*---------------描画まわり-------------*/
function makeXaxis() {
    var arr = [];
    var limit = 24 * 4;
    for (var i = 0; i <= limit; i++) {
        if (i === 0) {
            arr.push(i);
        } else if (i % 8 === 0) {
            arr.push(i / 4);
        } else {
            arr.push(null);
        }
    }
    return arr;
}

function getTime(entryC) {
    var hour = entryC.cal.hourOfDay;
    var min = entryC.cal.minute;
    return hour + min / 60;
}

function getTimeVal(entryC) {
    var hour = entryC.cal.hourOfDay;
    var min = entryC.cal.minute;
    var time = moment();
    time.hour(hour);
    time.minute(min);
    return time.format('HH:mm');
}

function pushData(arr, date, colorNum, label, timeVal, showStartRadius, showEndRadius) {
    var color = colors[colorNum];
    var radiuses = setRadius(arr, date - 1, showStartRadius, showEndRadius); //ここで-1をするのは、日付は1始まりだから
    myChart.data.datasets.push({
        data: arr,
        label: label,
        pointRadius: radiuses,
        pointHoverRadius: radiuses,
        backgroundColor: color,
        pointHoverBackgroundColor: color,
        borderColor: color,
        fill: false,
        timeVal: timeVal
    });
}

function setRadius(dataArr, date, showStartRadius, showEndRadius) {
    var start = dataArr.indexOf(date);
    var end = dataArr.lastIndexOf(date);
    console.log(start + ", " + end);
    var radiusArr = [];
    for (var i = 0; i < dataArr.length; i++) {
        if (showStartRadius && i === start || showEndRadius && i === end) {
            radiusArr.push(5);
        } else {
            radiusArr.push(0);
        }
    }
    return radiusArr;
}

function getRangeArr(date, start, end, offset) {
    var arrC = [];
    date = date + offset - 1; //ここで-1をするのは、日付は1始まりだから
    var limit = 24 * 4;
    for (var n = 0; n <= limit; n++) {
        if (start * 4 <= n && n < end * 4 + 1) {
            arrC.push(date);
        } else {
            arrC.push(null);
        }
    }
    return arrC;
}

function getRangeStart(date, start) {
    var dateC = date - 1; //ここで-1をするのは、日付は1始まりだから
    var arrD = [];
    for (var n = 0; n <= 24 * 4; n++) {
        if (start * 4 < n) {
            arrD.push(dateC);
        } else {
            arrD.push(null);
        }
    }
    return arrD;
}

function getRangeEnd(date, end) {
    var dateC = date - 1; //ここで-1をするのは、日付は1始まりだから
    var arrE = [];
    for (var n = 0; n <= 24 * 4; n++) {
        if (n <= end * 4) {
            arrE.push(dateC);
        } else {
            arrE.push(null);
        }
    }
    console.log(arrE);
    return arrE;
}
/*---------------描画まわりここまで-------------*/

/*---------------分析画面系ここから-------------*/
// function showAverage(timeData) {
//    var ranges = generateAveArr(timeData);
//    var count = 0;
//    for(var key in ranges){
//        if(ranges.hasOwnProperty(key)){
//            var aveStart = getAverage(ranges[key]["start"]);
//            var aveEnd = getAverage(ranges[key]["end"]);
//            var aveLen = roundWithDigit(Math.abs(aveStart - aveEnd)/60, 10) + "h";
//            //DOMを挿入
//            var dom =
//                '<tr class="ave-digit">' +
//                    '<td class="range-title" rowspan="2">'+ key +'</td>' +
//                    '<td class="ave-digit-td no-wrap">'+ min2HHMM(aveStart)+'</td>' +
//                    '<td class="ave-digit-td ave-angle no-wrap" rowspan="2">' +
//                         '<i class="fas fa-angle-double-right fa-lg color-orange"></i>' +
//                    '</td>' +
//                    '<td class="ave-digit-td no-wrap">'+ min2HHMM(aveEnd) +'</td>' +
//                    '<td class="ave-digit-td no-wrap">'+ aveLen +'</td>' +
//                '</tr>';
//            var row1 = $(dom);
//            row1.find('.fa-angle-double-right').scss('color', colors[ranges[key]['colorNum']]);
//            var caption =
//                '<tr class="caption">' +
//                    '<td class="no-wrap">先週より+2h15min</td>' +
//                    '<td class="no-wrap">先週より-45min</td>' +
//                    '<td class="no-wrap">先週より+2h15min</td>' +
//                '</tr>';
//            var row2 = $(caption);
//            var space = generateTableBorder("table-space");
//            if(count %2 === 1){
//                space.addClass("back-orange");
//                row1.addClass("back-orange");
//                row2.addClass("back-orange");
//                // row1.find('i').addClass("color-orange");
//            // } else {
//            //     row1.find('i').addClass("color-disable");
//            }
//            // var seem = generateTableBorder("table-seem");
//            tbody.append(space)
//                .append(row1)
//                .append(row2)
//                .append(space.clone(true));
//
//            count++;
//        }
//    }
//
//    var eveList = generateAveArrEve(timeData);
//    for(var eveKey in eveList){
//        if(eveList.hasOwnProperty(eveKey)){
//            var average = min2HHMM(getAverage(eveList[eveKey]));
//            var row = $(
//                '<tr class="ave-digit">'+
//                    '<td class="range-title" rowspan="2">'+ eveKey +'</td>'+
//                    '<td class="ave-digit-td no-wrap centering" colspan="4">'+ average +'</td>'+
//                '</tr>'+
//                '<tr class="caption">'+
//                     '<td class="no-wrap centering" colspan="4">先週より+2h15min</td>'+
//                '</tr>');
//
//            var space0 = space.clone(true);
//            var space1 = space.clone(true);
//            if(count %2 === 1){
//                space0.addClass("back-orange");
//                space1.addClass("back-orange");
//                row.addClass("back-orange");
//            }
//
//            tbody.append(space0)
//                .append(row)
//                .append(space1);
//
//            count++;
//        }
//    }
//
//    //データが皆無であればその旨を表示
//     var tableOhters = $('#table-others');
//     if(count === 0){
//         errNonData.scss('display', "block");
//         tableOhters.scss('display', "none");
//     } else {
//         errNonData.scss('display', "none");
//         tableOhters.scss('display', "block");
//     }
//
// }

// function generateAveArr(timeData) {
//     var ranges = {};
//     for(var key in timeData){
//         if(timeData.hasOwnProperty(key)){
//             timeData[key]["rangeList"].forEach(function (range) {
//                 var name = range.start.name + '  <i class="fas fa-angle-double-right color-orange"></i>  ' + range.end.name;
//                 if(!ranges.hasOwnProperty(name)){
//                     ranges[name] = {};
//                     ranges[name].start = [];
//                     ranges[name].end = [];
//                 }
//                 var startTime = range.start.cal.hourOfDay *60 + range.start.cal.minute + range.end.offset *24*60;
//                 var endTime = range.end.cal.hourOfDay *60 + range.end.cal.minute + range.end.offset *24*60;
//                 ranges[name].start.push(startTime);
//                 ranges[name].end.push(endTime);
//             });
//         }
//     }
//     return ranges;
// }
//
// function generateAveArrEve(timeData) {
//     var eves = {};
//     for(var key in timeData){
//         if(timeData.hasOwnProperty(key)){
//             timeData[key]["eventList"].forEach(function (event) {
//                 if(!eves.hasOwnProperty(event.name)){
//                     eves[event.name] = [];
//                 }
//                 eves[event.name].push(event.cal.hourOfDay *60 + event.cal.minute);
//             });
//         }
//     }
//     return eves;
// }
//
// function getAverage(arr) {
//     var sum = 0;
//     arr.forEach(function (time) {
//         sum += time;
//     });
//     if(sum){
//         var aveStart = sum / (arr.length);
//         sum = Math.round(aveStart);
//     }
//     return sum;
// }

function roundWithDigit(num, digit) {
    return Math.round(num * digit) / digit;
}

// function min2HHMM(min) {
//     var m = moment();
//     m.minute(min);
//     return m.format('HH:mm');
// }

function generateTableBorder(className) {
    var td = $('<td>', {
        class: className,
        colspan: 8
    });
    return $('<tr>').append(td);
}

/*-----------------------tabLayout2--------------------------*/
function initTabLayout2() {
    var bgColumns = [];
    var smColumns = {};
    $('<td>', { rowspan: 2 }).html('日にち').appendTo(bgParam);
    for (var key in masterJson) {
        if (masterJson.hasOwnProperty(key) && masterJson[key]) {
            masterJson[key].forEach(function (data) {
                switch (data.dataType) {
                    case 2:
                        // addBgColumn(bgColumns, bgParam, data);
                        // addSmColumn(smColumns, smParam, data, 0);
                        addNormalColumn(bgColumns, bgParam, data);
                        break;
                    case 3:
                        addBgColumn(bgColumns, bgParam, data);
                        addSmColumn(smColumns, smParam, data, 1);
                        break;
                    case 4:
                        addNormalColumn(bgColumns, bgParam, data);
                        break;
                }
            });
        }
    }

    fixBgColumnSpan(bgParam, smColumns);

    addRowsToTable(smParam, bgParam, bgColumns, smColumns);
}

/*----------------thead系--------------*/
function addNormalColumn(bgColumns, bgParam, data) {
    if (bgColumns.indexOf(data.dataName) === -1) {
        $('<td>', {
            rowspan: 2
        }).html(data.dataName).appendTo(bgParam);
        bgColumns.push(data.dataName);
    }
}

function addBgColumn(bgColumns, bgParam, data) {
    if (bgColumns.indexOf(data.dataName) === -1) {
        $('<td>').html(data.dataName).appendTo(bgParam);
        bgColumns.push(data.dataName);
    }
}

function addSmColumn(smColumns, smParam, data, valuePos) {
    data.data.forEach(function (value) {
        var html = value.split(DELIMITER)[valuePos];
        if (!smColumns[data.dataName]) {
            smColumns[data.dataName] = [];
        }
        if (smColumns[data.dataName].indexOf(html) === -1) {
            $('<td>').html(html).appendTo(smParam);
            if (smColumns) smColumns[data.dataName].push(html);
        }
    });
}

function fixBgColumnSpan(bgParam, smColumns) {
    for (var key in smColumns) {
        if (smColumns.hasOwnProperty(key)) {
            bgParam.find("td:contains(" + key + ")").attr('colspan', smColumns[key].length);
        }
    }
}

/*----------------------tbody系-----------------------*/
function addRowsToTable(smParam, bgParam, bgColumns, smColumns) {

    var smVals = Object.values(smColumns);
    var tbody = $('#table-others').find('tbody');
    var totalLen = 0;
    var smColumnVals = Object.values(smColumns);
    var smColumnKeys = Object.keys(smColumns);
    smColumnVals.forEach(function (arr) {
        totalLen += arr.length;
    });
    var len = bgColumns.length + totalLen - smColumnVals.length + 1; //+1は日付の分

    var masterKeys = Object.keys(masterJson);

    var _loop = function _loop(k) {

        var tr = $('<tr>');
        if (k % 2) {
            tr.css('background-color', "#f9f9f7");
        }

        for (var i = 0; i < len; i++) {
            td = $('<td>');

            tr.append(td);
            if (i === 0) {
                td.addClass('row-head');
            }
        }
        var cal = moment(masterKeys[k], "YYYYMMDD");
        var date = cal.date();
        var title = date + "日(" + wodList[cal.day()] + ")";
        var rowHead = tr.find('td').eq(0);
        rowHead.html(title);
        //日曜日であれば赤色に
        if (cal.day() === 0) {
            rowHead.addClass('holiday');
        }

        //休日であれば赤色にしてtippy表示
        var holidayKey = cal.format("YYYY-MM-DD");
        var holidayPos = Object.keys(HOLIDAYS).indexOf(holidayKey);
        if (holidayPos !== -1) {
            rowHead.attr('title', HOLIDAYS[holidayKey]);
            rowHead.addClass('holiday');
        }

        if (masterJson[masterKeys[k]]) {
            masterJson[masterKeys[k]].forEach(function (data) {
                if (!data.data || data.dataType === 0 || data.dataType === 1) return;

                var count = bgColumns.indexOf(data.dataName);
                var keyLen = smColumnKeys.indexOf(data.dataName);
                count -= keyLen;
                for (var n = 0; n < keyLen; n++) {
                    count += smColumnVals[n].length;
                }
                // count++;//日付カラムの分
                // console.log(data.dataName + "は" + count + "の並びにあります");

                switch (data.dataType) {
                    case 2:
                        var td0 = tr.find('td').eq(count);
                        var titleVal = data.dataName + " " + title;
                        setTagInCell(td0, data, titleVal);
                        break;
                    case 3:
                        for (var m = 0; m < data.data.length; m++) {
                            var pos = count + m + 1;
                            var vals = data.data[m].split(DELIMITER);
                            var tdE = tr.find('td').eq(pos);
                            var titleValE = data.dataName + " : " + vals[1] + " " + title;
                            if (vals[0] === "0") {
                                var span = $('<span>', {
                                    title: titleValE
                                });
                                if (vals[2] === "true") {
                                    span.html('<i class="fas fa-check color-orange"></i>').appendTo(tdE);
                                } else if (vals[2] === "false") {
                                    span.html('<i class="fas fa-times color-disable"></i>').appendTo(tdE);
                                }
                            } else if (vals[0] === "1") {
                                $('<span>', {
                                    title: titleValE
                                }).html(vals[2]).appendTo(tdE);
                            }
                        }
                        break;
                    case 4:
                        // todo 本来は"comment"ノードに格納されているので、実装後この点を修正すること
                        var _td = tr.find('td').eq(count);
                        if (data.data.length > 100) {
                            // todo ここら辺の改行とかの動作、もうちょっとうまくやれるはず
                            var value = null;
                            if (data.data.indexOf("\n") === data.data.lastIndexOf("\n")) {
                                //改行が2箇所以上ある場合
                                value = data.data.substring(0, 80) + "...";
                            } else {
                                var first = data.data.indexOf("\n");
                                var second = data.data.substring(first).indexOf("\n");
                                value = data.data.substring(0, second);
                            }
                            value = value.replace(/(?:\r\n|\r|\n)/g, '<br />');
                            _td.attr("full-txt", data.data);
                            _td.html(value);
                            var dropDownBtn = $('<i>', {
                                class: "fas fa-caret-down fa-lg color-orange",
                                onclick: "expandText(this)",
                                title: data.dataName + " " + title
                            });
                            _td.append($('<br />')).append(dropDownBtn);
                        } else {
                            _td.html(data.data);
                        }
                        break;
                }
            });
        }

        tbody.append(tr);
    };

    for (var k = 0; k < masterKeys.length; k++) {
        var td;

        _loop(k);
    }

    setElementAsMdl(tbody);

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

function setTagInCell(td, data, title) {
    for (var m = 0; m < data.data.length; m++) {
        var vals = data.data[m].split(DELIMITER);
        if (vals[2] === "true") continue;

        var color = highlightColors[parseInt(vals[1])];
        var chipsHtml = $('<span class="mdl-chip mdl-pre-upgrade" style="background-color: ' + color + '" title="' + title + '">' + '<span class="mdl-chip__text">' + vals[0] + '</span>' + '</span>');
        td.append(chipsHtml);
    }
}

//todo アニメーションつけられると尚良し
function expandText(ele) {
    console.log("expandText called");
    var td = $(ele).closest('td');
    var txt = td.attr("full-txt");
    txt = txt.replace(/(?:\r\n|\r|\n)/g, '<br />');
    td.html(txt);
}

function setElementAsMdl(clone) {
    var ele = clone.find(".mdl-pre-upgrade");
    for (var i = 0; i < ele.length; i++) {
        componentHandler.upgradeElement(ele.eq(i)[0]);
    }
}
//# sourceMappingURL=app.js.map