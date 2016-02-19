/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

var newItem = {
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
        app.admin = false;

        var screenName = document.querySelector('#screenName');

        if (screenName.textContent) {
            console.log(screenName.textContent);
            app.admin = true;
        }

        app.selected = null;

        var scrollHeadPanel = document.querySelectorAll('paper-scroll-header-panel');

        var categorySelect = document.querySelector('#categoryTab');

        categorySelect.addEventListener('click', function (event) {

            if (categorySelect.selected == 0) {

                if (pages.selected == 'selecteditempage')
                    leaveBidding(null);

                if (pages.selected != 'home')
                    goHome();
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

        app.thankNotes = false;

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

            app.thankNotes = true;

            pages.selected = "home"
            //scrollup
            scrollHeadPanel[0].scrollToTop(true);

        });

        var addItemSubmission = function () {

            //submit the item
            var submittedItem = app.newItem;

            submittedItem.status = 'Require Approval';

            addItemAjax.body = JSON.stringify(submiitedItem);

            console.log(addItemAjax.body);

            addItemAjax.generateRequest();
        };

        app.addItemPressed = function(){
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

        };

        app.notAddItemPressed = function(){

            pages.selected = "home";
            //scrollup
            scrollHeadPanel[0].scrollToTop(true);

        };


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

        app.itemSelectorClick= function(event){
            console.log("The item is pressed");
            var item = event.model.item;
            var id = item.id;

            //retrieve the item with the id
            //and open the item page
            openItemPage(id);
        };

        var socket;

        var bidding_price_queue=[];

        var resetItemPage= function(){

            app.selected = null;
            app.itemstate='init';
            bidding_price_queue=[];
        };

         var openItemPage= function(id){

            resetItemPage();

            socket = io.connect({timeout:5000});

            socket.emit('joinroom', id);

            socket.on('statusupdate', function(status){
               //if the item is not retrieved yet
               //store the received price in a local queue;
                var bid = status.lastbid;


                /*     lastbid:
                 *        {
                 *           price:
                 *           time:
                 *        }
                 */
                console.log("received status update " + JSON.stringify(status));

                if (app.selected == null) {
                   bidding_price_queue.push(bid);
               }else {
                    if (bid.time == bidInfoGrid.data.source[bidInfoGrid.data.source.length - 1].time)
                        return;

                    var selected = JSON.parse(JSON.stringify(app.selected));

                    selected.currentprice = bid.price;

                    selected.bids.push(bid);

                    app.selected = selected;

                    bidInfoGrid.data.source = app.selected.bids;

                    bidInfoGrid.columns[0].renderer = function (cell) {
                        cell.element.innerHTML = cell.row.index;
                    }
                }
            });

            retrieveItem(id);
            setBiddingState('init');
            pages.selected = "selecteditempage";

        };

        var setBiddingState = function(state){
            app.itemstate = String(state);
        };

        var isBiddingAt = function(state){
            return app.itemstate === state;
        };

        app.isAt=function(name,state){
            return isBiddingAt(state);
        };

        app.isEqual=function(status, state){
            return status === state;
        };

        var retrieveItemAjax = document.querySelector('#retrieveItemCall')

        var retrieveItem=function(id){

            retrieveItemAjax.url = '/items/found?id='+id;

            retrieveItemAjax.generateRequest();
        }

        var bidInfoGrid;

        retrieveItemAjax.addEventListener('response', function(event){

            var selected = event.detail.response.selected;

            app.selected = selected;

            bidInfoGrid = document.querySelector('#bidinfogrid');

            if (!selected.bids) {
                bidInfoGrid.data.source = [];
                return;
            }

            var bids = selected.bids;

            if (!bidding_price_queue) {
                //find the first price not in bids
                var start = -1;

                if (bids)
                    bidding_price_queue.forEach(function(price, index){
                        if (price.time == bids[bids.length-1].formatedtime){
                            start = index;
                        }

                    });

                //pop out the prices existing in bids from bidding_price_queue
                var pos = 0;
                while (pos<=start) {
                    bidding_price_queue.pop();
                    pos++;
                }

                //pop out the remaining prices into bids
                while (bidding_price_queue.length > 0)
                        bids.push(bidding_price_queue.pop());

                app.selected.currentprice = bids[bids.length-1].price;

            }

            console.log("bids as " + JSON.stringify(bids));

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

        var approveItemAjax = document.querySelector('#approveItemCall');

        app.approving= function(event){

            var approval ={};
            approval.id = app.selected.id;
            approval.status = 'Approved';

            approveItemAjax.body = JSON.stringify(approval);

            console.log(approveItemAjax.body);

            approveItemAjax.generateRequest();

            var selected = JSON.parse(JSON.stringify(app.selected));

            selected.status = 'Approved';

            app.selected = JSON.parse(JSON.stringify(selected));

        };


        app.biding = function(event){
            //connected to the socket at the server
            //display a server message on console

            socket.emit('joinbid', app.selected.id);

            setBiddingState('waiting');

            socket.on('statusupdate', function(status){

                if (isBiddingAt('init'))
                    return;

                var myid = socket.io.engine.id;

                console.log("status of the queue is "+ JSON.stringify(status));

                console.log("my id is " + myid + " my index is " + status.queue.indexOf(myid));

                if (status.queue[0] == myid) {

                    var local_biding_form = {
                        price: Number(status.lastbid.price) + Number(app.selected.increment),
                        email: null
                    };

                    app.bidingForm = local_biding_form;

                    setBiddingState('bidding');
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
                    setBiddingState('waiting');

                }
            })
        };

        app.leavebiding = function(event){
            leaveBidding(null);
        };

        var goHome = function(){
            if (socket) {
                socket.emit('leaveroom', null);
            }

            resetItemPage();
            openItemList();
            pages.selected = "home";
        };

        //retrieve the item list first
        goHome();

        var leaveBidding = function(bid){

            if (!isBiddingAt('init')) {

                if (socket) {
                    socket.emit('leavebid', bid);
                }

                setBiddingState('init');
            }else{

                goHome();
            }
        };

        app.submitbid = function(event){

            var bid = {};

            var bid_doc={
                id:app.selected.id,
                price:app.bidingForm.price,
                email:app.bidingForm.email
            };

            leaveBidding(bid_doc);
        };

        app.hasStatus=function(status){
            return typeof(status)!= "undefined";
        }
    });

})();
