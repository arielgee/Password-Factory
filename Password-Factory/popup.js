"use strict";

(() => {

	const RESERVED_CHARS_DESC = `The reserved characters are: ${passwordFactory.RESERVED_CHAR_SET.split("").join(" ")}\n\n` +
								"Reserved characters can be interpreted by websites as command or formatting symbols (for example in URLs, forms, or backend filters).\n\n" +
								"For this reason, some systems reject them, escape them, or handle them inconsistently, which may cause login failures even when the password is correct.\n\n" +
								"Uncheck this option if your passwords are being rejected or you're having issues logging in.";

	let elmMain;
	let elmPasswordOutput;
	let elmTxtPasswordLength;
	let elmChkIncludeReservedChars;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);

	////////////////////////////////////////////////////////////////////////////////////
	async function onDOMContentLoaded() {

		// initialize elements
		elmMain = document.getElementById("popupMain");
		elmPasswordOutput = document.getElementById("passwordOutput");
		elmTxtPasswordLength = document.getElementById("passwordLength");
		elmChkIncludeReservedChars = document.getElementById("includeReservedChars");

		// initialize event listeners
		document.getElementById("revealBtn").addEventListener("click", onClickBtnReveal);
		document.getElementById("regenerateBtn").addEventListener("click", onClickBtnRegenerate);
		document.getElementById("copyBtn").addEventListener("click", onClickBtnCopy);
		document.getElementById("toggleOptionsBtn").addEventListener("click", onClickBtnToggleOptions);
		elmTxtPasswordLength.addEventListener("change", onChangePasswordLength);
		elmChkIncludeReservedChars.addEventListener("change", onChangeIncludeReservedChars);

		// initialize interface
		const [optionsOpen, passwordLength, includeReserved] = await Promise.all([
			preferences.getOptionsOpen(),
			preferences.getPasswordLength(),
			preferences.getIncludeReservedCharSet(),
		]);
		setGeneratedPasswordOutputValue();
		elmMain.classList.toggle("options-open", optionsOpen);
		elmTxtPasswordLength.min = preferences.MIN_PASSWORD_LENGTH;
		elmTxtPasswordLength.max = preferences.MAX_PASSWORD_LENGTH;
		elmTxtPasswordLength.value = passwordLength;
		elmChkIncludeReservedChars.checked = includeReserved;
		elmChkIncludeReservedChars.parentElement.title = RESERVED_CHARS_DESC;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnReveal() {
		elmPasswordOutput.type = elmPasswordOutput.type === "password" ? "text" : "password";
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onClickBtnRegenerate() {
		setGeneratedPasswordOutputValue();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnCopy() {
		navigator.clipboard.writeText(elmPasswordOutput.value);
		flashPasswordField();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnToggleOptions() {
		preferences.setOptionsOpen(elmMain.classList.toggle("options-open"));
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onChangePasswordLength() {
		const value = Math.min(Math.max(preferences.MIN_PASSWORD_LENGTH, Number(elmTxtPasswordLength.value)), preferences.MAX_PASSWORD_LENGTH);
		elmTxtPasswordLength.value = value;
		await preferences.setPasswordLength(value);
		setGeneratedPasswordOutputValue();
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onChangeIncludeReservedChars() {
		await preferences.setIncludeReservedCharSet(elmChkIncludeReservedChars.checked);
		setGeneratedPasswordOutputValue();
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function setGeneratedPasswordOutputValue() {
		//({ password: elmPasswordOutput.value, entropy: elmPasswordOutput.title } = await passwordFactory.generate());
		const { password, entropy } = await passwordFactory.generate();
		elmPasswordOutput.value = password;
		elmPasswordOutput.title = `Password entropy: ${entropy}`;
		pulsePasswordField();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function pulsePasswordField() {
		const originalBorderColor = elmPasswordOutput.style.borderColor;
		const pulseDuration = 600; // total duration in ms
		const pulseSteps = 30; // number of animation frames
		const stepDuration = pulseDuration / pulseSteps;

		let step = 0;

		const pulse = setInterval(() => {
			if (step < pulseSteps) {
				const progress = step / pulseSteps;
				const isExpanding = progress < 0.5;

				if (isExpanding) {
					// First half: expand glow and brighten
					const expandProgress = progress * 2; // 0 to 1
					const glowSize = 20 * expandProgress;
					const glowOpacity = 0.8 * expandProgress;
					const borderOpacity = 0.4 + (0.6 * expandProgress);

					elmPasswordOutput.style.borderColor = `rgba(255, 179, 71, ${borderOpacity})`;
					elmPasswordOutput.style.boxShadow = `0 0 ${glowSize}px rgba(255, 179, 71, ${glowOpacity}), inset 0 0 ${glowSize * 0.5}px rgba(255, 179, 71, ${glowOpacity * 0.3})`;
				} else {
					// Second half: shrink glow and dim
					const shrinkProgress = (progress - 0.5) * 2; // 0 to 1
					const glowSize = 20 * (1 - shrinkProgress);
					const glowOpacity = 0.8 * (1 - shrinkProgress);
					const borderOpacity = 1 - (0.6 * shrinkProgress);

					elmPasswordOutput.style.borderColor = `rgba(255, 179, 71, ${borderOpacity})`;
					elmPasswordOutput.style.boxShadow = `0 0 ${glowSize}px rgba(255, 179, 71, ${glowOpacity}), inset 0 0 ${glowSize * 0.5}px rgba(255, 179, 71, ${glowOpacity * 0.3})`;
				}
				++step;
			} else {
				// Animation complete: restore original styles
				clearInterval(pulse);
				elmPasswordOutput.style.borderColor = originalBorderColor;
				elmPasswordOutput.style.boxShadow = "none";
			}
		}, stepDuration);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function flashPasswordField() {
		const duration = 600; // total animation duration in ms
		const frameCount = 40; // number of animation frames
		const frameDuration = duration / frameCount;

		let frame = 0;
		const originalBackground = elmPasswordOutput.style.background;
		const originalBoxShadow = elmPasswordOutput.style.boxShadow;

		const animate = setInterval(() => {
			if (frame < frameCount) {
				const progress = frame / frameCount; // 0 to 1

				// Create a gradient that moves from left to right
				// The gradient represents a weave/flash that travels across
				const gradientPosition = progress * 200; // moves from -100 to 100

				// Calculate opacity of the weave (brightest in the middle)
				const weaveCenterPos = gradientPosition;
				const weaveWidth = 40; // width of the weave effect

				// Create background gradient with weave effect
				const gradient = `linear-gradient(90deg,
					rgba(255, 179, 71, 0) ${Math.max(0, weaveCenterPos - weaveWidth)}%,
					rgba(255, 179, 71, 0.5) ${weaveCenterPos}%,
					rgba(255, 179, 71, 0) ${Math.min(200, weaveCenterPos + weaveWidth)}%
				)`;

				elmPasswordOutput.style.background = gradient;

				// Add a subtle glow at the weave point
				const glowOpacity = Math.sin(progress * Math.PI) * 0.6;
				elmPasswordOutput.style.boxShadow = `inset 0 0 15px rgba(255, 179, 71, ${glowOpacity})`;

				++frame;
			} else {
				// Animation complete: restore original styles
				clearInterval(animate);
				elmPasswordOutput.style.background = originalBackground;
				elmPasswordOutput.style.boxShadow = originalBoxShadow;
			}
		}, frameDuration);
	}
})();
