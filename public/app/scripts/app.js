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
    description:null,
    initialprice: null,
    increment: null
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

            if (pages.selected == 'selecteditempage')
                leavingBiding(null);

            if (categorySelect.selected == 0) {
                openItemList();
                pages.selected = "home";
            } else
                if (categorySelect.selected == 1)
                {
                    pages.selected = "admin";
                }

        });

        var newItemPageButton = document.querySelector('#newItemPageButton');

        newItemPageButton.addEventListener('click', function(event){
            //switch to the add item page
            app.newItem = newItem;

            pages.selected = "additempage";

        });

        var addItemAjax = document.querySelector('#addItemCall');

        var toaster = document.querySelector('#toaster');

        addItemAjax.addEventListener('response', function (e) {
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

            app.listedItems = results;

            pages.selected = "home"

            //scrollup
            scrollHeadPanel[0].scrollToTop(true);
        });

        var addItemSubmission = function () {

            //submit the item
            var submittedItem = app.newItem;

            addItemAjax.body = JSON.stringify(app.newItem);

            console.log(addItemAjax.body);

            addItemAjax.generateRequest();
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

        });

        var listedItems;

        var retrieveListAjax = document.querySelector('#retrieveListCall');

        retrieveListAjax.addEventListener('response',function(event){

            listedItems = event.detail.response.titles;

            console.log("titles:" + JSON.stringify(listedItems));
            app.listedItems = listedItems;
        });

        var openItemList=function(){
            retrieveListAjax.generateRequest();
        };

        //retrieve the item list first
        openItemList();

        /*
        var itemSelectorButton = document.querySelector('itemSelector');

        itemSelectorButton.addEventListener('click', function(event){
            console.log(JSON.stringify(event));
        });
        */

        app.itemSelectorClick= function(event){
            console.log("The item is pressed");
            var item = event.model.item;
            var id = item.id;

            //retrieve the item with the id
            //and open the item page
            retrieveItem(id);
            setBidingState("init");
            pages.selected = "selecteditempage";
        }

        var bidingstatus={
            init: false,
            biding:false,
            waiting:false
        }
        var setBidingState = function(state){
            for (var key in bidingstatus){
                if (key == state)
                    bidingstatus[key]=true;
                else
                    bidingstatus[key]=false;
            }

            app.initstate= bidingstatus.init;
            app.bidingstate = bidingstatus.biding;
            app.waitingstate = bidingstatus.waiting;
        }

        var retrieveItemAjax = document.querySelector('#retrieveItemCall')

        var retrieveItem=function(id){

            retrieveItemAjax.url = '/items/found?id='+id;

            retrieveItemAjax.generateRequest();
        }

        retrieveItemAjax.addEventListener('response', function(event){

            var selected = event.detail.response.selected;

            app.selected = selected;

            var bids = selected.bids;

            console.log("bids as " + JSON.stringify(bids));

            if (!bids)
                return;

            var bidInfoGrid = document.querySelector('#bidinfogrid');

            bidInfoGrid.data.source = bids;

            bidInfoGrid.columns[0].renderer = function (cell) {
                cell.element.innerHTML = cell.row.index;
            }
        });

        var titleSelector = document.querySelector('#titleselector');

        titleSelector.addEventListener('iron-select', function(event){

            console.log(titleSelector.selected);

            var id = listedItems[titleSelector.selected].key;

            //compose a call to retrieve the found list
            console.log("selected id is " + id);

            app.retrieveFoundListUrl = '/query/found?id='+id;

            retrieveItemAjax.generateRequest();

        });

        var socket;

       app.biding = function(event){
            //connected to the socket at the server
            //display a server message on console
            socket = io.connect();

            socket.emit('create', app.selected.id);

            socket.on('statusupdate', function(status){

                var myid = socket.io.engine.id;

                console.log("status of the queue is "+ JSON.stringify(status));

                console.log("my id is " + myid + " my index is " + status.queue.indexOf(myid));

                if (status.queue[0] == myid) {

                    var local_biding_form = {
                        price: Number(status.price) + Number(app.selected.increment),
                        email: null
                    };

                    app.bidingForm = local_biding_form;

                    setBidingState('biding');
                }else {
                    //display the waiting queue

                    var waiting = [];

                    status.queue.forEach(function(id, index){
                        if (id == myid)
                            waiting.push(true);
                        else
                            waiting.push(false);
                    });
                    app.waitingqueue = waiting;
                    setBidingState('waiting');

                }
            })
        };

        app.leavewaiting = function(event){
            leavingBiding(null);
        }

        var leavingBiding = function(price){

            if (!app.initstate) {
                var msg = {};
                msg.room = app.selected.id;
                if (price)
                    msg.price = price;

                if (socket) {
                    socket.emit('leave', msg);
                    socket = null;
                }
                setBidingState('init');
            }
            pages.selected = "home";
        }

        var bidItemAjax = document.querySelector("#bidItemCall");

        app.submitbid = function(event){

            var bid = {};

            bidItemAjax.body=JSON.stringify({
                id:app.selected.id,
                bid:{
                    price:app.bidingForm.price,
                    email:app.bidingForm.email
                }
            });

            bidItemAjax.generateRequest();
            leavingBiding(app.bidingForm.price);
        };

        bidItemAjax.addEventListener('response', function (e) {
            console.log("response from server" + JSON.stringify(e.detail.response));
            //after an item is added, the item list in the home page is
            //refreshed by the response

            //close the socket


        });

    });

})();
