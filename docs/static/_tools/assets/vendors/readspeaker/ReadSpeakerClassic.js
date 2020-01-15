// <!--

if (! window.rsConf) { window.rsConf = {}; }
if (! window.rsConf.ui) { window.rsConf.ui = {}; }
window.rsConf.ui.rsbtnClass = 'rsbtn_classic';
window.rsConf.ui.player = [
	'<span id="rs_playerarea" class="rsbtn_playerarea">',
	'	<span class="rsbtn_topbar">',
	'		<a class="rsbtn_pause rsimg rspart" href="javascript:void(0);" title="Pause"><span class="rsbtn_btnlabel">Pause</span></a>',
	'		<a class="rsbtn_stop rsimg rspart" href="javascript:void(0);" title="Stop"><span class="rsbtn_btnlabel">Stop</span></a>',
	'		<span id="timeline" class="rsbtn_progress_container rsimg rspart rsloading">',
	'			<span class="rsbtn_progress_played rsimg"></span>',
	'			<span class="rsbtn_current_time">00:00:00</span><span class="rsbtn_time_separator"> | </span>',
	'			<span class="rsbtn_total_time">00:00:00</span>',
	'		</span>	',
	'		<a class="rsbtn_volume rsimg rspart" href="javascript:void(0);" title="Lautstärke"><span class="rsbtn_btnlabel">Lautstärke</a>',
	'		<span class="rsbtn_volume_container">',
	'			<span class="rsbtn_volume_slider"></span>',
	'		</span>',
	'		<a class="rsbtn_icon rspart" href="http://www.readspeaker.com" title="Sprachwiedergabe durch ReadSpeaker"></a>',
	'	</span>',
	'	<span class="defloater"></span>',
	'	<span id="bottomlinks" class="rsbtn_bottomlinks">',
	'		<!--a class="rsbtn_settings rspart" href="javascript:void(0);" title="Settings"><span class="rsbtn_btnlabel rsimg">Settings</span></a-->',
	'		<!--span class="rsbtn_separator rspart"> | </span-->',
	'		<a class="rsbtn_dl rspart" href="javascript:void(0);" title="Download MP3"><span class="rsbtn_btnlabel">Download mp3</span></a>',
	'		<span class="rsbtn_separator rspart"> | </span>',
	'		<span class="rsbtn_powered rspart"><span class="rsbtn_btnlabel">Powered by ReadSpeaker</span></span>',
	'		<span class="defloater"></span>',
	'	</span>',
	'	<a class="rsbtn_closer rsimg rspart" href="javascript:void(0);" title="Close Player"><span class="rsbtn_btnlabel">Schliessen></a>',
	'</span>',
	'<span class="defloater"></span>'
];
window.rsConf.ui.popupbutton = [
	'<a id="rs_selimg" class="rsbtn_play" accesskey="L" title="Listen with ReadSpeaker" href="">',
		'<span class="rsbtn_left rsimg rspart"><span class="rsbtn_text"><span>Listen</span></span></span>',
		'<span class="rsbtn_right rsimg rsplay rspart"></span>',
	'</a>'
];
window.rsConf.ui.popupplayer = [
   '<a class="rsbtn_pause rsimg rspart" href="javascript:void(0);" title="Pause"><span class="rsbtn_btnlabel">Pause</span></a>',
   '<a class="rsbtn_stop rsimg rspart" href="javascript:void(0);" title="Stop"><span class="rsbtn_btnlabel">Stop</span></a>',
   '<a class="rsbtn_icon rspart" href="http://www.readspeaker.com" title="Sprachwiedergabe durch ReadSpeaker"></a>',
   '<span class="rsbtn_separator rspart">&nbsp;&nbsp;&nbsp;</span>',
   '<!-- a class="rsbtn_settings rsimg rspart" href="javascript:void(0);" title="Settings"><span class="rsbtn_btnlabel">Settings</span></a -->',
   '<a class="rsbtn_closer rsimg rspart" href="javascript:void(0);" title="Close Player"><span class="rsbtn_btnlabel">Close</span></a>'
];

// -->