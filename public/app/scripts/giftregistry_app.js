/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
var newRegister={
  amount: null,
  email: null
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

            giftList.forEach(function(gift, index){
               gift.index = index;
               gift.display = true;
               gift.registered = false;

            });

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
            app.giftList = JSON.parse(JSON.stringify(giftList));
            app.register = JSON.parse(JSON.stringify(newRegister));
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
            app.giftList = JSON.parse(JSON.stringify(giftList));
            app.register = JSON.parse(JSON.stringify(newRegister));
        };

        var registerAjax=document.querySelector('#registerCall');

        app.giftRegisterClick= function(event){

            console.log("The item is pressed");
            var item = event.model.item;

            //retrieve the item with the id
            //and open the item page
            //submit the contribution here

            var id = item.id;

            var registration = {
                id: id,
                pos: item.index,
                register: app.register
            }

            //submit the registration
            registerAjax.body = JSON.stringify(registration);

            console.log(registerAjax.body);

            registerAjax.generateRequest();

            var pos = item.index

            giftList[pos].display = true;
            giftList[pos].registered = true;

            //retrieve the item with the id
            //and open the item page
            app.giftList = JSON.parse(JSON.stringify(giftList));

            app.register = JSON.parse(JSON.stringify(newRegister));
        };

        registerAjax.addEventListener('response', function(event){

            var remain = event.detail.response.remain;

            var pos = event.detail.response.pos;

            giftList[pos].remain = remain;
            //retrieve the item with the id
            //and open the item page
            app.giftList = JSON.parse(JSON.stringify(giftList));

        });


    });

})();
