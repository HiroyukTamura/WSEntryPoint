var defaultDatabase;
const progress = $('#progress');
const postLoad = $('#post_load');
var loginedUser;
var masterJson;

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
        var cardWrapper = createElementWithHeader();
        var doc = cardWrapper.children[0];

        switch (childSnap["dataType"]){
            case 0:
                continue;
            case 1:
                operateAs1(doc, childSnap);
                break;
            case 2:
                // operateAs2(doc, childSnap);
                break;
            case 3:
                // var element = operateAs3(doc, childSnap, i);
                // if(element){
                //     createElementWithHeader(i).appendChild(element);
                // } else {
                //     //todo エラー時処理？？
                // }
                break;
            case 4:
                // operateAs4(doc, childSnap);
                break;
        }

        $('.card_wrapper').append($(cardWrapper));
    }

    setElementAsMdl($('body'));
}

function operateAs1(doc, childSnap) {
    $(doc).append(createTable());
    var json = JSON.parse(childSnap["data"]["0"]);

    var addRowBtn = createAssEveRow('eve-add', 10000);

    $(doc).find('tbody').append(addRowBtn);

    if(json["eventList"]){
        json["eventList"].forEach(function (value) {
            createOneEveRow(doc, value);
        });
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

function createElementWithHeader() {
    var doc =$(
        '<div class="card mix">'+
            '<span class="ele_header"></span>'+
        '</div>'
    );

    var wrapper = $('<div>', {
        class: 'card-wrapper-i'
    });

    wrapper.append(doc);

    setElementAsMdl(wrapper);
    return wrapper[0];
}