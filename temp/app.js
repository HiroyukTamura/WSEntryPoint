let $ = require('jquery');

!function () {
    function Auth1Ope() {
        this.URL = "https://radiko.jp/v2/api/auth1";
        this.HEADERS = {
            "User-Agent": "curl/7.56.1",
            "Accept": "*/*",
            "X-Radiko-App":"pc_html5" ,
            "X-Radiko-App-Version":"0.0.1" ,
            "X-Radiko-User":"dummy_user" ,
            "X-Radiko-Device":"pc"
        };
    }

    Auth1Ope.prototype.fetch = function() {
        $.ajax({
            type: 'GET',
            url: this.URL,
            data: this.HEADERS
        }).done(function (data) {
            console.log('成功');
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log("XMLHttpRequest : " + jqXHR.status, "textStatus : " + textStatus, "errorThrown : " + errorThrown);
        });
    };

    window.Auth1Ope = Auth1Ope;
}();

window.onload = function () {
    // new Auth1Ope().fetch();
    new Class().fetch();
};

class Class {
    constructor(){
        this.URL = "https://radiko.jp/v2/api/auth1";
        this.HEADERS = {
            "User-Agent": "curl/7.56.1",
            "Accept": "*/*",
            "X-Radiko-App":"pc_html5" ,
            "X-Radiko-App-Version":"0.0.1" ,
            "X-Radiko-User":"dummy_user" ,
            "X-Radiko-Device":"pc"
        };
    }

    fetch(){
        $.ajax({
            type: 'GET',
            url: this.URL,
            data: this.HEADERS
        }).done(function (data) {
            console.log('成功');
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log("XMLHttpRequest : " + jqXHR.status, "textStatus : " + textStatus, "errorThrown : " + errorThrown);
        });
    }
}

// new Auth1Ope().fetch();