const delimiter = "9mVSv";
const ERR_MSG_NULL_VAL = "項目名を入力してください";
const ERR_MSG_CONTAIN_BAD_CHAR = ["文字列「", "」は使用できません"];
const ERR_MSG_DUPLICATE_VAL = "項目名が重複しています";
const ERR_MSG_EACH_VAL_SAME = "項目名は開始と終了で別にしてください";
const ERR_MSG_OPE_FAILED = '処理に失敗しました';
const ERR_MSG_NO_INTERNET = 'インターネットに接続されていません';
const ERR_MSG_NO_CONTENTS = '項目は最低でもひとつ必要です';
const SUCCESS_MSG_SAVE = '保存しました';

const TIME_POPOVER_CONFIG = {
    trigger: 'manual',
    placement: 'bottom',
    content:'<div class="circle-popover">'+
                '<span class="fa-layers modal-circle-w modal-circle-w1">'+
                    '<i class="fas fa-circle modal-circle-i circle1"></i>'+
                    '<i class="fas fa-check modal-circle-check" data-fa-transform="shrink-8"></i>'+
                '</span>'+
                '<span class="fa-layers modal-circle-w">'+
                    '<i class="fas fa-circle modal-circle-i circle2"></i>'+
                    '<i class="fas fa-check modal-circle-check" data-fa-transform="shrink-8"></i>'+
                '</span>'+
                '<span class="fa-layers modal-circle-w">'+
                    '<i class="fas fa-circle modal-circle-i circle3"></i>'+
                    '<i class="fas fa-check modal-circle-check" data-fa-transform="shrink-8"></i>'+
                '</span>'+
                '<span class="fa-layers modal-circle-w">'+
                    '<i class="fas fa-circle modal-circle-i circle4"></i>'+
                    '<i class="fas fa-check modal-circle-check" data-fa-transform="shrink-8"></i>'+
                '</span>'+
            '</div>',
    html: true,
    container: 'body',
    offset: '0, 15px'
};
const colors = ["#C0504D", "#9BBB59", "#1F497D", "#8064A2"];

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

var masterJson;
var modalDataNum;
var modalTipNum;
var clickedColor;
var loginedUser;
var isModalOpen = false;
var isModalForNewTag = false;
var defaultDatabase;

Array.prototype.move = function(from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};

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
    defaultDatabase = defaultApp.database();

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            loginedUser = user;

            defaultDatabase.ref("/userData/" + user.uid + "/template").once('value').then(function(snapshot) {
                masterJson = [];
                snapshot.forEach(function (childSnap) {
                    masterJson.push(childSnap.toJSON());
                });
                masterJson.shift();

                //タグの連想配列を普通の配列に変換
                masterJson.forEach(function (arr) {
                    if(arr["dataType"] === 2 || arr["dataType"] === 3){
                        var newArr = [];
                        Object.values(arr["data"]).forEach(function (value) {
                            newArr.push(value);
                        });
                        arr["data"] = newArr;
                    }
                });
                console.log(masterJson);

                if (!snapshot.exists()) {
                    console.log("テンプレ存在せず！うわー！");
                    //todo エラー処理
                    return;
                }

                for (var i=0; i<masterJson.length; i++){
                    var childSnap = masterJson[i];
                    var cardWrapper = createElementWithHeader(i, childSnap["dataType"]);
                    var doc = cardWrapper.children[1];

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

                    setHeaderTitle(doc, childSnap);//todo これcreateElementWithHeaderと一緒にできるでしょ
                    $('.card_wrapper').append($(cardWrapper));
                }

                setOnClickCardHeaderBtn();

                initCardDragging();
                initModal();
                initAllTooltips();
                setOnBtmFabClickListener();
                setOnSaveFabClickListener();
                // document.getElementById("place-holder").style.display = "none";
                // document.getElementById("page-content-wrapper").style.display = "inline";

                $('#progress').css("display", "none");
                $('#post_load').css("display", "inline");
            });

            // var url = "../analytics/index.html;
            // $('.mdl-navigation__link').eq(2).attr("href", url);

        } else {
            console.log("ユーザはログアウトしたっす。");
            //todo ログアウト時の動作

            initAllTooltips();
            $('#fab-wrapper').hide();
            $('#save').hide();
        }
    });

    initDrawerDecoration();
}

function initDrawerDecoration() {
    $('.mdl-navigation .mdl-navigation__link:not(.current-page)').hover(function (e) {
        $(this).find('.drawer_icon').css('color', '#E57C3E');
        $(this).css('color', '#E57C3E');
    }, function (e) {
        $(this).find('.drawer_icon').css('color', '#757575');
        $(this).css('color', '#757575');
    });
}

function initAllTooltips() {
    $('[data-toggle="tooltip"]').tooltip({
        offset: '0, 8px'
    });
}

//region ////////////////card並び替えまわり//////////////
function mixWithCardOnSwap() {
    createMixUpObjForCard()
        .sort('order:asc')
        .then(function(state) {
            console.log(state);
            $('.card_wrapper').removeAttr('id');
            console.log(masterJson);
        });
}

function mixWithCardOnRemove(selectedCard) {
    createMixUpObjForCard()
        .remove(selectedCard[0])
        .then(function(state) {
            console.log(state);
            selectedCard.remove();
            $('.card_wrapper').removeAttr('id');
            console.log(masterJson);
        });
}

function createMixUpObjForCard() {
    return mixitup('.card_wrapper', {
        animation: {
            duration: 250,
            nudge: true,
            reverseOut: false,
            effects: "fade translateZ(-100px)"
        },
        selectors: {
            target: '.card-wrapper-i',
            control: '.mixitup-control'//@see https://goo.gl/QpW5BR
        }
    })
}

function onSwapCard(selectedCard, dataNum, newDataNum) {
    swap(masterJson, dataNum, newDataNum);
    var nextCard = $("[data-order="+ newDataNum +"]");
    selectedCard.attr("data-order", newDataNum)
        .find('.letter3').html(newDataNum+1);
    nextCard.attr("data-order", dataNum)
        .find('.letter3').html(dataNum+1);
}

function initCardDragging() {
    dragula([document.querySelector(".card_wrapper")], {
        moves: function (el, container, handle) {
            return handle.classList.contains('drag_bars');
        }

    }).on('drop', function (el) {

        var cards = $(".card-wrapper-i");
        var prevPos = $(el).attr("data-order");
        var currentPos = $(el).index();
        masterJson = swap(masterJson, prevPos, currentPos);
        for(var i=0; i< cards.length; i++){
            cards.eq(i)
                .attr('data-order', i)
                .find('.letter3').html(i+1);
        }
    });
}
//endregion

