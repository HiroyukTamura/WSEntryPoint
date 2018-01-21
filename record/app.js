var defaultDatabase;
const progress = $('#progress');
const postLoad = $('#post_load');
var loginedUser;
var masterJson;
var isModalOpen = false;
var isModalForNewTag = false;
var modalDataNum;
var modalTipNum;

window.onload = function (ev) {
    var defaultApp = firebase.initializeApp(CONFIG);
    defaultDatabase = defaultApp.database();

    firebase.auth().onAuthStateChanged(function(userObject) {
        if (userObject) {
            console.log("ユーザログインしてます");
            progress.hide();
            loginedUser = userObject;
            onLoginSuccess();
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
                            'signInSuccess': function(userObject, credential, redirectUrl) {
                                loginedUser = userObject;
                                progress.hide();
                                $('#login_w').hide();
                                return false;
                            }
                        }
                    };

                    var ui = new firebaseui.auth.AuthUI(firebase.auth());
                    progress.hide();
                    $('#login_w').show();
                    ui.start('#firebaseui-auth-container', uiConfig);

                }).catch(function(error) {
                console.log(error.code, error.message);
                onErrConnectFb();
            });
        }
    });

    initDrawerDecoration();
};

function onLoginSuccess() {
    setDrawerProfile(loginedUser);
    console.log('onLoginSuccess');
    postLoad.show();

    var scheme = makeRefScheme(['usersParam', loginedUser.uid, moment().format('YYYYMMDD')]);

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

            }).catch(function (err) {
                console.log(err);
                showOpeErrNotification(defaultDatabase, -1);
            });

        } else {

        }

    }).catch(function (err) {
        console.log(err);
        showOpeErrNotification(defaultDatabase, -1);
    });
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
                var element = operateAs3(doc, childSnap, i);
                if(element){
                    createElementWithHeader(i).appendChild(element);
                } else {

                }
                break;
            case 4:
                operateAs4(doc, childSnap);
                break;
        }

        setHeaderTitle($(doc), childSnap);

        $('.card_wrapper').append($(cardWrapper));
    }

    initAllTooltips();
    setElementAsMdl($('body'));
    initModal();
}

function setHeaderTitle(doc, childSnap) {
    var title = childSnap['dataType'] == 1 ? "タイトル" : childSnap['dataName'];
    console.log(title);
    doc.find('.ele_header').html('<i class="fas fa-clock"></i>'+title);
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
        input.parent().removeClass('is-dirty').removeClass('is-invalid');
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

    addRowBtn.on('click', function (e) {
        console.log('addRowBtn click');
        var value = createNewTimeEveData();
        createOneEveRow(doc, value, masterJson);
        var dataOrder = $(this).parents(".card-wrapper-i").attr('data-order');
        var jsonC = JSON.parse(masterJson[dataOrder]['data']["0"]);
        jsonC['eventList'].push(value);//todo ん？push??ここは時刻でsortすべきでは？ん?sortするってことは、迂闊にindex()とかできないな・・・ mixitUpでソートした後、いい感じにすることだ。
        masterJson[dataOrder]['data']["0"] = JSON.stringify(jsonC);

        console.log(JSON.parse(masterJson[dataOrder]['data']["0"]));

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
            createOneEveRow(doc, value, masterJson);
        });
    }

    var count = 1;//#eve-add のdata-orderは10000なので、eveListのdata-orderは10001スタートにしたい
    var addRangeBtn = createAssEveRow('range-add', 1000000);

    addRangeBtn.on('click', function (e) {
        console.log('addRangeBtn clicked');
        var newRangeData = createNewRangeData();

        var dataOrder = $(this).parents(".card-wrapper-i").attr('data-order');
        var jsonC = JSON.parse(masterJson[dataOrder]['data']["0"]);
        jsonC['rangeList'].push(newRangeData);
        masterJson[dataOrder]['data']["0"] = JSON.stringify(jsonC);

        createOneRangeRow(doc, count, newRangeData, masterJson);
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

    setElementAsMdl(wrapper);
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

            '<button class="mdl-button mdl-js-button mdl-button--icon li-rm-btn mdl-pre-upgrade">' +
                '<i class="fas fa-times"></i>' +
            '</button>'+
        '</li>'
    );
}