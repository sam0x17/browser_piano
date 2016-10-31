	// constants
	var NOTE =
	{
		A  : 0,
		AS : 1,
		B  : 2,
		C  : 3,
		CS : 4,
		D  : 5,
		DS : 6,
		E  : 7,
		F  : 8,
		FS : 9,
		G  : 10,
		GS : 11
	}

	var QUALITY =
	{
		MAJ : 0,
		MIN : 1,
		AUG : 2,
		DIM : 3
	}

	var MOUSE_EVENT =
	{
		MOUSE_DOWN : 0,
		MOUSE_UP : 1,
		MOUSE_MOVE : 2
	}

	// loading var
	var loading = 0;

	// canvas vars
	var keyboard_canvas;
	var keyboard_context;
	var keyboard_offset_x = 34;
	var keyboard_offset_y = 131;
	var keyboard_width = 956;
	var keyboard_height = 137;
	var keyboard_draw_labels = false;
	var hotspot_black_width = 18;
	var hotspot_black_height = 85;
	var hotspot_white_width = 34;
	var hotspot_white_height = 137;
	var mouse_key = null;
	var advanced_gui = true;

	// sound vars
	var min_channels = 0;
	var audio_format = 'ogg';
	var channel_count = 0;
	var global_volume = 0.8;

	// key vars
	var keys = new Array();
	var num_keys = 48;
	var start_octave = 2;
	var start_note = NOTE.C;
	var start_note_index = 27;
	var bound_chords = new Array();
	var all_chords = new Array();
	var a;

	// button vars
	var KEYMAP = new Array();
	var button_start_index = 22;
	var button_root_keycode = 65; //49
	var button_root_actual = 'A';
	var button_root_black = true;
	var highlight_bound_keys = false;
	var selecting_bound_key = false;
	var button_current_start_index = -1;


	function noteToString(note)
	{
		switch(note)
		{
			case NOTE.A: return "A";
			case NOTE.AS: return "A#";
			case NOTE.B: return "B";
			case NOTE.C: return "C";
			case NOTE.CS: return "C#";
			case NOTE.D: return "D";
			case NOTE.DS: return "D#";
			case NOTE.E: return "E";
			case NOTE.F: return "F";
			case NOTE.FS: return "F#";
			case NOTE.G: return "G";
			case NOTE.GS: return "G#";
			default: return "undefined";
		}
	}


	function noteToKeyIndex(note, octave)
	{
		return octave * 12 + note - start_note;
	}


	function generateChord(base_note, octave, quality, inversion)
	{
		var chord = new Object();
		var bni, sni, tni, key1, key2, key3;
		// bni = base note index, sni = secondary note index
		// tni = tertiary note index
		bni = noteToKeyIndex(base_note, octave);
		switch(quality)
		{
			case QUALITY.MAJ:
				sni = bni + 4;
				tni = sni + 3;
				break;
			case QUALITY.MIN:
				sni = bni + 3;
				tni = sni + 4;
				break;
			case QUALITY.AUG:
				sni = bni + 4;
				tni = sni + 4;
				break;
			case QUALITY.DIM:
				sni = bni + 3;
				tni = sni + 3;
		}
		switch(inversion)
		{
			case 0:
				key1 = keys[bni];
				key2 = keys[sni];
				key3 = keys[tni];
				break;
			case 1:
				key1 = keys[tni - 12];
				key2 = keys[bni];
				key3 = keys[sni];
				break;
			case 2:
				key1 = keys[sni - 12];
				key2 = keys[tni - 12];
				key3 = keys[bni];
				break;
		}
		chord.quality = quality;
		chord.base_note = base_note;
		chord.octave = octave;
		chord.inversion = inversion;
		chord.pressed = false;
		chord.keys = new Array();
		chord.keys.push(key1);
		chord.keys.push(key2);
		chord.keys.push(key3);
		chord.press = function() { onChordPress(chord); };
		chord.release = function() { onChordRelease(chord); };
		return chord;
	}


	function onChordPress(chord)
	{
		if(!chord.pressed)
		{
			chord.pressed = true;
			
			for(var i = 0; i < chord.keys.length; i++)
			{
				chord.keys[i].pressNoRefresh();
			}
			refresh_keys();
		}
	}


	function onChordRelease(chord)
	{
		if(chord.pressed)
		{
			chord.pressed = false;
			
			for(var i = 0; i < chord.keys.length; i++)
			{
				chord.keys[i].releaseNoRefresh();
			}
			refresh_keys();
		}
	}


	function setHighlightBoundKeys(value)
	{
		highlight_bound_keys = value;
		var cursor = KEYMAP[button_root_keycode];
		// first set them all to false to avoid glitches
		for(var i = 0; i < keys.length; i++)
		{
			keys[i].red = false;
		}
		// now set the correct ones
		while(true)
		{
			if(cursor.boundKey != null) cursor.boundKey.red = value;
			if(cursor.next == null) break;
			cursor = cursor.next;
		}
	}


	function preloadImage(url)
	{
		var img = new Image();
		loading++;
		img.onload = function()
		{
			loading--;
			if(loading == 0)
			{
				loading_done();
			}
		};
		var src = 'images/' + url;
		document.getElementById('loading_status').innerHTML = src;
		img.src = src;
		return img;
	}


	function audioFormatSupported(mimetype)
	{
		var a = document.createElement('audio');
		return !!(a.canPlayType && a.canPlayType(mimetype + ';').replace(/no/, ''));
	}


	function detectAudioSupport()
	{
		if(!audioFormatSupported('audio/ogg'))
		{
			alert('ogg not supported -- audio will not work');
		}
	}


	function isBlack(note)
	{
		switch(note)
		{
			case NOTE.AS:
			case NOTE.CS:
			case NOTE.DS:
			case NOTE.FS:
			case NOTE.GS:
				return true;
			default:
				return false;
		}
	}


	function generateKeyboardStructure()
	{
		var root = new Object();
		var last;
		root.prev = null;
		root.actual = button_root_actual;
		root.black = button_root_black;
		root.next = null;
		KEYMAP[button_root_keycode] = root;
		last = root;
		function addButton(actual, black, keyCode)
		{
			var button = new Object();
			button.prev = last;
			button.actual = actual;
			button.keyCode = keyCode;
			last.next = button;
			button.next = null;
			button.black = black;
			KEYMAP[keyCode] = button;
			last = button;
		}

		/*
		addButton('Q', false, 81);
		addButton('2', true, 50);
		addButton('W', false, 87);
		addButton('3', true, 51);
		addButton('E', false, 69);
		addButton('4', true, 52);
		addButton('R', false, 82);
		addButton('5', true, 53);
		addButton('T', false, 84);
		addButton('6', true, 54);
		addButton('Y', false, 89);
		addButton('7', true, 55);
		addButton('U', false, 85);
		addButton('8', true, 56);
		addButton('I', false, 73);
		addButton('9', true, 57);
		addButton('O', false, 79);
		addButton('0', true, 48);
		addButton('P', false, 80);
		addButton('-', true, 189);
		addButton('[', false, 219);
		addButton('=', true, 187);
		addButton(']', false, 221);
		*/
		addButton('Z', false, 90);
		addButton('S', true, 83);
		addButton('X', false, 88);
		addButton('D', true, 68);
		addButton('C', false, 67);
		addButton('F', true, 70);
		addButton('V', false, 86);
		addButton('G', true, 71);
		addButton('B', false, 66);
		addButton('H', true, 72);
		addButton('N', false, 78);
		addButton('J', true, 74);
		addButton('M', false, 77);
		addButton('K', true, 75);
		addButton(',', false, 188);
		addButton('L', true, 76);
		addButton('.', false, 190);
		addButton(';', true, 59);
		addButton('/', false, 191);
	}


	function bindButtons(startKeyIndex)
	{
		var cursor = KEYMAP[button_root_keycode];
		var currentKey = keys[startKeyIndex];
		while(true)
		{
			cursor.boundKey = null;
			if(currentKey.black == cursor.black)
			{
				cursor.boundKey = currentKey; // bind to key
				// move to next key
				startKeyIndex++;
				if(startKeyIndex > keys.length - 1) break;
				currentKey = keys[startKeyIndex];
			}
			// move to next button
			if(cursor.next == null) break;
			cursor = cursor.next;
		}
		button_current_start_index = startKeyIndex;
	}


	var channel_cleaner = function()
	{
		var old_count = channel_count;
		channel_count = 0;
		for(var i = 0; i < keys.length; i++)
		{
			for(var i2 = 0; i2 < keys[i].sound_channels.length; i2++)
			{
				channel_count++;
				var sound_channel = keys[i].sound_channels[i2];
				if(sound_channel.BUSY == false && keys[i].sound_channels.length > min_channels)
				{
					keys[i].sound_channels.splice(i2, 1);
				} else if(sound_channel.ended) {
					sound_channel.BUSY = false; // get it on the next pass to avoid choking
				}
			}
		}
		if(old_count != channel_count) refresh_keys();
	}


	function initKeys(startNote, initialIndex, initialOctave, numKeys)
	{
		var key = new Object();
		key.id = keys.length;
		key.octave = initialOctave;
		key.note = startNote;
		key.noteString = noteToString(key.note);
		key.black = isBlack(key.note);
		key.pressed = false;
		key.red = false;
		key.pressed_channel = null;
		key.hotspot_x = 0;

		// load sound template
		key.path = 'sounds/brilliant_piano_1/' + initialIndex + '_' + key.noteString.replace('#', 'S');
		if(key.path.charAt(key.path.length - 1) != 'S')
		{
			key.path += "_";
		}
		key.path += "_";
		if(initialOctave < 10)
		{
			key.path += "0";
		}
		key.path += initialOctave + '_160.ogg';
		key.sound = document.createElement('audio');

		var key_loaded_func = function()
		{
			loading--;
			if(loading == 0)
			{
				loading_done();
			}
		};

		loading++;
		key.sound.addEventListener("canplaythrough", key_loaded_func, false);

		document.getElementById('loading_status').innerHTML = key.path;
		key.sound.setAttribute('preload', 'auto');
		key.sound.setAttribute('src', key.path); // sound will now start loading
		key.sound.load();

		// setup sound effect channels
		key.sound_channels = new Array();
		for(var i = 0; i < min_channels; i++)
		{
			key.sound_channels.push(key.sound.cloneNode());
			key.sound_channels[key.sound_channels.length - 1].BUSY = false;
		}

		// setup pressing events
		key.press = function() { onKeyPress(key, true); };
		key.release = function() { onKeyRelease(key, true); };
		key.pressNoRefresh = function() { onKeyPress(key, false); };
		key.releaseNoRefresh = function() { onKeyRelease(key, false); };

		// fnish up and do recursion
		keys.push(key);
		if(key.id + 1 < numKeys)
		{
			startNote++;
			if(startNote > 11)
			{
				startNote = 0;
				initialOctave++;
			}
			initKeys(startNote, initialIndex + 1, initialOctave, numKeys);
		}
	}


	function onKeyPress(key, refresh)
	{
		if(!key.pressed)
		{
			key.pressed = true;
			if(refresh) refresh_keys();
			var sound_instance = null;
			for(var i = 0; i < key.sound_channels.length; i++)
			{
				// find an unused channel
				if(key.sound_channels[i].BUSY == false)
				{
					sound_instance = key.sound_channels[i];
					break;
				}
			}
			if(sound_instance == null)
			{
				// must create a new channel
				sound_instance = key.sound.cloneNode();
				key.sound_channels.push(sound_instance);
			}
			sound_instance.BUSY = true;
			setChannelVolume(sound_instance, 1.0);
			key.pressed_channel = sound_instance;
			sound_instance.play();
		}
	}


	function setChannelVolume(channel, volume)
	{
		var dest_volume = volume * global_volume;
		if(channel.volume != dest_volume) channel.volume = dest_volume;
	}

	function getChannelVolume(channel)
	{
		return channel.volume / global_volume;
	}


	function fadeout(channel)
	{
		var val = getChannelVolume(channel);
		val = val - 1.0 / 5.0;
		if(val < 0.0) val = 0.0;
		setChannelVolume(val);
		if(channel.ended)
		{
			go_delete(channel);
			return;
		}
		if(channel.volume <= 0.01)
		{
			var go_delete_func = function()
			{
				go_delete(channel);
			};
			setTimeout(go_delete_func, 200);
		} else {
			var fadeout_func = function()
			{
				fadeout(channel);
			};
			setTimeout(fadeout_func, 600 / 5);
		}
	}


	function go_delete(channel)
	{
		channel.pause();
		channel.currentTime = 0.0;
		setChannelVolume(channel, 1.0);
		channel.BUSY = false;
	}


	function onKeyRelease(key, refresh)
	{
		if(key.pressed)
		{
			key.pressed = false;
			if(refresh) refresh_keys();
			var released_channel = key.pressed_channel;
			key.pressed_channel = null;
			fadeout(released_channel);
		}
	}


	var canvas_keydown = function(e)
	{
		var mapped_key = KEYMAP[e.keyCode];
		if(mapped_key != null)
		{
			if(mapped_key.boundKey != null)
			{
				mapped_key.boundKey.press();
			}
		} else {
			processAdvancedGUIKeyEvent(e, true);
		}
		return false;
	}


	var canvas_keyup = function(e)
	{
		var mapped_key = KEYMAP[e.keyCode];
		if(mapped_key != null)
		{
			if(mapped_key.boundKey != null)
			{
				mapped_key.boundKey.release();
			}
		} else {
			processAdvancedGUIKeyEvent(e, false);
		}
		return false;
	}


	var canvas_selectstart = function(e) { return false; };
	var canvas_selectionchange = function(e) { return false; };
	var canvas_select = function(e) { return false; };

	
	var canvas_mousedown = function(e)
	{
		processCanvasMouseEvent(e, MOUSE_EVENT.MOUSE_DOWN);
		return false;
	};


	var canvas_mouseup = function(e)
	{
		processCanvasMouseEvent(e, MOUSE_EVENT.MOUSE_UP);
		return false;
	};


	var canvas_mousemove = function(e)
	{
		processCanvasMouseEvent(e, MOUSE_EVENT.MOUSE_MOVE);
	};


	var window_mouseup = function(e)
	{
		if(mouse_key != null)
		{
			mouse_key.release();
			mouse_key = null;
		}
	};


	function processCanvasMouseEvent(e, event_type) // 0 = mousedown, 1 = mouseup, 2 = mousemove
	{
		var mouse_pos = getMousePos(e);
		var canvas_pos = findPos(keyboard_canvas);
		mouse_pos.x -= canvas_pos.x;
		mouse_pos.y -= canvas_pos.y;
		if(mouse_pos.x < keyboard_offset_x ||
			 mouse_pos.y < keyboard_offset_y ||
			 mouse_pos.x > keyboard_offset_x + keyboard_width ||
			 mouse_pos.y > keyboard_offset_y + keyboard_height)
		{
			// event is on the GUI
			processAdvancedGUIMouseEvent(mouse_pos, event_type, e);
		} else {
			// event is on a piano key
			mouse_pos.x -= keyboard_offset_x;
			mouse_pos.y -= keyboard_offset_y;
			var key = null;
			var key_index = -1;
			for(var i = 0; i < keys.length; i++)
			{
				// look through black keys looking for a match
				key = keys[i];
				if(key.black)
				{
					if(mouse_pos.x >= key.hotspot_x &&
						 mouse_pos.x <= key.hotspot_x + hotspot_black_width &&
						 mouse_pos.y >= 0 &&
						 mouse_pos.y <= hotspot_black_height)
					{
						key_index = i;
						break;
					}
				}
				key = null;
			}
			if(key == null)
			{
				for(var i = 0; i < keys.length; i++)
				{
					// loop through white keys looking for a match
					key = keys[i];
					if(!key.black)
					{
						if(mouse_pos.x >= key.hotspot_x &&
							 mouse_pos.x <= key.hotspot_x + hotspot_white_width &&
							 mouse_pos.y >= 0 &&
							 mouse_pos.y <= hotspot_white_height)
						{
							key_index = i;
							break;
						}
					}
					key = null;
				}
			}
			if(key != null)
			{
				switch(event_type)
				{
					case MOUSE_EVENT.MOUSE_DOWN:
						if(e.button == 0)
						{
							// left click mouse down
							key.press();
							mouse_key = key;
						} else if(e.button == 2) {
							// right click mouse down
							if(selecting_bound_key)
							{
								selecting_bound_key = false;
								setHighlightBoundKeys(false);
								refresh_keys();
							}
						}
						break;
					case MOUSE_EVENT.MOUSE_UP:
						if(e.button == 0)
						{
							// left click mouse up
							//key.release(); // not actually needed
							//mouse_key = null;
						} else if(e.button == 2) {
							// right click mouse up
							
						}
						break;
					case MOUSE_EVENT.MOUSE_MOVE:
						if(selecting_bound_key)
						{
							if(button_current_start_index != key_index)
							{
								setHighlightBoundKeys(false);
								bindButtons(key_index);
								setHighlightBoundKeys(true);
								refresh_keys();
							}
						}
						break;
				}
			}
		}
	}


	/* finds the position of a mouse event
		 relative to the start of the document */			
	function getMousePos(e)
	{
		var posx = 0;
		var posy = 0;
		if(!e) var e = window.event;
		if(e.pageX || e.pageY)
		{
			posx = e.pageX;
			posy = e.pageY;
		} else if(e.clientX || e.clientY) {
			posx = e.clientX + document.body.scrollLeft
						 + document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop
						 + document.documentElement.scrollTop;
		}
		var pos_info = new Object();
		pos_info.x = posx;
		pos_info.y = posy;
		return pos_info;
	}


	/* finds the position of a DOM element
		relative to the start of the document */
	function findPos(obj)
	{
		var obj2 = obj;
		var curtop = 0;
		var curleft = 0;
		if(document.getElementById || document.all)
		{
			do
			{
				curleft += obj.offsetLeft-obj.scrollLeft;
				curtop += obj.offsetTop-obj.scrollTop;
				obj = obj.offsetParent;
				obj2 = obj2.parentNode;
				while(obj2!=obj)
				{
					curleft -= obj2.scrollLeft;
					curtop -= obj2.scrollTop;
					obj2 = obj2.parentNode;
				}
			} while(obj.offsetParent)
		} else if(document.layers) {
			curtop += obj.y;
			curleft += obj.x;
		}
		var pos_info = new Object();
		pos_info.x = curleft;
		pos_info.y = curtop;
		return pos_info;
	}


	// image resources
	var img_black_key_normal;
	var img_black_key_pressed;
	var img_black_key_red_normal;
	var img_black_key_red_pressed;
	var img_white_key_normal;
	var img_white_key_pressed;
	var img_white_key_red_normal;
	var img_white_key_red_pressed;
	


	function init(advanced)
	{
		advanced_gui = advanced;

		// load document element variables
		keyboard_canvas = document.getElementById('keyboard_canvas');
		keyboard_context = keyboard_canvas.getContext("2d");
		keyboard_context.fillStyle = "#000000";
		keyboard_context.font = "normal 12px Verdana";

		// install event listeners
		window.addEventListener('keydown', canvas_keydown, false);
		window.addEventListener('keyup', canvas_keyup, false);
		window.addEventListener('mouseup', window_mouseup, false);
		keyboard_canvas.addEventListener('mousedown', canvas_mousedown, false);
		keyboard_canvas.addEventListener('mouseup', canvas_mouseup, false);
		keyboard_canvas.addEventListener('mousemove', canvas_mousemove, false);
		keyboard_canvas.addEventListener('selectstart', canvas_selectstart, false);
		keyboard_canvas.addEventListener('selectionchange', canvas_selectionchange, false);
		keyboard_canvas.addEventListener('select', canvas_select, false);

		// load images
		img_black_key_normal = preloadImage('black_key_normal.png');
		img_black_key_pressed = preloadImage('black_key_pressed.png');
		img_black_key_red_normal = preloadImage('black_key_red_normal.png');
		img_black_key_red_pressed = preloadImage('black_key_red_pressed.png');
		img_white_key_normal = preloadImage('white_key_normal.png');
		img_white_key_pressed = preloadImage('white_key_pressed.png');
		img_white_key_red_normal = preloadImage('white_key_red_normal.png');
		img_white_key_red_pressed = preloadImage('white_key_red_pressed.png');

		// resolve audio support issues
		detectAudioSupport();

		// load GUI images
		if(advanced_gui)
		{
			initAdvancedGUI();
		} else {
			initSimpleGUI();
		}

		start();

		if(advanced_gui)
		{
			initSavedChords();
		}
	}


	function start()
	{
		// setup keyboard button data struture
		generateKeyboardStructure();
		
		// setup keyboard
		initKeys(start_note, start_note_index, start_octave, num_keys);

		// bind buttons to keyboard
		bindButtons(button_start_index);

		// start channel cleaner
		setInterval(channel_cleaner, 100);

		// start font fix
		setInterval(refresh_keys, 500);
	}


	function reset()
	{
		KEYMAP = new Array();
		keys = new Array();
		bound_chords = new Array();
		all_chords = new Array();
		clearInterval(channel_cleaner);
		clearInterval(refresh_keys);
		gui_hotspots = new Array();
		gui_buttons = new Array();
		start();
	}

	function refresh_keys()
	{
		keyboard_canvas.width = keyboard_canvas.width;
		var x = keyboard_offset_x;
		keyboard_context.font = "normal 12px Verdana";

		for(var i = 0; i < keys.length; i++)
		{
			var key = keys[i];
			if(!key.black)
			{
				if(key.pressed)
				{
					if(!key.red)
					{
						keyboard_context.drawImage(img_white_key_pressed, x, keyboard_offset_y);
					} else {
						keyboard_context.drawImage(img_white_key_red_pressed, x, keyboard_offset_y);
					}
					if(keyboard_draw_labels)
					{
						keyboard_context.fillStyle = "#585858";
						keyboard_context.fillText(key.noteString, x + 16, 127 + keyboard_offset_y);
					}
				} else {
					if(!key.red)
					{
						keyboard_context.drawImage(img_white_key_normal, x, keyboard_offset_y);
					} else {
						keyboard_context.drawImage(img_white_key_red_normal, x, keyboard_offset_y);
					}
					if(keyboard_draw_labels)
					{
						keyboard_context.fillStyle = "#888888";
						keyboard_context.fillText(key.noteString, x + 16, 126 + keyboard_offset_y);
					}
				}
				key.hotspot_x = x - keyboard_offset_x;
			}
			if(i + 1 < keys.length)
			{
				if(keys[i + 1].black == false && key.black == false)
				{
					x += 34;
				} else {
					x += 17;
				}
			}
		}
		keyboard_context.font = "normal 8px Verdana";
		x = keyboard_offset_x;
		for(var i = 0; i < keys.length; i++)
		{
			var key = keys[i];
			if(key.black)
			{
				if(key.pressed)
				{
					if(!key.red)
					{
						keyboard_context.drawImage(img_black_key_pressed, x, keyboard_offset_y);
					} else {
						keyboard_context.drawImage(img_black_key_red_pressed, x, keyboard_offset_y);
					}
					if(keyboard_draw_labels)
					{
						keyboard_context.fillStyle = "#D0D0D0";
						keyboard_context.fillText(key.noteString, x + 15, 72 + keyboard_offset_y);
					}
				} else {
					if(!key.red)
					{
						keyboard_context.drawImage(img_black_key_normal, x, keyboard_offset_y);
					} else {
						keyboard_context.drawImage(img_black_key_red_normal, x, keyboard_offset_y);
					}
					if(keyboard_draw_labels)
					{
						keyboard_context.fillStyle = "#909090";
						keyboard_context.fillText(key.noteString, x + 15, 68 + keyboard_offset_y);
					}
				}
				key.hotspot_x = x + 11 - keyboard_offset_x;
			}
			if(i + 1 < keys.length)
			{
				if(keys[i + 1].black == false && key.black == false)
				{
					x += 34;
				} else {
					x += 17;
				}
			}
		}
		drawAdvancedGUI();
	}


	function loading_done()
	{
		//alert('loading done');
		document.getElementById('loading_status').innerHTML = 'done';
		document.getElementById('loading').style.display = 'none';
		keyboard_canvas.style.display = 'inline';
		refresh_keys();
		a = generateChord(NOTE.A, 2, QUALITY.MIN, 1);
		alert(keys.length);
	}


	// general GUI vars
	var gui_hotspots = new Array();
	var gui_buttons = new Array();
