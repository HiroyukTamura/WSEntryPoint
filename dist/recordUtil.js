const ERR_MSG_DUPLICATE_VAL = "項目名が重複しています";
const ERR_MSG_EACH_VAL_SAME = "項目名は開始と終了で別にしてください";
const ERR_MSG_NO_CONTENTS = '項目は最低でもひとつ必要です';

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

function createHtmlAs1Eve() {
    var random = Math.random().toString(36).slice(-8);
    return $(
        '<tr>'+
            '<td class="circle_wrapper">' +
                '<div class="circle"></div>' +
            '</td>' +

            '<td>' +
                '<form action="#" class="time colored">' +
                    '<div class="mdl-textfield mdl-js-textfield mdl-pre-upgrade mdl-textfield--floating-label">' +
                        '<input class="mdl-textfield__input time_input mdl-pre-upgrade" type="text" id="sample">' +
                        '<label class="mdl-textfield__label mdl-pre-upgrade" for="sample"></label>' +
                    '</div>' +
                '</form>' +
            '</td>' +

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
                '<button class="mdl-button mdl-js-button mdl-button--icon mdl-pre-upgrade remove-btn" data-toggle="tooltip" data-placement="top" title="項目を削除">' +
                    '<i class="fas fa-times"></i>' +
                '</button>' +
            '</td>'+
        '</tr>'
    )[0];
}

function setEveInputValues(inputs, value) {
    inputs.eq(0).attr("value", value["cal"]["hourOfDay"] + ":" + format0to00(value["cal"]["minute"]));
    inputs.eq(1).attr("value", value["name"]);
}

function createOneEveRow(doc, value, masterJson, saveBtn) {
    console.log(value);

    var block = $(createHtmlAs1Eve());
    var inputs = block.find(".mdl-textfield__input");
    setEveInputValues(inputs, value);

    block.find('.circle').css('background-color', colors[value["colorNum"]])
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
                    $(e.target).css('background-color', colors[index]);
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
            var tr = $(event.target).parents('tr');
            var index = tr.index();
            var dataOrder = $(event.target).parents(".card-wrapper-i").attr('data-order');
            var jsonC = JSON.parse(masterJson[dataOrder]['data']["0"]);
            var time = moment($(event.target).val(), 'H:mm');
            jsonC["eventList"][index]["cal"]["hourOfDay"] = time.hour();
            jsonC["eventList"][index]["cal"]["minute"] = time.minute();
            jsonC['eventList'] = sortByTime(jsonC['eventList']);
            masterJson[dataOrder]['data']["0"] = JSON.stringify(jsonC);

            tr.attr('data-order', time.format('Hmm'));
            console.log(masterJson);

            sortByMixitUp($(doc));
        });

    //項目削除イベント
    block.find('.remove-btn').on('click', function (ev) {
        console.log('項目削除');
        var dataOrder = $(this).parents(".card-wrapper-i").attr('data-order');
        var jsonC = JSON.parse(masterJson[dataOrder]['data']["0"]);
        var index = $(this).parents('tr').index();
        jsonC["eventList"].splice(index, 1);
        masterJson[dataOrder]['data']["0"] = JSON.stringify(jsonC);
        $(this).tooltip('hide');
        $(this).parents('tr').remove();

        $(doc).find('table').find('tr').each(function (i, elem) {
            var ym = $(ev.target).parents(".card-wrapper-i").attr('data-order');
            console.log(i);
            if (ym || parseInt(ym) < 10000) {//range-preのdataOrderは10000

                var index = $(elem).index();
                var input = $(elem).find('.input_eve');
                console.log('index:', index);
                var jsonC = JSON.parse(masterJson[dataOrder]['data']['0']);
                for(var key in jsonC['eventList']) {
                    if(!jsonC['eventList'].hasOwnProperty(key) || key == index)
                        continue;

                    if (jsonC['eventList'][key]['name'] === input.val()) {
                        errSpan.html(ERR_MSG_DUPLICATE_VAL);
                        input.parent().addClass('is-invalid').addClass('wrong-val');
                        console.log('こっち');
                        toggleBtn(false);
                        return;
                    }
                }

                input.parent().removeClass('is-invalid').removeClass('wrong-val');
                toggleBtn(true);
                jsonC['eventList'][index]['name'] = input.val();
                masterJson[dataOrder]['data']['0'] = JSON.stringify(jsonC);
            }
        });

        console.log(masterJson);
        //todo アニメーションできたらなあ。/
    });

    //イベント名入力イベント
    var errSpan = block.find('.event_name .mdl-textfield__error');
    block.find('.input_eve').keyup(function (e) {
        //todo 不正な値であっても、masterJsonに書き込んでいることに注意してください。
        var isValid = isValidAboutNullAndDelimiter($(e.target), errSpan);
        if(!isValid){
            toggleBtn(false);
            return;
        }

        var currentDataOrder = $(e.target).parents('.card-wrapper-i').attr('data-order');
        var index = $(e.target).parents('tr').index();
        console.log('index:', index);
        var jsonC = JSON.parse(masterJson[currentDataOrder]['data']['0']);
        for(var key in jsonC['eventList']) {
            if(!jsonC['eventList'].hasOwnProperty(key) || key == index)
                continue;

            if (jsonC['eventList'][key]['name'] === $(e.target).val()) {
                errSpan.html(ERR_MSG_DUPLICATE_VAL);
                $(e.target).parent().addClass('is-invalid').addClass('wrong-val');
                console.log('こっち');
                toggleBtn(false);
                return;
            }
        }

        $(e.target).parent().removeClass('is-invalid').removeClass('wrong-val');
        toggleBtn(true);
        jsonC['eventList'][index]['name'] = $(e.target).val();
        masterJson[currentDataOrder]['data']['0'] = JSON.stringify(jsonC);
    });

    block.insertBefore($(doc).find('.eve-add'));

    return block;
}

