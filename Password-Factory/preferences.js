"use strict";

const preferences = (() => {

	const MIN_PASSWORD_LENGTH = 16;
	const MAX_PASSWORD_LENGTH = 128;

	const PREF_CONFIG = {
		OPTIONS_OPEN:		{ name: "pref_optionsOpen",				default: false					},
		PASSWORD_LENGTH:	{ name: "pref_passwordLength",			default: MIN_PASSWORD_LENGTH	},
		INCLUDE_RESERVED:	{ name: "pref_includeReservedCharSet",	default: true					}
	};

	const localStorage = browser.storage.local;

	//////////////////////////////////////////////////////////////////////
	async function _setPreferenceValue(name, value) {
		await localStorage.set({ [name]: value });
	}

	//////////////////////////////////////////////////////////////////////
	async function _getPreferenceValue(name, defaultValue) {
		const result = await localStorage.get(name);
		return result[name] ?? defaultValue;
	}

	//////////////////////////////////////////////////////////////////////
	function _clampLength(value) {
		return Math.min(Math.max(value, MIN_PASSWORD_LENGTH), MAX_PASSWORD_LENGTH);
	}

	//////////////////////////////////////////////////////////////////////
	async function _setOptionsOpen(value)				{ await _setPreferenceValue(PREF_CONFIG.OPTIONS_OPEN.name, value); }
	async function _setPasswordLength(value)			{ await _setPreferenceValue(PREF_CONFIG.PASSWORD_LENGTH.name, _clampLength(value)); }
	async function _setIncludeReservedCharSet(value)	{ await _setPreferenceValue(PREF_CONFIG.INCLUDE_RESERVED.name, value); }

	//////////////////////////////////////////////////////////////////////
	async function _getOptionsOpen()			{ return _getPreferenceValue(PREF_CONFIG.OPTIONS_OPEN.name, PREF_CONFIG.OPTIONS_OPEN.default); }
	async function _getPasswordLength()			{ return _getPreferenceValue(PREF_CONFIG.PASSWORD_LENGTH.name, PREF_CONFIG.PASSWORD_LENGTH.default); }
	async function _getIncludeReservedCharSet()	{ return _getPreferenceValue(PREF_CONFIG.INCLUDE_RESERVED.name, PREF_CONFIG.INCLUDE_RESERVED.default); }

	return {
		MIN_PASSWORD_LENGTH: MIN_PASSWORD_LENGTH,
		MAX_PASSWORD_LENGTH: MAX_PASSWORD_LENGTH,

		setOptionsOpen: _setOptionsOpen,
		setPasswordLength: _setPasswordLength,
		setIncludeReservedCharSet: _setIncludeReservedCharSet,

		getOptionsOpen: _getOptionsOpen,
		getPasswordLength: _getPasswordLength,
		getIncludeReservedCharSet: _getIncludeReservedCharSet,
	}
})();
