function init() {
    $("#menu-toggle").click(function(e) {
        e.preventDefault();
        $("#wrapper").toggleClass("toggled");
    });

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

    defaultDatabase.ref("/userData/" + getUid() + "/template").once('value').then(function(snapshot) {

        if (!snapshot.exists()) {
            console.log("テンプレ存在せず！うわー！");
            return;
        }

        snapshot.forEach(function (childSnap) {
            document.getElementById('card_wrapper').innerHTML += '<div class="card"><div class="card-block"></div></div>';

            switch (childSnap.child("dataType").val()){
                case 0:
                    break;
                case 1:
                    var json = childSnap.child("data").child("0").val();
                    json = JSON.parse(json);
                    console.log(json);

                    if(json["eventList"]){
                        json["eventList"].forEach(function (value) {
                            console.log(value["name"]);
                            console.log(value["colorNum"]);
                            console.log(value["cal"]["hourOfDay"]);
                            console.log(value["cal"]["minute"]);
                        });
                    }

                    if(json["rangeList"]){
                        json["rangeList"].forEach(function (value) {
                            console.log(value["colorNum"]);
                            console.log(value["start"]);
                        });
                    }
                    break;
                case 2:

                    break;
                case 3:

                    break;
            }
        });
    });
}

function getUid() {
    var url = new URL(window.location.href);
    return url.searchParams.get("uid");
}

function parseJson(jsonStr) {
    console.log(JSON.parse(jsonStr));
}