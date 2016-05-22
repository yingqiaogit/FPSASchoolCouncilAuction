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

var bidComparator = function(aBid, bBid){
    return aBid.price- bBid.price;
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
            //scrollHeadPanel[0].scrollToTop(true);

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
            //scrollHeadPanel[0].scrollToTop(true);

        };

        var listedItems;

        var retrieveListAjax = document.querySelector('#retrieveListCall');

        retrieveListAjax.addEventListener('response',function(event){

            listedItems = event.detail.response.titles;

            console.log("titles:" + JSON.stringify(listedItems));
            app.listedItems = listedItems;

            app.isAdmin= event.detail.response.isAdmin;
            app.isBidding = event.detail.response.isBidding;
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

        var socket = null;

        socket = io.connect({timeout:5000});

        socket.on('welcome',function(){
            console.log("connected!");
        });

        //processes statusupate message at init state, handles PriceChange only;
        socket.on('statusupdate', function(status){
            //if the item is not retrieved yet
            //store the received price in a local queue;
            if (status.status != "PriceChange")
                return;

            var bid = status.lastbid;

            /*     lastbid:
             *        {
             *           price:
             *           time:
             *        }
             */
            console.log("received status update " + JSON.stringify(status));

            if (app.selected == null) {
                bidding_queue.push(bid);
            }else {
                var selected = JSON.parse(JSON.stringify(app.selected));
                if (!selected.bids)
                    selected.bids=[];

                selected.bids.push(bid);

                selected.bids.sort(bidComparator);

                //if quantity is not defined
                if (!selected.quantity || selected.quantity==1)
                    selected.currentprice = selected.bids[selected.bids.length-1].price
                else
                if (selected.bids.length >= selected.quantity)
                    selected.currentprice = selected.bids[selected.bids.length-selected.quantity].price;

                app.selected = selected;

                bidInfoGrid.data.source = app.selected.bids;

                bidInfoGrid.columns[0].renderer = function (cell) {
                    cell.element.innerHTML = cell.row.index;
                }
            }
        });

        var bidding_queue=[];

        var resetItemPage= function(){

            app.selected = null;
            app.itemstate='init';
            bidding_queue=[];
        };

        var openItemPage = function(id){

            resetItemPage();

            socket = io.connect({timeout:5000});

            socket.emit('joinroom', id);


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
        };

        app.getShort=function(description){

            var display = description.length > 125? description.substring(0,120) + "..." :
                           description + Array(125-description.length).join(' ');
            return display;

        };

        app.hasQuantity=function(quantity){

            return quantity && quantity > 1;
        }

        var bidInfoGrid;

        app.getOperation = function(){

            if (app.isBidding)
                return 'Bid';
            else
                return 'View';
        }

        retrieveItemAjax.addEventListener('response', function(event){

            var selected = event.detail.response.selected;

            if (app.adminStatus && app.adminStatus == 'init')
                return;

            app.isAdmin = event.detail.response.isAdmin;
            app.isBidding = event.detail.response.isBidding;

            bidInfoGrid = document.querySelector('#bidinfogrid');

            if (!selected.bids) {
                app.selected = selected;
                bidInfoGrid.data.source = [];
                return;
            }

            var bids;

            if (selected.bids)
                bids = selected.bids;
            else
                bids = [];

            var bidding_time_list = [];

            bids.forEach(function(bid){
               bidding_time_list.push(bid.time);
            });

            if (!bidding_queue)
            {
                bidding_queue.forEach(function(bidding){
                        //add the prices in the queue to the bids list
                        if (bidding_time_list.indexOf(bidding.time)<0)
                            bids.push(bidding);
                });
            }

            console.log("bids as " + JSON.stringify(bids));

            bids.sort(bidComparator);

            if (selected.bids.length)
                if (!selected.quantity || selected.quantity==1)
                    selected.currentprice = selected.bids[selected.bids.length-1].price;
                else
                    if (selected.bids.length >= selected.quantity)
                        selected.currentprice = selected.bids[selected.bids.length-selected.quantity].price;

            app.selected = selected;

            bidInfoGrid.data.source = bids;

            bidInfoGrid.columns[0].renderer = function(cell) {
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

        };

        approveItemAjax.addEventListener('response',function(e){

            displayListAfterEvent(e);

        });

        //set the number of timeout
        var timeouts;
        var timer = null;
        var time;

        //processing statusupdate message in the bidding state
        socket.on('statusupdate', function(status){

            if (isBiddingAt('init') && (status.status != "BidMemberChange" || status.status != "PriceChange" ))
                return;

            var myid = socket.io.engine.id;

            console.log("status of the queue is "+ JSON.stringify(status));

            console.log("my id is " + myid + " my index is " + status.queue.indexOf(myid));

            if (status.queue[0] == myid) {

                var local_biding_form = {
                    price: Number(app.selected.currentprice) + Number(app.selected.increment),
                    email: null
                };

                app.bidingForm = local_biding_form;

                setBiddingState('bidding');
                //open the timer:
                time = 60;
                app.time = time;
                timeouts = 6;

                var timeoutFunc = function(){

                    if (!timer)
                        return;
                    time -= 10;
                    app.time = time;
                    timeouts--;
                    console.log("timeout #" + timeouts);
                    if (timeouts == 0 )
                    {
                        timer = null;
                        leaveBidding(null);
                    }else
                        timer=window.setTimeout(timeoutFunc, 10000);
                }
                timer = window.setTimeout(timeoutFunc,10000);
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
        });

        app.biding = function(event){
            //connected to the socket at the server
            //display a server message on console
            socket.emit('joinbid', app.selected.id);
            setBiddingState('waiting');
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
                if (timer) {
                    window.clearTimeout(timer);
                    console.log("timer cleared");
                    timer = null;
                }

                setBiddingState('init');

            }else{
                goHome();
            }
        };

        var bidToaster;

        app.submitbid = function(event){

            var bid = {};

            bidToaster = document.querySelector('#bidToaster');

            if (!app.bidingForm.email || !app.bidingForm.phone)
            {
                app.bidToaster = "Contact phone number and email address are required";
                bidToaster.show();
                return;
            }

            var bid_doc={
                id:app.selected.id,
                price:app.bidingForm.price,
                email:app.bidingForm.email,
                name:app.bidingForm.name,
                phone:app.bidingForm.phone
            };

            leaveBidding(bid_doc);
        };

        app.hasStatus=function(status){
            return typeof(status)!= "undefined";
        }
    });

})();
