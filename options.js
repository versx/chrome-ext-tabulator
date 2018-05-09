;(function ($) {
    'use strict'

    var opts = {};

    document.addEventListener('DOMContentLoaded', function () {
        chrome.storage.sync.get('options', function (storage) {
            var opts = storage.options || {};

            if (opts.deleteTabOnOpen === undefined) {
                $('input[name="deleteTabOnOpen"][value="no"]').prop('checked', 'checked');
            } else {
                $('input[name="deleteTabOnOpen"][value="' + opts.deleteTabOnOpen + '"]').prop('checked', 'checked');
            }
            if (opts.includePinnedTabs === undefined) {
                $('input[name="includePinnedTabs"][value="no"]').prop('checked', 'checked');
            } else {
                $('input[name="includePinnedTabs"][value="' + opts.includePinnedTabs + '"]').prop('checked', 'checked');
            }
        });
    });

    document.getElementsByName('save')[0].addEventListener('click', function () {
        var deleteTabOnOpen = document.querySelector('input[name="deleteTabOnOpen"]:checked').value;
        var includePinnedTabs = document.querySelector('input[name="includePinnedTabs"]:checked').value;

        chrome.storage.sync.set({
            options: {
                deleteTabOnOpen: deleteTabOnOpen,
                includePinnedTabs: includePinnedTabs
            }
        }, function () { // show "settings saved" notice thing
            document.getElementById('saved').style.display = 'block';
            window.setTimeout(function () {
                document.getElementById('saved').style.display = 'none';
            }, 1000);
        });
    });

}(jQuery));
