const delimiter = "9mVSv";

var masterJson;
var modalDataNum;
var modalTipNum;
var clickedColor;

function init() {
    // document.getElementById("place-holder").style.height = screen.availHeight + "px";
    // document.getElementById("place-holder").style.display = "inline";

    // $("#menu-toggle").click(function(e) {
    //     e.preventDefault();
    //     $("#wrapper").toggleClass("toggled");
    // });

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

        masterJson = [];
        snapshot.forEach(function (childSnap) {
            masterJson.push(childSnap.toJSON());
        });
        masterJson.shift();
        console.log(masterJson);

        if (!snapshot.exists()) {
            console.log("テンプレ存在せず！うわー！");
            return;
        }

        for (var i=0; i<masterJson.length; i++){
            var childSnap = masterJson[i];
            var doc = createElementWithHeader(i);

            switch (childSnap["dataType"]){
                case 0:
                    continue;
                case 1:
                    operateAs1(doc, childSnap);
                    break;
                case 2:
                    operateAs2(doc, childSnap);
                    break;
                case 3:
                    var element = operateAs3(doc, childSnap, i);
                    if(element){
                        createElementWithHeader(i).appendChild(element);
                    } else {
                        //todo エラー時処理？？
                    }
                    break;
                case 4:
                    operateAs4(doc, childSnap);
                    break;
            }

            setHeaderTitle(doc, childSnap);
            document.getElementById('card_wrapper').appendChild(doc);
        }

        var mixier = mixitup('#card_wrapper', {
            // load: {
            //     sort: 'order:asc'
            // },
            animation: {
                duration: 250,
                nudge: true,
                reverseOut: false,
                effects: "fade translateZ(-100px)"
            },
            selectors: {
                target: '.card'
            }
        });

        $(".ele_header_button").click(function(e) {
            e.preventDefault();
            var index = $('.ele_header_button').index(this);
            var dataNum = Math.floor(index/3);//小数切り捨て
            console.log("dataNum: "+dataNum);
            var selectedCard = $("[data-order=" + dataNum + "]");
            var elements = $(".card");
            switch (index%3){
                case 0:
                    delete masterJson[dataNum];
                    masterJson.splice(dataNum, 1);
                    selectedCard.remove();

                    for(var i=dataNum+1; i<masterJson.length+1; i++){
                        console.log("ueeee");
                        $("[data-order=" + i + "]").attr("data-order", i-1);
                    }
                    break;
                case 1:
                    //最後尾は後ろにずらせない
                    if(dataNum+1 < masterJson.length){
                        masterJson = swap(masterJson, dataNum, dataNum+1);
                        var nextCard = $("[data-order="+ (dataNum+1) +"]");
                        selectedCard.attr("data-order", dataNum+1);
                        nextCard.attr("data-order", dataNum);
                    }
                    break;
                case 2:
                    //最初の要素は前にずらせない masterJsonの先頭はダミー
                    if(dataNum-1 >= 0){
                        masterJson = swap(masterJson, dataNum, dataNum-1);
                        var prevCard = $("[data-order=" + (dataNum-1) + "]");
                        selectedCard.attr("data-order", dataNum-1);
                        prevCard.attr("data-order", dataNum);
                    }
                    break;
            }
            console.log(masterJson);
            mixier.sort("order:asc");
        });

        dragula([document.querySelector("#card_wrapper")], {
            moves: function (el, container, handle) {
                return handle.classList.contains('drag_bars');
            }
        }).on('drop', function (el) {
            var cards = $(".card");
            var prevPos = el.getAttribute("data-order");
            var currentPos = cards.index(el);
            masterJson = swap(masterJson, prevPos, currentPos);
            el.setAttribute("data-order", currentPos);
            cards.eq(prevPos).attr("data-order", prevPos);
        });

        initModal();
        // document.getElementById("place-holder").style.display = "none";
        // document.getElementById("page-content-wrapper").style.display = "inline";
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
    return childSnap["data"].val();
}

function  getCommentAsNullable(childSnap) {
    if (!childSnap["data"]){
        return null;
    }
    return childSnap["data"].val();
}

function setHeaderTitle(doc, childSnap) {
    var title;
    if(childSnap["dataType"] !== 1){
        title = childSnap["dataName"];
    } else {
        title = "イベント";
    }
    doc.getElementsByClassName("card_title_input")[0].setAttribute("value", title);
}

function createTable() {
    var table = document.createElement("table");
    table.setAttribute("class", "card_block");
    table.innerHTML = "<tbody></tbody>";
    return table;
}