function onHoverForPopover(e) {
    if(!$('.popover').length)
        $(e.target).popover('show');
}


function format0to00(value) {
    return value.toString().length === 1 ?
        '0'+value : value;
}

function setDataOrderToEveList(block, hourOfDay, min) {
    //date-orderを付加
    var time = moment();
    time.hour(hourOfDay);
    time.minute(min);
    $(block).attr('data-order', time.format('Hmm'));
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

function createOneRangeRow(doc, count, value, masterJson) {

    var blocks = [];
    blocks[0] = createHtmlAs1Eve();
    setDataOrderToRangeList($(blocks[0]), count);
    $(blocks[0]).find('.remove-btn').hide();
    $(blocks[0]).addClass('range-pre');
    blocks[1] = craeteHtmlAs1Row();
    setDataOrderToRangeList($(blocks[1]), count);
    blocks[2] = createHtmlAs1Eve();

    //ラベルをセット
    var label0 = $(blocks[0]).find('.time_input').parent().find('label');
    setLabelOfOffset(label0, value['start']['offset']);
    var level2 = $(blocks[2]).find('.time_input').parent().find('label');
    setLabelOfOffset(level2, value['end']['offset']);

    setDataOrderToRangeList($(blocks[2]), count);
    $(blocks[2]).find('.remove-btn').hide();
    $(blocks[2]).addClass('range-post');
    var startInputs = $(blocks[0]).find(".mdl-textfield__input");
    setEveInputValues(startInputs, value["start"]);
    var endInputs = $(blocks[2]).find(".mdl-textfield__input");
    setEveInputValues(endInputs, value["end"]);

    //●をカラーリング
    $(blocks[0]).find('.circle').css('background-color', colors[value["colorNum"]]).attr('colorNum', value["colorNum"]);
    $(blocks[2]).find('.circle').css('background-color', colors[value["colorNum"]]).attr('colorNum', value["colorNum"]);
    $(blocks[1]).find('.icon_down').css('color', colors[value["colorNum"]]).attr('colorNum', value["colorNum"]);

    //リスナをセット
    setRangeDatePicker($(blocks[0]), masterJson, value['start']['offset']);
    setRangeDatePicker($(blocks[2]), masterJson, value['end']['offset']);

    //削除ボタンイベント
    $(blocks[1]).find('.remove-btn').on('click', function (ev) {
        var tr = $(this).closest('tr');
        // var index = tr.index() - tr.parents('tbody').find('.eve-add').index()-1;
        var dataOrder = $(this).closest(".card-wrapper-i").attr('data-order');
        var dataNum = getRangeIndex($(this));
        var jsonC = JSON.parse(masterJson[dataOrder]['data']["0"]);
        jsonC["rangeList"].splice(dataNum, 1);
        masterJson[dataOrder]['data']["0"] = JSON.stringify(jsonC);

        tr.prev().remove();
        tr.next().remove();
        $(this).tooltip('hide');
        tr.remove();

        checkRangeDuplicateItem($(doc), jsonC);
    });

    //region 禁則文字まわり
    var startInput = $(blocks[0]).find('.input_eve');
    var endInput = $(blocks[2]).find('.input_eve');
    var errSpanStart = $(blocks[0]).find('.event_name .mdl-textfield__error');
    var errSpanEnd = $(blocks[2]).find('.event_name .mdl-textfield__error');

    startInput.keyup(function (e) {
        //todo 不正な値であっても、masterJsonに書き込んでいることに注意してください。
        var isValid = isValidAboutNullAndDelimiter($(e.target), errSpanStart);
        if(!isValid){
            toggleBtn(false);
            return;
        }

        var currentDataOrder = $(e.target).parents('.card-wrapper-i').attr('data-order');
        var index = getRangeIndex($(e.target));
        var jsonC = JSON.parse(masterJson[currentDataOrder]['data']['0']);

        if($(e.target).val() === jsonC['rangeList'][index]['end']['name']){
            showEachErrSpan(startInput, endInput, errSpanStart, errSpanEnd, ERR_MSG_EACH_VAL_SAME);
            toggleBtn(false);
            return;
        }

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
                toggleBtn(false);
                return;
            }
        }

        $(e.target).parent().removeClass('is-invalid');
        $(e.target).parent().removeClass('wrong-val');
        endInput.parent().removeClass('is-invalid');
        endInput.parent().removeClass('wrong-val');
        toggleBtn(true);
        console.log('うむむ');
        jsonC['eventList'][index]['name'] = $(e.target).val();
        masterJson[currentDataOrder]['data']['0'] = JSON.stringify(jsonC);
    });


    endInput.keyup(function (e) {
        //todo 不正な値であっても、masterJsonに書き込んでいることに注意してください。
        var isValid = isValidAboutNullAndDelimiter($(e.target), errSpanEnd);
        if(!isValid){
            toggleBtn(false);
            return;
        }

        var currentDataOrder = $(e.target).parents('.card-wrapper-i').attr('data-order');
        var index = getRangeIndex($(e.target));
        var jsonC = JSON.parse(masterJson[currentDataOrder]['data']['0']);

        if($(e.target).val() === jsonC['rangeList'][index]['start']['name']){
            showEachErrSpan(startInput, endInput, errSpanStart, errSpanEnd, ERR_MSG_EACH_VAL_SAME);
            toggleBtn(false);
            return;
        }

        console.log($(e.target).val(), jsonC['rangeList'][index]['start']['name']);

        for(var key in jsonC['rangeList']) {
            if(!jsonC['rangeList'].hasOwnProperty(key))
                continue;

            if(key == index)
                continue;

            if (jsonC['rangeList'][key]['start']['name'] === startInput.val()
                && jsonC['rangeList'][key]['end']['name'] === $(e.target).val()) {

                showEachErrSpan(startInput, endInput, errSpanStart, errSpanEnd, ERR_MSG_DUPLICATE_VAL);
                console.log('こっち');
                toggleBtn(false);
                return;
            }
        }

        $(e.target).parent().removeClass('is-invalid');
        $(e.target).parent().removeClass('wrong-val');
        startInput.parent().removeClass('is-invalid')
        startInput.parent().removeClass('wrong-val');
        toggleBtn(true);
        console.log('うむふぁｓｆだｆｄ');
    });
    //endregion

    //色指定のポップオーバー
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

                        var currentDataOrder = $(e.target).parents('tr').attr('data-order');
                        var index = $(e2.target).parents('.fa-layers').index();
                        console.log(index);
                        var newColor = colors[index];
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

        initAllTooltips();
        $(blocks[i]).insertBefore($(doc).find('.range-add'));
    }
}

