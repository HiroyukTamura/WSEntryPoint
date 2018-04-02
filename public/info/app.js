(function () {
    function UiListeners() {}

    UiListeners.prototype.initSocialBtns = function () {
        $('#btn-github').on('click', function (e) {
            window.open('https://github.com/HiroyukTamura');
            return false;
        });

        $('#btn-fb').on('click', function (e) {
            window.open('https://www.facebook.com/profile.php?id=100005318946062');
            return false;
        });
    };

    window.UiListeners = UiListeners;
}());

new UiListeners().initSocialBtns();