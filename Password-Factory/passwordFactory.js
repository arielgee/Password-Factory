"use strict";

const passwordFactory = (() => {

	const BASE_CHAR_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(),.~:-_=+";
	const RESERVED_CHAR_SET = "'`[]{}/;?|\"<>";

	const MIN_LENGTH = preferences.MIN_PASSWORD_LENGTH;		// policy decision for the extension is set in preferences.js
	const MAX_LENGTH = 4096;								// keeps every request far below the 65536-byte getRandomValues() quota

	// Enforce composition rules. resample until all four classes are present.
	// Resampling the whole password keeps the result uniform over the set of acceptable passwords.
	const REQUIRED_CLASSES = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/];
	const MAX_ATTEMPTS = 500;	// safety cap for the class-coverage resampling loop

	////////////////////////////////////////////////////////////////////////////////////
	function _validateLength(value) {
		const length = Number(value);
		if(!Number.isSafeInteger(length) || length < MIN_LENGTH || length > MAX_LENGTH) {
			throw new RangeError(`Password length must be an integer between ${MIN_LENGTH} and ${MAX_LENGTH}.`);
		}
		return length;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function _generateOnce(charSet, length) {
		const charSetLength = charSet.length;
		const maxValid = 256 - (256 % charSetLength);	// charSet.length must not exceed 256, otherwise byte-based sampling cannot reach every character

		let password = "";

		while(password.length < length) {
			const random = new Uint8Array(length - password.length + 16);
			window.crypto.getRandomValues(random);

			for(let i=0, len=random.length; i<len; ++i) {
				if(random[i] < maxValid) {
					password += charSet[random[i] % charSetLength];
					if(password.length === length) break;
				}
			}
			random.fill(0);		// best effort; wipe sensitive data
		}
		return password;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function _generatePassword(charSet, length) {
		for(let i=0; i<MAX_ATTEMPTS; ++i) {
			const pwd = _generateOnce(charSet, length);
			if(REQUIRED_CLASSES.every(re => re.test(pwd))) return pwd;
			//console.log("Failure to meet required classes; attempt No.:", i);
		}
		throw new Error("Failed to generate password meeting all requirements.");
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function generate() {
		const [rawLength, includeReserved] = await Promise.all([
			preferences.getPasswordLength(),
			preferences.getIncludeReservedCharSet(),
		]);

		const length = _validateLength(rawLength);
		const charSet = includeReserved ? (BASE_CHAR_SET + RESERVED_CHAR_SET) : BASE_CHAR_SET;
		const password = _generatePassword(charSet, length);
		return {
			password: password,
			entropy: (Math.log2(charSet.length) * password.length).toFixed(2) + " bits",
		};
	}

	return {
		BASE_CHAR_SET: BASE_CHAR_SET,
		RESERVED_CHAR_SET: RESERVED_CHAR_SET,

		generate: generate,
	};
})();
