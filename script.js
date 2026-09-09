let currentLang = localStorage.getItem('lang') || 'en';

// ================= PAGE NAVIGATION =================
function showPage(pageId) {
    const pages = document.querySelectorAll(".page");
    pages.forEach(page => { page.classList.remove("active"); });
    document.getElementById(pageId).classList.add("active");
    if (pageId === "queuePage" || pageId === "tokenResultPage") {
        updateQueueUI();
    }
    window.scrollTo(0, 0);
}

// ================= FIXED VOICE ASSISTANCE =================
function speak(text) {
    if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
        const message = new SpeechSynthesisUtterance(text);
        message.rate = 0.9;
        message.pitch = 1;

        const voices = speechSynthesis.getVoices();
        if (currentLang === 'te') {
            message.lang = 'te-IN';
            let v = voices.find(v => v.lang.includes('te') || v.name.toLowerCase().includes('telugu'));
            if (v) message.voice = v;
        } else if (currentLang === 'hi') {
            message.lang = 'hi-IN';
            let v = voices.find(v => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi'));
            if (v) message.voice = v;
        } else {
            message.lang = 'en-US';
        }
        speechSynthesis.speak(message);
    } else {
        alert("Voice assistance is not supported in this browser.");
    }
}
speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();

function speakWelcome() {
    if(currentLang === 'te') speak("స్మార్ట్ ఫార్మర్ ప్రొక్యూర్‌మెంట్ సిస్టమ్‌కు స్వాగతం.");
    else if(currentLang === 'hi') speak("स्मार्ट फार्मर प्रोक्योरमेंट सिस्टम में आपका स्वागत है।");
    else speak("Welcome to Smart Farmer Procurement System.");
}

// ================= FARMER LOGIN =================
function farmerLogin() {
    const mobile = document.getElementById("farmerMobile").value;
    if (mobile.length !== 10) {
        speak(currentLang === 'te' ? "దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి." : "Please enter a valid 10 digit mobile number.");
        alert("Please enter a valid 10 digit mobile number.");
        return;
    }
    document.getElementById("farmerGreeting").innerText = "Welcome Farmer! You can book your procurement token.";
    speak(currentLang === 'te' ? "లాగిన్ విజయవంతమైంది." : "Login successful. Welcome Farmer.");
    showPage("farmerDashboard");
}

// ================= SMART QUEUE / BAG-BASED WAITING TIME =================
// Demo assumption: approximately 1 bag takes 30 seconds to process.
// In the real system, staff/admin can replace this with the centre's live average.
const PROCESSING_SECONDS_PER_BAG = 30;

// Different bag quantities demonstrate why counting farmers alone is not enough.
const DEMO_QUEUE_BAGS = [20, 60, 40, 30, 50, 25, 45, 35];

let currentToken = 42;
let currentQueueData = {
    farmersAhead: DEMO_QUEUE_BAGS.length,
    bagsAhead: DEMO_QUEUE_BAGS.reduce((a, b) => a + b, 0),
    waitingMinutes: 0,
    turnTime: "--"
};

function formatMinutes(totalMinutes) {
    totalMinutes = Math.max(0, Math.round(totalMinutes));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes} minutes`;
    if (minutes === 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
    return `${hours} hr ${minutes} min`;
}

function getTurnTime(waitingMinutes) {
    const turn = new Date(Date.now() + waitingMinutes * 60 * 1000);
    return turn.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function calculateQueueData() {
    const bagsAhead = DEMO_QUEUE_BAGS.reduce((sum, bags) => sum + Number(bags), 0);
    const waitingMinutes = Math.ceil((bagsAhead * PROCESSING_SECONDS_PER_BAG) / 60);

    return {
        farmersAhead: DEMO_QUEUE_BAGS.length,
        bagsAhead,
        waitingMinutes,
        turnTime: getTurnTime(waitingMinutes)
    };
}

function updateQueueUI() {
    currentQueueData = calculateQueueData();
    const q = currentQueueData;

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    };

    setText("resultFarmersAhead", `${q.farmersAhead} farmers`);
    setText("resultBagsAhead", `${q.bagsAhead} bags`);
    setText("resultWaitingTime", formatMinutes(q.waitingMinutes));
    setText("resultTurnTime", q.turnTime);

    setText("queueToken", `🎫 #${currentToken}`);
    setText("queueFarmersAhead", q.farmersAhead);
    setText("queueBagsAhead", q.bagsAhead);
    setText("queueWaitingTime", formatMinutes(q.waitingMinutes));
    setText("queueTurnTime", `Approx. turn: ${q.turnTime}`);

    const progress = document.getElementById("queueProgress");
    if (progress) {
        const percentage = Math.max(5, Math.min(95, 100 - q.farmersAhead * 7));
        progress.style.width = `${percentage}%`;
    }

    const statusText = document.getElementById("queueStatusText");
    if (statusText) {
        if (q.waitingMinutes <= 15) {
            statusText.innerText = "Your turn is very close. Please stay near the centre.";
        } else if (q.waitingMinutes <= 45) {
            statusText.innerText = "Your turn is getting closer. Please be ready.";
        } else {
            statusText.innerText = "You can wait comfortably. We will notify you when your turn is near.";
        }
    }
}

