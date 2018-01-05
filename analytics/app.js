"use strict";

var defaultApp;
var masterJson = {};
var myChart;
const MODE_WEEK = 7;
const MODE_MONTH = 0;
var displayMode;
const wodList = ["日", "月", "火", "水", "木", "金", "土"];
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
var headerBtnEnable = false;//これがfalseのとき、ヘッダボタンを押しても動作させない。
var progress = $('#progress');
var pageContent = $('.page-content');
// var innerProgress =$('.inner-progress');

const delimiter = '9mVSv';

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

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log("ユーザログインしてます");
            // progress.css("display", "none");
            onLoginSuccess(user.uid);
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
                            'signInSuccess': function(user, credential, redirectUrl) {
                                console.log(user.uid);
                                //urlとは別のuidのユーザとしてログインすることもある。
                                // if(user.uid !== getUid()){
                                //     var currentUrl = $(location).attr('href');
                                //     window.location.href = currentUrl.substring(0, currentUrl.indexOf("?"));
                                // } else {
                                //     onLoginSuccess(user.uid);
                                // }
                                progress.css('display', "none");
                                $('#login_w').css('display', "none");
                                onLoginSuccess(user.uid);
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

function setDisplayMode(mode) {
    switch (mode){
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
    now.add( -dayOfWeek, 'd');
    var days = [];
    for(var i=0; i<7; i++){
        days.push(now.format('YYYYMMDD'));
        now.add(1, 'd');
    }
    return days;
}

function getDaysOfMonth() {
    var now = moment(currentMoment).add(-1, 'M');//todo これテスト用なので直すこと
    var start = moment(now).startOf('month');
    var end = now.endOf('month').date();
    var days = [];
    for(var i=0; i<end; i++){
        days.push(start.format('YYYYMMDD'));
        start.add(1, 'd');
    }
    return days;
}

function onLoginSuccess(uid) {
    if(!displayMode){
        menuWeek.on({"click": function (ev) {
                if(displayMode !== MODE_WEEK && headerBtnEnable){
                    headerBtnEnable = false;
                    displayMode = MODE_WEEK;
                    $(this).attr('disabled', '');
                    menuMon.removeAttr('disabled');
                    setDisplayMode(MODE_WEEK);

                    pageContent.css('display', 'none');
                    // innerProgress.css('display', "inline");
                    restUi();
                    showData(uid);
                }
                return false;
            }});

        menuMon.on({"click": function (ev) {
                if(displayMode !== MODE_MONTH && headerBtnEnable){
                    headerBtnEnable = false;
                    displayMode = MODE_MONTH;
                    $(this).attr('disabled', '');
                    menuWeek.removeAttr('disabled');
                    setDisplayMode(MODE_MONTH);

                    pageContent.css('display', 'none');
                    // innerProgress.css('display', "inline");
                    restUi();
                    showData(uid);
                }
                return false;
            }});

        $('#prev_btn').on({"click": function (ev) {
            if(!headerBtnEnable)
                return false;

            switch (displayMode){
                case MODE_WEEK:
                    currentMoment.add(-7, 'd');
                    break;
                case MODE_MONTH:
                    currentMoment.add(-1, 'M');
                    break;
            }

            pageContent.css('display', 'none');
            // innerProgress.css('display', "inline");
            restUi();
            showData(uid);

            return false;
        }});

        $('#next_btn').on({"click": function (ev) {
            if(!headerBtnEnable)
                return false;

            switch (displayMode){
                case MODE_WEEK:
                    currentMoment.add(7, 'd');
                    break;
                case MODE_MONTH:
                    currentMoment.add(1, 'M');
                    break;
            }

            pageContent.css('display', 'none');
            // innerProgress.css('display', "inline");
            restUi();
            showData(uid);

            return false;
        }});
    }

    setDisplayMode(MODE_MONTH);

    showData(uid);
}

function showData(uid) {
    var dates;
    switch (displayMode){
        case MODE_WEEK:
            dates = getDaysOfWeek(moment());
            break;
        case MODE_MONTH:
            dates = getDaysOfMonth(moment());
            break;
    }

    var getCount = 0;
    console.log(dates);
    var defaultDatabase = defaultApp.database();

    dates.forEach(function (day) {
        var node = "usersParam/" + uid + "/" + day;
        defaultDatabase.ref(node).once('value').then(function(snapshot) {
            if(!snapshot.exists()){
                masterJson[day] = null;
            } else {
                var masterData = [];
                snapshot.forEach(function (arr) {
                    arr = arr.toJSON();
                    if(arr["dataType"] === 2 || arr["dataType"] === 3){
                        var newArr = [];
                        Object.values(arr["data"]).forEach(function (value) {
                            newArr.push(value);
                        });
                        arr["data"] = newArr;
                    }
                    masterData.push(arr);
                });
                masterJson[day] =  masterData;
            }

            getCount++;

            //最後のデータかどうかをチェック
            if(getCount === dates.length){
                console.log(masterJson);
                displayTest();
            }
        });
    });
}

function restUi() {
    bgParam.html("");
    smParam.html("");
    bgParam.parent().next().html("");
    var children = chartWrapper.children("*");
    for(var i=0; i<children.length; i++){
        children.eq(i).remove();
    }
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

    var date = 0;
    keys.forEach(function (key) {
        if(masterJson[key]){
            masterJson[key].forEach(function (data) {
                if(data["dataType"] === 1){
                    var json = JSON.parse(data["data"]["0"]);
                    console.log(json);
                    timeData[key] = json;
                    // var date = moment(key, "YYYYMMDD").date();
                    json.rangeList.forEach(function (entry) {

                        var start = getTime(entry.start);
                        var end = getTime(entry.end);
                        var timeVal = getTimeVal(entry.start) + " → " + getTimeVal(entry.end);
                        console.log(entry.start);
                        var label = entry.start.name + " → " + entry.end.name;

                        if (entry.start.offset === entry.end.offset){

                            pushData(getRangeArr(date, start, end, entry.start.offset), date, entry.colorNum, label, timeVal);

                        } else if (entry.start.offset - entry.end.offset === 1){

                            date -= entry.start.offset;
                            pushData(getRangeStart(date, start), date, entry.colorNum, label, timeVal);
                            date += 1;
                            pushData(getRangeEnd(date, end), date, entry.colorNum, label, timeVal);

                        } else if (entry.start.offset - entry.end.offset === 2){

                            date -= entry.start.offset;
                            pushData(getRangeStart(date, start), date, entry.colorNum, label, timeVal);

                            date += 1;
                            var arrH = [];
                            for(var i=0; i<=24; i++){
                                arrH.push(date);
                            }

                            pushData(arrH, date);

                            date += 1;
                            pushData(getRangeEnd(date, start), date, entry.colorNum, label, timeVal);
                        }
                    });

                    json.eventList.forEach(function (entry) {
                        var time = getTime(entry);
                        var timeVal = getTimeVal(entry);
                        pushData(getRangeArr(date, time, time, 0), date, entry.colorNum, entry.name, timeVal);
                    });
                }
            });
        }

        date++;
    });

    showAverage(timeData);

    initTabLayout2();

    // innerProgress.css('display', "none");
    progress.css('display', "none");
    pageContent.css('display', 'inline');
    postLoad.css('display', 'inline');

    myChart.update();

    headerBtnEnable = true;
}

function setTitle(mode, firstDate) {
    console.log(firstDate);
    var titleMonth = $('#chart_title_w_month');
    var titleWeek = $('#chart_title_w');
    var momentO = moment(firstDate.toString(), "YYYYMMDD");
    switch (mode){
        case MODE_WEEK:
            var start = momentO.format('MM.DD') + "("+ wodList[0] +")";
            momentO.add(mode-1, 'd');
            var end = momentO.format('MM.DD') + "("+ wodList[MODE_WEEK-1] +")";
            console.log(end);
            $('#chart_title_start').html(start);
            $('#chart_title_end').html(end);
            titleMonth.css('display', 'none');
            titleWeek.css('display', 'inline');
            break;
        case MODE_MONTH:
            titleMonth.html((momentO.month()+1) + "月");
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
    var ctx = $('#chart_div');
    switch (mode){
        case MODE_MONTH:
            chartWrapper.css('height', 1000);//todo これはこれでいいのか？
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
                        callback: function (value, index, values) {
                            if (index === maximum)
                                return null;

                            return yAxis[value];
                        }
                    }
                }],
                xAxes: [{
                    ticks: {
                        callback: function(value, index, values) {
                            if(value)
                                return value;
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
                    title: function (toolTips, data) {
                        console.log(toolTips, data);
                        return yAxis[toolTips[0]["yLabel"]];
                    },
                    label: function (tooltipItem, data) {
                        var arr = data["datasets"][tooltipItem.datasetIndex];
                        return arr.label +" "+ arr.timeVal;
                    }
                }
            }
        }
    });
}

