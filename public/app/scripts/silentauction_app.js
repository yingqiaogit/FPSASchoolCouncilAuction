/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

var newItem = {
    sponsor: {}
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

        app.status = 'list';

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
            }

        });

        var newItemPageButton = document.querySelector('#newItemPageButton');

        newItemPageButton.addEventListener('click', function(event){
            //switch to the add item page
            app.newItem = newItem;

            app.status = 'addItem';

            pages.selected = "additempage";

        });

        app.thankNotes = false;

        var displayListAfterEvent = function(event){
            console.log("response from server" + JSON.stringify(event.detail.response));
            //after an item is added, the item list in the home page is
            //refreshed by the response

            if (event.detail.response.status)
            {
                //invalid input
                app.toaster= event.detail.response.status;
                toaster.show();
                return;
            }

            var results = event.detail.response.titles;

            app.listedItems = results;

            pages.selected = "home";

            app.status = 'list';

            //scrollup
            scrollHeadPanel[0].scrollToTop(true);

        }

        var addItemAjax = document.querySelector('#addItemCall');

        var toaster = document.querySelector('#toaster');

        addItemAjax.addEventListener('response', function (e) {

            if (app.status =='addItem')
                app.thankNotes = true;
            displayListAfterEvent(e);

        });

        var addItemSubmission = function () {

            //submit the item
            var submittedItem = app.newItem;

            submittedItem.status = 'Require Approval';

            if (submittedItem.bids)
                delete submittedItem.bids;

            addItemAjax.body = JSON.stringify(submittedItem);

            console.log("submitted item "+ addItemAjax.body);

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

        app.leave= function(){

            if (app.status == 'edit') {
                pages.selected = 'adminitempage';
                app.status = 'admin';
            }
            else
            {
                pages.selected = 'home';
                app.status = 'list';
            }

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
            app.status = 'bid';
            openItemPage(id);
        };

        app.itemAdminClick= function(event){
            console.log("The item is pressed");

            var id = event.model.dataHost.dataHost.item.id;
            //retrieve the item with the id
            //and open the item page
            retrieveItem(id);

            app.status = 'admin';

            pages.selected = "adminitempage";
        };

        var deleteItemAjax = document.querySelector('#deleteItemCall');

        app.deleteItem = function(event){

            //send ajax call to the sever with id in the body

            var id = app.selected.id;

            deleteItemAjax.url = '/items/'+id;

            deleteItemAjax.generateRequest();
        };

        deleteItemAjax.addEventListener('response', function (e) {
            displayListAfterEvent(e);

        });

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
                    if ((bidInfoGrid.data.source.length > 0) && bid.time && (bid.time == bidInfoGrid.data.source[bidInfoGrid.data.source.length - 1].time))
                        return;

                    if (status.status != "PriceChange")
                        return;

                    var selected = JSON.parse(JSON.stringify(app.selected));

                    selected.currentprice = bid.price;

                    if (!selected.bids)
                        selected.bids=[];

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

        app.getShort=function(description){

            return (description.length > 125)? description.substring(0,120) + "..." : description;

        }

        var bidInfoGrid;

        retrieveItemAjax.addEventListener('response', function(event){

            var selected = event.detail.response.selected;

            app.selected = selected;

            if (app.adminStatus && app.adminStatus == 'init')
                return;

            bidInfoGrid = document.querySelector('#bidinfogrid');

            if (!selected.bids) {
                bidInfoGrid.data.source = [];
                return;
            }

            var bids;

            if (selected.bids)
                bids = selected.bids;
            else
                bids = [];

            if (!bidding_price_queue) {
                //find the first price not in bids
                var start = -1;

                if (bids.length>0)
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

        app.approveItemToggle= function(event){

            var approval ={};
            approval.id = app.selected.id;

            if (app.selected.status === 'Require Approval')
                approval.status = 'Approved';
            else
                approval.status = 'Require Approval';

            approveItemAjax.body = JSON.stringify(approval);

            console.log(approveItemAjax.body);

            approveItemAjax.generateRequest();

        };

        app.editItem = function(event){
            app.newItem = app.selected;

            app.status = 'edit';

            pages.selected = 'additempage';

        }

        approveItemAjax.addEventListener('response',function(e){

            displayListAfterEvent(e);

        });

        //set the number of timeout
        var timeouts = 6;
        var interval;
        var time;
        app.biding = function(event){
            //connected to the socket at the server
            //display a server message on console

            socket.emit('joinbid', app.selected.id);

            setBiddingState('waiting');

            socket.on('statusupdate', function(status){

                if (isBiddingAt('init') && (status.status != "BidMemberChange" || status.status != "PriceChange" ))
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
                    //open the timer:
                    time = 60;
                    app.time = time;
                    interval = window.setInterval(function(){
                        time -= 10;
                        app.time = time;
                        timeouts--;
                        if (timeouts ==0)
                            leaveBidding(null);
                    },10000);

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
            app.status = 'list';
        };

        //retrieve the item list first
        goHome();

        var leaveBidding = function(bid){

            if (!isBiddingAt('init')) {

                if (socket) {
                    socket.emit('leavebid', bid);
                }

                //clear the timer;
                if (isBiddingAt('bidding'))
                    window.clearInterval(interval);

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
                email:app.bidingForm.email,
                name:app.bidingForm.name
            };

            leaveBidding(bid_doc);
        };

        app.hasStatus=function(status){
            return typeof(status)!= "undefined";
        }
    });

})();