// ================= TOKEN =================
function generateToken() {
    const crop = document.getElementById("crop").value;
    const quantity = Number(document.getElementById("quantity").value);
    const centre = document.getElementById("centre").value;
    const date = document.getElementById("procurementDate").value;

    if (!quantity || quantity < 1 || !date) {
        alert("Please enter a valid quantity and date.");
        speak(currentLang === 'te'
            ? "దయచేసి సరైన బ్యాగుల సంఖ్య మరియు సేకరణ తేదీ నమోదు చేయండి."
            : "Please enter a valid number of bags and procurement date.");
        return;
    }

    currentToken = 42;
    currentQueueData = calculateQueueData();

    document.getElementById("resultCrop").innerText = crop;
    document.getElementById("resultCentre").innerText = centre;
    document.getElementById("resultQuantity").innerText = quantity + " bags";
    document.getElementById("tokenNumber").innerText = "#" + currentToken;

    updateQueueUI();
    showPage("tokenResultPage");

    if (currentLang === 'te') {
        speak(`మీ టోకెన్ నంబర్ ${currentToken}. మీ ముందు ${currentQueueData.farmersAhead} మంది రైతులు ఉన్నారు. వారి వద్ద మొత్తం ${currentQueueData.bagsAhead} బ్యాగులు ఉన్నాయి. సుమారు ${formatMinutes(currentQueueData.waitingMinutes)} వేచి ఉండాలి.`);
    } else if (currentLang === 'hi') {
        speak(`आपका टोकन नंबर ${currentToken} है। आपके आगे ${currentQueueData.farmersAhead} किसान हैं। उनके पास कुल ${currentQueueData.bagsAhead} बैग हैं। अनुमानित प्रतीक्षा समय ${formatMinutes(currentQueueData.waitingMinutes)} है।`);
    } else {
        speak(`Your token number is ${currentToken}. There are ${currentQueueData.farmersAhead} farmers ahead of you with ${currentQueueData.bagsAhead} bags. Estimated waiting time is ${formatMinutes(currentQueueData.waitingMinutes)}.`);
    }
}

function speakToken() {
    const crop = document.getElementById("resultCrop").innerText;
    const centre = document.getElementById("resultCentre").innerText;
    const quantity = document.getElementById("resultQuantity").innerText;
    const q = currentQueueData;

    if (currentLang === 'te') {
        speak(`మీ టోకెన్ నంబర్ ${currentToken}. పంట ${crop}. పరిమాణం ${quantity}. కేంద్రం ${centre}. మీ ముందు ${q.farmersAhead} మంది రైతులు మరియు ${q.bagsAhead} బ్యాగులు ఉన్నాయి. సుమారు ${formatMinutes(q.waitingMinutes)} సమయం పడుతుంది. మీ వంతు సుమారు ${q.turnTime}.`);
    } else if (currentLang === 'hi') {
        speak(`आपका टोकन नंबर ${currentToken} है। फसल ${crop}। मात्रा ${quantity}। केंद्र ${centre}। आपके आगे ${q.farmersAhead} किसान और ${q.bagsAhead} बैग हैं। अनुमानित प्रतीक्षा समय ${formatMinutes(q.waitingMinutes)} है। आपकी बारी लगभग ${q.turnTime} बजे आएगी।`);
    } else {
        speak(`Your token number is ${currentToken}. Crop is ${crop}. Quantity is ${quantity}. Centre is ${centre}. There are ${q.farmersAhead} farmers and ${q.bagsAhead} bags ahead of you. Estimated waiting time is ${formatMinutes(q.waitingMinutes)}. Your turn is approximately ${q.turnTime}.`);
    }
}

function speakQueue() {
    const q = currentQueueData;

    if (currentLang === 'te') {
        speak(`మీ టోకెన్ నంబర్ ${currentToken}. మీ ముందు ${q.farmersAhead} మంది రైతులు ఉన్నారు. వారి వద్ద ${q.bagsAhead} బ్యాగులు ఉన్నాయి. సుమారు ${formatMinutes(q.waitingMinutes)} వేచి ఉండాలి. మీ వంతు సుమారు ${q.turnTime}.`);
    } else if (currentLang === 'hi') {
        speak(`आपका टोकन नंबर ${currentToken} है। आपके आगे ${q.farmersAhead} किसान हैं और ${q.bagsAhead} बैग हैं। अनुमानित प्रतीक्षा समय ${formatMinutes(q.waitingMinutes)} है। आपकी बारी लगभग ${q.turnTime} बजे आएगी।`);
    } else {
        speak(`Your token number is ${currentToken}. There are ${q.farmersAhead} farmers and ${q.bagsAhead} bags ahead of you. Estimated waiting time is ${formatMinutes(q.waitingMinutes)}. Your turn is approximately ${q.turnTime}.`);
    }
}

