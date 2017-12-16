
var myChart = null;
var snapShots = [];

function initApp() {
    var config = {
        apiKey: "AIzaSyBQnxP9d4R40iogM5CP0_HVbULRxoD2_JM",
        authDomain: "wordsupport3.firebaseapp.com",
        databaseURL: "https://wordsupport3.firebaseio.com",
        projectId: "wordsupport3",
        storageBucket: "wordsupport3.appspot.com",
        messagingSenderId: "60633268871"
    };
    var defaultApp = firebase.initializeApp(config);
    var defaultDatabase = defaultApp.database();

    var uid = getUid();
    setTitle(defaultDatabase, uid);

    var date = new Date();
    date.setDate(1);
    // date.setMonth(date.getMonth()-1);
    console.log(date.toDateString());
    var lastDate = getLastDate(date.getFullYear(), date.getMonth());
    chart(lastDate);

    for (var i=0; i<lastDate; i++){
        var key = date.toISOString().slice(0,10).replace(/-/g,"");
        const n = i;
        defaultDatabase.ref('/usersParam/' + uid + '/' + key).once('value').then(function(snapshot) {
            snapShots[n] = snapshot;

            if (!snapshot.exists()){
                console.log("存在せず");
                return
            }

            var date = parseInt(snapshot.key.substr(7));

            snapshot.forEach(function (childSnapshot) {
                if (childSnapshot.child("dataType").val() === 1){
                    var value = childSnapshot.child("data").child("0").val();
                    var json = JSON.parse(value);
                    json.rangeList.forEach(function (entry) {

                        if (entry.start.name === "起床" && entry.end.name === "就寝"){

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
                        }

                        myChart.update();
                    });
                }
            });

            //最後までデータを取得したかどうかをチェック
            const count = snapShots.filter(function (element) {
                return element !== null;
            }).length;
            if (count === lastDate){
                console.log("最後きました")
            }
        });

        date.setDate(date.getDate()+1);
    }
}

function getLastDate(year, month) {
    return new Date(year, month+1, 0).getDate();
}

function getTime(entryC) {
    var hour = entryC.cal.hourOfDay;
    var min = entryC.cal.minute;
    return hour + min/60
}

function getRangeArr(date, start, end, offset) {
    var arrC = [];
    date = date + offset;
    for(var n=0; n<=24; n++){
        if (start<n && n<end){
            arrC.push(date);
        } else {
            arrC.push(null);
        }
    }
    return arrC;
}

function getRangeStart(date, start) {
    var arrD = [];
    for (var n=0; n<=24; n++){
        if (start < n){
            arrD.push(date)
        } else {
            arrD.push(null);
        }
    }
    return arrD;
}

function getRangeEnd(date, end) {
    var arrE = [];
    for (var n=0; n<=24; n++){
        if (n < end){
            arrE.push(date);
        } else {
            arrE.push(null);
        }
    }
    console.log(arrE);
    return arrE;
}

function pushData(arr, date) {
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

function chart(lastDate) {

    var ctx = document.getElementById("chart_div").getContext("2d");
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
                        suggestedMax: lastDate+1,
                        reverse: true,
                        stepSize: 1
                    }
                }]
            },
            legend: {
                display: false
            }
        }
    });
}

function makeXaxis() {
    var arr = [];
    for (var i=0; i<=24; i++){
        arr.push(i);
    }
    return arr;
}

function getUid() {
    var url = new URL(window.location.href);
    return url.searchParams.get("uid");
}

function setTitle(defaultDatabase, uid) {
    defaultDatabase.ref('/userData/' + uid + '/displayName').once('value').then(function(snapshot) {
        if (!snapshot.exists()) {
            console.log("ユーザ名存在せず");
            return;
        }

        $('#chart-title').html(snapshot.val() + "さんの記録");
    });
}