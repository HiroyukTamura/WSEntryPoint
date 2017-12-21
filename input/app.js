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
            var doc = createElementWithHeader();
            // '<table class="card-block">' +
            // '</table>';

            // document.getElementById('card_wrapper').innerHTML += '<div class="card"><div class="card-block"></div></div>';

            switch (childSnap.child("dataType").val()){
                case 0:
                    break;
                case 1:
                    doc.appendChild(createTable());

                    var json = childSnap.child("data").child("0").val();
                    json = JSON.parse(json);
                    console.log(json);

                    if(json["eventList"]){
                        json["eventList"].forEach(function (value) {
                            var block = document.getElementById("dummy").getElementsByTagName("tr")[0].cloneNode(true);
                            var inputs = block.getElementsByClassName("mdl-textfield__input");
                            setEveInputValues(inputs, value);

                            //時刻の色を変える
                            var coloreds = block.getElementsByClassName("colored");
                            var color = getColor(value["colorNum"]);
                            console.log(coloreds.length);
                            for (var i=0; i<coloreds.length; i++){
                                console.log(i);
                                coloreds[i].style.color = color;
                            }
                            changeTimeColor(block, value);
                            // block.getElementsByClassName("mdl-textfield__input")[0].style.color = getColor(value["colorNum"]);
                            // block.getElementsByClassName("circle")[0].style.background = getColor(value["colorNum"]);

                            doc.children[1].appendChild(block);
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

                            // blocks[0].getElementsByClassName("circle")[0].style.background = getColor(value["colorNum"]);
                            changeTimeColor(blocks[0], value);
                            changeTimeColor(blocks[2], value);
                            // blocks[2].getElementsByClassName("circle")[0].style.background = getColor(value["colorNum"]);
                            blocks[1].getElementsByClassName("icon_down")[0].style.color = getColor(value["colorNum"]);

                            console.log(blocks.length);
                            for(var i=0; i<blocks.length; i++){
                                doc.children[1].appendChild(blocks[i].cloneNode(true));
                            }
                        });
                    }
                    break;
                case 2:

                    break;
                case 3:
                    var element = on3(doc, childSnap);
                    if(element){
                        doc.appendChild(element);
                    }
                    break;
                case 4:
                    var summery = getCommentAsNullable(childSnap);
                    var clone = document.getElementById("comment_dummy").cloneNode(true);
                    if(summery){
                        clone.getElementsByClassName("mdl-textfield__input")[0].setAttribute("value", summery);
                    }
                    doc.appendChild(clone);
                    break;
            }

            if(childSnap.child("dataType").val() !== 0){
                setHeaderTitle(doc, childSnap);
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

function changeTimeColor(block, value) {
    //時刻の色を変える
    var coloreds = block.getElementsByClassName("colored");
    var color = getColor(value["colorNum"]);
    for (var i=0; i<coloreds.length; i++){
        coloreds[i].style.color = color;
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

/**
 * コメントノードは、存在が保障されていません
 */
function getCommentAsNonNull(childSnap) {
    if (!childSnap.hasChild("data")){
        return "";
    }
    return childSnap.child("data").val();
}

function  getCommentAsNullable(childSnap) {
    if (!childSnap.hasChild("data")){
        return null;
    }
    return childSnap.child("data").val();
}

function createElementWithHeader() {
    var doc = document.createElement('div');
    doc.setAttribute("class", "card");
    doc.innerHTML =
        '<span class="ele_header">' +
            '<button class="mdl-button mdl-js-button mdl-button--icon remove_btn ele_header_button">' +
                '<i class="fas fa-times"></i>' +
            '</button>' +
            '<button class="mdl-button mdl-js-button mdl-button--icon arrow_down ele_header_button">' +
                '<i class="fas fa-angle-down"></i>' +
            '</button>' +
            '<button class="mdl-button mdl-js-button mdl-button--icon arrow_up ele_header_button">' +
                '<i class="fas fa-angle-up"></i>' +
            '</button>' +
        '</span>';
    return doc;
}

function setHeaderTitle(doc, childSnap) {
    var title;
    if(childSnap.child("dataType").val() !== 1){
        title = childSnap.child("dataName").val();
    } else {
        title = "イベント";
    }
    doc.getElementsByClassName("ele_header")[0].insertAdjacentHTML('afterbegin', title);
}

function createTable() {
    var table = document.createElement("table");
    table.setAttribute("class", "card_block");
    return table;
}

function on3(doc, childSnap) {
    if(childSnap.hasChild("data")){
        var ul = document.createElement("ul");
        ul.setAttribute("class", "demo-list-item mdl-list");
        
        childSnap.child("data").forEach(function (childSnap) {
            var splited = childSnap.val().split("9mVSv");
            console.log(splited);
            var witch = splited[0];
            var clone = document.getElementById("params_dummy").children[0].cloneNode(true);
            clone.getElementsByClassName("params_title")[0].innerHTML = splited[1];
            switch(witch){
                case "0":
                    clone.getElementsByClassName("params_slider")[0].style.display = "none";
                    // if(splited[2] == true){//==でstring型をbooleanに内部変換してもらえる
                        clone.getElementsByClassName("mdl-checkbox__input")[0].setAttribute("checked", "");
                        console.log("こっち");
                    // }
                    break;
                case "1":
                    clone.getElementsByClassName("params_check")[0].style.display = "none";
                    var slider = clone.getElementsByClassName("mdl-slider")[0];
                    slider.setAttribute("value", splited[2]);
                    slider.setAttribute("max", splited[3]);
                    break;
            }

            ul.appendChild(clone.children[0]);
        });

        doc.appendChild(ul);
    }
}