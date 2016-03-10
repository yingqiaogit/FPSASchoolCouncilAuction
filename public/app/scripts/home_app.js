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

        app.signin = false;

        var screenNameCom = document.querySelector('#screenName');

        if (screenNameCom.textContent) {
            app.signin = true;
        }

        var retrieveListAjax = document.querySelector('#retrieveSponsorsCall');

        retrieveListAjax.addEventListener('response',function(event){

            var sponsors = event.detail.response.sponsors;

            console.log("sponsors:" + JSON.stringify(sponsors));
            app.sponsors = sponsors;
        });

        var getSponsors=function(){
            retrieveListAjax.generateRequest();
        };

        getSponsors();


    });

})();