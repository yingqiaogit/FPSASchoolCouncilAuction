/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

var newItem = {
    title: null,
    description: null
};

(function () {
    'use strict';

    // Grab a reference to our auto-binding template
    // and give it some initial binding values
    // Learn more about auto-binding templates at http://goo.gl/Dx1u2g
    var app = document.querySelector('#app');

    // Listen for template bound event to know when bindings
    // have resolved and content has been stamped to the page
    app.addEventListener('dom-change', function () {
        console.log('Our app is ready to rock!');
    });

    // Close drawer after menu item is selected if drawerPanel is narrow

    // See https://github.com/Polymer/polymer/issues/1381

    window.addEventListener('WebComponentsReady', function () {

        app.onMenuSelect = function () {
            var drawerPanel = document.querySelector('#paperDrawerPanel');
            if (drawerPanel.narrow) {
                drawerPanel.closeDrawer();
            }
        };

        var pages = document.querySelector('iron-pages');

        app.switch = function () {
            pages.selectNext();
        };

        /*
        app.addEventListener('switcher', function (e) {
            app.switch();
        });
        */

        var scrollHeadPanel = document.querySelectorAll('paper-scroll-header-panel');

        var categorySelect = document.querySelector('#categoryTab');

        categorySelect.addEventListener('click', function (event) {

            if (categorySelect.selected == 0) {
                    pages.selected = "home";
            } else
                if (categorySelect.selected == 1)
                {
                    pages.selected = "admin";
                    openAnalysis()
                }

        });

        var newItemPageButton = document.querySelector('#newItemPageButton');

        newItemPageButton.addEventListener('click', function(event){
            //switch to the add item page
            app.newItem = newItem;

            pages.selected = "additempage";

        });

        var addItemCall = document.querySelector('#addItemCall');

        var toaster = document.querySelector('#toaster');

        addItemCall.addEventListener('response', function (e) {
            console.log("response from server" + JSON.stringify(e.detail.response));
            //after an item is added, the item list in the home page is
            //refreshed by the response

            if (e.detail.response.status)
            {
                //invalid input
                app.toaster= e.detail.response.status;
                toaster.show();
                return;
            }

            var results = e.detail.response.titles;

            var list = [];

            results.forEach(function(item){
                var element = {};
                element.id = item.id;
                element.primary_url = item.primary_url;
                element.title = item.title;
                list.push(element);
            })

            app.list = list;
            pages.selected = "home"

            //scrollup
            scrollHeadPanel[0].scrollToTop(true);
        });

        var addItemSubmission = function () {

            //submit the item
            var addItemData = {};
            addItemData.title = app.newItem.title;
            addItemData.description = app.newItem.description;
            addItemData.primary_url = "http://lorempixel.com/600/400"

            console.log(addItemData);

            addItemCall.body = JSON.stringify(addItemData);

            console.log(addItemCall.body);

            addItemCall.generateRequest();
        };

        var addItemButton = document.querySelector('#addItemButton');

        addItemButton.addEventListener('click', function(event){
            var reg = /\[|\]/;

            if (!app.newItem.title || !app.newItem.description)
            {
                app.toaster= "Title or Description should not be empty";
                toaster.show();
                return;
            }

            if (app.newItem.title.match(reg)||app.newItem.description.match(reg)){
                app.toaster = "Please remove special characters such as [ or ]"
                toaster.show();
                return;
            }
            addItemSubmission();
            pages.selected = "home";
        });

        var searchedItems;

        var retrieveTitlesCall = document.querySelector('#retrieveTitlesCall');

        retrieveTitlesCall.addEventListener('response',function(event){

            searchedItems = event.detail.response.titles;

            console.log("titles:" + JSON.stringify(searchedItems));
            app.searchedItems = searchedItems;
        });

        var openAnalysis=function(){
            retrieveTitlesCall.generateRequest();
        };

        var titleSelector = document.querySelector('#titleselector');

        var retrieveFoundListCall = document.querySelector('#retrieveFoundListCall')

        titleSelector.addEventListener('iron-select', function(event){

            console.log(titleSelector.selected);

            var id = searchedItems[titleSelector.selected].key;

            //compose a call to retrieve the found list
            console.log("selected id is " + id);

            app.retrieveFoundListUrl = '/query/found?id='+id;

            retrieveFoundListCall.generateRequest();

        });

        var grid = document.querySelector("v-grid");

        retrieveFoundListCall.addEventListener('response', function(event){

            app.selectedTitile = event.detail.response.title;
            app.selectedDescription = event.detail.response.description;

            var location =[];
            var found = event.detail.response.found;

            if (!found)
                return;

            found.forEach(function(element){
               var loc = {};
               loc.lat = element.lat;
               loc.lng = element.lng;
               location.push(loc);
            });

            app.locationItems = location;

            grid.data.source = event.detail.response.found;

            grid.columns[0].renderer = function (cell) {
                    cell.element.innerHTML = cell.row.index;
            }

        });

    });

})();