function checkRangeDuplicateItem(doc, jsonC) {
    doc.find('.range-pre').each(function (i, elem) {
        var dataOrderRow = $(elem).attr('data-order');
        var startInput = $(elem).find('.input_eve');
        var endInput = $(doc).find('.range-post[data-order='+ dataOrderRow +']').find('.input_eve');
        var isValid = true;

        for(var key in jsonC['rangeList']) {
            if(!jsonC['rangeList'].hasOwnProperty(key) || key == i) {
                console.log(key, i);
                continue;
            }

            if (jsonC['rangeList'][key]['start']['name'] === startInput.val() && jsonC['rangeList'][key]['end']['name'] === endInput.val()) {
                showEachErrSpan(startInput, endInput, startInput.parent().find('.mdl-textfield__error'), endInput.parent().find('.mdl-textfield__error'), ERR_MSG_DUPLICATE_VAL);
                console.log('invalid value');
                toggleBtn(false);
                isValid = false;
                break;
            }
        }

        if (isValid) {
            startInput.parent().removeClass('is-invalid').removeClass('wrong-val');
            endInput.parent().removeClass('is-invalid').removeClass('wrong-val');
            toggleBtn(true);
        }
    });
}

function getRangeIndex(target) {
    var tr = target.parents('tr');
    var index = tr.index() - tr.parents('tbody').find('.eve-add').index()-1;
    return Math.floor(index/3);
}