function speakStatus() {
    if(currentLang === 'te') speak("మీ సేకరణ స్థితి తూకంలో ఉంది.");
    else speak("Your procurement status is weighing in progress.");
}
function speakSchedule() {
    if(currentLang === 'te') speak("వరి సేకరణ సోమవారం నుండి శనివారం వరకు అందుబాటులో ఉంది.");
    else speak("Paddy procurement is available Monday to Saturday from 9 AM to 5 PM.");
}
function speakDashboard() {
    if(currentLang === 'te') speak("మీ రైతు డాష్‌బోర్డ్‌కు స్వాగతం. మీరు టోకెన్ పొందవచ్చు.");
    else speak("Welcome to your farmer dashboard. You can get a token, check the schedule.");
}

// ================= LANGUAGE =================
function changeLanguage(language) {
    currentLang = language;
    localStorage.setItem('lang', language);
    if (language === "te") {
        document.getElementById("welcomeText").innerText = "తక్కువ వేచి ఉండటం. ఎక్కువ పారదర్శకత. స్మార్ట్ కొనుగోలు.";
        document.getElementById("voiceText").innerText = "వాయిస్ సహాయం";
        document.getElementById("selectPortal").innerText = "మీ పోర్టల్‌ను ఎంచుకోండి";
        speak("స్మార్ట్ రైతు కొనుగోలు వ్యవస్థకు స్వాగతం");
    } else if (language === "hi") {
        document.getElementById("welcomeText").innerText = "कम इंतज़ार। अधिक पारदर्शिता। स्मार्ट खरीद।";
        document.getElementById("voiceText").innerText = "वॉइस सहायता";
        document.getElementById("selectPortal").innerText = "अपना पोर्टल चुनें";
        speak("स्मार्ट किसान खरीद प्रणाली में आपका स्वागत है");
    } else {
        document.getElementById("welcomeText").innerText = "Less Waiting. More Transparency. Smarter Procurement.";
        document.getElementById("voiceText").innerText = "Voice Assistance";
        document.getElementById("selectPortal").innerText = "Select Your Portal";
        speak("Welcome to Smart Farmer Procurement System");
    }
}

// ================= VOICE CALL / IVR DEMO =================
let callLanguage = "te";
let callDemoData = {
    farmer: "Farmer 001",
    crop: "Maize",
    bags: 60,
    centre: "Procurement Centre A"
};

function startVoiceCall(language) {
    callLanguage = language;
    document.getElementById("ivrStep1").classList.remove("active");
    document.getElementById("ivrStep2").classList.add("active");

    const questions = {
        te: "మీ పంట పేరు చెప్పండి. తర్వాత ఎన్ని బస్తాలు ఉన్నాయో చెప్పండి.",
        hi: "अपनी फसल का नाम और कितने बोरे हैं, बताइए।",
        en: "Please tell us your crop name and the number of bags."
    };

    document.getElementById("callQuestion").innerText =
        language === "te" ? "రైతు వివరాలు చెప్పండి" :
        language === "hi" ? "किसान की जानकारी बताइए" :
        "Tell us your details";

    document.getElementById("callInstruction").innerText = questions[language];
    speak(questions[language]);
}

function simulateFarmerVoice() {
    document.getElementById("callCrop").innerText = "🌽 " + callDemoData.crop;
    document.getElementById("callBags").innerText = callDemoData.bags + " bags";
    document.getElementById("callCentre").innerText = callDemoData.centre;

    const msg = {
        te: "మొక్కజొన్న, 60 బస్తాలు, సెంటర్ ఏ",
        hi: "मक्का, 60 बोरे, सेंटर ए",
        en: "Maize, 60 bags, Centre A"
    };
    speak(msg[callLanguage]);
}

function submitVoiceRequest() {
    const confirmation = {
        te: "మీ వివరాలు సిబ్బందికి పంపించబడ్డాయి. మీ క్యూ సమాచారం ఇప్పుడు అప్డేట్ అవుతుంది.",
        hi: "आपकी जानकारी स्टाफ को भेज दी गई है। आपकी कतार की जानकारी अपडेट हो रही है।",
        en: "Your details have been sent to the staff. Your queue information will now be updated."
    };

    document.getElementById("ivrStep2").classList.remove("active");
    document.getElementById("ivrStep3").classList.add("active");
    document.getElementById("callConfirmation").innerText = confirmation[callLanguage];
    speak(confirmation[callLanguage]);

    // Demo sync with the staff dashboard.
    localStorage.setItem("voiceCallRequest", JSON.stringify({
        ...callDemoData,
        language: callLanguage,
        time: new Date().toISOString(),
        status: "Waiting for staff update"
    }));
}

function speakCallConfirmation() {
    const text = document.getElementById("callConfirmation").innerText;
    speak(text);
}

function resetVoiceCall() {
    document.getElementById("ivrStep2").classList.remove("active");
    document.getElementById("ivrStep3").classList.remove("active");
    document.getElementById("ivrStep1").classList.add("active");
    document.getElementById("callCrop").innerText = "—";
    document.getElementById("callBags").innerText = "—";
    document.getElementById("callCentre").innerText = "—";
    speak("Select your language.");
}