//region **************operate系*******************
function operateAs1(doc, childSnap) {
    doc.appendChild(createTable());

    var json = JSON.parse(childSnap["data"]["0"]);

    if(json["eventList"]){
        json["eventList"].forEach(function (value) {
            var block = createHtmlAs1Eve();
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

            setElementAsMdl(block);
            doc.children[1].children[0].appendChild(block);
        });
    }

    if(json["rangeList"]){
        json["rangeList"].forEach(function (value) {
            // var clone = document.getElementById("dummy").getElementsByClassName("card-block")[0].cloneNode(true);
            var blocks = [];
            blocks[0] = createHtmlAs1Eve();
            blocks[1] = craeteHtmlAs1Row();
            blocks[2] = createHtmlAs1Eve();
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
                var element = blocks[i].cloneNode(true);
                setElementAsMdl(element);
                doc.children[1].children[0].appendChild(element);
            }
        });
    }
}

function operateAs2(doc, childSnap) {
    var pool = document.createElement("div");
    pool.setAttribute("class", "tag_pool");

    var count = 0;
    Object.keys(childSnap["data"]).forEach(function (key) {
        var splited = childSnap["data"][key].split(delimiter);
        var clone = createHtmlAs2();

        clone.getElementsByClassName("mdl-chip__text")[0].innerHTML = splited[0];
        // clone.getElementsByClassName("mdl-tooltip")[0].innerHTML = convertToDisplayLetters(splited[2]);
        if(splited[2] === "false"){
            clone.getElementsByClassName("chips_btn")[0].style.display = "none";
        } else if (splited[2] === "true"){
            clone.getElementsByClassName("chips_btn")[1].style.display = "none";
        } else {
            console.log(splited);
        }
        clone.getElementsByClassName("chips_btn_circle")[0].style.color = getColor(parseInt(splited[1]));

        clone.setAttribute("index", count);
        setElementAsMdl(clone);
        // var order = clone.closest($(".card")).attr("data-order");
        // var order = clone.parentNode.parentNode.
        // console.log(order);

        clone.getElementsByClassName("mdl-chip")[0].onclick = function (ev) {
            modalDataNum = parseInt(pool.parentElement.getAttribute("data-order"));
            modalTipNum = clone.getAttribute("index");
            var splited = masterJson[modalDataNum]["data"][modalTipNum].split(delimiter);
            clickedColor = parseInt(splited[1]);

            $('#modal_input').attr('value', splited[0]);
            $('.modal-circle-check').eq(parseInt(splited[1])).css("display", "inline");
                // .find(".modal-circle-w")
                // .eq(parseInt(splited[1]))
                // .append("<i class=\"fas fa-check modal-circle-check\" data-fa-transform=\"shrink-8\"></i>");

            if(splited[2] === "true"){
                document.getElementById('checkbox-modal-label').MaterialCheckbox.check();
            }

           // setCircleHoverEvent(index);

            showModal();
        };

        pool.append(clone);

        count++;
    });

    dragula([pool]);
    doc.append(pool);
}

