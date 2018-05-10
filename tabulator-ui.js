;(function (m) {
    'use strict';

    chrome.storage.sync.get(function (storage) {

        var tabs = {}, // to-be module
            tabGroups = storage.tabGroups || [], // tab groups
            opts = storage.options || {
                deleteTabOnOpen: 'no',
                includePinnedTabs: 'yes'
            };

        function saveTabGroups(json) {
            chrome.storage.sync.set({ tabGroups: json });
        }

        function updateTitle(id, title) {
            for (var i in tabGroups) {
                if (tabGroups[i].id == id) {
                   tabGroups[i].title = title;
                   break;
                }
            }
        }

        // model entity
        // 'data' is meant to be a tab group object from localStorage
        tabs.TabGroup = function (data) {
            console.log("Tab: ", data);
            this.date = m.prop(data.date);
            this.id   = m.prop(data.id);
            this.tabs = m.prop(data.tabs);
        };

        // alias for Array
        tabs.TabGroupsList = Array;

        // view-model
        tabs.vm = new function () {
            var vm = {};
            vm.init = function () {
                // list of tab groups
                vm.list = new tabs.TabGroupsList();

                vm.rmGroup = function (i) {
                    // remove view from array
                    vm.list.splice(i, 1);
                    // remove from localStorage
                    tabGroups.splice(i, 1)
                    // save
                    saveTabGroups(tabGroups);
                };

                vm.rmTab = function (i, ii) {
                    // remove from view array
                    //vm.list[i].tabs().splice(ii, 1);
                    // remove from localStorage
                    tabGroups[i].tabs.splice(ii, 1);
                    // save
                    saveTabGroups(tabGroups);
                };
            };
            return vm;
        };

        tabs.controller = function () {
            var i;
            tabs.vm.init();

            for (i = 0; i < tabGroups.length; i += 1) {
                tabs.vm.list.push(new tabs.TabGroup(tabGroups[i]));
            }
        };

        tabs.view = function () {
            if (tabs.vm.list.length === 0) {
                return m('p', 'No tab groups have been saved yet, or you deleted them all...');
            }

            // foreach tab group
            return tabs.vm.list.map(function (group, i) {
                //console.log("Title: ", group.title);
                // group
                return m('div.group', [
                    m('div.group-title', [
                        m('span.delete-link', { onclick: function () {
                            if (confirm('Are you sure you want to delete this tab group?')) {
                                tabs.vm.rmGroup(i);
                            }
                        } }),
                        m('span.group-name', group.title == '' && group.title == null ? '' : group.title),
                        ' ',
                        m('span.group-amount', group.tabs().length + ' Tabs'),
                        ' ',
                        m('span.group-date', moment(group.date()).format('M/D/YYYY h:mm:ss A')),
                        ' ',
                        m('span.restore-all', { onclick: function () {
                            var i;

                            // reason this goes before opening the tabs and not
                            // after is because it doesn't work otherwise
                            // I imagine it's because you changed tab and so
                            // that messes with the focus of the JS somehow...
                            if (opts.deleteTabOnOpen === 'yes') {
                                tabs.vm.rmGroup(i);
                            }

                            for (i = 0; i < group.tabs().length; i += 1) {
                                chrome.tabs.create({
                                    url: group.tabs()[i].url,
                                    pinned: group.tabs()[i].pinned
                                });
                            }
                        } }, 'Restore group'),
                        ' ',
                        m('span.rename', { onclick: function () {
                            group.title = prompt("Enter a name to rename the tab group to:", group.title);
                            //updateTitle(group.id, group.title);
                            //saveTabGroups(tabGroups);
                            chrome.storage.sync.set({ tabGroups: tabGroups });
                            
                        } }, 'Rename group')
                    ]),

                    // foreach tab
                    m('ul', group.tabs().map(function (tab, ii) {
                        return m('li', [
                            m('span.delete-link', { onclick: function () {
                                tabs.vm.rmTab(i, ii);
                            } }),
                            m('img', { src: tab.favIconUrl, height: '16', width: '16' }),
                            ' ',
                            m('span.link', { onclick: function () {
                                if (opts.deleteTabOnOpen === 'yes') {
                                    tabs.vm.rmTab(i, ii);
                                }

                                chrome.tabs.create({
                                    url: tab.url,
                                    pinned: tab.pinned
                                });
                            } }, tab.title)
                        ]);
                    }))
                ]);
            });
        };

        // init the app
        m.module(document.getElementById('groups'), { controller: tabs.controller, view: tabs.view });

    });

}(m));
