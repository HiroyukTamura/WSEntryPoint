"use strict";

const SUCCESS_MSG_SAVE = '保存しました';

var masterJson;
var modalDataNum;
var modalTipNum;
var clickedColor;
var loginedUser;
var isModalOpen = false;
var isModalForNewTag = false;
var defaultDatabase;
const saveBtn = $('#save');
const progress = $('#progress');
const postLoad = $('#post_load');
const fabWrapper = $('#fab-wrapper');

window.onload = function (ev) {
    var defaultApp = firebase.initializeApp(CONFIG);
    defaultDatabase = defaultApp.database();

    firebase.auth().onAuthStateChanged(function(userObject) {
        if (userObject) {
            console.log("ユーザログインしてます");
            progress.hide();
            $('#login_w').hide();
            loginedUser = userObject;
            onLoginSuccess();
        } else {
            firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                .then(function() {
                    var uiConfig = createFbUiConfig(function (userObject, credential, redirectUrl) {
                        loginedUser = userObject;
                        $('#login_w').hide();
                        return false;
                    });

                    var ui = new firebaseui.auth.AuthUI(firebase.auth());
                    $('#login_w').show();
                    postLoad.hide();
                    ui.start('#firebaseui-auth-container', uiConfig);

                }).catch(function(error) {
                    console.log(error.code, error.message);
                    onErrConnectFb();
                });
        }
    });

    initDrawerDecoration();
};

function onErrConnectFb() {
    showNotification(ERR_MSG_OPE_FAILED, 'danger', -1);

    initAllTooltips();
    $('#fab-wrapper').hide();
    saveBtn.hide();
}


