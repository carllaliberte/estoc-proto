extends Control

const WINDOW := 0.85
const BOUT := 90.0
const HOLD_MS := 450
const STICK_ON := 0.55
const STICK_OFF := 0.28
const STICK_BIAS := 1.25
const SAVE_PATH := "user://estoc_inputs.cfg"
const NAMES := {"cut": "Line", "read": "Measure", "kill": "Opening"}
const JOY_LABEL := {
	JOY_BUTTON_A: "A", JOY_BUTTON_B: "B", JOY_BUTTON_X: "X", JOY_BUTTON_Y: "Y",
	JOY_BUTTON_LEFT_SHOULDER: "LB", JOY_BUTTON_RIGHT_SHOULDER: "RB",
	JOY_BUTTON_DPAD_LEFT: "D<", JOY_BUTTON_DPAD_DOWN: "Dv", JOY_BUTTON_DPAD_RIGHT: "D>"
}
const DEFAULTS := {
	"cut": {"keys": [KEY_A, KEY_LEFT, KEY_1, KEY_Q], "joys": [JOY_BUTTON_X, JOY_BUTTON_DPAD_LEFT, JOY_BUTTON_LEFT_SHOULDER]},
	"read": {"keys": [KEY_S, KEY_DOWN, KEY_2, KEY_W], "joys": [JOY_BUTTON_A, JOY_BUTTON_DPAD_DOWN]},
	"kill": {"keys": [KEY_D, KEY_RIGHT, KEY_3, KEY_E], "joys": [JOY_BUTTON_B, JOY_BUTTON_DPAD_RIGHT, JOY_BUTTON_RIGHT_SHOULDER]}
}

var hp := 100.0
var foe := 100.0
var clock := BOUT
var live := false
var tell_open := false
var answered := false
var incoming := ""
var tell_left := 0.0
var listen_for := ""
var hold_kind := ""
var hold_ms := 0
var last_device := "touch"
var stick_latched := ""
var pad_id := 0

@onready var you_mask: ColorRect = $Yard/You
@onready var foe_mask: ColorRect = $Yard/Foe
@onready var you_hp: Label = $Hud/YouHp
@onready var foe_hp: Label = $Hud/FoeHp
@onready var tell_lbl: Label = $Tell
@onready var bar: ColorRect = $Window/Fill
@onready var timer_lbl: Label = $Hud/Timer
@onready var btn_cut: Button = $Row/Cut
@onready var btn_read: Button = $Row/Read
@onready var btn_kill: Button = $Row/Kill

func _ready() -> void:
	_bind_defaults()
	_load_binds()
	_wire_buttons()
	_refresh_labels()
	Input.joy_connection_changed.connect(_on_joy)
	_pick_pad()
	start_bout()

func _on_joy(device: int, connected: bool) -> void:
	if connected:
		pad_id = device
		last_device = "pad"
		_refresh_labels()
		tell_lbl.text = Input.get_joy_name(device)
	else:
		_pick_pad()

func _pick_pad() -> void:
	var pads := Input.get_connected_joypads()
	pad_id = pads[0] if pads.size() else 0

func _bind_defaults() -> void:
	for action in DEFAULTS.keys():
		_set_action(action, DEFAULTS[action]["keys"], DEFAULTS[action]["joys"])

func _set_action(action: String, keys: Array, joys: Array) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action)
	else:
		InputMap.action_erase_events(action)
	for code in keys:
		var k := InputEventKey.new()
		k.physical_keycode = code
		InputMap.action_add_event(action, k)
	for j in joys:
		var pad := InputEventJoypadButton.new()
		pad.button_index = j
		InputMap.action_add_event(action, pad)

func _wire_buttons() -> void:
	for pair in [[btn_cut, "cut"], [btn_read, "read"], [btn_kill, "kill"]]:
		var b: Button = pair[0]
		var kind: String = pair[1]
		for sig in [b.pressed, b.button_down, b.button_up]:
			for c in sig.get_connections():
				sig.disconnect(c.callable)
		b.button_down.connect(_on_hold_start.bind(kind))
		b.button_up.connect(_on_hold_end.bind(kind))

func _on_hold_start(kind: String) -> void:
	hold_kind = kind
	hold_ms = Time.get_ticks_msec()

