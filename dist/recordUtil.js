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
        '<div class="mdl-textfield mdl-js-textfield mdl-pre-upgrade">' +
        '<input class="mdl-textfield__input time_input mdl-pre-upgrade" type="text"' +
        // '<label class="mdl-textfield__label mdl-pre-upgrade" for="sample"></label>' +
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
        '<button class="mdl-button mdl-js-button mdl-button--icon mdl-pre-upgrade remove-btn">' +
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

function createOneEveRow(doc, value, masterJson) {
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

function onHoverForPopover(e) {
    if(!$('.popover').length)
        $(e.target).popover('show');
}

function format0to00(value) {
    if(value === "0" || value === 0)
        return "00";
    else
        return value;
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