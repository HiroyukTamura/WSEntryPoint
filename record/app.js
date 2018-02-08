var defaultDatabase;
const progress = $('#progress');
const postLoad = $('#post_load');
const tab0 = $('#tab0');
const tab1 = $('#tab1');
const saveBtn = $('#save');
const load = $('#page-load-prg');
const contentFluid = $('#container-fluid');
const footer =$('.mdl-mini-footer');
var loginedUser;
var masterJson;
var isModalOpen = false;
var isModalForNewTag = false;
var modalDataNum;
var modalTipNum;
var currentMoment = moment();
const HOLIDAY_YMD = Object.keys(HOLIDAYS);
var isFirstLoad = true;

window.onload = function (ev) {
    var defaultApp = firebase.initializeApp(CONFIG);
    defaultDatabase = defaultApp.database();

    firebase.auth().onAuthStateChanged(function(userObject) {
        if (userObject) {
            console.log("ユーザログインしてます");
            // progress.hide();
            loginedUser = userObject;
            onLoginSuccess();
        } else {
            firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                .then(function() {
                    var uiConfig = createFbUiConfig(function (userObject, credential, redirectUrl) {
                        loginedUser = userObject;
                        return false;
                    });

                    var ui = new firebaseui.auth.AuthUI(firebase.auth());
                    progress.hide();
                    postLoad.hide();
                    $('#login_w').show();
                    ui.start('#firebaseui-auth-container', uiConfig);

                }).catch(function(error) {
                    console.log(error.code, error.message);
                    showNotification(ERR_MSG_OPE_FAILED, 'danger', -1);
            });
        }
    });

    initDrawerDecoration();
};

function onLoginSuccess() {
    setDrawerProfile(loginedUser);
    console.log('onLoginSuccess');
    connectFbAsync();
}

function onGetTamplateSnap(snapshot) {
    console.log('onGetTamplateSnap');

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
        var cardWrapper = createElementWithHeader(i);
        var doc = cardWrapper.children[0];

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

        setHeaderTitle($(doc), childSnap);

        $('.card_wrapper').append($(cardWrapper));
    }

    initAllTooltips();
    setElementAsMdl($('body'));

    if(isFirstLoad){
        initModal();
        setOnSaveFabClickListener();
        initTabLayout();
        setOnScrollListener();
        $('#progress').hide();
        $('#post_load').show();
        isFirstLoad = false;
    }
}

function setHeaderTitle(doc, childSnap) {
    var title = childSnap['dataType'] == 1 ? "イベント" : childSnap['dataName'];
    if(!childSnap['dataType']) {
        return;
    } else if(childSnap['dataType'] == 1) {
        title = '<i class="fas fa-clock"></i>イベント';
    } else if (childSnap['dataType'] == 2) {
        title = '<i class="fas fa-tags"></i>' + childSnap['dataName'];
    } else if (childSnap['dataType'] == 3) {
        title = '<i class="fas fa-list-ul"></i>' + childSnap['dataName'];
    } else if (childSnap['dataType'] == 4) {
        title = '<i class="fas fa-edit"></i>' + childSnap['dataName'];
    }

    doc.find('.ele_header').html(title);
}

