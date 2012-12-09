/*$(document).ready(function() {
	$('#slider').cycle({ fx:'fade', speed:2000, timeout:2000});
});
*/
$(document).ready(function() {
	$('#slider').cycle({
		fx: 'fade' // choose your transition type, ex: fade, scrollUp, shuffle, etc...
	});
	
	$("a#example").fancybox();
});