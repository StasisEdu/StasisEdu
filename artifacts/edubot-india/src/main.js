// StasisEducation - Full Application
import { INAPP_PAPERS } from "./papers-data.js";
import { Clerk } from "@clerk/clerk-js";

let _clerk = null;
let _clerkUser = null;
let _oauthCallbackHandled = false;

async function loadClerk() {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!key) return null;
  if (_clerk) return _clerk;
  // Snapshot the OAuth callback params BEFORE Clerk's own load() has a
  // chance to touch/strip the URL, so this check is reliable regardless of
  // Clerk's internal URL cleanup timing.
  const params = new URLSearchParams(window.location.search);
  const isOAuthReturn =
    params.has("__clerk_status") ||
    params.has("__clerk_created_session") ||
    params.has("__clerk_db_jwt") ||
    window.location.hash.includes("clerk");
  try {
    // proxyUrl is empty in dev (Clerk talks to the dev FAPI directly) and
    // auto-populated in prod, where Clerk must be routed through the app's
    // own proxy instead of hitting the custom FAPI domain directly.
    const proxyUrl = import.meta.env.VITE_CLERK_PROXY_URL || undefined;
    _clerk = new Clerk(key, proxyUrl ? { proxyUrl } : undefined);
    await _clerk.load();

    // If we're returning from a Google OAuth redirect (redirectUrl ===
    // redirectUrlComplete === this same page, no dedicated /sso-callback
    // route), Clerk needs an explicit handleRedirectCallback() call to
    // finish creating the session from the pending sign-in — otherwise the
    // sign-in resource stays pending, clerk.user never gets set, and the
    // app loops back to the login screen.
    if (isOAuthReturn) {
      try {
        await _clerk.handleRedirectCallback();
      } catch (redirectErr) {
        console.error("Clerk handleRedirectCallback error:", redirectErr);
      }
      // Clean the Clerk OAuth params out of the URL so a later reload/back
      // navigation doesn't try to re-process a stale callback.
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", cleanUrl);

      _clerkUser = _clerk.user || null;

      const googleName = getClerkDisplayName();
      if (googleName) {
        if (!localStorage.getItem("stasis_name")) {
          localStorage.setItem("stasis_name", googleName);
          localStorage.setItem(
            "stasis_lang",
            localStorage.getItem("stasis_lang") || "en",
          );
          const selectedClass =
            (S && S.classPreference) ||
            localStorage.getItem("stasis_signup_class") ||
            "10";
          localStorage.setItem("stasis_signup_class", selectedClass);
          if (S) {
            S.classPreference = selectedClass;
            S.subjectPreference = "Maths";
          }
        }
        // Session is confirmed — enter the app immediately instead of
        // falling through to the login/splash screen.
        document.getElementById("name-splash")?.remove();
        _oauthCallbackHandled = true;
        init();
      }
      return _clerk;
    }

    _clerkUser = _clerk.user || null;
  } catch (e) {
    console.error("Clerk load error:", e);
    _clerk = null;
    _clerkUser = null;
  }
  return _clerk;
}

function getClerkDisplayName() {
  if (!_clerkUser) return null;
  if (_clerkUser.fullName) return _clerkUser.fullName;
  if (_clerkUser.firstName) return _clerkUser.firstName;
  const email = _clerkUser.emailAddresses?.[0]?.emailAddress;
  return email ? email.split("@")[0] : null;
}

function getClerkAvatarUrl() {
  return _clerkUser?.imageUrl || null;
}

// ============================================================
// CHAPTERS DATA
// ============================================================
const CHAPTERS = {
  6: {
    Maths: [
      "Knowing Our Numbers",
      "Whole Numbers",
      "Playing with Numbers",
      "Basic Geometrical Ideas",
      "Understanding Elementary Shapes",
      "Integers",
      "Fractions",
      "Decimals",
      "Data Handling",
      "Mensuration",
      "Algebra",
      "Ratio and Proportion",
      "Symmetry",
      "Practical Geometry",
    ],
    Physics: [
      "Motion and Measurement",
      "Light Shadows and Reflections",
      "Electricity and Circuits",
      "Fun with Magnets",
    ],
    Biology: [
      "Components of Food",
      "Getting to Know Plants",
      "Body Movements",
      "The Living Organisms",
    ],
    Chemistry: [
      "Sorting Materials",
      "Separation of Substances",
      "Water",
      "Air Around Us",
      "Garbage In Garbage Out",
    ],
    History: [
      "What Where How and When",
      "On the Trail of the Earliest People",
      "From Gathering to Growing Food",
      "In the Earliest Cities",
      "What Books and Burials Tell Us",
      "Kingdoms Kings and an Early Republic",
      "New Questions and Ideas",
      "Ashoka The Emperor Who Gave Up War",
      "Vital Villages Thriving Towns",
      "Traders Kings and Pilgrims",
      "New Empires and Kingdoms",
      "Buildings Paintings and Books",
    ],
    Geography: [
      "The Earth in the Solar System",
      "Globe Latitudes and Longitudes",
      "Motions of the Earth",
      "Maps",
      "Major Domains of the Earth",
      "Major Landforms of the Earth",
      "Our Country India",
      "India Climate Vegetation and Wildlife",
    ],
    Civics: [],
    English: [
      "Fables and Folk Tales",
      "Friendship",
      "Nurturing Nature",
      "Sports and Wellness",
      "Culture and Tradition",
      "A Tale of Two Birds",
      "The Friendly Mongoose",
      "The Shepherd's Treasure",
      "The Old Clock Shop",
      "Tansen",
      "The Monkey and the Crocodile",
      "The Wonder Called Sleep",
      "A Pact with the Sun",
      "What is the Right Thing to Do",
      "Painless Dentist",
    ],
    Hindi: [
      "Vah Chidiya Jo",
      "Bachpan",
      "Naadaan Dost",
      "Chaand se Thodi si Gadbad",
      "Aakash Banaam Paani",
      "Saathi Haath Badhana",
      "Aise Aise",
      "Tijori",
      "Jo Dekhkar bhi Nahi Dekhte",
      "Sansar Pustak Hai",
      "Main Sabse Chhotee Hoon",
      "Lokgeet",
      "Noshad ka Ghar",
      "Vaakh",
    ],
  },
  7: {
    Maths: [
      "Integers",
      "Fractions and Decimals",
      "Data Handling",
      "Simple Equations",
      "Lines and Angles",
      "The Triangle and its Properties",
      "Congruence of Triangles",
      "Comparing Quantities",
      "Rational Numbers",
      "Perimeter and Area",
      "Algebraic Expressions",
      "Exponents and Powers",
      "Symmetry",
      "Visualising Solid Shapes",
    ],
    Physics: [
      "Heat",
      "Motion and Time",
      "Electric Current and its Effects",
      "Light",
    ],
    Biology: [
      "Nutrition in Plants",
      "Nutrition in Animals",
      "Respiration in Organisms",
      "Transportation in Animals and Plants",
      "Reproduction in Plants",
      "Forests Our Lifeline",
    ],
    Chemistry: [
      "Acids Bases and Salts",
      "Physical and Chemical Changes",
      "Water",
    ],
    History: [
      "Tracing Changes Through a Thousand Years",
      "New Kings and Kingdoms",
      "The Delhi Sultans",
      "The Mughal Empire",
      "Rulers and Buildings",
      "Towns Traders and Craftspersons",
      "Tribes Nomads and Settled Communities",
      "Devotional Paths to the Divine",
      "The Making of Regional Cultures",
      "Eighteenth Century Political Formations",
    ],
    Geography: [
      "Environment",
      "Inside Our Earth",
      "Our Changing Earth",
      "Air",
      "Water",
      "Natural Vegetation and Wildlife",
      "Human Environment Settlements Transport and Communication",
      "Human Environment Interactions The Tropical and the Subtropical Region",
      "Life in the Temperate Grasslands",
      "Life in the Deserts",
    ],
    Civics: [],
    English: [
      "Three Questions",
      "A Gift of Chappals",
      "Gopal and the Hilsa Fish",
      "The Ashes That Made Trees Bloom",
      "Quality",
      "Expert Detectives",
      "The Invention of Vita Wonk",
      "Fire Friend and Foe",
      "A Bicycle in Good Repair",
      "The Story of Cricket",
      "The Tiny Teacher",
      "Bringing Up Kari",
      "The Desert",
      "The Cop and the Anthem",
      "Golu Grows a Nose",
      "I Want Something in a Cage",
      "Chandni",
      "The Bear Story",
      "A Tiger in the House",
      "An Alien Hand",
    ],
    Hindi: [
      "Hum Panchi Unmukt Gagan Ke",
      "Dadi Maa",
      "Himalayas ki Betiyaan",
      "Katputli",
      "Mithai Wala",
      "Rakt aur Hamara Sharir",
      "Papa Kho Gaye",
      "Sheeshe ke Aansu",
      "Maati Wali",
      "Ek Tinka",
      "Neem ka Ped",
      "Bhor aur Barakh",
      "Veer Kunwar Singh",
      "Sankat Mein Saadhan",
      "Neeli Chhadi",
      "Ham Shahron ke Log",
    ],
  },
  8: {
    Maths: [
      "Rational Numbers",
      "Linear Equations in One Variable",
      "Understanding Quadrilaterals",
      "Practical Geometry",
      "Data Handling",
      "Squares and Square Roots",
      "Cubes and Cube Roots",
      "Comparing Quantities",
      "Algebraic Expressions and Identities",
      "Visualising Solid Shapes",
      "Mensuration",
      "Exponents and Powers",
      "Direct and Inverse Proportions",
      "Factorisation",
      "Introduction to Graphs",
    ],
    Physics: [
      "Force and Pressure",
      "Friction",
      "Sound",
      "Chemical Effects of Electric Current",
      "Some Natural Phenomena",
      "Light",
    ],
    Biology: [
      "Crop Production and Management",
      "Microorganisms",
      "Conservation of Plants and Animals",
      "Reproduction in Animals",
      "Pollution of Air and Water",
    ],
    Chemistry: ["Coal and Petroleum", "Combustion and Flame"],
    History: [
      "How When and Where",
      "From Trade to Territory",
      "Ruling the Countryside",
      "Tribals Dikus and the Vision of a Golden Age",
      "When People Rebel",
      "Weavers Iron Smelters and Factory Owners",
      "Civilising the Native Educating the Nation",
      "Women Caste and Reform",
      "The Making of the National Movement",
      "India After Independence",
    ],
    Geography: [
      "Resources",
      "Land Soil Water Natural Vegetation and Wildlife",
      "Mineral and Power Resources",
      "Agriculture",
      "Industries",
      "Human Resources",
    ],
    Civics: [],
    English: [
      "The Best Christmas Present in the World",
      "The Tsunami",
      "Glimpses of the Past",
      "Bepin Choudhury's Lapse of Memory",
      "The Summit Within",
      "This is Jody's Fawn",
      "A Visit to Cambridge",
      "A Short Monsoon Diary",
      "The Great Stone Face Part 1",
      "The Great Stone Face Part 2",
      "How the Camel Got His Hump",
      "Children at Work",
      "The Selfish Giant",
      "The Treasure Within",
      "Princess September",
      "The Fight",
      "The Open Window",
      "Jalebis",
      "The Comet Part 1",
      "The Comet Part 2",
    ],
    Hindi: [
      "Dhwani",
      "Lakh ki Chudiyan",
      "Bus ki Yatra",
      "Deewanon ki Hasti",
      "Chitthiyon ki Anoothi Duniya",
      "Bhagwan ke Dakiye",
      "Kya Nirash Hua Jaaye",
      "Yeh Sabse Kathin Samay Nahi",
      "Kabir ki Sakhiyan",
      "Kaamchor",
      "Jab Cinema ne Bolna Sikha",
    ],
  },
  9: {
    Maths: [
      "Number Systems",
      "Polynomials",
      "Coordinate Geometry",
      "Linear Equations in Two Variables",
      "Introduction to Euclids Geometry",
      "Lines and Angles",
      "Triangles",
      "Quadrilaterals",
      "Circles",
      "Herons Formula",
      "Surface Areas and Volumes",
      "Statistics",
    ],
    Physics: [
      "Motion",
      "Force and Laws of Motion",
      "Gravitation",
      "Work and Energy",
      "Sound",
    ],
    Biology: [
      "The Fundamental Unit of Life",
      "Tissues",
      "Why Do We Fall Ill",
      "Natural Resources",
    ],
    Chemistry: [
      "Matter in Our Surroundings",
      "Is Matter Around Us Pure",
      "Atoms and Molecules",
      "Structure of the Atom",
    ],
    History: [
      "The French Revolution",
      "Socialism in Europe and the Russian Revolution",
      "Nazism and the Rise of Hitler",
      "Forest Society and Colonialism",
      "Pastoralists in the Modern World",
    ],
    Geography: [
      "India Size and Location",
      "Physical Features of India",
      "Drainage",
      "Climate",
      "Natural Vegetation and Wildlife",
      "Population",
    ],
    Civics: [
      "What is Democracy Why Democracy",
      "Constitutional Design",
      "Electoral Politics",
      "Working of Institutions",
      "Democratic Rights",
    ],
    Economics: [
      "The Story of Village Palampur",
      "People as Resource",
      "Poverty as a Challenge",
      "Food Security in India",
    ],
    English: [
      "The Fun They Had",
      "The Sound of Music",
      "The Little Girl",
      "A Truly Beautiful Mind",
      "The Snake and the Mirror",
      "My Childhood",
      "Packing",
      "Reach for the Top",
      "The Bond of Love",
      "Kathmandu",
      "If I Were You",
      "The Lost Child",
      "The Adventures of Toto",
      "Iswaran the Storyteller",
      "In the Kingdom of Fools",
      "The Happy Prince",
      "Weathering the Storm in Ersama",
      "The Last Leaf",
      "A House is Not a Home",
      "The Accidental Tourist",
      "The Beggar",
      "Grammar: Determiners",
      "Grammar: Tenses",
      "Grammar: Modals",
      "Grammar: Subject-Verb Concord",
      "Grammar: Reported Speech",
    ],
    HindiA: [
      "Do Bailon ki Katha",
      "Lhasa ki Aur",
      "Upbhokta Vad ki Sanskriti",
      "Sawale Sapnon ki Yaad",
      "Nana Patekar",
      "Premchand ke Phate Joote",
      "Mere Bachpan ke Din",
      "Ek Kutta aur ek Maina",
      "Is Jal Pralay Mein",
      "Mere Sang ki Auraten",
      "Reedh ki Haddi",
      "Mati Wali",
      "Kis Tarah Aakhirkar Main Hindi Mein Aaya",
      "Vyakaran: Raidas ke Pad",
      "Vyakaran: Rahim ke Dohe",
      "Vyakaran: Pad-bandh",
      "Vyakaran: Rachna ke Aadhar par Vaakya Bhed",
      "Vyakaran: Samaas",
      "Vyakaran: Muhaavare",
    ],
    HindiB: [
      "Dukh ka Adhikar",
      "Everest: Meri Shikhar Yatra",
      "Tum Kab Jaoge, Atithi",
      "Vaigyanik Chetna ke Vahak: C.V. Raman",
      "Dharm ki Aad",
      "Shukra Taare ke Samaan",
      "Raidas ke Pad",
      "Rahim ke Dohe",
      "Geet-Ageet",
      "Agni Path",
      "Naye Ilaake Mein... Khushboo Rachte Hain Haath",
      "Gillu",
      "Smriti",
      "Kallu Kumhar ki Unakoti",
      "Mera Chhota-sa Niji Pustakalay",
      "Vyakaran: Padbandh",
      "Vyakaran: Rachna ke Aadhar par Vaakya Bhed",
      "Vyakaran: Samaas",
      "Vyakaran: Muhaavare",
    ],
    Hindi: [
      "Do Bailon ki Katha",
      "Lhasa ki Aur",
      "Upbhokta Vad ki Sanskriti",
      "Sawale Sapnon ki Yaad",
      "Nana Patekar",
      "Premchand ke Phate Joote",
      "Mere Bachpan ke Din",
      "Ek Kutta aur ek Maina",
      "Is Jal Pralay Mein",
      "Mere Sang ki Auraten",
      "Reedh ki Haddi",
      "Mati Wali",
      "Kis Tarah Aakhirkar Main Hindi Mein Aaya",
    ],
  },
  10: {
    Maths: [
      "Real Numbers",
      "Polynomials",
      "Pair of Linear Equations in Two Variables",
      "Quadratic Equations",
      "Arithmetic Progressions",
      "Triangles",
      "Coordinate Geometry",
      "Introduction to Trigonometry",
      "Some Applications of Trigonometry",
      "Circles",
      "Areas Related to Circles",
      "Surface Areas and Volumes",
      "Statistics",
      "Probability",
    ],
    Physics: [
      "Light Reflection and Refraction",
      "Human Eye and Colourful World",
      "Electricity",
      "Magnetic Effects of Electric Current",
    ],
    Biology: [
      "Life Processes",
      "Control and Coordination",
      "How do Organisms Reproduce",
      "Heredity and Evolution",
      "Our Environment",
    ],
    Chemistry: [
      "Chemical Reactions and Equations",
      "Acids Bases and Salts",
      "Metals and Non-metals",
      "Carbon and its Compounds",
    ],
    History: [
      "The Rise of Nationalism in Europe",
      "Nationalism in India",
      "The Making of a Global World",
      "The Age of Industrialisation",
      "Print Culture and the Modern World",
    ],
    Geography: [
      "Resources and Development",
      "Forest and Wildlife Resources",
      "Water Resources",
      "Agriculture",
      "Minerals and Energy Resources",
      "Manufacturing Industries",
      "Lifelines of National Economy",
    ],
    Civics: [
      "Power Sharing",
      "Federalism",
      "Democracy and Diversity",
      "Gender Religion and Caste",
      "Popular Struggles and Movements",
      "Political Parties",
      "Outcomes of Democracy",
      "Challenges to Democracy",
    ],
    Economics: [
      "Development",
      "Sectors of the Indian Economy",
      "Money and Credit",
      "Globalisation and the Indian Economy",
      "Consumer Rights",
    ],
    English: [
      "A Letter to God",
      "Nelson Mandela Long Walk to Freedom",
      "Two Stories About Flying",
      "From the Diary of Anne Frank",
      "The Hundred Dresses Part 1",
      "The Hundred Dresses Part 2",
      "Glimpses of India",
      "Mijbil the Otter",
      "Madam Rides the Bus",
      "The Sermon at Benares",
      "The Proposal",
      "A Triumph of Surgery",
      "The Thief's Story",
      "The Midnight Visitor",
      "A Question of Trust",
      "Footprints Without Feet",
      "The Making of a Scientist",
      "The Necklace",
      "The Hack Driver",
      "Bholi",
      "The Book That Saved the Earth",
      "Grammar: Determiners",
      "Grammar: Tenses",
      "Grammar: Modals",
      "Grammar: Subject-Verb Concord",
      "Grammar: Reported Speech",
    ],
    HindiA: [
      "Surdas",
      "Tulsidas",
      "Dev",
      "Jayashankar Prasad",
      "Suryakant Tripathi Nirala",
      "Nagarjun",
      "Girija Kumar Mathur",
      "Rituraj",
      "Manglesh Dabral",
      "Swayam Prakash",
      "Ramvriksha Benipuri",
      "Yashpal",
      "Sarveshwar Dayal Saxena",
      "Manu Bhandari",
      "Mahavir Prasad Dwivedi",
      "Mata ka Anchal",
      "George Pancham ki Naak",
      "Sana Sana Haath Jodi",
      "Ehi Thaiya Jhulani Herani Ho Rama",
      "Main Kyun Likhta Hoon",
      "Vyakaran: Rachna ke Aadhar par Vaakya Bhed",
      "Vyakaran: Vaachya",
      "Vyakaran: Pad Parichay",
      "Vyakaran: Alankaar",
    ],
    HindiB: [
      "Bade Bhai Sahab",
      "Diary ka Ek Panna",
      "Tataara-Vaamiro Katha",
      "Teesri Kasam ke Shilpakaar Shailendra",
      "Ab Kahaan Doosron ke Dukh se Dukhi Hone Waale",
      "Patjhad Mein Tooti Pattiyan",
      "Kartoos",
      "Sakhi",
      "Pad",
      "Manushyata",
      "Parvat Pradesh Mein Pavas",
      "Madhur-Madhur Mere Deepak Jal",
      "Top",
      "Kar Chale Hum Fida",
      "Atmatraan",
      "Harihar Kaka",
      "Sapnon ke se Din",
      "Topi Shukla",
      "Vyakaran: Rachna ke Aadhar par Vaakya Bhed",
      "Vyakaran: Samaas",
      "Vyakaran: Muhaavare",
    ],
    Hindi: [
      "Surdas",
      "Tulsidas",
      "Dev",
      "Jayashankar Prasad",
      "Suryakant Tripathi Nirala",
      "Nagarjun",
      "Girija Kumar Mathur",
      "Rituraj",
      "Manglesh Dabral",
      "Swayam Prakash",
      "Ramvriksha Benipuri",
      "Yashpal",
      "Sarveshwar Dayal Saxena",
      "Manu Bhandari",
      "Mahavir Prasad Dwivedi",
      "Mata ka Anchal",
      "George Pancham ki Naak",
      "Sana Sana Haath Jodi",
      "Ehi Thaiya Jhulani Herani Ho Rama",
      "Main Kyun Likhta Hoon",
    ],
  },
};