function setOnClickCardHeaderBtn() {
    $('.ele_header_button').on('click', function (e) {
        e.preventDefault();
        var index = $('.ele_header_button').index(this);
        var selectedCard = $(this).parents('.card-wrapper-i');
        var dataNum = parseInt(selectedCard.attr('data-order'));
        console.log("dataNum: "+dataNum, index);
        var newDataNum;
        // var newCard = $("[data-order="+ newDataNum +"]");
        // var elements = $(".card");
        switch (index%3){
            case 0:
                delete masterJson[dataNum];
                masterJson.splice(dataNum, 1);

                for(var i=dataNum+1; i<masterJson.length+1; i++){
                    $("[data-order=" + i + "]").attr("data-order", i-1)
                        .find('.letter3').html(i);
                }

                mixWithCardOnRemove(selectedCard);
                break;

            case 1:
                //最後尾は後ろにずらせない
                newDataNum = dataNum+1;
                if (masterJson.length === newDataNum)
                    break;

                // if(dataNum+1 < masterJson.length){
                onSwapCard(selectedCard, dataNum, newDataNum);
                // }
                mixWithCardOnSwap();
                break;

            case 2:
                //最初の要素は前にずらせない masterJsonの先頭はダミー
                if(dataNum === 0)
                    return false;

                // if(dataNum-1 >= 0){
                newDataNum = dataNum-1;
                onSwapCard(selectedCard, dataNum, newDataNum);
                // } else
                //     return false;
                mixWithCardOnSwap();
                break;
        }
        return false;
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

// function changeTimeColor(block, value) {
//     //時刻の色を変える
//     var coloreds = block.getElementsByClassName("colored");
//     var color = getColor(value["colorNum"]);
//     for (var i=0; i<coloreds.length; i++){
//         coloreds[i].style.color = color;
//     }
// }

function setEveInputValues(inputs, value) {
    inputs.eq(0).attr("value", value["cal"]["hourOfDay"] + ":" + format0to00(value["cal"]["minute"]));
    inputs.eq(1).attr("value", value["name"]);
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
    var titleInput = $(doc).find(".card_title_input").eq(0);
    var errSpan = titleInput.parent().find('.mdl-textfield__error');
    if(childSnap["dataType"] !== 1){
        titleInput.attr("value", childSnap["dataName"]);
        titleInput.keyup(function (e) {
            //todo 不正な値でもmasterJsonに書き込んでいることに注意してください
            var isValid = isValidAboutNullAndDelimiter(titleInput, errSpan);
            for(var i=0; i<masterJson.length; i++){
                if (masterJson[i]['dataName'] && masterJson[i]['dataName'] === titleInput.val()) {
                    errSpan.html(ERR_MSG_DUPLICATE_VAL);
                    errSpan.parent().addClass('is-invalid');
                    isValid = false;
                    console.log('こっち');
                    break;
                }
                console.log(masterJson[i]['dataName'], titleInput.val());
            }

            if(isValid){
                titleInput.parent().removeClass('is-invalid');
            }
            var order = $(doc).parents('.card-wrapper-i').attr("data-order");
            masterJson[parseInt(order)]["dataName"] = titleInput.val();
        });
    } else {
        titleInput.html("イベント");
    }
}

function createTable() {
    return $(
        '<div class="card_block_w">' +
            '<table class="card_block">' +
                '<tbody>' +

                '</tbody>'+
            '</table>'+
        '</div>'
    );
}

//region **************operate系*******************
//region /////////////////operateAs1系/////////////////
/**
 * data-orderに関して: dayEveについてはdata-orderの値はYYmmとする
 * dayEveの追加ボタンは10000とする
 * @param doc
 * @param childSnap
 */
function operateAs1(doc, childSnap) {
    $(doc).append(createTable());

    var json = JSON.parse(childSnap["data"]["0"]);

    var addRowBtn = createAssEveRow('eve-add', 10000);

    addRowBtn.on('click', function (e) {
        console.log('addRowBtn click');
        var value = createNewTimeEveData();
        createOneEveRow(doc, value);
        var dataOrder = $(this).parents(".card-wrapper-i").attr('data-order');
        var jsonC = JSON.parse(masterJson[dataOrder]['data']["0"]);
        jsonC['eventList'].push(value);//todo ん？push??ここは時刻でsortすべきでは？ん?sortするってことは、迂闊にindex()とかできないな・・・ mixitUpでソートした後、いい感じにすることだ。
        masterJson[dataOrder]['data']["0"] = JSON.stringify(jsonC);

        console.log(JSON.parse(masterJson[dataOrder]['data']["0"]));
        setElementAsMdl(doc);

        //todo うごかないぞタコ！
        mixitup($(doc).find('tbody'), {
            load: {
                sort: 'order:asc'
            },
            animation: {
                duration: 250,
                nudge: true,
                reverseOut: false,
                effects: "fade translateZ(-100px)"
            },
            selectors: {
                target: $(doc).find('.card_block tbody tr'),
                control: '.mixitup-control'//@see https://goo.gl/QpW5BR
            }
        }).sort("order:asc");
    });

    $(doc).find('tbody').append(addRowBtn);

    if(json["eventList"]){
        json["eventList"].forEach(function (value) {
            createOneEveRow(doc, value);
        });
    }

    var count = 1;//#eve-add のdata-orderは10000なので、eveListのdata-orderは10001スタートにしたい
    var addRangeBtn = createAssEveRow('range-add', 1000000);

    addRangeBtn.on('click', function (e) {
        console.log('addRangeBtn clicked');
        var newRangeData = createNewRangeData();
        // json["rangeList"].push(newRangeData);

        var dataOrder = $(this).parents(".card-wrapper-i").attr('data-order');
        var jsonC = JSON.parse(masterJson[dataOrder]['data']["0"]);
        jsonC['rangeList'].push(newRangeData);
        masterJson[dataOrder]['data']["0"] = JSON.stringify(jsonC);

        createOneRangeRow(doc, count, newRangeData);
        setElementAsMdl(doc);
        console.log(JSON.parse(masterJson[dataOrder]['data']["0"]));

        count++;
    });

    $(doc).find('tbody').append(addRangeBtn);

    if(json["rangeList"]){
        json["rangeList"].forEach(function (value) {
            // var clone = document.getElementById("dummy").getElementsByClassName("card-block")[0].cloneNode(true);
            console.log(value);
            createOneRangeRow(doc, count, value);
            count++;
        });
    }

    setElementAsMdl(doc);
}

////////////////////////region 新規TimeEve/RangeEve作成処理
function createOneRangeRow(doc, count, value) {

    var blocks = [];
    blocks[0] = createHtmlAs1Eve();
    setDataOrderToRangeList($(blocks[0]), count);
    $(blocks[0]).find('.remove-btn').hide();
    blocks[1] = craeteHtmlAs1Row();
    setDataOrderToRangeList($(blocks[1]), count);
    blocks[2] = createHtmlAs1Eve();

    setDataOrderToRangeList($(blocks[2]), count);
    $(blocks[2]).find('.remove-btn').hide();
    $(blocks[2]).addClass('range-post');
    var startInputs = $(blocks[0]).find(".mdl-textfield__input");
    setEveInputValues(startInputs, value["start"]);
    var endInputs = $(blocks[2]).find(".mdl-textfield__input");
    setEveInputValues(endInputs, value["end"]);

    $(blocks[0]).find('.circle').css('background-color', colors[value["colorNum"]]).attr('colorNum', value["colorNum"]);
    $(blocks[2]).find('.circle').css('background-color', colors[value["colorNum"]]).attr('colorNum', value["colorNum"]);
    $(blocks[1]).find('.icon_down').css('color', colors[value["colorNum"]]).attr('colorNum', value["colorNum"]);

    //リスナをセット
    setRangeDatePicker($(blocks[0]));
    setRangeDatePicker($(blocks[2]));

    $(blocks[1]).find('.remove-btn').on('click', function (ev) {
        var tr = $(this).closest('tr');
        var index = tr.index() - tr.parents('tbody').find('.eve-add').index()-1;
        var dataOrder = $(this).closest(".card-wrapper-i").attr('data-order');
        var dataNum = Math.floor(index/3);
        var jsonC = JSON.parse(masterJson[dataOrder]['data']["0"]);
        jsonC["rangeList"].splice(dataNum, 1);
        masterJson[dataOrder]['data']["0"] = JSON.stringify(jsonC);

        tr.prev().remove();
        tr.next().remove();
        tr.remove();
    });


    //region 禁則文字まわり
    var startInput = $(blocks[0]).find('.input_eve');
    var endInput = $(blocks[2]).find('.input_eve');
    var errSpanStart = $(blocks[0]).find('.event_name .mdl-textfield__error');
    var errSpanEnd = $(blocks[2]).find('.event_name .mdl-textfield__error');

    startInput.keyup(function (e) {
        //todo 不正な値であっても、masterJsonに書き込んでいることに注意してください。
        var isValid = isValidAboutNullAndDelimiter($(e.target), errSpanStart);

        var currentDataOrder = $(e.target).parents('.card-wrapper-i').attr('data-order');
        var index = getRangeIndex($(e.target));
        var jsonC = JSON.parse(masterJson[currentDataOrder]['data']['0']);

        if($(e.target).val() === jsonC['rangeList'][index]['end']['name']){
            showEachErrSpan(startInput, endInput, errSpanStart, errSpanEnd, ERR_MSG_EACH_VAL_SAME);
            isValid = false;

        } else {
            console.log($(e.target).val(), jsonC['rangeList'][index]['end']['name']);

            for(var key in jsonC['rangeList']) {
                if(!jsonC['rangeList'].hasOwnProperty(key))
                    continue;

                if(key == index)
                    continue;

                if (jsonC['rangeList'][key]['start']['name'] === $(e.target).val()
                    && jsonC['rangeList'][key]['end']['name'] === endInput.val()) {

                    showEachErrSpan(startInput, endInput, errSpanStart, errSpanEnd, ERR_MSG_DUPLICATE_VAL);
                    isValid = false;
                    console.log('こっち');
                    break;
                }
            }
        }

        if (isValid){
            $(e.target).parent().removeClass('is-invalid');
            endInput.parent().removeClass('is-invalid');
            console.log('うむ');
        }
        // jsonC['eventList'][index]['name'] = $(e.target).val();
        // masterJson[currentDataOrder]['data']['0'] = JSON.stringify(jsonC);
    });


    endInput.keyup(function (e) {
        //todo 不正な値であっても、masterJsonに書き込んでいることに注意してください。
        var isValid = isValidAboutNullAndDelimiter($(e.target), errSpanEnd);

        var currentDataOrder = $(e.target).parents('.card-wrapper-i').attr('data-order');
        var index = getRangeIndex($(e.target));
        var jsonC = JSON.parse(masterJson[currentDataOrder]['data']['0']);

        if($(e.target).val() === jsonC['rangeList'][index]['start']['name']){
            showEachErrSpan(startInput, endInput, errSpanStart, errSpanEnd, ERR_MSG_EACH_VAL_SAME);
            isValid = false;

        } else {
            console.log($(e.target).val(), jsonC['rangeList'][index]['start']['name']);

            for(var key in jsonC['rangeList']) {
                if(!jsonC['rangeList'].hasOwnProperty(key))
                    continue;

                if(key == index)
                    continue;

                if (jsonC['rangeList'][key]['start']['name'] === startInput.val()
                    && jsonC['rangeList'][key]['end']['name'] === $(e.target).val()) {

                    showEachErrSpan(startInput, endInput, errSpanStart, errSpanEnd, ERR_MSG_DUPLICATE_VAL);
                    isValid = false;
                    console.log('こっち');
                    break;
                }
            }
        }

        if (isValid){
            $(e.target).parent().removeClass('is-invalid');
            startInput.parent().removeClass('is-invalid');
            console.log('うむ');
        }
    });
    //endregion

    for(var i=0; i<blocks.length; i++){
        // var element = blocks[i].cloneNode(true);
        //おわかりかと思うが、このロジックが正常に動作するためには、{#range-add}を先にdomに追加しないといけない
        $(blocks[i]).find('.circle,.icon_down')
            .popover(TIME_POPOVER_CONFIG)
            .hover(function (e) {
                    onHoverForPopover(e);
                })
            .on('shown.bs.popover', function (e) {
                console.log('onShown');
                // var dataOrder = $(this).parents(".card-wrapper-i").attr('data-order');
                // var jsonC = JSON.parse(masterJson[dataOrder]['data']["0"]);
                var tr = $(this).parents('tr');
                var index = tr.index();
                var colorNum = $(e.target).attr('colorNum');

                var popoverId = $(e.target).attr('aria-describedby');
                var popover = $('#'+popoverId);
                // var rgb = $(this).parents('tr').find('.circle').css('color').substring(4);
                // rgb = rgb.substring(0, rgb.length-1);
                // var colorNum = colors.indexOf(rgbToHex(rgb[0], rgb[1], rgb[2]));
                // console.log(rgbToHex(rgb[0], rgb[1], rgb[2]));
                popover.find('.fa-circle')
                    .on('click', function (e2) {
                        console.log('cicle clicked');

                        //todo ここでは、色をmasterJsonからではなく、domから取って処理に使用している。masterJsonに適宜書き込むかどうかを含めて、一旦考えてからこれからの処理をやってください。
                        // var index = $(e2.target).parents('.fa-layers').index();
                        // console.log(index);
                        // var newColor = getColor(index);
                        // $(e.target).css('background-color', newColor);
                        // var dataNum = $(e.target).parents('tr').attr('data-order');
                        // var trs = $(e.target).parents('tbody')
                        //     .find('tr[data-order="'+ dataNum +'"]');
                        // trs.find('.circle').css('background-color', newColor);
                        // trs.find('.icon_down').css('color', newColor);

                        var currentDataOrder = $(e.target).parents('tr').attr('data-order');
                        var index = $(e2.target).parents('.fa-layers').index();
                        console.log(index);
                        var newColor = getColor(index);
                        $(e.target).css('background-color', newColor);
                        var trs = $(e.target)
                            .parents('tbody')
                            .find('tr[data-order="'+ currentDataOrder +'"]');
                        trs.find('.circle').css('background-color', newColor);
                        trs.find('.icon_down').css('color', newColor);

                        $(e2.target).parents('.circle-popover').find('.fa-check:visible').hide();
                        $(e2.target).parents('.fa-layers').find('.fa-check').show();

                        var jsonC = JSON.parse(masterJson[currentDataOrder]['data']["0"]);
                        jsonC["eventList"][currentDataOrder]['colorNum'] = index.toString();
                        masterJson[currentDataOrder]['data']["0"] = JSON.stringify(jsonC);
                    });
                var className = '.circle'+ (parseInt(colorNum)+1);
                popover.find(className).parents('.fa-layers').find('.fa-check').show();
                    // .eq(jsonC["rangeList"][index]['colorNum'])
                    // .find('.fa-check').show();

                $(window).hover(function (e2) {
                    var dataOrder = $(e.target).parents(".card-wrapper-i").attr('data-order');
                    //混迷を極めるhover判定
                    if($(e2.target).parents('.popover').length || $(e2.target).hasClass('popover')) {
                        return false;
                    } else if(($(e2.target).hasClass('card') || $(e2.target).parents('tr').index() === index || $(e2.target).parents('tr').index() === index+1)
                        &&
                        ($(e2.target).parents('.card-wrapper-i[data-order='+ dataOrder +']').length || $(e2.target).attr('data-order') == dataOrder)) {
                        return false
                    }
                    console.log('hideやね', e2.target);
                    $(e.target).popover('hide');
                });

            }).on('hidden.bs.popover', function (e) {
                console.log('onHidden');
                $(window).off('mouseenter mouseleave');
            });

        $(blocks[i]).insertBefore($(doc).find('.range-add'));
    }
}


function showEachErrSpan(startInput, endInput, errSpanStart, errSpanEnd, errMsg) {
    errSpanStart.html(errMsg);
    startInput.parent().addClass('is-invalid');
    errSpanEnd.html(errMsg);
    endInput.parent().addClass('is-invalid');
}

function getRangeIndex(target) {
    var tr = target.closest('tr');
    var index = tr.index() - tr.parents('tbody').find('.eve-add').index()-1;
    return Math.floor(index/3);
}

function onHoverForPopover(e) {
    if(!$('.popover').length)
        $(e.target).popover('show');
}

function createOneEveRow(doc, value) {
    console.log(value);

    var block = $(createHtmlAs1Eve());
    var inputs = block.find(".mdl-textfield__input");
    setEveInputValues(inputs, value);

    //時刻の色を変える
    // var coloreds = block.getElementsByClassName("colored");
    // var color = getColor(value["colorNum"]);
    // console.log(coloreds.length);
    // for (var i=0; i<coloreds.length; i++){
    //     console.log(i);
    //     coloreds[i].style.color = color;
    // }
    // changeTimeColor(block, value);
    // block.getElementsByClassName("mdl-textfield__input")[0].style.color = getColor(value["colorNum"]);
    // block.getElementsByClassName("circle")[0].style.background = getColor(value["colorNum"]);
    block.find('.circle').css('background-color', getColor(value["colorNum"]))
        .popover(TIME_POPOVER_CONFIG)
        .hover(function (e) {
            onHoverForPopover(e);
        })
        .on('shown.bs.popover', function (e) {
            console.log('onShown');
            var dataOrder = $(this).parents(".card-wrapper-i").attr('data-order');
            var jsonC = JSON.parse(masterJson[dataOrder]['data']["0"]);
            var tr = $(this).parents('tr');
            var index = tr.index();

            var popoverId = $(this).attr('aria-describedby');
            var popover = $('#'+popoverId);
            popover.find('.fa-layers')
                .on('click', function (e2) {
                    console.log('cicle clicked');

                    var index = $(e2.target).parents('.fa-layers').index();
                    console.log(index);
                    $(e.target).css('background-color', getColor(index));
                    $(e2.target).parents('.circle-popover').find('.fa-check:visible').hide();
                    $(e2.target).parents('.fa-layers').find('.fa-check').show();

                    var dataOrder = $(e.target).parents(".card-wrapper-i").attr('data-order');
                    var jsonC = JSON.parse(masterJson[dataOrder]['data']["0"]);
                    var dataNum = $(e.target).parents('tr').index();
                    jsonC["eventList"][dataNum]['colorNum'] = index.toString();
                    masterJson[dataOrder]['data']["0"] = JSON.stringify(jsonC);
                })
                .eq(jsonC["eventList"][index]['colorNum'])
                .find('.fa-check').show();

            $(window).hover(function (e2) {
                var dataOrder = $(e.target).parents(".card-wrapper-i").attr('data-order');
                //混迷を極めるhover判定
                if($(e2.target).parents('.popover').length || $(e2.target).hasClass('popover')) {
                    return false;
                } else if(($(e2.target).hasClass('card') || $(e2.target).parents('tr').index() === index || $(e2.target).parents('tr').index() === index+1)
                    &&
                    ($(e2.target).parents('.card-wrapper-i[data-order='+ dataOrder +']').length || $(e2.target).attr('data-order') == dataOrder)) {
                    return false
                }
                console.log('hideやね', e2.target);
                $(e.target).popover('hide');
            });

        }).on('hidden.bs.popover', function (e) {
            console.log('onHidden');
            $(window).off('mouseenter mouseleave');
        });

    setDataOrderToEveList(block, value['cal']['hourOfDay'], value['cal']['minute']);

    setDatePickerLisntener($(block).find('.time .mdl-textfield__input'))
        .on('change', function (event, date) {
            console.log(event, date);
            var tr = $(this).parents('tr');
            var index = tr.index();
            var dataOrder = $(this).parents(".card-wrapper-i").attr('data-order');
            var jsonC = JSON.parse(masterJson[dataOrder]['data']["0"]);
            var time = moment($(event.target).val(), 'H:mm');
            jsonC["eventList"][index]["cal"]["hourOfDay"] = time.hour();
            jsonC["eventList"][index]["cal"]["minute"] = time.minute();
            masterJson[dataOrder]['data']["0"] = JSON.stringify(jsonC);

            tr.attr('data-order', time.format('Hmm'));
            console.log(masterJson);

            //todo 動かないぞタコ！
            mixitup($(doc).find('table'), {
                load: {
                    sort: 'order:asc'
                },
                animation: {
                    duration: 250,
                    nudge: true,
                    reverseOut: false,
                    effects: "fade translateZ(-100px)"
                },
                selectors: {
                    target: $(doc).find('.card_block tbody tr'),
                    control: '.mixitup-control'//@see https://goo.gl/QpW5BR
                }
            }).sort("order:asc").then(function (value2) {

            }).catch(function (reason) {
                console.log(reason);
            });
        });

    //項目削除イベント
    block.find('.remove-btn').on('click', function (ev) {
        var dataOrder = $(this).parents(".card-wrapper-i").attr('data-order');
        var jsonC = JSON.parse(masterJson[dataOrder]['data']["0"]);
        var index = $(this).parents('tr').index();
        jsonC["eventList"].splice(index, 1);
        masterJson[dataOrder]['data']["0"] = JSON.stringify(jsonC);
        console.log(masterJson);

        $(this).parents('tr').remove();//todo アニメーションできたらなあ。
    });

    //イベント名入力イベント
    var errSpan = block.find('.event_name .mdl-textfield__error');
    block.find('.input_eve').keyup(function (e) {
        //todo 不正な値であっても、masterJsonに書き込んでいることに注意してください。
        var isValid = isValidAboutNullAndDelimiter($(e.target), errSpan);

        var currentDataOrder = $(e.target).parents('.card-wrapper-i').attr('data-order');
        var index = $(e.target).parents('tr').index();
        var jsonC = JSON.parse(masterJson[currentDataOrder]['data']['0']);
        for(var key in jsonC['eventList']) {
            if(!jsonC['eventList'].hasOwnProperty(key) || key == index)
                continue;

            if (jsonC['eventList'][key]['name'] === $(e.target).val()) {
                errSpan.html(ERR_MSG_DUPLICATE_VAL);
                $(e.target).parent().addClass('is-invalid');
                console.log('こっち');
                isValid = false;
                break;
            }
        }

        if(isValid)
            $(e.target).parent().removeClass('is-invalid');

        jsonC['eventList'][index]['name'] = $(e.target).val();
        masterJson[currentDataOrder]['data']['0'] = JSON.stringify(jsonC);
    });

    block.insertBefore($(doc).find('.eve-add'));
}
//endregion

////////////////////region 新規イベントデータ作成
function createNewTimeEveData() {
    var today = moment();

    var value  = {};
    value['colorNum'] = 0;
    value['offset'] = 0;
    value['name'] = '新しいイベント';

    value['cal'] = {};
    value['cal']['year'] = today.year();
    value['cal']['month'] = today.month();
    value['cal']['dayOfMonth'] = today.date();
    value['cal']['hourOfDay'] = today.hour();
    value['cal']['minute'] = today.minute();
    value['cal']['second'] = 0;

    return value;
}

function createNewRangeData() {
    var today = moment();

    var value  = {};
    value['colorNum'] = 0;
    value['start'] = {};
    value['start']['colorNum'] = 0;
    value['start']['name'] = '開始';
    value['start']['offset'] = 0;

    value['start']['cal'] = {};
    value['start']['cal']['year'] = today.year();
    value['start']['cal']['month'] = today.month();
    value['start']['cal']['dayOfMonth'] = today.date();
    value['start']['cal']['hourOfDay'] = 0;
    value['start']['cal']['minute'] = 0;
    value['start']['cal']['second'] = 0;

    value['end'] = {};
    value['end']['colorNum'] = 0;
    value['end']['name'] = '終了';
    value['end']['offset'] = 0;

    value['end']['cal'] = {};
    value['end']['cal']['year'] = today.year();
    value['end']['cal']['month'] = today.month();
    value['end']['cal']['dayOfMonth'] = today.date();
    value['end']['cal']['hourOfDay'] = 0;
    value['end']['cal']['minute'] = 0;
    value['end']['cal']['second'] = 0;

    return value;
}
//endregion

function setDataOrderToEveList(block, hourOfDay, min) {
    //date-orderを付加
    var time = moment();
    time.hour(hourOfDay);
    time.minute(min);
    $(block).attr('data-order', time.format('Hmm'));
}

function setDataOrderToRangeList(block, rangeNum) {
    block.attr('data-order', rangeNum + 10000);
}

function setRangeDatePicker(block) {
    var input = block.find('input').eq(0);
    setDatePickerLisntener(input)
        .on('change', function (event, date) {
            var index = $(this).parents('tr').index() - $(this).parents('tr').find('.eve-add').index()-1;
            var dataOrder = $(this).closest(".card-wrapper-i").attr('data-order');
            var dataNum = Math.floor(index/3);
            console.log(dataNum, index%3);
            var startOrEnd;
            switch (index%3) {
                case 0:
                    startOrEnd = 'start';
                    break;
                case 2:
                    startOrEnd = 'end';
                    break;
                default:
                    return;
            }

            var jsonC = JSON.parse(masterJson[dataOrder]['data']["0"]);
            var time = moment($(event.target).val(), 'H:mm');
            jsonC["rangeList"][dataNum][startOrEnd]["cal"]["hourOfDay"] = time.hour();
            jsonC["rangeList"][dataNum][startOrEnd]["cal"]["minute"] = time.minute();

            var n = index%3;
            if(n === 2)
                n = 1;

            jsonC["rangeList"][dataNum][startOrEnd]["cal"]["offset"]
                = $('.dtp').eq(jsonC["eventList"].length + dataNum*2 +n)
                    .find('.date-picker-radios input:checked')
                    .parent().index() -1;
            masterJson[dataOrder]['data']["0"] = JSON.stringify(jsonC);
            console.log(masterJson);
    });

    var datePickers = $('.dtp-actual-meridien');

    // datePickerを整備
    var radios = createHtmlRadio();
    var row = datePickers.eq(datePickers.length-1);
    radios.insertBefore(row);
    row.hide();
}

function setDatePickerLisntener(ele) {
    return ele.bootstrapMaterialDatePicker({
        date: false,
        shortTime: false,
        format: 'H:mm'
    }).on('open', function (event) {
        isModalOpen = true;
    }).on('close', function (event) {
        isModalOpen = false;
    });
}
//endregion

//region /////////////////operateAs2系列//////////////
function operateAs2(doc, childSnap) {
    var pool = $('<div>', {
        class: "tag_pool"
    });

    var count = 0;

    Object.keys(childSnap["data"]).forEach(function (key) {
        var splited = childSnap["data"][key].split(delimiter);
        addTagToPool(splited, count, pool);

        // var clone = createHtmlAs2();
        //
        // setTagUi(clone, splited);
        //
        // clone.attr("index", count);
        // setElementAsMdl(clone[0]);
        //
        // clone.find(".mdl-chip").on('click', function (e) {
        //     modalDataNum = parseInt(pool.parents('.card-wrapper-i').attr("data-order"));
        //     modalTipNum = clone.attr("index");
        //     var splited = masterJson[modalDataNum]["data"][modalTipNum].split(delimiter);
        //     clickedColor = parseInt(splited[1]);
        //
        //     $('#modal_input').attr('value', splited[0]).val(splited[0]);
        //     $('.modal-circle-check').eq(parseInt(splited[1])).addClass("show");
        //
        //     if(!!splited[2])
        //         document.getElementById('checkbox-modal-label').MaterialCheckbox.check();
        //
        //     // setCircleHoverEvent(index);
        //
        //     showModal();
        // });
        //
        // clone.find('.mdl-chip__action i').on('click', function (e) {
        //     e.preventDefault();
        //     console.log('delete clicked');
        //     var pos = clone.index();
        //     var sublings = clone.siblings();
        //     console.log(sublings.length);
        //     for (var i=0; i<sublings.length; i++) {
        //         console.log('hogehoge');
        //         sublings.eq(i).attr('index', i);
        //     }
        //
        //     var dataOrder = $(this).parents(".card-wrapper-i").attr('data-order');
        //     masterJson[dataOrder]["data"].splice(pos, 1);
        //     console.log(masterJson[dataOrder]["data"]);
        //
        //     clone.remove();
        //
        //     return false;
        // });
        //
        // pool.append(clone);

        count++;
    });


    dragula([pool[0]],{
        moves: function (el, container, handle) {
            return !(handle.classList.contains('tag-add-btn') || handle.classList.contains('material-icons'))
        }
    }).on('drop', function (el) {
        if(pool.find('.tag-add-btn').index() !== pool.children().length-1){
            pool.removeAttr('id');
            mixitup(pool, {
                load: {
                    sort: 'tag-order:asc'
                },
                animation: {
                    duration: 250,
                    nudge: true,
                    reverseOut: false,
                    effects: "fade translateZ(-100px)"
                },
                selectors: {
                    target: '.tag_wrapper,.tag-add-btn',
                    control: '.mixitup-control'//@see https://goo.gl/QpW5BR
                }
            }).sort('tag-order:asc');
        }

        var currentPos = $(el).index();
        var dragedPos = $(el).attr("index");
        var dataPos = parseInt(pool.parents('.card-wrapper-i').attr("data-order"));
        masterJson[dataPos]["data"].move(dragedPos, currentPos);
        console.log(masterJson);
        // swap(masterJson[dataPos]["data"], dragedPos, currentPos);
        // console.log(masterJson);
    });

    var addTagBtn = createAddTagBtn();
    addTagBtn.on('click', function (e) {
        console.log('addBtn clicked');
        isModalForNewTag = true;
        clickedColor = 0;
        modalDataNum = parseInt(pool.parents('.card-wrapper-i').attr("data-order"));
        $('.modal-circle-check').eq(0).addClass("show");
        showModal();
        return false;
    });
    pool.append(addTagBtn);

    $(doc).append(pool);
}

function addTagToPool(splited, count, pool) {
    var clone = createHtmlAs2();

    setTagUi(clone, splited);

    clone.attr("index", count);
    setElementAsMdl(clone[0]);

    clone.find(".mdl-chip").on('click', function (e) {
        modalDataNum = parseInt(pool.parents('.card-wrapper-i').attr("data-order"));
        modalTipNum = clone.attr("index");
        var splited = masterJson[modalDataNum]["data"][modalTipNum].split(delimiter);
        clickedColor = parseInt(splited[1]);

        $('#modal_input').attr('value', splited[0]).val(splited[0]);
        $('.modal-circle-check').eq(parseInt(splited[1])).addClass("show");

        if(!!splited[2])
            document.getElementById('checkbox-modal-label').MaterialCheckbox.check();

        // setCircleHoverEvent(index);

        showModal();
    });

    clone.find('.mdl-chip__action i').on('click', function (e) {
        e.preventDefault();
        console.log('delete clicked');
        var pos = clone.index();
        var sublings = clone.siblings();
        console.log(sublings.length);
        for (var i=0; i<sublings.length; i++) {
            console.log('hogehoge');
            sublings.eq(i).attr('index', i);
        }

        var dataOrder = $(this).parents(".card-wrapper-i").attr('data-order');
        masterJson[dataOrder]["data"].splice(pos, 1);
        console.log(masterJson[dataOrder]["data"]);

        clone.remove();

        return false;
    });

    var addBtn = pool.find('.tag-add-btn');
    if(addBtn.length)
        clone.insertBefore(addBtn);
    else
        clone.appendTo(pool);
}
//endregion

//region ///////////////operateAs3系列//////////////
function operateAs3(doc, childSnap, dataNum) {
    var ul = $('<ul>', {
        class: "demo-list-item mdl-list"
    });

    // var liNum = 0;
    var values = Object.values(childSnap["data"]);
    console.log(childSnap["data"]);

    for (var i=0; i<values.length; i++){
        var splited = values[i].split(delimiter);
        ul.append(createParamsLi(splited, dataNum, i));
    }

    var addLiBtn = createAddLiBtn();
    addLiBtn.find('button')
        .popover({
            trigger: 'manual',
            placement: 'bottom',
            content:'<div class="param-add-popover">'+
                        '<button type="button" class="btn btn-secondary add-checkbox">チェックボックス</button>'+
                        '<button type="button" class="btn btn-secondary add-slider">スライダー</button>'+
                    '</div>',
            html: true,
            container: 'body'
        })
        .hover(function (e) {
            onHoverForPopover(e);
        })
        .on('shown.bs.popover', function (e) {
            console.log(e);
            var popoverId = $(this).attr('aria-describedby');
            var poppover = $('#'+popoverId);
            poppover.find('.add-slider')
                .on('click', function (e2) {
                    var splited = ['1', '', '3', '5'];
                    onClickAddParamsLiBtn(splited, e, e2);
                });
            poppover.find('.add-checkbox')
                .on('click', function (e2) {
                    var splited = ['0', '', 'true'];
                    onClickAddParamsLiBtn(splited, e, e2);
                });
            // var popoverId = $(this).attr('aria-describedby');
            $(window).hover(function (e2) {
                if($(e2.target).parents('.popover').length || $(e2.target).hasClass('popover')){
                    return false;
                } else if($(e2.target).parents('.add-li-btn').length || $(e2.target).hasClass('add-li-btn')) {
                    return false
                }
                console.log('hideやね', e2.target);
                $(e.target).popover('hide');
            });
        })
        .on('hidden.bs.popover', function (e) {
            console.log(e);
            $(window).off('mouseenter mouseleave');
        });

    // $(doc).addClass('align-center');
    $(doc).append(ul);
    $(doc).append(addLiBtn);

    setElementAsMdl(doc);

    var oldPos;
    dragula([ul[0]], {
        moves: function (el, container, handle) {
            return handle.classList.contains('drag_btn_i');
        }
    }).on('drop', function (el) {
        var currentPos = $(el).index();
        masterJson[dataNum]["data"].move(oldPos, currentPos);
        console.log(masterJson);
    }).on('drag', function (el) {
        oldPos = $(el).index();
    });
}

function onClickAddParamsLiBtn(splited, e, e2) {
    var currentDataOrder = $(e.target).parents('.card-wrapper-i').attr('data-order');
    masterJson[currentDataOrder]['data'].push(splited.join(delimiter));
    var ul = $(e.target).parents('.card').find('.mdl-list');
    createParamsLi(splited, currentDataOrder, ul.length)
        .appendTo(ul);
    setElementAsMdl(ul[0]);
    $(e.target).popover('hide');
}

function createParamsLi(splited, dataOrder, i) {
    // var splited = values[i].split(delimiter);
    console.log(splited);
    var witch = splited[0];
    // var clone = document.getElementById("params_dummy").children[0].cloneNode(true);
    var clone = createHtmlAs3(dataOrder + "_" + i);
    var paramsTitle = clone.find(".params_title");
    paramsTitle.attr("value", splited[1]);
    var errSpan = clone.find(".mdl-textfield__error");

    paramsTitle.keyup(function (e) {
        var index = $(this).closest("li").index();
        var currentDataOrder = $(this).parents('.card-wrapper-i').attr('data-order');
        var isValid = isValidAboutNullAndDelimiter($(this), errSpan);
        if(isValid){
            $(e.target).parent().removeClass('is-invalid');
        }
        masterJson[currentDataOrder]["data"][index] = $(this).val();//todo masterJsonに書き込んでいることに注意してください
    });

    clone.find('.li-rm-btn').on('click', function (e) {
        e.preventDefault();
        console.log('clicked');
        var li = $(this).parents('li').eq(0);
        var index = li.index();
        var currentDataOrder = $(this).parents('.card-wrapper-i').attr('data-order');
        masterJson[currentDataOrder]["data"].splice(index, 1);
        li.remove();//todo アニメーションつけようと思ったけどうまくいかない。
        console.log(masterJson);
        return false;
    });

    switch(witch){
        case "0":
            clone.find(".params_slider").hide();
            // clone.getElementsByClassName("params_slider")[0].style.display = "none";
            clone.find(".max_btn").parent().hide();
            var checkBox = clone.find(".mdl-checkbox__input");

            if(splited[2] === "true"){
                checkBox.attr("checked", "");
            }

            //checkBox event
            checkBox.change(function () {
                var index = $(this).parents("li").index();
                var currentDataOrder = $(this).parents('.card-wrapper-i').attr('data-order');
                var values = masterJson[currentDataOrder]["data"][index].split(delimiter);
                values[2] = $(this).is(':checked').toString();
                masterJson[currentDataOrder]["data"][index] = values.join(delimiter);
                console.log(masterJson[currentDataOrder]["data"][index]);
            });
            break;

        case "1":
            clone.addClass('slider');
            clone.find(".params_check").hide();
            // clone.getElementsByClassName("params_check")[0].style.display = "none";
            var slider = clone.find(".mdl-slider");
            // var slider = clone.getElementsByClassName("mdl-slider")[0];
            slider.prop("value", splited[2])
                .prop("max", splited[3])
                .on('input', function (e) {
                    e.preventDefault();
                    $(e.target).popover('hide');
                    return false;
                }).hover(function (e) {
                    onHoverForPopover(e);
                }).change(function (e) {
                    e.preventDefault();
                    var currentDataOrder = $(this).parents('.card-wrapper-i').attr('data-order');
                    var index = $(this).closest("li").index();
                    var values = masterJson[currentDataOrder]["data"][index].split(delimiter);
                    values[2] = $(this).val();
                    masterJson[currentDataOrder]["data"][index] = values.join(delimiter);
                    console.log(masterJson[currentDataOrder]["data"][index]);
                    return false;
                })
                .on('click', function (e) {
                    var popoverId = $(this).attr('aria-describedby');
                    var popover = $('#'+popoverId);
                    if(!popover.length || !popover.hasClass('show')) {
                        console.log(popover.length, !popover.hasClass('show'), popoverId);
                        $(e.target).popover('show');
                    }
                })
                .popover({
                    trigger: 'manual',
                    placement: 'right',
                    content: '<div class="select">'+
                    '<p>最大値を変更&nbsp;&nbsp;&nbsp;'+
                        '<select name="blood">' +
                            '<option value="3">3</option>' +
                            '<option value="4">4</option>' +
                            '<option value="5">5</option>' +
                            '<option value="6">6</option>' +
                            '<option value="7">7</option>' +
                            '<option value="8">8</option>' +
                            '<option value="9">9</option>' +
                            '<option value="10">10</option>' +
                        '</select>' +
                        '</p>'+
                    '<div/>',
                    html: true,
                    container: 'body'
                }).on('shown.bs.popover', function (e) {
                    console.log('shown.bs.popover', $(e.target).attr('max'));
                    var popoverId = $(this).attr('aria-describedby');
                    var popover = $('#'+popoverId);
                    popover.addClass('tooltip-slider')
                        .find('select')
                        .val($(e.target).attr('max'))
                        .change(function (e2) {
                            e2.preventDefault();
                            var newMax = $(this).val();
                            console.log('changed', $(this).val());
                            $(e.target).popover('hide');

                            //masterJson反映
                            var dataNum = $(e.target).parents('li').index();
                            var dataOrder = $(e.target).parents('.card-wrapper-i').attr('data-order');
                            var splited = masterJson[dataOrder]['data'][dataNum].split(delimiter);
                            splited[3] = newMax;
                            if (parseInt(splited[2]) > newMax) {
                                splited[2] = newMax;
                                $(e.target).val(newMax);
                            }
                            $(e.target).attr('max', newMax);

                            masterJson[dataOrder]['data'][dataNum] = splited.join(delimiter);
                            console.log(masterJson[dataOrder]['data']);
                            return false;
                        });
                $(window).hover(function (e2) {
                    if($(e2.target).parents('.popover').length || $(e2.target).hasClass('popover')){
                        return false;
                    } else if($(e2.target).parents('.mdl-list__item').length || $(e2.target).hasClass('mdl-list__item')) {
                        return false
                    }
                    console.log('hideやね', e2);
                    $(e.target).popover('hide');
                });

            }).on('hidden.bs.popover', function (e) {
                var popoverId = $(this).prop('aria-describedby');
                $('#'+popoverId).removeClass('tooltip-slider');
                console.log('hover off');

                $(window).off('mouseenter mouseleave');
            });
            break;
    }

    return clone;
}
//endregion

//todo ここって'comment'じゃなかったっけ？？
function operateAs4(doc, childSnap) {
    var clone = createHtmlAs4();
    // var clone = document.getElementById("comment_dummy").cloneNode(true);
    var summery = getCommentAsNullable(childSnap);
    if(summery){
        clone.find(".mdl-textfield__input").attr("value", summery);
    }

    setElementAsMdl(clone[0]);
    $(doc).append(clone);
}
//endregion

function setTagUi(clone, splited) {
    $(clone).find(".mdl-chip__text").html(splited[0]);

    if (splited[2] === "false") {
        $(clone).find(".fa-check").hide();
    }
    // var chipsBtn = $(clone).find(".chips_btn");
    // if(splited[2] === "false"){
    //     chipsBtn.eq(0).css("display", "none");
    //     chipsBtn.eq(1).css("display", "inline");
    // } else if (splited[2] === "true"){
    //     chipsBtn.eq(1).css("display", "none");
    //     chipsBtn.eq(0).css("display", "inline");
    // } else {
    //     console.log(splited);
    // }
    $(clone).find(".mdl-chip").css("background-color", getHighLightedColor(parseInt(splited[1])));
}

function setOnBtmFabClickListener() {
    $('.sub-button').on('click', function (e) {

        var dataType = 0;
        if ($(this).hasClass('br')) {
            //タイムイベント
            for(var val in masterJson){
                if(masterJson.hasOwnProperty(val) && masterJson[val]['dataType'] === 1) {
                    //todo エラー処理
                    console.log('エラーだよね');
                    return;
                }
            }

            dataType = 1;

        } else if ($(this).hasClass('bl')) {
            //リスト
            dataType = 3;
        } else if ($(this).hasClass('tr')) {
            //コメント
            dataType = 4;
        } else if ($(this).hasClass('tl')) {
            //タグ
           dataType = 2;
        }

        var data = createNewData(dataType);
        var i = masterJson.length;
        console.log(data);
        masterJson.push(data);
        var cardWrapper = createElementWithHeader(i, dataType);
        var doc = cardWrapper.children[1];

        switch (dataType){
            case 1:
                operateAs1(doc, data);
                break;
            case 2:
                operateAs2(doc, data);
                break;
            case 3:
                operateAs3(doc, data);
                break;
            case 4:
                operateAs4(doc, data);
                break;
        }

        setHeaderTitle(doc, masterJson[i]);
        $('.card_wrapper').append($(cardWrapper));

        initAllTooltips();
        $('.ele_header_button').off('click');
        setOnClickCardHeaderBtn();
    });
}
function setOnSaveFabClickListener() {
    $('#save').show()
        .on('click', function (e) {
            e.preventDefault();
            console.log('clicked');

            if(!masterJson || !$.isArray(masterJson)){
                showNotification(ERR_MSG_OPE_FAILED, 'danger');
                return;
            }

            if(!masterJson.length) {
                showNotification(ERR_MSG_NO_CONTENTS, 'warning');
                return;
            }

            masterJson.unshift(createNewData(0));

            defaultDatabase.ref('userDataSample/'+ loginedUser.uid + '/template').set(masterJson).then(function () {
                showNotification(SUCCESS_MSG_SAVE, 'success');
                masterJson.splice(0, 1);

            }).catch(function (reason) {
                console.log(reason);
                masterJson.splice(0, 1);
                onSaveErr();
            });
            return false;
        });
}

//todo ここ後々どうするか決めよう
function onSaveErr() {
    var connectedRef = firebase.database().ref(".info/connected");
    connectedRef.on("value", function(snap) {
        if (snap.val() === false) {
            showNotification(ERR_MSG_NO_INTERNET, 'danger');
        } else {
            showNotification(ERR_MSG_OPE_FAILED, 'danger');
        }
    });
}

function createNewData(dataType) {
    var data = {
        dataType: dataType,
        day: 0,
        mon: 0,
        year: 0
    };

    if (dataType === 2 || dataType === 3 || dataType === 4) {
       data.dataName = '';
    }

    if (dataType === 2 || dataType === 3){
        data.data = [];
    } else if (dataType === 1) {
        var jsonStr = {
            eventList: [],
            rangeList: []
        };
        data.data = {};
        data['data']['0'] = JSON.stringify(jsonStr);
    } else if (dataType === 0) {
        data.data = {};
        data['data']['0'] = "勤務日"+ delimiter +"2";
    }

    return data;
}

function initModal() {
    var modal = $('#exampleModal');
    var input = $('#modal_input');
    var errorSpan = $('.mdl-textfield__error');

    /* blur on modal open, unblur on close */
    modal.on('show.bs.modal', function () {
        $('.container').addClass('blur');
        if(input.attr("value")){
            console.log("てってれー");
            input.parent().addClass('is-dirty');
        }
    });

    modal.on('hide.bs.modal', function () {
        if(isModalForNewTag){
            isModalForNewTag = false;
        } else {
            var splited = masterJson[modalDataNum]["data"][modalTipNum].split(delimiter);
            var tip = $('.card').eq(modalDataNum).find(".tag_wrapper").eq(modalTipNum);
            setTagUi(tip, splited);
        }
    });

    modal.on('hidden.bs.modal', function () {
        $('.container').removeClass('blur');
        $('.modal-circle-check.show').removeClass("show");
        input.removeAttr("value");
        input.val('');
        document.getElementById('checkbox-modal-label').MaterialCheckbox.uncheck();
        input.parent().removeClass('is-dirty');
        input.parent().removeClass('is-invalid');
    });

    $('.modal-footer-btn').eq(1).click(function (ev) {
        var title = input.val();

        if (!isValidAboutNullAndDelimiter(input, errorSpan))
            return;

        var arr = masterJson[modalDataNum]["data"];
        var val = Object.values(arr);
        console.log(modalTipNum);
        for(var i=0; i<val.length; i++){
            if(!isModalForNewTag && i.toString() === modalTipNum)
                continue;

            if(title === val[i].split(delimiter)[0]){
                errorSpan.html("タグ名が重複しています");
                input.parent().addClass('is-invalid');
                return;
            }
        }

        input.parent().removeClass('is-invalid');

        if (isModalForNewTag) {
            // console.log('てってれー', modalDataNum, clickedColor);
            var check = $('#checkbox-modal-label').hasClass('is-checked');
            var length = masterJson[modalDataNum]["data"].length;
            var splited = [title, clickedColor, check];
            masterJson[modalDataNum]["data"].push(splited.join(delimiter));
            console.log(masterJson[modalDataNum]["data"]);
            var pool = $('.card-wrapper-i[data-order='+modalDataNum+']').find('.tag_pool');
            addTagToPool(splited, length, pool);

        } else {
            var show = $('#checkbox-modal-label').hasClass('is-checked');
            masterJson[modalDataNum]["data"][modalTipNum] = title + delimiter + clickedColor + delimiter + show;
        }

        console.log(masterJson);
        modal.modal('hide');
    });

    $(".modal-circle-i").click(function () {
        console.log("てってれー");
        $(".modal-circle-check.show").removeClass("show");
        $(this).next().addClass("show");
        clickedColor = $(this).parent().index();
    });

    // input.keyup(function () {
    //     var val = $(this).val();
    //     console.log(val);
    //     var arr = masterJson[modalDataNum]["data"];
    //     var keys = Object.keys(arr);
    //
    //     for(var i=0; i<keys.length; i++){
    //         if(parseInt(keys[i]) === modalTipNum)
    //             continue;
    //
    //         if(!val){
    //             errorSpan.html("タグ名を入力してください");
    //             input.parent().addClass('is-invalid');
    //             return;
    //         }
    //
    //         if(val === arr[keys[i]].split(delimiter)[0]){
    //             errorSpan.html("タグ名が重複しています");
    //             input.parent().addClass('is-invalid');
    //             return;
    //         }
    //     }
    //
    //     input.parent().removeClass('is-invalid');
    // });

    // $('.modal-footer-btn').eq(1).on('click', function(){
    //
    //
    //     masterJson[modalDataNum]["data"][modalTipNum]
    // });
}

function isValidAboutNullAndDelimiter(input, errSpan) {
    if (!input.val()){
        errSpan.html(ERR_MSG_NULL_VAL);
        input.parent().addClass('is-invalid');
        return false;
    }
    if (input.val().indexOf(delimiter) !== -1){
        errSpan.html(ERR_MSG_CONTAIN_BAD_CHAR.join(delimiter));
        input.parent().addClass('is-invalid');
        return false;
    }
    return true;
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

function showNotification(msg, type) {
    var icon = null;
    switch (type){
        case 'danger':
        case 'warning':
            icon = '<i class="fas fa-info-circle fa-lg"></i>';
            break;
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
    }

    $.notify({
        title: icon,
        message: '  ' + msg
    },{
        type: type
    });
}

//region *****************html生成系**************

function createElementWithHeader(dataNum, dataType) {
    var doc = $('<div>', {
        class: "card mix"
        // "data-order": dataNum.toString()
    });
    var id = "card_title_" + dataNum;
    var pre = '<span class="ele_header">' +
                    '<i class="fas fa-bars drag_bars"></i>';
    var input =     '<span class="mdl-textfield mdl-js-textfield mdl-pre-upgrade card_title">' +
                        '<input class="mdl-textfield__input input_eve mdl-pre-upgrade card_title_input" type="text" id="'+ id +'">' +
                        '<label class="mdl-textfield__label mdl-pre-upgrade" for="'+ id +'"></label>' +
                        '<span class="mdl-textfield__error"></span>' +
                    '</span>';
    var span =     '<span class="mdl-textfield mdl-js-textfield mdl-pre-upgrade card_title_input event_title"></span>';
    var post =     '<button class="mdl-button mdl-js-button mdl-button--icon remove_btn ele_header_button mdl-pre-upgrade">' +
                        '<i class="fas fa-times mdl-pre-upgrade"></i>' +
                    '</button>' +
                    '<button class="mdl-button mdl-js-button mdl-button--icon arrow_down ele_header_button mdl-pre-upgrade">' +
                        '<i class="fas fa-angle-down"></i>' +
                    '</button>' +
                    '<button class="mdl-button mdl-js-button mdl-button--icon arrow_up ele_header_button mdl-pre-upgrade">' +
                        '<i class="fas fa-angle-up"></i>' +
                    '</button>' +
                '</span>';

    if(dataType === 1){
        doc.html(pre + span + post);
    } else {
        doc.html(pre + input + post);
    }

    var wrapper = $('<div>', {
        class: 'card-wrapper-i',
        "data-order": dataNum.toString()
    });

    var circleNum = $(
        '<div class="maru size_normal pink1">'+
            '<div class="letter3">'+(dataNum+1)+'</div>'+
        '</div>'
    );
    wrapper.append(circleNum);
    wrapper.append(doc);

    setElementAsMdl(wrapper[0]);
    return wrapper[0];
}

function createHtmlAs1Eve() {
    var random = Math.random().toString(36).slice(-8);
    return $(
        '<tr>'+
            '<td class="circle_wrapper">' +
                '<div class="circle"></div>' +
            '</td>' +

            '<td>' +
                '<form action="#" class="time colored">' +
                    '<div class="mdl-textfield mdl-js-textfield mdl-pre-upgrade">' +
                        '<input class="mdl-textfield__input time_input mdl-pre-upgrade" type="text"' +
                        // '<label class="mdl-textfield__label mdl-pre-upgrade" for="sample"></label>' +
                    '</div>' +
                '</form>' +
            '</td>' +
        //
        // '<td>' +
        //
        //     '<p class="colon colored">:</p>' +
        // '</td>' +
        //
        // '<td>' +
        //     '<form action="#" class="min colored">' +
        //         '<div class="mdl-textfield mdl-js-textfield mdl-pre-upgrade">' +
        //             '<input class="mdl-textfield__input time_input mdl-pre-upgrade" type="text" pattern="[0-5]{1}[0-9]{1}" id="sample2">' +
        //             '<label class="mdl-textfield__label mdl-pre-upgrade" for="sample2">' +'</label>' +
        //             '<span class="mdl-textfield__error mdl-pre-upgrade">Error</span>' +
        //         '</div>' +
        //     '</form>' +
        // '</td>' +

            '<td>' +
                '<form action="#" class="event_name">' +
                    '<div class="mdl-textfield mdl-js-textfield mdl-pre-upgrade">' +
                        '<input class="mdl-textfield__input input_eve mdl-pre-upgrade" type="text" id="'+ random +'">' +
                        '<label class="mdl-textfield__label mdl-pre-upgrade" for="'+ random +'"></label>'+
                        '<span class="mdl-textfield__error mdl-pre-upgrade"></span>' +
                    '</div>' +
                '</form>' +
            '</td>'+

            '<td>'+
                '<button class="mdl-button mdl-js-button mdl-button--icon mdl-pre-upgrade remove-btn">' +
                    '<i class="fas fa-times"></i>' +
                '</button>' +
            '</td>'+
        '</tr>'
    )[0];
}

function createHtmlRadio() {
    return $(
        '<form class="date-picker-radios">'+
            '<tr>'+
                '<td>'+
                    '<label class="mdl-radio mdl-js-radio mdl-js-ripple-effect mdl-pre-upgrade" for="option-1">'+
                        '<input type="radio" id="option-1" class="mdl-radio__button mdl-pre-upgrade" name="options" value="1" checked="checked">'+
                        '<span class="mdl-radio__label mdl-pre-upgrade">前日</span>'+
                    '</label>'+
                '</td>'+
                '<td>'+
                    '<label class="mdl-radio mdl-js-radio mdl-js-ripple-effect mdl-pre-upgrade" for="option-2">'+
                        '<input type="radio" id="option-2" class="mdl-radio__button mdl-pre-upgrade" name="options" value="1">'+
                        '<span class="mdl-radio__label mdl-pre-upgrade">当日</span>'+
                    '</label>'+
                '</td>'+
                '<td>'+
                    '<label class="mdl-radio mdl-js-radio mdl-js-ripple-effect mdl-pre-upgrade" for="option-3">'+
                        '<input type="radio" id="option-3" class="mdl-radio__button mdl-pre-upgrade" name="options" value="1">'+
                        '<span class="mdl-radio__label mdl-pre-upgrade">翌日</span>'+
                    '</label>'+
                '</td>'+
            '</tr>'+
        '</form>'
    );
}

function createAssEveRow(customClass, dataOrder) {
    var title = null;
    switch (customClass){
        case 'eve-add':
            title = '項目を追加（時刻）';
            break;
        case 'range-add':
            title = '項目を追加（範囲）';
            break;
    }
    return $(
        '<tr class="add-eve-row '+ customClass +'" data-order="'+ dataOrder +'">'+
            '<td colspan="4">'+
                '<button class="mdl-button mdl-js-button mdl-button--icon mdl-pre-upgrade" data-toggle="tooltip" data-placement="top" title="'+title+'">' +
                    '<i class="material-icons">add_circle</i>' +
                '</button>'+
            '</tr>'+
        '</td>');
}

function craeteHtmlAs1Row() {
    return $(
        '<tr>' +
            '<td colspan="3">' +
                '<i class="fas fa-angle-double-down icon_down"></i>' +
            '</td>' +
            '<td colspan="1">' +
                '<button class="mdl-button mdl-js-button mdl-button--icon mdl-pre-upgrade remove-btn">' +
                    '<i class="fas fa-times"></i>' +
                '</button>' +
            '</td>' +
        '</tr>')[0];
}

function showModal() {
    var modal = $('#exampleModal').modal();
}

function createHtmlAs2() {
    return $(
    '<div class="tag_wrapper" data-tag-order="0">'+
        '<span class="mdl-chip mdl-chip--deletable">' +
            '<span class="mdl-chip__text"></span>' +
            '<i class="fas fa-check fa-2x mdl-chip__action"></i>' +
            '<button type="button" class="mdl-chip__action"><i class="material-icons">cancel</i></button>' +
        '</span>'+
    '</div>');
    // var clone = $("div", {class: "tag_wrapper"});
    // clone.innerHTML =
    //     '<a href="#">'+
    //         '<span class="mdl-chip mdl-chip--contact mdl-pre-upgrade">' +
    //             '<span class="mdl-chip__contact custom_tips_btn mdl-pre-upgrade" id="tooltip_delete">' +
    //                 '<span class="fa-stack">' +
    //                     '<i class="fas fa-circle fa-stack-1x chips_btn_circle"></i>' +
    //                     '<i class="fas fa-check-circle fa-stack-1x chips_btn"></i>' +
    //                     '<i class="fas fa-eye-slash fa-stack-1x chips_btn"></i>' +
    //                 '</span>' +
    //             '</span>' +
    //             '<span class="mdl-chip__text mdl-pre-upgrade"></span>' +
    //             // '<a href="#" class="mdl-chip__action mdl-pre-upgrade"><i class="material-icons">cancel</i></a>' +
    //             // '<a href="#" class="mdl-chip__action mdl-pre-upgrade a_remove_btn"><i class="fas fa-times remove_btn"></i></a>'+
    //         '</span>' +
    //     '</a>';
        // '<div class="mdl-tooltip" for="tooltip_delete"></div>';
}

function createAddTagBtn() {
    return $('<button class="mdl-button mdl-js-button mdl-button--icon tag-add-btn mdl-pre-upgrade" data-tag-order="1000">' +
        '<i class="material-icons">add_circle</i>' +
    '</button>');
}

function createAddLiBtn() {
    return $(
        '<div class="add-li-btn">'+
            '<button class="mdl-button mdl-js-button mdl-button--icon add-li-btn mdl-pre-upgrade" data-toggle="popover">' +
                '<i class="material-icons">add_circle</i>' +
            '</button>'+
        '</div>'
    );
}

function createHtmlAs3(id) {
    var checkId = "checkId" + id;
    var inputId = "inputId" + id;
    return $(
        // '<ul class="demo-list-item mdl-list mdl-pre-upgrade">'+
            '<li class="mdl-list__item mdl-pre-upgrade">'+
                '<i class="fas fa-bars drag_btn_i"></i>'+

                '<span class="mdl-list__item-primary-content mdl-pre-upgrade">'+
                    '<form action="#">' +
                        '<div class="mdl-textfield mdl-js-textfield mdl-pre-upgrade params_title_w">'+
                            '<input class="mdl-textfield__input input_eve mdl-pre-upgrade params_title" type="text" id="'+inputId+'">' +
                            '<label class="mdl-textfield__label" for="'+inputId+'"></label>' +
                            '<span class="mdl-textfield__error">'+ ERR_MSG_NULL_VAL +'</span>'+
                        '</div>' +
                    '</form>' +
                '</span>'+

                '<span class="mdl-list__item-secondary-action params_check">'+
                    '<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-pre-upgrade" for="' + checkId +'">'+
                        '<input type="checkbox" id="' + checkId + '" class="mdl-checkbox__input mdl-pre-upgrade" />'+
                    '</label>'+
                '</span>'+

                '<p class="slider_wrapper params_slider">'+
                    '<input class="mdl-slider mdl-js-slider mdl-pre-upgrade" type="range" min="0" max="5" value="3" step="1" data-toggle="popover">'+
                '</p>'+

                '<button class="mdl-button mdl-js-button mdl-button--icon li-rm-btn mdl-pre-upgrade">' +
                    '<i class="fas fa-times"></i>' +
                '</button>'+
            '</li>'
        // '</ul>'
    );
}

function createHtmlAs4() {
    return $(
        '<div>'+
            '<div id="comment_dummy">'+
                '<form action="#" class="comment_form">' +
                    '<div class="mdl-textfield mdl-js-textfield comment mdl-pre-upgrade">' +
                        '<textarea class="mdl-textfield__input comment_ta mdl-pre-upgrade" type="text" rows= "3" id="comment" ></textarea>' +
                        '<label class="mdl-textfield__label mdl-pre-upgrade" for="comment">Text...</label>' +
                    '</div>' +
                '</form>' +
            '</div>'+
        '</div>');
}
//endregion