function setLabelOfOffset(label, offset) {
    switch (offset){
        case -1:
            label.html('前日');
            break;
        case 0:
            label.html('');
            break;
        case 1:
            label.html('翌日');
            break;
    }
}

function setDataOrderToRangeList(block, rangeNum) {
    block.attr('data-order', rangeNum + 10000);
}

function showEachErrSpan(startInput, endInput, errSpanStart, errSpanEnd, errMsg) {
    errSpanStart.html(errMsg);
    startInput.parent().addClass('is-invalid').addClass('wrong-val');
    errSpanEnd.html(errMsg);
    endInput.parent().addClass('is-invalid').addClass('wrong-val');
}

function craeteHtmlAs1Row() {
    return $(
        '<tr class="angle-down">' +
            '<td colspan="3">' +
                '<i class="fas fa-angle-double-down icon_down"></i>' +
            '</td>' +
            '<td colspan="1">' +
                '<button class="mdl-button mdl-js-button mdl-button--icon mdl-pre-upgrade remove-btn" data-toggle="tooltip" data-placement="top" title="項目を追加">' +
                    '<i class="fas fa-times"></i>' +
                '</button>' +
            '</td>' +
        '</tr>')[0];
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
}

function setRangeDatePicker(block, masterJson, offset) {
    var input = block.find('input').eq(0);
    setDatePickerLisntener(input)
        .on('change', function (event, date) {
            var index = $(event.target).parents('tr').index() - $(event.target).parents('tbody').find('.eve-add').index()-1;
            var dataOrder = $(event.target).closest(".card-wrapper-i").attr('data-order');
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

            var offset = $('.dtp').eq(jsonC["eventList"].length + dataNum*2 +n)
                .find('.date-picker-radios input:checked')
                .parent().index() -1;

            var label = $(event.target).parent().find('label');
            switch (offset){
                case -1:
                    label.html('前日');
                    break;
                case 0:
                    label.html('');
                    break;
                case 1:
                    label.html('翌日');
                    break;
            }
            jsonC["rangeList"][dataNum][startOrEnd]["cal"]["offset"] = offset;
            masterJson[dataOrder]['data']["0"] = JSON.stringify(jsonC);
            console.log(masterJson);
        });

    var datePickers = $('.dtp-actual-meridien');

    // datePickerを整備
    var radios = createHtmlRadio();
    radios.find('input').eq(offset+1).attr('checked', 'checked');
    var row = datePickers.eq(datePickers.length-1);
    radios.insertBefore(row);
    row.hide();
}

