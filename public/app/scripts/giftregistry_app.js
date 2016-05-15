/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
var newRegister={
  amount: 0,
  contribution: 0
};

var itemComparator= function(a,b){

    return a.priority - b.priority;
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

        var hostname = window.location.hostname;
        var localport = window.location.port?':'+window.location.port:'';

        var protocol=window.location.protocol? window.location.protocol:"http:";

        app.returnURL=protocol + '//' + hostname+localport+'/gifts/registersuccess';
        app.cancelReturnURL=protocol + '//'+ hostname+localport+'/gifts/registercancel';

        app.admin = false;

        var screenNameCom = document.querySelector('#screenName');

        if (screenNameCom.textContent) {
            app.admin = true;
        }

        var giftList;

        var retrieveListAjax = document.querySelector('#retrieveListCall');

        retrieveListAjax.addEventListener('response',function(event){

            giftList = event.detail.response.gifts;
            /*
             *   gifts= [
             *   {
             *      id:"cc40d0c389cb43e8fd6a641c9a1d24bf",       ,
             *      "title": "chair",
             *      "value": "80$",
             *      "number": "30",
             *      "remain": "29",
             *      "primary_url": "http://www.ikea.com/PIAimages/0376673_PE553886_S3.JPG"
             *   }
             *   ]
             */

            var target= 0;
            var totalGiftValue = 0;

            //order the giftList by the priority of fundraising
            giftList.sort(itemComparator);

            giftList.forEach(function(gift, index){
               gift.index = index;
               gift.display = true;
               gift.registered = false;
               target +=gift.value*gift.number;
               if (gift.totalGiftValue) {
                   totalGiftValue += gift.totalGiftValue;
                   var remain = gift.number - gift.totalGiftValue/gift.value
                   gift.remain=remain.toFixed(2);
               }
               else{
                   gift.remain=gift.number;
               }
            });

            app.target = target;
            app.totalGiftValue = totalGiftValue.toFixed(2);

            console.log("titles:" + JSON.stringify(giftList));


            app.giftList = giftList;
        });

        var openGiftList=function(){
            retrieveListAjax.generateRequest();
        };

        openGiftList();

        var selected;

        app.giftSelectorClick= function(event){

            console.log("The item is pressed");

            var item = event.model.item;

            item.display = false;
            var pos = item.index;

            giftList[pos].display = false;

            giftList[pos].registered = false;
            //retrieve the item with the id
            //and open the item page

            giftList[pos].register = JSON.parse(JSON.stringify(newRegister));

            app.giftList = JSON.parse(JSON.stringify(giftList));

        };

        app.leaveRegisterClick= function(event){

            console.log("The item is pressed");

            var item = event.model.item;

            item.display = false;
            var pos = item.index;

            giftList[pos].display = true;

            giftList[pos].registered = false;
            //retrieve the item with the id
            //and open the item page
            giftList[pos].register = JSON.parse(JSON.stringify(newRegister));
            app.giftList = JSON.parse(JSON.stringify(giftList));
        };

        app.concat=function(title,id){

            var concatString = title + ' (' + id +')';
            return concatString;
        }


    });

})();
