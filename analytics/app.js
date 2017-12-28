var defaultApp;
var masterJson = {};
var myChart;
var MODE_WEEK = 7;
const wodList = ["日", "月", "火", "水", "木", "金", "土"];

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
            $('#progress').css("display", "none");
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
                                if(user.uid !== getUid()){
                                    var currentUrl = $(location).attr('href');
                                    window.location.href = currentUrl.substring(0, currentUrl.indexOf("?"));
                                } else {
                                    onLoginSuccess(user.uid);
                                }
                                return false;
                            }
                        }
                    };

                    var ui = new firebaseui.auth.AuthUI(firebase.auth());
                    $('#progress').css('display', "none");
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

function getDaysOfWeek() {
    var now = moment();
    var dayOfWeek = now.day();
    now.add( -dayOfWeek, 'd');
    var days = [];
    for(var i=0; i<7; i++){
        days.push(now.format('YYYYMMDD'));
        now.add(1, 'd');
    }
    return days;
}

function onLoginSuccess(uid) {
    var defaultDatabase = defaultApp.database();
    var getCount = 0;

    getDaysOfWeek().forEach(function (day) {
        console.log(day);
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
            if(getCount === 7){
                console.log(masterJson);
                displayTest();

                $('#login_w').css('display', "none");
                $('#post_load').css('display', 'inline');
            }
        });
    });
}

function displayTest() {
    //dataType === 1のものを集計する。
    var keys = Object.keys(masterJson);
    setTitle(MODE_WEEK, keys[0]);
    chart(MODE_WEEK, keys[0]);

    var date = 0;
    keys.forEach(function (key) {
        if(masterJson[key]){
            masterJson[key].forEach(function (data) {
                if(data["dataType"] === 1){
                    var json = JSON.parse(data["data"]["0"]);
                    console.log(json);
                    // var date = moment(key, "YYYYMMDD").date();
                    json.rangeList.forEach(function (entry) {
                        console.log(entry);

                        var start = getTime(entry.start);
                        var end = getTime(entry.end);

                        if (entry.start.offset === entry.end.offset){

                            pushData(getRangeArr(date, start, end, entry.start.offset), date, entry.start.offset);

                        } else if (entry.start.offset - entry.end.offset === 1){

                            date -= entry.start.offset;
                            pushData(getRangeStart(date, start), date);
                            date += 1;
                            pushData(getRangeEnd(date, end), date);

                        } else if (entry.start.offset - entry.end.offset === 2){

                            date -= entry.start.offset;
                            pushData(getRangeStart(date, start), date);

                            date += 1;
                            var arrH = [];
                            for(var i=0; i<=24; i++){
                                arrH.push(date);
                            }

                            pushData(arrH, date);

                            date += 1;
                            pushData(getRangeEnd(date, start), date);
                        }

                        myChart.update();
                    });
                }
            });
        }

        date++;
    });
}

// todo 次作業ここからです
function setTitle(mode, firstDate) {
    console.log(firstDate);
    var momentO = moment(firstDate.toString(), "YYYYMMDD");
    var start = momentO.format('MM.DD');
    momentO.add(mode, 'd');
    var end = momentO.format('MM.DD');
    var title = start +" → "+ end;
    $('#chart_title').html(title);
}

function chart(mode, firstCal) {
    var ctx = $('#chart_div')[0].getContext("2d");
    var dates = [];
    var cal = moment(firstCal);
    for(var n=0; n<mode; n++){
        dates.push(cal.format('YYYYMMDD'));
        cal.add(1, 'd');
    }

    cal = moment(firstCal);
    var yAxis = [];
    var month;
    for(var i=0; i<mode; i++){
        var value;
        if(i === 0 || cal.month() !== month){
            month = cal.month();
            value = cal.format('MM/DD');
        } else {
            value = cal.format('DD');
        }
        yAxis.push(value +"("+ wodList[cal.day()] +")");
        cal.add(1, 'd');
    }

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: makeXaxis(),
            datasets: []
        },
        options: {
            responsive: false,
            scales: {
                yAxes: [{
                    ticks: {
                        suggestedMin: 0,
                        suggestedMax: mode,
                        reverse: true,
                        stepSize: 1,
                        callback: function(value, index, values) {
                            if(index === mode)
                                return null;

                            return yAxis[value];
                        }
                    }
                }]
            },
            legend: {
                display: false
            },
            tooltips: {
                callbacks: {
                    intersect: false,
                    title: function (toolTips, data) {
                        console.log(toolTips, data);
                        var arr = data["datasets"][0]["data"];
                        var dateVal = dates[toolTips[0]["yLabel"]];
                        var xAxis = parseInt(toolTips[0]["xLabel"]);
                        // var start, end;
                        // for(var i=0; i<arr.length; i++){
                        //     if(!start && arr[i]){
                        //         start = i;
                        //     } else if(start && !end && !arr[i]){
                        //         end = i-1;
                        //         break;
                        //     }
                        // }

                        for(var m=0; m<masterJson[dateVal].length; m++){
                            var child = masterJson[dateVal][m];
                            if(child["dataType"] !== 1)
                                continue;

                            var json = JSON.parse(child["data"]["0"]);
                            //まずeve, 次にrangeListからぶっこ抜いていく。
                            for(var n=0; n<json.rangeList.length; n++){
                                //todo オフセット判定とか考えるべきやね
                                var entry = json.rangeList[n];
                                if(getTime(entry.start) <= xAxis &&  xAxis <= getTime(entry.end)){
                                    return entry.start.name + " → " + entry.end.name;
                                }
                            }
                        }
                    }
                }
            }
        }
    });
}

/*---------------描画まわり-------------*/
function makeXaxis() {
    var arr = [];
    for (var i=0; i<=24; i++){
        arr.push(i);
    }
    return arr;
}

function getTime(entryC) {
    var hour = entryC.cal.hourOfDay;
    var min = entryC.cal.minute;
    return hour + min/60
}

function pushData(arr, date) {
    console.log(arr, date);
    myChart.data.datasets.push({
        data: arr,
        pointRadius: setRadius(arr, date),
        backgroundColor: "#00897B",
        borderColor: "#00897B",
        fill: false
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
    for(var n=0; n<=24; n++){
        if (start<=n && n<=end){
            arrC.push(date);
        } else {
            arrC.push(null);
        }
    }
    return arrC;
}
/*---------------描画まわりここまで-------------*/