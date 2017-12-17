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
            var doc = document.createElement('div');
            doc.setAttribute("class", "card");
            doc.innerHTML = '<table class="card-block"></table>';

            // document.getElementById('card_wrapper').innerHTML += '<div class="card"><div class="card-block"></div></div>';

            switch (childSnap.child("dataType").val()){
                case 0:
                    break;
                case 1:
                    var json = childSnap.child("data").child("0").val();
                    json = JSON.parse(json);
                    console.log(json);

                    if(json["eventList"]){
                        json["eventList"].forEach(function (value) {
                            var block = document.getElementById("dummy").getElementsByTagName("tr")[0].cloneNode(true);
                            var inputs = block.getElementsByClassName("mdl-textfield__input");
                            setEveInputValues(inputs, value);
                            block.getElementsByClassName("circle")[0].style.background = getColor(value["colorNum"]);

                            doc.children[0].appendChild(block);
                        });
                    }

                    if(json["rangeList"]){
                        json["rangeList"].forEach(function (value) {
                            var clone = document.getElementById("dummy").getElementsByClassName("card-block")[0].cloneNode(true);
                            var blocks = clone.getElementsByTagName("tr");
                            var startInputs = blocks[0].getElementsByClassName("mdl-textfield__input");
                            setEveInputValues(startInputs, value["start"]);
                            var endInputs = blocks[2].getElementsByClassName("mdl-textfield__input");
                            setEveInputValues(endInputs, value["end"]);

                            blocks[0].getElementsByClassName("circle")[0].style.background = getColor(value["colorNum"]);
                            blocks[2].getElementsByClassName("circle")[0].style.background = getColor(value["colorNum"]);
                            blocks[1].getElementsByClassName("icon_down")[0].style.color = getColor(value["colorNum"]);

                            console.log(blocks.length);
                            for(var i=0; i<blocks.length; i++){
                                doc.children[0].appendChild(blocks[i].cloneNode(true));
                            }
                        });
                    }
                    break;
                case 2:

                    break;
                case 3:

                    break;
            }

            if(childSnap.child("dataType").val() !== 0){
                document.getElementById('card_wrapper').appendChild(doc);
            }
        });
    });
}

function getUid() {
    var url = new URL(window.location.href);
    return url.searchParams.get("uid");
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

function setEveInputValues(inputs, value) {
    inputs[0].setAttribute("value", format0to00(value["cal"]["hourOfDay"]));
    inputs[1].setAttribute("value", format0to00(value["cal"]["minute"]));
    inputs[2].setAttribute("value", value["name"]);
}

function format0to00(value) {
    if(value === "0" || value === 0)
        return "00";
     else
         return value;
}