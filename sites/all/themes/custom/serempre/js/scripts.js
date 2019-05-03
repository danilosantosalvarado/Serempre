"use strict";
(function($, Drupal) {
	Drupal.behaviors.Script = {
		attach: function (context, settings) {

      ButtonBuscar();
      function ButtonBuscar (){
        $('.menu.nav .buscar').on('click', function () {
          $('.region-navigation #block-search-form').toggleClass('in');
        });
      }
		}
	}
})(jQuery, Drupal);