function createHtmlRadio() {
    return $(
        '<form class="date-picker-radios">'+
            '<tr>'+
                '<td>'+
                    '<label class="mdl-radio mdl-js-radio mdl-js-ripple-effect mdl-pre-upgrade" for="option-1">'+
                        '<input type="radio" id="option-1" class="mdl-radio__button mdl-pre-upgrade" name="options" value="1">'+
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

function  getCommentAsNullable(childSnap) {
    if (!childSnap["data"]){
        return null;
    }
    return childSnap["data"];
}

//todo ここって'comment'じゃなかったっけ？？
function operateAs4(doc, childSnap, masterJson) {
    var clone = createHtmlAs4();
    // var clone = document.getElementById("comment_dummy").cloneNode(true);
    var summery = getCommentAsNullable(childSnap);
    var input = clone.find(".mdl-textfield__input");
    var errSpan = clone.find('.mdl-textfield__error');

    if(summery)
        clone.find(".mdl-textfield__input").attr("value", summery);

    input.keyup(function (e) {
        if (input.val().indexOf(DELIMITER) !== -1){
            errSpan.html(ERR_MSG_CONTAIN_BAD_CHAR.join(DELIMITER));
            input.parent().addClass('is-invalid').addClass('wrong-val');
            toggleBtn(false);

        } else {
            $(e.target).parent().removeClass('is-invalid').removeClass('wrong-val');
            var currentDataOrder = $(e.target).parents('.card-wrapper-i').attr('data-order');
            masterJson[currentDataOrder]['data'] = $(e.target).val();
            console.log(masterJson);
            toggleBtn(true);
        }
    });

    $(doc).append(clone);
}

function createHtmlAs4() {
    return $(
        '<div>'+
            '<div id="comment_dummy">'+
                '<form action="#" class="comment_form">' +
                    '<div class="mdl-textfield mdl-js-textfield comment mdl-pre-upgrade">' +
                        '<textarea class="mdl-textfield__input comment_ta mdl-pre-upgrade" type="text" rows= "3" id="comment" ></textarea>' +
                        '<label class="mdl-textfield__label mdl-pre-upgrade" for="comment">Text...</label>' +
                        '<span class="mdl-textfield__error mdl-pre-upgrade"></span>'+
                    '</div>' +
                '</form>' +
            '</div>'+
        '</div>');
}

function initAllTooltips() {
    $('[data-toggle="tooltip"]').tooltip({
        offset: '0, 8px'
    });
}

function createAddTagBtn() {
    return $(
        '<button class="mdl-button mdl-js-button mdl-button--icon tag-add-btn mdl-pre-upgrade" data-tag-order="1000" data-toggle="tooltip" data-placement="top" title="項目を追加">' +
            '<i class="material-icons">add_circle</i>' +
        '</button>');
}

function setTagUi(clone, splited) {
    $(clone).find(".mdl-chip__text").html(splited[0]);

    if (splited[2] === "false") {
        $(clone).find(".fa-check").hide();
    }
    $(clone).find(".mdl-chip").css("background-color", highlightColors[parseInt(splited[1])]);
}

function showModal() {
    var modal = $('#exampleModal').modal();
}

function onClickAddParamsLiBtn(splited, e, e2) {
    var currentDataOrder = $(e.target).parents('.card-wrapper-i').attr('data-order');
    masterJson[currentDataOrder]['data'].push(splited.join(DELIMITER));
    var ul = $(e.target).parents('.card').find('.mdl-list');
    createParamsLi(splited, currentDataOrder, ul.length)
        .appendTo(ul);
    setElementAsMdl(ul);
    $(e.target).popover('hide');
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

function onKeyUpParamsTitle(masterJson, input, errSpan) {
    var index = input.closest("li").index();
    var currentDataOrder = input.parents('.card-wrapper-i').attr('data-order');
    var isValid = isValidAboutNullAndDelimiter(input, errSpan);
    if(!isValid){
        toggleBtn(false);
        return;
    }

    for(var value in masterJson[currentDataOrder]['data']) {
        if(masterJson[currentDataOrder]['data'].hasOwnProperty(value)) {
            var val = masterJson[currentDataOrder]['data'][value].split(DELIMITER)[1];
            if(input.val() === val){
                errSpan.html(ERR_MSG_DUPLICATE_VAL);
                input.parent().addClass('is-invalid').addClass('wrong-val');
                toggleBtn(false);
                console.log('こっち');
                return;
            }
        }
    }

    input.parent().removeClass('is-invalid').removeClass('wrong-val');
    toggleBtn(true);
    var splited = masterJson[currentDataOrder]["data"][index].split(DELIMITER);
    splited[1] = input.val();
    masterJson[currentDataOrder]["data"][index] = splited.join(DELIMITER);
    console.log(masterJson);
}

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

function createNewData(dataType) {
    var data = {
        dataType: dataType,
        day: 0,
        mon: 0,
        year: 0
    };

    if (dataType === 2 || dataType === 3 || dataType === 4) {
        data.dataName = '新しい項目';
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
        data['data']['0'] = "勤務日"+ DELIMITER +"2";
    }

    return data;
}
//endregion

/**
 * variable 'hm' is key of one EventData to sort, but it may duplicate.
 * so variable 'map[hm]' is typeof array. it corresponds to sort.
 */
function sortByTime(eventList) {
    var map = {};

    eventList.forEach(function (value) {
        var hour = value.cal.hourOfDay;
        var min = value.cal.minute;
        var hm = hour.toString() + format0to00(min);
        if(!map[hm])
            map[hm] = [];

        map[hm].push(value);
    });

    var sortedKeys = Object.keys(map).sort(function (a, b) {
        return a-b;
    });
    console.log(map, sortedKeys);
    var newEveList = [];
    for(var key in sortedKeys) {
        if(sortedKeys.hasOwnProperty(key)){
            map[sortedKeys[key]].forEach(function (value) {
                newEveList.push(value);
            });
        }
    }
    return newEveList;
}

function toggleBtn(isShow) {
    if (isShow && $('.wrong-val').length === 0) {
        $('#save').fadeIn();
    } else {
        $('#save').fadeOut();
        console.log($('.wrong-val'));
    }
}

function onClickAddRowBtn(ele, masterJson, doc) {
    console.log('addRowBtn click');
    var value = createNewTimeEveData();
    var newRow = createOneEveRow(doc, value, masterJson, saveBtn);
    var dataOrder = ele.parents(".card-wrapper-i").attr('data-order');
    var jsonC = JSON.parse(masterJson[dataOrder]['data']["0"]);
    jsonC['eventList'].push(value);//todo ん？push??ここは時刻でsortすべきでは？ん?sortするってことは、迂闊にindex()とかできないな・・・ mixitUpでソートした後、いい感じにすることだ。
    jsonC['eventList'] = sortByTime(jsonC['eventList']);

    masterJson[dataOrder]['data']["0"] = JSON.stringify(jsonC);

    console.log(JSON.parse(masterJson[dataOrder]['data']["0"]));

    sortByMixitUp($(doc));

    initAllTooltips();

    $(newRow).find(".mdl-textfield__input").keyup();
}

function sortByMixitUp(doc) {
    mixitup(doc.find('tbody')[0], {
        load: {
            sort: 'order:asc'
        },
        behavior: {
            liveSort: true
        },
        animation: {
            duration: 250,
            nudge: true,
            reverseOut: false,
            effects: "fade translateZ(-100px)"
        },
        selectors: {
            target: 'tbody tr',
            control: '.mixitup-control'//@see https://goo.gl/QpW5BR
        }
    }).sort("order:asc");

    setElementAsMdl(doc);
}

function initAddLiBtn() {
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
            container: 'body',
            offset: '0 8px'
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
                    var splited = ['1', '新しい項目', '3', '5'];
                    onClickAddParamsLiBtn(splited, e, e2);
                });
            poppover.find('.add-checkbox')
                .on('click', function (e2) {
                    var splited = ['0', '新しい項目', 'true'];
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
    return addLiBtn;
}

// function onClickLiRmBtn(e, masterJson) {
//     e.preventDefault();
//     console.log('clicked');
//     var li = $(this).parents('li');
//     var index = li.index();
//     var currentDataOrder = $(e.target).parents('.card-wrapper-i').attr('data-order');
//     masterJson[currentDataOrder]["data"].splice(index, 1);
//     li.remove();//todo アニメーションつけようと思ったけどうまくいかない。
//     console.log(masterJson);
// }