function getStartCal(mode, firstKey) {
    var cal = moment(firstKey, 'YYYYMMDD');
    if(mode === MODE_MONTH){
        cal = cal.startOf('month');
        console.log("getStartCal", "こっち");
    }
    return cal;
}

function getYaxis(mode, firstCal, maximum) {
    var cal = moment(firstCal);
    var yAxis = [];
    var month = null;
    for(var i=0; i<maximum; i++){
        var value;
        if(mode === MODE_WEEK && (i === 0 || cal.month() !== month)){
            month = cal.month();
            value = cal.format('MM/DD');
        } else {
            value = cal.format('DD');
        }
        yAxis.push(value +"("+ wodList[cal.day()] +")");
        cal.add(1, 'd');
    }

    return yAxis;
}

function getMaximumFromMode(mode) {
    switch (mode){
        case MODE_WEEK:
            return 7;
        case MODE_MONTH:
            return moment().endOf('month').date();
    }
}

/*---------------描画まわり-------------*/
function makeXaxis() {
    var arr = [];
    var limit = 24*4;
    for (var i=0; i<=limit; i++){
        if(i === 0) {
            arr.push(i);
        } else if(i%8 === 0) {
            arr.push(i/4);
        } else {
            arr.push(null);
        }
    }
    return arr;
}