func _on_hold_end(kind: String) -> void:
	if hold_kind != kind:
		return
	var held := Time.get_ticks_msec() - hold_ms
	hold_kind = ""
	if listen_for != "":
		return
	if held >= HOLD_MS:
		listen_for = kind
		last_device = "touch"
		tell_lbl.text = "Next key or pad binds " + NAMES[kind] + "."
	else:
		last_device = "touch"
		answer(kind)

func _input(event: InputEvent) -> void:
	if listen_for == "":
		return
	if event is InputEventKey and event.pressed and not event.echo:
		_assign_key(listen_for, event.physical_keycode)
		get_viewport().set_input_as_handled()
	elif event is InputEventJoypadButton and event.pressed:
		_assign_joy(listen_for, event.button_index)
		get_viewport().set_input_as_handled()

func _assign_key(action: String, code: int) -> void:
	last_device = "keyboard"
	_set_action(action, [code], _joys_of(action))
	_finish_bind(action)

func _assign_joy(action: String, joy: int) -> void:
	last_device = "pad"
	var keys := _keys_of(action)
	if keys.is_empty():
		keys = DEFAULTS[action]["keys"]
	_set_action(action, keys, [joy])
	_finish_bind(action)

func _finish_bind(action: String) -> void:
	listen_for = ""
	_save_binds()
	_refresh_labels()
	tell_lbl.text = NAMES[action] + " bound. Watch the mask."

func _keys_of(action: String) -> Array:
	var out: Array = []
	for ev in InputMap.action_get_events(action):
		if ev is InputEventKey:
			out.append(ev.physical_keycode)
	return out

func _joys_of(action: String) -> Array:
	var out: Array = []
	for ev in InputMap.action_get_events(action):
		if ev is InputEventJoypadButton:
			out.append(ev.button_index)
	return out if out.size() else DEFAULTS[action]["joys"]

func _joy_of(action: String) -> int:
	return int(_joys_of(action)[0])

func _hint(action: String) -> String:
	if last_device == "pad":
		return str(JOY_LABEL.get(_joy_of(action), "pad"))
	var keys := _keys_of(action)
	return OS.get_keycode_string(keys[0]) if keys.size() else "-"

func _refresh_labels() -> void:
	btn_cut.text = "Line\n" + _hint("cut")
	btn_read.text = "Measure\n" + _hint("read")
	btn_kill.text = "Opening\n" + _hint("kill")

func _save_binds() -> void:
	var cfg := ConfigFile.new()
	for action in ["cut", "read", "kill"]:
		var keys := _keys_of(action)
		cfg.set_value(action, "key", keys[0] if keys.size() else 0)
		cfg.set_value(action, "joy", _joy_of(action))
	cfg.save(SAVE_PATH)

func _load_binds() -> void:
	var cfg := ConfigFile.new()
	if cfg.load(SAVE_PATH) != OK:
		return
	for action in ["cut", "read", "kill"]:
		var key := int(cfg.get_value(action, "key", 0))
		var joy := int(cfg.get_value(action, "joy", -1))
		var keys: Array = [key] if key != 0 else DEFAULTS[action]["keys"]
		var joys: Array = [joy] if joy >= 0 else DEFAULTS[action]["joys"]
		_set_action(action, keys, joys)

func _unhandled_input(event: InputEvent) -> void:
	if listen_for != "" or event.is_echo():
		return
	if event is InputEventJoypadButton and event.pressed:
		pad_id = event.device
	if event.is_action_pressed("cut"):
		last_device = "pad" if event is InputEventJoypadButton else "keyboard"
		_refresh_labels()
		answer("cut")
	elif event.is_action_pressed("read"):
		last_device = "pad" if event is InputEventJoypadButton else "keyboard"
		_refresh_labels()
		answer("read")
	elif event.is_action_pressed("kill"):
		last_device = "pad" if event is InputEventJoypadButton else "keyboard"
		_refresh_labels()
		answer("kill")

func _stick_kind() -> String:
	var v := Vector2(Input.get_joy_axis(pad_id, JOY_AXIS_LEFT_X), Input.get_joy_axis(pad_id, JOY_AXIS_LEFT_Y))
	var mag := v.length()
	if mag < STICK_OFF:
		stick_latched = ""
		return ""
	if stick_latched != "" or mag < STICK_ON:
		return ""
	var ax := absf(v.x)
	var ay := absf(v.y)
	if ax >= ay * STICK_BIAS:
		return "cut" if v.x < 0.0 else "kill"
	if v.y > 0.0 and ay >= ax * STICK_BIAS:
		return "read"
	return ""