function initModal() {
    var modal = $('#exampleModal');
    var input = $('#modal_input');
    var errorSpan = $('.mdl-textfield__error');

    /* blur on modal open, unblur on close */
    modal.on('show.bs.modal', function () {
        $('.container').addClass('blur');
        // if(input.attr("value")){
        //     console.log("てってれー");
        //     input.parent().addClass('is-dirty');
        // }
    });

    modal.on('hide.bs.modal', function () {
        // if(isModalForNewTag){
        //     isModalForNewTag = false;
        // } else {
        //     var splited = masterJson[modalDataNum]["data"][modalTipNum].split(DELIMITER);
        //     var tip = $('.card').eq(modalDataNum).find(".tag_wrapper").eq(modalTipNum);
        //     setTagUi(tip, splited);
        // }
    });

    modal.on('hidden.bs.modal', function () {
        $('.container').removeClass('blur');
        $('#modal-temp2 div').children().remove();
        // $('.modal-circle-check.show').removeClass("show");
        // input.removeAttr("value");
        // input.val('');
        // document.getElementById('checkbox-modal-label').MaterialCheckbox.uncheck();
        // input.parent().removeClass('is-dirty').removeClass('is-invalid').removeClass('wrong-val');
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
}

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

        var dataOrder = $(this).parents(".card-wrapper-i").attr('data-order');
        var jsonC = JSON.parse(masterJson[dataOrder]['data']["0"]);
        jsonC['rangeList'].push(newRangeData);
        masterJson[dataOrder]['data']["0"] = JSON.stringify(jsonC);

        createOneRangeRow(doc, count, newRangeData, masterJson);
        console.log(JSON.parse(masterJson[dataOrder]['data']["0"]));

        count++;

        checkRangeDuplicateItem($(doc), jsonC);
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

    setElementAsMdl($('body'));
}

function operateAs2(doc, childSnap) {
    var pool = $('<div>', {
        class: "tag_pool"
    });

    var count = 0;

    Object.keys(childSnap["data"]).forEach(function (key) {
        var splited = childSnap["data"][key].split(DELIMITER);
        if(splited[2] === 'true')
            addTagToPool(splited, count, pool);
        count++;
    });

    var addTagBtn = createAddTagBtn();
    addTagBtn.on('click', function (e) {
        var modalPool = $('#modal-temp2 div');
        console.log('addBtn clicked');
        modalDataNum = $(this).parents('[data-order]').attr('data-order');
        console.log(modalDataNum);

        var isModalExist = false;
        for (var i=0; i<masterJson[modalDataNum]['data'].length; i++) {
            var data = masterJson[modalDataNum]['data'][i];
            var splited = data.split(DELIMITER);
            if (splited[2] !== 'false')
                continue;

            var clone = createHtmlAs2ForModal();

            // setTagUi(clone, splited);
            $(clone).find(".mdl-chip__text").html(splited[0]);
            $(clone).find(".mdl-chip").css("background-color", highlightColors[parseInt(splited[1])]);

            clone.attr("index", i).appendTo(modalPool);
            isModalExist = true;

            clone.on('click', function (e) {
                var indexClicked = $(this).attr('index');
                console.log(indexClicked);
                var splitedClicked = masterJson[modalDataNum]['data'][indexClicked].split(DELIMITER);
                splitedClicked[2] = true;
                masterJson[modalDataNum]['data'][indexClicked] = splitedClicked.join(DELIMITER);
                $('#exampleModal').modal('hide');
                addTagToPool(splitedClicked, indexClicked, pool);
                console.log(masterJson[modalDataNum]);
            });
        }

        if (!isModalExist) {
            showNotification('全てのタグが追加されています', 'warning');
        } else {
            showModal();
        }
        // isModalForNewTag = true;
        // clickedColor = 0;
        // modalDataNum = parseInt(pool.parents('.card-wrapper-i').attr("data-order"));
        // $('.modal-circle-check').eq(0).addClass("show");
        return false;
    });
    pool.append(addTagBtn);

    $(doc).append(pool);
}

function createHtmlAs2ForModal() {
    return $(
        '<div class="tag_wrapper">'+
            '<span class="mdl-chip">' +
                '<span class="mdl-chip__text"></span>' +
            '</span>'+
        '</div>');
}

function addTagToPool(splited, count, pool) {
    var clone = createHtmlAs2();

    // setTagUi(clone, splited);
    $(clone).find(".fa-check").hide();
    $(clone).find(".mdl-chip__text").html(splited[0]);
    $(clone).find(".mdl-chip").css("background-color", highlightColors[parseInt(splited[1])]);

    clone.attr("index", count);

    // clone.find(".mdl-chip").on('click', function (e) {
    //     modalDataNum = parseInt(pool.parents('.card-wrapper-i').attr("data-order"));
    //     modalTipNum = clone.attr("index");
    //     var splited = masterJson[modalDataNum]["data"][modalTipNum].split(DELIMITER);
    //     clickedColor = parseInt(splited[1]);
    //
    //     $('#modal_input').attr('value', splited[0]).val(splited[0]);
    //     $('.modal-circle-check').eq(parseInt(splited[1])).addClass("show");
    //
    //     if(!!splited[2])
    //         document.getElementById('checkbox-modal-label').MaterialCheckbox.check();
    //
    //     showModal();
    // });

    clone.find('.mdl-chip__action i').on('click', function (e) {
        e.preventDefault();
        console.log('delete clicked');

        var dataOrder = $(this).parents(".card-wrapper-i").attr('data-order');
        var index = $(this).parents('.tag_wrapper').attr('index');
        var splited = masterJson[dataOrder]["data"][index].split(DELIMITER);
        splited[2] = false;
        masterJson[dataOrder]["data"][index] = splited.join(DELIMITER);
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

function createElementWithHeader(i) {
    var doc =$(
        '<div class="card mix">'+
            '<h4 class="ele_header"></h4>'+
        '</div>'
    );

    var wrapper = $(
        '<div class="card-wrapper-i" data-order="'+ i +'"></div>'
    );

    wrapper.append(doc);

    return wrapper[0];
}

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

    // var addLiBtn =initAddLiBtn();

    // $(doc).addClass('align-center');
    $(doc).append(ul);
    // $(doc).append(addLiBtn);
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

    clone.find('.li-rm-btn').remove();

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
                // .on('input', function (e) {
                //     e.preventDefault();
                //     $(e.target).popover('hide');
                //     return false;
                // }).hover(function (e) {
                // onHoverForPopover(e);

            .change(function (e) {
                e.preventDefault();
                var currentDataOrder = $(this).parents('.card-wrapper-i').attr('data-order');
                var index = $(this).closest("li").index();
                var values = masterJson[currentDataOrder]["data"][index].split(DELIMITER);
                values[2] = $(this).val();
                masterJson[currentDataOrder]["data"][index] = values.join(DELIMITER);
                console.log(masterJson[currentDataOrder]["data"][index]);
                return false;
            });
                // .on('click', function (e) {
            //     var popoverId = $(this).attr('aria-describedby');
            //     var popover = $('#'+popoverId);
            //     if(!popover.length || !popover.hasClass('show')) {
            //         console.log(popover.length, !popover.hasClass('show'), popoverId);
            //         $(e.target).popover('show');
            //     }
            //
            // }).popover({
            //     trigger: 'manual',
            //     placement: 'right',
            //     content: '<div class="select">'+
            //                 '<p>最大値を変更&nbsp;&nbsp;&nbsp;'+
            //                     '<select name="blood">' +
            //                         '<option value="3">3</option>' +
            //                         '<option value="4">4</option>' +
            //                         '<option value="5">5</option>' +
            //                         '<option value="6">6</option>' +
            //                         '<option value="7">7</option>' +
            //                         '<option value="8">8</option>' +
            //                         '<option value="9">9</option>' +
            //                         '<option value="10">10</option>' +
            //                     '</select>' +
            //                 '</p>'+
            //             '<div/>',
            //     html: true,
            //     container: 'body'
            // }).on('shown.bs.popover', function (e) {
            //     console.log('shown.bs.popover', $(e.target).attr('max'));
            //     var popoverId = $(this).attr('aria-describedby');
            //     var popover = $('#'+popoverId);
            //     popover.addClass('tooltip-slider')
            //         .find('select')
            //         .val($(e.target).attr('max'))
            //         .change(function (e2) {
            //             e2.preventDefault();
            //             var newMax = $(this).val();
            //             console.log('changed', $(this).val());
            //             $(e.target).popover('hide');
            //
            //             //masterJson反映
            //             var dataNum = $(e.target).parents('li').index();
            //             var dataOrder = $(e.target).parents('.card-wrapper-i').attr('data-order');
            //             var splited = masterJson[dataOrder]['data'][dataNum].split(DELIMITER);
            //             splited[3] = newMax;
            //             if (parseInt(splited[2]) > newMax) {
            //                 splited[2] = newMax;
            //                 $(e.target).val(newMax);
            //             }
            //             $(e.target).attr('max', newMax);
            //
            //             masterJson[dataOrder]['data'][dataNum] = splited.join(DELIMITER);
            //             console.log(masterJson[dataOrder]['data']);
            //             return false;
            //         });
            //
            //     $(window).hover(function (e2) {
            //         if($(e2.target).parents('.popover').length || $(e2.target).hasClass('popover')){
            //             return false;
            //         } else if($(e2.target).parents('.mdl-list__item').length || $(e2.target).hasClass('mdl-list__item')) {
            //             return false
            //         }
            //         console.log('hideやね', e2);
            //         $(e.target).popover('hide');
            //     });
            //
            // }).on('hidden.bs.popover', function (e) {
            //     var popoverId = $(this).prop('aria-describedby');
            //     $('#'+popoverId).removeClass('tooltip-slider');
            //     console.log('hover off');
            //
            //     $(window).off('mouseenter mouseleave');
            // });
            break;
    }

    return clone;
}

function createHtmlAs3(id) {
    var checkId = "checkId" + id;
    var inputId = "inputId" + id;
    return $(
        '<li class="mdl-list__item mdl-pre-upgrade">'+

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

            var ymd = currentMoment.format('YYYYMMDD');
            defaultDatabase.ref('usersParam/'+ loginedUser.uid +'/'+ ymd).set(masterJson).then(function () {
                showNotification(SUCCESS_MSG_SAVE, 'success');
                masterJson.splice(0, 1);

            }).catch(function (reason) {
                console.log(reason);
                masterJson.splice(0, 1);
                showOpeErrNotification(defaultDatabase);
            });
            return false;
        });
}

function initTabLayout() {
    tab1.hide();

    setTabDate(tab0);

    tab0.find('.layout__tab').eq(currentMoment.day()).addClass('is-active');

    $('#tab-next').on('click', function (e) {
        console.log('click');
        toggleTab(true);
        return false;
    });

    $('#tab-prev').on('click', function (e) {
        e.preventDefault();
        toggleTab(false);
        console.log('click');
        return false;
    });
}

function setTabDate(tab) {
    tab = tab.find('.layout__tab');
    var momentC = currentMoment.clone().startOf('week');
    for(var i=0; i<7; i++) {
        var val = momentC.format('D'+'日('+ wodList[momentC.day()] +')');
        tab.eq(i).find('span').html(val);
        if(momentC.day() === 0){
            tab.eq(i).addClass('holiday');
        } else {
            var ymdHifun = momentC.format('YYYY-MM-DD');
            if (HOLIDAY_YMD.indexOf(ymdHifun) !== -1) {
                tab.eq(i).addClass('holiday');
            }
        }
        tab.eq(i).off('click');
        tab.eq(i).on('click', function (e) {
            onClickTab($(e.target));
            return false;
        }).find('span').on('click', function (e) {
            e.preventDefault();
            onClickTab($(e.target).parent());
            return false;
        });
        momentC.add(1, 'd');
    }
}

function toggleTab(isNext) {
    var hider;
    var shower;
    if (tab0.is(':visible')){
        hider = tab0;
        shower = tab1;
    } else {
        hider = tab1;
        shower = tab0;
    }

    hider.fadeOut(null, function (e) {
        console.log('fadeOut');
        var dif = isNext ? 7 : -7;
        currentMoment.add(dif, 'd');
        //翌週へGO→翌週の日曜へ　前週へGO→前週の土曜へ
        if (isNext) {
            currentMoment.subtract('d', currentMoment.day());
        } else {
            currentMoment.add('d', 6-currentMoment.day());
        }
        console.log(727, currentMoment.format('YYYYMMDD'));

        setTabDate(shower);
        var tab = shower.find('.layout__tab').eq(currentMoment.day());
        tab.addClass('is-active');
        shower.fadeIn();

        onClickTab(tab);
    });
}

function onClickTab(ele) {
    console.log('onClickTab');

    ele.parents('#tab-center').find('.is-active').removeClass('is-active');
    var layoutTab = getLayoutTab(ele);
    layoutTab.addClass('is-active');

    //この方法なら、二重クリック時でも大丈夫
    var dif = layoutTab.index() - currentMoment.day();
    currentMoment.add(dif,'d');
    console.log(currentMoment.format('YYYYMMDD'));

    if (contentFluid.is(':visible')) {
        contentFluid.hide();
        footer.hide();
        load.show();

        $('.card_wrapper').children().remove();
        masterJson = null;

        var scheme = makeRefScheme(['usersParam', loginedUser.uid, currentMoment.format('YYYYMMDD')]);
        defaultDatabase.ref(scheme).once('value').then(function (snapshot) {
            if(!snapshot.exists()){
                var scheme = makeRefScheme(['userData', loginedUser.uid, 'template']);
                defaultDatabase.ref(scheme).once('value').then(function (templateSnap) {
                    if(!templateSnap.exists()){
                        console.log('!templateSnap.exists');
                        showOpeErrNotification(defaultDatabase, -1);
                        return;
                    }
                    onGetTamplateSnap(templateSnap);

                    if(!isFirstLoad){
                        load.hide();
                        contentFluid.show();
                        footer.show();
                    }

                }).catch(function (err) {
                    load.hide();
                    console.log(err);
                    showOpeErrNotification(defaultDatabase, -1);
                });

            } else {
                onGetTamplateSnap(snapshot);//todo デバッグ
                if(!isFirstLoad){
                    load.hide();
                    contentFluid.show();
                    footer.show();
                }
            }

        }).catch(function (err) {
            console.log(err);
            showOpeErrNotification(defaultDatabase, -1);
            load.hide();
        });
    } else {
        console.log(contentFluid.css('display'));
    }
}

function getLayoutTab(ele) {
    return ele.hasClass('layout__tab') ? ele : ele.parents('.layout__tab');
}

function connectFbAsync() {
    var scheme = makeRefScheme(['usersParam', loginedUser.uid, currentMoment.format('YYYYMMDD')]);

    defaultDatabase.ref(scheme).once('value').then(function (snapshot) {
        if(!snapshot.exists()){
            var scheme = makeRefScheme(['userData', loginedUser.uid, 'template']);
            defaultDatabase.ref(scheme).once('value').then(function (templateSnap) {
                if(!templateSnap.exists()){
                    console.log('!templateSnap.exists');
                    showOpeErrNotification(defaultDatabase, -1);
                    return;
                }
                onGetTamplateSnap(templateSnap);

                if(isFirstLoad){
                    progress.hide();
                    postLoad.show();
                } else {
                    load.hide();
                    contentFluid.show();
                }

            }).catch(function (err) {
                if(isFirstLoad) {
                    load.hide();
                } else {
                    progress.hide();
                }
                console.log(err);
                showOpeErrNotification(defaultDatabase, -1);
            });

        } else {
            onGetTamplateSnap(snapshot);//todo デバッグ
            if(isFirstLoad){
                progress.hide();
                postLoad.show();
            } else {
                load.hide();
                contentFluid.show();
            }
        }

    }).catch(function (err) {
        console.log(err);
        showOpeErrNotification(defaultDatabase, -1);
        if(isFirstLoad) {
            load.hide();
        } else {
            progress.hide();
        }
    });
}

function setOnScrollListener() {
    $('.mdl-layout__content').scroll(function() {
        var scrollTop = $(this).scrollTop();
        saveBtn.css('top', scrollTop + 'px');
    });
}