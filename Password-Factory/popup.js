"use strict";

(() => {

	let m_elmMain;
	let m_elmPasswordOutput;
	let m_elmTxtPasswordLength;
	let m_elmChkIncludeReservedChars;
	let m_elmPasswordEntropyTooltip = null;
	let m_entropyObserver;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);

	////////////////////////////////////////////////////////////////////////////////////
	async function onDOMContentLoaded() {

		// initialize member variables
		m_elmMain = document.getElementById("popupMain");
		m_elmPasswordOutput = document.getElementById("passwordOutput");
		m_elmTxtPasswordLength = document.getElementById("passwordLength");
		m_elmChkIncludeReservedChars = document.getElementById("includeReservedChars");

		// initialize event listeners
		m_elmPasswordOutput.addEventListener("mouseenter", onMouseEnterPasswordOutput);
		m_elmPasswordOutput.addEventListener("mouseleave", onMouseLeavePasswordOutput);
		document.getElementById("revealBtn").addEventListener("click", onClickBtnReveal);
		document.getElementById("regenerateBtn").addEventListener("click", onClickBtnRegenerate);
		document.getElementById("copyBtn").addEventListener("click", onClickBtnCopy);
		document.getElementById("toggleOptionsBtn").addEventListener("click", onClickBtnToggleOptions);
		m_elmTxtPasswordLength.addEventListener("change", onChangePasswordLength);
		m_elmChkIncludeReservedChars.addEventListener("change", onChangeIncludeReservedChars);

		// initialize observer for data-entropy attribute changes
		m_entropyObserver = new MutationObserver(setPasswordEntropyTooltipTextContent);
		m_entropyObserver.observe(m_elmPasswordOutput, { attributeFilter: ["data-entropy"], subtree: false });

		// initialize interface
		const manifest = browser.runtime.getManifest();
		document.getElementById("popupTitle").textContent = `${manifest.name} ${manifest.version}`;
		document.getElementById("popupSubtitle").textContent = manifest.description;
		m_elmTxtPasswordLength.min = preferences.MIN_PASSWORD_LENGTH;
		m_elmTxtPasswordLength.max = preferences.MAX_PASSWORD_LENGTH;
		m_elmChkIncludeReservedChars.parentElement.title =
			`The reserved characters are: ${passwordFactory.RESERVED_CHAR_SET.split("").join(" ")}\n\n` +
			"Reserved characters can be interpreted by websites as command or formatting symbols (for example in URLs, forms, or backend filters).\n\n" +
			"For this reason, some systems reject them, escape them, or handle them inconsistently, which may cause login failures even when the password is correct.\n\n" +
			"Uncheck this option if passwords are being rejected or you're having issues logging in.";

		const [passwordLength, includeReserved, optionsOpen] = await Promise.all([
			preferences.getPasswordLength(),
			preferences.getIncludeReservedCharSet(),
			preferences.getOptionsOpen(),
		]);
		m_elmTxtPasswordLength.value = passwordLength;
		m_elmChkIncludeReservedChars.checked = includeReserved;
		m_elmMain.classList.toggle("options-open", optionsOpen);

		setGeneratedPasswordOutputValue();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseEnterPasswordOutput() {
		destroyPasswordEntropyTooltipElement();
		createPasswordEntropyTooltipElement();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseLeavePasswordOutput() {
		destroyPasswordEntropyTooltipElement();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnReveal() {
		m_elmPasswordOutput.type = m_elmPasswordOutput.type === "password" ? "text" : "password";
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onClickBtnRegenerate() {
		setGeneratedPasswordOutputValue();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnCopy() {
		navigator.clipboard.writeText(m_elmPasswordOutput.value);
		flashPasswordField();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnToggleOptions() {
		preferences.setOptionsOpen(m_elmMain.classList.toggle("options-open"));
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onChangePasswordLength() {
		const value = Math.min(Math.max(preferences.MIN_PASSWORD_LENGTH, Number(m_elmTxtPasswordLength.value)), preferences.MAX_PASSWORD_LENGTH);
		m_elmTxtPasswordLength.value = value;
		await preferences.setPasswordLength(value);
		setGeneratedPasswordOutputValue();
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onChangeIncludeReservedChars() {
		await preferences.setIncludeReservedCharSet(m_elmChkIncludeReservedChars.checked);
		setGeneratedPasswordOutputValue();
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function setGeneratedPasswordOutputValue() {
		const { password, entropy } = await passwordFactory.generate();
		m_elmPasswordOutput.value = password;
		m_elmPasswordOutput.setAttribute("data-entropy", entropy);
		pulsePasswordField();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setPasswordEntropyTooltipTextContent() {
		if(m_elmPasswordEntropyTooltip) {
			m_elmPasswordEntropyTooltip.firstChild.textContent = `Password entropy: ${m_elmPasswordOutput.getAttribute("data-entropy") ?? "N/A"}`;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createPasswordEntropyTooltipElement() {

		// tooltip element
		m_elmPasswordEntropyTooltip = document.createElement("div");
		m_elmPasswordEntropyTooltip.className = "password-entropy-tooltip";

		// tooltip text element
		m_elmPasswordEntropyTooltip.appendChild(document.createElement("span"));	// first child
		setPasswordEntropyTooltipTextContent();										// text is set to first child

		// tooltip arrow element
		const elmArrow = document.createElement("div");
		elmArrow.className = "password-entropy-tooltip-arrow";
		m_elmPasswordEntropyTooltip.appendChild(elmArrow);

		document.body.appendChild(m_elmPasswordEntropyTooltip);

		// Position the tooltip above the password and slightly to the right
		const rect = m_elmPasswordOutput.getBoundingClientRect();
		const top = rect.top - m_elmPasswordEntropyTooltip.offsetHeight - 12; // 12px gap
		const left = rect.left + rect.width * 0.60;

		m_elmPasswordEntropyTooltip.style.top = `${top}px`;
		m_elmPasswordEntropyTooltip.style.left = `${left}px`;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function destroyPasswordEntropyTooltipElement() {
		if(m_elmPasswordEntropyTooltip) {
			m_elmPasswordEntropyTooltip.remove();
			m_elmPasswordEntropyTooltip = null;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function pulsePasswordField() {
		const originalBorderColor = m_elmPasswordOutput.style.borderColor;
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

					m_elmPasswordOutput.style.borderColor = `rgba(255, 179, 71, ${borderOpacity})`;
					m_elmPasswordOutput.style.boxShadow = `0 0 ${glowSize}px rgba(255, 179, 71, ${glowOpacity}), inset 0 0 ${glowSize * 0.5}px rgba(255, 179, 71, ${glowOpacity * 0.3})`;
				} else {
					// Second half: shrink glow and dim
					const shrinkProgress = (progress - 0.5) * 2; // 0 to 1
					const glowSize = 20 * (1 - shrinkProgress);
					const glowOpacity = 0.8 * (1 - shrinkProgress);
					const borderOpacity = 1 - (0.6 * shrinkProgress);

					m_elmPasswordOutput.style.borderColor = `rgba(255, 179, 71, ${borderOpacity})`;
					m_elmPasswordOutput.style.boxShadow = `0 0 ${glowSize}px rgba(255, 179, 71, ${glowOpacity}), inset 0 0 ${glowSize * 0.5}px rgba(255, 179, 71, ${glowOpacity * 0.3})`;
				}
				++step;
			} else {
				// Animation complete: restore original styles
				clearInterval(pulse);
				m_elmPasswordOutput.style.borderColor = originalBorderColor;
				m_elmPasswordOutput.style.boxShadow = "none";
			}
		}, stepDuration);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function flashPasswordField() {
		const duration = 600; // total animation duration in ms
		const frameCount = 40; // number of animation frames
		const frameDuration = duration / frameCount;

		let frame = 0;
		const originalBackground = m_elmPasswordOutput.style.background;
		const originalBoxShadow = m_elmPasswordOutput.style.boxShadow;

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

				m_elmPasswordOutput.style.background = gradient;

				// Add a subtle glow at the weave point
				const glowOpacity = Math.sin(progress * Math.PI) * 0.6;
				m_elmPasswordOutput.style.boxShadow = `inset 0 0 15px rgba(255, 179, 71, ${glowOpacity})`;

				++frame;
			} else {
				// Animation complete: restore original styles
				clearInterval(animate);
				m_elmPasswordOutput.style.background = originalBackground;
				m_elmPasswordOutput.style.boxShadow = originalBoxShadow;
			}
		}, frameDuration);
	}
})();