function getTime(entryC) {
    var hour = entryC.cal.hourOfDay;
    var min = entryC.cal.minute;
    return hour + min/60
}

function getTimeVal(entryC) {
    var hour = entryC.cal.hourOfDay;
    var min = entryC.cal.minute;
    var time = moment();
    time.hour(hour);
    time.minute(min);
    return time.format('HH:mm');
}

function pushData(arr, date, colorNum, label, timeVal) {
    var color = getColor(colorNum);
    var radiuses = setRadius(arr, date);
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

function setRadius(dataArr, date) {
    var start = dataArr.indexOf(date);
    var end = dataArr.lastIndexOf(date);
    console.log(start +", "+ end);
    var radiusArr = [];
    for (var i=0; i<dataArr.length; i++){
        if (i === start || i===end){
            radiusArr.push(5);
        } else {
            radiusArr.push(0);
        }
    }
    return radiusArr;
}

function getRangeArr(date, start, end, offset) {
    var arrC = [];
    date = date + offset;
    var limit = 24*4;
    for(var n=0; n<=limit; n++){
        if (start*4<=n && n<=end*4){
            arrC.push(date);
        } else {
            arrC.push(null);
        }
    }
    return arrC;
}

function getRangeStart(date, start) {
    var arrD = [];
    for (var n=0; n<=24*4; n++){
        if (start*4 < n){
            arrD.push(date);
        } else {
            arrD.push(null);
        }
    }
    return arrD;
}

function getRangeEnd(date, end) {
    var arrE = [];
    for (var n=0; n<=24*4; n++){
        if (n*4 < end){
            arrE.push(date);
        } else {
            arrE.push(null);
        }
    }
    console.log(arrE);
    return arrE;
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

function getHighLightedColor(num) {
    switch (num){
        case 0:
            return "#D79599";
        case 1:
            return "#C5D79D";
        case 2:
            return "#5C8BBF";
        case 3:
            return "#AEA3C5";
    }
}
/*---------------描画まわりここまで-------------*/

/*---------------分析画面系ここから-------------*/
// todo これ計算あってるかどうか、必ずサンプルをいくつか用意して確かめてください
//todo ここで、イベント及びrangeの判別はnameのみで、色は判別に使われていません。つまり、「nameは同じだが色は違う」というのは同じとして扱う必要があります！！
function showAverage(timeData) {
   var ranges = generateAveArr(timeData);
   var count = 0;
   for(var key in ranges){
       if(ranges.hasOwnProperty(key)){
           var aveStart = getAverage(ranges[key]["start"]);
           var aveEnd = getAverage(ranges[key]["end"]);
           var aveLen = roundWithDigit(Math.abs(aveStart - aveEnd)/60, 10) + "h";
           //DOMを挿入
           var dom =
               '<tr class="ave-digit">' +
                   '<td class="range-title" rowspan="2">'+ key +'</td>' +
                   '<td class="ave-digit-td no-wrap">'+ min2HHMM(aveStart)+'</td>' +
                   '<td class="ave-digit-td ave-angle no-wrap" rowspan="2">' +
                        '<i class="fas fa-angle-double-right fa-lg color-orange"></i>' +
                   '</td>' +
                   '<td class="ave-digit-td no-wrap">'+ min2HHMM(aveEnd) +'</td>' +
                   '<td class="ave-digit-td no-wrap">'+ aveLen +'</td>' +
               '</tr>';
           var row1 = $(dom);
           row1.find('.fa-angle-double-right').css('color', getColor(ranges[key]['colorNum']));
           var caption =
               '<tr class="caption">' +
                   '<td class="no-wrap">先週より+2h15min</td>' +
                   '<td class="no-wrap">先週より-45min</td>' +
                   '<td class="no-wrap">先週より+2h15min</td>' +
               '</tr>';
           var row2 = $(caption);
           var space = generateTableBorder("table-space");
           if(count %2 === 1){
               space.addClass("back-orange");
               row1.addClass("back-orange");
               row2.addClass("back-orange");
               // row1.find('i').addClass("color-orange");
           // } else {
           //     row1.find('i').addClass("color-disable");
           }
           // var seem = generateTableBorder("table-seem");
           tbody.append(space)
               .append(row1)
               .append(row2)
               .append(space.clone(true));

           count++;
       }
   }

   var eveList = generateAveArrEve(timeData);
   for(var eveKey in eveList){
       if(eveList.hasOwnProperty(eveKey)){
           var average = min2HHMM(getAverage(eveList[eveKey]));
           var row = $(
               '<tr class="ave-digit">'+
                   '<td class="range-title" rowspan="2">'+ eveKey +'</td>'+
                   '<td class="ave-digit-td no-wrap centering" colspan="4">'+ average +'</td>'+
               '</tr>'+
               '<tr class="caption">'+
                    '<td class="no-wrap centering" colspan="4">先週より+2h15min</td>'+
               '</tr>');

           var space0 = space.clone(true);
           var space1 = space.clone(true);
           if(count %2 === 1){
               space0.addClass("back-orange");
               space1.addClass("back-orange");
               row.addClass("back-orange");
           }

           tbody.append(space0)
               .append(row)
               .append(space1);

           count++;
       }
   }

   //データが皆無であればその旨を表示
    var tableOhters = $('#table-others');
    if(count === 0){
        errNonData.css('display', "inline");
        tableOhters.css('display', "none");
    } else {
        errNonData.css('display', "none");
        tableOhters.css('display', "inline");
    }

}

function generateAveArr(timeData) {
    var ranges = {};
    for(var key in timeData){
        if(timeData.hasOwnProperty(key)){
            timeData[key]["rangeList"].forEach(function (range) {
                var name = range.start.name + '  <i class="fas fa-angle-double-right color-orange"></i>  ' + range.end.name;
                if(!ranges.hasOwnProperty(name)){
                    ranges[name] = {};
                    ranges[name].start = [];
                    ranges[name].end = [];
                }
                var startTime = range.start.cal.hourOfDay *60 + range.start.cal.minute + range.end.offset *24*60;
                var endTime = range.end.cal.hourOfDay *60 + range.end.cal.minute + range.end.offset *24*60;
                ranges[name].start.push(startTime);
                ranges[name].end.push(endTime);
            });
        }
    }
    return ranges;
}

function generateAveArrEve(timeData) {
    var eves = {};
    for(var key in timeData){
        if(timeData.hasOwnProperty(key)){
            timeData[key]["eventList"].forEach(function (event) {
                if(!eves.hasOwnProperty(event.name)){
                    eves[event.name] = [];
                }
                eves[event.name].push(event.cal.hourOfDay *60 + event.cal.minute);
            });
        }
    }
    return eves;
}

function getAverage(arr) {
    var sum = 0;
    arr.forEach(function (time) {
        sum += time;
    });
    if(sum){
        var aveStart = sum / (arr.length);
        sum = Math.round(aveStart);
    }
    return sum;
}

function roundWithDigit(num, digit) {
    return Math.round(num*digit)/digit;
}

function min2HHMM(min) {
    var m = moment();
    m.minute(min);
    return m.format('HH:mm');
}

function generateTableBorder(className) {
    var td = ($('<td>', {
        class: className,
        colspan: 5
    }));
    return $('<tr>').append(td);
}

/*-----------------------tabLayout2--------------------------*/
function initTabLayout2() {
    var bgColumns = [];
    var smColumns = {};
    $('<td>', {rowspan: 2})
        .appendTo(bgParam);
    for(var key in masterJson){
        if(masterJson.hasOwnProperty(key) && masterJson[key]){
            masterJson[key].forEach(function (data) {
                switch (data.dataType){
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
    if(bgColumns.indexOf(data.dataName) === -1){
        $('<td>', {
            rowspan: 2
        }).html(data.dataName)
            .appendTo(bgParam);
        bgColumns.push(data.dataName);
    }
}

function addBgColumn(bgColumns, bgParam, data) {
    if(bgColumns.indexOf(data.dataName) === -1){
        $('<td>').html(data.dataName)
            .appendTo(bgParam);
        bgColumns.push(data.dataName);
    }
}

function addSmColumn(smColumns, smParam, data, valuePos) {
    data.data.forEach(function (value) {
        var html = value.split(delimiter)[valuePos];
        if(!smColumns[data.dataName]){
            smColumns[data.dataName] = [];
        }
        if(smColumns[data.dataName].indexOf(html) === -1){
            $('<td>').html(html)
                .appendTo(smParam);
            if(smColumns)
                smColumns[data.dataName].push(html);
        }
    });
}

function fixBgColumnSpan(bgParam, smColumns) {
    for(var key in smColumns){
        if(smColumns.hasOwnProperty(key)){
            bgParam.find("td:contains("+ key +")").attr('colspan', smColumns[key].length);
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
    var len = bgColumns.length + totalLen - smColumnVals.length +1;//+1は日付の分

    var masterKeys = Object.keys(masterJson);
    for(var k=0; k<masterKeys.length; k++){
            var tr = $('<tr>');
            for (var i = 0; i<len; i++) {
                var td = $('<td>');
                tr.append(td);
                if(i === 0){
                    td.addClass('row-head');
                }
            }
            var cal = moment(masterKeys[k], "YYYYMMDD");
            var date = cal.date();
            var title = date +"日("+ wodList[cal.day()] +")";
            var rowHead = tr.find('td').eq(0);
            rowHead.html(title);

            if(masterJson[masterKeys[k]]){
                masterJson[masterKeys[k]].forEach(function (data) {
                    if(!data.data || data.dataType === 0 || data.dataType === 1)
                        return;

                    var count = bgColumns.indexOf(data.dataName);
                    var keyLen = smColumnKeys.indexOf(data.dataName);
                    count -= keyLen;
                    for(var n=0; n<keyLen; n++){
                        count += smColumnVals[n].length;
                    }
                    // count++;//日付カラムの分
                    // console.log(data.dataName + "は" + count + "の並びにあります");

                    switch (data.dataType) {
                        case 2:
                            var td0 = tr.find('td').eq(count);
                            var titleVal = data.dataName +" "+ title;
                            setTagInCell(td0, data, titleVal);
                            break;
                        case 3:
                            for(var m=0; m<data.data.length; m++){
                                var pos = count+m+1;
                                var vals = data.data[m].split(delimiter);
                                var tdE = tr.find('td').eq(pos);
                                var titleValE = data.dataName + " : "+ vals[1] +" "+ title;
                                if(vals[0] === "0"){
                                    var span = $('<span>', {
                                        title:  titleValE
                                    });
                                    if(vals[2] === "true"){
                                        span.html('<i class="fas fa-check color-orange"></i>').appendTo(tdE);
                                    } else if(vals[2] === "false"){
                                        span.html('<i class="fas fa-times color-disable"></i>').appendTo(tdE);
                                    }
                                } else if(vals[0] === "1"){
                                    $('<span>', {
                                        title: titleValE
                                    }).html(vals[2]).appendTo(tdE);
                                }
                            }
                            break;
                        case 4:
                            // todo 本来は"comment"ノードに格納されているので、実装後この点を修正すること
                            var td = tr.find('td').eq(count);
                            if(data.data.length <= 100) {
                                td.html(data.data);
                            } else {
                                // todo ここら辺の改行とかの動作、もうちょっとうまくやれるはず
                                var value = null;
                                if(data.data.indexOf("\n") === data.data.lastIndexOf("\n")){
                                    //改行が2箇所以上ある場合
                                    value = data.data.substring(0, 80) + "...";
                                } else {
                                    var first = data.data.indexOf("\n");
                                    var second = data.data.substring(first).indexOf("\n");
                                    value = data.data.substring(0, second);
                                }
                                value = value.replace(/(?:\r\n|\r|\n)/g, '<br />');
                                td.attr("full-txt", data.data);
                                td.html(value);
                                var dropDownBtn = $('<i>', {
                                    class: "fas fa-caret-down fa-lg color-orange",
                                    onclick: "expandText(this)",
                                    title: data.dataName +" "+ title
                                });
                                td.append($('<br />')).append(dropDownBtn);
                            }
                            break;
                    }
                });
            }

            if(k%2){
                tr.css('background-color', "#f9f9f7");
            }

            tbody.append(tr);
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
    for(var m=0; m<data.data.length; m++){
        var vals = data.data[m].split(delimiter);
        if(vals[2] === "true")
            continue;

        var color = getHighLightedColor(parseInt(vals[1]));
        var chipsHtml = $(
            '<span class="mdl-chip mdl-pre-upgrade" style="background-color: '+ color +'" title="'+ title +'">'+
                '<span class="mdl-chip__text">'+vals[0]+'</span>'+
            '</span>');
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
    for (var i=0; i<ele.length; i++){
        componentHandler.upgradeElement(ele.eq(i)[0]);
    }
}