function getHindiCourse() {
  return localStorage.getItem("stasis_hindi_course") || "A";
}
window.setHindiCourse = function (course) {
  localStorage.setItem("stasis_hindi_course", course);
};

function getChapters(classNum, subject) {
  if (subject === "Hindi") {
    const course = getHindiCourse();
    const key = course === "B" ? "HindiB" : "HindiA";
    const fromCourse = (CHAPTERS[classNum] || {})[key];
    if (fromCourse) return fromCourse;
  }
  return (CHAPTERS[classNum] || {})[subject] || [];
}

let _gameConfig = { classNum: "10", subject: "Maths", chapter: "" };

// ============================================================
// LANGUAGE SELECTION
// ============================================================
function getName() {
  return localStorage.getItem("stasis_name") || "";
}
window.switchUser = function () {
  localStorage.removeItem("stasis_name");
  localStorage.removeItem("stasis_performance");
  localStorage.removeItem("stasis_state");
  showNameSplash(function () {
    location.reload();
  });
};

function showNameSplash(onDone) {
  const splash = document.createElement("div");
  splash.id = "name-splash";
  splash.style.cssText =
    "position:fixed;inset:0;z-index:9999;background:#07070f;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif;padding:20px;overflow-y:auto;";
  document.body.appendChild(splash);

  const logoBlock = `
    <div style="text-align:center;margin-bottom:8px;">
      <div style="font-size:3rem;filter:drop-shadow(0 0 24px rgba(79,142,247,0.6));margin-bottom:10px;">🎓</div>
      <div style="font-size:1.7rem;font-weight:900;background:linear-gradient(135deg,#4f8ef7,#9b6dff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.02em;">StasisEducation ⚡</div>
      <div style="color:#5a6a8a;font-size:0.85rem;margin-top:4px;">AI-powered CBSE tutor · Classes 6–10</div>
    </div>`;

  const dismiss = (cb) => {
    splash.style.opacity = "0";
    splash.style.transition = "opacity 0.25s";
    setTimeout(() => {
      splash.remove();
      cb();
    }, 250);
  };

  (async () => {
    await loadClerk();

    // loadClerk() already detected an OAuth return, completed the session,
    // removed this splash, and called init() directly — nothing left to do.
    if (_oauthCallbackHandled) return;

    const existingName = localStorage.getItem("stasis_name");
    const googleName = getClerkDisplayName();
    const isReturning = !!(existingName || googleName);
    const displayName = existingName || googleName || "";

    const selectedLang = localStorage.getItem("stasis_lang") || "en";
    const selectedClass =
      (S && S.classPreference) ||
      localStorage.getItem("stasis_signup_class") ||
      "10";
    const CLASSES = ["6", "7", "8", "9", "10"];

    // ── If we just returned from Google OAuth and have no stored name, save it and launch ──
    if (!existingName && googleName && _clerkUser) {
      localStorage.setItem("stasis_name", googleName);
      localStorage.setItem("stasis_lang", selectedLang);
      localStorage.setItem("stasis_signup_class", selectedClass);
      if (S) {
        S.classPreference = selectedClass;
        S.subjectPreference = "Maths";
      }
      dismiss(onDone);
      return;
    }

    if (isReturning) {
      const xp = (S && S.xp) || 0;
      const lvlIdx = typeof getLevel === "function" ? getLevel(xp) : 0;
      const LEVEL_NAMES = [
        "🌱 Rookie",
        "📖 Scholar",
        "💡 Thinker",
        "🧠 Genius",
        "⚔️ Champion",
        "🏆 Legend",
      ];
      const lvlName = LEVEL_NAMES[lvlIdx] || "🌱 Rookie";
      const initial = displayName.charAt(0).toUpperCase();
      const colors = ["#4f8ef7", "#9b6dff", "#f7714f", "#4fd9b3", "#f7c74f"];
      const avatarColor = colors[displayName.charCodeAt(0) % colors.length];
      const avatarUrl = getClerkAvatarUrl();
      const avatarHtml = avatarUrl
        ? `<img src="${avatarUrl}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid ${avatarColor}55;" />`
        : `<div style="width:72px;height:72px;border-radius:50%;background:${avatarColor}22;border:2px solid ${avatarColor}55;display:flex;align-items:center;justify-content:center;font-size:1.8rem;font-weight:900;color:${avatarColor};">${initial}</div>`;

      splash.innerHTML = `
        <style>
          #login-card { animation: loginFadeIn 0.4s ease; }
          @keyframes loginFadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
          #continue-btn:hover { opacity:0.88; transform:scale(1.02); }
          #switch-btn:hover { color:#eef2ff; }
        </style>
        ${logoBlock}
        <div id="login-card" style="width:100%;max-width:360px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:24px;padding:28px 24px;display:flex;flex-direction:column;align-items:center;gap:16px;">
          ${avatarHtml}
          <div style="text-align:center;">
            <div style="font-size:1.25rem;font-weight:800;color:#eef2ff;">Welcome back, ${escapeHtml(displayName)}!</div>
            <div style="margin-top:8px;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;">
              <span style="padding:4px 12px;border-radius:20px;background:rgba(79,142,247,0.12);border:1px solid rgba(79,142,247,0.25);color:#4f8ef7;font-size:0.78rem;font-weight:600;">🎓 Class ${selectedClass}</span>
              <span style="padding:4px 12px;border-radius:20px;background:rgba(155,109,255,0.12);border:1px solid rgba(155,109,255,0.25);color:#9b6dff;font-size:0.78rem;font-weight:600;">${lvlName}</span>
              <span style="padding:4px 12px;border-radius:20px;background:rgba(247,199,79,0.1);border:1px solid rgba(247,199,79,0.2);color:#f7c74f;font-size:0.78rem;font-weight:600;">⚡ ${xp} XP</span>
            </div>
          </div>
          <button id="continue-btn" style="width:100%;padding:15px;border-radius:50px;border:none;background:linear-gradient(135deg,#4f8ef7,#9b6dff);color:white;font-size:1rem;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 24px rgba(79,142,247,0.35);transition:opacity 0.2s,transform 0.2s;margin-top:4px;">
            Continue Learning →
          </button>
          <button id="switch-btn" style="background:none;border:none;color:#5a6a8a;font-size:0.85rem;cursor:pointer;font-family:inherit;transition:color 0.2s;padding:4px 8px;">
            Switch account
          </button>
        </div>`;

      document.getElementById("continue-btn").onclick = () => dismiss(onDone);
      document.getElementById("switch-btn").onclick = async () => {
        if (_clerk && _clerkUser) {
          try {
            await _clerk.signOut();
          } catch (e) {
            /* ignore */
          }
          _clerkUser = null;
        }
        localStorage.removeItem("stasis_name");
        localStorage.removeItem("stasis_performance");
        localStorage.removeItem("stasis_state");
        splash.remove();
        showNameSplash(function () {
          location.reload();
        });
      };
    } else {
      const classPills = CLASSES.map(
        (c) =>
          `<button class="class-pill" data-class="${c}" style="padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:${c === selectedClass ? "linear-gradient(135deg,#4f8ef7,#9b6dff)" : "rgba(255,255,255,0.04)"};color:${c === selectedClass ? "#fff" : "#7a8aaa"};font-size:0.9rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.15s;min-width:44px;">${c}</button>`,
      ).join("");

      const hasClerk = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
      const googleBtn = hasClerk
        ? `
        <button id="google-btn" style="width:100%;padding:13px;border-radius:14px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:#eef2ff;font-size:0.95rem;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:10px;transition:background 0.15s,border-color 0.15s;">
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          Continue with Google
        </button>
        <div style="display:flex;align-items:center;gap:10px;margin:2px 0;">
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.08);"></div>
          <span style="font-size:0.75rem;color:#4a5a78;font-weight:600;">or</span>
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.08);"></div>
        </div>`
        : "";

      splash.innerHTML = `
        <style>
          #signup-card { animation: loginFadeIn 0.4s ease; }
          @keyframes loginFadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
          #signup-btn:hover { opacity:0.88; transform:scale(1.02); }
          #google-btn:hover { background:rgba(255,255,255,0.1)!important; border-color:rgba(255,255,255,0.2)!important; }
          .class-pill:hover { border-color:rgba(79,142,247,0.5)!important; color:#eef2ff!important; }
          #signup-name:focus { border-color:rgba(79,142,247,0.6)!important; box-shadow:0 0 0 3px rgba(79,142,247,0.12); }
        </style>
        ${logoBlock}
        <div id="signup-card" style="width:100%;max-width:360px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:24px;padding:28px 24px;display:flex;flex-direction:column;gap:16px;">
          <div style="text-align:center;">
            <div style="font-size:1.1rem;font-weight:800;color:#eef2ff;">Create your account</div>
            <div style="font-size:0.82rem;color:#5a6a8a;margin-top:3px;">Free · No password needed · All on device</div>
          </div>

          ${googleBtn}

          <div style="display:flex;flex-direction:column;gap:6px;">
            <label style="font-size:0.75rem;font-weight:700;color:#7a8aaa;text-transform:uppercase;letter-spacing:0.06em;">Your Name</label>
            <input id="signup-name" type="text" placeholder="e.g. Arjun, Priya…" maxlength="30" autocomplete="off"
              style="padding:13px 16px;border-radius:14px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#eef2ff;font-size:1rem;font-family:inherit;outline:none;width:100%;box-sizing:border-box;transition:border-color 0.2s,box-shadow 0.2s;">
          </div>

          <div style="display:flex;flex-direction:column;gap:8px;">
            <label style="font-size:0.75rem;font-weight:700;color:#7a8aaa;text-transform:uppercase;letter-spacing:0.06em;">Class</label>
            <div id="class-pills" style="display:flex;gap:8px;flex-wrap:wrap;">${classPills}</div>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px;">
            <label style="font-size:0.75rem;font-weight:700;color:#7a8aaa;text-transform:uppercase;letter-spacing:0.06em;">Language</label>
            <div style="display:flex;gap:10px;">
              <button id="lang-en-btn" style="flex:1;padding:12px;border-radius:14px;border:1px solid ${selectedLang === "en" ? "rgba(79,142,247,0.5)" : "rgba(255,255,255,0.08)"};background:${selectedLang === "en" ? "rgba(79,142,247,0.15)" : "rgba(255,255,255,0.03)"};color:${selectedLang === "en" ? "#4f8ef7" : "#7a8aaa"};font-size:0.9rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.15s;">🇬🇧 English</button>
              <button id="lang-hi-btn" style="flex:1;padding:12px;border-radius:14px;border:1px solid ${selectedLang === "hi" ? "rgba(155,109,255,0.5)" : "rgba(255,255,255,0.08)"};background:${selectedLang === "hi" ? "rgba(155,109,255,0.15)" : "rgba(255,255,255,0.03)"};color:${selectedLang === "hi" ? "#9b6dff" : "#7a8aaa"};font-size:0.9rem;font-weight:700;cursor:pointer;font-family:'Noto Sans Devanagari',Inter,system-ui,sans-serif;transition:all 0.15s;">🇮🇳 हिंदी</button>
            </div>
          </div>

          <div id="signup-err" style="color:#f7714f;font-size:0.83rem;text-align:center;min-height:18px;"></div>

          <button id="signup-btn" style="width:100%;padding:15px;border-radius:50px;border:none;background:linear-gradient(135deg,#4f8ef7,#9b6dff);color:white;font-size:1rem;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 24px rgba(79,142,247,0.35);transition:opacity 0.2s,transform 0.2s;">
            Start Learning →
          </button>
        </div>`;

      document.body.appendChild(splash);

      let chosenClass = selectedClass;
      let chosenLang = selectedLang;

      if (hasClerk) {
        document.getElementById("google-btn").onclick = async () => {
          const btn = document.getElementById("google-btn");
          btn.disabled = true;
          btn.innerHTML = `<span style="opacity:0.7">Connecting to Google…</span>`;
          try {
            const currentUrl = window.location.href.split("?")[0].split("#")[0];
            if (!_clerk || !_clerk.client || !_clerk.client.signIn) {
              throw new Error("Clerk not fully initialized");
            }
            await _clerk.client.signIn.authenticateWithRedirect({
              strategy: "oauth_google",
              redirectUrl: currentUrl,
              redirectUrlComplete: currentUrl,
            });
          } catch (e) {
            console.error("Google sign-in error:", e);
            btn.disabled = false;
            btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg> Continue with Google`;
            document.getElementById("signup-err").textContent =
              e?.errors?.[0]?.longMessage ||
              e?.message ||
              "Google sign-in failed. Please try again.";
          }
        };
      }

      document.getElementById("class-pills").addEventListener("click", (e) => {
        const pill = e.target.closest(".class-pill");
        if (!pill) return;
        chosenClass = pill.dataset.class;
        document.querySelectorAll(".class-pill").forEach((p) => {
          const active = p.dataset.class === chosenClass;
          p.style.background = active
            ? "linear-gradient(135deg,#4f8ef7,#9b6dff)"
            : "rgba(255,255,255,0.04)";
          p.style.color = active ? "#fff" : "#7a8aaa";
          p.style.borderColor = active
            ? "transparent"
            : "rgba(255,255,255,0.1)";
        });
      });

      const setLang = (lang) => {
        chosenLang = lang;
        const enBtn = document.getElementById("lang-en-btn");
        const hiBtn = document.getElementById("lang-hi-btn");
        enBtn.style.borderColor =
          lang === "en" ? "rgba(79,142,247,0.5)" : "rgba(255,255,255,0.08)";
        enBtn.style.background =
          lang === "en" ? "rgba(79,142,247,0.15)" : "rgba(255,255,255,0.03)";
        enBtn.style.color = lang === "en" ? "#4f8ef7" : "#7a8aaa";
        hiBtn.style.borderColor =
          lang === "hi" ? "rgba(155,109,255,0.5)" : "rgba(255,255,255,0.08)";
        hiBtn.style.background =
          lang === "hi" ? "rgba(155,109,255,0.15)" : "rgba(255,255,255,0.03)";
        hiBtn.style.color = lang === "hi" ? "#9b6dff" : "#7a8aaa";
      };
      document.getElementById("lang-en-btn").onclick = () => setLang("en");
      document.getElementById("lang-hi-btn").onclick = () => setLang("hi");

      const proceed = () => {
        const nameInput = document.getElementById("signup-name");
        const errEl = document.getElementById("signup-err");
        const name = nameInput.value.trim();
        if (!name) {
          errEl.textContent = "Please enter your name to continue.";
          nameInput.style.borderColor = "rgba(247,113,79,0.6)";
          nameInput.focus();
          return;
        }
        localStorage.setItem("stasis_name", name);
        localStorage.setItem("stasis_lang", chosenLang);
        localStorage.setItem("stasis_signup_class", chosenClass);
        if (S) {
          S.classPreference = chosenClass;
          S.subjectPreference = "Maths";
        }
        dismiss(onDone);
      };

      document.getElementById("signup-btn").onclick = proceed;
      document
        .getElementById("signup-name")
        .addEventListener("keydown", (e) => {
          if (e.key === "Enter") proceed();
          document.getElementById("signup-name").style.borderColor =
            "rgba(255,255,255,0.1)";
          document.getElementById("signup-err").textContent = "";
        });
      setTimeout(() => document.getElementById("signup-name").focus(), 50);
    }
  })();
}

function getLanguage() {
  return localStorage.getItem("stasis_lang") || "en";
}

const LANG = {
  en: {
    nav_home: "Home",
    nav_practice: "Practice",
    nav_saved: "Saved",
    nav_stats: "Stats",
    nav_ranks: "Ranks",
    nav_games: "Games",
    nav_papers: "Papers",
    home_heading: "Level Up Your CBSE Prep ⚡",
    home_sub: "AI-powered solutions for Classes 6–10",
    new_user: "New User",
    learning_as: "Learning as:",
    today_xp: "Today XP",
    streak: "Streak",
    solved: "Solved",
    subject: "Subject",
    class_label: "Class",
    chapter: "Chapter",
    select_chapter: "— Select Chapter —",
    your_question: "Your Question",
    question_placeholder: "Type or paste your CBSE question here...",
    upload_photo: "📷 Upload Question Photo",
    solve_btn: "Solve →",
    save_answer: "Save Answer 💾",
    ask_another: "Ask Another",
    daily_practice: "Daily Practice",
    completed: "Completed",
    change_chapter: "Change Chapter",
    questions_for_level: "Questions adapted for your level:",
    setup_practice: "Set Up Daily Practice 📚",
    setup_sub: "Choose your class, subject and chapter",
    your_class: "Your Class",
    start_practice: "Start Practice ✨",
    type_answer: "Type your answer...",
    submit_answer: "Submit Answer",
    saved_answers: "Saved Answers",
    search_saved: "Search saved answers...",
    nothing_saved: "Nothing saved yet. Go solve something!",
    questions_solved: "Questions Solved",
    current_streak: "Current Streak",
    best_streak: "Best Streak",
    total_xp: "Total XP",
    subject_breakdown: "Subject Breakdown",
    activity_30: "Activity (Last 30 Days)",
    weekly_xp: "Weekly XP",
    update_score: "Update My Score",
    your_level: "Your Learning Level",
    xp_to_next: "XP to next level",
    max_level: "Maximum level!",
    leaderboard_title: "Leaderboard 🏆",
    games_title: "Games 🎮",
    games_sub: "Select your chapter, then pick a game",
    quiz_title: "CBSE Quiz",
    quiz_desc: "5 MCQ questions from your chapter. Test your knowledge!",
    quiz_xp: "+10 XP per correct answer",
    scramble_title: "Word Scramble",
    scramble_desc: "Unscramble chapter vocabulary in 60 seconds!",
    scramble_xp: "+8 XP per correct word",
    math_title: "Math Challenge",
    math_desc: "5 mental math problems. Speed bonus under 10 seconds!",
    math_xp: "+10–20 XP per problem",
    resources_title: "📚 Resources",
    papers_tab: "📄 Papers",
    notes_tab: "📒 Notes",
    onboard_title: "Let's Personalize Your Learning",
    onboard_sub:
      "Tell us your last exam score so we can adapt your questions and explanations",
    marks_scored: "Marks Scored",
    out_of: "Out of (Total Marks)",
    start_learning: "Start Learning →",
  },
  hi: {
    nav_home: "होम",
    nav_practice: "अभ्यास",
    nav_saved: "सहेजे",
    nav_stats: "आँकड़े",
    nav_ranks: "रैंक",
    nav_games: "खेल",
    nav_papers: "प्रश्नपत्र",
    home_heading: "अपनी CBSE तैयारी को बेहतर बनाएं ⚡",
    home_sub: "कक्षा 6–10 के लिए AI समाधान",
    new_user: "नया उपयोगकर्ता",
    learning_as: "सीख रहे हैं:",
    today_xp: "आज XP",
    streak: "स्ट्रीक",
    solved: "हल किए",
    subject: "विषय",
    class_label: "कक्षा",
    chapter: "अध्याय",
    select_chapter: "— अध्याय चुनें —",
    your_question: "आपका प्रश्न",
    question_placeholder: "यहाँ अपना CBSE प्रश्न टाइप या पेस्ट करें...",
    upload_photo: "📷 प्रश्न की फोटो अपलोड करें",
    solve_btn: "हल करें →",
    save_answer: "उत्तर सहेजें 💾",
    ask_another: "दूसरा प्रश्न",
    daily_practice: "दैनिक अभ्यास",
    completed: "पूर्ण",
    change_chapter: "अध्याय बदलें",
    questions_for_level: "आपके स्तर के अनुसार प्रश्न:",
    setup_practice: "दैनिक अभ्यास सेट करें 📚",
    setup_sub: "अपनी कक्षा, विषय और अध्याय चुनें",
    your_class: "आपकी कक्षा",
    start_practice: "अभ्यास शुरू करें ✨",
    type_answer: "अपना उत्तर टाइप करें...",
    submit_answer: "उत्तर जमा करें",
    saved_answers: "सहेजे गए उत्तर",
    search_saved: "सहेजे गए उत्तर खोजें...",
    nothing_saved: "अभी तक कुछ सहेजा नहीं। कुछ हल करें!",
    questions_solved: "हल किए प्रश्न",
    current_streak: "वर्तमान स्ट्रीक",
    best_streak: "सर्वश्रेष्ठ स्ट्रीक",
    total_xp: "कुल XP",
    subject_breakdown: "विषयवार विश्लेषण",
    activity_30: "गतिविधि (पिछले 30 दिन)",
    weekly_xp: "साप्ताहिक XP",
    update_score: "स्कोर अपडेट करें",
    your_level: "आपका सीखने का स्तर",
    xp_to_next: "XP और चाहिए अगले स्तर के लिए",
    max_level: "अधिकतम स्तर!",
    leaderboard_title: "लीडरबोर्ड 🏆",
    games_title: "खेल 🎮",
    games_sub: "अपना अध्याय चुनें, फिर खेल चुनें",
    quiz_title: "CBSE प्रश्नोत्तरी",
    quiz_desc: "आपके अध्याय से 5 MCQ प्रश्न। अपनी जानकारी परखें!",
    quiz_xp: "+10 XP प्रति सही उत्तर",
    scramble_title: "शब्द पहेली",
    scramble_desc: "60 सेकंड में अध्याय के शब्द सुलझाएं!",
    scramble_xp: "+8 XP प्रति सही शब्द",
    math_title: "गणित चुनौती",
    math_desc: "5 मानसिक गणित समस्याएं। 10 सेकंड में बोनस XP!",
    math_xp: "+10–20 XP प्रति समस्या",
    resources_title: "📚 संसाधन",
    papers_tab: "📄 प्रश्नपत्र",
    notes_tab: "📒 नोट्स",
    onboard_title: "अपनी पढ़ाई को व्यक्तिगत बनाएं",
    onboard_sub:
      "हमें अपना पिछला परीक्षा स्कोर बताएं ताकि हम प्रश्न आपके अनुसार ढाल सकें",
    marks_scored: "प्राप्त अंक",
    out_of: "कुल अंक",
    start_learning: "पढ़ाई शुरू करें →",
  },
};

function t(key) {
  const lang = getLanguage();
  return (LANG[lang] && LANG[lang][key]) || (LANG.en && LANG.en[key]) || key;
}

function applyNavLang() {
  const map = {
    home: t("nav_home"),
    practice: t("nav_practice"),
    saved: t("nav_saved"),
    stats: t("nav_stats"),
    leaderboard: t("nav_ranks"),
    games: t("nav_games"),
    resources: t("nav_papers"),
  };
  document.querySelectorAll(".nav-btn[data-page]").forEach((btn) => {
    const label = map[btn.dataset.page];
    if (!label) return;
    const spans = btn.querySelectorAll("span");
    if (spans[1]) spans[1].textContent = label;
  });
  const hiFont = "'Noto Sans Devanagari', Inter, system-ui, sans-serif";
  const baseFont = "Inter, system-ui, sans-serif";
  const isHindi = getLanguage() === "hi";
  document.querySelectorAll(".nav-btn").forEach((b) => {
    b.style.fontFamily = isHindi ? hiFont : baseFont;
  });
  if (isHindi) {
    document.body.style.fontFamily = hiFont;
  } else {
    document.body.style.fontFamily = baseFont;
  }
}

function showLanguageSplash(onDone) {
  const splash = document.createElement("div");
  splash.id = "lang-splash";
  splash.style.cssText =
    "position:fixed;inset:0;z-index:9999;background:#07070f;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;font-family:Inter,system-ui,sans-serif;";
  splash.innerHTML = `
    <div style="font-size:3rem;filter:drop-shadow(0 0 20px rgba(79,142,247,0.5))">🎓</div>
    <div style="font-size:1.6rem;font-weight:900;background:linear-gradient(135deg,#4f8ef7,#9b6dff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.02em;">StasisEducation</div>
    <div style="color:#7a8aaa;font-size:0.9rem;">Choose your language / भाषा चुनें</div>
    <div style="display:flex;gap:14px;margin-top:8px;">
      <button id="lang-en" style="padding:14px 32px;border-radius:50px;border:1px solid rgba(79,142,247,0.4);background:rgba(79,142,247,0.1);color:#eef2ff;font-size:1rem;font-weight:700;cursor:pointer;font-family:inherit;">🇬🇧 English</button>
      <button id="lang-hi" style="padding:14px 32px;border-radius:50px;border:1px solid rgba(155,109,255,0.4);background:rgba(155,109,255,0.1);color:#eef2ff;font-size:1rem;font-weight:700;cursor:pointer;font-family:inherit;">🇮🇳 हिंदी</button>
    </div>
  `;
  document.body.appendChild(splash);
  document.getElementById("lang-en").onclick = () => {
    localStorage.setItem("stasis_lang", "en");
    splash.remove();
    onDone();
  };
  document.getElementById("lang-hi").onclick = () => {
    localStorage.setItem("stasis_lang", "hi");
    splash.remove();
    onDone();
  };
}

// ============================================================
// STATE
// ============================================================
function loadState() {
  const def = {
    xp: 0,
    level: 0,
    gems: 0,
    badges: {},
    savedAnswers: [],
    streak: 0,
    lastActiveDate: null,
    bestStreak: 0,
    totalSolved: 0,
    totalPracticed: 0,
    totalSaved: 0,
    subjectCounts: {
      Maths: 0,
      Physics: 0,
      Biology: 0,
      Chemistry: 0,
      History: 0,
      Geography: 0,
      Civics: 0,
      Economics: 0,
      English: 0,
      Hindi: 0,
    },
    classPreference: "10",
    subjectPreference: "Maths",
    chapterPreference: "",
    todayPractice: [],
    todayRevealed: {},
    practiceDate: null,
    practiceChapter: "",
    sessionSolves: 0,
    weeklyXP: Array(7).fill(0),
    activityLog: {},
    dailySubjectLog: {},
    weeklyAnalysisCache: null,
  };
  try {
    const stored = JSON.parse(localStorage.getItem("stasis_state") || "{}");
    return {
      ...def,
      ...stored,
      subjectCounts: { ...def.subjectCounts, ...(stored.subjectCounts || {}) },
      dailySubjectLog: { ...(stored.dailySubjectLog || {}) },
    };
  } catch {
    return def;
  }
}

function saveState() {
  localStorage.setItem("stasis_state", JSON.stringify(S));
}

let S = loadState();

// ============================================================
// ADAPTIVE PERFORMANCE LEVELS
// ============================================================
const PERF_DEFS = {
  beginner: {
    emoji: "🌱",
    name: "Beginner",
    range: "0–40%",
    message: "We'll start with the basics and build your confidence",
  },
  developing: {
    emoji: "📈",
    name: "Developing",
    range: "40–65%",
    message: "We'll strengthen your fundamentals",
  },
  proficient: {
    emoji: "💡",
    name: "Proficient",
    range: "65–85%",
    message: "We'll deepen your understanding",
  },
  advanced: {
    emoji: "🏆",
    name: "Advanced",
    range: "85–100%",
    message: "We'll challenge you with higher order thinking",
  },
};

function loadPerformance() {
  try {
    return JSON.parse(localStorage.getItem("stasis_performance") || "null");
  } catch {
    return null;
  }
}

function savePerformance(data) {
  localStorage.setItem("stasis_performance", JSON.stringify(data));
}

function calcPerfLevel(pct) {
  if (pct < 40) return "beginner";
  if (pct < 65) return "developing";
  if (pct < 85) return "proficient";
  return "advanced";
}

function getPerf() {
  return (
    loadPerformance() || {
      level: "developing",
      levelName: "Developing",
      emoji: "📈",
      percentage: 50,
      message: "We'll strengthen your fundamentals",
    }
  );
}

function showOnboardingModal() {
  const existing = document.getElementById("onboardingOverlay");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.id = "onboardingOverlay";
  el.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px";
  el.innerHTML = `
    <div class="glass modal-box" style="max-width:400px;width:100%;padding:28px 24px">
      <div style="font-size:2.2rem;text-align:center;margin-bottom:6px">🎯</div>
      <div class="modal-title" style="text-align:center">${t("onboard_title")}</div>
      <div class="modal-sub" style="text-align:center;margin-bottom:20px">${t("onboard_sub")}</div>
      <label class="form-label">${t("marks_scored")}</label>
      <input id="ob-scored" type="number" min="0" step="1" class="form-select mb-3" placeholder="e.g. 72" style="width:100%">
      <label class="form-label">${t("out_of")}</label>
      <input id="ob-total" type="number" min="1" step="1" class="form-select mb-3" placeholder="e.g. 100" style="width:100%">
      <div id="ob-preview" style="min-height:64px;margin-bottom:16px"></div>
      <button class="btn btn-primary w-full" onclick="submitOnboarding()">${t("start_learning")}</button>
    </div>
  `;
  document.body.appendChild(el);

  function updatePreview() {
    const scored = parseFloat(document.getElementById("ob-scored").value);
    const total = parseFloat(document.getElementById("ob-total").value);
    const prev = document.getElementById("ob-preview");
    if (!total || total <= 0 || scored < 0 || scored > total || isNaN(scored)) {
      prev.innerHTML = "";
      return;
    }
    const pct = Math.round((scored / total) * 100);
    const lvl = calcPerfLevel(pct);
    const def = PERF_DEFS[lvl];
    prev.innerHTML = `
      <div style="text-align:center;padding:12px 16px;border-radius:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1)">
        <div style="font-size:1.5rem">${def.emoji}</div>
        <div style="font-weight:700;font-size:0.95rem;margin:4px 0">You scored ${pct}% — ${def.name}</div>
        <div style="font-size:0.8rem;color:var(--text-muted);font-style:italic">${def.message}</div>
      </div>
    `;
  }
  document.getElementById("ob-scored").addEventListener("input", updatePreview);
  document.getElementById("ob-total").addEventListener("input", updatePreview);
}

window.submitOnboarding = () => {
  const scored = parseFloat(document.getElementById("ob-scored").value);
  const total = parseFloat(document.getElementById("ob-total").value);
  if (isNaN(scored) || scored < 0) {
    alert("Please enter a valid marks scored");
    return;
  }
  if (!total || total <= 0) {
    alert("Please enter total marks");
    return;
  }
  if (scored > total) {
    alert("Marks scored cannot exceed total marks");
    return;
  }
  const pct = Math.round((scored / total) * 100);
  const lvl = calcPerfLevel(pct);
  const def = PERF_DEFS[lvl];
  savePerformance({
    marksScored: scored,
    totalMarks: total,
    percentage: pct,
    level: lvl,
    levelName: def.name,
    emoji: def.emoji,
    message: def.message,
  });
  const overlay = document.getElementById("onboardingOverlay");
  if (overlay) overlay.remove();
  renderHome();
};

window.updateMyLevel = () => showOnboardingModal();

// ============================================================
// XP / LEVELS
// ============================================================
const LEVELS = [
  { name: "🌱 Rookie", min: 0 },
  { name: "📖 Scholar", min: 150 },
  { name: "💡 Thinker", min: 400 },
  { name: "🧠 Genius", min: 900 },
  { name: "⚔️ Champion", min: 1800 },
  { name: "🏆 Legend", min: 3500 },
];

function getLevel(xp) {
  let lvl = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) {
      lvl = i;
      break;
    }
  }
  return lvl;
}

function getLevelInfo(xp) {
  const lvl = getLevel(xp);
  const cur = LEVELS[lvl];
  const next = LEVELS[lvl + 1];
  const pct = next
    ? Math.min(100, ((xp - cur.min) / (next.min - cur.min)) * 100)
    : 100;
  return { lvl, name: cur.name, pct, next };
}

function addXP(amount, label) {
  const oldLvl = getLevel(S.xp);
  S.xp += amount;
  const dayIdx = new Date().getDay();
  S.weeklyXP[dayIdx] = (S.weeklyXP[dayIdx] || 0) + amount;
  const today = todayKey();
  S.activityLog[today] = (S.activityLog[today] || 0) + amount;
  saveState();
  updateHeader();
  showXPFloat(`+${amount} XP ✨`);
  const newLvl = getLevel(S.xp);
  if (newLvl > oldLvl) showLevelUp(newLvl);
  checkBadges();
}

function showXPFloat(text) {
  const el = document.getElementById("xpFloat");
  el.classList.remove("hidden");
  el.textContent = text;
  el.style.opacity = "1";
  el.style.transform = "translateX(-50%) translateY(0)";
  el.style.transition = "none";
  requestAnimationFrame(() => {
    el.style.transition = "opacity 1.2s ease, transform 1.2s ease";
    el.style.opacity = "0";
    el.style.transform = "translateX(-50%) translateY(-40px)";
  });
  setTimeout(() => {
    el.classList.add("hidden");
    el.style.opacity = "";
    el.style.transform = "";
  }, 1400);
}

// ============================================================
// STREAK
// ============================================================
function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function updateStreak() {
  const today = todayKey();
  if (S.lastActiveDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (S.lastActiveDate === yesterday) {
    S.streak += 1;
  } else if (S.lastActiveDate !== today) {
    S.streak = 1;
  }
  S.lastActiveDate = today;
  if (S.streak > S.bestStreak) S.bestStreak = S.streak;
  saveState();
}

// ============================================================
// WEEKLY ANALYSIS
// ============================================================
function logSubjectActivity(subject) {
  const today = todayKey();
  if (!S.dailySubjectLog[today]) S.dailySubjectLog[today] = {};
  S.dailySubjectLog[today][subject] =
    (S.dailySubjectLog[today][subject] || 0) + 1;
}

function getWeekStartKey() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start.toISOString().split("T")[0];
}

function getWeeklyStats() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const days = [];
  for (let i = 0; i <= dayOfWeek; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - (dayOfWeek - i));
    days.push(d.toISOString().split("T")[0]);
  }
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const subjectTotals = {};
  let totalQuestions = 0;
  let totalXP = 0;
  let activeDays = 0;
  const dailyXP = [];
  days.forEach((d, i) => {
    const xp = S.activityLog[d] || 0;
    totalXP += xp;
    if (xp > 0) activeDays++;
    dailyXP.push({ date: d, label: DOW[i], xp });
    const subj = S.dailySubjectLog[d] || {};
    Object.entries(subj).forEach(([s, c]) => {
      subjectTotals[s] = (subjectTotals[s] || 0) + c;
      totalQuestions += c;
    });
  });
  let topSubject = null;
  let topCount = 0;
  Object.entries(subjectTotals).forEach(([s, c]) => {
    if (c > topCount) {
      topCount = c;
      topSubject = s;
    }
  });
  return {
    days,
    dailyXP,
    subjectTotals,
    totalQuestions,
    totalXP,
    activeDays,
    daysSoFar: days.length,
    topSubject,
    topCount,
  };
}

// ============================================================
// BADGES
// ============================================================
const BADGE_DEFS = [
  {
    id: "first_solve",
    emoji: "🎯",
    name: "First Solve",
    desc: "Solve your first question",
    check: (s) => s.totalSolved >= 1,
  },
  {
    id: "streak3",
    emoji: "🔥",
    name: "3-Day Streak",
    desc: "Keep a 3-day streak",
    check: (s) => s.streak >= 3,
  },
  {
    id: "streak7",
    emoji: "🔥🔥",
    name: "7-Day Streak",
    desc: "Keep a 7-day streak",
    check: (s) => s.streak >= 7,
  },
  {
    id: "subject_master",
    emoji: "📚",
    name: "Subject Master",
    desc: "Answer 10 in one subject",
    check: (s) => Object.values(s.subjectCounts).some((c) => c >= 10),
  },
  {
    id: "speed_solver",
    emoji: "⚡",
    name: "Speed Solver",
    desc: "3 questions one session",
    check: (s) => s.sessionSolves >= 3,
  },
  {
    id: "daily_champ",
    emoji: "🌟",
    name: "Daily Champ",
    desc: "Complete all 3 practice",
    check: (s) => (s.todayPractice || []).filter((p) => p.done).length >= 3,
  },
  {
    id: "top10",
    emoji: "🏅",
    name: "Top 10",
    desc: "Reach top 10 leaderboard",
    check: (s) => s.xp >= 300,
  },
  {
    id: "collector",
    emoji: "💾",
    name: "Collector",
    desc: "Save 10 answers",
    check: (s) => s.totalSaved >= 10,
  },
  {
    id: "math_wizard",
    emoji: "🧮",
    name: "Math Wizard",
    desc: "10 Maths questions",
    check: (s) => (s.subjectCounts.Maths || 0) >= 10,
  },
  {
    id: "science_nerd",
    emoji: "🔬",
    name: "Science Nerd",
    desc: "10 Physics/Bio/Chem questions",
    check: (s) =>
      (s.subjectCounts.Physics || 0) +
        (s.subjectCounts.Biology || 0) +
        (s.subjectCounts.Chemistry || 0) >=
      10,
  },
  {
    id: "bookworm",
    emoji: "📝",
    name: "Bookworm",
    desc: "10 English questions",
    check: (s) => (s.subjectCounts.English || 0) >= 10,
  },
  {
    id: "all_rounder",
    emoji: "🎓",
    name: "All Rounder",
    desc: "Questions in all subjects",
    check: (s) => Object.values(s.subjectCounts).every((c) => c >= 1),
  },
];

function checkBadges() {
  let newBadge = null;
  BADGE_DEFS.forEach((b) => {
    if (!S.badges[b.id] && b.check(S)) {
      S.badges[b.id] = Date.now();
      newBadge = b;
    }
  });
  if (newBadge) {
    saveState();
    showBadgeToast(newBadge);
  }
}

function showBadgeToast(badge) {
  const toast = document.getElementById("badgeToast");
  document.getElementById("badgeToastEmoji").textContent = badge.emoji;
  document.getElementById("badgeToastName").textContent = badge.name;
  toast.classList.remove("hidden");
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.classList.add("hidden"), 400);
  }, 3000);
}

// ============================================================
// LEVEL UP
// ============================================================
function showLevelUp(lvl) {
  const overlay = document.getElementById("levelUpOverlay");
  document.getElementById("levelUpEmoji").textContent =
    LEVELS[lvl].name.split(" ")[0];
  document.getElementById("levelUpSub").textContent =
    `You reached ${LEVELS[lvl].name}!`;
  overlay.classList.remove("hidden");
  startConfetti();
  setTimeout(() => {
    overlay.classList.add("hidden");
    stopConfetti();
  }, 3500);
}

let confettiAnim;
function startConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const pieces = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: -10,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 4 + 2,
    color: ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"][
      Math.floor(Math.random() * 5)
    ],
    size: Math.random() * 8 + 4,
    angle: Math.random() * 360,
    spin: (Math.random() - 0.5) * 8,
  }));
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.angle * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.spin;
    });
    confettiAnim = requestAnimationFrame(draw);
  }
  draw();
}
function stopConfetti() {
  cancelAnimationFrame(confettiAnim);
  const canvas = document.getElementById("confettiCanvas");
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
}

// ============================================================
// HEADER
// ============================================================
function updateHeader() {
  const info = getLevelInfo(S.xp);
  document.getElementById("levelPill").textContent = info.name;
  document.getElementById("xpBar").style.width = info.pct + "%";
  document.getElementById("streakCount").textContent = S.streak;
  document.getElementById("gemsCount").textContent = S.gems;
}

// ============================================================
// ROUTING
// ============================================================
let currentPage = "home";

function navigate(page, extra) {
  currentPage = page;
  document
    .querySelectorAll(".nav-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.page === page));
  const app = document.getElementById("app");
  app.innerHTML = "";
  app.classList.remove("fade-in");
  requestAnimationFrame(() => {
    app.classList.add("fade-in");
    switch (page) {
      case "home":
        renderHome();
        break;
      case "practice":
        renderPractice();
        break;
      case "saved":
        renderSaved();
        break;
      case "stats":
        renderStats();
        break;
      case "leaderboard":
        renderLeaderboard();
        break;
      case "games":
        renderGames();
        break;
      case "quiz":
        renderQuizGame(extra);
        break;
      case "scramble":
        renderScrambleGame(extra);
        break;
      case "math":
        renderMathGame(extra);
        break;
      case "resources":
        renderResources();
        break;
      case "search":
        renderWebSearch();
        break;
    }
  });
}
window.navigate = navigate;

// ============================================================
// API HELPERS
// ============================================================
const BASE = "/api";

async function apiPost(path, body) {
  const r = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`API error ${r.status}`);
  return r.json();
}

function subjectTag(subject) {
  const map = {
    Maths: "maths",
    Physics: "physics",
    Biology: "biology",
    Chemistry: "chemistry",
    History: "history",
    Geography: "geography",
    Civics: "civics",
    Economics: "economics",
    English: "english",
    Hindi: "hindi",
  };
  return `<span class="subject-tag tag-${map[subject] || "maths"}">${subject}</span>`;
}

function chapterTag(chapter) {
  if (!chapter) return "";
  return `<span class="subject-tag" style="background:rgba(139,92,246,0.15);color:#a78bfa;border-color:rgba(139,92,246,0.3)">📖 ${escapeHtml(chapter)}</span>`;
}

function hindiCourseToggle() {
  const course = getHindiCourse();
  return `
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <button type="button" class="class-pill ${course === "A" ? "active" : ""}" onclick="onHindiCourseChange('A')" style="flex:1">Course A</button>
      <button type="button" class="class-pill ${course === "B" ? "active" : ""}" onclick="onHindiCourseChange('B')" style="flex:1">Course B</button>
    </div>
  `;
}

function typingLoader() {
  return `<div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
}

function skeletonCard() {
  return `<div class="glass" style="padding:18px;margin-bottom:12px">
    <div class="skeleton" style="height:14px;width:60%;margin-bottom:10px"></div>
    <div class="skeleton" style="height:12px;width:90%;margin-bottom:6px"></div>
    <div class="skeleton" style="height:12px;width:75%"></div>
  </div>`;
}

// ============================================================
// HOME PAGE
// ============================================================
function renderHome() {
  const app = document.getElementById("app");
  const subjects = [
    "Maths",
    "Physics",
    "Biology",
    "Chemistry",
    "History",
    "Geography",
    "Civics",
    "Economics",
    "English",
    "Hindi",
  ];
  const classes = ["6", "7", "8", "9", "10"];
  const chapters = getChapters(S.classPreference, S.subjectPreference);
  const perf = getPerf();
  const perfDef = PERF_DEFS[perf.level] || PERF_DEFS.developing;

  app.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
      <h1 class="gradient-heading section-heading" style="margin-bottom:0">${t("home_heading")}</h1>
     <button onclick="switchUser()" style="display:flex;flex-direction:column;align-items:center;gap:3px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:8px 12px;cursor:pointer;color:var(--text-muted);font-size:0.65rem;font-weight:700;font-family:inherit;" title="${t("new_user")}">
        <span style="font-size:1.3rem">👤</span>
        <span>${t("new_user")}</span>
      </button>
    </div>
    <p class="section-sub">${t("home_sub")}</p>
    <div style="text-align:center;margin-bottom:10px">
      <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 14px;border-radius:20px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);font-size:0.8rem;color:var(--text-muted)">${t("learning_as")} <strong style="color:var(--text)">${perfDef.emoji} ${perfDef.name}</strong></span>
    </div>

    <div class="stats-row glass mb-4">
      <div class="stat-mini">
        <div class="stat-mini-val">${S.activityLog[todayKey()] || 0}</div>
        <div class="stat-mini-label">${t("today_xp")}</div>
      </div>
      <div class="stat-mini">
        <div class="stat-mini-val">${S.streak}🔥</div>
        <div class="stat-mini-label">${t("streak")}</div>
      </div>
      <div class="stat-mini">
        <div class="stat-mini-val">${S.totalSolved}</div>
        <div class="stat-mini-label">${t("solved")}</div>
      </div>
    </div>

    <div class="glass" style="padding:18px;margin-bottom:16px">
      <label class="form-label">${t("subject")}</label>
      <select id="subjectSel" class="form-select mb-3" onchange="onHomeSubjectChange()">
        ${subjects.map((s) => `<option value="${s}" ${S.subjectPreference === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>

      <div id="hindiCourseWrap" style="display:${S.subjectPreference === "Hindi" ? "block" : "none"}">${hindiCourseToggle()}</div>

      <label class="form-label">${t("class_label")}</label>
      <div class="class-pills mb-3" id="classPills">
        ${classes.map((c) => `<button class="class-pill ${S.classPreference === c ? "active" : ""}" onclick="setClass('${c}')" data-class="${c}">${t("class_label")} ${c}</button>`).join("")}
      </div>

      <label class="form-label">${t("chapter")}</label>
      <select id="chapterSel" class="form-select mb-3">
        <option value="">${t("select_chapter")}</option>
        ${chapters.map((ch) => `<option value="${ch}" ${S.chapterPreference === ch ? "selected" : ""}>${ch}</option>`).join("")}
      </select>

      <label class="form-label">${t("your_question")}</label>
      <textarea id="questionInput" class="form-textarea" placeholder="${t("question_placeholder")}" maxlength="500" oninput="updateCharCount(this)"></textarea>
      <div class="char-counter"><span id="charCount">0</span>/500</div>

      <label for="img-upload-input" style="display:inline-flex;align-items:center;gap:8px;margin-top:10px;padding:9px 18px;border-radius:50px;border:1px dashed rgba(79,142,247,0.4);background:rgba(79,142,247,0.05);color:#4f8ef7;font-size:0.82rem;font-weight:700;cursor:pointer;">
        ${t("upload_photo")}
      </label>
      <input id="img-upload-input" type="file" accept="image/*" style="display:none;" onchange="onImageSelected(this)">
      <div id="img-preview-wrap" style="display:none;margin-top:10px;position:relative;">
        <img id="img-preview" style="width:100%;border-radius:12px;border:1px solid rgba(255,255,255,0.1);max-height:200px;object-fit:contain;">
        <button onclick="removeImage()" style="position:absolute;top:8px;right:8px;background:rgba(240,86,74,0.85);border:none;color:white;border-radius:50%;width:26px;height:26px;cursor:pointer;font-size:0.8rem;">✕</button>
      </div>

      <button class="btn btn-primary w-full mt-3" onclick="solveQuestion()" id="solveBtn">
        ${t("solve_btn")}
      </button>
    </div>

    <div id="solutionArea"></div>
    <div id="recentSolves"></div>
  `;

  renderRecentSolves();

  window._imgData = null;

  window.onImageSelected = (input) => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 800;
        let w = img.width,
          h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) {
            h = Math.round((h * MAX) / w);
            w = MAX;
          } else {
            w = Math.round((w * MAX) / h);
            h = MAX;
          }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        window._imgData = {
          imageBase64: compressed.split(",")[1],
          mimeType: "image/jpeg",
        };
        document.getElementById("img-preview").src = compressed;
        document.getElementById("img-preview-wrap").style.display = "block";
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  window.removeImage = () => {
    window._imgData = null;
    document.getElementById("img-upload-input").value = "";
    document.getElementById("img-preview-wrap").style.display = "none";
  };

  window.onHindiCourseChange = (course) => {
    setHindiCourse(course);
    saveState();
    const chs = getChapters(S.classPreference, "Hindi");
    const opts =
      `<option value="">${t("select_chapter")}</option>` +
      chs.map((ch) => `<option value="${ch}">${ch}</option>`).join("");
    ["hindiCourseWrap", "prefHindiCourseWrap", "gameHindiCourseWrap"].forEach(
      (id) => {
        const wrap = document.getElementById(id);
        if (wrap) wrap.innerHTML = hindiCourseToggle();
      },
    );
    ["chapterSel", "pref-chapter", "gameChapter"].forEach((id) => {
      const sel = document.getElementById(id);
      if (sel) sel.innerHTML = opts;
    });
    S.chapterPreference = "";
    S.practiceChapter = "";
    saveState();
  };

  window.onHomeSubjectChange = () => {
    S.subjectPreference = document.getElementById("subjectSel").value;
    S.chapterPreference = "";
    saveState();
    const wrap = document.getElementById("hindiCourseWrap");
    if (wrap)
      wrap.style.display = S.subjectPreference === "Hindi" ? "block" : "none";
    const chs = getChapters(S.classPreference, S.subjectPreference);
    const sel = document.getElementById("chapterSel");
    sel.innerHTML =
      `<option value="">${t("select_chapter")}</option>` +
      chs.map((ch) => `<option value="${ch}">${ch}</option>`).join("");
  };

  window.setClass = (c) => {
    S.classPreference = c;
    S.chapterPreference = "";
    saveState();
    document
      .querySelectorAll(".class-pill[data-class]")
      .forEach((p) => p.classList.toggle("active", p.dataset.class === c));
    const chs = getChapters(c, document.getElementById("subjectSel").value);
    const sel = document.getElementById("chapterSel");
    sel.innerHTML =
      `<option value="">${t("select_chapter")}</option>` +
      chs.map((ch) => `<option value="${ch}">${ch}</option>`).join("");
  };

  window.updateCharCount = (el) => {
    document.getElementById("charCount").textContent = el.value.length;
  };

  window.solveQuestion = async () => {
    const q = document.getElementById("questionInput").value.trim();
    const subject = document.getElementById("subjectSel").value;
    const chapter = document.getElementById("chapterSel").value;
    const imgData = window._imgData;

    if (!imgData && !q) {
      alert("Please enter a question or upload a photo!");
      return;
    }
    if (!chapter) {
      alert("Please select a chapter first!");
      return;
    }

    S.subjectPreference = subject;
    S.chapterPreference = chapter;
    saveState();

    const btn = document.getElementById("solveBtn");
    btn.disabled = true;
    btn.innerHTML = typingLoader();

    const area = document.getElementById("solutionArea");
    area.innerHTML = `<div class="glass solution-card">${skeletonCard()}</div>`;

    try {
      const endpoint = imgData ? "/solve-image" : "/solve";
      const body = imgData
        ? {
            ...imgData,
            classNum: S.classPreference,
            subject,
            chapter,
            level: getPerf().level,
            language: getLanguage(),
          }
        : {
            question: q,
            subject,
            classNum: S.classPreference,
            chapter,
            level: getPerf().level,
            language: getLanguage(),
          };

      const data = await apiPost(endpoint, body);
      const steps = data.steps || [];
      const solution = data.solution || "";
      const memoryTrick = data.memoryTrick || "";

      window._lastSolution = {
        q: q || "📷 Photo question",
        solution,
        steps: Array.isArray(steps) ? steps : [],
        memoryTrick,
        subject,
        chapter,
        classNum: S.classPreference,
      };

      area.innerHTML = `
        <div class="glass solution-card slide-up">
          <div class="flex items-center justify-between mb-3" style="flex-wrap:wrap;gap:6px">
            ${subjectTag(subject)}
            ${chapterTag(chapter)}
            <span class="xp-badge">+20 XP ✨</span>
          </div>
          ${
            steps.length > 0
              ? steps
                  .map(
                    (step, i) =>
                      `<div class="solution-step"><div class="step-num">${i + 1}</div><div class="step-text">${renderStep(step)}</div></div>`,
                  )
                  .join("")
              : `<div style="line-height:1.7;font-size:0.9rem">${escapeHtml(solution)}</div>`
          }
          ${memoryTrick ? `<div class="glass" style="margin-top:14px;padding:12px 14px;border-left:3px solid var(--purple);background:rgba(139,92,246,0.08)"><span style="font-size:1rem">🧠</span><span style="font-size:0.85rem;color:var(--text-muted);margin-left:6px;font-style:italic">${escapeHtml(memoryTrick)}</span></div>` : ""}
          <div class="flex gap-2 mt-4" style="flex-wrap:wrap">
            <button class="btn btn-secondary btn-sm" id="saveAnswerBtn" onclick="saveAnswer()">${t("save_answer")}</button>
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('questionInput').value='';document.getElementById('solutionArea').innerHTML='';document.getElementById('charCount').textContent='0';window.removeImage&&removeImage()">${t("ask_another")}</button>
          </div>
        </div>
      `;

      S.totalSolved += 1;
      S.sessionSolves += 1;
      S.subjectCounts[subject] = (S.subjectCounts[subject] || 0) + 1;
      logSubjectActivity(subject);
      updateStreak();
      addXP(20, "solve");
      checkBadges();
      renderRecentSolves();
    } catch (e) {
      area.innerHTML = `<div class="glass" style="padding:16px;color:var(--red)">Error: ${e.message}. Please try again.</div>`;
    }
    btn.disabled = false;
    btn.innerHTML = t("solve_btn");
  };

  window.saveAnswer = () => {
    const d = window._lastSolution;
    if (!d) return;
    const btn = document.getElementById("saveAnswerBtn");
    if (btn && btn.dataset.saved) return;
    try {
      S.savedAnswers.unshift({
        id: Date.now(),
        q: d.q || "",
        solution: d.solution || "",
        steps: Array.isArray(d.steps) ? d.steps : [],
        memoryTrick: d.memoryTrick || "",
        subject: d.subject || "",
        chapter: d.chapter || "",
        classNum: d.classNum || "",
        date: new Date().toLocaleDateString("en-IN"),
      });
      if (S.savedAnswers.length > 100) S.savedAnswers.pop();
      S.totalSaved += 1;
      saveState();
      addXP(5, "save");
      checkBadges();
      if (btn) {
        btn.dataset.saved = "1";
        btn.textContent = "✅ Saved!";
        btn.disabled = true;
      }
    } catch (e) {
      if (btn) {
        btn.textContent = "❌ Error saving";
      }
    }
  };
}

function renderRecentSolves() {
  const el = document.getElementById("recentSolves");
  if (!el) return;
  const recent = S.savedAnswers.slice(0, 3);
  if (!recent.length) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = `
    <div style="margin-top:8px">
      <div class="section-sub">Recent Solves</div>
      ${recent
        .map(
          (a) => `
        <div class="glass" style="padding:12px;margin-bottom:8px">
          <div class="flex items-center justify-between mb-1" style="flex-wrap:wrap;gap:4px">
            ${subjectTag(a.subject)}
            ${a.chapter ? chapterTag(a.chapter) : ""}
            <span style="font-size:0.7rem;color:var(--text-muted)">${a.date}</span>
          </div>
          <div style="font-size:0.83rem;color:var(--text-muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(a.q)}</div>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

// ============================================================
// PRACTICE PAGE
// ============================================================
function renderPractice() {
  const app = document.getElementById("app");
  const today = todayKey();
  const isToday = S.practiceDate === today;
  const questions = isToday ? S.todayPractice : [];
  const done = questions.filter((q) => q.done).length;
  const perf = getPerf();
  const perfDef = PERF_DEFS[perf.level] || PERF_DEFS.developing;

  if (!S.classPreference || !S.subjectPreference || !S.practiceChapter) {
    renderPracticeSetup();
    return;
  }

  app.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <div>
        <div class="section-heading">${t("daily_practice")}</div>
        <div class="section-sub">${new Date().toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" })}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:1.4rem;font-weight:800">${done}/3</div>
        <div style="font-size:0.7rem;color:var(--text-muted)">${t("completed")}</div>
      </div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;align-items:center">
      ${subjectTag(S.subjectPreference)}
      ${chapterTag(S.practiceChapter)}
      <button class="btn btn-secondary btn-sm" style="margin-left:auto" onclick="changePracticeChapter()">${t("change_chapter")}</button>
    </div>
    <div style="margin-bottom:10px;font-size:0.8rem;color:var(--text-muted)">${t("questions_for_level")} <strong style="color:var(--text)">${perfDef.emoji} ${perfDef.name}</strong></div>
    <div class="progress-bar-top mb-4">
      <div class="progress-bar-top-inner" style="width:${Math.round((done / 3) * 100)}%"></div>
    </div>
    <div id="practiceCards"></div>
    <div id="countdownArea" style="margin-top:16px"></div>
  `;

  if (done >= 3) showCountdown(document.getElementById("countdownArea"));
  if (!isToday || questions.length === 0) loadPracticeQuestions();
  else renderPracticeCards(questions);
}

function renderPracticeSetup() {
  const app = document.getElementById("app");
  const subjects = [
    "Maths",
    "Physics",
    "Biology",
    "Chemistry",
    "History",
    "Geography",
    "Civics",
    "Economics",
    "English",
    "Hindi",
  ];
  const initClass = S.classPreference || "10";
  const initSubject = S.subjectPreference || "Maths";
  const initChapters = getChapters(initClass, initSubject);

  app.innerHTML = `
    <div class="modal-box" style="margin:0 auto;max-width:100%">
      <div class="modal-title">${t("setup_practice")}</div>
      <div class="modal-sub">${t("setup_sub")}</div>
      <label class="form-label">${t("your_class")}</label>
      <select id="pref-class" class="form-select mb-3" onchange="onPrefClassChange()">
        ${["6", "7", "8", "9", "10"].map((c) => `<option value="${c}" ${initClass === c ? "selected" : ""}>${c}</option>`).join("")}
      </select>
      <label class="form-label">${t("subject")}</label>
      <select id="pref-subject" class="form-select mb-3" onchange="onPrefSubjectChange()">
        ${subjects.map((s) => `<option value="${s}" ${initSubject === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>
      <div id="prefHindiCourseWrap" style="display:${initSubject === "Hindi" ? "block" : "none"}">${hindiCourseToggle()}</div>
      <label class="form-label">${t("chapter")}</label>
      <select id="pref-chapter" class="form-select mb-4">
        <option value="">${t("select_chapter")}</option>
        ${initChapters.map((ch) => `<option value="${ch}" ${S.practiceChapter === ch ? "selected" : ""}>${ch}</option>`).join("")}
      </select>
      <button class="btn btn-primary w-full" onclick="savePracticePrefs()">${t("start_practice")}</button>
    </div>
  `;

  window.onPrefClassChange = () => {
    const cls = document.getElementById("pref-class").value;
    const subj = document.getElementById("pref-subject").value;
    const sel = document.getElementById("pref-chapter");
    sel.innerHTML =
      `<option value="">${t("select_chapter")}</option>` +
      getChapters(cls, subj)
        .map((ch) => `<option value="${ch}">${ch}</option>`)
        .join("");
  };
  window.onPrefSubjectChange = () => {
    const cls = document.getElementById("pref-class").value;
    const subj = document.getElementById("pref-subject").value;
    const wrap = document.getElementById("prefHindiCourseWrap");
    if (wrap) wrap.style.display = subj === "Hindi" ? "block" : "none";
    const sel = document.getElementById("pref-chapter");
    sel.innerHTML =
      `<option value="">${t("select_chapter")}</option>` +
      getChapters(cls, subj)
        .map((ch) => `<option value="${ch}">${ch}</option>`)
        .join("");
  };
  window.savePracticePrefs = () => {
    const cls = document.getElementById("pref-class").value;
    const subj = document.getElementById("pref-subject").value;
    const ch = document.getElementById("pref-chapter").value;
    if (!ch) {
      alert("Please select a chapter!");
      return;
    }
    S.classPreference = cls;
    S.subjectPreference = subj;
    S.practiceChapter = ch;
    S.todayPractice = [];
    S.practiceDate = null;
    saveState();
    renderPractice();
  };
}

window.changePracticeChapter = () => {
  S.practiceChapter = "";
  S.todayPractice = [];
  S.practiceDate = null;
  saveState();
  renderPracticeSetup();
};

async function loadPracticeQuestions() {
  const cardsEl = document.getElementById("practiceCards");
  if (!cardsEl) return;
  cardsEl.innerHTML = `${skeletonCard()}${skeletonCard()}${skeletonCard()}`;
  try {
    const data = await apiPost("/practice", {
      classNum: S.classPreference,
      subject: S.subjectPreference,
      chapter: S.practiceChapter,
      level: getPerf().level,
    });
    const questions = (data.questions || []).map((q) => ({
      ...q,
      done: false,
      submitted: false,
    }));
    S.todayPractice = questions;
    S.practiceDate = todayKey();
    S.todayRevealed = {};
    saveState();
    renderPracticeCards(questions);
  } catch (e) {
    cardsEl.innerHTML = `<div class="glass" style="padding:16px;color:var(--red)">Could not load questions. ${e.message}</div>`;
  }
}

function renderPracticeCards(questions) {
  const cardsEl = document.getElementById("practiceCards");
  if (!cardsEl) return;
  cardsEl.innerHTML = questions
    .map(
      (q, i) => `
    <div class="glass practice-card" id="pcard-${i}">
      <div class="flex items-center justify-between mb-2" style="flex-wrap:wrap;gap:4px">
        <span style="font-size:0.75rem;font-weight:700;color:var(--text-muted)">Q${i + 1} · ${q.difficulty || "Medium"}</span>
        ${chapterTag(S.practiceChapter)}
        ${q.done ? '<span style="color:var(--green);font-weight:700">✅ Done</span>' : ""}
      </div>
      <div class="practice-q">${escapeHtml(q.question)}</div>
      ${
        !q.done
          ? `
        <textarea class="form-textarea" id="pans-${i}" placeholder="${t("type_answer")}" style="min-height:80px"></textarea>
        <button class="btn btn-primary btn-sm mt-2" onclick="submitPractice(${i})">${t("submit_answer")}</button>
      `
          : `
        <div class="practice-result ${q.correct ? "correct" : "wrong"}">
          <div class="answer-result-icon">${q.correct ? "✅" : "❌"}</div>
          ${escapeHtml(q.feedback || "")}
        </div>
      `
      }
      <div id="pres-${i}"></div>
    </div>
  `,
    )
    .join("");
}

window.submitPractice = async (i) => {
  const q = S.todayPractice[i];
  const ansEl = document.getElementById(`pans-${i}`);
  const resEl = document.getElementById(`pres-${i}`);
  const userAnswer = ansEl ? ansEl.value.trim() : "";
  if (!userAnswer) {
    alert("Please write your answer first!");
    return;
  }
  const btn = document.querySelector(`#pcard-${i} button`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = typingLoader();
  }
  resEl.innerHTML = `<div style="margin-top:8px">${typingLoader()}</div>`;
  try {
    const data = await apiPost("/check", {
      question: q.question,
      userAnswer,
      subject: S.subjectPreference,
      classNum: S.classPreference,
      chapter: S.practiceChapter,
    });
    q.done = true;
    q.correct = data.correct;
    q.feedback = data.feedback;
    q.submitted = true;
    S.totalPracticed += 1;
    addXP(data.correct ? 25 : 15, "practice");
    S.subjectCounts[S.subjectPreference] =
      (S.subjectCounts[S.subjectPreference] || 0) + 1;
    logSubjectActivity(S.subjectPreference);
    saveState();
    checkBadges();
    renderPractice();
  } catch (e) {
    resEl.innerHTML = `<div style="color:var(--red);margin-top:8px">Error: ${e.message}</div>`;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "Submit Answer";
    }
  }
};

function showCountdown(el) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  function update() {
    const diff = tomorrow - Date.now();
    if (diff <= 0) {
      el.innerHTML = "";
      return;
    }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.innerHTML = `<div class="countdown">🕐 Next reset in ${h}h ${m}m ${s}s</div>`;
    setTimeout(update, 1000);
  }
  update();
}

// ============================================================
// SAVED PAGE
// ============================================================
function renderSaved() {
  const app = document.getElementById("app");
  const subjects = [
    "All",
    "Maths",
    "Physics",
    "Biology",
    "Chemistry",
    "History",
    "Geography",
    "Civics",
    "Economics",
    "English",
    "Hindi",
  ];
  app.innerHTML = `
    <div class="section-heading mb-2">${t("saved_answers")}</div>
    <div class="search-bar mb-3">
      <span class="search-icon">🔍</span>
      <input type="search" class="form-input" id="savedSearch" placeholder="${t("search_saved")}" oninput="filterSaved()">
    </div>
    <div class="filter-pills mb-4" id="savedFilters">
      ${subjects.map((s) => `<button class="filter-pill ${s === "All" ? "active" : ""}" onclick="setSavedFilter('${s}')" data-filter="${s}">${s}</button>`).join("")}
    </div>
    <div class="saved-grid" id="savedGrid"></div>
  `;

  let activeFilter = "All";
  window.setSavedFilter = (f) => {
    activeFilter = f;
    document
      .querySelectorAll("#savedFilters .filter-pill")
      .forEach((p) => p.classList.toggle("active", p.dataset.filter === f));
    filterSaved();
  };
  window.filterSaved = () => {
    const q = (
      document.getElementById("savedSearch")?.value || ""
    ).toLowerCase();
    const filtered = S.savedAnswers.filter(
      (a) =>
        (activeFilter === "All" || a.subject === activeFilter) &&
        (!q ||
          a.q.toLowerCase().includes(q) ||
          (a.solution || "").toLowerCase().includes(q)),
    );
    renderSavedGrid(filtered);
  };
  window.deleteSaved = (id) => {
    S.savedAnswers = S.savedAnswers.filter((a) => a.id !== id);
    saveState();
    filterSaved();
  };
  window.toggleSavedCard = (id) => {
    const detail = document.getElementById(`saved-detail-${id}`);
    const arrow = document.getElementById(`saved-arrow-${id}`);
    if (!detail) return;
    const open = detail.style.display === "block";
    detail.style.display = open ? "none" : "block";
    if (arrow) arrow.textContent = open ? "▼" : "▲";
  };
  filterSaved();
}

function renderSavedGrid(items) {
  const grid = document.getElementById("savedGrid");
  if (!items.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💡</div><div class="empty-state-text">${t("nothing_saved")}</div></div>`;
    return;
  }
  grid.innerHTML = items
    .map((a) => {
      const steps = Array.isArray(a.steps) ? a.steps : [];
      const hasFull = steps.length > 0 || a.solution;
      return `
      <div class="glass saved-card" style="cursor:pointer" onclick="toggleSavedCard(${a.id})">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
          <div style="flex:1;min-width:0">
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;align-items:center">
              ${subjectTag(a.subject)}
              ${a.chapter ? chapterTag(a.chapter) : ""}
              <span style="font-size:0.7rem;color:var(--text-muted);margin-left:auto">${a.date}</span>
            </div>
            <div class="saved-q" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(a.q)}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0">
            ${hasFull ? `<span id="saved-arrow-${a.id}" style="color:var(--text-muted);font-size:0.75rem">▼</span>` : ""}
            <button class="saved-delete" onclick="event.stopPropagation();deleteSaved(${a.id})">🗑</button>
          </div>
        </div>
        <div id="saved-detail-${a.id}" style="display:none;margin-top:12px;border-top:1px solid rgba(255,255,255,0.06);padding-top:12px">
          ${steps.length > 0 ? steps.map((step, i) => `<div class="solution-step" style="margin-bottom:8px"><div class="step-num">${i + 1}</div><div class="step-text">${renderStep(step)}</div></div>`).join("") : a.solution ? `<div style="font-size:0.85rem;line-height:1.7;color:var(--text-secondary)">${escapeHtml(a.solution)}</div>` : ""}
          ${a.memoryTrick ? `<div class="glass" style="margin-top:10px;padding:10px 12px;border-left:3px solid var(--purple);background:rgba(139,92,246,0.08)"><span>🧠</span><span style="font-size:0.82rem;color:var(--text-muted);margin-left:6px;font-style:italic">${escapeHtml(a.memoryTrick)}</span></div>` : ""}
        </div>
      </div>
    `;
    })
    .join("");
}

// ============================================================
// STATS PAGE
// ============================================================
function renderStats() {
  const app = document.getElementById("app");
  const info = getLevelInfo(S.xp);
  const avatarEmojis = ["🌱", "📖", "💡", "🧠", "⚔️", "🏆"];
  const lvlIdx = info.lvl;
  const perf = getPerf();
  const perfDef = PERF_DEFS[perf.level] || PERF_DEFS.developing;
  const subjects = [
    "Maths",
    "Physics",
    "Biology",
    "Chemistry",
    "History",
    "Geography",
    "Civics",
    "Economics",
    "English",
    "Hindi",
  ];
  const maxCount = Math.max(1, ...subjects.map((s) => S.subjectCounts[s] || 0));
  const days30 = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
    const xp = S.activityLog[d] || 0;
    days30.push({ d, heat: xp === 0 ? 0 : xp < 20 ? 1 : xp < 50 ? 2 : 3 });
  }
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const maxW = Math.max(1, ...S.weeklyXP);

  const wk = getWeeklyStats();
  const wkSubjects = Object.keys(wk.subjectTotals);
  const wkMaxCount = Math.max(1, ...wkSubjects.map((s) => wk.subjectTotals[s]));
  const wkMaxXP = Math.max(1, ...wk.dailyXP.map((d) => d.xp));
  const weekKey = getWeekStartKey();
  const cachedAnalysis =
    S.weeklyAnalysisCache && S.weeklyAnalysisCache.weekKey === weekKey
      ? S.weeklyAnalysisCache.data
      : null;

  app.innerHTML = `
    <div class="glass profile-card mb-4">
      <div class="avatar-emoji">${avatarEmojis[lvlIdx]}</div>
      <div class="profile-name">${getName() || "Student"}</div>
      <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px">${LEVELS[lvlIdx].name}</div>
      <div style="width:100%;max-width:200px">
        <div class="flex justify-between text-sm text-muted mb-1">
          <span>${S.xp} XP</span>
          <span>${info.next ? LEVELS[lvlIdx + 1].name : "MAX"}</span>
        </div>
        <div class="xp-bar-wrap" style="width:100%;height:8px"><div class="xp-bar" style="width:${info.pct}%"></div></div>
        <div class="text-muted mt-1" style="font-size:0.75rem;text-align:center">${info.next ? `${LEVELS[lvlIdx + 1].min - S.xp} XP to next level` : "Maximum level!"}</div>
      </div>
    </div>
    <div class="glass" style="padding:16px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.04em">${t("your_level")}</div>
        <div style="font-size:1.05rem;font-weight:700">${perfDef.emoji} ${perfDef.name} <span style="font-size:0.8rem;color:var(--text-muted);font-weight:400">(${perf.percentage}%)</span></div>
        <div style="font-size:0.78rem;color:var(--text-muted);font-style:italic;margin-top:2px">${perfDef.message}</div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="updateMyLevel()">${t("update_score")}</button>
    </div>
    <div class="stats-grid mb-4">
      <div class="glass stat-card"><div class="stat-val">${S.totalSolved}</div><div class="stat-label">${t("questions_solved")}</div></div>
      <div class="glass stat-card"><div class="stat-val">${S.streak}🔥</div><div class="stat-label">${t("current_streak")}</div></div>
      <div class="glass stat-card"><div class="stat-val">${S.bestStreak}</div><div class="stat-label">${t("best_streak")}</div></div>
      <div class="glass stat-card"><div class="stat-val">${S.xp}</div><div class="stat-label">${t("total_xp")}</div></div>
    </div>
    <div class="glass" style="padding:18px;margin-bottom:16px">
      <div class="section-sub">${t("subject_breakdown")}</div>
      <div class="bar-chart">
        ${subjects.map((s) => `<div class="bar-row"><div class="bar-subject">${s}</div><div class="bar-outer"><div class="bar-inner" style="width:${Math.round(((S.subjectCounts[s] || 0) / maxCount) * 100)}%"></div></div><div class="bar-count">${S.subjectCounts[s] || 0}</div></div>`).join("")}
      </div>
    </div>
    <div class="glass" style="padding:18px;margin-bottom:16px">
      <div class="section-sub">${t("activity_30")}</div>
      <div class="heatmap">${days30.map((d) => `<div class="heatmap-day heat-${d.heat}" title="${d.d}"></div>`).join("")}</div>
    </div>
    <div class="glass" style="padding:18px;margin-bottom:16px">
      <div class="section-sub">${t("weekly_xp")}</div>
      <div class="weekly-chart">
        ${S.weeklyXP.map((xp, i) => `<div class="weekly-bar-wrap"><div class="weekly-bar-outer"><div class="weekly-bar" style="height:${Math.round((xp / maxW) * 100)}%"></div></div><div class="weekly-day">${days[i]}</div></div>`).join("")}
      </div>
    </div>
    <div class="glass" style="padding:18px;margin-bottom:16px">
      <div class="flex items-center justify-between mb-2">
        <div class="section-sub" style="margin-bottom:0">📊 This Week's Analysis</div>
        <span style="font-size:0.7rem;color:var(--text-muted)">${new Date(weekKey).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} – Today</span>
      </div>
      <div class="stats-grid mb-3" style="margin-bottom:14px">
        <div class="glass stat-card"><div class="stat-val">${wk.totalQuestions}</div><div class="stat-label">Questions</div></div>
        <div class="glass stat-card"><div class="stat-val">${wk.activeDays}/${wk.daysSoFar}</div><div class="stat-label">Active Days</div></div>
        <div class="glass stat-card"><div class="stat-val" style="font-size:0.95rem">${wk.topSubject || "—"}</div><div class="stat-label">Top Subject</div></div>
        <div class="glass stat-card"><div class="stat-val">${wk.totalXP}</div><div class="stat-label">XP This Week</div></div>
      </div>
      <div class="weekly-chart mb-3">
        ${wk.dailyXP.map((d) => `<div class="weekly-bar-wrap"><div class="weekly-bar-outer"><div class="weekly-bar" style="height:${Math.round((d.xp / wkMaxXP) * 100)}%"></div></div><div class="weekly-day">${d.label}</div></div>`).join("")}
      </div>
      ${
        wkSubjects.length > 0
          ? `<div class="bar-chart mb-3">
              ${wkSubjects.map((s) => `<div class="bar-row"><div class="bar-subject">${s}</div><div class="bar-outer"><div class="bar-inner" style="width:${Math.round((wk.subjectTotals[s] / wkMaxCount) * 100)}%"></div></div><div class="bar-count">${wk.subjectTotals[s]}</div></div>`).join("")}
            </div>`
          : `<div style="font-size:0.8rem;color:var(--text-muted);text-align:center;padding:8px 0;margin-bottom:10px">No questions logged yet this week — go solve or practice something!</div>`
      }
      <div id="aiInsightsArea" style="border-top:1px solid rgba(255,255,255,0.07);padding-top:14px;margin-top:4px">
        ${cachedAnalysis ? renderAIInsightsHTML(cachedAnalysis) : renderAIInsightsPrompt()}
      </div>
    </div>
    <div class="glass" style="padding:18px;margin-bottom:16px">
      <div class="section-sub">Badges</div>
      <div class="badges-grid">
        ${BADGE_DEFS.map((b) => `<div class="badge-item ${S.badges[b.id] ? "earned" : "locked"}" title="${b.desc}"><div class="badge-emoji">${b.emoji}</div><div class="badge-name">${b.name}</div></div>`).join("")}
      </div>
    </div>
  `;
}

function renderAIInsightsPrompt() {
  return `
    <div style="text-align:center">
      <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:10px">Get an AI-written summary of your strengths, weak areas, and tips based on this week's activity.</div>
      <button class="btn btn-primary btn-sm" onclick="generateWeeklyAnalysis()">✨ Generate AI Insights</button>
    </div>
  `;
}

function renderAIInsightsHTML(data) {
  const strengths = Array.isArray(data.strengths) ? data.strengths : [];
  const weakAreas = Array.isArray(data.weakAreas) ? data.weakAreas : [];
  const tips = Array.isArray(data.tips) ? data.tips : [];
  return `
    ${data.summary ? `<div style="font-size:0.85rem;line-height:1.6;color:var(--text-secondary);margin-bottom:12px">${escapeHtml(data.summary)}</div>` : ""}
    ${
      strengths.length
        ? `<div style="margin-bottom:10px">
            <div style="font-size:0.72rem;font-weight:800;letter-spacing:0.06em;color:var(--green);text-transform:uppercase;margin-bottom:6px">✅ Strengths</div>
            ${strengths.map((s) => `<div style="font-size:0.83rem;color:var(--text-secondary);padding:3px 0">• ${escapeHtml(s)}</div>`).join("")}
          </div>`
        : ""
    }
    ${
      weakAreas.length
        ? `<div style="margin-bottom:10px">
            <div style="font-size:0.72rem;font-weight:800;letter-spacing:0.06em;color:var(--gold);text-transform:uppercase;margin-bottom:6px">⚠️ Weak Areas</div>
            ${weakAreas.map((s) => `<div style="font-size:0.83rem;color:var(--text-secondary);padding:3px 0">• ${escapeHtml(s)}</div>`).join("")}
          </div>`
        : ""
    }
    ${
      tips.length
        ? `<div style="margin-bottom:10px">
            <div style="font-size:0.72rem;font-weight:800;letter-spacing:0.06em;color:#4f8ef7;text-transform:uppercase;margin-bottom:6px">💡 Tips</div>
            ${tips.map((s) => `<div style="font-size:0.83rem;color:var(--text-secondary);padding:3px 0">• ${escapeHtml(s)}</div>`).join("")}
          </div>`
        : ""
    }
    <button class="btn btn-secondary btn-sm mt-1" onclick="generateWeeklyAnalysis()">🔄 Regenerate</button>
  `;
}

window.generateWeeklyAnalysis = async () => {
  const area = document.getElementById("aiInsightsArea");
  if (!area) return;
  area.innerHTML = `<div class="text-center">${typingLoader()}<div style="font-size:0.8rem;color:var(--text-muted);margin-top:8px">Analyzing your week...</div></div>`;
  try {
    const wk = getWeeklyStats();
    const data = await apiPost("/weekly-analysis", {
      subjectTotals: wk.subjectTotals,
      totalQuestions: wk.totalQuestions,
      totalXP: wk.totalXP,
      activeDays: wk.activeDays,
      daysSoFar: wk.daysSoFar,
      level: getPerf().level,
      classNum: S.classPreference,
    });
    S.weeklyAnalysisCache = {
      weekKey: getWeekStartKey(),
      generatedAt: Date.now(),
      data,
    };
    saveState();
    area.innerHTML = renderAIInsightsHTML(data);
  } catch (e) {
    area.innerHTML = `<div style="padding:10px 0;color:var(--red);font-size:0.85rem">Could not generate insights: ${e.message}</div><button class="btn btn-secondary btn-sm mt-1" onclick="generateWeeklyAnalysis()">Try Again</button>`;
  }
};

// ============================================================
// LEADERBOARD PAGE
// ============================================================
function renderLeaderboard() {
  const app = document.getElementById("app");
  // Static demo players — only name/xp/streak are authored; level is
  // ALWAYS derived from xp via getLevelInfo() so it can never drift
  // out of sync with the real LEVELS table (this was bug #1).
  const players = [
    { name: "Aarav Sharma", xp: 4200, streak: 21 },
    { name: "Priya Patel", xp: 3650, streak: 15 },
    { name: "Rohan Gupta", xp: 1920, streak: 12 },
    { name: "Sneha Iyer", xp: 1650, streak: 9 },
    { name: "Karan Singh", xp: 1380, streak: 7 },
    { name: "Ananya Reddy", xp: 1120, streak: 6 },
    { name: "Vivek Nair", xp: 890, streak: 5 },
    { name: "Divya Mehta", xp: 710, streak: 4 },
    { name: "Arjun Kumar", xp: 540, streak: 3 },
  ].map((p) => ({ ...p, level: getLevelInfo(p.xp).name }));

  const myXP = S.xp;
  const myLevel = getLevelInfo(S.xp).name;
  const allPlayers = [
    ...players,
    {
      name: getName() || "You",
      level: myLevel,
      xp: myXP,
      streak: S.streak,
      isMe: true,
    },
  ];
  allPlayers.sort((a, b) => b.xp - a.xp);
  let myRank = 1;
  allPlayers.forEach((p, i) => {
    if (p.isMe) myRank = i + 1;
  });
  const top3 = players.slice(0, 3);
  const crowns = ["👑", "🥈", "🥉"];
  const avatars = ["🎯", "⭐", "🌟", "💫", "✨", "🌙", "☀️", "🔥", "⚡", "🎖"];
  const xpToRank9 = players[8].xp - myXP;

  app.innerHTML = `
    <div class="section-heading mb-4">${t("leaderboard_title")}</div>
    <div class="podium mb-4">
      <div class="podium-place"><div class="podium-block p2"><div class="podium-avatar">${avatars[1]}</div><div class="podium-name">${top3[1].name.split(" ")[0]}</div><div class="podium-xp">${top3[1].xp} XP</div></div><div style="font-size:0.8rem;color:var(--text-muted)">${crowns[1]}</div></div>
      <div class="podium-place"><div class="podium-block p1"><div class="podium-avatar">${avatars[0]}</div><div class="podium-name">${top3[0].name.split(" ")[0]}</div><div class="podium-xp">${top3[0].xp} XP</div></div><div style="font-size:0.8rem;color:var(--gold)">${crowns[0]}</div></div>
      <div class="podium-place"><div class="podium-block p3"><div class="podium-avatar">${avatars[2]}</div><div class="podium-name">${top3[2].name.split(" ")[0]}</div><div class="podium-xp">${top3[2].xp} XP</div></div><div style="font-size:0.8rem;color:var(--text-muted)">${crowns[2]}</div></div>
    </div>
    <div class="glass" style="padding:4px;overflow:hidden">
      <table class="lb-table">
        <thead><tr><th>#</th><th></th><th>Name</th><th>Level</th><th>XP</th><th>🔥</th></tr></thead>
        <tbody>
          ${allPlayers.map((p, i) => `<tr class="${p.isMe ? "me" : ""}"><td style="font-weight:700;color:${i < 3 ? "var(--gold)" : "var(--text-muted)"}">${i + 1}</td><td class="lb-avatar-cell">${avatars[i % avatars.length]}</td><td style="font-weight:${p.isMe ? "700" : "400"}">${p.isMe ? `👤 ${escapeHtml(getName() || "You")}` : escapeHtml(p.name)}</td><td style="font-size:0.75rem;color:var(--text-muted)">${p.level}</td><td style="font-weight:600">${p.xp}</td><td>${p.streak}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
    ${xpToRank9 > 0 ? `<div class="motivational mt-3">Solve ${xpToRank9} more XP to reach rank #9!</div>` : `<div class="motivational mt-3">🎉 You're in the top 10!</div>`}
  `;
}

// ============================================================
// GAMES PAGE
// ============================================================
function renderGames() {
  const app = document.getElementById("app");
  const subjects = [
    "Maths",
    "Physics",
    "Biology",
    "Chemistry",
    "History",
    "Geography",
    "Civics",
    "Economics",
    "English",
    "Hindi",
  ];
  const initClass = S.classPreference || "10";
  const initSubject = S.subjectPreference || "Maths";
  const initChapters = getChapters(initClass, initSubject);

  app.innerHTML = `
    <div class="section-heading mb-1">${t("games_title")}</div>
    <div class="section-sub mb-3">${t("games_sub")}</div>
    <div class="glass" style="padding:16px;margin-bottom:16px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
        <div>
          <label class="form-label" style="margin-bottom:4px">${t("class_label")}</label>
          <select id="gameClass" class="form-select" onchange="onGameClassChange()">
            ${["6", "7", "8", "9", "10"].map((c) => `<option value="${c}" ${initClass === c ? "selected" : ""}>${c}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="form-label" style="margin-bottom:4px">${t("subject")}</label>
          <select id="gameSubject" class="form-select" onchange="onGameSubjectChange()">
            ${subjects.map((s) => `<option value="${s}" ${initSubject === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
      </div>
      <div id="gameHindiCourseWrap" style="display:${initSubject === "Hindi" ? "block" : "none"}">${hindiCourseToggle()}</div>
      <label class="form-label" style="margin-bottom:4px">${t("chapter")}</label>
      <select id="gameChapter" class="form-select">
        <option value="">${t("select_chapter")}</option>
        ${initChapters.map((ch) => `<option value="${ch}" ${S.chapterPreference === ch ? "selected" : ""}>${ch}</option>`).join("")}
      </select>
    </div>
    <div class="game-cards">
      <div class="glass game-card" onclick="startGame('quiz')"><div class="game-icon">🧠</div><div class="game-info"><div class="game-title">${t("quiz_title")}</div><div class="game-desc">${t("quiz_desc")}</div><div class="game-xp">${t("quiz_xp")}</div></div><div style="color:var(--text-muted)">›</div></div>
      <div class="glass game-card" onclick="startGame('scramble')"><div class="game-icon">🔤</div><div class="game-info"><div class="game-title">${t("scramble_title")}</div><div class="game-desc">${t("scramble_desc")}</div><div class="game-xp">${t("scramble_xp")}</div></div><div style="color:var(--text-muted)">›</div></div>
      <div class="glass game-card" onclick="startGame('math')"><div class="game-icon">🧮</div><div class="game-info"><div class="game-title">${t("math_title")}</div><div class="game-desc">${t("math_desc")}</div><div class="game-xp">${t("math_xp")}</div></div><div style="color:var(--text-muted)">›</div></div>
    </div>
  `;

  window.onGameClassChange = () => {
    const sel = document.getElementById("gameChapter");
    sel.innerHTML =
      `<option value="">${t("select_chapter")}</option>` +
      getChapters(
        document.getElementById("gameClass").value,
        document.getElementById("gameSubject").value,
      )
        .map((ch) => `<option value="${ch}">${ch}</option>`)
        .join("");
  };
  window.onGameSubjectChange = () => {
    const subj = document.getElementById("gameSubject").value;
    const wrap = document.getElementById("gameHindiCourseWrap");
    if (wrap) wrap.style.display = subj === "Hindi" ? "block" : "none";
    const sel = document.getElementById("gameChapter");
    sel.innerHTML =
      `<option value="">${t("select_chapter")}</option>` +
      getChapters(document.getElementById("gameClass").value, subj)
        .map((ch) => `<option value="${ch}">${ch}</option>`)
        .join("");
  };
  window.startGame = async (type) => {
    const classNum = document.getElementById("gameClass").value;
    const subject = document.getElementById("gameSubject").value;
    const chapter = document.getElementById("gameChapter").value;
    if (!chapter) {
      alert("Please select a chapter first!");
      return;
    }
    S.classPreference = classNum;
    S.subjectPreference = subject;
    S.chapterPreference = chapter;
    saveState();
    _gameConfig = { classNum, subject, chapter, level: getPerf().level };
    await _launchGame(type, classNum, subject, chapter);
  };
  window.replayGame = async (type) => {
    const { classNum, subject, chapter } = _gameConfig;
    await _launchGame(type, classNum, subject, chapter);
  };
}

async function _launchGame(type, classNum, subject, chapter) {
  const app2 = document.getElementById("app");
  app2.innerHTML = `<div class="text-center" style="margin-top:60px">${typingLoader()}<div class="text-muted mt-3" style="font-size:0.9rem">Loading ${type}...</div></div>`;
  try {
    if (type === "quiz") {
      const data = await apiPost("/quiz", {
        classNum,
        subject,
        chapter,
        level: _gameConfig.level || getPerf().level,
      });
      navigate("quiz", { questions: data.questions || [], subject, chapter });
    } else if (type === "scramble") {
      const data = await apiPost("/scramble", { classNum, subject, chapter });
      navigate("scramble", { words: data.words || [], subject, chapter });
    } else if (type === "math") {
      const data = await apiPost("/mathchallenge", { classNum, chapter });
      navigate("math", { problems: data.problems || [], chapter });
    }
  } catch (e) {
    app2.innerHTML = `<div class="glass" style="padding:20px;color:var(--red)">Failed to load game: ${e.message}<br><br><button class="btn btn-secondary btn-sm" onclick="navigate('games')">Back</button></div>`;
  }
}

// ============================================================
// QUIZ GAME
// ============================================================
function renderQuizGame(extra) {
  const app = document.getElementById("app");
  const questions = extra?.questions || extra || [];
  const subject = extra?.subject || S.subjectPreference;
  const chapter = extra?.chapter || "";
  if (!questions || !questions.length) {
    app.innerHTML = `<div class="glass" style="padding:20px;color:var(--red)">No questions loaded.<br><button class="btn btn-secondary btn-sm mt-3" onclick="navigate('games')">Back</button></div>`;
    return;
  }
  let current = 0,
    score = 0,
    answered = false;
  function renderQ() {
    const q = questions[current];
    const opts = q.options || [];
    app.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <button class="btn btn-secondary btn-sm" onclick="navigate('games')">← Back</button>
        <span style="font-size:0.85rem;font-weight:600;color:var(--text-muted)">Q${current + 1}/${questions.length}</span>
        <span style="font-weight:700;color:var(--gold)">${score} pts</span>
      </div>
      <div class="quiz-progress mb-4"><div class="quiz-progress-bar" style="width:${Math.round((current / questions.length) * 100)}%"></div></div>
      <div class="glass" style="padding:20px">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${subjectTag(subject)}${chapterTag(chapter)}</div>
        <div class="quiz-question mt-3">${escapeHtml(q.question)}</div>
        <div class="quiz-options" id="quizOpts">
          ${opts
            .map((o, i) => {
              const clean = o.replace(/^[A-Da-d][.)]\s*/, "");
              return `<button class="quiz-option" onclick="selectQuizOpt(${i},'${q.answer}')" data-idx="${i}">${String.fromCharCode(65 + i)}. ${escapeHtml(clean)}</button>`;
            })
            .join("")}
        </div>
        <div id="quizFeedback" style="margin-top:12px"></div>
        <button class="btn btn-primary w-full mt-3" id="quizNext" style="display:none" onclick="nextQuizQ()">${current < questions.length - 1 ? "Next →" : "See Results"}</button>
      </div>
    `;
  }
  window.selectQuizOpt = (idx, correctLetter) => {
    if (answered) return;
    answered = true;
    const q = questions[current];
    const opts = q.options || [];
    const correctIdx = correctLetter.charCodeAt(0) - 65;
    const isCorrect = idx === correctIdx;
    if (isCorrect) {
      score++;
      addXP(10, "quiz");
    }
    document.querySelectorAll(".quiz-option").forEach((el, i) => {
      if (i === correctIdx) el.classList.add("correct");
      else if (i === idx && !isCorrect) el.classList.add("wrong");
      el.disabled = true;
    });
    document.getElementById("quizFeedback").innerHTML = isCorrect
      ? '<div style="color:var(--green);font-weight:600">✅ Correct! +10 XP</div>'
      : `<div style="color:var(--red);font-weight:600">❌ Correct answer: ${String.fromCharCode(65 + correctIdx)}. ${escapeHtml((opts[correctIdx] || "").replace(/^[A-Da-d][.)]\s*/, ""))}</div>`;
    document.getElementById("quizNext").style.display = "block";
  };
  window.nextQuizQ = () => {
    current++;
    answered = false;
    if (current >= questions.length) showQuizResults(score, questions.length);
    else renderQ();
  };
  renderQ();
}

function showQuizResults(score, total) {
  document.getElementById("app").innerHTML = `
    <div class="glass score-card">
      <div style="font-size:2rem;margin-bottom:8px">🧠</div>
      <div class="score-big">${score}/${total}</div>
      <div style="color:var(--text-muted);margin-top:4px">Quiz Complete!</div>
      <div class="xp-badge mt-3">+${score * 10} XP earned</div>
      <div class="mt-4 flex gap-2" style="justify-content:center;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="replayGame('quiz')">Play Again</button>
        <button class="btn btn-secondary btn-sm" onclick="navigate('games')">Back to Games</button>
      </div>
    </div>
  `;
}

// ============================================================
// WORD SCRAMBLE GAME
// ============================================================
function renderScrambleGame(extra) {
  const words = extra?.words || extra || [];
  const subject = extra?.subject || S.subjectPreference;
  const chapter = extra?.chapter || "";
  if (!words || !words.length) {
    navigate("games");
    return;
  }
  let current = 0,
    score = 0,
    timer = 60,
    timerInterval;

  function scrambleWord(w) {
    const arr = w.split("");
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const result = arr.join("");
    return result === w && w.length > 1 ? scrambleWord(w) : result;
  }

  function renderW() {
    const word = words[current];
    const scrambled = scrambleWord(word).toUpperCase();
    document.getElementById("app").innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <button class="btn btn-secondary btn-sm" onclick="clearInterval(window.__scrambleTimer);navigate('games')">← Back</button>
        <span style="font-size:0.85rem;font-weight:600;color:var(--text-muted)">Word ${current + 1}/${words.length}</span>
        <span style="font-weight:700;color:var(--gold)">${score} pts</span>
      </div>
      <div class="glass" style="padding:24px;text-align:center">
        <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:12px">${subjectTag(subject)}${chapterTag(chapter)}</div>
        <div class="scramble-timer" id="scrambleTimer">${timer}s</div>
        <div style="font-size:0.85rem;color:var(--text-muted);margin:8px 0">Time remaining</div>
        <div class="scramble-word">${scrambled}</div>
        <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:16px">Unscramble this ${subject} term</div>
        <input type="text" class="form-input" id="scrambleInput" placeholder="Type your answer..." style="text-align:center;font-size:1.1rem;letter-spacing:4px;text-transform:uppercase" autocomplete="off">
        <button class="btn btn-primary w-full mt-3" id="scrambleSubmitBtn" onclick="checkScrambleAnswer()">Submit</button>
        <button class="btn btn-secondary btn-sm mt-2" onclick="useHint('${word}')">💡 Hint (-2 XP)</button>
        <div id="scrambleFeedback" style="margin-top:12px;min-height:24px"></div>
      </div>
    `;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timer--;
      const el = document.getElementById("scrambleTimer");
      if (el) {
        el.textContent = `${timer}s`;
        if (timer <= 10) el.classList.add("danger");
      }
      if (timer <= 0) {
        clearInterval(timerInterval);
        const fb = document.getElementById("scrambleFeedback");
        if (fb)
          fb.innerHTML = `<div style="color:var(--red);font-weight:600">⏰ Time's up! The word was: <strong>${word.toUpperCase()}</strong></div>`;
        const btn = document.getElementById("scrambleSubmitBtn");
        if (btn) btn.disabled = true;
        setTimeout(() => {
          current++;
          timer = 60;
          if (current < words.length) renderW();
          else showScrambleResults();
        }, 1800);
      }
    }, 1000);
    window.__scrambleTimer = timerInterval;
    const input = document.getElementById("scrambleInput");
    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") checkScrambleAnswer();
    });
    window.checkScrambleAnswer = () => {
      const inp = document.getElementById("scrambleInput");
      if (!inp) return;
      const val = inp.value.trim().toLowerCase();
      if (!val) return;
      if (val === word.toLowerCase()) {
        clearInterval(window.__scrambleTimer);
        score++;
        addXP(8, "scramble");
        const fb = document.getElementById("scrambleFeedback");
        if (fb)
          fb.innerHTML = `<div style="color:var(--green);font-weight:700">✅ Correct! +8 XP 🎉</div>`;
        const btn = document.getElementById("scrambleSubmitBtn");
        if (btn) btn.disabled = true;
        setTimeout(() => {
          current++;
          timer = 60;
          if (current < words.length) renderW();
          else showScrambleResults();
        }, 1200);
      } else {
        const fb = document.getElementById("scrambleFeedback");
        if (fb)
          fb.innerHTML = `<div style="color:var(--red)">❌ Try again!</div>`;
        inp.value = "";
        inp.focus();
      }
    };
  }

  window.useHint = (word) => {
    if (S.gems >= 2) {
      S.gems -= 2;
      saveState();
      updateHeader();
    }
    const fb = document.getElementById("scrambleFeedback");
    if (fb)
      fb.innerHTML = `<div style="color:var(--gold)">💡 Starts with: ${word.slice(0, Math.ceil(word.length / 3)).toUpperCase()}...</div>`;
  };

  renderW();

  function showScrambleResults() {
    document.getElementById("app").innerHTML = `
      <div class="glass score-card">
        <div style="font-size:2rem">🔤</div>
        <div class="score-big">${score}/${words.length}</div>
        <div style="color:var(--text-muted)">Words Unscrambled!</div>
        <div class="xp-badge mt-3">+${score * 8} XP earned</div>
        <div class="mt-4 flex gap-2" style="justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick="replayGame('scramble')">Play Again</button>
          <button class="btn btn-secondary btn-sm" onclick="navigate('games')">Back to Games</button>
        </div>
      </div>
    `;
  }
}

// ============================================================
// MATH CHALLENGE GAME
// ============================================================
function answersMatch(userVal, correct) {
  const normalize = (s) =>
    s
      .toLowerCase()
      .replace(/\s+by\s+/g, "/")
      .replace(/\s+/g, "")
      .trim();
  const u = normalize(userVal);
  const c = normalize(correct);
  if (u === c) return true;
  try {
    const evalFrac = (str) => {
      if (str.includes("/")) {
        const [a, b] = str.split("/").map(Number);
        return b !== 0 ? a / b : NaN;
      }
      return Number(str);
    };
    const uNum = evalFrac(u),
      cNum = evalFrac(c);
    if (!isNaN(uNum) && !isNaN(cNum)) return Math.abs(uNum - cNum) < 0.0001;
  } catch {}
  return false;
}

function renderMathGame(extra) {
  const problems = extra?.problems || extra || [];
  const chapter = extra?.chapter || "";
  if (!problems || !problems.length) {
    navigate("games");
    return;
  }
  let current = 0,
    score = 0,
    totalXP = 0,
    startTime;

  function renderP() {
    const p = problems[current];
    startTime = Date.now();
    document.getElementById("app").innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <button class="btn btn-secondary btn-sm" onclick="clearInterval(window.__mathTimer);navigate('games')">← Back</button>
        <span style="font-size:0.85rem;font-weight:600;color:var(--text-muted)">Q${current + 1}/${problems.length}</span>
        <span style="font-weight:700;color:var(--gold)">${totalXP} XP</span>
      </div>
      <div class="glass" style="padding:24px;text-align:center">
        ${chapter ? `<div style="margin-bottom:10px">${chapterTag(chapter)}</div>` : ""}
        <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:4px">Solve quickly for bonus XP!</div>
        <div class="math-problem">${escapeHtml(p.question)}</div>
        <div id="mathTimerDisplay" style="font-size:1.2rem;font-weight:800;color:var(--blue);margin-bottom:16px">⏱ 30s</div>
        <input type="text" class="form-input" id="mathInput" placeholder="Enter answer..." style="text-align:center;font-size:1.2rem" autocomplete="off">
        <button class="btn btn-primary w-full mt-3" id="mathSubmitBtn" onclick="checkMath('${p.answer}')">Submit</button>
        <div id="mathFeedback" style="margin-top:12px;min-height:24px"></div>
      </div>
    `;
    let timeLeft = 30;
    const timerEl = document.getElementById("mathTimerDisplay");
    clearInterval(window.__mathTimer);
    window.__mathTimer = setInterval(() => {
      timeLeft--;
      if (timerEl) {
        timerEl.textContent = `⏱ ${timeLeft}s`;
        if (timeLeft <= 10) timerEl.style.color = "var(--red)";
      }
      if (timeLeft <= 0) {
        clearInterval(window.__mathTimer);
        const fb = document.getElementById("mathFeedback");
        if (fb)
          fb.innerHTML = `<div style="color:var(--red)">⏰ Time's up! Answer was: <strong>${p.answer}</strong></div>`;
        const btn = document.getElementById("mathSubmitBtn");
        if (btn) btn.disabled = true;
        setTimeout(() => {
          current++;
          if (current < problems.length) renderP();
          else showMathResults();
        }, 1500);
      }
    }, 1000);
    const inp = document.getElementById("mathInput");
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") checkMath(p.answer);
    });
    inp.focus();
  }

  window.checkMath = (correct) => {
    const input = document.getElementById("mathInput");
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    const elapsed = (Date.now() - startTime) / 1000;
    clearInterval(window.__mathTimer);
    const btn = document.getElementById("mathSubmitBtn");
    if (btn) btn.disabled = true;
    if (answersMatch(val, String(correct))) {
      const xp = elapsed < 10 ? 20 : 10;
      score++;
      totalXP += xp;
      addXP(xp, "math");
      const fb = document.getElementById("mathFeedback");
      if (fb)
        fb.innerHTML = `<div style="color:var(--green);font-weight:700">✅ Correct! +${xp} XP ${elapsed < 10 ? "⚡ Speed bonus!" : ""}</div>`;
    } else {
      const fb = document.getElementById("mathFeedback");
      if (fb)
        fb.innerHTML = `<div style="color:var(--red)">❌ Answer was: <strong>${correct}</strong></div>`;
    }
    setTimeout(() => {
      current++;
      if (current < problems.length) renderP();
      else showMathResults();
    }, 1300);
  };

  renderP();

  function showMathResults() {
    document.getElementById("app").innerHTML = `
      <div class="glass score-card">
        <div style="font-size:2rem">🧮</div>
        <div class="score-big">${score}/${problems.length}</div>
        <div style="color:var(--text-muted)">Math Challenge Complete!</div>
        <div class="xp-badge mt-3">+${totalXP} XP earned</div>
        <div class="mt-4 flex gap-2" style="justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick="replayGame('math')">Play Again</button>
          <button class="btn btn-secondary btn-sm" onclick="navigate('games')">Back to Games</button>
        </div>
      </div>
    `;
  }
}

// ============================================================
// PARTICLES
// ============================================================
function initBackground() {
  const canvas = document.getElementById("bgCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const stars = Array.from({ length: 200 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5,
    alpha: Math.random(),
    speed: Math.random() * 0.005,
  }));
  const shootingStars = [];
  function addShootingStar() {
    shootingStars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.5,
      len: Math.random() * 150 + 50,
      speed: Math.random() * 8 + 4,
      alpha: 1,
      angle: Math.PI / 4,
    });
  }
  setInterval(addShootingStar, 3000);
  function drawNebula() {
    [
      [0.2, 0.3, "rgba(99,102,241,0.06)", 0.4],
      [0.8, 0.7, "rgba(168,85,247,0.06)", 0.35],
      [0.5, 0.5, "rgba(59,130,246,0.03)", 0.25],
    ].forEach(([cx, cy, color, r]) => {
      const g = ctx.createRadialGradient(
        canvas.width * cx,
        canvas.height * cy,
        0,
        canvas.width * cx,
        canvas.height * cy,
        canvas.width * r,
      );
      g.addColorStop(0, color);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
  }
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawNebula();
    stars.forEach((star) => {
      star.alpha += star.speed;
      if (star.alpha > 1 || star.alpha < 0) star.speed *= -1;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
      ctx.fill();
    });
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const s = shootingStars[i];
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(
        s.x - Math.cos(s.angle) * s.len,
        s.y - Math.sin(s.angle) * s.len,
      );
      const g = ctx.createLinearGradient(
        s.x,
        s.y,
        s.x - Math.cos(s.angle) * s.len,
        s.y - Math.sin(s.angle) * s.len,
      );
      g.addColorStop(0, `rgba(255,255,255,${s.alpha})`);
      g.addColorStop(1, "transparent");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      s.x += s.speed;
      s.y += s.speed;
      s.alpha -= 0.015;
      if (s.alpha <= 0) shootingStars.splice(i, 1);
    }
    requestAnimationFrame(animate);
  }
  animate();
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// ============================================================
// UTILS
// ============================================================
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function renderStep(str) {
  if (!str) return "";
  // Strip AI-injected step prefixes like "Step 1:", "1.", "2:" etc.
  let s = str.replace(/^(step\s*\d+\s*[:.-]?\s*|\d+\s*[:.-]\s*)/i, "").trim();
  // Second pass: catch any remaining "StepN:" with no space that slipped through
  s = s.replace(/^step\d+[:.\s]*/i, "").trim();
  // Strip markdown headers
  s = s.replace(/^#+\s*/gm, "");
  // Convert LaTeX-style math: \sqrt{x} or |sqrt{x} → √x
  s = s.replace(/[|\\]sqrt\{([^}]+)\}/g, "√($1)");
  s = s.replace(/[|\\]frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)");
  s = s.replace(/[|\\]neq/g, "≠");
  s = s.replace(/[|\\]leq/g, "≤");
  s = s.replace(/[|\\]geq/g, "≥");
  s = s.replace(/[|\\]times/g, "×");
  s = s.replace(/[|\\]div/g, "÷");
  s = s.replace(/[|\\]pm/g, "±");
  s = s.replace(/[|\\]pi/g, "π");
  s = s.replace(/[|\\]alpha/g, "α");
  s = s.replace(/[|\\]beta/g, "β");
  s = s.replace(/[|\\]theta/g, "θ");
  s = s.replace(/[|\\]infty/g, "∞");
  s = s.replace(/[|\\]cdot/g, "·");
  // Now escape HTML for safe rendering
  const escaped = escapeHtml(s);
  // Apply inline formatting AFTER escaping (these produce safe tags)
  return escaped
    .replace(/\$([^$]+)\$/g, "<em>$1</em>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
    .replace(/\^([0-9])/g, "<sup>$1</sup>");
}

// ============================================================
// RESOURCES PAGE – CBSE Sample Papers, PYQs & Notes
// ============================================================
function renderResources() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <h1 class="gradient-heading section-heading">${t("resources_title")}</h1>
    <div style="display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid rgba(255,255,255,0.08)">
      <button id="tab-papers" onclick="switchResourceTab('papers')" style="flex:1;padding:10px;background:none;border:none;color:#4f8ef7;font-weight:700;font-size:0.9rem;font-family:inherit;border-bottom:2px solid #4f8ef7;cursor:pointer;margin-bottom:-2px">${t("papers_tab")}</button>
      <button id="tab-notes" onclick="switchResourceTab('notes')" style="flex:1;padding:10px;background:none;border:none;color:var(--text-muted);font-weight:700;font-size:0.9rem;font-family:inherit;border-bottom:2px solid transparent;cursor:pointer;margin-bottom:-2px">${t("notes_tab")}</button>
    </div>
    <div id="resource-tab-content"></div>
  `;
  window.switchResourceTab = (tab) => {
    document.getElementById("tab-papers").style.color =
      tab === "papers" ? "#4f8ef7" : "var(--text-muted)";
    document.getElementById("tab-papers").style.borderBottomColor =
      tab === "papers" ? "#4f8ef7" : "transparent";
    document.getElementById("tab-notes").style.color =
      tab === "notes" ? "#4f8ef7" : "var(--text-muted)";
    document.getElementById("tab-notes").style.borderBottomColor =
      tab === "notes" ? "#4f8ef7" : "transparent";
    if (tab === "papers") renderPapersTab();
    else renderNotesTab();
  };
  switchResourceTab("papers");
}

function renderPapersTab() {
  const papers = INAPP_PAPERS;
  const TAG_COLOR = {
    "Sample Paper": "#4f8ef7",
    PYQ: "#a78bfa",
    "Marking Scheme": "#34d399",
  };
  const SUBJECTS = [
    "All",
    "Maths",
    "Science",
    "Social Science",
    "English",
    "Hindi",
  ];

  const filterPills = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">
    ${SUBJECTS.map((s, i) => `<button class="subject-filter-pill${i === 0 ? " active" : ""}" data-subject="${s}" onclick="filterPapers('${s}')" style="padding:6px 14px;border-radius:20px;border:1px solid ${i === 0 ? "#4f8ef7" : "rgba(255,255,255,0.12)"};background:${i === 0 ? "rgba(79,142,247,0.15)" : "rgba(255,255,255,0.05)"};color:${i === 0 ? "#4f8ef7" : "var(--text-muted)"};font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s">${s}</button>`).join("")}
  </div>`;

  const grouped = {};
  papers.forEach((p) => {
    if (!grouped[p.tag]) grouped[p.tag] = [];
    grouped[p.tag].push(p);
  });

  let cardsHtml = filterPills;
  Object.entries(grouped).forEach(([tag, items]) => {
    const color = TAG_COLOR[tag] || "#4f8ef7";
    cardsHtml += `<div class="papers-group" style="margin-bottom:20px">
      <div style="font-size:0.72rem;font-weight:800;letter-spacing:0.08em;color:${color};text-transform:uppercase;margin-bottom:10px">${tag}s</div>
      ${items
        .map(
          (p) => `
        <div data-subject="${p.subject}" class="paper-card" onclick="showPaper('${p.id}')" style="margin-bottom:10px;cursor:pointer">
          <div class="glass" style="padding:14px 16px;border:1px solid ${color}28;transition:all .2s" onmouseover="this.style.borderColor='${color}88';this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='${color}28';this.style.transform=''">
            <div style="display:flex;align-items:center;gap:10px;justify-content:space-between">
              <div>
                <div style="font-weight:700;color:var(--text);font-size:0.9rem;margin-bottom:3px">${p.label}</div>
                <div style="font-size:0.75rem;color:var(--text-muted)">${p.year} · ${p.subject} · ${p.maxMarks} marks · ${p.time}</div>
              </div>
              <div style="flex-shrink:0;background:${color}18;border:1px solid ${color}44;border-radius:8px;padding:6px 14px;font-size:0.78rem;font-weight:700;color:${color}">View Paper →</div>
            </div>
          </div>
        </div>`,
        )
        .join("")}
    </div>`;
  });

  document.getElementById("resource-tab-content").innerHTML = cardsHtml;

  window.filterPapers = (subject) => {
    document.querySelectorAll(".subject-filter-pill").forEach((btn) => {
      const active = btn.dataset.subject === subject;
      btn.style.borderColor = active ? "#4f8ef7" : "rgba(255,255,255,0.12)";
      btn.style.background = active
        ? "rgba(79,142,247,0.15)"
        : "rgba(255,255,255,0.05)";
      btn.style.color = active ? "#4f8ef7" : "var(--text-muted)";
    });
    document.querySelectorAll(".paper-card").forEach((card) => {
      const show = subject === "All" || card.dataset.subject === subject;
      card.style.display = show ? "block" : "none";
    });
    document.querySelectorAll(".papers-group").forEach((group) => {
      const visible = [...group.querySelectorAll(".paper-card")].some(
        (c) => c.style.display !== "none",
      );
      group.style.display = visible ? "block" : "none";
    });
  };
}

function renderNotesTab() {
  const NOTES_SUBJECTS = [
    "Maths",
    "Physics",
    "Biology",
    "Chemistry",
    "History",
    "Geography",
    "English",
  ];
  const activeClass = S.classPreference || "10";
  const activeSubject = S.subjectPreference || "Maths";

  const NOTES = {
    10: {
      Maths: {
        "Real Numbers": [
          "Every integer is a rational number",
          "HCF × LCM = Product of two numbers",
          "√2, √3, π are irrational — cannot be expressed as p/q",
          "Euclid's Division Lemma: a = bq + r where 0 ≤ r < b",
          "Fundamental Theorem of Arithmetic: every composite number has a unique prime factorisation",
        ],
        Polynomials: [
          "Degree of polynomial = highest power of variable",
          "Zeroes of p(x) are values where p(x) = 0",
          "Sum of zeroes (quadratic) = −b/a",
          "Product of zeroes (quadratic) = c/a",
          "A quadratic polynomial has at most 2 zeroes",
        ],
        "Quadratic Equations": [
          "Standard form: ax² + bx + c = 0",
          "Discriminant D = b² − 4ac",
          "D > 0 → two distinct real roots",
          "D = 0 → two equal roots",
          "D < 0 → no real roots",
          "Quadratic formula: x = (−b ± √D) / 2a",
        ],
        "Arithmetic Progressions": [
          "AP: a, a+d, a+2d, ...",
          "nth term: aₙ = a + (n−1)d",
          "Sum of n terms: Sₙ = n/2 × (2a + (n−1)d)",
          "If last term l is known: Sₙ = n/2 × (a + l)",
          "Common difference d = any term − previous term",
        ],
        Triangles: [
          "AAA similarity: if all angles equal, triangles are similar",
          "Basic Proportionality Theorem: line parallel to one side divides other two proportionally",
          "Pythagoras: hypotenuse² = sum of squares of other two sides",
          "Converse: if a² + b² = c², angle opposite c is 90°",
        ],
        Circles: [
          "Tangent ⊥ radius at point of contact",
          "From external point, two tangents are equal in length",
          "Angle in semicircle = 90°",
          "Tangent-chord angle = inscribed angle on opposite side",
        ],
        Statistics: [
          "Mean = sum of values / number of values",
          "Median = middle value when arranged in order",
          "Mode = most frequently occurring value",
          "For grouped data use assumed mean or step deviation method",
        ],
        Probability: [
          "P(E) = favourable outcomes / total outcomes",
          "0 ≤ P(E) ≤ 1",
          "P(E) + P(not E) = 1",
          "Impossible event: P = 0 · Certain event: P = 1",
        ],
      },
      Physics: {
        "Light Reflection and Refraction": [
          "Angle of incidence = Angle of reflection",
          "Mirror formula: 1/f = 1/v + 1/u",
          "Magnification m = −v/u",
          "Convex mirror: always virtual, erect, diminished image",
          "Snell's Law: n₁ sin i = n₂ sin r",
          "Refractive index n = speed of light in vacuum / speed in medium",
        ],
        Electricity: [
          "Ohm's Law: V = IR",
          "Series: R = R₁ + R₂ + R₃",
          "Parallel: 1/R = 1/R₁ + 1/R₂",
          "Power P = VI = I²R = V²/R",
          "1 kWh = 3.6 × 10⁶ J",
        ],
        "Magnetic Effects of Electric Current": [
          "Right-hand thumb rule: thumb → current, fingers → field",
          "Fleming's Left-Hand Rule: force on conductor (motors)",
          "Fleming's Right-Hand Rule: induced current direction (generators)",
          "AC changes direction periodically; DC flows one way only",
        ],
        "Human Eye and Colourful World": [
          "Near point = 25 cm · Far point = infinity",
          "Myopia: concave lens correction",
          "Hypermetropia: convex lens correction",
          "Dispersion: white light → VIBGYOR through prism",
          "Blue light scatters most → sky appears blue",
        ],
      },
      Chemistry: {
        "Chemical Reactions and Equations": [
          "Combination: A + B → AB",
          "Decomposition: AB → A + B",
          "Displacement: A + BC → AC + B",
          "Double displacement: AB + CD → AD + CB",
          "Oxidation = loss of electrons / gain of oxygen",
          "Reduction = gain of electrons / loss of oxygen",
        ],
        "Acids Bases and Salts": [
          "Acids: sour, blue litmus → red, pH < 7",
          "Bases: bitter, red litmus → blue, pH > 7",
          "Neutralisation: Acid + Base → Salt + Water",
          "Baking soda: NaHCO₃ · Washing soda: Na₂CO₃·10H₂O · Bleaching powder: CaOCl₂",
        ],
        "Metals and Non-metals": [
          "Metals: lustrous, malleable, ductile, good conductors",
          "Non-metals: brittle, poor conductors (except graphite)",
          "Reactivity series: K > Na > Ca > Mg > Al > Zn > Fe > Pb > H > Cu > Ag > Au",
        ],
        "Carbon and its Compounds": [
          "Carbon is tetravalent — forms 4 covalent bonds",
          "Catenation: carbon bonds with other carbon atoms",
          "Saturated: single bonds only (alkanes) · Unsaturated: double/triple bonds (alkenes/alkynes)",
          "Functional groups: −OH (alcohol), −COOH (acid), −CHO (aldehyde)",
          "Saponification: fat + NaOH → soap + glycerol",
        ],
      },
      Biology: {
        "Life Processes": [
          "Photosynthesis: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂",
          "Aerobic respiration: glucose + O₂ → CO₂ + H₂O + 38 ATP",
          "Anaerobic: glucose → lactic acid OR ethanol + CO₂ + less energy",
          "Autotrophs make own food · Heterotrophs depend on others",
        ],
        "Control and Coordination": [
          "Reflex arc: receptor → sensory nerve → spinal cord → motor nerve → effector",
          "Adrenaline = fight or flight (adrenal gland)",
          "Insulin lowers blood sugar · Glucagon raises it",
          "Thyroxine (thyroid) controls metabolism",
        ],
        "How do Organisms Reproduce": [
          "Asexual: fission, budding, spore formation, fragmentation, vegetative propagation",
          "Sexual: involves gametes (sperm + egg)",
          "Menstrual cycle: 28 days · ovulation at day 14",
        ],
        "Heredity and Evolution": [
          "Dominant trait masks recessive",
          "Genotype = genetic makeup · Phenotype = observable trait",
          "Mendel's Laws: Segregation + Independent Assortment",
          "Natural selection: favourable traits → more survival + reproduction",
        ],
      },
      History: {
        "Nationalism in India": [
          "Non-Cooperation Movement: 1920–22 · called off after Chauri Chaura 1922",
          "Civil Disobedience: 1930 · Salt March (Dandi) 385 km",
          "Quit India Movement: August 1942 · 'Do or Die'",
          "INC founded 1885 by A.O. Hume",
          "Rowlatt Act 1919: detention without trial",
        ],
        "The Rise of Nationalism in Europe": [
          "French Revolution 1789: liberty, equality, fraternity",
          "Napoleon spread revolutionary ideas across Europe",
          "Germany unified 1871 under Bismarck",
          "Italy unified 1861–70 (Garibaldi, Mazzini, Cavour)",
          "Balkans = 'powder keg of Europe'",
        ],
      },
      Geography: {
        "Resources and Development": [
          "Resource = anything satisfying human needs with value",
          "Land degradation causes: deforestation, overgrazing, mining, waterlogging",
          "Soil conservation: crop rotation, contour ploughing, terrace farming, afforestation",
        ],
        "Water Resources": [
          "Freshwater = 2.5% of total · most locked in glaciers",
          "Multipurpose projects: irrigation, electricity, flood control",
          "Rainwater harvesting: collecting and storing rainwater locally",
        ],
      },
      English: {
        "A Letter to God": [
          "Author: G.L. Fuentes · Lencho writes to God for money after hailstorm destroys crops",
          "Post office employees collect money and send it · Lencho suspects them of stealing",
          "Theme: faith vs irony · Lencho's blind faith contrasted with human kindness misunderstood",
        ],
        "Nelson Mandela Long Walk to Freedom": [
          "Mandela became South Africa's first Black president · sworn in 10 May 1994",
          "Apartheid = racial segregation policy in South Africa",
          "Twin obligations: to family AND to people",
          "The oppressor is also a prisoner of hatred",
        ],
        "From the Diary of Anne Frank": [
          "Anne Frank: Jewish girl hiding from Nazis in Amsterdam 1942–44",
          "She writes to imaginary friend 'Kitty' in her diary",
          "Theme: loneliness, hope, courage under persecution",
        ],
      },
    },
    9: {
      Maths: {
        "Number Systems": [
          "Natural numbers ⊂ Whole numbers ⊂ Integers ⊂ Rational numbers ⊂ Real numbers",
          "Irrational numbers cannot be expressed as p/q",
          "Every real number has a unique point on number line",
          "√2, √3, √5 are irrational",
        ],
        Polynomials: [
          "Monomial: 1 term · Binomial: 2 terms · Trinomial: 3 terms",
          "Zero of polynomial p(x): value of x where p(x) = 0",
          "Remainder theorem: p(x) divided by (x−a), remainder = p(a)",
          "Factor theorem: (x−a) is factor of p(x) if p(a) = 0",
        ],
        Triangles: [
          "Congruence: SSS, SAS, ASA, AAS, RHS",
          "In isoceles triangle, angles opposite equal sides are equal",
          "Angle sum of triangle = 180°",
          "Exterior angle = sum of two non-adjacent interior angles",
        ],
        Statistics: [
          "Mean = Σx/n",
          "Median = middle value (arrange in order first)",
          "Mode = most frequent value",
          "Range = max − min",
        ],
      },
      Physics: {
        Motion: [
          "Distance = total path covered · Displacement = shortest path (vector)",
          "Speed = distance/time · Velocity = displacement/time",
          "Acceleration a = (v−u)/t",
          "Equations of motion: v = u+at · s = ut + ½at² · v² = u² + 2as",
        ],
        "Force and Laws of Motion": [
          "Newton's 1st Law: body stays at rest or uniform motion unless external force acts",
          "Newton's 2nd Law: F = ma",
          "Newton's 3rd Law: every action has equal and opposite reaction",
          "Momentum p = mv · Impulse = F × t",
        ],
        Gravitation: [
          "F = Gm₁m₂/r² (Universal law of gravitation)",
          "g = 9.8 m/s² on Earth's surface",
          "Weight W = mg · Mass is constant, weight varies",
          "Buoyancy: upward force on object submerged in fluid",
        ],
        "Work and Energy": [
          "Work W = F × d × cos θ",
          "Work done = 0 if force ⊥ displacement",
          "KE = ½mv² · PE = mgh",
          "Law of conservation of energy: energy can neither be created nor destroyed",
        ],
      },
      Chemistry: {
        "Matter in Our Surroundings": [
          "Matter: solid, liquid, gas",
          "Solid: fixed shape & volume · Liquid: fixed volume, no shape · Gas: no fixed shape or volume",
          "Evaporation: surface phenomenon, causes cooling",
          "Latent heat: heat absorbed/released during change of state without temperature change",
        ],
        "Atoms and Molecules": [
          "Law of conservation of mass: mass of reactants = mass of products",
          "Law of definite proportions: compound always has same elements in fixed ratio",
          "Atom = smallest particle of element · Molecule = group of atoms",
          "Atomic mass unit (amu): 1 amu = 1/12th mass of C-12",
        ],
      },
      Biology: {
        "The Fundamental Unit of Life": [
          "Cell = basic structural and functional unit of life",
          "Plant cell has cell wall, chloroplasts, large vacuole · Animal cell lacks these",
          "Nucleus = control centre · Mitochondria = powerhouse (ATP)",
          "Osmosis: movement of water from high to low concentration through semi-permeable membrane",
        ],
        Tissues: [
          "Plant tissues: meristematic (dividing) and permanent (non-dividing)",
          "Animal tissues: epithelial, connective, muscular, nervous",
          "Meristematic tissue found at root/shoot tips",
          "Neurons: basic unit of nervous tissue",
        ],
      },
    },
  };

  const classNotes = NOTES[activeClass] || NOTES["10"];
  const subjectNotes = classNotes[activeSubject] || {};
  const chapters = Object.keys(subjectNotes);

  const content = document.getElementById("resource-tab-content");
  content.innerHTML = `
    <p class="section-sub" style="margin-bottom:14px">Quick revision notes — Class ${activeClass}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
      ${NOTES_SUBJECTS.map((s) => `<button onclick="switchNotesSubject('${s}')" style="padding:5px 13px;border-radius:20px;border:1px solid ${s === activeSubject ? "#4f8ef7" : "rgba(255,255,255,0.12)"};background:${s === activeSubject ? "rgba(79,142,247,0.15)" : "rgba(255,255,255,0.05)"};color:${s === activeSubject ? "#4f8ef7" : "var(--text-muted)"};font-size:0.75rem;font-weight:700;cursor:pointer;font-family:inherit">${s}</button>`).join("")}
    </div>
    <div id="notes-chapters">
      ${
        chapters.length === 0
          ? `<div class="glass" style="padding:20px;text-align:center;color:var(--text-muted)">Notes for Class ${activeClass} ${activeSubject} coming soon!</div>`
          : chapters
              .map(
                (ch) => `
        <div class="glass" style="margin-bottom:12px;overflow:hidden">
          <div onclick="toggleNoteChapter('nc-${ch.replace(/\s/g, "_").replace(/[^a-zA-Z0-9_]/g, "")}')" style="padding:14px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center">
            <div style="font-weight:700;font-size:0.88rem">📖 ${ch}</div>
            <span style="color:var(--text-muted);font-size:0.8rem" id="arr-${ch.replace(/\s/g, "_").replace(/[^a-zA-Z0-9_]/g, "")}">▼</span>
          </div>
          <div id="nc-${ch.replace(/\s/g, "_").replace(/[^a-zA-Z0-9_]/g, "")}" style="display:none;padding:0 16px 14px">
            ${subjectNotes[ch].map((pt) => `<div style="display:flex;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.83rem;color:var(--text-secondary);line-height:1.5"><span style="color:#4f8ef7;flex-shrink:0">•</span><span>${pt}</span></div>`).join("")}
          </div>
        </div>`,
              )
              .join("")
      }
    </div>
  `;

  window.toggleNoteChapter = (id) => {
    const el = document.getElementById(id);
    const arrId = "arr-" + id.replace("nc-", "");
    const arr = document.getElementById(arrId);
    if (!el) return;
    const open = el.style.display === "block";
    el.style.display = open ? "none" : "block";
    if (arr) arr.textContent = open ? "▼" : "▲";
  };

  window.switchNotesSubject = (subj) => {
    S.subjectPreference = subj;
    saveState();
    renderNotesTab();
  };
}

// ============================================================
// PAPER VIEWER MODAL
// ============================================================
window.showPaper = (id) => {
  const paper = INAPP_PAPERS.find((p) => p.id === id);
  if (!paper) return;
  document.getElementById("paperModal")?.remove();

  let totalQ = 0;
  const sectionsHtml = paper.sections
    .map((sec) => {
      const qHtml = sec.questions
        .map((q) => {
          totalQ++;
          const qId = `pq_${q.no}`;
          let body = "";

          const renderMcqBody = (id, opts, correctIdx, hint) => `
        <div class="pm-options" id="${id}_opts">
          ${opts.map((opt, i) => `<button class="pm-opt" onclick="pmSelectOpt('${id}',${i},${correctIdx})">${String.fromCharCode(65 + i)}. ${opt}</button>`).join("")}
        </div>
        ${hint ? `<div class="pm-hint" id="${id}_hint" style="display:none">💡 ${hint}</div>` : ""}
        <button class="pm-hint-btn" onclick="document.getElementById('${id}_hint').style.display='block';this.style.display='none'">Show Hint</button>`;

          const renderSaBody = (id, answerText) => {
            const ansId = `${id}_ans`;
            const btnId = `${id}_btn`;
            return `<div id="${ansId}" class="pm-answer" style="display:none"><strong>Answer:</strong><br>${answerText.replace(/\n/g, "<br>")}</div>
        <button id="${btnId}" class="pm-show-btn" onclick="document.getElementById('${ansId}').style.display='block';document.getElementById('${btnId}').style.display='none'">Show Answer</button>`;
          };

          if (q.type === "mcq") {
            body = renderMcqBody(qId, q.options, q.answer, q.hint);
          } else if (q.type === "case") {
            const subsHtml = q.subquestions
              .map((sq, si) => {
                const sqId = `${qId}_s${si}`;
                const sqBody =
                  sq.type === "mcq"
                    ? renderMcqBody(sqId, sq.options, sq.answer, sq.hint)
                    : renderSaBody(sqId, sq.answer);
                return `<div class="pm-subq">
            <div class="pm-subq-label">${sq.label} [${sq.marks} mark${sq.marks > 1 ? "s" : ""}]</div>
            <div class="pm-q-text" style="margin:.4rem 0 .6rem">${sq.text}</div>
            ${sqBody}
          </div>`;
              })
              .join("");
            body = `<div class="pm-case-context">${q.context.replace(/\n/g, "<br>")}</div>${subsHtml}`;
          } else {
            body = renderSaBody(qId, q.answer);
          }

          const header =
            q.type === "case"
              ? `<span class="pm-q-num">Q${q.no}</span><span class="pm-q-marks">[${q.marks} marks · Case-Based]</span>`
              : `<span class="pm-q-num">Q${q.no}</span><span class="pm-q-marks">[${q.marks} mark${q.marks > 1 ? "s" : ""}]</span>`;
          const qText =
            q.type === "case"
              ? ""
              : `<div class="pm-q-text">${q.text.replace(/\n/g, "<br>")}</div>`;

          return `<div class="pm-question">
        <div class="pm-q-header">${header}</div>
        ${qText}
        ${body}
      </div>`;
        })
        .join("");
      return `<div class="pm-section">
      <div class="pm-sec-title">${sec.title}</div>
      <div class="pm-sec-info">${sec.info}</div>
      ${qHtml}
    </div>`;
    })
    .join("");

  const modal = document.createElement("div");
  modal.id = "paperModal";
  modal.className = "paper-modal";
  modal.innerHTML = `
    <div class="pm-header">
      <div>
        <div class="pm-title">${paper.label}</div>
        <div class="pm-meta">Class 10 &nbsp;·&nbsp; ${paper.year} &nbsp;·&nbsp; Time: ${paper.time} &nbsp;·&nbsp; Max Marks: ${paper.maxMarks}</div>
      </div>
      <button class="pm-close" onclick="closePaper()">✕</button>
    </div>
    <div class="pm-body">${sectionsHtml}</div>`;
  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";

  window.pmSelectOpt = (qId, chosen, correct) => {
    const opts = document.querySelectorAll(`#${qId}_opts .pm-opt`);
    opts.forEach((btn, i) => {
      btn.disabled = true;
      if (i === correct) btn.classList.add("pm-correct");
      else if (i === chosen) btn.classList.add("pm-wrong");
    });
    const hint = document.getElementById(`${qId}_hint`);
    if (hint) {
      hint.style.display = "block";
    }
    const hintBtn = document.querySelector(`#${qId}_opts ~ .pm-hint-btn`);
    if (hintBtn) hintBtn.style.display = "none";
    if (chosen === correct) addXP(2, "✅ Correct MCQ");
  };
};

