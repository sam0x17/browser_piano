	function createHotSpot(x, y, width, height, onpress, onrelease)
	{
		var hotspot = new Object();
		hotspot.x = x;
		hotspot.y = y;
		hotspot.width = width;
		hotspot.height = height;
		hotspot.onpress = onpress;
		hotspot.onrelease = onrelease;
		gui_hotspots.push(hotspot);
	}


	function createAdvPushButton(text, fontsize, x, y, width, height, onclick)
	{
		var button = new Object();
		button.text = text;
		button.fontsize = fontsize;
		button.x = x;
		button.y = y;
		button.width = width;
		button.height = height;
		button.pressed = false;
		button.onclick = onclick;
		button.light = false;
		button.light_color = '';
		button.light_margin = 0;
		var onpress = function()
		{
			if(!button.pressed)
			{
				button.pressed = true;
				refresh_keys();
			}
		};
		var onrelease = function()
		{
			if(button.pressed)
			{
				button.pressed = false;
				refresh_keys();
				button.onclick();
			}
		};
		createHotSpot(x, y, width, height, onpress, onrelease);
		gui_buttons.push(button);
	}


	function createAdvToggleButton(text, fontsize, x, y, width, height, true_color, false_color, initial_value, onchange, light_margin)
	{
		var button = new Object();
		gui_buttons.push(button);
		button.text = text;
		button.fontsize = fontsize;
		button.x = x;
		button.y = y;
		button.width = width;
		button.height = height;
		button.pressed = false;
		button.onchange = onchange;
		button.light = true;
		button.toggle_value = initial_value;
		button.light_margin = light_margin;
		if(initial_value)
		{
			button.light_color = true_color;
		} else {
			button.light_color = false_color;
		}
		var onpress = function()
		{
			if(!button.pressed)
			{
				button.pressed = true;
				refresh_keys();
			}
		};
		var onrelease = function()
		{
			if(button.pressed)
			{
				button.pressed = false;
				if(button.toggle_value)
				{
					button.toggle_value = false;
					button.light_color = false_color;
				} else {
					button.toggle_value = true;
					button.light_color = true_color;
				}
				refresh_keys();
				button.onchange(button.toggle_value);
			}
		};
		createHotSpot(x, y, width, height, onpress, onrelease);
	}


	// advanced gui vars
	var img_adv_base;
	var img_adv_light_red;
	var img_adv_light_green;
	var img_adv_light_blue;
	var img_adv_light_purple;
	var img_adv_volume_slider;

	var saved_chords = new Array();

	var adv_screen_main = 'F3';
	var adv_screen_main_sharp = '#';
	var adv_screen_chord_quality = 'MIN';
	var adv_screen_inversion_num = 2;

	var adv_volume_slider_x = 100;
	var adv_volume_slider_y1 = 100;
	var adv_volume_slider_y2 = 150;

	var adv_button_settings_select_onclick = function()
	{
		selecting_bound_key = true;
	};

	var adv_system_label_keys_onchange = function(value)
	{
		console.debug('label keys: ' + value);
		keyboard_draw_labels = value;
		refresh_keys();
	};

	var adv_system_hifi_mode_onchange = function(value)
	{
		console.debug('Hi-Fi Mode: ' + value);
		refresh_keys();
	}


	function initAdvancedGUI()
	{
		img_adv_base = preloadImage('adv_base.png');
		img_adv_light_red = preloadImage('adv_light_red.png');
		img_adv_light_green = preloadImage('adv_light_green.png');
		img_adv_light_blue = preloadImage('adv_light_blue.png');
		img_adv_light_purple = preloadImage('adv_light_purple.png');
		img_adv_volume_slider = preloadImage('adv_volume_slider.png');

		gui_hotspots = new Array();
		gui_buttons = new Array();

		createAdvToggleButton(new Array('LABEL', 'KEYS'), 9, 205, 53, 48, 27, 'green', 'red', false, adv_system_label_keys_onchange, 0);
		createAdvToggleButton(new Array('Hi-Fi', 'MODE'), 9, 205, 86, 48, 27, 'green', 'red', true, adv_system_hifi_mode_onchange, 0);
		createAdvPushButton(new Array('SELECT'), 9, 269, 95, 60, 18, adv_button_settings_select_onclick);
	}


	function initSavedChords()
	{
		saved_chords = new Array();
		saved_chords.push(generateChord(NOTE.F, 2, QUALITY.MAJ, 1));
		saved_chords.push(generateChord(NOTE.G, 2, QUALITY.MAJ, 1));
		saved_chords.push(generateChord(NOTE.A, 3, QUALITY.MIN, 1));
		saved_chords.push(generateChord(NOTE.G, 2, QUALITY.MAJ, 0));
		saved_chords.push(generateChord(NOTE.C, 3, QUALITY.MAJ, 1));
		saved_chords.push(generateChord(NOTE.B, 2, QUALITY.MIN, 0));
		saved_chords.push(generateChord(NOTE.C, 2, QUALITY.MIN, 0));
		saved_chords.push(generateChord(NOTE.D, 2, QUALITY.MIN, 0));
		saved_chords.push(generateChord(NOTE.A, 2, QUALITY.DIM, 0));
		saved_chords.push(generateChord(NOTE.A, 2, QUALITY.AUG, 0));
		saved_chords.push(generateChord(NOTE.C, 2, QUALITY.MAJ, 0));
	}


	function drawAdvancedGUI()
	{
		// draw base
		keyboard_context.drawImage(img_adv_base, 0, 0);

		// draw screen text
		keyboard_context.font = '36px DS-DigitalBold';
		fillTextShadow(channel_count, 'rgba(0, 0, 0, 0.55)', 'rgba(0, 0, 0, 0.2)', 43, 73, 1, 1);

		keyboard_context.font = '30px DS-DigitalNormal';
		fillTextShadow(adv_screen_main_sharp, 'rgba(0, 0, 0, 0.55)', 'rgba(0, 0, 0, 0.2)', 79, 73, 1, 1);

		keyboard_context.font = '24px DS-DigitalNormal';
		fillTextShadow(adv_screen_chord_quality, 'rgba(0, 0, 0, 0.55)', 'rgba(0, 0, 0, 0.2)', 101, 73, 1, 1);

		// draw volume slider
		

		// draw all buttons
		for(var i = 0; i < gui_buttons.length; i++)
		{
			var button = gui_buttons[i];
			drawAdvButton(button.text,
										button.fontsize,
										button.x,
										button.y,
										button.width,
										button.height,
										button.pressed,
										button.light,
										button.light_color,
										button.light_margin);
		}

	}


	function drawAdvButton(text, fontsize, x, y, width, height, pressed, light, light_color, light_margin)
	{
		var old_fill_style = keyboard_context.fillStyle;
		var old_line_width = keyboard_context.lineWidth;
		var old_stroke_style = keyboard_context.strokeStyle;
		var old_text_baseline = keyboard_context.textBaseline;
		var old_text_align = keyboard_context.textAlign;
		var old_font = keyboard_context.font;
		var grad = keyboard_context.createLinearGradient(width / 2 + x, y, width / 2 + x, height + y);
		if(!pressed)
		{
			grad.addColorStop(0, '#262626');
			grad.addColorStop(1, '#121212');
		} else {
			grad.addColorStop(0, '#121212');
			grad.addColorStop(1, '#262626');
		}
		keyboard_context.fillStyle = grad;
		keyboard_context.fillRect(x, y, width, height);
		keyboard_context.lineWidth = 1;
      keyboard_context.strokeStyle = '#0d0d0d';
		keyboard_context.strokeRect(x + 0.5, y + 0.5, width - 1.0, height - 1.0);
		var light_x = x + light_margin;
		var light_y = (height - 17) / 2 + y;
		var text_color = '#979797';
		var text_bound_x = 1;
		var text_bound_y = 2;
		var text_bound_width = width - 2;
		var text_bound_height = height - 2;
		if(light)
		{
			text_bound_x += 12;
			text_bound_width -= 12;
			var light_img;
			switch(light_color)
			{
				case 'red':
					light_img = img_adv_light_red;
					break;
				case 'green':
					light_img = img_adv_light_green;
					break;
				case 'blue':
					light_img = img_adv_light_blue;
					break;
				case 'purple':
					light_img = img_adv_light_purple;
					break;
				default:
					light_img = img_adv_light_red;
			}
		}
		if(pressed)
		{
			text_color = '#7b7b7b';
		}
		if(light)
		{
			keyboard_context.drawImage(light_img, light_x, light_y);
		}
		keyboard_context.textBaseline = 'middle';
		keyboard_context.textAlign = 'center';
		keyboard_context.font = fontsize + 'px Arial';
		keyboard_context.fillStyle = text_color;
		var line_height = fontsize + 2;
		var text_x = x + text_bound_x + text_bound_width / 2;
		var text_y = y + text_bound_y + (text_bound_height - (line_height * text.length) / 2) / 2;
		if(text.length == 1)
		{
			text_y = y + text_bound_y + text_bound_height / 2;
		}
		if(pressed)
		{
			text_x += 1;
			text_y += 1;
		}
		for(var i = 0; i < text.length; i++)
		{
			keyboard_context.fillText(text[i], text_x, text_y + line_height * i);
		}
		keyboard_context.fillStyle = old_fill_style;
		keyboard_context.lineWidth = old_line_width;
		keyboard_context.strokeStyle = old_stroke_style;
		keyboard_context.textBaseline = old_text_baseline;
		keyboard_context.textAlign = old_text_align;
		keyboard_context.font = old_font;
	}


	function fillTextShadow(text, regular, shadow, x, y, offset_x, offset_y)
	{
		var old_fillStyle = keyboard_context.fillStyle;
		keyboard_context.fillStyle = shadow;
		keyboard_context.fillText(text, x + offset_x, y + offset_y);
		keyboard_context.fillStyle = regular;
		keyboard_context.fillText(text, x, y);
		keyboard_context.fillStyle = old_fillStyle;
	}


	function processAdvancedGUIKeyEvent(e, keydown)
	{
		//if(!keydown) alert("\nKeyCode: " + e.keyCode);
		var chord_index;
		if(e.keyCode == 48)
		{
			chord_index = 9;
		} else {
			chord_index = e.keyCode - 49;
		}
		var chord = saved_chords[chord_index];
		if(keydown)
		{
			chord.press();
		} else {
			chord.release();
		}
	}


	function processAdvancedGUIMouseEvent(mouse_pos, event_type, e)
	{
		for(var i = 0; i < gui_hotspots.length; i++)
		{
			var hotspot = gui_hotspots[i];
			if(mouse_pos.x >= hotspot.x &&
				 mouse_pos.y >= hotspot.y &&
				 mouse_pos.x <= hotspot.width + hotspot.x &&
				 mouse_pos.y <= hotspot.height + hotspot.y)
			{
				switch(event_type)
				{
					case MOUSE_EVENT.MOUSE_DOWN:
						if(e.button == 0)
						{
							// left click mouse down
							hotspot.onpress();
						} else if(e.button == 2) {
							// right click mouse down
							
						}
						break;
					case MOUSE_EVENT.MOUSE_UP:
						if(e.button == 0)
						{
							// left click mouse up
							hotspot.onrelease();
						} else if(e.button == 2) {
							// right click mouse up
							
						}
						break;
					case MOUSE_EVENT.MOUSE_MOVE:
						// mouse move
						
						break;
				}
			}
		}
	}
