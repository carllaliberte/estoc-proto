extends Control

const WINDOW := 0.85
const BOUT := 90.0

var hp := 100.0
var foe := 100.0
var clock := BOUT
var live := false
var tell_open := false
var answered := false
var incoming := ""
var tell_left := 0.0

@onready var you_mask: ColorRect = $Yard/You
@onready var foe_mask: ColorRect = $Yard/Foe
@onready var you_hp: Label = $Hud/YouHp
@onready var foe_hp: Label = $Hud/FoeHp
@onready var tell_lbl: Label = $Tell
@onready var bar: ColorRect = $Window/Fill
@onready var timer_lbl: Label = $Hud/Timer

func _ready() -> void:
	_bind_inputs()
	start_bout()

func _bind_inputs() -> void:
	_map("cut", [KEY_A, KEY_LEFT, KEY_1, KEY_Q], JOY_BUTTON_X)
	_map("read", [KEY_S, KEY_DOWN, KEY_2, KEY_W], JOY_BUTTON_A)
	_map("kill", [KEY_D, KEY_RIGHT, KEY_3, KEY_E], JOY_BUTTON_B)

func _map(action: String, keys: Array, joy: int) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action)
	else:
		InputMap.action_erase_events(action)
	for code in keys:
		var k := InputEventKey.new()
		k.physical_keycode = code
		InputMap.action_add_event(action, k)
	var pad := InputEventJoypadButton.new()
	pad.button_index = joy
	InputMap.action_add_event(action, pad)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_echo():
		return
	if event.is_action_pressed("cut"):
		answer("cut")
	elif event.is_action_pressed("read"):
		answer("read")
	elif event.is_action_pressed("kill"):
		answer("kill")

func start_bout() -> void:
	hp = 100.0
	foe = 100.0
	clock = BOUT
	live = true
	tell_open = false
	you_mask.position.x = 28.0
	foe_mask.position.x = 262.0
	tell_lbl.text = "Watch the mask."
	_paint()
	await get_tree().create_timer(0.5).timeout
	_open_tell()

func _process(dt: float) -> void:
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
	if not live:
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
	if not live:
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
	elif mine != "" and theirs == "":
		dmg_foe = 6.0 if mine != "read" else 0.0
		tell_lbl.text = "Too early."
		if mine != "read":
			_lunge(you_mask, 36.0)
	else:
		var great := (mine == "read" and theirs == "kill") or (mine == "kill" and theirs == "read")
		var ok := mine == theirs or (mine == "read" and theirs == "cut")
		if great:
			dmg_foe = 26.0
			tell_lbl.text = "Clean. Through."
			_lunge(you_mask, 48.0)
		elif ok:
			dmg_foe = 14.0
			dmg_you = 6.0
			tell_lbl.text = "Steel meets."
			_lunge(you_mask, 28.0)
			_lunge(foe_mask, -28.0)
		else:
			dmg_you = 16.0
			tell_lbl.text = "Wrong tell."
			_lunge(foe_mask, -40.0)
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

func _on_cut() -> void:
	answer("cut")

func _on_read() -> void:
	answer("read")

func _on_kill() -> void:
	answer("kill")