window.closePaper = () => {
  document.getElementById("paperModal")?.remove();
  document.body.style.overflow = "";
};

// ============================================================
// WEB SEARCH PAGE – Creative problem-solving ideas
// ============================================================
function renderWebSearch() {
  const app = document.getElementById("app");
  const subject = S.subjectPreference || "Maths";
  const classNum = S.classPreference || "10";
  app.innerHTML = `
    <h1 class="gradient-heading section-heading">🔍 Creative Solve</h1>
    <p class="section-sub">Search the web for creative ways to understand any CBSE concept</p>

    <div class="glass" style="padding:18px;margin-bottom:16px">
      <label class="form-label">What do you want to explore?</label>
      <textarea id="searchQuery" class="form-textarea" placeholder="e.g. 'How to remember the water cycle easily?' or 'Creative ways to solve quadratic equations'" style="min-height:90px"></textarea>
      <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
        <button class="btn btn-primary" style="flex:1;min-width:140px" onclick="doWebSearch()">🔍 Search &amp; Explore</button>
        <button class="btn btn-secondary btn-sm" onclick="doWebSearch('tricks to remember ${subject} formulas for Class ${classNum}')" style="flex:1;min-width:140px">💡 Formula Tricks</button>
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap" id="searchChips">
        ${["Memory tricks", "Visual explanation", "Real life examples", "Step-by-step method", "Common mistakes to avoid"].map((t) => `<button class="badge" style="cursor:pointer;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);padding:5px 12px;border-radius:20px;font-size:0.75rem;color:var(--text-muted)" onclick="document.getElementById('searchQuery').value='${t} for ${subject} Class ${classNum} CBSE'">${t}</button>`).join("")}
      </div>
    </div>

    <div id="searchResultArea"></div>
  `;

  window.doWebSearch = async (prefill) => {
    const q = prefill || document.getElementById("searchQuery").value.trim();
    if (!q) return;
    const area = document.getElementById("searchResultArea");
    area.innerHTML = `<div class="loading-wrap"><div class="spinner"></div><p style="color:var(--text-muted);margin-top:12px">Searching the web for you...</p></div>`;
    try {
      const data = await apiPost("/websearch", {
        query: q,
        subject,
        classNum,
      });
      const md = (data.answer || "No results found.")
        .replace(/\n/g, "<br>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(
          /#{1,3} (.*?)(<br>|$)/g,
          "<div style='font-weight:800;color:var(--text);margin:12px 0 4px'>$1</div>",
        );
      area.innerHTML = `
        <div class="glass" style="padding:18px">
          <div style="font-size:0.72rem;font-weight:800;letter-spacing:0.08em;color:#4f8ef7;text-transform:uppercase;margin-bottom:12px">🌐 Web Results for: "${q}"</div>
          <div style="font-size:0.88rem;color:var(--text-secondary);line-height:1.75">${md}</div>
          <div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.07);font-size:0.72rem;color:var(--text-muted)">Powered by Groq AI with live web search · Always verify with your NCERT textbook</div>
        </div>`;
      addXP(10, "🔍 Web search");
    } catch (e) {
      area.innerHTML = `<div class="glass" style="padding:16px;color:var(--red)">Search failed: ${e.message}</div>`;
    }
  };
}

// ============================================================
// INIT
// ============================================================
function init() {
  updateStreak();
  updateHeader();
  initBackground();
  applyNavLang();
  navigate("home");
  window.S = S;
  if (!loadPerformance()) showOnboardingModal();
}

showNameSplash(init);