function operateAs3(doc, childSnap, dataNum) {
    if(childSnap["data"]){
        var ul = document.createElement("ul");
        ul.setAttribute("class", "demo-list-item mdl-list");

        // var liNum = 0;
        var keys = Object.keys(childSnap["data"]);
        console.log(childSnap["data"]);

        for (var i=0; i<keys.length; i++){
            var splited = childSnap["data"][keys[i]].split(delimiter);
            console.log(splited);
            var witch = splited[0];
            // var clone = document.getElementById("params_dummy").children[0].cloneNode(true);
            var clone = createHtmlAs3(dataNum + "_" + keys[i]);
            clone.getElementsByClassName("params_title")[0].setAttribute("value", splited[1]);
            switch(witch){
                case "0":
                    clone.getElementsByClassName("params_slider")[0].style.display = "none";
                    // if(splited[2] == true){//==でstring型をbooleanに内部変換してもらえる
                    //     clone.getElementsByClassName("mdl-checkbox__input")[0].setAttribute("checked", "");
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
        }

        setElementAsMdl(ul);

        dragula([ul], {
            moves: function (el, container, handle) {
                return handle.classList.contains('.drag_btn_i');
            }
        });

        doc.appendChild(ul);
    }
}

function operateAs4(doc, childSnap) {
    var clone = createHtmlAs4();
    // var clone = document.getElementById("comment_dummy").cloneNode(true);
    var summery = getCommentAsNullable(childSnap);
    if(summery){
        clone.getElementsByClassName("mdl-textfield__input")[0].setAttribute("value", summery);
    }

    setElementAsMdl(clone);
    doc.appendChild(clone);
}
//endregion

function initModal() {
    var modal = $('#exampleModal');
    var input = $('#modal_input');

    /* blur on modal open, unblur on close */
    modal.on('show.bs.modal', function () {
        $('.container').addClass('blur');
        if(input.attr("value")){
            console.log("てってれー");
            input.parent().addClass('is-dirty');
        }
    });

    modal.on('hide.bs.modal', function () {
        $('.container').removeClass('blur');
        $('.modal-circle-check').css("display", "none");
        input.removeAttr("value");
        document.getElementById('checkbox-modal-label').MaterialCheckbox.uncheck();
        input.parent().removeClass('is-dirty');
    });

    //todo タイトルなしor重複の際にエラー処理 それともtextWatcher?
    $('.modal-footer-btn').eq(1).click(function (ev) {
        var title = $('#modal_input').attr("value");

        var show = $('#checkbox-modal-label').hasClass('is-checked');
        masterJson[modalDataNum]["data"][modalTipNum] = title + delimiter + clickedColor + delimiter + show;
        console.log(masterJson);
        modal.modal('hide');
    });

    // $('.modal-footer-btn').eq(1).on('click', function(){
    //
    //
    //     masterJson[modalDataNum]["data"][modalTipNum]
    // });
}

function setCircleHoverEvent(circleNum) {
    // var circle = $('.modal-circle-i');
    //
    // for(var i=0; i<circle.length; i++){
    //     if(i === circleNum)
    //        break;
    //
    //     circle.mouseenter(function (e) {
    //         $(this).next().css('display', "inline");
    //     });
    //     circle.mouseleave(function (e) {
    //         $(this).next().css('display', "none");
    //     });
    // }
    //
    // $('.modal-footer-btn').eq(1).onclick(function (ev) {
    //     var title = $('#modal_input').attr("value");
    //
    //     masterJson[modalDataNum]["data"][modalTipNum]
    // });
}

/**
 *
 * @param shouldShow :only "true"/"false"
 */
function convertToDisplayLetters(shouldShow) {
    switch (shouldShow){
        case "true":
            return "非表示";
        case "false":
            return "表示";
    }
}

function swap(arr,x,y){
    var a = arr[x];
    arr[x] = arr[y];
    arr[y] = a;
    return arr;
}

function setElementAsMdl(clone) {
    var ele = clone.getElementsByClassName("mdl-pre-upgrade");
    for (var i=0; i<ele.length; i++){
        componentHandler.upgradeElement(ele[i]);
    }
}

//region *****************html生成系**************

function createElementWithHeader(dataNum) {
    var doc = document.createElement('div');
    doc.setAttribute("class", "card mix");
    doc.setAttribute("data-order", dataNum.toString());
    var id = "card_title_" + dataNum;
    doc.innerHTML =
        '<span class="ele_header">' +
            '<i class="fas fa-bars drag_bars"></i>'+

            '<span class="mdl-textfield mdl-js-textfield mdl-pre-upgrade card_title">' +
                '<input class="mdl-textfield__input input_eve mdl-pre-upgrade card_title_input" type="text" id="'+ id +'">' +
                '<label class="mdl-textfield__label mdl-pre-upgrade" for="'+ id +'"></label>' +
            '</span>' +

            '<button class="mdl-button mdl-js-button mdl-button--icon remove_btn ele_header_button mdl-pre-upgrade">' +
                '<i class="fas fa-times mdl-pre-upgrade"></i>' +
            '</button>' +
            '<button class="mdl-button mdl-js-button mdl-button--icon arrow_down ele_header_button mdl-pre-upgrade">' +
                '<i class="fas fa-angle-down"></i>' +
            '</button>' +
            '<button class="mdl-button mdl-js-button mdl-button--icon arrow_up ele_header_button mdl-pre-upgrade">' +
                '<i class="fas fa-angle-up"></i>' +
            '</button>' +
        '</span>';
        // '<div class="seem_wrapper">' +
        //     '<div class="seem"></div>' +
        // '</div>';
    setElementAsMdl(doc);
    return doc;
}

function createHtmlAs1Eve() {
    var clone = document.createElement('tr');
    clone.innerHTML =
    // '<td class="circle_wrapper">' +
    // '<div class="circle">' +'</div>' +
    // '</td>' +

    '<td>' +
        '<form action="#" class="time colored">' +
            '<div class="mdl-textfield mdl-js-textfield mdl-pre-upgrade">' +
                '<input class="mdl-textfield__input time_input mdl-pre-upgrade" type="text" pattern="([01]?[0-9]{1}|2[0-3]{1})" id="sample">' +
                '<label class="mdl-textfield__label mdl-pre-upgrade" for="sample"></label>' +
                '<span class="mdl-textfield__error mdl-pre-upgrade">Error</span>' +
            '</div>' +
        '</form>' +
    '</td>' +

    '<td>' +

        '<p class="colon colored">:</p>' +
    '</td>' +

    '<td>' +
        '<form action="#" class="min colored">' +
            '<div class="mdl-textfield mdl-js-textfield mdl-pre-upgrade">' +
                '<input class="mdl-textfield__input time_input mdl-pre-upgrade" type="text" pattern="[0-5]{1}[0-9]{1}" id="sample2">' +
                '<label class="mdl-textfield__label mdl-pre-upgrade" for="sample2">' +'</label>' +
                '<span class="mdl-textfield__error mdl-pre-upgrade">Error</span>' +
            '</div>' +
        '</form>' +
    '</td>' +

    '<td>' +
        '<form action="#" class="event_name">' +
            '<div class="mdl-textfield mdl-js-textfield mdl-pre-upgrade">' +
                '<input class="mdl-textfield__input input_eve mdl-pre-upgrade" type="text" id="sample3">' +
                '<label class="mdl-textfield__label mdl-pre-upgrade" for="sample3">イベント名</label>' +
            '</div>' +
        '</form>' +
    '</td>';

    return clone;
}

function craeteHtmlAs1Row() {
    var clone = document.createElement("tr");
    clone.innerHTML =
        '<tr>' +
            '<td colspan="3">' +
                '<i class="fas fa-angle-double-down fa-2x icon_down">' +'</i>' +
            '</td>' +
        '</tr>';
    return clone;
}

function showModal() {
    var modal = $('#exampleModal').modal();
}

function createHtmlAs2() {
    var clone = document.createElement("div");
    clone.setAttribute("class", "tag_wrapper");
    // var clone = $("div", {class: "tag_wrapper"});
    clone.innerHTML =
        '<a href="#">'+
            '<span class="mdl-chip mdl-chip--contact mdl-pre-upgrade">' +
                '<span class="mdl-chip__contact custom_tips_btn mdl-pre-upgrade" id="tooltip_delete">' +
                    '<span class="fa-stack">' +
                        '<i class="fas fa-circle fa-stack-1x chips_btn_circle"></i>' +
                        '<i class="fas fa-eye fa-stack-1x chips_btn"></i>' +
                        '<i class="fas fa-eye-slash fa-stack-1x chips_btn"></i>' +
                    '</span>' +
                '</span>' +
                '<span class="mdl-chip__text"></span>' +
                // '<a href="#" class="mdl-chip__action mdl-pre-upgrade a_remove_btn"><i class="fas fa-times remove_btn"></i></a>'+
            '</span>' +
        '</a>';
        // '<div class="mdl-tooltip" for="tooltip_delete"></div>';
    return clone;
}

function createHtmlAs3(id) {
    var clone = document.createElement("ul");
    clone.setAttribute("class", "demo-list-item mdl-list mdl-pre-upgrade");
    var checkId = "checkId" + id;
    var inputId = "inputId" + id;
    clone.innerHTML =
        '<li class="mdl-list__item mdl-pre-upgrade">'+
            '<i class="fas fa-bars drag_btn_i"></i>'+

        '<span class="mdl-list__item-primary-content mdl-pre-upgrade">'+
            '<form action="#">' +
                '<div class="mdl-textfield mdl-js-textfield mdl-pre-upgrade params_title_w">'+
                    '<input class="mdl-textfield__input input_eve mdl-pre-upgrade params_title" type="text" id="'+inputId+'">' +
                    '<label class="mdl-textfield__label" for="'+inputId+'"></label>' +
                '</div>' +
            '</form>' +
        '</span>'+

            '<span class="mdl-list__item-secondary-action params_check">'+
                '<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-pre-upgrade" for="' + checkId +'">'+
                    '<input type="checkbox" id="' + checkId + '" class="mdl-checkbox__input mdl-pre-upgrade" />'+
                '</label>'+
            '</span>'+

            '<p class="slider_wrapper params_slider" style="width:300px">'+
                '<input class="mdl-slider mdl-js-slider mdl-pre-upgrade" type="range" id="s1" min="0" max="5" value="3" step="1">'+
            '</p>'+
        '</li>';
    return clone;
}

function createHtmlAs4() {
    var clone = document.createElement("div");
    clone.innerHTML =
        '<div id="comment_dummy">'+
            '<form action="#" class="comment_form">' +
                '<div class="mdl-textfield mdl-js-textfield comment mdl-pre-upgrade">' +
                    '<textarea class="mdl-textfield__input comment_ta mdl-pre-upgrade" type="text" rows= "3" id="comment" ></textarea>' +
                    '<label class="mdl-textfield__label mdl-pre-upgrade" for="comment">Text...</label>' +
                '</div>' +
            '</form>' +
        '</div>';
    return clone;
}
//endregion