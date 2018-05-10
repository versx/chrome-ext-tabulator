;(function () {
    'use strict';

    function getWord(info,tab) {
        console.log("Word " + info.selectionText + " was clicked.");
        chrome.tabs.create({  
            url: "http://www.google.com/search?q=" + info.selectionText,
        });           
    }

    function getTabs(info,tab) {
        chrome.tabs.query({ }, function(tabs) {
            tabs.forEach(function(tab) {
                console.log(tab.url);
            });
        })
    }

    // from the array of Tab objects it makes an object with date and the array
    function makeTabGroup(tabsArr) {
        var tabGroup = {
                date: new Date(),
                id: Date.now(), // clever way to quickly get a unique ID
                title: '',
            };

        tabGroup.tabs = tabsArr;

        return tabGroup;
    }

    // filters tabGroup for stuff like pinned tabs, chrome:// tabs, etc.
    function filterTabGroup(tabGroup) {
        tabGroup.tabs = filterTabs(tabGroup.tabs);
        return tabGroup;
    }

    function filterTabs(tabsArr) {
        console.log(Options);
        var filteredTabs = [];

        tabsArr.forEach(tab => {
            if (tab.pinned) {
                if (Options.includePinnedTabs == 'yes') {
                    filteredTabs.push(tab);
                }
            } else {
                filteredTabs.push(tab);
            }
            /*
            if (tab.pinned && Options.includePinnedTabs == 'yes' ||
            !tab.pinned && Options.includePinnedTabs == 'no' ||
            !tab.pinned && Options.includePinnedTabs == 'yes') {
                console.log(tab.url);
                filteredTabs.push(tab);
            }
            */
        });

        return filteredTabs;
    }

    // saves array (of Tab objects) to localStorage
    function saveTabGroup(tabGroup) {
        chrome.storage.sync.get('tabGroups', function (storage) {
            var newArr;

            if (storage.tabGroups) {
                newArr = storage.tabGroups;
                newArr.push(tabGroup);

                chrome.storage.sync.set({ tabGroups: newArr });
            } else {
                chrome.storage.sync.set({ tabGroups: [ tabGroup ] });
            }
        });
    }

    // close all the tabs in the provided array of Tab objects
    function closeTabs(tabsArr) {
        var tabsToClose = [], i;
        var filtered = filterTabs(tabsArr);

        for (i = 0; i < filtered.length; i += 1) {
            tabsToClose.push(filtered[i].id);
            console.log({ url: filtered[i].url, pinned: filtered[i].pinned })
        }

        chrome.tabs.remove(tabsToClose, function () {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError)
            }
        });
    }

    // makes a tab group, filters it and saves it to localStorage
    function saveTabs(tabsArr) {
        var tabGroup = makeTabGroup(tabsArr),
            cleanTabGroup = filterTabGroup(tabGroup);

        saveTabGroup(cleanTabGroup);
    }

    function saveAllTabs() {
        chrome.tabs.query({currentWindow: true}, function (tabsArr) {
            saveTabs(tabsArr);
            openBackgroundPage(); // opening now so window doesn't close
            closeTabs(tabsArr);
        });
    }

    function saveActiveTab() {
        chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
            saveTabs(tabs)
            openBackgroundPage();
            closeTabs(tabs);
        });
    }

    function openBackgroundPage() {
        chrome.tabs.create({ url: chrome.extension.getURL('tabulator.html') });
    }

    function openOptionsPage() {
        chrome.tabs.create({ url: chrome.extension.getURL('options.html') });
    }

    // listen for messages from popup
    chrome.runtime.onMessage.addListener(function (req, sender, sendRes) {
        switch (req.action) {
        case 'save':
            saveTabs(req.tabsArr);
            openBackgroundPage(); // opening now so window doesn't close
            closeTabs(req.tabsArr);
            sendRes('ok'); // acknowledge
            break;
        case 'saveActive':
            saveActiveTab();
            break;
        case 'openbackgroundpage':
            openBackgroundPage();
            sendRes('ok'); // acknowledge
            break;
        default:
            sendRes('nope'); // acknowledge
            break;
        }
    });

    var Options = {};
    chrome.storage.sync.get('options', function (storage) {
        Options = storage.options || { includePinnedTabs: "yes", deleteTabOnOpen: "no" };
    });

    //#region Context Menus

    chrome.contextMenus.create({
        title: 'Tabulator',
        type: 'normal',
        id: 'main',
        contexts: ['page']
    });
    chrome.contextMenus.create({
        title: 'Open Tabulator',
        type: 'normal',
        id: 'backgroundPage',
        contexts: ['page'],
        parentId: 'main'
    });
    chrome.contextMenus.create({
        type: 'separator',
        id: 'separator0',
        contexts: ['page'],
        parentId: 'main'
    });
    chrome.contextMenus.create({
        title: 'Test',
        type: 'normal',
        id: 'test',
        contexts: ['page'],
        parentId: 'main'
    });
    chrome.contextMenus.create({
        title: 'Save open tabs',
        type: 'normal',
        id: 'saveOpenTabs',
        contexts: ['page'],
        parentId: 'main'
    });
    chrome.contextMenus.create({
        title: 'Save active tab',
        type: 'normal',
        id: 'saveActiveTab',
        contexts: ['page'],
        parentId: 'main'
    });
    chrome.contextMenus.create({
        type: 'separator',
        id: 'separator1',
        contexts: ['page'],
        parentId: 'main'
    });
    chrome.contextMenus.create({
        title: 'Options',
        type: 'normal',
        id: 'optionsPage',
        contexts: ['page'],
        parentId: 'main'
    });

    chrome.contextMenus.onClicked.addListener(function(itemData,tab) {
        if (itemData.menuItemId === 'test') {
            getTabs(itemData, tab);
        } else if (itemData.menuItemId === 'backgroundPage') {
            openBackgroundPage();
        } else if (itemData.menuItemId === 'saveOpenTabs') {
            saveAllTabs();
        } else if (itemData.menuItemId === 'saveActiveTab') {
            saveActiveTab();
        } else if (itemData.menuItemId === 'optionsPage') {
            openOptionsPage();
        }
    });

    //#endregion

}());
//TODO: Add option to open options page from context menu.
//TODO: Add option to save tabs from context menu.
//TODO: Move delete tab group to title.