function onLoginSuccess() {
    setDrawerProfile(loginedUser);

    defaultDatabase.ref(makeRefScheme(['userData', loginedUser.uid, 'template'])).once('value').then(function(snapshot) {

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
            onErrConnectFb();
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
                    operateAs3(doc, childSnap, i);
                    break;
                case 4:
                    operateAs4(doc, childSnap, masterJson);
                    break;
            }

            setHeaderTitle(doc, childSnap);//todo これcreateElementWithHeaderと一緒にできるでしょ
            $('.card_wrapper').append($(cardWrapper));
        }

        setOnClickCardHeaderBtn();

        initCardDragging();
        initModal();
        setElementAsMdl($('body'));
        initAllTooltips();
        setOnBtmFabClickListener();
        setOnSaveFabClickListener();
        setOnScrollListener();

        progress.hide();
        postLoad.show();
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

/**
 * コメントノードは、存在が保障されていません
 */
function getCommentAsNonNull(childSnap) {
    if (!childSnap.hasChild("data")){
        return "";
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
                    errSpan.parent().addClass('is-invalid').addClass('wrong-val');
                    isValid = false;
                    console.log('こっち');
                    break;
                }
                console.log(masterJson[i]['dataName'], titleInput.val());
            }

            if(isValid){
                titleInput.parent().removeClass('is-invalid').removeClass('wrong-val');
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

    addRowBtn.find('button').on('click', function (e) {
        onClickAddRowBtn($(e.target), masterJson, $(doc));
    });

    $(doc).find('tbody').append(addRowBtn);

    if(json["eventList"]){
        json["eventList"].forEach(function (value) {
            createOneEveRow(doc, value, masterJson, saveBtn);
        });
    }

    var count = 1;//#eve-add のdata-orderは10000なので、eveListのdata-orderは10001スタートにしたい
    var addRangeBtn = createAssEveRow('range-add', 1000000);

    addRangeBtn.find('button').on('click', function (e) {
        console.log('addRangeBtn clicked');
        var newRangeData = createNewRangeData();
        // json["rangeList"].push(newRangeData);

        var dataOrder = $(this).parents(".card-wrapper-i").attr('data-order');
        var jsonC = JSON.parse(masterJson[dataOrder]['data']["0"]);
        jsonC['rangeList'].push(newRangeData);
        masterJson[dataOrder]['data']["0"] = JSON.stringify(jsonC);

        createOneRangeRow(doc, count, newRangeData, masterJson);
        setElementAsMdl(doc);
        console.log(JSON.parse(masterJson[dataOrder]['data']["0"]));

        count++;
    });

    $(doc).find('tbody').append(addRangeBtn);

    if(json["rangeList"]){
        json["rangeList"].forEach(function (value) {
            // var clone = document.getElementById("dummy").getElementsByClassName("card-block")[0].cloneNode(true);
            console.log(value);
            createOneRangeRow(doc, count, value, masterJson);
            count++;
        });
    }
}

//region /////////////////operateAs2系列//////////////
function operateAs2(doc, childSnap) {
    var pool = $('<div>', {
        class: "tag_pool"
    });

    var count = 0;

    Object.keys(childSnap["data"]).forEach(function (key) {
        var splited = childSnap["data"][key].split(DELIMITER);
        addTagToPool(splited, count, pool);
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

    clone.find(".mdl-chip").on('click', function (e) {
        modalDataNum = parseInt(pool.parents('.card-wrapper-i').attr("data-order"));
        modalTipNum = clone.attr("index");
        var splited = masterJson[modalDataNum]["data"][modalTipNum].split(DELIMITER);
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
        var splited = values[i].split(DELIMITER);
        ul.append(createParamsLi(splited, dataNum, i));
    }

    // $(doc).addClass('align-center');
    $(doc).append(ul);
    $(doc).append(initAddLiBtn());

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
        onKeyUpParamsTitle(masterJson, $(e.target), errSpan);
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
                var values = masterJson[currentDataOrder]["data"][index].split(DELIMITER);
                values[2] = $(this).is(':checked').toString();
                masterJson[currentDataOrder]["data"][index] = values.join(DELIMITER);
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
                    var values = masterJson[currentDataOrder]["data"][index].split(DELIMITER);
                    values[2] = $(this).val();
                    masterJson[currentDataOrder]["data"][index] = values.join(DELIMITER);
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
                            var splited = masterJson[dataOrder]['data'][dataNum].split(DELIMITER);
                            splited[3] = newMax;
                            if (parseInt(splited[2]) > newMax) {
                                splited[2] = newMax;
                                $(e.target).val(newMax);
                            }
                            $(e.target).attr('max', newMax);

                            masterJson[dataOrder]['data'][dataNum] = splited.join(DELIMITER);
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

function createHtmlAs3(id) {
    var checkId = "checkId" + id;
    var inputId = "inputId" + id;
    return $(
        '<li class="mdl-list__item mdl-pre-upgrade">'+

            '<i class="fas fa-bars drag_btn_i"></i>'+

            '<span class="mdl-list__item-primary-content mdl-pre-upgrade">'+
                '<form action="#">' +
                    '<div class="mdl-textfield mdl-js-textfield mdl-pre-upgrade params_title_w">'+
                        '<input class="mdl-textfield__input input_eve mdl-pre-upgrade params_title" type="text" id="'+inputId+'">' +
                        '<label class="mdl-textfield__label mdl-pre-upgrade" for="'+inputId+'"></label>' +
                        '<span class="mdl-textfield__error mdl-pre-upgrade">'+ ERR_MSG_NULL_VAL +'</span>'+
                    '</div>' +
                '</form>' +
            '</span>'+

            '<span class="mdl-list__item-secondary-action params_check mdl-pre-upgrade">'+
                '<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-pre-upgrade" for="' + checkId +'">'+
                    '<input type="checkbox" id="' + checkId + '" class="mdl-checkbox__input mdl-pre-upgrade" />'+
                '</label>'+
            '</span>'+

            '<p class="slider_wrapper params_slider">'+
                '<input class="mdl-slider mdl-js-slider mdl-pre-upgrade" type="range" min="0" max="5" value="3" step="1" data-toggle="popover">'+
            '</p>'+

            '<button class="mdl-button mdl-js-button mdl-button--icon li-rm-btn mdl-pre-upgrade" data-toggle="tooltip" data-placement="top" title="項目を削除">' +
                '<i class="fas fa-times"></i>' +
            '</button>'+
        '</li>'
    );
}

//endregion


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
                operateAs4(doc, data, masterJson);
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
            var splited = masterJson[modalDataNum]["data"][modalTipNum].split(DELIMITER);
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
        input.parent().removeClass('is-dirty')
            .removeClass('is-invalid')
            .removeClass('wrong-val');
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

            if(title === val[i].split(DELIMITER)[0]){
                errorSpan.html(ERR_MSG_DUPLICATE_VAL);
                input.parent().addClass('is-invalid').addClass('wrong-val');
                return;
            }
        }

        input.parent().removeClass('is-invalid').removeClass('wrong-val');

        if (isModalForNewTag) {
            // console.log('てってれー', modalDataNum, clickedColor);
            var check = $('#checkbox-modal-label').hasClass('is-checked');
            var length = masterJson[modalDataNum]["data"].length;
            var splited = [title, clickedColor, check];
            masterJson[modalDataNum]["data"].push(splited.join(DELIMITER));
            console.log(masterJson[modalDataNum]["data"]);
            var pool = $('.card-wrapper-i[data-order='+modalDataNum+']').find('.tag_pool');
            addTagToPool(splited, length, pool);

        } else {
            var show = $('#checkbox-modal-label').hasClass('is-checked');
            masterJson[modalDataNum]["data"][modalTipNum] = title + DELIMITER + clickedColor + DELIMITER + show;
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

// function isValidAboutNullAndDelimiter(input, errSpan) {
//     if (!input.val()){
//         errSpan.html(ERR_MSG_NULL_VAL);
//         input.parent().addClass('is-invalid');
//         return false;
//     }
//     if (input.val().indexOf(DELIMITER) !== -1){
//         errSpan.html(ERR_MSG_CONTAIN_BAD_CHAR.join(DELIMITER));
//         input.parent().addClass('is-invalid');
//         return false;
//     }
//     return true;
// }

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

// function setElementAsMdl(clone) {
//     var ele = clone.getElementsByClassName("mdl-pre-upgrade");
//     for (var i=0; i<ele.length; i++){
//         componentHandler.upgradeElement(ele[i]);
//     }
// }

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

    setElementAsMdl(wrapper);
    return wrapper[0];
}
//endregion

function setOnScrollListener() {
    $('.mdl-layout__content').scroll(function() {
        var scrollTop = $(this).scrollTop();
        saveBtn.css('top', scrollTop + 'px');
        fabWrapper.css('top', scrollTop + 80 + 'px');
    });
}