func _rumble(heavy: bool) -> void:
	if Input.get_connected_joypads().is_empty():
		return
	Input.start_joy_vibration(pad_id, 0.25 if heavy else 0.08, 0.7 if heavy else 0.2, 0.09)

func start_bout() -> void:
	hp = 100.0
	foe = 100.0
	clock = BOUT
	live = true
	tell_open = false
	stick_latched = ""
	you_mask.position.x = 28.0
	foe_mask.position.x = 262.0
	var pads := Input.get_connected_joypads()
	tell_lbl.text = Input.get_joy_name(pads[0]) if pads.size() else "Watch the mask. Hold a button to rebind."
	_paint()
	await get_tree().create_timer(0.5).timeout
	_open_tell()

func _process(dt: float) -> void:
	if listen_for == "" and live:
		var flick := _stick_kind()
		if flick != "":
			stick_latched = flick
			last_device = "pad"
			_refresh_labels()
			answer(flick)
	if not live:
		return
	clock -= dt
	timer_lbl.text = "%d:%02d" % [int(clock) / 60, int(clock) % 60]
	if clock <= 0.0:
		_end(hp >= foe)
		return
	if tell_open:
		tell_left -= dt
		bar.scale.x = max(0.0, tell_left / WINDOW)
		if tell_left <= 0.0 and not answered:
			_resolve("", incoming)

func _open_tell() -> void:
	if not live or listen_for != "":
		return
	var roll := randf()
	if roll < 0.45:
		incoming = "cut"
	elif roll < 0.75:
		incoming = "read"
	else:
		incoming = "kill"
	tell_open = true
	answered = false
	tell_left = WINDOW
	bar.scale.x = 1.0
	var word := {"cut": "Line coming.", "read": "Holds measure.", "kill": "Looks for blood."}[incoming]
	tell_lbl.text = "Newsteel: " + word

func answer(kind: String) -> void:
	if not live or listen_for != "":
		return
	if tell_open and not answered:
		answered = true
		tell_open = false
		_resolve(kind, incoming)
		return
	if not tell_open:
		_resolve(kind, "")

func _resolve(mine: String, theirs: String) -> void:
	tell_open = false
	var dmg_you := 0.0
	var dmg_foe := 0.0
	if mine == "" and theirs != "":
		dmg_you = 18.0 if theirs == "kill" else (12.0 if theirs == "cut" else 6.0)
		tell_lbl.text = "Late. You eat it."
		_lunge(foe_mask, -36.0)
		_rumble(true)
	elif mine != "" and theirs == "":
		dmg_foe = 6.0 if mine != "read" else 0.0
		tell_lbl.text = "Too early."
		if mine != "read":
			_lunge(you_mask, 36.0)
			_rumble(false)
	else:
		var great := (mine == "read" and theirs == "kill") or (mine == "kill" and theirs == "read")
		var ok := mine == theirs or (mine == "read" and theirs == "cut")
		if great:
			dmg_foe = 26.0
			tell_lbl.text = "Clean. Through."
			_lunge(you_mask, 48.0)
			_rumble(false)
		elif ok:
			dmg_foe = 14.0
			dmg_you = 6.0
			tell_lbl.text = "Steel meets."
			_lunge(you_mask, 28.0)
			_lunge(foe_mask, -28.0)
			_rumble(false)
		else:
			dmg_you = 16.0
			tell_lbl.text = "Wrong tell."
			_lunge(foe_mask, -40.0)
			_rumble(true)
	hp = max(0.0, hp - dmg_you)
	foe = max(0.0, foe - dmg_foe)
	_paint()
	if hp <= 0.0 or foe <= 0.0:
		_end(foe <= 0.0 and hp >= foe)
		return
	await get_tree().create_timer(0.7).timeout
	_open_tell()

func _lunge(node: ColorRect, dx: float) -> void:
	var origin := node.position.x
	node.position.x = origin + dx
	await get_tree().create_timer(0.14).timeout
	node.position.x = origin

func _paint() -> void:
	you_hp.text = str(int(hp))
	foe_hp.text = str(int(foe))

func _end(win: bool) -> void:
	live = false
	tell_lbl.text = "Victory." if win else "Defeat. Still standing."
