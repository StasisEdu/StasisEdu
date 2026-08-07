// StasisEducation - Full Application
import { INAPP_PAPERS, PDF_PAPERS } from "./papers-data.js";
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
    params.has("clerk_callback");
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

async function logoutUser() {
  if (!confirm("Sign out of your Google account?")) return;
  try {
    if (_clerk) await _clerk.signOut();
  } catch (e) {}
  _clerkUser = null;
  _clerk = null;
  localStorage.clear();
  location.reload();
}
window.logoutUser = logoutUser;

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

let _gameConfig = {
  classNum: "10",
  subject: "Maths",
  chapter: "",
  difficulty: "easy",
  count: 15,
};

const COUNT_CONFIG = {
  15: {
    xp: 30,
    difficulty: "easy",
    label: "Easy",
    emoji: "🟢",
    desc: "30 XP · 30s each",
  },
  20: {
    xp: 60,
    difficulty: "hard",
    label: "Hard",
    emoji: "🔴",
    desc: "60 XP · 30s each",
  },
  25: {
    xp: 100,
    difficulty: "very hard",
    label: "Very Hard",
    emoji: "💀",
    desc: "100 XP · 30s each",
  },
};

function renderDifficultyPicker({ title, color, backFn, onConfirm }) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <style>
      @keyframes _dpIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      ._dpo{border-radius:16px;padding:18px 12px;cursor:pointer;border:2px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);transition:all .2s;text-align:center;font-family:inherit;width:100%}
      ._dpo._sel{border-color:${color};background:rgba(0,0,0,0.0);box-shadow:0 0 20px ${color}44}
      ._dpo:hover:not(._sel){border-color:${color}66;background:${color}08}
    </style>
    <div style="animation:_dpIn .3s ease">
      <button onclick="${backFn}()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;padding:0;font-family:inherit;margin-bottom:20px;display:block">‹ Back</button>
      <div style="font-size:1.3rem;font-weight:900;color:#fff;margin-bottom:4px">${title}</div>
      <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:28px">Pick your challenge level</div>
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:28px">
        ${[15, 20, 25]
          .map((n) => {
            const cfg = COUNT_CONFIG[n];
            const sel = _gameConfig.count === n;
            return `<button class="_dpo${sel ? " _sel" : ""}" onclick="dpPickCount(${n},this)" style="${sel ? `border-color:${color};box-shadow:0 0 20px ${color}44` : ""}">
            <div style="display:flex;align-items:center;gap:14px">
              <div style="font-size:2rem;flex-shrink:0">${cfg.emoji}</div>
              <div style="flex:1;text-align:left">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
                  <span style="font-size:1rem;font-weight:900;color:${sel ? color : "var(--text)"};">${n} Questions</span>
                  <span style="background:${color}18;border:1px solid ${color}33;color:${color};font-size:0.65rem;font-weight:900;padding:2px 8px;border-radius:20px">${cfg.label}</span>
                </div>
                <div style="font-size:0.78rem;color:var(--text-muted)">⏱ 30s per question · +${cfg.xp} XP total</div>
              </div>
              <div style="font-size:1.5rem;font-weight:900;color:${sel ? color : "var(--text-muted)"}">+${cfg.xp}</div>
            </div>
          </button>`;
          })
          .join("")}
      </div>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 16px;margin-bottom:20px;font-size:0.82rem;color:var(--text-muted);display:flex;align-items:center;gap:8px">
        <span>⏱</span> Each question has a <strong style="color:var(--text)">30 second</strong> timer. Unanswered questions count as timed out.
      </div>
      <button onclick="dpConfirm()" class="btn btn-primary" style="width:100%;padding:14px;font-size:1rem;font-weight:900;background:linear-gradient(135deg,${color},${color}bb);border:none;box-shadow:0 4px 20px ${color}44">
        Start — ${COUNT_CONFIG[_gameConfig.count].label} Mode →
      </button>
    </div>
  `;
  window._dpConfirmFn = onConfirm;
  window.dpConfirm = () => window._dpConfirmFn();
  window.dpPickCount = (n, btn) => {
    _gameConfig.count = n;
    _gameConfig.difficulty = COUNT_CONFIG[n].difficulty;
    document.querySelectorAll("._dpo").forEach((b) => {
      b.classList.remove("_sel");
      b.style.borderColor = "rgba(255,255,255,0.1)";
      b.style.boxShadow = "";
    });
    btn.classList.add("_sel");
    btn.style.borderColor = color;
    btn.style.boxShadow = `0 0 20px ${color}44`;
    // update title name and XP in btn
    btn.querySelector("span:first-of-type").style.color = color;
    btn.querySelector("div:last-child").style.color = color;
    // update start button text
    const startBtn = document.querySelector("[onclick='dpConfirm()']");
    if (startBtn)
      startBtn.textContent = `Start — ${COUNT_CONFIG[n].label} Mode →`;
  };
}

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
          <button id="switch-btn" style="background:none;border:none;color:#ef4444;font-size:0.82rem;cursor:pointer;font-family:inherit;transition:color 0.2s;padding:4px 8px;opacity:0.75;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.75'">
            Sign out / Change account
          </button>
        </div>`;

      document.getElementById("continue-btn").onclick = () => dismiss(onDone);
      document.getElementById("switch-btn").onclick = () => logoutUser();
    } else {
      const classPills = CLASSES.map(
        (c) =>
          `<button class="class-pill" data-class="${c}" style="padding:10px 14px;border-radius:12px;border:${c === selectedClass ? (c === "10" ? "2px solid #4f8ef7" : "1px solid rgba(79,142,247,0.5)") : "1px solid rgba(255,255,255,0.1)"};background:${c === selectedClass ? "linear-gradient(135deg,#4f8ef7,#9b6dff)" : "rgba(255,255,255,0.04)"};color:${c === selectedClass ? "#fff" : "#7a8aaa"};font-size:${c === selectedClass && c === "10" ? "1rem" : "0.9rem"};font-weight:${c === selectedClass ? "900" : "700"};cursor:pointer;font-family:inherit;transition:all 0.15s;min-width:44px;${c === selectedClass && c === "10" ? "box-shadow:0 0 16px rgba(79,142,247,0.55);transform:scale(1.08);" : ""}">${c}${c === selectedClass && c === "10" ? " ✓" : ""}</button>`,
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
              redirectUrl: currentUrl + "?clerk_callback=1",
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
        // Set a unique user ID for Supabase
        if (!localStorage.getItem("stasis_uid")) {
          localStorage.setItem(
            "stasis_uid",
            "U" +
              Date.now() +
              Math.random().toString(36).slice(2, 6).toUpperCase(),
          );
        }
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
    resources_title: "📚 Study Resources",
    papers_tab: "📄 Papers",
    notes_tab: "📒 Notes",
    formulas_tab: "🔢 Formulas",
    nav_study: "Study",
    ask_doubt: "Ask a Doubt",
    snap_type: "📸 Snap & Type",
    voice_tab: "🎙️ Voice",
    study_resources: "Study Resources",
    chapter_summary: "Chapter Summaries",
    visual_explain: "Visual Explanations",
    ncert_tab: "NCERT",
    important_qs: "Important Questions",
    saved_qs: "Saved Questions",
    sign_out: "Sign Out",
    change_account: "Sign out / Change account",
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
    resources_title: "📚 अध्ययन संसाधन",
    papers_tab: "📄 प्रश्नपत्र",
    notes_tab: "📒 नोट्स",
    formulas_tab: "🔢 सूत्र",
    nav_study: "अध्ययन",
    ask_doubt: "संदेह पूछें",
    snap_type: "📸 फोटो / टेक्स्ट",
    voice_tab: "🎙️ आवाज़",
    study_resources: "अध्ययन संसाधन",
    chapter_summary: "अध्याय सारांश",
    visual_explain: "दृश्य व्याख्याएं",
    ncert_tab: "NCERT",
    important_qs: "महत्वपूर्ण प्रश्न",
    saved_qs: "सहेजे गए प्रश्न",
    sign_out: "साइन आउट",
    change_account: "साइन आउट / खाता बदलें",
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
    stats: t("nav_stats"),
    leaderboard: t("nav_ranks"),
    games: t("nav_games"),
    resources: t("nav_study"),
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
    correctAnswerCount: 0,
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
    questionHistory: [],
    classroomHistory: [],
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
const DAILY_TIPS = [
  {
    emoji: "⚡",
    subject: "Maths",
    tip: "In a right triangle, (Hypotenuse)² = (Base)² + (Height)². Remember: Always square all three sides!",
  },
  {
    emoji: "🧪",
    subject: "Chemistry",
    tip: "Acids turn blue litmus red. Bases turn red litmus blue. Neutral solutions don't change litmus colour.",
  },
  {
    emoji: "🌿",
    subject: "Biology",
    tip: "Photosynthesis: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂. Chlorophyll absorbs sunlight in the chloroplast.",
  },
  {
    emoji: "⚛️",
    subject: "Physics",
    tip: "Newton's 2nd Law: F = ma. Force equals mass times acceleration. Units: Newton (N) = kg·m/s².",
  },
  {
    emoji: "🗺️",
    subject: "Geography",
    tip: "The Tropic of Cancer passes through 8 Indian states. It runs at 23.5°N latitude.",
  },
  {
    emoji: "📜",
    subject: "History",
    tip: "The Indian National Congress was founded in 1885 by A.O. Hume. The first session was in Bombay.",
  },
  {
    emoji: "⚖️",
    subject: "Civics",
    tip: "India has 3 tiers of government: Union, State, and Local (Panchayati Raj). Each has its own powers.",
  },
  {
    emoji: "💰",
    subject: "Economics",
    tip: "GDP = Consumption + Investment + Government Spending + Net Exports. This is the expenditure approach.",
  },
  {
    emoji: "📝",
    subject: "English",
    tip: "Active voice: Subject does the action. Passive voice: Subject receives the action. Prefer active in writing.",
  },
  {
    emoji: "🔢",
    subject: "Maths",
    tip: "HCF × LCM = Product of two numbers. This shortcut works for any two positive integers.",
  },
  {
    emoji: "🌊",
    subject: "Physics",
    tip: "Speed of light in vacuum = 3×10⁸ m/s. In a medium, speed = c/n where n is the refractive index.",
  },
  {
    emoji: "🧬",
    subject: "Biology",
    tip: "Mitosis produces 2 identical diploid cells. Meiosis produces 4 genetically unique haploid cells.",
  },
  {
    emoji: "🏛️",
    subject: "History",
    tip: "The Non-Cooperation Movement (1920-22) was Gandhi's first mass movement. It was withdrawn after Chauri Chaura.",
  },
  {
    emoji: "📐",
    subject: "Maths",
    tip: "Area of circle = πr². Circumference = 2πr. For CBSE, use π = 22/7 unless told otherwise.",
  },
  {
    emoji: "⚗️",
    subject: "Chemistry",
    tip: "Valency of Carbon = 4. This allows it to form long chains and millions of organic compounds.",
  },
  {
    emoji: "🌍",
    subject: "Geography",
    tip: "India's total area is 3.28 million km². It is the 7th largest country in the world by area.",
  },
  {
    emoji: "💡",
    subject: "Physics",
    tip: "Ohm's Law: V = IR. Resistance in series adds up. In parallel: 1/R = 1/R1 + 1/R2 + ...",
  },
  {
    emoji: "🌱",
    subject: "Biology",
    tip: "The functional unit of kidney is Nephron. Each kidney has about 1 million nephrons.",
  },
  {
    emoji: "📊",
    subject: "Economics",
    tip: "Primary sector = agriculture/mining. Secondary = manufacturing. Tertiary = services (largest in India now).",
  },
  {
    emoji: "🔬",
    subject: "Chemistry",
    tip: "Metals lose electrons → oxidised. Non-metals gain electrons → reduced. OIL RIG: Oxidation Is Loss, Reduction Is Gain.",
  },
];

function getDailyTip() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000,
  );
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}

function getWeakSubject() {
  const allSubjects = [
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
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000)
    .toISOString()
    .split("T")[0];
  const recentSubjects = new Set(
    (S.questionHistory || [])
      .filter((h) => h.date >= threeDaysAgo)
      .map((h) => h.subject),
  );
  const neglected = allSubjects.filter(
    (s) => !recentSubjects.has(s) && (S.subjectCounts[s] || 0) > 0,
  );
  if (neglected.length === 0) return null;
  // pick the one with most all-time questions (most practiced historically but recently neglected)
  return neglected.sort(
    (a, b) => (S.subjectCounts[b] || 0) - (S.subjectCounts[a] || 0),
  )[0];
}

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
  navigate("landing");
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
  if (window.awardLeagueXP) window.awardLeagueXP(amount);
  // Save to Supabase in background
  const uid = localStorage.getItem("stasis_uid");
  if (uid) {
    fetch("/api/user/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: uid,
        name: localStorage.getItem("stasis_name"),
        xp: S.xp,
        streak: S.streak,
        class: S.classPreference,
        subject: S.subjectPreference,
      }),
    }).catch(() => {});
  }
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

function awardGemForCorrect() {
  S.correctAnswerCount = (S.correctAnswerCount || 0) + 1;
  if (S.correctAnswerCount % 10 === 0) {
    S.gems = (S.gems || 0) + 1;
    saveState();
    updateHeader();
    showXPFloat("💎 +1 Gem!");
  }
}

function logQuestion({ subject, chapter, correct, source }) {
  if (correct) awardGemForCorrect();
  S.questionHistory = S.questionHistory || [];
  S.questionHistory.unshift({
    date: new Date().toISOString(),
    subject: subject || S.subjectPreference || "",
    chapter: chapter || S.chapterPreference || "",
    correct: !!correct,
    source: source || "practice",
  });
  if (S.questionHistory.length > 500)
    S.questionHistory = S.questionHistory.slice(0, 500);
  saveState();
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
let _leagueRefreshTimer = null;
function stopLeagueRefresh() {
  if (_leagueRefreshTimer) {
    clearInterval(_leagueRefreshTimer);
    _leagueRefreshTimer = null;
  }
}

function navigate(page, extra) {
  currentPage = page;
  if (page !== "leagues") stopLeagueRefresh();
  const navPage = page === "landing" ? "landing" : page;
  document
    .querySelectorAll(".nav-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.page === navPage));
  const app = document.getElementById("app");
  app.innerHTML = "";
  app.classList.remove("fade-in");
  requestAnimationFrame(() => {
    app.classList.add("fade-in");
    switch (page) {
      case "landing":
        renderLanding();
        break;
      case "about":
        renderAbout();
        break;
      case "weaktopics":
        renderWeakTopics();
        break;
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
      case "mock-test":
        renderMockTestSetup();
        break;
      case "mind-map":
        renderMindMapSetup();
        break;
      case "flashcards":
        renderFlashcardsSetup();
        break;
      case "voice-doubt":
        renderVoiceDoubt();
        break;
      case "revision":
        renderRevisionSchedule();
        break;
      case "trends":
        renderTrendsAnalyser();
        break;
      case "search":
        renderWebSearch();
        break;
      case "pomodoro":
        renderPomodoro();
        break;
      case "settings":
        renderSettings();
        break;
      case "ask-doubt":
        renderAskDoubt();
        break;
      case "autopilot":
        renderAutopilot();
        break;
      case "leagues":
        stopLeagueRefresh();
        renderLeagues().then(() => {
          if (getMyLeagueId()) startLeagueRefresh();
        });
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
// LANDING PAGE
// ============================================================
function renderLanding() {
  const app = document.getElementById("app");
  const perf = getPerf();
  const perfDef =
    PERF_DEFS[perf ? perf.level : "developing"] || PERF_DEFS.developing;
  const name = localStorage.getItem("stasis_name") || "";
  const cls = (S && S.classPreference) || "10";
  const xp = S.xp || 0;
  const streak = S.streak || 0;
  const solved = S.totalSolved || 0;
  const gems = S.gems || 0;
  const bestStreak = S.bestStreak || 0;
  const accuracy =
    solved > 0 ? Math.round(((S.correctAnswerCount || 0) / solved) * 100) : 0;

  const hour = new Date().getHours();
  const timeGreet =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = name.split(" ")[0];
  const greetLine = firstName
    ? `${timeGreet}, ${escapeHtml(firstName)}`
    : "Welcome back";

  // XP levels
  const LEVELS_XP = [0, 150, 400, 900, 1800, 3500, 6000, 9500];
  const LEVEL_NAMES = [
    "🌱 Rookie",
    "📖 Scholar",
    "💡 Thinker",
    "🧠 Genius",
    "⚔️ Champion",
    "🏆 Legend",
    "👑 Master",
    "⚡ Apex",
  ];
  function getLvlIdx(x) {
    let i = 0;
    while (i < LEVELS_XP.length - 1 && x >= LEVELS_XP[i + 1]) i++;
    return i;
  }
  const lvlIdx = getLvlIdx(xp);
  const lvlName = LEVEL_NAMES[lvlIdx];
  const lvlEmoji = lvlName.split(" ")[0];
  const lvlLabel = lvlName.substring(lvlName.indexOf(" ") + 1);
  const nextXP = LEVELS_XP[lvlIdx + 1] || LEVELS_XP[LEVELS_XP.length - 1];
  const prevXP = LEVELS_XP[lvlIdx];
  const xpPct =
    lvlIdx >= LEVEL_NAMES.length - 1
      ? 100
      : Math.min(100, Math.round(((xp - prevXP) / (nextXP - prevXP)) * 100));
  const xpToNext = Math.max(0, nextXP - xp);

  // Top subject
  const subjectCounts = S.subjectCounts || {};
  const topSubject = Object.entries(subjectCounts).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const weakSubject = Object.entries(subjectCounts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => a[1] - b[1])[0];

  // Revision schedule info
  const rev = S.revisionSchedule;
  const hasRevPlan = rev && rev.examDate;
  let daysToExam = null;
  let examLabel = "";
  if (hasRevPlan) {
    daysToExam = Math.max(
      0,
      Math.round((new Date(rev.examDate) - Date.now()) / 86400000),
    );
    examLabel = rev.examDate;
  }

  // Today's activity
  const today = new Date().toISOString().split("T")[0];
  const todayXP = (S.weeklyXP || [])[new Date().getDay()] || 0;
  const todayLog = (S.dailySubjectLog || {})[today] || {};
  const todaySubjects = Object.keys(todayLog);

  // Streak message
  const streakMsg =
    streak >= 14
      ? "Unstoppable! 🔥"
      : streak >= 7
        ? "On fire! Keep it up 🔥"
        : streak >= 3
          ? "Building momentum ⚡"
          : streak >= 1
            ? "Good start! 🌱"
            : "Start your streak today";

  // Weekly XP chart data
  const weeklyXP = S.weeklyXP || Array(7).fill(0);
  const days7 = ["S", "M", "T", "W", "T", "F", "S"];
  const maxWXP = Math.max(...weeklyXP, 1);
  const todayDayIdx = new Date().getDay();

  app.innerHTML = `
    <style>
      @keyframes hp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      @keyframes hp-pop { 0%{transform:scale(0.88);opacity:0} 100%{transform:scale(1);opacity:1} }
      @keyframes hp-xp-fill { from{width:0%} to{width:${xpPct}%} }
      @keyframes hp-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      @keyframes hp-shimmer { 0%{left:-80%} 100%{left:160%} }
      @keyframes hp-bar-grow { from{height:0} to{height:var(--bar-h)} }

      .hp-card {
        background:rgba(255,255,255,0.035);
        border:1px solid rgba(255,255,255,0.08);
        border-radius:20px;
        padding:16px;
        animation: hp-pop 0.35s cubic-bezier(.34,1.56,.64,1) both;
      }
      .hp-action-btn {
        display:flex;align-items:center;gap:12px;
        border:none;border-radius:16px;padding:13px 14px;
        cursor:pointer;font-family:inherit;width:100%;
        text-align:left;position:relative;overflow:hidden;
        transition:transform 0.17s cubic-bezier(.34,1.56,.64,1), box-shadow 0.17s;
      }
      .hp-action-btn:hover { transform:translateY(-2px); }
      .hp-action-btn:active { transform:scale(0.97)!important; }
      .hp-action-btn::after {
        content:'';position:absolute;top:-50%;left:-80%;
        width:30%;height:200%;background:rgba(255,255,255,0.15);
        transform:skewX(-20deg);
        transition:left 0.4s;pointer-events:none;
      }
      .hp-action-btn:hover::after { left:160%; }
      .hp-pill-btn {
        border:none;border-radius:12px;padding:9px 14px;
        cursor:pointer;font-family:inherit;font-size:0.78rem;font-weight:700;
        transition:transform 0.15s,opacity 0.15s;
      }
      .hp-pill-btn:hover { transform:translateY(-1px);opacity:0.9; }
      .hp-pill-btn:active { transform:scale(0.96); }
      .hp-xp-fill {
        height:100%;border-radius:99px;
        background:linear-gradient(90deg,#4f8ef7,#9b6dff,#f0b429);
        width:0%;
        animation:hp-xp-fill 1.1s 0.3s cubic-bezier(.22,1,.36,1) forwards;
        box-shadow:0 0 10px rgba(79,142,247,0.5);
        position:relative;
      }
      .hp-xp-fill::after {
        content:'';position:absolute;right:0;top:50%;transform:translateY(-50%);
        width:7px;height:7px;border-radius:50%;background:#fff;
        box-shadow:0 0 6px #fff;
      }
      .hp-stat-num {
        font-size:1.6rem;font-weight:900;
        background:linear-gradient(135deg,var(--c1),var(--c2));
        -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        line-height:1;margin-bottom:2px;
      }
      .hp-section-label {
        font-size:0.68rem;font-weight:800;letter-spacing:0.08em;
        text-transform:uppercase;color:var(--text-muted);
        margin-bottom:10px;
      }
    </style>

    <!-- ━━━ HERO ━━━ -->
    <div style="padding-top:16px;">

      <!-- Greeting row -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;">
        <div>
          <div style="font-size:0.7rem;font-weight:700;color:var(--text-muted);letter-spacing:0.07em;text-transform:uppercase;margin-bottom:3px;">
            CBSE Class ${cls} · StasisEdu ⚡
          </div>
          <div style="font-size:1.5rem;font-weight:900;color:var(--text);line-height:1.1;margin-bottom:3px;">${greetLine} 👋</div>
          <div style="font-size:0.78rem;color:var(--text-muted);">${streakMsg}</div>
        </div>
        <!-- Avatar / streak orb -->
        <div onclick="navigate('stats')" style="cursor:pointer;flex-shrink:0;margin-left:10px;margin-top:2px;">
          <div style="width:54px;height:54px;border-radius:50%;
            background:linear-gradient(135deg,rgba(240,180,41,0.2),rgba(247,113,79,0.2));
            border:1.5px solid rgba(240,180,41,0.4);
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            box-shadow:0 0 18px rgba(240,180,41,0.2);">
            <div style="font-size:1.3rem;line-height:1">🔥</div>
            <div style="font-size:0.78rem;font-weight:900;color:#f0b429;line-height:1.3">${streak}</div>
          </div>
        </div>
      </div>

      <!-- ━━━ LEVEL + XP BAR ━━━ -->
      <div class="hp-card" style="margin-bottom:12px;background:linear-gradient(135deg,rgba(79,142,247,0.07),rgba(155,109,255,0.07));border-color:rgba(79,142,247,0.18);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:9px;">
            <div style="font-size:1.5rem;animation:hp-float 3s ease-in-out infinite;">${lvlEmoji}</div>
            <div>
              <div style="font-size:0.65rem;font-weight:700;color:#9b6dff;letter-spacing:0.06em;text-transform:uppercase;">Current Level</div>
              <div style="font-size:0.95rem;font-weight:900;color:var(--text);">${lvlLabel}</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:1rem;font-weight:900;color:var(--text);">${xp.toLocaleString()} XP</div>
            <div style="font-size:0.68rem;color:var(--text-muted);">${xpToNext > 0 ? `${xpToNext} to next level` : "Max level!"}</div>
          </div>
        </div>
        <div style="height:6px;border-radius:99px;background:rgba(255,255,255,0.07);overflow:hidden;">
          <div class="hp-xp-fill"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:7px;">
          <div style="font-size:0.65rem;color:var(--text-muted);">${xpPct}% complete</div>
          <div style="font-size:0.65rem;color:var(--text-muted);">🎯 ${solved} solved · 💎 ${gems} gems</div>
        </div>
      </div>

      <!-- ━━━ STAT CARDS ROW ━━━ -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:12px;">
        <div class="hp-card" style="text-align:center;padding:13px 8px;animation-delay:0.05s;">
          <div class="hp-stat-num" style="--c1:#f0b429;--c2:#f97316;">${streak}</div>
          <div style="font-size:0.65rem;color:var(--text-muted);font-weight:700;">Day Streak</div>
          <div style="font-size:0.6rem;color:var(--text-muted);margin-top:2px;">Best: ${bestStreak}</div>
        </div>
        <div class="hp-card" style="text-align:center;padding:13px 8px;animation-delay:0.1s;">
          <div class="hp-stat-num" style="--c1:#0fca8c;--c2:#06b6d4;">${accuracy}%</div>
          <div style="font-size:0.65rem;color:var(--text-muted);font-weight:700;">Accuracy</div>
          <div style="font-size:0.6rem;color:var(--text-muted);margin-top:2px;">${solved} solved</div>
        </div>
        <div class="hp-card" style="text-align:center;padding:13px 8px;animation-delay:0.15s;">
          <div class="hp-stat-num" style="--c1:#9b6dff;--c2:#ec4899;">${todayXP}</div>
          <div style="font-size:0.65rem;color:var(--text-muted);font-weight:700;">XP Today</div>
          <div style="font-size:0.6rem;color:var(--text-muted);margin-top:2px;">${todaySubjects.length > 0 ? todaySubjects.slice(0, 2).join(", ") : "Nothing yet"}</div>
        </div>
      </div>

      <!-- ━━━ EXAM COUNTDOWN (if set) ━━━ -->
      ${
        hasRevPlan
          ? `
      <div class="hp-card" onclick="navigate('revision')" style="cursor:pointer;margin-bottom:12px;animation-delay:0.1s;
        background:linear-gradient(135deg,rgba(240,180,41,0.08),rgba(247,113,79,0.06));
        border-color:rgba(240,180,41,0.22);display:flex;align-items:center;gap:14px;">
        <div style="font-size:2rem;animation:hp-float 2.5s ease-in-out infinite;flex-shrink:0;">📅</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.65rem;font-weight:800;color:#f0b429;letter-spacing:0.07em;text-transform:uppercase;margin-bottom:2px;">Exam Countdown</div>
          <div style="font-size:1.1rem;font-weight:900;color:var(--text);">${daysToExam === 0 ? "Exam is today! 🎯" : `${daysToExam} days left`}</div>
          <div style="font-size:0.7rem;color:var(--text-muted);">${examLabel} · Tap to view revision plan</div>
        </div>
        <div style="flex-shrink:0;font-size:1.2rem;color:var(--text-muted);">›</div>
      </div>`
          : `
      <div class="hp-card" onclick="navigate('autopilot')" style="cursor:pointer;margin-bottom:12px;animation-delay:0.1s;
        border:1.5px dashed rgba(240,180,41,0.3);background:rgba(240,180,41,0.04);
        display:flex;align-items:center;gap:12px;">
        <div style="font-size:1.8rem;flex-shrink:0;">📸</div>
        <div style="flex:1;">
          <div style="font-size:0.82rem;font-weight:800;color:var(--text);margin-bottom:2px;">Set up your exam plan</div>
          <div style="font-size:0.72rem;color:var(--text-muted);">Upload a PYQ → AI builds your full revision schedule</div>
        </div>
        <div style="font-size:1.1rem;color:#f0b429;">›</div>
      </div>`
      }

      <!-- ━━━ QUICK ACTIONS ━━━ -->
      <div class="hp-section-label">Quick Actions</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
        <button class="hp-action-btn" onclick="navigate('home')"
          style="background:linear-gradient(135deg,#4f8ef7,#6366f1);box-shadow:0 4px 20px rgba(79,142,247,0.35);">
          <div style="font-size:1.5rem;animation:hp-float 2.2s ease-in-out infinite;">🤖</div>
          <div style="flex:1;">
            <div style="font-size:0.88rem;font-weight:800;color:#fff;">Ask Nova a Doubt</div>
            <div style="font-size:0.7rem;color:rgba(255,255,255,0.75);">AI explains any CBSE concept instantly</div>
          </div>
          <div style="color:rgba(255,255,255,0.6);font-size:1rem;">›</div>
        </button>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button class="hp-action-btn" onclick="navigate('practice')"
            style="background:linear-gradient(135deg,#9b6dff,#c026d3);box-shadow:0 4px 16px rgba(155,109,255,0.3);">
            <div style="font-size:1.3rem;">📝</div>
            <div>
              <div style="font-size:0.82rem;font-weight:800;color:#fff;">Practice</div>
              <div style="font-size:0.65rem;color:rgba(255,255,255,0.7);">Adaptive MCQs</div>
            </div>
          </button>
          <button class="hp-action-btn" onclick="navigate('mock-test')"
            style="background:linear-gradient(135deg,#f0b429,#f97316);box-shadow:0 4px 16px rgba(240,180,41,0.3);">
            <div style="font-size:1.3rem;">📋</div>
            <div>
              <div style="font-size:0.82rem;font-weight:800;color:#fff;">Mock Test</div>
              <div style="font-size:0.65rem;color:rgba(255,255,255,0.7);">Full CBSE paper</div>
            </div>
          </button>
          <button class="hp-action-btn" onclick="navigate('games')"
            style="background:linear-gradient(135deg,#0fca8c,#06b6d4);box-shadow:0 4px 16px rgba(15,202,140,0.3);">
            <div style="font-size:1.3rem;">🎮</div>
            <div>
              <div style="font-size:0.82rem;font-weight:800;color:#fff;">Games</div>
              <div style="font-size:0.65rem;color:rgba(255,255,255,0.7);">Learn by playing</div>
            </div>
          </button>
          <button class="hp-action-btn" onclick="navigate('resources')"
            style="background:linear-gradient(135deg,#ec4899,#f97316);box-shadow:0 4px 16px rgba(236,72,153,0.3);">
            <div style="font-size:1.3rem;">📄</div>
            <div>
              <div style="font-size:0.82rem;font-weight:800;color:#fff;">Papers</div>
              <div style="font-size:0.65rem;color:rgba(255,255,255,0.7);">PYQs & samples</div>
            </div>
          </button>
        </div>
      </div>

      <!-- ━━━ WEEKLY XP CHART ━━━ -->
      <div class="hp-section-label">This Week</div>
      <div class="hp-card" style="margin-bottom:12px;animation-delay:0.12s;">
        <div style="display:flex;align-items:flex-end;justify-content:space-between;height:64px;gap:4px;margin-bottom:8px;">
          ${weeklyXP
            .map((v, i) => {
              const pct = Math.round((v / maxWXP) * 100);
              const isToday = i === todayDayIdx;
              const col = isToday
                ? "linear-gradient(180deg,#4f8ef7,#9b6dff)"
                : "rgba(255,255,255,0.12)";
              const h = Math.max(4, Math.round((pct / 100) * 56));
              return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;">
              <div style="width:100%;height:${h}px;border-radius:5px 5px 3px 3px;
                background:${col};
                box-shadow:${isToday ? "0 0 10px rgba(79,142,247,0.5)" : "none"};
                transition:height 0.6s cubic-bezier(.22,1,.36,1);"></div>
              <div style="font-size:0.6rem;color:${isToday ? "#4f8ef7" : "var(--text-muted)"};font-weight:${isToday ? "800" : "600"};">${days7[i]}</div>
            </div>`;
            })
            .join("")}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:0.7rem;color:var(--text-muted);">Weekly total: <span style="color:var(--text);font-weight:800;">${weeklyXP.reduce((a, b) => a + b, 0)} XP</span></div>
          <button onclick="navigate('stats')" style="background:none;border:none;font-size:0.7rem;color:#4f8ef7;font-weight:700;cursor:pointer;padding:0;font-family:inherit;">Full stats →</button>
        </div>
      </div>

      <!-- ━━━ SUBJECT INSIGHTS ━━━ -->
      ${
        topSubject || weakSubject
          ? `
      <div class="hp-section-label">Subject Insights</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:12px;">
        ${
          topSubject
            ? `
        <div class="hp-card" style="animation-delay:0.14s;background:rgba(15,202,140,0.06);border-color:rgba(15,202,140,0.18);">
          <div style="font-size:0.65rem;font-weight:800;color:#0fca8c;letter-spacing:0.07em;text-transform:uppercase;margin-bottom:6px;">Strongest</div>
          <div style="font-size:1rem;font-weight:900;color:var(--text);margin-bottom:2px;">💪 ${topSubject[0]}</div>
          <div style="font-size:0.68rem;color:var(--text-muted);">${topSubject[1]} questions done</div>
        </div>`
            : ""
        }
        ${
          weakSubject
            ? `
        <div class="hp-card" onclick="navigate('weaktopics')" style="cursor:pointer;animation-delay:0.18s;background:rgba(247,113,79,0.06);border-color:rgba(247,113,79,0.18);">
          <div style="font-size:0.65rem;font-weight:800;color:#f7714f;letter-spacing:0.07em;text-transform:uppercase;margin-bottom:6px;">Needs Work</div>
          <div style="font-size:1rem;font-weight:900;color:var(--text);margin-bottom:2px;">🎯 ${weakSubject[0]}</div>
          <div style="font-size:0.68rem;color:var(--text-muted);">Tap to focus here</div>
        </div>`
            : ""
        }
      </div>`
          : ""
      }

      <!-- ━━━ ALL TOOLS ━━━ -->
      <div class="hp-section-label">All Tools</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:12px;">
        ${[
          { e: "🤔", t: "Ask a Doubt", p: "ask-doubt", c: "#4f8ef7" },
          { e: "📚", t: "Study Resources", p: "resources", c: "#ec4899" },
          { e: "📅", t: "Revision Plan", p: "revision", c: "#06b6d4" },
          { e: "🧠", t: "Mind Map", p: "mind-map", c: "#9b6dff" },
          { e: "🃏", t: "Flashcards", p: "flashcards", c: "#0fca8c" },
          { e: "⏱️", t: "Study Timer", p: "pomodoro", c: "#ec4899" },
          { e: "🎯", t: "Weak Topics", p: "weaktopics", c: "#f7714f" },
          { e: "📸", t: "Paper Autopilot", p: "autopilot", c: "#f0b429" },
          { e: "⚔️", t: "Leagues", p: "leagues", c: "#f0b429" },
          { e: "🏆", t: "Leaderboard", p: "leaderboard", c: "#f0b429" },
          { e: "💾", t: "Saved", p: "saved", c: "#0fca8c" },
        ]
          .map(
            (f) => `
          <button onclick="navigate('${f.p}')" style="
            background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
            border-radius:16px;padding:13px 10px;cursor:pointer;font-family:inherit;
            text-align:center;transition:transform 0.17s cubic-bezier(.34,1.56,.64,1),box-shadow 0.17s;
            animation:hp-pop 0.35s cubic-bezier(.34,1.56,.64,1) both;"
            onmouseover="this.style.transform='translateY(-3px)';this.style.borderColor='${f.c}44'"
            onmouseout="this.style.transform='';this.style.borderColor='rgba(255,255,255,0.07)'">
            <div style="font-size:1.4rem;margin-bottom:5px;filter:drop-shadow(0 0 7px ${f.c}88);">${f.e}</div>
            <div style="font-size:0.72rem;font-weight:800;color:var(--text);line-height:1.2;">${f.t}</div>
            <div style="margin-top:7px;height:2px;border-radius:99px;background:linear-gradient(90deg,${f.c},transparent);opacity:0.5;"></div>
          </button>`,
          )
          .join("")}
      </div>

      <!-- ━━━ NOVA BANNER ━━━ -->
      <div class="hp-card" onclick="document.getElementById('nova-fab') && document.getElementById('nova-fab').click()"
        style="cursor:pointer;margin-bottom:4px;animation-delay:0.2s;
          background:linear-gradient(135deg,rgba(79,142,247,0.07),rgba(155,109,255,0.09));
          border-color:rgba(79,142,247,0.2);display:flex;align-items:center;gap:12px;">
        <div style="width:42px;height:42px;flex-shrink:0;border-radius:50%;
          background:linear-gradient(135deg,#4f8ef7,#9b6dff);
          display:flex;align-items:center;justify-content:center;font-size:1.1rem;
          box-shadow:0 0 14px rgba(79,142,247,0.5);animation:hp-float 2.8s ease-in-out infinite;">✨</div>
        <div style="flex:1;">
          <div style="font-size:0.82rem;font-weight:800;color:#4f8ef7;margin-bottom:2px;">Nova AI · Your study buddy</div>
          <div style="font-size:0.7rem;color:var(--text-muted);">Ask any CBSE doubt, get instant step-by-step help</div>
        </div>
        <div style="color:var(--text-muted);font-size:1rem;">›</div>
      </div>

      <!-- Bottom links -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px;">
        <button onclick="navigate('about')" style="padding:13px;border-radius:14px;border:1.5px solid rgba(79,217,179,0.25);background:rgba(79,217,179,0.06);color:#4fd9b3;font-size:0.78rem;font-weight:800;cursor:pointer;font-family:inherit;">ℹ️ About StasisEdu</button>
        <button onclick="navigate('settings')" style="padding:13px;border-radius:14px;border:1.5px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:var(--text-muted);font-size:0.78rem;font-weight:800;cursor:pointer;font-family:inherit;">⚙️ Settings</button>
      </div>
    </div>
  `;
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

    ${(() => {
      const streak = S.streak || 0;
      const todayXP = S.activityLog[todayKey()] || 0;
      const tip = getDailyTip();
      const weakSubject = getWeakSubject();
      const fireAnim =
        streak > 3
          ? `@keyframes _firePulse{0%,100%{transform:scale(1) rotate(-3deg);filter:drop-shadow(0 0 8px #f97316)}50%{transform:scale(1.15) rotate(3deg);filter:drop-shadow(0 0 18px #f97316)}}`
          : "";
      return `
      <style>${fireAnim}
        @keyframes _slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        ._hcard{border-radius:16px;padding:14px 16px;margin-bottom:12px;animation:_slideIn .35s ease both}
      </style>
      <!-- STREAK CARD -->
      <div class="_hcard" style="background:linear-gradient(135deg,rgba(249,115,22,0.18),rgba(240,180,41,0.1));border:1.5px solid rgba(249,115,22,${streak > 3 ? "0.5" : "0.25"});animation-delay:.05s;display:flex;align-items:center;gap:14px">
        <div style="font-size:${streak > 3 ? "2.8" : "2rem"};line-height:1;${streak > 3 ? "animation:_firePulse 1.5s ease-in-out infinite" : ""}">${streak > 0 ? "🔥" : "💤"}</div>
        <div style="flex:1">
          <div style="font-size:1.5rem;font-weight:900;color:${streak > 3 ? "#f97316" : "var(--text)"};line-height:1">${streak} <span style="font-size:0.9rem;font-weight:700;color:var(--text-muted)">day streak</span></div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">${streak === 0 ? "Start today to build your streak!" : streak > 3 ? `🏆 Best: ${S.bestStreak} days — keep it up!` : `Best: ${S.bestStreak} days`}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:1.1rem;font-weight:900;color:#f0b429">${todayXP}</div>
          <div style="font-size:0.65rem;color:var(--text-muted)">XP today</div>
        </div>
      </div>
      <!-- WEAK AREA ALERT -->
      ${
        weakSubject
          ? `<div class="_hcard" onclick="(()=>{S.subjectPreference='${weakSubject}';saveState();document.getElementById('subjectSel').value='${weakSubject}';window.onHomeSubjectChange&&onHomeSubjectChange();})()" style="background:rgba(240,180,41,0.08);border:1.5px solid rgba(240,180,41,0.3);cursor:pointer;display:flex;align-items:center;gap:12px;animation-delay:.1s" onmouseover="this.style.borderColor='rgba(240,180,41,0.6)'" onmouseout="this.style.borderColor='rgba(240,180,41,0.3)'">
        <div style="font-size:1.6rem">⚠️</div>
        <div style="flex:1">
          <div style="font-size:0.7rem;font-weight:900;letter-spacing:0.08em;color:#f0b429;text-transform:uppercase;margin-bottom:2px">Weak Area Detected</div>
          <div style="font-size:0.88rem;font-weight:700;color:var(--text)">You haven't practiced <strong style="color:#f0b429">${weakSubject}</strong> in 3+ days</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">Tap to switch → practice it now</div>
        </div>
        <div style="color:#f0b429;font-size:1.2rem">›</div>
      </div>`
          : ""
      }
      <!-- DAILY TIP -->
      <div class="_hcard" style="background:linear-gradient(135deg,rgba(79,142,247,0.1),rgba(155,109,255,0.07));border:1.5px solid rgba(79,142,247,0.2);animation-delay:.15s">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:1.1rem">${tip.emoji}</span>
          <span style="font-size:0.65rem;font-weight:900;letter-spacing:0.1em;color:#4f8ef7;text-transform:uppercase">Daily Tip · ${tip.subject}</span>
        </div>
        <div style="font-size:0.85rem;line-height:1.6;color:var(--text-secondary)">${tip.tip}</div>
      </div>
      <!-- FRIEND ACTIVITY -->
      <div id="home-friend-activity" class="_hcard" style="background:rgba(15,202,140,0.06);border:1.5px solid rgba(15,202,140,0.15);animation-delay:.2s;display:none">
        <div style="font-size:0.65rem;font-weight:900;letter-spacing:0.1em;color:#0fca8c;text-transform:uppercase;margin-bottom:8px">🏫 Open Classrooms</div>
        <div id="home-rooms-list" style="font-size:0.82rem;color:var(--text-muted)">Loading...</div>
      </div>
    `;
    })()}

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

    <!-- MORE TOOLS 3-col grid -->
    <div style="margin-top:16px;">
      <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:10px;">More Tools</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
        ${[
          {
            emoji: "🤔",
            title: "Ask a Doubt",
            desc: "Snap, type or speak",
            page: "ask-doubt",
            accent: "#4f8ef7",
          },
          {
            emoji: "📚",
            title: "Study Resources",
            desc: "Notes, NCERT, formulas",
            page: "resources",
            accent: "#ec4899",
          },
          {
            emoji: "📅",
            title: "Revision Plan",
            desc: "AI study schedule",
            page: "revision",
            accent: "#06b6d4",
          },
          {
            emoji: "📊",
            title: "PYQ Trends",
            desc: "Board exam topics",
            page: "resources",
            accent: "#f97316",
          },
          {
            emoji: "📝",
            title: "Mock Test",
            desc: "Full CBSE test",
            page: "mock-test",
            accent: "#f0b429",
          },
          {
            emoji: "🧠",
            title: "Mind Map",
            desc: "Visual breakdown",
            page: "mind-map",
            accent: "#9b6dff",
          },
          {
            emoji: "🃏",
            title: "Flashcards",
            desc: "Spaced repetition",
            page: "flashcards",
            accent: "#0fca8c",
          },
          {
            emoji: "📊",
            title: "Your Stats",
            desc: "XP & accuracy",
            page: "stats",
            accent: "#9b6dff",
          },
          {
            emoji: "🏆",
            title: "Leaderboard",
            desc: "Rank #1 globally",
            page: "leaderboard",
            accent: "#f0b429",
          },
          {
            emoji: "💾",
            title: "Saved",
            desc: "Bookmarked Qs",
            page: "saved",
            accent: "#0fca8c",
          },
          {
            emoji: "⏱️",
            title: "Study Timer",
            desc: "25 min focus",
            page: "pomodoro",
            accent: "#ec4899",
          },
          {
            emoji: "ℹ️",
            title: "About",
            desc: "About this app",
            page: "about",
            accent: "#4fd9b3",
          },
        ]
          .map(
            (f) => `
          <button onclick="navigate('${f.page}')" style="padding:12px 8px;border-radius:14px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center;">
            <div style="font-size:1.4rem;filter:drop-shadow(0 0 8px ${f.accent}66);">${f.emoji}</div>
            <div style="font-size:0.72rem;font-weight:800;color:#eef2ff;">${f.title}</div>
            <div style="font-size:0.6rem;color:#5a6a8a;line-height:1.3;">${f.desc}</div>
            <div style="margin-top:6px;height:2px;width:100%;border-radius:99px;background:linear-gradient(90deg,${f.accent},transparent);opacity:0.6;"></div>
          </button>`,
          )
          .join("")}
      </div>
    </div>
  `;

  renderRecentSolves();

  // Poll for open classroom rooms (friend activity)
  (async () => {
    try {
      const recentCodes = (S.classroomHistory || [])
        .slice(0, 5)
        .map((h) => h.code)
        .filter(Boolean);
      if (recentCodes.length === 0) return;
      const results = await Promise.allSettled(
        recentCodes.map((code) =>
          apiPost("/classroom/poll", { code, playerId: "guest_check" }),
        ),
      );
      const openRooms = results
        .map((r, i) =>
          r.status === "fulfilled" && r.value && r.value.status === "waiting"
            ? { code: recentCodes[i], players: r.value.players || [] }
            : null,
        )
        .filter(Boolean);
      const card = document.getElementById("home-friend-activity");
      const list = document.getElementById("home-rooms-list");
      if (card && list && openRooms.length > 0) {
        card.style.display = "block";
        list.innerHTML = openRooms
          .map(
            (
              r,
            ) => `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
          <div><span style="font-weight:800;color:#0fca8c;letter-spacing:0.1em">${r.code}</span> <span style="color:var(--text-muted);font-size:0.78rem">${r.players.length} player${r.players.length !== 1 ? "s" : ""} waiting</span></div>
          <button onclick="showJoinRoom()" style="background:rgba(15,202,140,0.2);border:1px solid rgba(15,202,140,0.4);color:#0fca8c;border-radius:8px;padding:4px 12px;font-size:0.75rem;font-weight:800;cursor:pointer;font-family:inherit">Join \u2192</button>
        </div>`,
          )
          .join("");
      }
    } catch (e) {}
  })();

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
            marks: window._selectedMarks,
            depth: window._selectedDepth,
          }
        : {
            question: q,
            subject,
            classNum: S.classPreference,
            chapter,
            level: getPerf().level,
            language: getLanguage(),
            marks: window._selectedMarks,
            depth: window._selectedDepth,
          };

      const data = await apiPost(endpoint, body);
      const steps = data.steps || [];
      const solution = data.solution || "";
      const memoryTrick = data.memoryTrick || "";
      const nutshell = data.nutshell || "";
      const keyPoint = data.keyPoint || "";
      const examTip = data.examTip || "";
      const commonMistake = data.commonMistake || "";
      const quickQuiz = data.quickQuiz || null;

      window._lastSolution = {
        q: q || "📷 Photo question",
        solution,
        steps: Array.isArray(steps) ? steps : [],
        memoryTrick,
        subject,
        chapter,
        classNum: S.classPreference,
      };

      // ── detect marks from question ──
      const markMatch = (q || "").match(/\b(\d)\s*[-–]?\s*marks?\b/i);
      const detectedMarks = markMatch ? parseInt(markMatch[1]) : null;
      // Persist marks/depth across solves; only reset if user hasn't changed them
      if (window._selectedMarks === undefined)
        window._selectedMarks = detectedMarks || "auto";
      if (window._selectedDepth === undefined)
        window._selectedDepth = "moderate";
      let _selectedMarks = window._selectedMarks;
      let _selectedDepth = window._selectedDepth;

      function _buildSolutionHTML() {
        const depthLabels = ["Simple", "Moderate", "Intermediate", "Advanced"];
        const markOpts = ["auto", "2M", "3M", "5M"];
        return `
        <div class="glass solution-card slide-up" style="padding:0;overflow:hidden;margin-bottom:14px;">
          <!-- ANSWER FORMAT BAR -->
          <div style="padding:12px 16px 10px;border-bottom:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02)">
            <div style="font-size:0.6rem;font-weight:900;letter-spacing:0.1em;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:6px">🎓 Answer Format</div>
            <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <span style="font-size:0.65rem;font-weight:700;color:var(--text-muted);text-transform:uppercase">Marks</span>
                ${markOpts.map((m) => `<button onclick="window._solveSetMarks('${m}')" id="sm-${m}" style="padding:3px 10px;border-radius:20px;font-size:0.7rem;font-weight:800;border:1.5px solid ${_selectedMarks == m ? "#4f8ef7" : "rgba(255,255,255,0.15)"};background:${_selectedMarks == m ? "rgba(79,142,247,0.18)" : "transparent"};color:${_selectedMarks == m ? "#4f8ef7" : "var(--text-muted)"};cursor:pointer;font-family:inherit;transition:all .15s">${m === "auto" ? "Auto-" + (detectedMarks || 2) + "M" : m}</button>`).join("")}
              </div>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <span style="font-size:0.65rem;font-weight:700;color:var(--text-muted);text-transform:uppercase">Depth</span>
                ${depthLabels.map((d) => `<button onclick="window._solveSetDepth('${d.toLowerCase()}')" id="sd-${d.toLowerCase()}" style="padding:3px 10px;border-radius:20px;font-size:0.7rem;font-weight:800;border:1.5px solid ${_selectedDepth === d.toLowerCase() ? "#4f8ef7" : "rgba(255,255,255,0.15)"};background:${_selectedDepth === d.toLowerCase() ? "rgba(79,142,247,0.18)" : "transparent"};color:${_selectedDepth === d.toLowerCase() ? "#4f8ef7" : "var(--text-muted)"};cursor:pointer;font-family:inherit;transition:all .15s">${d}</button>`).join("")}
              </div>
            </div>
          </div>

          <!-- EXAM-READY ANSWER -->
          <div style="padding:16px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div style="font-size:0.88rem;font-weight:900;color:#fff;display:flex;align-items:center;gap:7px">🎓 Exam-Ready Answer</div>
              <div style="display:flex;gap:8px">
                <button onclick="saveAnswer()" id="saveAnswerBtn" title="Save" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:5px 8px;cursor:pointer;font-size:0.8rem;color:var(--text-muted)">🔖</button>
                <button onclick="navigator.clipboard&&navigator.clipboard.writeText(document.getElementById('_solve-main-text')?.innerText||'')" title="Copy" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:5px 8px;cursor:pointer;font-size:0.8rem;color:var(--text-muted)">📋</button>
              </div>
            </div>
            <div id="_solve-main-text" style="font-size:0.9rem;line-height:1.75;color:var(--text)">
              ${
                steps.length > 0
                  ? steps
                      .map(
                        (s, i) =>
                          `<div class="solution-step"><div class="step-num">${i + 1}</div><div class="step-text">${renderStep(s)}</div></div>`,
                      )
                      .join("")
                  : `<div>${escapeHtml(solution)}</div>`
              }
            </div>
          </div>

          <!-- IN A NUTSHELL -->
          ${
            nutshell
              ? `
          <div style="margin:0 16px 16px;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);display:flex;gap:10px;align-items:flex-start">
            <span style="font-size:1.2rem;margin-top:1px">⚙️</span>
            <div>
              <div style="font-size:0.6rem;font-weight:900;letter-spacing:0.1em;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">In a Nutshell</div>
              <div style="font-size:0.82rem;line-height:1.6;color:var(--text-secondary)">${escapeHtml(nutshell)}</div>
            </div>
          </div>`
              : ""
          }

          <!-- 4 INFO CARDS -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 16px 16px;">
            ${keyPoint ? `<div style="padding:10px 12px;border-radius:12px;background:rgba(79,142,247,0.07);border:1px solid rgba(79,142,247,0.18)"><div style="font-size:0.6rem;font-weight:900;color:#4f8ef7;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Key Concept</div><div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.5">${escapeHtml(keyPoint)}</div></div>` : ""}
            ${examTip ? `<div style="padding:10px 12px;border-radius:12px;background:rgba(240,180,41,0.07);border:1px solid rgba(240,180,41,0.18)"><div style="font-size:0.6rem;font-weight:900;color:#f0b429;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Exam Tip</div><div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.5">${escapeHtml(examTip)}</div></div>` : ""}
            ${commonMistake ? `<div style="padding:10px 12px;border-radius:12px;background:rgba(247,113,79,0.07);border:1px solid rgba(247,113,79,0.18)"><div style="font-size:0.6rem;font-weight:900;color:#f7714f;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Common Mistake</div><div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.5">${escapeHtml(commonMistake)}</div></div>` : ""}
            ${memoryTrick ? `<div style="padding:10px 12px;border-radius:12px;background:rgba(15,202,140,0.07);border:1px solid rgba(15,202,140,0.18)"><div style="font-size:0.6rem;font-weight:900;color:#0fca8c;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Memory Trick</div><div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.5">${escapeHtml(memoryTrick)}</div></div>` : ""}
          </div>

          <!-- ASK MORE CHIPS -->
          <div style="padding:0 16px 14px">
            <div style="font-size:0.6rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:7px">Ask More</div>
            <div style="display:flex;gap:7px;flex-wrap:wrap">
              ${["Simpler explanation", "Real-life example", "Common mistakes", "Exam questions"].map((chip) => `<button onclick="window._solveAskMore('${chip}')" style="padding:5px 12px;border-radius:20px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.04);color:var(--text-muted);font-size:0.72rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s" onmouseover="this.style.borderColor='rgba(79,142,247,0.5)';this.style.color='#4f8ef7'" onmouseout="this.style.borderColor='rgba(255,255,255,0.15)';this.style.color='var(--text-muted)'">${chip}</button>`).join("")}
            </div>
          </div>
        </div>

        <!-- STEP BY STEP -->
        ${
          steps.length > 0
            ? `
        <div class="glass solution-card slide-up" style="margin-bottom:14px;">
          <div style="font-size:0.88rem;font-weight:900;color:#fff;margin-bottom:14px">Step-by-Step Breakdown</div>
          ${steps.map((s, i) => `<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)"><div style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:900;color:var(--text-muted);flex-shrink:0">${i + 1}</div><div style="font-size:0.85rem;line-height:1.65;color:var(--text-secondary);padding-top:3px">${renderStep(s)}</div></div>`).join("")}
        </div>`
            : ""
        }

        <!-- QUICK QUIZ -->
        ${
          quickQuiz
            ? `
        <div class="glass solution-card slide-up" style="margin-bottom:14px;" id="_qq-card">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <span style="font-size:0.88rem;font-weight:900;color:#fff">Quick Quiz</span>
            <span style="padding:2px 9px;border-radius:20px;background:rgba(79,142,247,0.18);border:1px solid rgba(79,142,247,0.3);font-size:0.65rem;font-weight:800;color:#4f8ef7">+50 XP</span>
          </div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:14px">Test your understanding</div>
          <div style="font-size:0.88rem;font-weight:600;color:var(--text);margin-bottom:12px">${escapeHtml(quickQuiz.question)}</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${(quickQuiz.options || []).map((opt, i) => `<button onclick="window._qqAnswer('${opt[0]}')" id="_qq-opt-${opt[0]}" style="text-align:left;padding:11px 14px;border-radius:10px;border:1.5px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:var(--text);font-size:0.83rem;cursor:pointer;font-family:inherit;transition:all .2s">${escapeHtml(opt)}</button>`).join("")}
          </div>
          <div id="_qq-result" style="margin-top:10px;font-size:0.8rem;"></div>
        </div>`
            : ""
        }

        <!-- ACTIONS -->
        <div class="flex gap-2" style="flex-wrap:wrap;margin-bottom:8px">
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('questionInput').value='';document.getElementById('solutionArea').innerHTML='';document.getElementById('charCount').textContent='0';window.removeImage&&removeImage()">${t("ask_another")}</button>
        </div>
        `;
      }

      area.innerHTML = _buildSolutionHTML();

      // ── Quick Quiz answer handler ──
      window._qqAnswer = function (chosen) {
        const correct = quickQuiz?.answer;
        const opts = document.querySelectorAll('[id^="_qq-opt-"]');
        opts.forEach((btn) => {
          btn.disabled = true;
          const letter = btn.id.slice(-1);
          if (letter === correct)
            ((btn.style.background = "rgba(15,202,140,0.18)"),
              (btn.style.borderColor = "#0fca8c"),
              (btn.style.color = "#0fca8c"));
          else if (letter === chosen)
            ((btn.style.background = "rgba(247,113,79,0.15)"),
              (btn.style.borderColor = "#f7714f"),
              (btn.style.color = "#f7714f"));
        });
        const res = document.getElementById("_qq-result");
        if (res) {
          const isCorrect = chosen === correct;
          res.innerHTML = `<div style="padding:8px 12px;border-radius:10px;background:${isCorrect ? "rgba(15,202,140,0.1)" : "rgba(247,113,79,0.1)"};border:1px solid ${isCorrect ? "rgba(15,202,140,0.3)" : "rgba(247,113,79,0.3)"}"><span style="font-weight:800;color:${isCorrect ? "#0fca8c" : "#f7714f"}">${isCorrect ? "✅ Correct!" : "❌ Incorrect"}</span> ${escapeHtml(quickQuiz?.explanation || "")}</div>`;
          if (isCorrect) {
            addXP(50, "quickquiz");
            awardGemForCorrect();
          }
        }
      };

      // ── Ask More chip handler ──
      window._solveAskMore = async function (chip) {
        const moreArea = document.getElementById("solutionArea");
        const followUp = chip + " for: " + (q || solution);
        document.getElementById("questionInput").value = followUp;
        solveQuestion();
      };

      // ── Marks / Depth toggle (cosmetic — re-request on change) ──
      window._solveSetMarks = function (m) {
        _selectedMarks = m;
        window._selectedMarks = m;
        document.querySelectorAll('[id^="sm-"]').forEach((b) => {
          const active = b.id === "sm-" + m;
          b.style.borderColor = active ? "#4f8ef7" : "rgba(255,255,255,0.15)";
          b.style.background = active ? "rgba(79,142,247,0.18)" : "transparent";
          b.style.color = active ? "#4f8ef7" : "var(--text-muted)";
        });
      };
      window._solveSetDepth = function (d) {
        _selectedDepth = d;
        window._selectedDepth = d;
        document.querySelectorAll('[id^="sd-"]').forEach((b) => {
          const active = b.id === "sd-" + d;
          b.style.borderColor = active ? "#4f8ef7" : "rgba(255,255,255,0.15)";
          b.style.background = active ? "rgba(79,142,247,0.18)" : "transparent";
          b.style.color = active ? "#4f8ef7" : "var(--text-muted)";
        });
      };

      S.totalSolved += 1;
      S.sessionSolves += 1;
      S.subjectCounts[subject] = (S.subjectCounts[subject] || 0) + 1;
      logSubjectActivity(subject);
      updateStreak();
      addXP(20, "solve");
      logQuestion({ subject, chapter, correct: true, source: "solve" });
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

  const practiceCount = S._practiceCount || 15;
  const _pct = Math.round((done / practiceCount) * 100);
  const _doneColor =
    done === practiceCount
      ? "#0fca8c"
      : done >= practiceCount / 2
        ? "#f0b429"
        : "#4f8ef7";
  app.innerHTML = `
    <style>
      @keyframes _pulse{0%,100%{opacity:.7}50%{opacity:1}}
      @keyframes _fillBar{from{width:0}to{width:${_pct}%}}
      ._pcard{border-radius:16px;padding:18px;margin-bottom:14px;position:relative;overflow:hidden;transition:box-shadow .3s}
      ._pcard._done_ok{background:rgba(15,202,140,0.07);border:1.5px solid rgba(15,202,140,0.35)}
      ._pcard._done_fail{background:rgba(240,86,74,0.07);border:1.5px solid rgba(240,86,74,0.3)}
      ._pcard._pending{background:rgba(79,142,247,0.06);border:1.5px solid rgba(79,142,247,0.22)}
      ._pcard._pending:focus-within{box-shadow:0 0 0 2px rgba(79,142,247,0.4)}
      ._qnum{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;font-size:0.78rem;font-weight:900;margin-right:8px}
    </style>
    <div style="border-radius:20px;padding:0;margin-bottom:16px;overflow:hidden;border:1.5px solid rgba(79,142,247,0.3);box-shadow:0 0 40px rgba(79,142,247,0.12)">
      <div style="background:linear-gradient(135deg,#1a2a6c,#2d1b69,#1a1a3e);padding:20px 20px 16px;position:relative;overflow:hidden">
        <div style="position:absolute;top:-60px;right:-60px;width:200px;height:200px;border-radius:50%;background:rgba(79,142,247,0.15);filter:blur(40px)"></div>
        <div style="position:absolute;bottom:-40px;left:-40px;width:150px;height:150px;border-radius:50%;background:rgba(155,109,255,0.12);filter:blur(30px)"></div>
        <div style="display:flex;align-items:flex-start;justify-content:space-between;position:relative">
          <div>
            <div style="font-size:0.65rem;font-weight:900;letter-spacing:0.16em;color:rgba(147,197,253,0.8);text-transform:uppercase;margin-bottom:6px">⚡ Daily Practice</div>
            <div style="font-size:1.3rem;font-weight:900;color:#fff;margin-bottom:10px">${new Date().toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" })}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">${subjectTag(S.subjectPreference)}${chapterTag(S.practiceChapter)}</div>
          </div>
          <div style="text-align:center;background:rgba(255,255,255,0.08);border:1.5px solid rgba(255,255,255,0.15);border-radius:16px;padding:12px 16px;min-width:68px;backdrop-filter:blur(10px)">
            <div style="font-size:2rem;font-weight:900;color:${_doneColor};line-height:1;text-shadow:0 0 20px ${_doneColor}">${done}</div>
            <div style="font-size:0.6rem;color:rgba(255,255,255,0.5);margin-top:2px">of ${practiceCount} done</div>
          </div>
        </div>
        <div style="margin-top:14px;background:rgba(255,255,255,0.08);border-radius:100px;height:6px;overflow:hidden">
          <div style="height:100%;border-radius:100px;background:linear-gradient(90deg,${_doneColor},${_doneColor}aa);animation:_fillBar .8s ease forwards;width:${_pct}%"></div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px">
          <div style="font-size:0.75rem;color:rgba(255,255,255,0.55)">${perfDef.emoji} <strong style="color:rgba(255,255,255,0.85)">${perfDef.name}</strong> level</div>
          <button class="btn btn-secondary btn-sm" onclick="changePracticeChapter()" style="font-size:0.7rem;padding:4px 10px;background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.15);color:rgba(255,255,255,0.7)">Change Chapter</button>
        </div>
      </div>
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
window.renderPracticeSetup = renderPracticeSetup;
window.renderPractice = renderPractice;
window.goBackFromPractice = () => {
  _practicePicked = false;
  if (S.practiceChapter) {
    // Already have chapter — go back to practice page (will show picker again next time)
    // But we want to skip the picker this time, so directly show the practice screen
    // with existing questions if any, else setup
    S.todayPractice = [];
    S.practiceDate = null;
    saveState();
    renderPracticeSetup();
  } else {
    renderPracticeSetup();
  }
};

let _practicePicked = false;

async function loadPracticeQuestions() {
  if (!_practicePicked) {
    renderDifficultyPicker({
      title: "⚡ Daily Practice",
      color: "#9b6dff",
      backFn: "goBackFromPractice",
      onConfirm: () => {
        _practicePicked = true;
        S._practiceDifficulty = _gameConfig.difficulty;
        S._practiceCount = _gameConfig.count;
        // Reset today's practice so it reloads with new settings
        S.todayPractice = [];
        S.practiceDate = null;
        saveState();
        // Re-render practice page which will call loadPracticeQuestions again
        renderPractice();
      },
    });
    return;
  }
  _practicePicked = false; // reset for next visit
  doLoadPracticeQuestions();
}

async function doLoadPracticeQuestions() {
  const cardsEl = document.getElementById("practiceCards");
  if (!cardsEl) return;
  const count = S._practiceCount || 15;
  cardsEl.innerHTML = Array(Math.min(count, 3)).fill(skeletonCard()).join("");
  try {
    const data = await apiPost("/practice", {
      classNum: S.classPreference,
      subject: S.subjectPreference,
      chapter: S.practiceChapter,
      level: getPerf().level,
      difficulty: S._practiceDifficulty || "medium",
      count: count,
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
  const _cardAccents = ["#4f8ef7", "#9b6dff", "#0fca8c"];
  cardsEl.innerHTML = questions
    .map((q, i) => {
      const ac = _cardAccents[i % _cardAccents.length];
      const cls = q.done ? (q.correct ? "_done_ok" : "_done_fail") : "_pending";
      const icon = q.done
        ? q.correct
          ? "✅"
          : "❌"
        : `<span style="background:${ac};color:#fff;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:900">${i + 1}</span>`;
      return `
    <div class="_pcard ${cls}" id="pcard-${i}">
      <div style="position:absolute;top:0;left:0;width:4px;height:100%;background:${q.done ? (q.correct ? "#0fca8c" : "#f0564a") : ac};border-radius:16px 0 0 16px"></div>
      <div style="padding-left:12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap">
          ${icon}
          <span style="font-size:0.72rem;font-weight:700;color:var(--text-muted);background:rgba(255,255,255,0.05);padding:2px 8px;border-radius:20px">${q.difficulty || "Medium"}</span>
          ${chapterTag(S.practiceChapter)}
          ${q.done ? `<span style="margin-left:auto;font-size:0.78rem;font-weight:800;color:${q.correct ? "#0fca8c" : "#f0564a"}">${q.correct ? "Correct ✓" : "Wrong ✗"}</span>` : ""}
        </div>
        <div style="font-size:0.93rem;line-height:1.6;color:var(--text);font-weight:500;margin-bottom:${q.done ? "12px" : "14px"}">${escapeHtml(q.question)}</div>
        ${
          !q.done
            ? `
          <div id="prac-pwr-bar-${i}" style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
            <button onclick="window.pracPwr('hint',${i},this)" style="flex:1;min-width:80px;padding:7px 6px;border-radius:11px;border:1.5px solid rgba(247,199,79,0.4);background:rgba(247,199,79,0.08);cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:5px;">
              <span style="font-size:0.95rem;">💡</span><span style="font-size:0.7rem;font-weight:800;color:#f7c74f;">Hint <span style="color:#5a6a8a;font-weight:500;">-20 XP</span></span>
            </button>
            <button onclick="window.pracPwr('eliminate',${i},this)" style="flex:1;min-width:80px;padding:7px 6px;border-radius:11px;border:1.5px solid rgba(79,217,179,0.4);background:rgba(79,217,179,0.08);cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:5px;">
              <span style="font-size:0.95rem;">🎯</span><span style="font-size:0.7rem;font-weight:800;color:#4fd9b3;">Key Point <span style="color:#5a6a8a;font-weight:500;">-20 XP</span></span>
            </button>
            <button onclick="window.pracPwr('simplify',${i},this)" style="flex:1;min-width:80px;padding:7px 6px;border-radius:11px;border:1.5px solid rgba(155,109,255,0.4);background:rgba(155,109,255,0.08);cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:5px;">
              <span style="font-size:0.95rem;">🔍</span><span style="font-size:0.7rem;font-weight:800;color:#9b6dff;">Simplify <span style="color:#5a6a8a;font-weight:500;">-20 XP</span></span>
            </button>
          </div>
          <div id="prac-pwr-hint-${i}" style="margin-bottom:8px;"></div>
          <textarea class="form-textarea" id="pans-${i}" placeholder="${t("type_answer")}" style="min-height:80px;background:rgba(0,0,0,0.3);border-color:${ac}44;border-radius:12px"></textarea>
          <button class="btn btn-primary btn-sm mt-2" onclick="submitPractice(${i})" style="background:${ac};border:none;box-shadow:0 4px 14px ${ac}55">${t("submit_answer")}</button>
        `
            : `
          <div style="background:${q.correct ? "rgba(15,202,140,0.08)" : "rgba(240,86,74,0.08)"};border-left:3px solid ${q.correct ? "#0fca8c" : "#f0564a"};padding:10px 14px;border-radius:0 10px 10px 0;font-size:0.83rem;color:var(--text-secondary);line-height:1.6">${escapeHtml(q.feedback || "")}</div>
        `
        }
        <div id="pres-${i}"></div>
      </div>
    </div>`;
    })
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
    addXP(
      data.correct
        ? COUNT_CONFIG[S._practiceCount || 15]?.xp || 10
        : Math.round((COUNT_CONFIG[S._practiceCount || 15]?.xp || 10) * 0.5),
      "practice",
    );
    logQuestion({
      subject: S.subjectPreference,
      chapter: S.practiceChapter,
      correct: data.correct,
      source: "practice",
    });
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
    <div class="section-heading mb-3">${t("saved_answers")}</div>
    <!-- Tabs -->
    <div style="display:flex;gap:0;background:rgba(255,255,255,0.04);border-radius:12px;padding:4px;margin-bottom:16px;border:1px solid rgba(255,255,255,0.08)">
      <button id="tab-saved" onclick="showSavedTab('saved')" style="flex:1;padding:8px;border-radius:9px;border:none;background:rgba(79,142,247,0.2);color:#4f8ef7;font-size:0.82rem;font-weight:800;cursor:pointer;font-family:inherit">💾 Saved</button>
      <button id="tab-history" onclick="showSavedTab('history')" style="flex:1;padding:8px;border-radius:9px;border:none;background:transparent;color:var(--text-muted);font-size:0.82rem;font-weight:700;cursor:pointer;font-family:inherit">📋 History</button>
    </div>
    <!-- Saved Answers panel -->
    <div id="saved-panel">
      <div class="search-bar mb-3">
        <span class="search-icon">🔍</span>
        <input type="search" class="form-input" id="savedSearch" placeholder="${t("search_saved")}" oninput="filterSaved()">
      </div>
      <div class="filter-pills mb-4" id="savedFilters">
        ${subjects.map((s) => `<button class="filter-pill ${s === "All" ? "active" : ""}" onclick="setSavedFilter('${s}')" data-filter="${s}">${s}</button>`).join("")}
      </div>
      <div class="saved-grid" id="savedGrid"></div>
    </div>
    <!-- History panel -->
    <div id="history-panel" style="display:none">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px" id="historyFilters">
        ${["All", "practice", "solve", "game-quiz", "classroom"].map((s, i) => `<button data-hf="${s}" onclick="filterHistory('${s}')" style="padding:5px 12px;border-radius:20px;border:1.5px solid ${i === 0 ? "#4f8ef7" : "rgba(255,255,255,0.1)"};background:${i === 0 ? "rgba(79,142,247,0.15)" : "rgba(255,255,255,0.04)"};color:${i === 0 ? "#4f8ef7" : "var(--text-muted)"};font-size:0.75rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s">${s === "All" ? "All" : s === "practice" ? "Practice" : s === "solve" ? "Solve" : s === "game-quiz" ? "Quiz Game" : "Classroom"}</button>`).join("")}
      </div>
      <div id="historyGrid"></div>
    </div>
  `;

  window.showSavedTab = (tab) => {
    const savedPanel = document.getElementById("saved-panel");
    const historyPanel = document.getElementById("history-panel");
    const savedBtn = document.getElementById("tab-saved");
    const historyBtn = document.getElementById("tab-history");
    if (tab === "saved") {
      savedPanel.style.display = "block";
      historyPanel.style.display = "none";
      savedBtn.style.background = "rgba(79,142,247,0.2)";
      savedBtn.style.color = "#4f8ef7";
      historyBtn.style.background = "transparent";
      historyBtn.style.color = "var(--text-muted)";
    } else {
      savedPanel.style.display = "none";
      historyPanel.style.display = "block";
      historyBtn.style.background = "rgba(79,142,247,0.2)";
      historyBtn.style.color = "#4f8ef7";
      savedBtn.style.background = "transparent";
      savedBtn.style.color = "var(--text-muted)";
      renderHistoryGrid("All");
    }
  };

  window.filterHistory = (source) => {
    document.querySelectorAll("[data-hf]").forEach((btn) => {
      const active = btn.dataset.hf === source;
      btn.style.borderColor = active ? "#4f8ef7" : "rgba(255,255,255,0.1)";
      btn.style.background = active
        ? "rgba(79,142,247,0.15)"
        : "rgba(255,255,255,0.04)";
      btn.style.color = active ? "#4f8ef7" : "var(--text-muted)";
    });
    renderHistoryGrid(source);
  };

  function renderHistoryGrid(sourceFilter) {
    const grid = document.getElementById("historyGrid");
    if (!grid) return;
    const history = (S.questionHistory || []).filter(
      (h) => sourceFilter === "All" || h.source === sourceFilter,
    );
    if (history.length === 0) {
      grid.innerHTML = `<div style="text-align:center;padding:40px 0;color:var(--text-muted);font-size:0.85rem">No history yet — start solving or practicing!</div>`;
      return;
    }
    const sourceLabel = {
      practice: "Practice",
      solve: "Solve",
      "game-quiz": "Quiz Game",
      classroom: "Classroom",
    };
    const sourceColor = {
      practice: "#9b6dff",
      solve: "#4f8ef7",
      "game-quiz": "#0fca8c",
      classroom: "#f0b429",
    };
    // Group by date
    const byDate = {};
    history.forEach((h) => {
      const d = h.date?.split("T")[0] || "Unknown";
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(h);
    });
    grid.innerHTML = Object.entries(byDate)
      .slice(0, 14)
      .map(
        ([date, items]) => `
      <div style="margin-bottom:16px">
        <div style="font-size:0.68rem;font-weight:900;letter-spacing:0.08em;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px">${new Date(date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</div>
        ${items
          .slice(0, 20)
          .map((h) => {
            const col = sourceColor[h.source] || "#4f8ef7";
            return `<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:11px;margin-bottom:6px">
            <span style="font-size:1rem">${h.correct ? "✅" : "❌"}</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:0.82rem;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h.subject} ${h.chapter ? "· " + h.chapter : ""}</div>
              <div style="font-size:0.7rem;color:var(--text-muted);margin-top:1px">${new Date(h.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
            <span style="background:${col}18;border:1px solid ${col}33;color:${col};font-size:0.62rem;font-weight:800;padding:2px 7px;border-radius:20px;white-space:nowrap">${sourceLabel[h.source] || h.source}</span>
          </div>`;
          })
          .join("")}
        ${items.length > 20 ? `<div style="font-size:0.75rem;color:var(--text-muted);text-align:center;padding:4px">+${items.length - 20} more</div>` : ""}
      </div>`,
      )
      .join("");
  }

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

  const _subjectColors = {
    Maths: "#4f8ef7",
    Physics: "#9b6dff",
    Biology: "#0fca8c",
    Chemistry: "#f97316",
    History: "#f0b429",
    Geography: "#06b6d4",
    Civics: "#ec4899",
    Economics: "#8b5cf6",
    English: "#10b981",
    Hindi: "#ef4444",
  };
  app.innerHTML = `
    <style>
      @keyframes _xpGrow{from{width:0}to{width:${info.pct}%}}
      ._stile{border-radius:16px;padding:16px;text-align:center;position:relative;overflow:hidden}
      ._hday{width:13px;height:13px;border-radius:3px;transition:transform .15s}
      ._hday:hover{transform:scale(1.4)}
    </style>
    <!-- WEAK TOPICS + PROGRESS shortcuts -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
      <button onclick="navigate('weaktopics')" style="padding:16px 10px;border-radius:16px;border:1.5px solid rgba(247,113,79,0.3);background:rgba(247,113,79,0.07);color:#f7714f;font-size:0.82rem;font-weight:800;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:6px;">
        <span style="font-size:1.5rem;">🎯</span>My Weak Topics
      </button>
      <button onclick="navigate('about')" style="padding:16px 10px;border-radius:16px;border:1.5px solid rgba(79,217,179,0.3);background:rgba(79,217,179,0.07);color:#4fd9b3;font-size:0.82rem;font-weight:800;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:6px;">
        <span style="font-size:1.5rem;">ℹ️</span>About App
      </button>
    </div>
    <!-- HERO PROFILE -->
    <div style="border-radius:20px;overflow:hidden;margin-bottom:14px;border:1.5px solid rgba(155,109,255,0.35);box-shadow:0 0 50px rgba(155,109,255,0.15)">
      <div style="background:linear-gradient(160deg,#0f0c29,#302b63,#24243e);padding:24px 20px;text-align:center;position:relative;overflow:hidden">
        <div style="position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:250px;height:250px;border-radius:50%;background:rgba(155,109,255,0.1);filter:blur(50px)"></div>
        <div style="font-size:3.5rem;margin-bottom:8px;filter:drop-shadow(0 0 20px rgba(155,109,255,0.6))">${avatarEmojis[lvlIdx]}</div>
        <div style="font-size:1.35rem;font-weight:900;color:#fff;margin-bottom:2px">${getName() || "Student"}</div>
        <div style="display:inline-block;background:rgba(155,109,255,0.2);border:1px solid rgba(155,109,255,0.5);color:#c4b5fd;font-size:0.7rem;font-weight:800;letter-spacing:0.1em;padding:3px 12px;border-radius:20px;margin-bottom:16px">${LEVELS[lvlIdx].name}</div>
        <div style="max-width:240px;margin:0 auto">
          <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:rgba(255,255,255,0.5);margin-bottom:6px"><span>${S.xp} XP</span><span>${info.next ? LEVELS[lvlIdx + 1].name : "MAX"}</span></div>
          <div style="height:8px;background:rgba(255,255,255,0.1);border-radius:100px;overflow:hidden">
            <div style="height:100%;border-radius:100px;background:linear-gradient(90deg,#9b6dff,#4f8ef7);animation:_xpGrow .9s ease forwards;width:${info.pct}%"></div>
          </div>
          <div style="font-size:0.7rem;color:rgba(255,255,255,0.4);margin-top:5px">${info.next ? `${LEVELS[lvlIdx + 1].min - S.xp} XP to next level` : "Maximum level!"}</div>
        </div>
      </div>
      <div style="background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.07);padding:12px 18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div><span style="font-size:0.85rem;font-weight:700">${perfDef.emoji} ${perfDef.name}</span> <span style="font-size:0.75rem;color:var(--text-muted)">(${perf.percentage}%) — ${perfDef.message}</span></div>
        <button class="btn btn-secondary btn-sm" onclick="updateMyLevel()" style="font-size:0.7rem">${t("update_score")}</button>
      </div>
    </div>
    <!-- STAT TILES -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      <div class="_stile" style="background:linear-gradient(135deg,rgba(79,142,247,0.18),rgba(79,142,247,0.06));border:1.5px solid rgba(79,142,247,0.35)">
        <div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:rgba(79,142,247,0.15);filter:blur(20px)"></div>
        <div style="font-size:2.2rem;font-weight:900;color:#4f8ef7;text-shadow:0 0 20px rgba(79,142,247,0.5)">${S.totalSolved}</div>
        <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;font-weight:600">${t("questions_solved")}</div>
      </div>
      <div class="_stile" style="background:linear-gradient(135deg,rgba(240,100,40,0.18),rgba(240,100,40,0.06));border:1.5px solid rgba(240,100,40,0.35)">
        <div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:rgba(240,100,40,0.15);filter:blur(20px)"></div>
        <div style="font-size:2.2rem;font-weight:900;color:#f97316;text-shadow:0 0 20px rgba(249,115,22,0.5)">${S.streak}🔥</div>
        <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;font-weight:600">${t("current_streak")}</div>
      </div>
      <div class="_stile" style="background:linear-gradient(135deg,rgba(155,109,255,0.18),rgba(155,109,255,0.06));border:1.5px solid rgba(155,109,255,0.35)">
        <div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:rgba(155,109,255,0.15);filter:blur(20px)"></div>
        <div style="font-size:2.2rem;font-weight:900;color:#9b6dff;text-shadow:0 0 20px rgba(155,109,255,0.5)">${S.bestStreak}</div>
        <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;font-weight:600">${t("best_streak")}</div>
      </div>
      <div class="_stile" style="background:linear-gradient(135deg,rgba(15,202,140,0.18),rgba(15,202,140,0.06));border:1.5px solid rgba(15,202,140,0.35)">
        <div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:rgba(15,202,140,0.15);filter:blur(20px)"></div>
        <div style="font-size:2.2rem;font-weight:900;color:#0fca8c;text-shadow:0 0 20px rgba(15,202,140,0.5)">${S.xp}</div>
        <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;font-weight:600">${t("total_xp")}</div>
      </div>
    </div>
    <!-- SUBJECT BARS -->
    <div class="glass" style="padding:18px;margin-bottom:14px">
      <div style="font-size:0.68rem;font-weight:900;letter-spacing:0.1em;color:var(--text-muted);text-transform:uppercase;margin-bottom:14px">📚 ${t("subject_breakdown")}</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${subjects
          .map((s) => {
            const cnt = S.subjectCounts[s] || 0;
            const w = Math.round((cnt / maxCount) * 100);
            const col = _subjectColors[s] || "#4f8ef7";
            return `<div style="display:flex;align-items:center;gap:10px">
            <div style="width:72px;font-size:0.73rem;color:var(--text-muted);text-align:right;flex-shrink:0">${s}</div>
            <div style="flex:1;height:10px;background:rgba(255,255,255,0.06);border-radius:100px;overflow:hidden">
              <div style="height:100%;width:${w}%;background:${col};border-radius:100px;box-shadow:0 0 8px ${col}66;transition:width 1s ease"></div>
            </div>
            <div style="width:22px;font-size:0.72rem;color:${cnt ? col : "var(--text-muted)"};font-weight:700;text-align:right">${cnt}</div>
          </div>`;
          })
          .join("")}
      </div>
    </div>
    <!-- HEATMAP -->
    <div class="glass" style="padding:18px;margin-bottom:14px">
      <div style="font-size:0.68rem;font-weight:900;letter-spacing:0.1em;color:var(--text-muted);text-transform:uppercase;margin-bottom:12px">🗓 ${t("activity_30")}</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">${days30
        .map((d) => {
          const cols = [
            "rgba(255,255,255,0.05)",
            "rgba(79,142,247,0.3)",
            "rgba(79,142,247,0.6)",
            "#4f8ef7",
          ];
          return `<div class="_hday" style="background:${cols[d.heat]};box-shadow:${d.heat === 3 ? "0 0 6px rgba(79,142,247,0.5)" : "none"}" title="${d.d}"></div>`;
        })
        .join("")}</div>
    </div>
    <!-- WEEKLY XP BARS -->
    <div class="glass" style="padding:18px;margin-bottom:14px">
      <div style="font-size:0.68rem;font-weight:900;letter-spacing:0.1em;color:var(--text-muted);text-transform:uppercase;margin-bottom:14px">📈 ${t("weekly_xp")}</div>
      <div class="weekly-chart">
        ${S.weeklyXP.map((xp, i) => `<div class="weekly-bar-wrap"><div class="weekly-bar-outer"><div class="weekly-bar" style="height:${Math.round((xp / maxW) * 100)}%;background:linear-gradient(to top,#9b6dff,#4f8ef7);box-shadow:${xp > 0 ? "0 0 8px rgba(79,142,247,0.4)" : "none"}"></div></div><div class="weekly-day">${days[i]}</div></div>`).join("")}
      </div>
    </div>
    <!-- WEEKLY ANALYSIS -->
    <div class="glass" style="padding:18px;margin-bottom:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div style="font-size:0.68rem;font-weight:900;letter-spacing:0.1em;color:var(--text-muted);text-transform:uppercase">📊 This Week's Analysis</div>
        <span style="font-size:0.68rem;color:var(--text-muted)">${new Date(weekKey).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} – Today</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
        ${[
          { v: wk.totalQuestions, l: "Questions", c: "#4f8ef7" },
          {
            v: `${wk.activeDays}/${wk.daysSoFar}`,
            l: "Active Days",
            c: "#0fca8c",
          },
          { v: wk.topSubject || "—", l: "Top Subject", c: "#9b6dff" },
          { v: wk.totalXP, l: "XP Earned", c: "#f0b429" },
        ]
          .map(
            (x) =>
              `<div style="background:${x.c}10;border:1px solid ${x.c}30;border-radius:12px;padding:12px;text-align:center"><div style="font-size:1.25rem;font-weight:900;color:${x.c}">${x.v}</div><div style="font-size:0.68rem;color:var(--text-muted);margin-top:3px">${x.l}</div></div>`,
          )
          .join("")}
      </div>
      <div class="weekly-chart mb-3">${wk.dailyXP.map((d) => `<div class="weekly-bar-wrap"><div class="weekly-bar-outer"><div class="weekly-bar" style="height:${Math.round((d.xp / wkMaxXP) * 100)}%;background:linear-gradient(to top,#f0b429,#f97316)"></div></div><div class="weekly-day">${d.label}</div></div>`).join("")}</div>
      ${
        wkSubjects.length > 0
          ? `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">${wkSubjects
              .map((s) => {
                const col = _subjectColors[s] || "#4f8ef7";
                return `<div style="display:flex;align-items:center;gap:10px"><div style="width:72px;font-size:0.72rem;color:var(--text-muted);text-align:right">${s}</div><div style="flex:1;height:8px;background:rgba(255,255,255,0.05);border-radius:100px;overflow:hidden"><div style="height:100%;width:${Math.round((wk.subjectTotals[s] / wkMaxCount) * 100)}%;background:${col};border-radius:100px"></div></div><div style="font-size:0.7rem;font-weight:700;color:${col};width:18px;text-align:right">${wk.subjectTotals[s]}</div></div>`;
              })
              .join("")}</div>`
          : `<div style="font-size:0.8rem;color:var(--text-muted);text-align:center;padding:10px 0">No activity yet this week.</div>`
      }
      <div id="aiInsightsArea" style="border-top:1px solid rgba(255,255,255,0.07);padding-top:14px;margin-top:4px">${cachedAnalysis ? renderAIInsightsHTML(cachedAnalysis) : renderAIInsightsPrompt()}</div>
    </div>
    <!-- BADGES -->
    <div class="glass" style="padding:18px;margin-bottom:14px">
      <div style="font-size:0.68rem;font-weight:900;letter-spacing:0.1em;color:var(--text-muted);text-transform:uppercase;margin-bottom:14px">🏅 Badges</div>
      <div class="badges-grid">${BADGE_DEFS.map((b) => `<div class="badge-item ${S.badges[b.id] ? "earned" : "locked"}" title="${b.desc}"><div class="badge-emoji">${b.emoji}</div><div class="badge-name">${b.name}</div></div>`).join("")}</div>
    </div>
  `;
  // Floating Ranks button
  const fab = document.createElement("button");
  fab.id = "stats-ranks-fab";
  fab.title = "View Leaderboard";
  fab.onclick = () => navigate("leaderboard");
  fab.style.cssText =
    "position:fixed;bottom:90px;right:16px;width:52px;height:52px;border-radius:50%;border:none;background:linear-gradient(135deg,#f0b429,#f97316);color:#fff;font-size:1.3rem;cursor:pointer;box-shadow:0 4px 20px rgba(240,180,41,0.55);z-index:900;display:flex;align-items:center;justify-content:center;transition:transform .2s";
  fab.innerHTML = "🏆";
  fab.onmouseover = () => {
    fab.style.transform = "scale(1.12)";
  };
  fab.onmouseout = () => {
    fab.style.transform = "";
  };
  document.getElementById("app").appendChild(fab);
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
    ${data.motivationLine ? `<div style="background:linear-gradient(135deg,rgba(79,142,247,0.12),rgba(155,109,255,0.08));border:1px solid rgba(155,109,255,0.25);border-radius:12px;padding:10px 14px;font-size:0.85rem;font-weight:700;color:#c4b5fd;margin-bottom:12px;font-style:italic">"${escapeHtml(data.motivationLine)}"</div>` : ""}
    ${data.summary ? `<div style="font-size:0.85rem;line-height:1.65;color:var(--text-secondary);margin-bottom:14px">${escapeHtml(data.summary)}</div>` : ""}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      ${data.focusSubject ? `<div style="background:rgba(240,180,41,0.1);border:1px solid rgba(240,180,41,0.25);border-radius:10px;padding:10px 12px"><div style="font-size:0.62rem;font-weight:900;color:#f0b429;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px">🎯 Focus Next Week</div><div style="font-size:0.85rem;font-weight:700;color:var(--text)">${escapeHtml(data.focusSubject)}</div></div>` : ""}
      ${data.classroomNote ? `<div style="background:rgba(15,202,140,0.08);border:1px solid rgba(15,202,140,0.2);border-radius:10px;padding:10px 12px"><div style="font-size:0.62rem;font-weight:900;color:#0fca8c;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px">🏫 Classroom</div><div style="font-size:0.82rem;color:var(--text-secondary)">${escapeHtml(data.classroomNote)}</div></div>` : ""}
    </div>
    ${
      strengths.length
        ? `<div style="margin-bottom:12px">
      <div style="font-size:0.68rem;font-weight:900;letter-spacing:0.08em;color:#0fca8c;text-transform:uppercase;margin-bottom:8px">✅ Strengths</div>
      ${strengths.map((s) => `<div style="display:flex;gap:8px;font-size:0.83rem;color:var(--text-secondary);padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.04)"><span style="color:#0fca8c;flex-shrink:0">✓</span>${escapeHtml(s)}</div>`).join("")}
    </div>`
        : ""
    }
    ${
      weakAreas.length
        ? `<div style="margin-bottom:12px">
      <div style="font-size:0.68rem;font-weight:900;letter-spacing:0.08em;color:#f0b429;text-transform:uppercase;margin-bottom:8px">⚠️ Needs Attention</div>
      ${weakAreas.map((s) => `<div style="display:flex;gap:8px;font-size:0.83rem;color:var(--text-secondary);padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.04)"><span style="color:#f0b429;flex-shrink:0">!</span>${escapeHtml(s)}</div>`).join("")}
    </div>`
        : ""
    }
    ${
      tips.length
        ? `<div style="margin-bottom:12px">
      <div style="font-size:0.68rem;font-weight:900;letter-spacing:0.08em;color:#4f8ef7;text-transform:uppercase;margin-bottom:8px">💡 Action Plan</div>
      ${tips.map((s, i) => `<div style="display:flex;gap:10px;font-size:0.83rem;color:var(--text-secondary);padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04)"><span style="background:rgba(79,142,247,0.2);color:#4f8ef7;font-size:0.68rem;font-weight:900;min-width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">${i + 1}</span>${escapeHtml(s)}</div>`).join("")}
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
    // Build classroom summary
    const crHistory = (S.classroomHistory || []).filter((h) => {
      const weekStart = getWeekStartKey();
      return h.date >= weekStart;
    });
    const crSummary =
      crHistory.length > 0
        ? {
            sessions: crHistory.length,
            totalCorrect: crHistory.reduce((a, h) => a + h.correct, 0),
            totalWrong: crHistory.reduce((a, h) => a + h.wrong, 0),
            totalTimedOut: crHistory.reduce((a, h) => a + h.timedOut, 0),
            avgRank:
              Math.round(
                (crHistory.reduce((a, h) => a + h.rank, 0) / crHistory.length) *
                  10,
              ) / 10,
            subjects: [...new Set(crHistory.map((h) => h.subject))],
          }
        : null;
    const data = await apiPost("/weekly-analysis", {
      subjectTotals: wk.subjectTotals,
      totalQuestions: wk.totalQuestions,
      totalXP: wk.totalXP,
      activeDays: wk.activeDays,
      daysSoFar: wk.daysSoFar,
      level: getPerf().level,
      classNum: S.classPreference,
      streak: S.streak,
      bestStreak: S.bestStreak,
      totalSolved: S.totalSolved,
      allTimeSubjects: S.subjectCounts || {},
      classroomSessions: crSummary,
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
// CLASSROOM — multiplayer quiz room
// ============================================================
let _crRoom = null;
let _crPollTimer = null;
let _crState = null;
let _crAnswered = {}; // qIndex -> chosen | "TIMEOUT"
let _crCurrentQ = 0;
let _crTimerInterval = null;
let _crTimeLeft = 30;
let _crTimedOut = {}; // qIndex -> true
let _crMyLevel = null; // player's own level string

// ── POWERUPS state ──
const _PWR_DEFAULT = { fiftyFifty: 0, extraTime: 0, skip: 0, shield: 0 };
let _pwrUps = { ..._PWR_DEFAULT };
let _pwrShieldActive = false;
function stopCrTimer() {
  if (_crTimerInterval) {
    clearInterval(_crTimerInterval);
    _crTimerInterval = null;
  }
}

function renderQuiz(state) {
  _crState = state;
  _crCurrentQ = 0;
  renderCrQuestion();
  stopClassroomPoll();
  _crPollTimer = setInterval(async () => {
    try {
      const data = await apiPost("/classroom/poll", {
        code: _crRoom.code,
        playerId: _crRoom.playerId,
      });
      if (data.status === "finished") {
        stopClassroomPoll();
        stopCrTimer();
        renderClassroomResult(data);
      }
    } catch (e) {}
  }, 2500);
}

window.goNextCrQ = () => {
  stopCrTimer();
  _crCurrentQ++;
  if (_crCurrentQ >= _crState.questions.length) {
    showCrAllDone();
  } else {
    renderCrQuestion();
  }
};

function renderCrQuestion() {
  const app = document.getElementById("app");
  const total = _crState.questions.length;
  const qi = _crCurrentQ;
  const q = _crState.questions[qi];
  const pct = Math.round((qi / total) * 100);
  _crTimeLeft = 30;

  app.innerHTML = `
    <style>
      @keyframes _crSlide{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
      @keyframes _crTimer{from{width:100%}to{width:0%}}
      ._cropt{border-radius:14px;padding:14px 18px;cursor:pointer;border:1.5px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);transition:all .2s;font-size:0.92rem;font-weight:600;text-align:left;width:100%;font-family:inherit;color:var(--text);margin-bottom:10px;display:block}
      ._cropt:hover:not(:disabled){border-color:rgba(79,142,247,0.5);background:rgba(79,142,247,0.1);transform:translateX(4px)}
      ._cropt.chosen{border-color:#4f8ef7;background:rgba(79,142,247,0.18)}
    </style>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <div style="font-size:0.75rem;font-weight:800;color:var(--text-muted)">Q${qi + 1} of ${total}</div>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="display:flex;align-items:center;gap:5px">
          <span style="font-size:1rem">⏱</span>
          <span id="cr-timer-num" style="font-size:1rem;font-weight:900;color:#f0b429;min-width:24px;text-align:right">30</span>
        </div>
        <div style="display:flex;gap:5px">
          ${_crState.players
            .slice(0, 4)
            .map(
              (p) =>
                `<div title="${p.name}" style="width:26px;height:26px;border-radius:50%;background:rgba(79,142,247,0.3);border:1.5px solid rgba(79,142,247,0.4);display:flex;align-items:center;justify-content:center;font-size:0.68rem;font-weight:900">${p.name[0].toUpperCase()}</div>`,
            )
            .join("")}
        </div>
      </div>
    </div>
    <div style="height:4px;background:rgba(255,255,255,0.07);border-radius:100px;margin-bottom:6px;overflow:hidden">
      <div id="cr-progbar" style="height:100%;width:${pct}%;background:linear-gradient(90deg,#4f8ef7,#9b6dff);border-radius:100px;transition:width .4s"></div>
    </div>
    <div style="height:3px;background:rgba(240,180,41,0.15);border-radius:100px;margin-bottom:20px;overflow:hidden">
      <div id="cr-timerbar" style="height:100%;width:100%;background:linear-gradient(90deg,#f0b429,#f97316);border-radius:100px;transition:width 1s linear"></div>
    </div>
    <div class="_crq-wrap" style="animation:_crSlide .3s ease">
      <div style="font-size:0.65rem;font-weight:900;letter-spacing:0.12em;color:#4f8ef7;text-transform:uppercase;margin-bottom:10px">Question ${qi + 1}</div>
      <div style="font-size:1.05rem;font-weight:700;line-height:1.65;color:#fff;margin-bottom:22px">${escapeHtml(q.q)}</div>
      <div id="cr-options">
        ${q.options.map((opt) => `<button class="_cropt" onclick="selectCrOption(this,'${opt.replace(/'/g, "\\'").replace(/"/g, "&quot;")}')">${escapeHtml(opt)}</button>`).join("")}
      </div>
      <div id="pwr-bar" style="display:flex;gap:6px;margin:14px 0;flex-wrap:wrap;align-items:center;">
        <button id="pwr-5050" onclick="window.usePwr('fiftyFifty')" class="_pwrbtn" style="flex:1;min-width:65px;padding:8px 6px;border-radius:12px;border:1.5px solid rgba(247,199,79,0.4);background:rgba(247,199,79,0.1);cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:3px;${_pwrUps.fiftyFifty === 0 ? "opacity:0.35;pointer-events:none;" : ""}">
          <span style="font-size:1.2rem;">⚡</span><span style="font-size:0.6rem;font-weight:800;color:#f7c74f;">Eliminator</span><span style="font-size:0.58rem;color:#5a6a8a;font-weight:600;">${_pwrUps.fiftyFifty}x left</span>
        </button>
        <button id="pwr-time" onclick="window.usePwr('extraTime')" class="_pwrbtn" style="flex:1;min-width:65px;padding:8px 6px;border-radius:12px;border:1.5px solid rgba(79,217,179,0.4);background:rgba(79,217,179,0.1);cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:3px;${_pwrUps.extraTime === 0 ? "opacity:0.35;pointer-events:none;" : ""}">
          <span style="font-size:1.2rem;">⏰</span><span style="font-size:0.6rem;font-weight:800;color:#4fd9b3;">Time Warp</span><span style="font-size:0.58rem;color:#5a6a8a;font-weight:600;">${_pwrUps.extraTime}x left</span>
        </button>
        <button id="pwr-skip" onclick="window.usePwr('skip')" class="_pwrbtn" style="flex:1;min-width:65px;padding:8px 6px;border-radius:12px;border:1.5px solid rgba(155,109,255,0.4);background:rgba(155,109,255,0.1);cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:3px;${_pwrUps.skip === 0 ? "opacity:0.35;pointer-events:none;" : ""}">
          <span style="font-size:1.2rem;">🔮</span><span style="font-size:0.6rem;font-weight:800;color:#9b6dff;">Oracle</span><span style="font-size:0.58rem;color:#5a6a8a;font-weight:600;">${_pwrUps.skip}x left</span>
        </button>
        <button id="pwr-shield" onclick="window.usePwr('shield')" class="_pwrbtn" style="flex:1;min-width:65px;padding:8px 6px;border-radius:12px;border:1.5px solid rgba(247,113,79,0.4);background:${_pwrShieldActive ? "rgba(247,113,79,0.25)" : "rgba(247,113,79,0.1)"};cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:3px;${_pwrUps.shield === 0 && !_pwrShieldActive ? "opacity:0.35;pointer-events:none;" : ""}">
          <span style="font-size:1.2rem;">🧭</span><span style="font-size:0.6rem;font-weight:800;color:#f7714f;">Compass</span><span style="font-size:0.58rem;color:#5a6a8a;font-weight:600;">${_pwrShieldActive ? "ACTIVE" : _pwrUps.shield + "x left"}</span>
        </button>
        <button onclick="window.openGemShop()" style="padding:8px 10px;border-radius:12px;border:1.5px solid rgba(150,120,255,0.5);background:rgba(150,120,255,0.12);cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:3px;">
          <span style="font-size:1.2rem;">💎</span><span style="font-size:0.6rem;font-weight:800;color:#c084fc;">Shop</span><span id="gem-shop-count" style="font-size:0.58rem;color:#5a6a8a;font-weight:600;">${S.gems || 0} gems</span>
        </button>
      </div>
      <div id="pwr-toast" style="height:28px;"></div>
      <div id="cr-feedback" style="margin-top:6px;">
        <button id="cr-next-btn" onclick="confirmCrAnswer(${qi})" class="btn btn-primary" style="width:100%;padding:13px;font-size:0.95rem;background:linear-gradient(135deg,#4f8ef7,#9b6dff);border:none;opacity:0.4;pointer-events:none">Select an answer to continue</button>
      </div>
    </div>
  `;

  // start countdown
  stopCrTimer();
  _crTimerInterval = setInterval(() => {
    _crTimeLeft--;
    const numEl = document.getElementById("cr-timer-num");
    const barEl = document.getElementById("cr-timerbar");
    if (numEl) {
      numEl.textContent = _crTimeLeft;
      numEl.style.color =
        _crTimeLeft <= 10
          ? "#f0564a"
          : _crTimeLeft <= 20
            ? "#f0b429"
            : "#f0b429";
    }
    if (barEl) barEl.style.width = (_crTimeLeft / 30) * 100 + "%";
    if (_crTimeLeft <= 0) {
      stopCrTimer();
      _crTimedOut[qi] = true;
      _crAnswered[qi] = "TIMEOUT";
      document.querySelectorAll("._cropt").forEach((b) => (b.disabled = true));
      const fb = document.getElementById("cr-feedback");
      if (fb)
        fb.innerHTML = `<div style="background:rgba(240,86,74,0.1);border:1.5px solid rgba(240,86,74,0.35);border-radius:12px;padding:12px 16px;color:#f0564a;font-weight:700;font-size:0.85rem;margin-bottom:10px">⏰ Time's up!</div>
        <button onclick="goNextCrQ()" class="btn btn-primary" style="width:100%;padding:13px;background:linear-gradient(135deg,#4f8ef7,#9b6dff);border:none">Next →</button>`;
      try {
        apiPost("/classroom/answer", {
          code: _crRoom.code,
          playerId: _crRoom.playerId,
          qIndex: qi,
          chosen: "TIMEOUT",
        });
      } catch (e) {}
    }
  }, 1000);
}

function showCrAllDone() {
  stopCrTimer();
  const app = document.getElementById("app");
  app.innerHTML = `
    <div style="text-align:center;padding:40px 20px">
      <div style="font-size:3rem;margin-bottom:12px">✅</div>
      <div style="font-size:1.4rem;font-weight:900;color:#0fca8c;margin-bottom:8px">All Done!</div>
      <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:24px">Waiting for others... or see your results now</div>
      <button onclick="forceFinishRoom()" class="btn btn-primary" style="background:linear-gradient(135deg,#f0b429,#f97316);border:none;padding:12px 32px;font-size:1rem;font-weight:800">See Results →</button>
    </div>
  `;
}

window.forceFinishRoom = async () => {
  stopClassroomPoll();
  stopCrTimer();
  try {
    const data = await apiPost("/classroom/poll", {
      code: _crRoom.code,
      playerId: _crRoom.playerId,
    });
    data.status = "finished";
    renderClassroomResult(data);
  } catch (e) {
    alert("Error: " + e.message);
  }
};

let _crSelectedOption = null; // currently highlighted option text

window.selectCrOption = (btn, opt) => {
  // unhighlight all, highlight clicked
  document
    .querySelectorAll("._cropt")
    .forEach((b) => b.classList.remove("chosen"));
  btn.classList.add("chosen");
  _crSelectedOption = opt;
  // enable next button
  const nextBtn = document.getElementById("cr-next-btn");
  if (nextBtn) {
    nextBtn.style.opacity = "1";
    nextBtn.style.pointerEvents = "auto";
    nextBtn.textContent = "Confirm & Next →";
  }
};

window.confirmCrAnswer = (qIndex) => {
  if (!_crSelectedOption) return;
  submitCrAnswer(qIndex, _crSelectedOption);
};

window.submitCrAnswer = async (qIndex, chosen) => {
  if (_crAnswered[qIndex] !== undefined) return;
  stopCrTimer();

  // ── Shield powerup: if wrong answer and shield active, block penalty ──
  // (We don't know correct answer client-side, so shield shows visual feedback after server reply)
  const hadShield = _pwrShieldActive;

  _crAnswered[qIndex] = chosen;
  _crSelectedOption = null;
  document.querySelectorAll("._cropt").forEach((b) => {
    b.disabled = true;
  });
  const total = _crState.questions.length;
  const answered = Object.keys(_crAnswered).length;
  const prog = document.getElementById("cr-progbar");
  if (prog) prog.style.width = (answered / total) * 100 + "%";
  try {
    await apiPost("/classroom/answer", {
      code: _crRoom.code,
      playerId: _crRoom.playerId,
      qIndex,
      chosen,
    });
  } catch (e) {}
  const fb = document.getElementById("cr-feedback");
  if (!fb) return;
  // Deactivate shield after use on this answer
  if (hadShield) {
    _pwrShieldActive = false;
    showPwrToast("🧭 Compass absorbed any penalty!", "#f7714f");
  }
  if (answered < total) {
    fb.innerHTML = `<button onclick="goNextCrQ()" class="btn btn-primary" style="width:100%;padding:13px;font-size:0.95rem;background:linear-gradient(135deg,#4f8ef7,#9b6dff);border:none">Next Question →</button>`;
  } else {
    showCrAllDone();
  }
};

function renderClassroomResult(state) {
  stopCrTimer();
  const app = document.getElementById("app");
  const qs = _crState?.questions || [];
  const total = qs.length;
  let correct = 0,
    wrong = 0,
    timedOut = 0;
  const qResults = qs.map((q, i) => {
    const chosen = _crAnswered[i];
    if (!chosen || chosen === "TIMEOUT") {
      timedOut++;
      return { q, chosen: null, status: "timeout" };
    }
    const isCorrect = chosen === q.answer;
    if (isCorrect) correct++;
    else wrong++;
    return { q, chosen, status: isCorrect ? "correct" : "wrong" };
  });
  // leaderboard
  const myRank =
    state.players.findIndex((p) => p.id === _crRoom.playerId) + 1 || 1;
  const baseXP = COUNT_CONFIG[qs.length] ? COUNT_CONFIG[qs.length].xp : 20;
  const xpAward =
    myRank === 1
      ? baseXP
      : myRank === 2
        ? Math.round(baseXP * 0.7)
        : myRank === 3
          ? Math.round(baseXP * 0.5)
          : Math.round(baseXP * 0.3);
  addXP(xpAward, "Classroom Quiz");
  // save to stats for AI insights
  S.classroomHistory = S.classroomHistory || [];
  S.classroomHistory.push({
    date: new Date().toISOString().split("T")[0],
    subject: state.subject || "",
    chapter: state.chapter || "",
    total,
    correct,
    wrong,
    timedOut,
    rank: myRank,
    players: state.players.length,
  });
  if (S.classroomHistory.length > 20)
    S.classroomHistory = S.classroomHistory.slice(-20);
  saveState();

  const rankEmoji =
    myRank === 1 ? "🥇" : myRank === 2 ? "🥈" : myRank === 3 ? "🥉" : "🎯";
  app.innerHTML = `
    <style>
      @keyframes _crIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      ._crri{animation:_crIn .4s ease both}
    </style>
    <!-- Score hero -->
    <div class="_crri" style="background:linear-gradient(135deg,#1a2a6c,#2d1b69);border:1.5px solid rgba(155,109,255,0.3);border-radius:20px;padding:24px;text-align:center;margin-bottom:14px;position:relative;overflow:hidden">
      <div style="position:absolute;top:-40px;left:50%;transform:translateX(-50%);width:200px;height:200px;border-radius:50%;background:rgba(155,109,255,0.1);filter:blur(40px)"></div>
      <div style="font-size:3rem;margin-bottom:6px">${rankEmoji}</div>
      <div style="font-size:1.5rem;font-weight:900;color:#fff;margin-bottom:4px">You ranked #${myRank}</div>
      <div style="font-size:0.82rem;color:rgba(255,255,255,0.5);margin-bottom:16px">+${xpAward} XP earned</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        <div style="background:rgba(15,202,140,0.15);border:1px solid rgba(15,202,140,0.3);border-radius:12px;padding:12px">
          <div style="font-size:1.6rem;font-weight:900;color:#0fca8c">${correct}</div>
          <div style="font-size:0.68rem;color:rgba(255,255,255,0.5);margin-top:2px">Correct</div>
        </div>
        <div style="background:rgba(240,86,74,0.12);border:1px solid rgba(240,86,74,0.3);border-radius:12px;padding:12px">
          <div style="font-size:1.6rem;font-weight:900;color:#f0564a">${wrong}</div>
          <div style="font-size:0.68rem;color:rgba(255,255,255,0.5);margin-top:2px">Wrong</div>
        </div>
        <div style="background:rgba(240,180,41,0.1);border:1px solid rgba(240,180,41,0.3);border-radius:12px;padding:12px">
          <div style="font-size:1.6rem;font-weight:900;color:#f0b429">${timedOut}</div>
          <div style="font-size:0.68rem;color:rgba(255,255,255,0.5);margin-top:2px">Timed Out</div>
        </div>
      </div>
    </div>
    <!-- Leaderboard -->
    <div class="_crri" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;margin-bottom:14px;animation-delay:.1s">
      <div style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:0.68rem;font-weight:900;letter-spacing:0.1em;color:var(--text-muted);text-transform:uppercase">🏆 Leaderboard</div>
      ${state.players
        .map((p, i) => {
          const isMe = p.id === _crRoom.playerId;
          const col =
            ["#f0b429", "#9b6dff", "#0fca8c"][i] || "rgba(255,255,255,0.4)";
          return `<div style="display:flex;align-items:center;gap:12px;padding:11px 16px;${isMe ? "background:rgba(79,142,247,0.08);" : ""}border-bottom:1px solid rgba(255,255,255,0.04)">
          <div style="font-size:1.1rem;width:24px;text-align:center">${["🥇", "🥈", "🥉"][i] || `${i + 1}.`}</div>
          <div style="flex:1;font-weight:${isMe ? 900 : 600};color:${isMe ? "#fff" : "var(--text-secondary)"}">${p.name}${isMe ? " (you)" : ""}</div>
          <div style="font-weight:900;color:${col}">${p.score} pts</div>
        </div>`;
        })
        .join("")}
    </div>
    <!-- Question-by-question report -->
    <div class="_crri" style="animation-delay:.2s">
      <div style="font-size:0.68rem;font-weight:900;letter-spacing:0.1em;color:var(--text-muted);text-transform:uppercase;margin-bottom:12px">📋 Your Answer Report</div>
      ${qResults
        .map((r, i) => {
          const bg =
            r.status === "correct"
              ? "rgba(15,202,140,0.07)"
              : r.status === "wrong"
                ? "rgba(240,86,74,0.07)"
                : "rgba(240,180,41,0.07)";
          const border =
            r.status === "correct"
              ? "rgba(15,202,140,0.3)"
              : r.status === "wrong"
                ? "rgba(240,86,74,0.3)"
                : "rgba(240,180,41,0.3)";
          const icon =
            r.status === "correct" ? "✅" : r.status === "wrong" ? "❌" : "⏰";
          const showAnswer = r.status !== "correct";
          return `<div style="background:${bg};border:1.5px solid ${border};border-radius:14px;padding:14px 16px;margin-bottom:10px">
          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:${showAnswer ? 8 : 0}px">
            <span style="font-size:1rem;flex-shrink:0;margin-top:1px">${icon}</span>
            <div style="flex:1">
              <div style="font-size:0.72rem;font-weight:800;color:var(--text-muted);margin-bottom:4px">Q${i + 1}</div>
              <div style="font-size:0.88rem;font-weight:600;line-height:1.5;color:var(--text)">${escapeHtml(r.q.q)}</div>
            </div>
          </div>
          ${
            showAnswer
              ? `
            <div style="padding-left:30px">
              ${r.chosen && r.chosen !== "TIMEOUT" ? `<div style="font-size:0.78rem;color:#f0564a;margin-bottom:4px">Your answer: <strong>${escapeHtml(r.chosen)}</strong></div>` : `<div style="font-size:0.78rem;color:#f0b429;margin-bottom:4px">You didn't answer in time</div>`}
              <div style="font-size:0.78rem;color:#0fca8c;font-weight:700">✓ Correct: <strong>${escapeHtml(r.q.answer || "—")}</strong></div>
            </div>`
              : ""
          }
        </div>`;
        })
        .join("")}
    </div>
    <div style="display:flex;gap:10px;margin-top:16px">
      <button onclick="_crAnswered={};_crTimedOut={};_crCurrentQ=0;renderClassroomLobby()" class="btn btn-primary" style="flex:1;padding:13px">Play Again</button>
      <button onclick="stopClassroomPoll();renderGames()" class="btn btn-secondary" style="flex:1;padding:13px">Back</button>
    </div>
  `;
}

function stopClassroomPoll() {
  if (_crPollTimer) {
    clearInterval(_crPollTimer);
    _crPollTimer = null;
  }
}

async function apiGet(path) {
  const r = await fetch("/api" + path);
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}

function renderClassroomLobby() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div style="margin-bottom:20px">
      <button onclick="renderGames()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;padding:0;display:flex;align-items:center;gap:6px;font-family:inherit">‹ Back to Games</button>
    </div>
    <div style="text-align:center;margin-bottom:28px">
      <div style="font-size:2.5rem;margin-bottom:8px;filter:drop-shadow(0 0 20px rgba(240,180,41,0.5))">🏫</div>
      <div style="font-size:1.5rem;font-weight:900;background:linear-gradient(135deg,#f0b429,#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">Classroom</div>
      <div style="font-size:0.82rem;color:var(--text-muted);margin-top:4px">Quiz your friends live — highest score wins XP</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <button onclick="showCreateRoom()" style="background:linear-gradient(135deg,rgba(240,180,41,0.2),rgba(240,180,41,0.08));border:1.5px solid rgba(240,180,41,0.4);border-radius:18px;padding:22px;cursor:pointer;text-align:left;font-family:inherit;transition:all .2s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
        <div style="font-size:1.5rem;margin-bottom:8px">🚀</div>
        <div style="font-size:1rem;font-weight:900;color:#f0b429;margin-bottom:4px">Create a Room</div>
        <div style="font-size:0.8rem;color:var(--text-muted)">Generate a room code and invite friends</div>
      </button>
      <button onclick="showJoinRoom()" style="background:linear-gradient(135deg,rgba(79,142,247,0.2),rgba(79,142,247,0.06));border:1.5px solid rgba(79,142,247,0.4);border-radius:18px;padding:22px;cursor:pointer;text-align:left;font-family:inherit;transition:all .2s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
        <div style="font-size:1.5rem;margin-bottom:8px">🔗</div>
        <div style="font-size:1rem;font-weight:900;color:#4f8ef7;margin-bottom:4px">Join a Room</div>
        <div style="font-size:0.8rem;color:var(--text-muted)">Enter a room code from your friend</div>
      </button>
    </div>
  `;
}

function showCreateRoom() {
  const app = document.getElementById("app");
  const subjects = [
    "Maths",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Geography",
    "Civics",
    "Economics",
    "English",
    "Hindi",
  ];
  const cls = S.classPreference || "10";
  const subj = S.subjectPreference || "Maths";
  const chapters = getChapters(cls, subj);
  app.innerHTML = `
    <div style="margin-bottom:20px">
      <button onclick="renderClassroomLobby()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;padding:0;font-family:inherit">‹ Back</button>
    </div>
    <div style="font-size:1.2rem;font-weight:900;margin-bottom:20px">🚀 Create Room</div>
    <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:20px">
      <div>
        <label class="form-label">Your Name</label>
        <input id="cr-name" class="form-input" placeholder="Enter your name" value="${getName() || ""}" style="margin-top:4px">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <label class="form-label">Class</label>
          <select id="cr-class" class="form-select" style="margin-top:4px" onchange="updateCrChapters()">
            ${["6", "7", "8", "9", "10"].map((c) => `<option value="${c}" ${cls === c ? "selected" : ""}>${c}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="form-label">Subject</label>
          <select id="cr-subject" class="form-select" style="margin-top:4px" onchange="updateCrChapters()">
            ${subjects.map((s) => `<option value="${s}" ${subj === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
      </div>
      <div>
        <label class="form-label">Chapter</label>
        <select id="cr-chapter" class="form-select" style="margin-top:4px">
          ${chapters.map((c) => `<option value="${c}">${c}</option>`).join("")}
        </select>
      </div>
    </div>
    <button onclick="doCreateRoom()" class="btn btn-primary" style="width:100%;background:linear-gradient(135deg,#f0b429,#f97316);border:none;font-size:1rem;padding:14px;box-shadow:0 4px 20px rgba(240,180,41,0.4)">Create Room →</button>
    <div id="cr-err" style="color:var(--red);font-size:0.82rem;margin-top:10px;text-align:center"></div>
  `;
  window.updateCrChapters = () => {
    const sel = document.getElementById("cr-chapter");
    const chs = getChapters(
      document.getElementById("cr-class").value,
      document.getElementById("cr-subject").value,
    );
    sel.innerHTML = chs
      .map((c) => `<option value="${c}">${c}</option>`)
      .join("");
  };
}

function showJoinRoom() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div style="margin-bottom:20px">
      <button onclick="renderClassroomLobby()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;padding:0;font-family:inherit">‹ Back</button>
    </div>
    <div style="font-size:1.2rem;font-weight:900;margin-bottom:20px">🔗 Join Room</div>
    <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:20px">
      <div>
        <label class="form-label">Your Name</label>
        <input id="jr-name" class="form-input" placeholder="Enter your name" value="${getName() || ""}" style="margin-top:4px">
      </div>
      <div>
        <label class="form-label">Room Code</label>
        <input id="jr-code" class="form-input" placeholder="e.g. AB3XY" maxlength="5" style="margin-top:4px;text-transform:uppercase;font-size:1.3rem;font-weight:900;letter-spacing:0.15em;text-align:center">
      </div>
    </div>
    <button onclick="doJoinRoom()" class="btn btn-primary" style="width:100%;font-size:1rem;padding:14px">Join Room →</button>
    <div id="jr-err" style="color:var(--red);font-size:0.82rem;margin-top:10px;text-align:center"></div>
  `;
}

window.doCreateRoom = async () => {
  const name = document.getElementById("cr-name")?.value?.trim();
  const classNum = document.getElementById("cr-class")?.value;
  const subject = document.getElementById("cr-subject")?.value;
  const chapter = document.getElementById("cr-chapter")?.value;
  const err = document.getElementById("cr-err");
  if (!name) {
    err.textContent = "Enter your name";
    return;
  }
  if (!chapter) {
    err.textContent = "Select a chapter";
    return;
  }
  try {
    const data = await apiPost("/classroom/create", {
      hostName: name,
      subject,
      chapter,
      classNum,
    });
    _crRoom = { code: data.code, playerId: data.playerId, isHost: true };
    _crAnswered = {};
    _crCurrentQ = 0;
    _pwrUps = { ..._PWR_DEFAULT };
    _pwrShieldActive = false;
    renderWaitingRoom();
  } catch (e) {
    err.textContent = "Error: " + e.message;
  }
};

window.doJoinRoom = async () => {
  const name = document.getElementById("jr-name")?.value?.trim();
  const code = document.getElementById("jr-code")?.value?.trim().toUpperCase();
  const err = document.getElementById("jr-err");
  if (!name) {
    err.textContent = "Enter your name";
    return;
  }
  if (!code || code.length < 4) {
    err.textContent = "Enter a valid room code";
    return;
  }
  try {
    const data = await apiPost("/classroom/join", { playerName: name, code });
    _crRoom = { code: data.code, playerId: data.playerId, isHost: false };
    _crAnswered = {};
    _crCurrentQ = 0;
    _pwrUps = { ..._PWR_DEFAULT };
    _pwrShieldActive = false;
    renderWaitingRoom();
  } catch (e) {
    err.textContent = e.message.includes("404") ? "Room not found" : e.message;
  }
};

function renderWaitingRoom() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:0.72rem;font-weight:800;letter-spacing:0.12em;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px">Room Code</div>
      <div style="font-size:3rem;font-weight:900;letter-spacing:0.2em;background:linear-gradient(135deg,#f0b429,#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 20px rgba(240,180,41,0.4))">${_crRoom.code}</div>
      <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px">Share this code with friends</div>
    </div>
    <div id="wr-players" style="margin-bottom:20px"></div>
    ${_crRoom.isHost ? `<button id="wr-start-btn" onclick="doStartRoom()" class="btn btn-primary" style="width:100%;padding:14px;font-size:1rem;background:linear-gradient(135deg,#f0b429,#f97316);border:none;box-shadow:0 4px 20px rgba(240,180,41,0.4)">Start Quiz (Solo) →</button>` : `<div style="text-align:center;color:var(--text-muted);font-size:0.85rem">Waiting for host to start...</div>`}
    <button onclick="stopClassroomPoll();renderGames();" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.8rem;margin-top:14px;display:block;margin-left:auto;margin-right:auto;font-family:inherit">Leave Room</button>
  `;
  stopClassroomPoll();
  _crPollTimer = setInterval(pollWaiting, 2000);
  pollWaiting();
}

async function pollWaiting() {
  try {
    const data = await apiPost("/classroom/poll", {
      code: _crRoom.code,
      playerId: _crRoom.playerId,
    });
    if (data.status === "active") {
      stopClassroomPoll();
      renderQuiz(data);
      return;
    }
    const pl = document.getElementById("wr-players");
    if (!pl) {
      stopClassroomPoll();
      return;
    }
    pl.innerHTML = `
      <div style="font-size:0.7rem;font-weight:800;letter-spacing:0.08em;color:var(--text-muted);text-transform:uppercase;margin-bottom:10px">Players (${data.players.length})</div>
      ${data.players
        .map(
          (
            p,
            i,
          ) => `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:8px">
        <div style="width:28px;height:28px;border-radius:50%;background:${["#4f8ef7", "#9b6dff", "#0fca8c", "#f0b429", "#f97316", "#ec4899"][i % 6]};display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:900;color:#fff">${p.name[0].toUpperCase()}</div>
        <span style="font-weight:700;flex:1">${p.name}</span>
        ${i === 0 ? `<span style="font-size:0.65rem;background:rgba(240,180,41,0.2);border:1px solid rgba(240,180,41,0.4);color:#f0b429;padding:2px 8px;border-radius:20px;font-weight:800">HOST</span>` : ""}
      </div>`,
        )
        .join("")}
    `;
    const btn = document.getElementById("wr-start-btn");
    if (btn) {
      if (data.players.length >= 1) {
        btn.disabled = false;
        btn.textContent =
          data.players.length === 1
            ? `Start Quiz (Solo) →`
            : `Start Quiz (${data.players.length} players) →`;
      }
    }
  } catch (e) {
    /* ignore poll errors */
  }
}

window.doStartRoom = async () => {
  // Show difficulty/count picker first
  renderDifficultyPicker({
    title: "🏫 Classroom Quiz",
    color: "#f0b429",
    backFn: "renderWaitingRoom",
    onConfirm: async () => {
      const btn = document.createElement("div");
      const app = document.getElementById("app");
      app.innerHTML = `<div style="text-align:center;padding:60px 20px">${typingLoader()}<div style="font-size:0.85rem;color:var(--text-muted);margin-top:12px">Generating ${_gameConfig.count} ${_gameConfig.difficulty} questions...</div></div>`;
      try {
        const myLevel = getPerf()?.level || "developing";
        const startData = await apiPost("/classroom/start", {
          code: _crRoom.code,
          playerId: _crRoom.playerId,
          playerLevels: { [_crRoom.playerId]: myLevel },
          difficulty: _gameConfig.difficulty || "medium",
          count: _gameConfig.count || 10,
        });
        // Host enters the game right away
        if (startData && startData.status === "active") {
          renderQuiz(startData);
        } else {
          const pollData = await apiPost("/classroom/poll", {
            code: _crRoom.code,
            playerId: _crRoom.playerId,
          });
          if (pollData && pollData.status === "active") {
            renderQuiz(pollData);
          } else {
            renderWaitingRoom();
          }
        }
      } catch (e) {
        renderWaitingRoom();
        alert("Error: " + e.message);
      }
    },
  });
};

window.renderClassroomLobby = renderClassroomLobby;
window.showCreateRoom = showCreateRoom;
window.showJoinRoom = showJoinRoom;

// ============================================================
// ASK A DOUBT — merges Snap & Solve + Voice Doubt
// ============================================================
function renderAskDoubt() {
  const app = document.getElementById("app");
  const lang = getLanguage();
  const isHi = lang === "hi";
  app.innerHTML = `
    <style>
      ._adb-tab{padding:10px 0;flex:1;border:none;border-bottom:2px solid transparent;background:none;color:var(--text-muted);font-weight:700;font-size:0.9rem;font-family:inherit;cursor:pointer;transition:all .18s}
      ._adb-tab.active{color:#4f8ef7;border-bottom-color:#4f8ef7}
    </style>
    <h1 class="gradient-heading section-heading" style="background:linear-gradient(135deg,#4f8ef7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">
      ${isHi ? "🤔 संदेह पूछें" : "🤔 Ask a Doubt"}
    </h1>
    <div style="display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid rgba(255,255,255,0.08)">
      <button class="_adb-tab active" id="adb-tab-snap" onclick="switchDoubtTab('snap')">${isHi ? "📸 फोटो / टेक्स्ट" : "📸 Snap & Type"}</button>
      <button class="_adb-tab" id="adb-tab-voice" onclick="switchDoubtTab('voice')">${isHi ? "🎙️ आवाज़" : "🎙️ Voice"}</button>
    </div>
    <div id="adb-content"></div>
  `;
  window.switchDoubtTab = (tab) => {
    ["snap", "voice"].forEach((id) => {
      const btn = document.getElementById("adb-tab-" + id);
      if (btn) {
        btn.classList.toggle("active", tab === id);
      }
    });
    if (tab === "snap") renderSnapTab();
    else renderVoiceTab();
  };
  window.renderSnapTab = () => {
    const el = document.getElementById("adb-content");
    if (!el) return;
    const classNum = S.classPreference || "10";
    const subj = S.subjectPreference || "Science";
    const chaps = CHAPTERS[classNum]?.[subj] || [];
    el.innerHTML = `
      <div style="background:rgba(79,142,247,0.06);border:1.5px solid rgba(79,142,247,0.18);border-radius:18px;padding:20px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
          <div>
            <div style="font-size:0.7rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px">${isHi ? "विषय" : "Subject"}</div>
            <select id="snap-subj" onchange="window._snapSubjChange()" style="width:100%;padding:8px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:rgba(30,30,50,0.9);color:var(--text);font-size:0.85rem;font-family:inherit">
              ${["Maths", "Science", "Social Science", "English", "Hindi"].map((s) => `<option value="${s}" ${s === subj ? "selected" : ""}>${s}</option>`).join("")}
            </select>
          </div>
          <div>
            <div style="font-size:0.7rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px">${isHi ? "अध्याय" : "Chapter"}</div>
            <select id="snap-chap" style="width:100%;padding:8px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:rgba(30,30,50,0.9);color:var(--text);font-size:0.85rem;font-family:inherit">
              <option value="">${isHi ? "— अध्याय चुनें —" : "— Select Chapter —"}</option>
              ${chaps.map((c) => `<option value="${c}">${c}</option>`).join("")}
            </select>
          </div>
        </div>
        <textarea id="snap-q" placeholder="${isHi ? "यहाँ अपना प्रश्न लिखें..." : "Type your CBSE question here..."}" style="width:100%;min-height:100px;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:var(--text);font-size:0.9rem;font-family:inherit;resize:vertical;box-sizing:border-box;margin-bottom:10px"></textarea>
        <label style="display:block;margin-bottom:12px">
          <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px">📷 ${isHi ? "फोटो अपलोड करें (वैकल्पिक)" : "Upload photo (optional)"}</div>
          <input type="file" id="snap-img" accept="image/*" onchange="window._snapImgChange(this)" style="font-size:0.8rem;color:var(--text-muted)">
        </label>
        <div id="snap-img-preview" style="margin-bottom:10px"></div>
        <button onclick="window._submitSnapDoubt()" class="btn btn-primary" style="width:100%;padding:13px;font-weight:900;background:linear-gradient(135deg,#4f8ef7,#9b6dff);border:none">
          ${isHi ? "हल करें →" : "Solve →"}
        </button>
        <div id="snap-answer" style="display:none;margin-top:18px"></div>
      </div>
    `;
    window._snapSubjChange = () => {
      const s = document.getElementById("snap-subj")?.value;
      const chapSel = document.getElementById("snap-chap");
      if (!chapSel || !s) return;
      const chs = CHAPTERS[classNum]?.[s] || [];
      chapSel.innerHTML = `<option value="">${isHi ? "— अध्याय चुनें —" : "— Select Chapter —"}</option>${chs.map((c) => `<option value="${c}">${c}</option>`).join("")}`;
    };
    window._snapImgChange = (input) => {
      const prev = document.getElementById("snap-img-preview");
      if (!prev) return;
      const file = input.files?.[0];
      if (!file) {
        prev.innerHTML = "";
        window._imgData = null;
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        window._imgData = e.target.result;
        prev.innerHTML = `<img src="${e.target.result}" style="max-width:100%;max-height:180px;border-radius:10px;border:1px solid rgba(255,255,255,0.1)">`;
      };
      reader.readAsDataURL(file);
    };
    window._submitSnapDoubt = async () => {
      const q = document.getElementById("snap-q")?.value?.trim();
      const subject = document.getElementById("snap-subj")?.value || subj;
      const chapter = document.getElementById("snap-chap")?.value || "";
      if (!q && !window._imgData) {
        alert(
          isHi
            ? "प्रश्न लिखें या फोटो अपलोड करें"
            : "Enter a question or upload a photo",
        );
        return;
      }
      const ansEl = document.getElementById("snap-answer");
      if (ansEl) {
        ansEl.style.display = "block";
        ansEl.innerHTML = `<div style="text-align:center;padding:20px">${typingLoader()}</div>`;
      }
      try {
        const body = {
          question: q || "Solve this question from the image",
          subject,
          classNum,
          chapter,
          level: getPerf().level,
          lang: getLanguage(),
        };
        if (window._imgData) body.imageData = window._imgData;
        const data = await apiPost("/solve", body);
        const md =
          (data.solution || "") +
          (data.steps?.length
            ? "\n\n**Steps:**\n" +
              data.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")
            : "") +
          (data.examTip ? `\n\n💡 **Exam Tip:** ${data.examTip}` : "");
        if (ansEl)
          ansEl.innerHTML = `<div class="glass" style="padding:16px;border-radius:14px">${markdownToHtml(md)}</div>`;
      } catch (e) {
        if (ansEl)
          ansEl.innerHTML = `<div style="color:var(--red);padding:12px">Error: ${e.message}</div>`;
      }
    };
  };
  window.renderVoiceTab = () => {
    const el = document.getElementById("adb-content");
    if (!el) return;
    // Inline the voice doubt UI inside this tab
    const classNum = S.classPreference || "10";
    const subj = S.subjectPreference || "Science";
    el.innerHTML = `
      <div style="background:rgba(236,72,153,0.06);border:1.5px solid rgba(236,72,153,0.18);border-radius:18px;padding:20px;text-align:center">
        <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:20px">${isHi ? "माइक दबाएं और बोलें, या नीचे लिखें" : "Press mic to speak, or type below"}</div>
        <button id="vd-mic-btn" onclick="window.toggleVoiceRecording()" style="width:80px;height:80px;border-radius:50%;border:none;background:linear-gradient(135deg,#ec4899,#9b6dff);cursor:pointer;font-size:2rem;box-shadow:0 4px 24px rgba(236,72,153,0.5);transition:all .2s;display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px">🎙️</button>
        <div id="vd-status" style="font-size:0.78rem;color:var(--text-muted);margin-bottom:16px">${isHi ? "बोलने के लिए टैप करें" : "Tap to speak"}</div>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <input id="vd-text-input" type="text" placeholder="${isHi ? "या यहाँ लिखें..." : "Or type your doubt here..."}" style="flex:1;padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);color:var(--text);font-size:0.88rem;font-family:inherit">
          <button onclick="window.submitVoiceDoubt(document.getElementById('vd-text-input').value)" class="btn btn-primary" style="background:linear-gradient(135deg,#ec4899,#9b6dff);border:none;padding:10px 16px;flex-shrink:0">${isHi ? "पूछें →" : "Ask →"}</button>
        </div>
        <div id="vd-answer" style="display:none;text-align:left;margin-top:14px"></div>
      </div>
    `;
  };
  renderSnapTab();
}
window.renderAskDoubt = renderAskDoubt;

// ============================================================
// VOICE DOUBT SOLVER
// ============================================================
function renderVoiceDoubt() {
  const app = document.getElementById("app");
  const subjects = [
    "Maths",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Geography",
    "Civics",
    "Economics",
    "English",
    "Hindi",
  ];
  const subj = S.subjectPreference || "Maths";
  const cls = S.classPreference || "10";
  const chapters = getChapters(cls, subj);
  app.innerHTML = `
    <style>
      @keyframes _vdPulse{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(236,72,153,0.4)}50%{transform:scale(1.06);box-shadow:0 0 0 16px rgba(236,72,153,0)}}
      @keyframes _vdWave{0%,100%{height:6px}50%{height:22px}}
      ._vdbar{width:4px;border-radius:4px;background:#ec4899;display:inline-block;margin:0 2px;animation:_vdWave .8s ease-in-out infinite}
    </style>
    <button onclick="navigate('home')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;padding:0;font-family:inherit;margin-bottom:18px;display:block">‹ Back</button>
    <div style="font-size:1.4rem;font-weight:900;background:linear-gradient(135deg,#ec4899,#9b6dff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px">🎙️ Voice Doubt Solver</div>
    <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:22px">Speak your question — AI explains it, then reads the answer back</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
      <div><label class="form-label">Class</label>
        <select id="vd-class" class="form-select" style="margin-top:4px" onchange="updateVdChapters()">
          ${["6", "7", "8", "9", "10"].map((c) => `<option value="${c}" ${cls === c ? "selected" : ""}>${c}</option>`).join("")}
        </select></div>
      <div><label class="form-label">Subject</label>
        <select id="vd-subject" class="form-select" style="margin-top:4px" onchange="updateVdChapters()">
          ${subjects.map((s) => `<option value="${s}" ${subj === s ? "selected" : ""}>${s}</option>`).join("")}
        </select></div>
    </div>
    <div style="margin-bottom:20px"><label class="form-label">Chapter (optional)</label>
      <select id="vd-chapter" class="form-select" style="margin-top:4px">
        <option value="">Any chapter</option>
        ${chapters.map((c) => `<option value="${c}">${c}</option>`).join("")}
      </select></div>
    <!-- Mic button -->
    <div style="text-align:center;margin-bottom:20px">
      <button id="vd-mic-btn" onclick="toggleVoiceRecording()" style="width:90px;height:90px;border-radius:50%;border:none;background:linear-gradient(135deg,#ec4899,#9b6dff);cursor:pointer;font-size:2.2rem;box-shadow:0 4px 24px rgba(236,72,153,0.5);transition:all .2s;display:inline-flex;align-items:center;justify-content:center" id="vd-mic">🎙️</button>
      <div id="vd-status" style="font-size:0.82rem;color:var(--text-muted);margin-top:12px">Tap to speak your question</div>
      <div id="vd-waves" style="height:28px;display:flex;align-items:center;justify-content:center;gap:2px;margin-top:8px;visibility:hidden">
        ${Array(7)
          .fill(0)
          .map(
            (_, i) =>
              `<span class="_vdbar" style="animation-delay:${i * 0.1}s"></span>`,
          )
          .join("")}
      </div>
    </div>
    <!-- Transcript -->
    <div id="vd-transcript" style="background:rgba(236,72,153,0.06);border:1px solid rgba(236,72,153,0.2);border-radius:12px;padding:12px 14px;margin-bottom:12px;min-height:48px;font-size:0.88rem;color:var(--text-secondary);display:none">
      <div style="font-size:0.65rem;font-weight:900;letter-spacing:0.08em;color:#ec4899;text-transform:uppercase;margin-bottom:6px">You said:</div>
      <div id="vd-transcript-text"></div>
    </div>
    <!-- Or type fallback -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <div style="flex:1;height:1px;background:rgba(255,255,255,0.08)"></div>
      <span style="font-size:0.72rem;color:var(--text-muted)">or type</span>
      <div style="flex:1;height:1px;background:rgba(255,255,255,0.08)"></div>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:20px">
      <input id="vd-text-input" class="form-input" placeholder="Type your question here..." style="flex:1">
      <button onclick="submitVoiceDoubt(document.getElementById('vd-text-input').value)" class="btn btn-primary" style="background:linear-gradient(135deg,#ec4899,#9b6dff);border:none;padding:10px 16px;flex-shrink:0">Ask →</button>
    </div>
    <!-- Answer area -->
    <div id="vd-answer" style="display:none"></div>
  `;
  window.updateVdChapters = () => {
    const sel = document.getElementById("vd-chapter");
    const chs = getChapters(
      document.getElementById("vd-class").value,
      document.getElementById("vd-subject").value,
    );
    sel.innerHTML =
      `<option value="">Any chapter</option>` +
      chs.map((c) => `<option value="${c}">${c}</option>`).join("");
  };
  window._vdRecognition = null;
  window._vdListening = false;
}

window.toggleVoiceRecording = () => {
  if (
    !("webkitSpeechRecognition" in window) &&
    !("SpeechRecognition" in window)
  ) {
    const statusEl = document.getElementById("vd-status");
    if (statusEl)
      statusEl.textContent =
        "Voice not supported in this browser — please type your question below";
    return;
  }
  if (window._vdListening) {
    if (window._vdRecognition) window._vdRecognition.stop();
    return;
  }
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "en-IN";
  window._vdRecognition = recognition;
  window._vdListening = true;
  const btn = document.getElementById("vd-mic-btn");
  const status = document.getElementById("vd-status");
  const waves = document.getElementById("vd-waves");
  const transcript = document.getElementById("vd-transcript");
  const transcriptText = document.getElementById("vd-transcript-text");
  if (btn) {
    btn.style.animation = "_vdPulse 1.2s ease-in-out infinite";
    btn.textContent = "⏹️";
  }
  if (status) status.textContent = "Listening... speak now";
  if (waves) waves.style.visibility = "visible";
  recognition.onresult = (e) => {
    const text = Array.from(e.results)
      .map((r) => r[0].transcript)
      .join("");
    if (transcript) transcript.style.display = "block";
    if (transcriptText) transcriptText.textContent = text;
    if (e.results[0].isFinal) {
      window._vdListening = false;
      if (btn) {
        btn.style.animation = "";
        btn.textContent = "🎙️";
      }
      if (status) status.textContent = "Got it! Fetching answer...";
      if (waves) waves.style.visibility = "hidden";
      submitVoiceDoubt(text);
    }
  };
  recognition.onerror = () => {
    window._vdListening = false;
    if (btn) {
      btn.style.animation = "";
      btn.textContent = "🎙️";
    }
    if (status)
      status.textContent =
        "Couldn't hear clearly — please try again or type below";
    if (waves) waves.style.visibility = "hidden";
  };
  recognition.onend = () => {
    window._vdListening = false;
    if (btn) {
      btn.style.animation = "";
      btn.textContent = "🎙️";
    }
    if (waves) waves.style.visibility = "hidden";
  };
  recognition.start();
};

window.submitVoiceDoubt = async (question) => {
  if (!question || !question.trim()) return;
  const answerEl = document.getElementById("vd-answer");
  const status = document.getElementById("vd-status");
  const classNum =
    document.getElementById("vd-class")?.value || S.classPreference;
  const subject =
    document.getElementById("vd-subject")?.value || S.subjectPreference;
  const chapter = document.getElementById("vd-chapter")?.value || "";
  if (answerEl) {
    answerEl.style.display = "block";
    answerEl.innerHTML = `<div style="text-align:center;padding:20px">${typingLoader()}<div style="font-size:0.82rem;color:var(--text-muted);margin-top:8px">Thinking...</div></div>`;
  }
  if (status) status.textContent = "Tap to ask another question";
  try {
    const data = await apiPost("/solve", {
      question,
      subject,
      classNum,
      chapter,
      level: getPerf().level,
      lang: getLanguage(),
    });
    const fullText = [data.solution, ...(data.steps || [])].join(". ");
    // Speak the answer
    if ("speechSynthesis" in window) {
      const utt = new SpeechSynthesisUtterance(fullText);
      utt.lang = "en-IN";
      utt.rate = 0.92;
      utt.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
    }
    if (answerEl)
      answerEl.innerHTML = `
      <div style="background:rgba(236,72,153,0.06);border:1.5px solid rgba(236,72,153,0.2);border-radius:14px;padding:16px;margin-top:4px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="font-size:0.68rem;font-weight:900;letter-spacing:0.08em;color:#ec4899;text-transform:uppercase">🤖 AI Answer</div>
          <div style="display:flex;gap:6px">
            <button onclick="speakText('${fullText.replace(/'/g, "\\'")}')}" style="background:rgba(236,72,153,0.15);border:1px solid rgba(236,72,153,0.3);color:#ec4899;border-radius:20px;padding:3px 10px;font-size:0.72rem;font-weight:700;cursor:pointer;font-family:inherit">🔊 Replay</button>
            <button onclick="window.speechSynthesis&&window.speechSynthesis.cancel()" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:var(--text-muted);border-radius:20px;padding:3px 10px;font-size:0.72rem;font-weight:700;cursor:pointer;font-family:inherit">⏹ Stop</button>
          </div>
        </div>
        <div style="font-size:0.9rem;font-weight:700;color:#fff;margin-bottom:10px">${escapeHtml(data.solution || "")}</div>
        ${(data.steps || []).map((s) => `<div style="font-size:0.84rem;color:var(--text-secondary);padding:5px 0;border-top:1px solid rgba(255,255,255,0.05);display:flex;gap:8px"><span style="color:#ec4899;flex-shrink:0">→</span>${escapeHtml(s)}</div>`).join("")}
        ${data.memoryTrick ? `<div style="margin-top:10px;background:rgba(155,109,255,0.1);border:1px solid rgba(155,109,255,0.2);border-radius:8px;padding:8px 12px;font-size:0.78rem;color:#c4b5fd">💡 ${escapeHtml(data.memoryTrick)}</div>` : ""}
      </div>`;
  } catch (e) {
    if (answerEl)
      answerEl.innerHTML = `<div style="color:var(--red);font-size:0.85rem">Error: ${e.message}</div>`;
  }
};
window.speakText = (text) => {
  if ("speechSynthesis" in window) {
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "en-IN";
    utt.rate = 0.92;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  }
};

// ============================================================
// SMART REVISION SCHEDULE
// ============================================================
function renderRevisionSchedule() {
  const app = document.getElementById("app");
  const saved = S.revisionSchedule;
  if (saved && saved.examDate && new Date(saved.examDate) > new Date()) {
    renderRevisionScheduleView(saved);
    return;
  }
  const subjects = [
    "Maths",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Geography",
    "Civics",
    "Economics",
    "English",
    "Hindi",
  ];
  // Default exam date = 60 days from now
  const defaultDate = new Date(Date.now() + 60 * 86400000)
    .toISOString()
    .split("T")[0];
  app.innerHTML = `
    <button onclick="navigate('home')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;padding:0;font-family:inherit;margin-bottom:18px;display:block">‹ Back</button>
    <div style="font-size:1.4rem;font-weight:900;background:linear-gradient(135deg,#06b6d4,#4f8ef7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px">📅 Smart Revision Schedule</div>
    <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:24px">AI builds a personalised day-by-day study plan around your school hours</div>

    <!-- STEP 1: School Timing -->
    <div style="background:rgba(6,182,212,0.07);border:1.5px solid rgba(6,182,212,0.25);border-radius:16px;padding:16px;margin-bottom:16px">
      <div style="font-size:0.68rem;font-weight:900;letter-spacing:0.1em;color:#06b6d4;text-transform:uppercase;margin-bottom:12px">🏫 Step 1 — Your School Hours</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div>
          <label class="form-label">School Starts</label>
          <input type="time" id="rs-school-start" class="form-input" style="margin-top:4px" value="07:30">
        </div>
        <div>
          <label class="form-label">School Ends</label>
          <input type="time" id="rs-school-end" class="form-input" style="margin-top:4px" value="14:00">
        </div>
      </div>
      <div style="font-size:0.72rem;color:var(--text-muted)">The planner will schedule study slots before school, after school, and in the evening — avoiding your school hours.</div>
    </div>

    <!-- STEP 2: Exam & Subjects -->
    <div style="background:rgba(79,142,247,0.07);border:1.5px solid rgba(79,142,247,0.2);border-radius:16px;padding:16px;margin-bottom:16px">
      <div style="font-size:0.68rem;font-weight:900;letter-spacing:0.1em;color:#4f8ef7;text-transform:uppercase;margin-bottom:12px">📋 Step 2 — Exam & Subjects</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div><label class="form-label">Your Exam Date</label>
          <input type="date" id="rs-date" class="form-input" style="margin-top:4px" value="${defaultDate}" min="${new Date().toISOString().split("T")[0]}"></div>
        <div><label class="form-label">Class</label>
          <select id="rs-class" class="form-select" style="margin-top:4px">
            ${["6", "7", "8", "9", "10"].map((c) => `<option value="${c}" ${(S.classPreference || "10") === c ? "selected" : ""}>${c}</option>`).join("")}
          </select></div>
        <div>
          <label class="form-label" style="margin-bottom:8px">Subjects to Revise</label>
          <div id="rs-subjects" style="display:flex;flex-wrap:wrap;gap:8px">
            ${subjects.map((s) => `<button data-subj="${s}" onclick="toggleRsSubject(this)" style="padding:6px 14px;border-radius:20px;border:1.5px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:var(--text-muted);font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s">${s}</button>`).join("")}
          </div>
        </div>
      </div>
    </div>

    <!-- STEP 3: Free Time Slots -->
    <div style="background:rgba(155,109,255,0.07);border:1.5px solid rgba(155,109,255,0.2);border-radius:16px;padding:16px;margin-bottom:20px">
      <div style="font-size:0.68rem;font-weight:900;letter-spacing:0.1em;color:#9b6dff;text-transform:uppercase;margin-bottom:12px">⏰ Step 3 — Available Study Slots</div>
      <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:12px">Which time periods can you study? (outside school hours)</div>
      <div style="display:flex;flex-direction:column;gap:8px" id="rs-slots">
        ${[
          {
            id: "morning",
            label: "Early Morning",
            time: "5:00 AM – School Start",
            emoji: "🌅",
          },
          {
            id: "afternoon",
            label: "After School",
            time: "School End – 6:00 PM",
            emoji: "📚",
          },
          {
            id: "evening",
            label: "Evening",
            time: "6:00 PM – 9:00 PM",
            emoji: "🌇",
          },
          {
            id: "night",
            label: "Night",
            time: "9:00 PM – 11:00 PM",
            emoji: "🌙",
          },
        ]
          .map(
            (slot, i) => `
          <button data-slot="${slot.id}" onclick="toggleRsSlot(this)" style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:12px;border:1.5px solid ${i === 1 ? "rgba(155,109,255,0.5)" : "rgba(255,255,255,0.1)"};background:${i === 1 ? "rgba(155,109,255,0.12)" : "rgba(255,255,255,0.03)"};cursor:pointer;font-family:inherit;text-align:left;transition:all .2s" ${i === 1 ? 'data-selected="true"' : ""}>
            <span style="font-size:1.3rem">${slot.emoji}</span>
            <div>
              <div style="font-size:0.85rem;font-weight:800;color:${i === 1 ? "#9b6dff" : "var(--text)"}">${slot.label}</div>
              <div style="font-size:0.72rem;color:var(--text-muted)">${slot.time}</div>
            </div>
            <span style="margin-left:auto;font-size:0.75rem;font-weight:900;color:${i === 1 ? "#9b6dff" : "var(--text-muted)"}">${i === 1 ? "✓ ON" : "OFF"}</span>
          </button>`,
          )
          .join("")}
      </div>
    </div>

    <!-- STEP 4: Study Filter -->
    <div style="background:rgba(240,180,41,0.07);border:1.5px solid rgba(240,180,41,0.2);border-radius:16px;padding:16px;margin-bottom:20px">
      <div style="font-size:0.68rem;font-weight:900;letter-spacing:0.1em;color:#f0b429;text-transform:uppercase;margin-bottom:12px">🎯 Step 4 — Question Scope <span style="font-size:0.65rem;font-weight:600;color:var(--text-muted);text-transform:none;letter-spacing:0">(optional — shapes what the AI prioritises)</span></div>
      <div style="display:flex;flex-direction:column;gap:14px">

        <div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);margin-bottom:7px">Difficulty focus</div>
          <div style="display:flex;gap:7px;flex-wrap:wrap" id="rs-diff">
            ${["All", "Easy", "Medium", "Hard"].map((d, i) => `<button data-v="${d.toLowerCase()}" onclick="rsChip('rs-diff',this,'#f0b429')" style="padding:5px 13px;border-radius:20px;border:1.5px solid ${i === 0 ? "rgba(240,180,41,0.6)" : "rgba(255,255,255,0.1)"};background:${i === 0 ? "rgba(240,180,41,0.13)" : "transparent"};color:${i === 0 ? "#f0b429" : "var(--text-muted)"};font-size:0.72rem;font-weight:800;cursor:pointer;font-family:inherit;transition:all .15s" ${i === 0 ? 'data-active="true"' : ""}>${d}</button>`).join("")}
          </div>
        </div>

        <div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);margin-bottom:7px">Question type</div>
          <div style="display:flex;gap:7px;flex-wrap:wrap" id="rs-qtype">
            ${["All", "MCQ", "Short Ans", "Long Ans", "A&R", "Case-based"].map((d, i) => `<button data-v="${d.toLowerCase().replace(/ /g, "-")}" onclick="rsChip('rs-qtype',this,'#f0b429')" style="padding:5px 13px;border-radius:20px;border:1.5px solid ${i === 0 ? "rgba(240,180,41,0.6)" : "rgba(255,255,255,0.1)"};background:${i === 0 ? "rgba(240,180,41,0.13)" : "transparent"};color:${i === 0 ? "#f0b429" : "var(--text-muted)"};font-size:0.72rem;font-weight:800;cursor:pointer;font-family:inherit;transition:all .15s" ${i === 0 ? 'data-active="true"' : ""}>${d}</button>`).join("")}
          </div>
        </div>

        <div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);margin-bottom:7px">Marks per question</div>
          <div style="display:flex;gap:7px;flex-wrap:wrap" id="rs-marks">
            ${["All", "1M", "2M", "3M", "5M"].map((d, i) => `<button data-v="${d.toLowerCase()}" onclick="rsChip('rs-marks',this,'#f0b429')" style="padding:5px 13px;border-radius:20px;border:1.5px solid ${i === 0 ? "rgba(240,180,41,0.6)" : "rgba(255,255,255,0.1)"};background:${i === 0 ? "rgba(240,180,41,0.13)" : "transparent"};color:${i === 0 ? "#f0b429" : "var(--text-muted)"};font-size:0.72rem;font-weight:800;cursor:pointer;font-family:inherit;transition:all .15s" ${i === 0 ? 'data-active="true"' : ""}>${d}</button>`).join("")}
          </div>
        </div>

        <div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);margin-bottom:7px">Exam type</div>
          <div style="display:flex;gap:7px;flex-wrap:wrap" id="rs-examtype">
            ${["All", "Board", "School Test", "Mock", "Practice"].map((d, i) => `<button data-v="${d.toLowerCase().replace(/ /g, "-")}" onclick="rsChip('rs-examtype',this,'#f0b429')" style="padding:5px 13px;border-radius:20px;border:1.5px solid ${i === 0 ? "rgba(240,180,41,0.6)" : "rgba(255,255,255,0.1)"};background:${i === 0 ? "rgba(240,180,41,0.13)" : "transparent"};color:${i === 0 ? "#f0b429" : "var(--text-muted)"};font-size:0.72rem;font-weight:800;cursor:pointer;font-family:inherit;transition:all .15s" ${i === 0 ? 'data-active="true"' : ""}>${d}</button>`).join("")}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);margin-bottom:5px">Board</div>
            <select id="rs-board" style="width:100%;padding:7px 10px;border-radius:9px;border:1px solid rgba(255,255,255,0.12);background:rgba(30,30,50,0.9);color:var(--text);font-size:0.8rem;font-weight:600;font-family:inherit">
              <option value="CBSE">CBSE</option>
              <option value="ICSE">ICSE</option>
              <option value="State">State Board</option>
            </select>
          </div>
          <div>
            <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);margin-bottom:5px">Language</div>
            <select id="rs-lang" style="width:100%;padding:7px 10px;border-radius:9px;border:1px solid rgba(255,255,255,0.12);background:rgba(30,30,50,0.9);color:var(--text);font-size:0.8rem;font-weight:600;font-family:inherit">
              <option value="all">Both</option>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
        </div>

        <div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);margin-bottom:7px">PYQ year range</div>
          <div style="display:flex;align-items:center;gap:10px">
            <input type="number" id="rs-year-from" value="2018" min="2010" max="2025" style="width:80px;padding:6px 10px;border-radius:9px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:var(--text);font-size:0.82rem;font-weight:700;font-family:inherit;text-align:center">
            <span style="color:var(--text-muted);font-size:0.8rem">to</span>
            <input type="number" id="rs-year-to" value="2025" min="2010" max="2025" style="width:80px;padding:6px 10px;border-radius:9px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:var(--text);font-size:0.82rem;font-weight:700;font-family:inherit;text-align:center">
          </div>
        </div>

        <div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);margin-bottom:7px">Chapter priority</div>
          <div style="display:flex;gap:7px;flex-wrap:wrap" id="rs-chaprio">
            ${["Balanced", "Weak first", "Strong first", "Exam-weight"].map((d, i) => `<button data-v="${d.toLowerCase().replace(/ /g, "-")}" onclick="rsChip('rs-chaprio',this,'#f0b429')" style="padding:5px 13px;border-radius:20px;border:1.5px solid ${i === 0 ? "rgba(240,180,41,0.6)" : "rgba(255,255,255,0.1)"};background:${i === 0 ? "rgba(240,180,41,0.13)" : "transparent"};color:${i === 0 ? "#f0b429" : "var(--text-muted)"};font-size:0.72rem;font-weight:800;cursor:pointer;font-family:inherit;transition:all .15s" ${i === 0 ? 'data-active="true"' : ""}>${d}</button>`).join("")}
          </div>
        </div>

        <div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);margin-bottom:7px">Session style</div>
          <div style="display:flex;gap:7px;flex-wrap:wrap" id="rs-style">
            ${["Mixed", "One subject/day", "One chapter/session", "Interleaved"].map((d, i) => `<button data-v="${d.toLowerCase().replace(/ /g, "-")}" onclick="rsChip('rs-style',this,'#f0b429')" style="padding:5px 13px;border-radius:20px;border:1.5px solid ${i === 0 ? "rgba(240,180,41,0.6)" : "rgba(255,255,255,0.1)"};background:${i === 0 ? "rgba(240,180,41,0.13)" : "transparent"};color:${i === 0 ? "#f0b429" : "var(--text-muted)"};font-size:0.72rem;font-weight:800;cursor:pointer;font-family:inherit;transition:all .15s" ${i === 0 ? 'data-active="true"' : ""}>${d}</button>`).join("")}
          </div>
        </div>

      </div>
    </div>

    <button onclick="generateRevisionSchedule()" class="btn btn-primary" style="width:100%;padding:14px;font-size:1rem;font-weight:900;background:linear-gradient(135deg,#06b6d4,#4f8ef7);border:none;box-shadow:0 4px 20px rgba(6,182,212,0.4)">Generate My Plan →</button>
    <div id="rs-err" style="color:var(--red);font-size:0.82rem;margin-top:10px;text-align:center"></div>
  `;
  window._rsSubjects = new Set();
  window._rsSlots = new Set(["afternoon"]);
  window.toggleRsSubject = (btn) => {
    const s = btn.dataset.subj;
    if (window._rsSubjects.has(s)) {
      window._rsSubjects.delete(s);
      btn.style.borderColor = "rgba(255,255,255,0.12)";
      btn.style.background = "rgba(255,255,255,0.04)";
      btn.style.color = "var(--text-muted)";
    } else {
      window._rsSubjects.add(s);
      btn.style.borderColor = "#06b6d4";
      btn.style.background = "rgba(6,182,212,0.12)";
      btn.style.color = "#06b6d4";
    }
  };
  window.toggleRsSlot = (btn) => {
    const id = btn.dataset.slot;
    const isOn = btn.dataset.selected === "true";
    if (isOn) {
      window._rsSlots.delete(id);
      btn.dataset.selected = "false";
      btn.style.borderColor = "rgba(255,255,255,0.1)";
      btn.style.background = "rgba(255,255,255,0.03)";
      btn.querySelector("div > div:first-child").style.color = "var(--text)";
      btn.querySelector("span:last-child").style.color = "var(--text-muted)";
      btn.querySelector("span:last-child").textContent = "OFF";
    } else {
      window._rsSlots.add(id);
      btn.dataset.selected = "true";
      btn.style.borderColor = "rgba(155,109,255,0.5)";
      btn.style.background = "rgba(155,109,255,0.12)";
      btn.querySelector("div > div:first-child").style.color = "#9b6dff";
      btn.querySelector("span:last-child").style.color = "#9b6dff";
      btn.querySelector("span:last-child").textContent = "✓ ON";
    }
  };
  // Chip selector for study filter rows
  window.rsChip = (groupId, btn, color) => {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.querySelectorAll("button").forEach((b) => {
      const active = b === btn;
      b.dataset.active = active ? "true" : "false";
      b.style.borderColor = active
        ? color.replace(")", ",0.6)").replace("rgb", "rgba")
        : "rgba(255,255,255,0.1)";
      b.style.background = active
        ? color.replace(")", ",0.13)").replace("rgb", "rgba")
        : "transparent";
      b.style.color = active ? color : "var(--text-muted)";
    });
  };
}

window.generateRevisionSchedule = async () => {
  const examDate = document.getElementById("rs-date")?.value;
  const classNum = document.getElementById("rs-class")?.value;
  const schoolStart =
    document.getElementById("rs-school-start")?.value || "07:30";
  const schoolEnd = document.getElementById("rs-school-end")?.value || "14:00";
  const subjects = [...(window._rsSubjects || new Set())];
  const slots = [...(window._rsSlots || new Set())];
  const err = document.getElementById("rs-err");
  if (!examDate) {
    if (err) err.textContent = "Please select your exam date";
    return;
  }
  if (subjects.length === 0) {
    if (err) err.textContent = "Please select at least one subject";
    return;
  }
  if (slots.length === 0) {
    if (err) err.textContent = "Please select at least one study slot";
    return;
  }
  // Compute approx daily hours from slots
  const slotHours = { morning: 1.5, afternoon: 2, evening: 2, night: 1.5 };
  const dailyHours = Math.round(
    slots.reduce((sum, s) => sum + (slotHours[s] || 1.5), 0),
  );
  const daysLeft = Math.max(
    1,
    Math.round((new Date(examDate) - Date.now()) / 86400000),
  );
  const app = document.getElementById("app");
  app.innerHTML = `<div style="text-align:center;padding:60px 20px">${typingLoader()}<div style="font-size:0.85rem;color:var(--text-muted);margin-top:12px">Building your ${daysLeft}-day revision plan around your school hours...</div></div>`;
  // Build weak areas context from question history
  const subjectCounts = S.subjectCounts || {};
  const weakContext = subjects
    .map((s) => `${s}: ${subjectCounts[s] || 0} questions done`)
    .join(", ");
  try {
    // Build chapter list per subject for detailed planning
    const chapterMap = {};
    subjects.forEach((s) => {
      chapterMap[s] = getChapters(classNum, s);
    });
    // Read study filter values
    const getChip = (id) => {
      const a = document.querySelector(`#${id} [data-active="true"]`);
      return a ? a.dataset.v : "all";
    };
    const studyFilter = {
      difficulty: getChip("rs-diff"),
      questionType: getChip("rs-qtype"),
      marks: getChip("rs-marks"),
      examType: getChip("rs-examtype"),
      board: document.getElementById("rs-board")?.value || "CBSE",
      language: document.getElementById("rs-lang")?.value || "all",
      yearFrom: Number(document.getElementById("rs-year-from")?.value || 2018),
      yearTo: Number(document.getElementById("rs-year-to")?.value || 2025),
      chapterPriority: getChip("rs-chaprio"),
      sessionStyle: getChip("rs-style"),
    };
    const data = await apiPost("/revision-schedule", {
      classNum,
      subjects,
      examDate,
      dailyHours,
      daysLeft,
      weakContext,
      subjectCounts: S.subjectCounts || {},
      schoolStart,
      schoolEnd,
      studySlots: slots,
      chapterMap,
      studyFilter,
      lang: getLanguage(),
    });
    S.revisionSchedule = {
      ...data,
      examDate,
      classNum,
      subjects,
      dailyHours,
      schoolStart,
      schoolEnd,
      studySlots: slots,
      createdAt: Date.now(),
    };
    saveState();
    renderRevisionScheduleView(S.revisionSchedule);
  } catch (e) {
    app.innerHTML = `<div style="padding:20px;color:var(--red)">Error: ${e.message}<br><br><button class="btn btn-secondary btn-sm" onclick="renderRevisionSchedule()">Back</button></div>`;
  }
};

function renderRevisionScheduleView(schedule) {
  const app = document.getElementById("app");
  const today = new Date().toISOString().split("T")[0];
  const daysLeft = Math.max(
    0,
    Math.round((new Date(schedule.examDate) - Date.now()) / 86400000),
  );
  const todayPlan = (schedule.days || []).find((d) => d.date === today);
  const weekDays = (schedule.days || []).slice(0, 14);
  const SUBJ_COLORS = {
    Maths: "#4f8ef7",
    Physics: "#f0b429",
    Chemistry: "#0fca8c",
    Biology: "#9b6dff",
    History: "#f97316",
    Geography: "#06b6d4",
    Civics: "#ec4899",
    Economics: "#a78bfa",
    English: "#34d399",
    Hindi: "#f0564a",
  };
  const PRIORITY_COL = { high: "#f0564a", medium: "#f0b429", low: "#0fca8c" };
  const DAY_TYPE_BADGE = {
    revision: "📖 Revision",
    practice: "✏️ Practice",
    "mock-test": "📝 Mock Test",
    rest: "😴 Rest",
  };
  const DAY_TYPE_COL = {
    revision: "#4f8ef7",
    practice: "#9b6dff",
    "mock-test": "#f0b429",
    rest: "#0fca8c",
  };

  function taskCard(task) {
    const col = SUBJ_COLORS[task.subject] || "#9b6dff";
    const pc = task.priority ? PRIORITY_COL[task.priority] : null;
    return `<div style="background:rgba(255,255,255,0.03);border:1px solid ${col}28;border-radius:12px;padding:11px 13px;margin-bottom:8px;border-left:3px solid ${col}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:1rem">${task.emoji || "📖"}</span>
          <span style="font-size:0.8rem;font-weight:900;color:${col}">${escapeHtml(task.subject)}</span>
          ${pc ? `<span style="font-size:0.6rem;font-weight:900;color:${pc};background:${pc}18;border-radius:20px;padding:1px 6px;text-transform:uppercase">${task.priority}</span>` : ""}
        </div>
        <span style="font-size:0.72rem;font-weight:800;color:var(--text-muted);background:rgba(255,255,255,0.06);border-radius:20px;padding:2px 8px">${escapeHtml(task.duration || "")}</span>
      </div>
      ${task.chapter ? `<div style="font-size:0.8rem;font-weight:800;color:#fff;margin-bottom:3px">📌 ${escapeHtml(task.chapter)}</div>` : ""}
      <div style="font-size:0.77rem;color:var(--text-muted);line-height:1.45">${escapeHtml(task.task || "")}</div>
    </div>`;
  }

  app.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <button onclick="navigate('home')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;padding:0;font-family:inherit">‹ Back</button>
      <button onclick="S.revisionSchedule=null;saveState();renderRevisionSchedule()" style="background:none;border:1px solid rgba(255,255,255,0.1);color:var(--text-muted);border-radius:8px;padding:4px 10px;font-size:0.72rem;cursor:pointer;font-family:inherit">↺ Reset Plan</button>
    </div>

    <!-- Countdown banner -->
    <div style="background:linear-gradient(135deg,rgba(6,182,212,0.15),rgba(79,142,247,0.08));border:1.5px solid rgba(6,182,212,0.3);border-radius:20px;padding:20px;text-align:center;margin-bottom:14px;position:relative;overflow:hidden">
      <div style="position:absolute;top:-40px;left:50%;transform:translateX(-50%);width:180px;height:180px;border-radius:50%;background:rgba(6,182,212,0.08);filter:blur(40px)"></div>
      <div style="font-size:3rem;font-weight:900;color:#06b6d4;text-shadow:0 0 24px rgba(6,182,212,0.5)">${daysLeft}</div>
      <div style="font-size:0.85rem;color:rgba(255,255,255,0.6);margin-bottom:8px">days to exam · ${new Date(schedule.examDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
      <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:6px">
        ${(schedule.subjects || []).map((s) => `<span style="background:${SUBJ_COLORS[s] || "#9b6dff"}18;border:1px solid ${SUBJ_COLORS[s] || "#9b6dff"}33;color:${SUBJ_COLORS[s] || "#9b6dff"};font-size:0.7rem;font-weight:800;padding:3px 10px;border-radius:20px">${s}</span>`).join("")}
      </div>
      ${schedule.schoolStart ? `<div style="margin-top:8px;font-size:0.72rem;color:rgba(255,255,255,0.4)">   � School ${schedule.schoolStart}–${schedule.schoolEnd} · Slots: ${(schedule.studySlots || []).map((s) => ({ morning: "🌅 Morning", afternoon: "📚 After School", evening: "🌇 Evening", night: "🌙 Night" })[s] || s).join(", ")}</div>` : ""}
    </div>

    <!-- Subject schedule overview -->
    ${
      schedule.subjectSchedule && Object.keys(schedule.subjectSchedule).length
        ? `
    <div style="background:rgba(155,109,255,0.06);border:1px solid rgba(155,109,255,0.2);border-radius:14px;padding:14px;margin-bottom:14px">
      <div style="font-size:0.65rem;font-weight:900;letter-spacing:.1em;color:#9b6dff;text-transform:uppercase;margin-bottom:10px">📋 Subject Coverage Plan</div>
      ${Object.entries(schedule.subjectSchedule)
        .map(([subj, days]) => {
          const col = SUBJ_COLORS[subj] || "#9b6dff";
          return `<div style="margin-bottom:8px">
          <div style="font-size:0.78rem;font-weight:900;color:${col};margin-bottom:3px">${subj}</div>
          ${(Array.isArray(days) ? days : [days]).map((d) => `<div style="font-size:0.73rem;color:var(--text-muted);padding:1px 0">· ${escapeHtml(String(d))}</div>`).join("")}
        </div>`;
        })
        .join("")}
    </div>`
        : ""
    }

    <!-- Today's plan -->
    ${
      todayPlan
        ? `
    <div style="background:rgba(6,182,212,0.08);border:1.5px solid rgba(6,182,212,0.35);border-radius:16px;padding:14px;margin-bottom:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div style="font-size:0.65rem;font-weight:900;letter-spacing:.1em;color:#06b6d4;text-transform:uppercase">📌 Today's Tasks</div>
        ${todayPlan.dayType ? `<span style="font-size:0.65rem;font-weight:900;color:${DAY_TYPE_COL[todayPlan.dayType] || "#06b6d4"};background:${DAY_TYPE_COL[todayPlan.dayType] || "#06b6d4"}18;border-radius:20px;padding:2px 8px">${DAY_TYPE_BADGE[todayPlan.dayType] || todayPlan.dayType}</span>` : ""}
      </div>
      ${(todayPlan.tasks || []).map(taskCard).join("")}
    </div>`
        : `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px;text-align:center;color:var(--text-muted);font-size:0.85rem;margin-bottom:14px">No tasks scheduled for today — enjoy the break! 🎉</div>`
    }

    <!-- 14-day overview -->
    <div style="font-size:0.65rem;font-weight:900;letter-spacing:.1em;color:var(--text-muted);text-transform:uppercase;margin-bottom:10px">📆 Full 14-Day Plan</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">
      ${weekDays
        .map((d) => {
          const isToday = d.date === today;
          const isPast = d.date < today;
          const dtCol = DAY_TYPE_COL[d.dayType] || "#06b6d4";
          return `<div style="background:${isToday ? "rgba(6,182,212,0.1)" : isPast ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.03)"};border:1.5px solid ${isToday ? "rgba(6,182,212,0.4)" : "rgba(255,255,255,0.07)"};border-radius:14px;padding:10px 14px">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:${(d.tasks || []).length ? "8px" : "0"}">
            <div style="width:44px;text-align:center;flex-shrink:0">
              <div style="font-size:0.6rem;color:${isToday ? "#06b6d4" : "var(--text-muted)"};font-weight:900">${new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase()}</div>
              <div style="font-size:1rem;font-weight:900;color:${isToday ? "#06b6d4" : isPast ? "var(--text-muted)" : "var(--text)"};">${new Date(d.date).getDate()}</div>
            </div>
            <div style="flex:1;min-width:0">
              ${d.dayType ? `<span style="font-size:0.62rem;font-weight:900;color:${dtCol};background:${dtCol}18;border-radius:20px;padding:2px 8px;margin-bottom:4px;display:inline-block">${DAY_TYPE_BADGE[d.dayType] || d.dayType}</span><br>` : ""}
              ${(d.tasks || []).map((t) => `<span style="display:inline-flex;align-items:center;gap:3px;background:${SUBJ_COLORS[t.subject] || "#9b6dff"}15;border:1px solid ${SUBJ_COLORS[t.subject] || "#9b6dff"}30;border-radius:20px;padding:2px 8px;font-size:0.7rem;font-weight:700;color:${SUBJ_COLORS[t.subject] || "#9b6dff"};margin:2px">${t.emoji || "📖"} ${escapeHtml(t.subject)}</span>`).join("")}
            </div>
            ${isToday ? `<span style="background:#06b6d4;color:#000;font-size:0.6rem;font-weight:900;padding:2px 8px;border-radius:20px;flex-shrink:0">TODAY</span>` : ""}
          </div>
          ${
            (d.tasks || []).length
              ? `
          <div style="display:flex;flex-direction:column;gap:4px;padding-left:56px">
            ${(d.tasks || [])
              .map(
                (
                  t,
                ) => `<div style="font-size:0.75rem;color:var(--text-muted);display:flex;align-items:center;gap:6px">
              ${t.chapter ? `<span style="color:${SUBJ_COLORS[t.subject] || "#9b6dff"};font-weight:800;flex-shrink:0">📌 ${escapeHtml(t.chapter)}</span><span style="color:rgba(255,255,255,0.2)">·</span>` : ""}
              <span>${escapeHtml(t.task || "")}</span>
              <span style="color:rgba(255,255,255,0.25);flex-shrink:0">${escapeHtml(t.duration || "")}</span>
            </div>`,
              )
              .join("")}
          </div>`
              : ""
          }
        </div>`;
        })
        .join("")}
    </div>

    <!-- Tips -->
    ${
      schedule.tips && schedule.tips.length
        ? `
    <div style="background:rgba(155,109,255,0.06);border:1px solid rgba(155,109,255,0.2);border-radius:14px;padding:14px 16px">
      <div style="font-size:0.65rem;font-weight:900;letter-spacing:.08em;color:#9b6dff;text-transform:uppercase;margin-bottom:10px">💡 AI Study Tips</div>
      ${schedule.tips.map((tip) => `<div style="font-size:0.83rem;color:var(--text-secondary);padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;gap:8px;line-height:1.5"><span style="color:#9b6dff;flex-shrink:0">•</span>${escapeHtml(tip)}</div>`).join("")}
    </div>`
        : ""
    }
  `;
}

window.renderRevisionSchedule = renderRevisionSchedule;

// ============================================================
// PYQ TRENDS ANALYSER
// ============================================================
const PYQ_TRENDS = {
  Maths: {
    "Real Numbers": [5, 4, 5, 3, 5],
    Polynomials: [3, 4, 3, 4, 3],
    "Linear Equations": [4, 5, 4, 5, 4],
    "Quadratic Equations": [5, 5, 5, 5, 5],
    "Arithmetic Progressions": [4, 4, 5, 4, 4],
    Triangles: [5, 5, 4, 5, 5],
    "Coordinate Geometry": [3, 4, 3, 3, 4],
    "Introduction to Trigonometry": [5, 5, 5, 5, 5],
    "Applications of Trigonometry": [4, 5, 4, 5, 5],
    Circles: [5, 4, 5, 4, 5],
    Constructions: [3, 3, 2, 3, 2],
    "Areas Related to Circles": [4, 4, 4, 4, 4],
    "Surface Areas and Volumes": [5, 5, 5, 5, 5],
    Statistics: [5, 4, 5, 5, 4],
    Probability: [4, 4, 4, 4, 4],
  },
  Physics: {
    "Light Reflection and Refraction": [5, 5, 5, 5, 5],
    "Human Eye and Colourful World": [4, 4, 5, 4, 4],
    Electricity: [5, 5, 5, 5, 5],
    "Magnetic Effects of Electric Current": [4, 5, 4, 5, 4],
    "Sources of Energy": [3, 3, 3, 2, 3],
  },
  Chemistry: {
    "Chemical Reactions and Equations": [5, 5, 5, 5, 5],
    "Acids Bases and Salts": [5, 5, 5, 5, 5],
    "Metals and Non-metals": [5, 5, 5, 4, 5],
    "Carbon and its Compounds": [4, 4, 5, 4, 5],
    "Periodic Classification of Elements": [3, 3, 3, 4, 3],
  },
  Biology: {
    "Life Processes": [5, 5, 5, 5, 5],
    "Control and Coordination": [4, 5, 4, 4, 5],
    "How do Organisms Reproduce": [4, 4, 4, 4, 4],
    "Heredity and Evolution": [4, 4, 5, 4, 4],
    "Our Environment": [3, 3, 3, 3, 3],
    "Sustainable Management of Natural Resources": [2, 3, 2, 3, 2],
  },
  History: {
    "The Rise of Nationalism in Europe": [5, 5, 5, 5, 5],
    "Nationalism in India": [5, 5, 5, 5, 5],
    "The Making of a Global World": [4, 4, 4, 3, 4],
    "The Age of Industrialisation": [3, 4, 3, 4, 3],
    "Print Culture and the Modern World": [3, 3, 4, 3, 3],
  },
  Geography: {
    "Resources and Development": [5, 5, 5, 5, 5],
    "Forest and Wildlife Resources": [3, 4, 3, 3, 4],
    "Water Resources": [4, 4, 4, 4, 4],
    Agriculture: [4, 5, 4, 4, 5],
    "Minerals and Energy Resources": [4, 4, 4, 4, 4],
    "Manufacturing Industries": [4, 4, 4, 4, 4],
    "Lifelines of National Economy": [3, 3, 3, 4, 3],
  },
  Civics: {
    "Power Sharing": [5, 5, 5, 5, 5],
    Federalism: [5, 5, 4, 5, 5],
    "Democracy and Diversity": [3, 3, 3, 3, 3],
    "Gender Religion and Caste": [3, 3, 3, 3, 4],
    "Popular Struggles and Movements": [3, 3, 4, 3, 3],
    "Political Parties": [4, 4, 4, 4, 4],
    "Outcomes of Democracy": [4, 4, 4, 4, 4],
    "Challenges to Democracy": [3, 3, 3, 3, 3],
  },
  Economics: {
    Development: [4, 4, 4, 4, 4],
    "Sectors of the Indian Economy": [5, 5, 5, 4, 5],
    "Money and Credit": [5, 5, 5, 5, 5],
    "Globalisation and the Indian Economy": [4, 4, 4, 4, 4],
    "Consumer Rights": [4, 4, 4, 4, 4],
  },
};

function renderTrendsAnalyser(inline = false) {
  const app = inline
    ? document.getElementById("resource-tab-content")
    : document.getElementById("app");
  if (!app) return;
  const subjects = Object.keys(PYQ_TRENDS);
  const subj = subjects.includes(S.subjectPreference)
    ? S.subjectPreference
    : subjects[0];
  app.innerHTML = `
    ${inline ? "" : `<button onclick="navigate('home')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;padding:0;font-family:inherit;margin-bottom:18px;display:block">‹ Back</button>`}
    <div style="font-size:1.4rem;font-weight:900;background:linear-gradient(135deg,#f97316,#f0b429);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px">📊 PYQ Trend Analyser</div>
    <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:18px">Which chapters appeared most in last 5 years of CBSE boards — study smart</div>
    <!-- Subject tabs -->
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px" id="trends-tabs">
      ${subjects.map((s) => `<button data-subj="${s}" onclick="showTrends('${s}',this)" style="padding:6px 12px;border-radius:20px;border:1.5px solid ${s === subj ? "#f97316" : "rgba(255,255,255,0.1)"};background:${s === subj ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.04)"};color:${s === subj ? "#f97316" : "var(--text-muted)"};font-size:0.75rem;font-weight:800;cursor:pointer;font-family:inherit;transition:all .2s">${s}</button>`).join("")}
    </div>
    <div id="trends-content"></div>
  `;
  window.showTrends = (subject, btn) => {
    document.querySelectorAll("[data-subj]").forEach((b) => {
      b.style.borderColor = "rgba(255,255,255,0.1)";
      b.style.background = "rgba(255,255,255,0.04)";
      b.style.color = "var(--text-muted)";
    });
    if (btn) {
      btn.style.borderColor = "#f97316";
      btn.style.background = "rgba(249,115,22,0.15)";
      btn.style.color = "#f97316";
    }
    const data = PYQ_TRENDS[subject] || {};
    const years = ["2020", "2021", "2022", "2023", "2024"];
    const chapters = Object.entries(data).sort((a, b) => {
      const aAvg = a[1].reduce((x, y) => x + y, 0) / a[1].length;
      const bAvg = b[1].reduce((x, y) => x + y, 0) / b[1].length;
      return bAvg - aAvg;
    });
    const content = document.getElementById("trends-content");
    if (!content) return;
    content.innerHTML = `
      <div style="background:rgba(249,115,22,0.06);border:1px solid rgba(249,115,22,0.2);border-radius:12px;padding:12px 14px;margin-bottom:16px;font-size:0.82rem;color:var(--text-muted)">
        🔥 <strong style="color:#f97316">Heat score 1-5:</strong> How frequently each chapter appeared in CBSE board exams 2020–2024
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${chapters
          .map(([ch, scores]) => {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            const heat =
              avg >= 4.5
                ? "🔥🔥"
                : avg >= 3.5
                  ? "🔥"
                  : avg >= 2.5
                    ? "⚡"
                    : "❄️";
            const priority =
              avg >= 4.5
                ? "Must Study"
                : avg >= 3.5
                  ? "High Priority"
                  : avg >= 2.5
                    ? "Medium"
                    : "Low";
            const pColor =
              avg >= 4.5
                ? "#f0564a"
                : avg >= 3.5
                  ? "#f0b429"
                  : avg >= 2.5
                    ? "#4f8ef7"
                    : "rgba(255,255,255,0.3)";
            const barW = Math.round((avg / 5) * 100);
            return `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:12px 14px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <div style="font-size:0.85rem;font-weight:800;color:var(--text);flex:1;min-width:0;margin-right:8px">${heat} ${ch}</div>
              <span style="background:${pColor}18;border:1px solid ${pColor}33;color:${pColor};font-size:0.65rem;font-weight:900;padding:2px 8px;border-radius:20px;white-space:nowrap;flex-shrink:0">${priority}</span>
            </div>
            <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:100px;overflow:hidden;margin-bottom:8px">
              <div style="height:100%;width:${barW}%;background:linear-gradient(90deg,${pColor},${pColor}88);border-radius:100px"></div>
            </div>
            <div style="display:flex;gap:6px">
              ${scores
                .map(
                  (
                    s,
                    i,
                  ) => `<div style="flex:1;text-align:center;background:rgba(255,255,255,0.04);border-radius:6px;padding:4px 2px">
                <div style="font-size:0.7rem;color:var(--text-muted)">${years[i]}</div>
                <div style="font-size:0.8rem;font-weight:900;color:${s >= 4 ? "#f0b429" : s >= 3 ? "#4f8ef7" : "rgba(255,255,255,0.3)"}">${"★".repeat(s)}${"☆".repeat(5 - s)}</div>
              </div>`,
                )
                .join("")}
            </div>
          </div>`;
          })
          .join("")}
      </div>
    `;
  };
  showTrends(subj, document.querySelector(`[data-subj="${subj}"]`));
}

// ============================================================
// MOCK TEST
// ============================================================
function renderMockTestSetup() {
  const app = document.getElementById("app");
  const subjects = [
    "Maths",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Geography",
    "Civics",
    "Economics",
    "English",
    "Hindi",
  ];
  const cls = S.classPreference || "10";
  const subj = S.subjectPreference || "Maths";
  const chapters = getChapters(cls, subj);
  app.innerHTML = `
    <style>@keyframes _mtIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}</style>
    <div style="animation:_mtIn .35s ease">
      <button onclick="navigate('home')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;padding:0;font-family:inherit;margin-bottom:18px;display:block">‹ Back</button>
      <div style="font-size:1.4rem;font-weight:900;background:linear-gradient(135deg,#f0b429,#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px">📝 Mock Test</div>
      <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:24px">Full CBSE-style — AI grades everything including long answers</div>
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div><label class="form-label">Class</label>
            <select id="mt-class" class="form-select" style="margin-top:4px" onchange="updateMtChapters()">
              ${["6", "7", "8", "9", "10"].map((c) => `<option value="${c}" ${cls === c ? "selected" : ""}>${c}</option>`).join("")}
            </select></div>
          <div><label class="form-label">Subject</label>
            <select id="mt-subject" class="form-select" style="margin-top:4px" onchange="updateMtChapters()">
              ${subjects.map((s) => `<option value="${s}" ${subj === s ? "selected" : ""}>${s}</option>`).join("")}
            </select></div>
        </div>
        <div><label class="form-label">Chapter (optional)</label>
          <select id="mt-chapter" class="form-select" style="margin-top:4px">
            <option value="">All Chapters</option>
            ${chapters.map((c) => `<option value="${c}">${c}</option>`).join("")}
          </select></div>
        <div>
          <label class="form-label" style="margin-bottom:8px">Test Duration</label>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px" id="mt-duration">
            ${[
              { v: 20, l: "20 min", e: "⚡" },
              { v: 40, l: "40 min", e: "🔥" },
              { v: 60, l: "60 min", e: "💀" },
            ]
              .map(
                (d, i) => `
            <button class="_dpo${i === 1 ? " _sel" : ""}" onclick="mtPickDuration(${d.v},this)" style="border-radius:14px;padding:14px 10px;cursor:pointer;border:2px solid ${i === 1 ? "#f0b429" : "rgba(255,255,255,0.1)"};background:${i === 1 ? "rgba(240,180,41,0.12)" : "rgba(255,255,255,0.04)"};text-align:center;font-family:inherit;transition:all .2s;box-shadow:${i === 1 ? "0 0 16px rgba(240,180,41,0.3)" : "none"}">
              <div style="font-size:1.3rem">${d.e}</div>
              <div style="font-size:0.85rem;font-weight:800;color:${i === 1 ? "#f0b429" : "var(--text)"};margin-top:4px">${d.l}</div>
            </button>`,
              )
              .join("")}
          </div>
        </div>
      </div>
      <div style="background:rgba(240,180,41,0.08);border:1px solid rgba(240,180,41,0.2);border-radius:12px;padding:12px 16px;margin-bottom:20px;font-size:0.82rem;color:var(--text-muted)">
        📋 <strong style="color:var(--text)">Format:</strong> Section A (MCQ) · Section B (Short Answer) · Section C (Long Answer) — All AI graded with section-wise score breakdown
      </div>
      <button onclick="startMockTest()" class="btn btn-primary" style="width:100%;padding:14px;font-size:1rem;font-weight:900;background:linear-gradient(135deg,#f0b429,#f97316);border:none;box-shadow:0 4px 20px rgba(240,180,41,0.4)">Start Mock Test →</button>
    </div>
  `;
  window._mtDuration = 40;
  window.mtPickDuration = (v, btn) => {
    window._mtDuration = v;
    document.querySelectorAll("[onclick^='mtPickDuration']").forEach((b) => {
      b.style.borderColor = "rgba(255,255,255,0.1)";
      b.style.background = "rgba(255,255,255,0.04)";
      b.style.boxShadow = "none";
      b.querySelector("div:last-child").style.color = "var(--text)";
    });
    btn.style.borderColor = "#f0b429";
    btn.style.background = "rgba(240,180,41,0.12)";
    btn.style.boxShadow = "0 0 16px rgba(240,180,41,0.3)";
    btn.querySelector("div:last-child").style.color = "#f0b429";
  };
  window.updateMtChapters = () => {
    const sel = document.getElementById("mt-chapter");
    const chs = getChapters(
      document.getElementById("mt-class").value,
      document.getElementById("mt-subject").value,
    );
    sel.innerHTML =
      `<option value="">All Chapters</option>` +
      chs.map((c) => `<option value="${c}">${c}</option>`).join("");
  };
}

let _mtState = null;

window.startMockTest = async () => {
  const classNum = document.getElementById("mt-class").value;
  const subject = document.getElementById("mt-subject").value;
  const chapter = document.getElementById("mt-chapter").value;
  const duration = window._mtDuration || 40;
  const app = document.getElementById("app");
  app.innerHTML = `<div style="text-align:center;padding:60px 20px">${typingLoader()}<div style="font-size:0.85rem;color:var(--text-muted);margin-top:12px">Generating CBSE-style mock test...</div></div>`;
  try {
    const data = await apiPost("/mock-test/generate", {
      classNum,
      subject,
      chapter,
      duration,
    });
    _mtState = {
      questions: data.questions,
      classNum,
      subject,
      chapter,
      duration,
      startTime: Date.now(),
      answers: {},
      sectionA: data.sectionA,
      sectionB: data.sectionB,
      sectionC: data.sectionC,
    };
    renderMockTestPage();
  } catch (e) {
    app.innerHTML = `<div style="padding:20px;color:var(--red)">Error: ${e.message}<br><br><button class="btn btn-secondary btn-sm" onclick="renderMockTestSetup()">Back</button></div>`;
  }
};

function renderMockTestPage() {
  const app = document.getElementById("app");
  const { questions, duration, sectionA, sectionB, sectionC } = _mtState;
  const totalSecs = duration * 60;

  app.innerHTML = `
    <style>
      @keyframes _mtSlide{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
      ._mtq{background:rgba(255,255,255,0.03);border:1.5px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;margin-bottom:12px;animation:_mtSlide .3s ease}
      ._mtopt{border-radius:10px;padding:10px 14px;cursor:pointer;border:1.5px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);transition:all .2s;font-size:0.88rem;font-weight:600;text-align:left;width:100%;font-family:inherit;color:var(--text);margin-bottom:6px;display:block}
      ._mtopt.sel{border-color:#f0b429;background:rgba(240,180,41,0.12)}
      textarea.mt-ta{width:100%;background:rgba(0,0,0,0.3);border:1.5px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px;color:var(--text);font-family:inherit;font-size:0.88rem;resize:vertical;min-height:80px;box-sizing:border-box}
      textarea.mt-ta:focus{border-color:#f0b429;outline:none}
    </style>
    <!-- Timer bar -->
    <div style="position:sticky;top:0;z-index:10;background:var(--bg);padding:10px 0 12px;margin-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.06)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="font-size:0.78rem;font-weight:800;color:var(--text-muted)">📝 Mock Test · ${_mtState.subject}</div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:1rem">⏱</span>
          <span id="mt-timer" style="font-size:1.1rem;font-weight:900;color:#f0b429;min-width:48px;text-align:right">${duration}:00</span>
        </div>
      </div>
      <div style="height:4px;background:rgba(255,255,255,0.07);border-radius:100px;overflow:hidden">
        <div id="mt-timerbar" style="height:100%;width:100%;background:linear-gradient(90deg,#f0b429,#f97316);border-radius:100px;transition:width 1s linear"></div>
      </div>
    </div>
    <div id="mt-questions">
      ${renderMockSectionHTML("A", sectionA, "MCQ — 1 mark each", "#4f8ef7")}
      ${renderMockSectionHTML("B", sectionB, "Short Answer — 2 marks each (25-30 words)", "#9b6dff")}
      ${renderMockSectionHTML("C", sectionC, "Long Answer — 5 marks each (60-80 words)", "#0fca8c")}
    </div>
    <button onclick="submitMockTest()" class="btn btn-primary" style="width:100%;padding:14px;font-size:1rem;font-weight:900;background:linear-gradient(135deg,#f0b429,#f97316);border:none;box-shadow:0 4px 20px rgba(240,180,41,0.4);margin-top:8px">Submit Test →</button>
  `;

  // Start countdown
  let secsLeft = totalSecs;
  const timerEl = document.getElementById("mt-timer");
  const barEl = document.getElementById("mt-timerbar");
  _mtState._timerInterval = setInterval(() => {
    secsLeft--;
    const m = Math.floor(secsLeft / 60),
      s = secsLeft % 60;
    if (timerEl) {
      timerEl.textContent = `${m}:${s.toString().padStart(2, "0")}`;
      timerEl.style.color =
        secsLeft < 120 ? "#f0564a" : secsLeft < 300 ? "#f0b429" : "#f0b429";
    }
    if (barEl) barEl.style.width = (secsLeft / totalSecs) * 100 + "%";
    if (secsLeft <= 0) {
      clearInterval(_mtState._timerInterval);
      submitMockTest();
    }
  }, 1000);
}

function renderMockSectionHTML(sec, questions, info, color) {
  if (!questions || questions.length === 0) return "";
  return `
    <div style="margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:10px 14px;background:${color}10;border:1px solid ${color}25;border-radius:12px">
        <div style="width:28px;height:28px;border-radius:8px;background:${color};display:flex;align-items:center;justify-content:center;font-size:0.78rem;font-weight:900;color:#fff;flex-shrink:0">§${sec}</div>
        <div><div style="font-size:0.82rem;font-weight:900;color:${color}">Section ${sec}</div><div style="font-size:0.72rem;color:var(--text-muted)">${info}</div></div>
      </div>
      ${questions
        .map((q, i) => {
          const qid = `${sec}_${i}`;
          if (sec === "A")
            return `
          <div class="_mtq" id="mtq-${qid}">
            <div style="font-size:0.68rem;font-weight:900;color:${color};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Q${i + 1} · 1 Mark</div>
            <div style="font-size:0.92rem;font-weight:600;line-height:1.6;margin-bottom:12px">${escapeHtml(q.q || q.question || "")}</div>
            ${(q.options || []).map((opt, oi) => `<button class="_mtopt" onclick="mtSelectOpt('${qid}',${oi},this)">${opt}</button>`).join("")}
          </div>`;
          return `
          <div class="_mtq" id="mtq-${qid}">
            <div style="font-size:0.68rem;font-weight:900;color:${color};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Q${i + 1} · ${sec === "B" ? "2" : "5"} Mark${sec === "C" ? "s" : ""}</div>
            <div style="font-size:0.92rem;font-weight:600;line-height:1.6;margin-bottom:10px">${escapeHtml(q.q || q.question || "")}</div>
            <textarea class="mt-ta" id="mta-${qid}" placeholder="Write your answer here..." oninput="_mtState.answers['${qid}']=this.value"></textarea>
          </div>`;
        })
        .join("")}
    </div>`;
}

window.mtSelectOpt = (qid, idx, btn) => {
  const card = document.getElementById("mtq-" + qid);
  if (card)
    card.querySelectorAll("._mtopt").forEach((b) => {
      b.classList.remove("sel");
      b.style.borderColor = "rgba(255,255,255,0.1)";
      b.style.background = "rgba(255,255,255,0.04)";
      b.style.color = "var(--text)";
    });
  btn.classList.add("sel");
  btn.style.borderColor = "#f0b429";
  btn.style.background = "rgba(240,180,41,0.12)";
  btn.style.color = "#f0b429";
  _mtState.answers[qid] = idx;
};

window.submitMockTest = async () => {
  if (_mtState._timerInterval) clearInterval(_mtState._timerInterval);
  const app = document.getElementById("app");
  app.innerHTML = `<div style="text-align:center;padding:60px 20px">${typingLoader()}<div style="font-size:0.85rem;color:var(--text-muted);margin-top:12px">AI is grading your test...</div></div>`;
  try {
    const payload = {
      classNum: _mtState.classNum,
      subject: _mtState.subject,
      chapter: _mtState.chapter,
      sectionA: _mtState.sectionA,
      sectionB: _mtState.sectionB,
      sectionC: _mtState.sectionC,
      answers: _mtState.answers,
      timeTaken: Math.round((Date.now() - _mtState.startTime) / 1000),
    };
    const result = await apiPost("/mock-test/grade", payload);
    renderMockTestResult(result);
  } catch (e) {
    app.innerHTML = `<div style="padding:20px;color:var(--red)">Grading error: ${e.message}<br><br><button class="btn btn-secondary btn-sm" onclick="renderMockTestSetup()">Back</button></div>`;
  }
};

function renderMockTestResult(r) {
  const app = document.getElementById("app");
  const total = r.totalScore || 0;
  const maxTotal = r.maxScore || 30;
  const pct = Math.round((total / maxTotal) * 100);
  const grade =
    pct >= 90
      ? "A+"
      : pct >= 75
        ? "A"
        : pct >= 60
          ? "B"
          : pct >= 40
            ? "C"
            : "D";
  const gradeColor = pct >= 75 ? "#0fca8c" : pct >= 50 ? "#f0b429" : "#f0564a";
  addXP(Math.round(pct / 5), "Mock Test");
  app.innerHTML = `
    <style>@keyframes _mrIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}</style>
    <div style="animation:_mrIn .4s ease">
      <!-- Score hero -->
      <div style="background:linear-gradient(135deg,#1a1a3e,#2d1b69);border:1.5px solid rgba(240,180,41,0.3);border-radius:20px;padding:24px;text-align:center;margin-bottom:14px;position:relative;overflow:hidden">
        <div style="position:absolute;top:-40px;left:50%;transform:translateX(-50%);width:200px;height:200px;border-radius:50%;background:rgba(240,180,41,0.08);filter:blur(40px)"></div>
        <div style="font-size:3rem;font-weight:900;color:${gradeColor};text-shadow:0 0 30px ${gradeColor}88;margin-bottom:4px">${grade}</div>
        <div style="font-size:1.5rem;font-weight:900;color:#fff;margin-bottom:4px">${total}/${maxTotal}</div>
        <div style="font-size:0.82rem;color:rgba(255,255,255,0.5);margin-bottom:16px">${pct}% · +${Math.round(pct / 5)} XP earned</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          ${[
            {
              l: "Section A",
              v: `${r.secA || 0}/${r.maxA || 0}`,
              c: "#4f8ef7",
            },
            {
              l: "Section B",
              v: `${r.secB || 0}/${r.maxB || 0}`,
              c: "#9b6dff",
            },
            {
              l: "Section C",
              v: `${r.secC || 0}/${r.maxC || 0}`,
              c: "#0fca8c",
            },
          ]
            .map(
              (s) => `
          <div style="background:${s.c}12;border:1px solid ${s.c}25;border-radius:10px;padding:10px">
            <div style="font-size:1.1rem;font-weight:900;color:${s.c}">${s.v}</div>
            <div style="font-size:0.65rem;color:rgba(255,255,255,0.5);margin-top:2px">${s.l}</div>
          </div>`,
            )
            .join("")}
        </div>
      </div>
      <!-- Feedback -->
      ${
        r.feedback
          ? `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px 16px;margin-bottom:14px">
        <div style="font-size:0.68rem;font-weight:900;letter-spacing:0.08em;color:#f0b429;text-transform:uppercase;margin-bottom:8px">🤖 AI Feedback</div>
        <div style="font-size:0.85rem;line-height:1.65;color:var(--text-secondary)">${escapeHtml(r.feedback)}</div>
      </div>`
          : ""
      }
      <!-- Weak areas -->
      ${
        r.weakAreas && r.weakAreas.length
          ? `<div style="background:rgba(240,86,74,0.06);border:1px solid rgba(240,86,74,0.2);border-radius:14px;padding:14px 16px;margin-bottom:14px">
        <div style="font-size:0.68rem;font-weight:900;letter-spacing:0.08em;color:#f0564a;text-transform:uppercase;margin-bottom:8px">⚠️ Weak Areas</div>
        ${r.weakAreas.map((w) => `<div style="font-size:0.84rem;color:var(--text-secondary);padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;gap:8px"><span style="color:#f0564a;flex-shrink:0">•</span>${escapeHtml(w)}</div>`).join("")}
      </div>`
          : ""
      }
      <!-- Detailed answers -->
      ${
        r.detailed && r.detailed.length
          ? `<div style="margin-bottom:14px">
        <div style="font-size:0.68rem;font-weight:900;letter-spacing:0.08em;color:var(--text-muted);text-transform:uppercase;margin-bottom:10px">📋 Question Review</div>
        ${r.detailed
          .map(
            (
              d,
              i,
            ) => `<div style="background:${d.correct ? "rgba(15,202,140,0.06)" : "rgba(240,86,74,0.06)"};border:1.5px solid ${d.correct ? "rgba(15,202,140,0.25)" : "rgba(240,86,74,0.25)"};border-radius:12px;padding:12px 14px;margin-bottom:8px">
          <div style="display:flex;gap:8px;align-items:flex-start">
            <span style="font-size:1rem;flex-shrink:0">${d.correct ? "✅" : "❌"}</span>
            <div>
              <div style="font-size:0.82rem;font-weight:700;color:var(--text);margin-bottom:4px">${escapeHtml(d.question || "")}</div>
              ${!d.correct ? `<div style="font-size:0.78rem;color:#0fca8c">✓ ${escapeHtml(d.correctAnswer || "")}</div>` : ""}
              ${d.comment ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">${escapeHtml(d.comment)}</div>` : ""}
            </div>
          </div>
        </div>`,
          )
          .join("")}
      </div>`
          : ""
      }
      <div style="display:flex;gap:10px">
        <button onclick="renderMockTestSetup()" class="btn btn-primary" style="flex:1;padding:13px;background:linear-gradient(135deg,#f0b429,#f97316);border:none">Try Again</button>
        <button onclick="navigate('home')" class="btn btn-secondary" style="flex:1;padding:13px">Home</button>
      </div>
    </div>
  `;
}
window.renderMockTestSetup = renderMockTestSetup;

// ============================================================
// MIND MAP
// ============================================================
function renderMindMapSetup() {
  const app = document.getElementById("app");
  const subjects = [
    "Maths",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Geography",
    "Civics",
    "Economics",
    "English",
    "Hindi",
  ];
  const cls = S.classPreference || "10";
  const subj = S.subjectPreference || "Maths";
  const chapters = getChapters(cls, subj);
  app.innerHTML = `
    <button onclick="navigate('home')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;padding:0;font-family:inherit;margin-bottom:18px;display:block">‹ Back</button>
    <div style="font-size:1.4rem;font-weight:900;background:linear-gradient(135deg,#9b6dff,#4f8ef7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px">🧠 Mind Map</div>
    <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:24px">AI generates an interactive visual topic breakdown</div>
    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><label class="form-label">Class</label>
          <select id="mm-class" class="form-select" style="margin-top:4px" onchange="updateMmChapters()">
            ${["6", "7", "8", "9", "10"].map((c) => `<option value="${c}" ${cls === c ? "selected" : ""}>${c}</option>`).join("")}
          </select></div>
        <div><label class="form-label">Subject</label>
          <select id="mm-subject" class="form-select" style="margin-top:4px" onchange="updateMmChapters()">
            ${subjects.map((s) => `<option value="${s}" ${subj === s ? "selected" : ""}>${s}</option>`).join("")}
          </select></div>
      </div>
      <div><label class="form-label">Chapter</label>
        <select id="mm-chapter" class="form-select" style="margin-top:4px">
          <option value="">Select chapter</option>
          ${chapters.map((c) => `<option value="${c}">${c}</option>`).join("")}
        </select></div>
    </div>
    <button onclick="generateMindMap()" class="btn btn-primary" style="width:100%;padding:14px;font-size:1rem;font-weight:900;background:linear-gradient(135deg,#9b6dff,#4f8ef7);border:none;box-shadow:0 4px 20px rgba(155,109,255,0.4)">Generate Mind Map →</button>
    <div id="mm-err" style="color:var(--red);font-size:0.82rem;margin-top:10px;text-align:center"></div>
  `;
  window.updateMmChapters = () => {
    const sel = document.getElementById("mm-chapter");
    const chs = getChapters(
      document.getElementById("mm-class").value,
      document.getElementById("mm-subject").value,
    );
    sel.innerHTML =
      `<option value="">Select chapter</option>` +
      chs.map((c) => `<option value="${c}">${c}</option>`).join("");
  };
}

window.generateMindMap = async () => {
  const classNum = document.getElementById("mm-class").value;
  const subject = document.getElementById("mm-subject").value;
  const chapter = document.getElementById("mm-chapter").value;
  const err = document.getElementById("mm-err");
  if (!chapter) {
    if (err) err.textContent = "Please select a chapter";
    return;
  }
  const app = document.getElementById("app");
  app.innerHTML = `<div style="text-align:center;padding:60px 20px">${typingLoader()}<div style="font-size:0.85rem;color:var(--text-muted);margin-top:12px">Building mind map...</div></div>`;
  try {
    const data = await apiPost("/mind-map", {
      classNum,
      subject,
      chapter,
      lang: getLanguage(),
    });
    renderMindMapSVG(data.tree, chapter, subject);
  } catch (e) {
    app.innerHTML = `<div style="padding:20px;color:var(--red)">Error: ${e.message}<br><br><button class="btn btn-secondary btn-sm" onclick="renderMindMapSetup()">Back</button></div>`;
  }
};

function renderMindMapSVG(tree, chapter, subject) {
  const app = document.getElementById("app");
  const COLORS = [
    "#9b6dff",
    "#4f8ef7",
    "#0fca8c",
    "#f0b429",
    "#f0564a",
    "#ec4899",
    "#06b6d4",
    "#a78bfa",
  ];
  const branches = tree.children || [];

  /* ── HORIZONTAL TREE LAYOUT ─────────────────────────────────────────────
     Center node in the middle. Left half of branches go left, right half go right.
     Each branch fans its children vertically.
     Nodes are pills (rounded-rect) with text that always fits.
  ─────────────────────────────────────────────────────────────────────── */
  const PW = 110,
    PH = 32; // branch pill w/h
  const LW = 84,
    LH = 24; // leaf pill w/h
  const CW = 120,
    CH = 44; // center pill w/h
  const COL_GAP = 90; // horizontal gap between center→branch and branch→leaf
  const ROW_GAP = 14; // vertical gap between sibling pills

  // Split branches: right side and left side
  const n = branches.length;
  const rightBranches = branches.filter((_, i) => i % 2 === 0);
  const leftBranches = branches.filter((_, i) => i % 2 !== 0);

  // Compute total height needed for each side
  function branchBlockH(br) {
    const kids = br.children || [];
    const kidsH = kids.length * (LH + ROW_GAP) - ROW_GAP;
    return Math.max(PH, kidsH);
  }
  function sideH(brs) {
    return brs.reduce((s, b) => s + branchBlockH(b) + ROW_GAP, -ROW_GAP);
  }
  const rightH = sideH(rightBranches);
  const leftH = sideH(leftBranches);
  const totalH = Math.max(rightH, leftH, CH) + 80;

  // Canvas width: center + left-side + right-side
  const sideW = COL_GAP + PW + COL_GAP + LW;
  const totalW = CW + sideW * 2 + 40;
  const CX = totalW / 2,
    CY = totalH / 2;

  const nodes = [],
    edges = [];
  let nodeId = 0;

  // Center node
  nodes.push({
    id: nodeId++,
    x: CX - CW / 2,
    y: CY - CH / 2,
    w: CW,
    h: CH,
    label: tree.label || chapter,
    color: "#9b6dff",
    type: "center",
    branchIdx: -1,
    desc: "",
  });

  function layoutSide(brs, dir) {
    // dir = +1 for right, -1 for left
    const totalBlockH = sideH(brs);
    let cy = CY - totalBlockH / 2;
    brs.forEach((branch, li) => {
      const bi = branches.indexOf(branch);
      const col = COLORS[(bi + 1) % COLORS.length];
      const blockH = branchBlockH(branch);
      const bcy = cy + blockH / 2;
      const bx = dir === 1 ? CX + CW / 2 + COL_GAP : CX - CW / 2 - COL_GAP - PW;
      const by = bcy - PH / 2;
      const bNode = {
        id: nodeId++,
        x: bx,
        y: by,
        w: PW,
        h: PH,
        label: branch.label,
        color: col,
        type: "branch",
        branchIdx: bi,
        desc: branch.desc || "",
        children: [],
        dir,
      };
      nodes.push(bNode);
      // edge: center → branch
      edges.push({
        x1: dir === 1 ? CX + CW / 2 : CX - CW / 2,
        y1: CY,
        x2: dir === 1 ? bx : bx + PW,
        y2: bcy,
        color: col,
        w: 2.5,
        dash: false,
      });
      const kids = branch.children || [];
      const kidsH = kids.length * (LH + ROW_GAP) - ROW_GAP;
      let lcy = bcy - kidsH / 2;
      kids.forEach((child, ci) => {
        const lx = dir === 1 ? bx + PW + COL_GAP : bx - COL_GAP - LW;
        const ly = lcy;
        const lNode = {
          id: nodeId++,
          x: lx,
          y: ly,
          w: LW,
          h: LH,
          label: child.label,
          color: col,
          type: "leaf",
          branchIdx: bi,
          desc: child.desc || "",
          dir,
        };
        nodes.push(lNode);
        bNode.children.push(lNode.id);
        edges.push({
          x1: dir === 1 ? bx + PW : bx,
          y1: bcy,
          x2: dir === 1 ? lx : lx + LW,
          y2: lcy + LH / 2,
          color: col,
          w: 1.5,
          dash: true,
        });
        lcy += LH + ROW_GAP;
      });
      cy += blockH + ROW_GAP;
    });
  }
  layoutSide(rightBranches, 1);
  layoutSide(leftBranches, -1);

  // ── SVG helpers ──────────────────────────────────────────────────────────
  function pill(x, y, w, h, r) {
    return `M${x + r},${y} h${w - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - 2 * r} a${r},${r} 0 0 1 -${r},${r} h-${w - 2 * r} a${r},${r} 0 0 1 -${r},-${r} v-${h - 2 * r} a${r},${r} 0 0 1 ${r},-${r} z`;
  }

  function fitText(label, maxW, fs) {
    // Returns tspan lines fitting maxW at given font-size (approx 0.58 * fs per char)
    const cpl = Math.floor(maxW / (fs * 0.56));
    const words = label.split(" ");
    const ls = [];
    let cur = "";
    words.forEach((w) => {
      const test = cur ? cur + " " + w : w;
      if (test.length > cpl && cur) {
        ls.push(cur);
        cur = w;
      } else cur = test;
    });
    if (cur) ls.push(cur);
    return ls;
  }

  function bezierPath(x1, y1, x2, y2, dash) {
    const dx = Math.abs(x2 - x1) * 0.55;
    return `M${x1},${y1} C${x1 + dx * (x2 > x1 ? 1 : -1)},${y1} ${x2 - dx * (x2 > x1 ? 1 : -1)},${y2} ${x2},${y2}`;
  }

  // Measure SVG bounding box (add padding)
  const PAD = 20;
  const allX = nodes.map((n) => n.x).concat(nodes.map((n) => n.x + n.w));
  const allY = nodes.map((n) => n.y).concat(nodes.map((n) => n.y + n.h));
  const minX = Math.min(...allX) - PAD,
    maxX = Math.max(...allX) + PAD;
  const minY = Math.min(...allY) - PAD,
    maxY = Math.max(...allY) + PAD;
  const VW = maxX - minX,
    VH = maxY - minY;

  // ── DEFS ─────────────────────────────────────────────────────────────────
  const defs = `<defs>
    <filter id="mmSh" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000" flood-opacity="0.45"/>
    </filter>
    <filter id="mmGl" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    ${COLORS.map(
      (c, i) => `
    <linearGradient id="mmLG${i}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${c}" stop-opacity="0.08"/>
    </linearGradient>
    <linearGradient id="mmSL${i}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${c}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${c}" stop-opacity="0.3"/>
    </linearGradient>`,
    ).join("")}
    <linearGradient id="mmCG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9b6dff" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#4f8ef7" stop-opacity="0.18"/>
    </linearGradient>
    <linearGradient id="mmCS" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#9b6dff"/><stop offset="100%" stop-color="#4f8ef7"/>
    </linearGradient>
  </defs>`;

  // ── EDGES ───────────────────────────l<�────────────────────────────────────
  const edgeSVG = edges
    .map((e, i) => {
      const ci = COLORS.indexOf(e.color);
      const gradId = `mmSL${Math.max(0, ci)}`;
      const path = bezierPath(e.x1, e.y1, e.x2, e.y2, e.dash);
      return `<path d="${path}" fill="none" stroke="${e.color}" stroke-width="${e.w}"
      stroke-opacity="${e.dash ? 0.5 : 0.8}" ${e.dash ? 'stroke-dasharray="4,3"' : ""}
      style="animation:mmDraw .7s ease ${(i * 0.04).toFixed(2)}s both"/>`;
    })
    .join("");

  // ── NODES ────────────────────────────────────────────────────────────────
  const nodeSVG = nodes
    .map((n, idx) => {
      const isCenter = n.type === "center";
      const isLeaf = n.type === "leaf";
      const ci = isCenter ? -1 : COLORS.indexOf(n.color);
      const fillId = isCenter ? "mmCG" : `mmLG${Math.max(0, ci)}`;
      const strokeId = isCenter ? "mmCS" : n.color;
      const r = isCenter ? 12 : isLeaf ? 6 : 8;
      const fs = isCenter ? 11.5 : isLeaf ? 9 : 10;
      const sw = isCenter ? 2.5 : isLeaf ? 1 : 1.8;
      const pw = n.w,
        ph = n.h;
      const lines = fitText(n.label, pw - 12, fs);
      const lh = fs * 1.3;
      const textY = n.y + ph / 2 - ((lines.length - 1) * lh) / 2;
      const delay = (idx * 0.06).toFixed(2);

      const strokeAttr = isCenter
        ? `stroke="url(#mmCS)"`
        : `stroke="${n.color}"`;
      const fillAttr = `fill="url(#${fillId})"`;

      return `<g id="mmN${n.id}" onclick="mmTapNode(${n.id})" style="cursor:pointer;animation:mmPop .5s cubic-bezier(.34,1.56,.64,1) ${delay}s both">
      <path d="${pill(n.x, n.y, pw, ph, r)}" ${fillAttr} ${strokeAttr} stroke-width="${sw}" ${isCenter ? 'filter="url(#mmSh)"' : ""}/>
      ${isCenter ? `<path d="${pill(n.x - 4, n.y - 4, pw + 8, ph + 8, r + 4)}" fill="none" stroke="url(#mmCS)" stroke-width="1" stroke-opacity="0.2" stroke-dasharray="4,4"/>` : ""}
      ${lines
        .map(
          (
            l,
            li,
          ) => `<text x="${n.x + pw / 2}" y="${textY + li * lh}" text-anchor="middle" dominant-baseline="middle"
        fill="${isCenter ? "#fff" : n.color}" font-size="${fs}" font-weight="${isCenter ? "900" : isLeaf ? "600" : "800"}"
        font-family="system-ui,-apple-system,sans-serif"
        paint-order="stroke" stroke="rgba(0,0,0,0.6)" stroke-width="2.5">${escapeHtml(l)}</text>`,
        )
        .join("")}
    </g>`;
    })
    .join("");

  // ── RENDER ───────────────────────────────────────────────────────────────
  app.innerHTML = `
    <style>
      @keyframes mmPop{from{opacity:0;transform-box:fill-box;transform-origin:center;transform:scale(0.2)}to{opacity:1;transform:scale(1)}}
      @keyframes mmDraw{from{opacity:0;stroke-dashoffset:300}to{opacity:1;stroke-dashoffset:0}}
      @keyframes mmSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      #mmN0 path:first-child{transition:filter .2s}
      .mm-tap{filter:brightness(1.35)!important}
      #mm-detail{animation:mmSlide .22s ease}
    </style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <button onclick="renderMindMapSetup()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;padding:0;font-family:inherit;flex-shrink:0">‹ Back</button>
      <div style="flex:1;min-width:0">
        <div style="font-size:0.98rem;font-weight:900;background:linear-gradient(135deg,#9b6dff,#4f8ef7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">🧠 ${escapeHtml(chapter)}</div>
        <div style="font-size:0.7rem;color:var(--text-muted)">${escapeHtml(subject)} · tap node to expand · pinch/scroll to zoom</div>
      </div>
      <div style="display:flex;gap:5px;flex-shrink:0">
        <button onclick="mmZoom(1.3)" title="Zoom in" style="background:rgba(155,109,255,0.12);border:1px solid rgba(155,109,255,0.3);color:#9b6dff;border-radius:8px;width:28px;height:28px;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;font-family:inherit;font-weight:900">+</button>
        <button onclick="mmZoom(0.77)" title="Zoom out" style="background:rgba(155,109,255,0.12);border:1px solid rgba(155,109,255,0.3);color:#9b6dff;border-radius:8px;width:28px;height:28px;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;font-family:inherit;font-weight:900">−</button>
        <button onclick="mmReset()" title="Reset" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:var(--text-muted);border-radius:8px;width:28px;height:28px;cursor:pointer;font-size:0.75rem;display:flex;align-items:center;justify-content:center;font-family:inherit">↺</button>
      </div>
    </div>

    <div id="mm-wrap" style="background:rgba(255,255,255,0.015);border:1px solid rgba(255,255,255,0.08);border-radius:18px;overflow:hidden;touch-action:none;position:relative;height:${Math.min(VH, 360)}px">
      <svg id="mm-svg" viewBox="${minX} ${minY} ${VW} ${VH}" xmlns="http://www.w3.org/2000/svg"
        style="width:100%;height:100%;display:block;cursor:grab;user-select:none">
        ${defs}
        <g id="mm-g">
          ${edgeSVG}
          ${nodeSVG}
        </g>
      </svg>
    </div>

    <!-- Tap detail card -->
    <div id="mm-detail" style="display:none;margin-top:12px"></div>

    <!-- Branch pills legend -->
    <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px">
      ${branches
        .map(
          (b, i) => `<button onclick="mmJumpBranch(${i})"
        style="display:flex;align-items:center;gap:5px;padding:4px 11px;border-radius:20px;border:1.5px solid ${COLORS[(i + 1) % COLORS.length]}55;background:${COLORS[(i + 1) % COLORS.length]}12;color:${COLORS[(i + 1) % COLORS.length]};font-size:0.7rem;font-weight:800;cursor:pointer;font-family:inherit;transition:background .15s"
        onmouseover="this.style.background='${COLORS[(i + 1) % COLORS.length]}28'"
        onmouseout="this.style.background='${COLORS[(i + 1) % COLORS.length]}12'">
        <span style="width:6px;height:6px;border-radius:50%;background:${COLORS[(i + 1) % COLORS.length]};flex-shrink:0"></span>${escapeHtml(b.label)}
      </button>`,
        )
        .join("")}
    </div>
  `;

  // ── Store globals ────────────────────────────────────────────────────────
  window._mmNodes = nodes;
  window._mmBranches = branches;
  window._mmColors = COLORS;

  // ── Pan / Zoom ───────────────────────────────────────────────────────────
  let drag = false,
    lx = 0,
    ly = 0,
    tx = 0,
    ty = 0,
    sc = 1,
    pinchD = 0;
  const svg = document.getElementById("mm-svg");
  const g = document.getElementById("mm-g");
  const applyT = () =>
    g.setAttribute("transform", `translate(${tx},${ty}) scale(${sc})`);
  window.mmZoom = (f) => {
    sc = Math.max(0.3, Math.min(4, sc * f));
    applyT();
  };
  window.mmReset = () => {
    tx = 0;
    ty = 0;
    sc = 1;
    applyT();
    mmCloseDetail();
  };

  svg.addEventListener("mousedown", (e) => {
    drag = true;
    lx = e.clientX;
    ly = e.clientY;
    svg.style.cursor = "grabbing";
  });
  svg.addEventListener("mousemove", (e) => {
    if (!drag) return;
    tx += e.clientX - lx;
    ty += e.clientY - ly;
    lx = e.clientX;
    ly = e.clientY;
    applyT();
  });
  svg.addEventListener("mouseup", () => {
    drag = false;
    svg.style.cursor = "grab";
  });
  svg.addEventListener("mouseleave", () => {
    drag = false;
    svg.style.cursor = "grab";
  });
  svg.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      sc = Math.max(0.3, Math.min(4, sc * (e.deltaY < 0 ? 1.12 : 0.89)));
      applyT();
    },
    { passive: false },
  );
  svg.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 1) {
        drag = true;
        lx = e.touches[0].clientX;
        ly = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        drag = false;
        pinchD = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
      }
    },
    { passive: true },
  );
  svg.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length === 1 && drag) {
        tx += e.touches[0].clientX - lx;
        ty += e.touches[0].clientY - ly;
        lx = e.touches[0].clientX;
        ly = e.touches[0].clientY;
        applyT();
      } else if (e.touches.length === 2) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        sc = Math.max(0.3, Math.min(4, sc * (d / pinchD)));
        pinchD = d;
        applyT();
      }
    },
    { passive: true },
  );
  svg.addEventListener("touchend", () => {
    drag = false;
  });

  // ── Tap handlers ─────────────────────────────────────────────────────────
  window.mmCloseDetail = () => {
    const d = document.getElementById("mm-detail");
    if (d) {
      d.style.display = "none";
      d.innerHTML = "";
    }
  };

  window.mmTapNode = (id) => {
    const nd = window._mmNodes.find((x) => x.id === id);
    if (!nd) return;
    // flash
    const el = document.getElementById("mmN" + id);
    if (el) {
      el.classList.add("mm-tap");
      setTimeout(() => el.classList.remove("mm-tap"), 280);
    }
    const det = document.getElementById("mm-detail");
    if (!det) return;
    const brs = window._mmBranches;
    const col = nd.color || "#9b6dff";

    if (nd.type === "center") {
      det.style.display = "block";
      det.innerHTML = `<div style="background:rgba(155,109,255,0.08);border:1.5px solid rgba(155,109,255,0.25);border-radius:16px;padding:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="font-size:0.65rem;font-weight:900;letter-spacing:.1em;color:#9b6dff;text-transform:uppercase">🧠 Overview</div>
          <button onclick="mmCloseDetail()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.1rem;font-family:inherit;line-height:1">×</button>
        </div>
        <div style="font-size:0.9rem;font-weight:900;color:#fff;margin-bottom:10px">${escapeHtml(nd.label)}</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${brs
            .map(
              (
                b,
                i,
              ) => `<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:${COLORS[(i + 1) % COLORS.length]}10;border:1px solid ${COLORS[(i + 1) % COLORS.length]}25;border-radius:10px">
            <div style="display:flex;align-items:center;gap:7px"><span style="width:7px;height:7px;border-radius:50%;background:${COLORS[(i + 1) % COLORS.length]};flex-shrink:0"></span><span style="font-size:0.82rem;font-weight:800;color:${COLORS[(i + 1) % COLORS.length]}">${escapeHtml(b.label)}</span></div>
            <span style="font-size:0.68rem;color:var(--text-muted)">${(b.children || []).length} topics</span>
          </div>`,
            )
            .join("")}
        </div>
      </div>`;
      return;
    }
    const branch = brs[nd.branchIdx] || {};
    if (nd.type === "branch") {
      det.style.display = "block";
      det.innerHTML = `<div style="background:${col}0e;border:1.5px solid ${col}40;border-radius:16px;padding:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font-size:0.65rem;font-weight:900;letter-spacing:.1em;color:${col};text-transform:uppercase">🌿 Main Topic</div>
          <button onclick="mmCloseDetail()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.1rem;font-family:inherit;line-height:1">×</button>
        </div>
        <div style="font-size:1rem;font-weight:900;color:#fff;margin-bottom:${branch.desc ? "6px" : "10px"}">${escapeHtml(nd.label)}</div>
        ${branch.desc ? `<div style="font-size:0.8rem;color:var(--text-secondary);line-height:1.55;margin-bottom:10px">${escapeHtml(branch.desc)}</div>` : ""}
        ${
          (branch.children || []).length
            ? `
          <div style="font-size:0.63rem;font-weight:900;letter-spacing:.1em;color:${col};text-transform:uppercase;margin-bottom:7px">Subtopics</div>
          <div style="display:flex;flex-direction:column;gap:5px">
            ${(branch.children || [])
              .map(
                (
                  c,
                ) => `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(255,255,255,0.04);border-radius:9px">
              <span style="width:4px;height:4px;border-radius:50%;background:${col};flex-shrink:0"></span>
              <span style="font-size:0.82rem;color:var(--text-secondary)">${escapeHtml(c.label)}</span>
            </div>`,
              )
              .join("")}
          </div>`
            : ""
        }
      </div>`;
    } else {
      det.style.display = "block";
      det.innerHTML = `<div style="background:${col}0e;border:1.5px solid ${col}40;border-radius:16px;padding:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font-size:0.65rem;font-weight:900;letter-spacing:.1em;color:${col};text-transform:uppercase">📌 Subtopic</div>
          <button onclick="mmCloseDetail()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.1rem;font-family:inherit;line-height:1">×</button>
        </div>
        <div style="font-size:1rem;font-weight:900;color:#fff;margin-bottom:4px">${escapeHtml(nd.label)}</div>
        <div style="font-size:0.75rem;color:${col};font-weight:700;margin-bottom:${nd.desc ? "8px" : "0"}">part of ${escapeHtml(branch.label || "")}</div>
        ${nd.desc ? `<div style="font-size:0.8rem;color:var(--text-secondary);line-height:1.55">${escapeHtml(nd.desc)}</div>` : ""}
      </div>`;
    }
  };

  window.mmJumpBranch = (bi) => {
    const bNode = nodes.find((n) => n.type === "branch" && n.branchIdx === bi);
    if (bNode) window.mmTapNode(bNode.id);
    document
      .getElementById("mm-wrap")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
}

window.renderMindMapSetup = renderMindMapSetup;

// ============================================================
// FLASHCARDS
// ============================================================
let _fcState = null;

function renderFlashcardsSetup() {
  const app = document.getElementById("app");
  const subjects = [
    "Maths",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Geography",
    "Civics",
    "Economics",
    "English",
    "Hindi",
  ];
  const cls = S.classPreference || "10";
  const subj = S.subjectPreference || "Maths";
  const chapters = getChapters(cls, subj);
  app.innerHTML = `
    <button onclick="navigate('home')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;padding:0;font-family:inherit;margin-bottom:18px;display:block">‹ Back</button>
    <div style="font-size:1.4rem;font-weight:900;background:linear-gradient(135deg,#0fca8c,#4f8ef7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px">🃏 Flashcards</div>
    <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:24px">Spaced repetition · Flip to reveal · Earn XP on deck completion</div>
    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><label class="form-label">Class</label>
          <select id="fc-class" class="form-select" style="margin-top:4px" onchange="updateFcChapters()">
            ${["6", "7", "8", "9", "10"].map((c) => `<option value="${c}" ${cls === c ? "selected" : ""}>${c}</option>`).join("")}
          </select></div>
        <div><label class="form-label">Subject</label>
          <select id="fc-subject" class="form-select" style="margin-top:4px" onchange="updateFcChapters()">
            ${subjects.map((s) => `<option value="${s}" ${subj === s ? "selected" : ""}>${s}</option>`).join("")}
          </select></div>
      </div>
      <div><label class="form-label">Chapter</label>
        <select id="fc-chapter" class="form-select" style="margin-top:4px">
          <option value="">Select chapter</option>
          ${chapters.map((c) => `<option value="${c}">${c}</option>`).join("")}
        </select></div>
      <div>
        <label class="form-label" style="margin-bottom:8px">Number of Cards</label>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          ${[10, 15, 20]
            .map(
              (
                n,
                i,
              ) => `<button onclick="fcPickCount(${n},this)" style="border-radius:12px;padding:12px 8px;cursor:pointer;border:2px solid ${i === 0 ? "#0fca8c" : "rgba(255,255,255,0.1)"};background:${i === 0 ? "rgba(15,202,140,0.12)" : "rgba(255,255,255,0.04)"};text-align:center;font-family:inherit;transition:all .2s;box-shadow:${i === 0 ? "0 0 14px rgba(15,202,140,0.3)" : "none"}" id="fc-count-${n}">
            <div style="font-size:1.4rem;font-weight:900;color:${i === 0 ? "#0fca8c" : "var(--text)"}">${n}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">cards</div>
          </button>`,
            )
            .join("")}
        </div>
      </div>
    </div>
    <button onclick="generateFlashcards()" class="btn btn-primary" style="width:100%;padding:14px;font-size:1rem;font-weight:900;background:linear-gradient(135deg,#0fca8c,#4f8ef7);border:none;box-shadow:0 4px 20px rgba(15,202,140,0.4)">Generate Flashcards →</button>
    <div id="fc-err" style="color:var(--red);font-size:0.82rem;margin-top:10px;text-align:center"></div>
  `;
  window._fcCount = 10;
  window.fcPickCount = (n, btn) => {
    window._fcCount = n;
    [10, 15, 20].forEach((v) => {
      const b = document.getElementById("fc-count-" + v);
      if (!b) return;
      b.style.borderColor = "rgba(255,255,255,0.1)";
      b.style.background = "rgba(255,255,255,0.04)";
      b.style.boxShadow = "none";
      b.querySelector("div:first-child").style.color = "var(--text)";
    });
    btn.style.borderColor = "#0fca8c";
    btn.style.background = "rgba(15,202,140,0.12)";
    btn.style.boxShadow = "0 0 14px rgba(15,202,140,0.3)";
    btn.querySelector("div:first-child").style.color = "#0fca8c";
  };
  window.updateFcChapters = () => {
    const sel = document.getElementById("fc-chapter");
    const chs = getChapters(
      document.getElementById("fc-class").value,
      document.getElementById("fc-subject").value,
    );
    sel.innerHTML =
      `<option value="">Select chapter</option>` +
      chs.map((c) => `<option value="${c}">${c}</option>`).join("");
  };
}

window.generateFlashcards = async () => {
  const classNum = document.getElementById("fc-class").value;
  const subject = document.getElementById("fc-subject").value;
  const chapter = document.getElementById("fc-chapter").value;
  const count = window._fcCount || 10;
  const err = document.getElementById("fc-err");
  if (!chapter) {
    if (err) err.textContent = "Please select a chapter";
    return;
  }
  const app = document.getElementById("app");
  app.innerHTML = `<div style="text-align:center;padding:60px 20px">${typingLoader()}<div style="font-size:0.85rem;color:var(--text-muted);margin-top:12px">Creating flashcards...</div></div>`;
  try {
    const data = await apiPost("/flashcards", {
      classNum,
      subject,
      chapter,
      count,
      lang: getLanguage(),
    });
    _fcState = {
      cards: data.cards,
      current: 0,
      flipped: false,
      due: data.cards.map((_, i) => i), // spaced repetition queue
      ease: {},
      lapses: {},
      chapter,
      subject,
      classNum,
    };
    renderFlashcard();
  } catch (e) {
    app.innerHTML = `<div style="padding:20px;color:var(--red)">Error: ${e.message}<br><br><button class="btn btn-secondary btn-sm" onclick="renderFlashcardsSetup()">Back</button></div>`;
  }
};

function renderFlashcard() {
  if (!_fcState || _fcState.due.length === 0) {
    renderFlashcardComplete();
    return;
  }
  const app = document.getElementById("app");
  const { cards, due, current: ci, chapter, subject } = _fcState;
  const idx = due[0];
  const card = cards[idx];
  const done = cards.length - due.length;
  const pct = Math.round((done / cards.length) * 100);
  app.innerHTML = `
    <style>
      @keyframes _fcFlip{0%{transform:rotateY(0deg)}50%{transform:rotateY(90deg)}100%{transform:rotateY(0deg)}}
      @keyframes _fcPop{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
      ._fccard{perspective:1000px;cursor:pointer;animation:_fcPop .3s ease}
      ._fcinner{position:relative;min-height:200px;transform-style:preserve-3d;transition:transform 0.5s ease}
      ._fcinner.flipped{transform:rotateY(180deg)}
      ._fcfront,._fcback{position:absolute;inset:0;backface-visibility:hidden;border-radius:18px;padding:28px 22px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
      ._fcfront{background:linear-gradient(135deg,rgba(15,202,140,0.12),rgba(79,142,247,0.08));border:1.5px solid rgba(15,202,140,0.3)}
      ._fcback{background:linear-gradient(135deg,rgba(79,142,247,0.12),rgba(155,109,255,0.08));border:1.5px solid rgba(79,142,247,0.3);transform:rotateY(180deg)}
    </style>
    <button onclick="renderFlashcardsSetup()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;padding:0;font-family:inherit;margin-bottom:14px;display:block">‹ Back</button>
    <!-- Progress -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <div style="font-size:0.78rem;font-weight:800;color:var(--text-muted)">🃏 ${done}/${cards.length} done</div>
      <div style="font-size:0.78rem;color:var(--text-muted)">${subject} · ${chapter}</div>
    </div>
    <div style="height:5px;background:rgba(255,255,255,0.07);border-radius:100px;margin-bottom:20px;overflow:hidden">
      <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#0fca8c,#4f8ef7);border-radius:100px;transition:width .5s"></div>
    </div>
    <!-- Card -->
    <div class="_fccard" onclick="flipFlashcard()" id="fc-card-wrap">
      <div class="_fcinner" id="fc-inner">
        <div class="_fcfront">
          <div style="font-size:0.65rem;font-weight:900;letter-spacing:0.1em;color:#0fca8c;text-transform:uppercase;margin-bottom:14px">Question — tap to flip</div>
          <div style="font-size:1rem;font-weight:700;line-height:1.65;color:#fff">${escapeHtml(card.front)}</div>
          <div style="margin-top:18px;font-size:1.5rem">👆</div>
        </div>
        <div class="_fcback">
          <div style="font-size:0.65rem;font-weight:900;letter-spacing:0.1em;color:#4f8ef7;text-transform:uppercase;margin-bottom:14px">Answer</div>
          <div style="font-size:0.95rem;font-weight:600;line-height:1.65;color:#fff">${escapeHtml(card.back)}</div>
          ${card.hint ? `<div style="margin-top:10px;font-size:0.78rem;color:rgba(255,255,255,0.5);font-style:italic">💡 ${escapeHtml(card.hint)}</div>` : ""}
        </div>
      </div>
    </div>
    <!-- Spaced rep buttons (shown after flip) -->
    <div id="fc-actions" style="display:none;margin-top:16px;display:none">
      <div style="font-size:0.75rem;font-weight:800;color:var(--text-muted);text-align:center;margin-bottom:10px">How well did you know this?</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        <button onclick="fcRespond('again')" style="border-radius:14px;padding:12px;cursor:pointer;border:1.5px solid rgba(240,86,74,0.4);background:rgba(240,86,74,0.1);color:#f0564a;font-size:0.82rem;font-weight:800;font-family:inherit;transition:all .2s" onmouseover="this.style.background='rgba(240,86,74,0.2)'" onmouseout="this.style.background='rgba(240,86,74,0.1)'">🔁 Again</button>
        <button onclick="fcRespond('hard')" style="border-radius:14px;padding:12px;cursor:pointer;border:1.5px solid rgba(240,180,41,0.4);background:rgba(240,180,41,0.1);color:#f0b429;font-size:0.82rem;font-weight:800;font-family:inherit;transition:all .2s" onmouseover="this.style.background='rgba(240,180,41,0.2)'" onmouseout="this.style.background='rgba(240,180,41,0.1)'">😅 Hard</button>
        <button onclick="fcRespond('easy')" style="border-radius:14px;padding:12px;cursor:pointer;border:1.5px solid rgba(15,202,140,0.4);background:rgba(15,202,140,0.1);color:#0fca8c;font-size:0.82rem;font-weight:800;font-family:inherit;transition:all .2s" onmouseover="this.style.background='rgba(15,202,140,0.2)'" onmouseout="this.style.background='rgba(15,202,140,0.1)'">✅ Easy</button>
      </div>
    </div>
    <!-- Mini deck preview -->
    <div style="margin-top:14px;display:flex;gap:4px;flex-wrap:wrap;justify-content:center">
      ${cards
        .map((_, i) => {
          const isDue = due.includes(i);
          return `<div style="width:12px;height:12px;border-radius:3px;background:${i === idx ? "#0fca8c" : isDue ? "rgba(255,255,255,0.12)" : "rgba(15,202,140,0.4)"}"></div>`;
        })
        .join("")}
    </div>
  `;
}

window.flipFlashcard = () => {
  const inner = document.getElementById("fc-inner");
  const actions = document.getElementById("fc-actions");
  if (!inner) return;
  _fcState.flipped = !_fcState.flipped;
  if (_fcState.flipped) {
    inner.classList.add("flipped");
    if (actions) actions.style.display = "grid";
  } else {
    inner.classList.remove("flipped");
    if (actions) actions.style.display = "none";
  }
};

window.fcRespond = (rating) => {
  const { due, ease, lapses } = _fcState;
  const idx = due[0];
  // Spaced repetition: Again → back to end, Hard → back at position 3, Easy → remove from queue
  due.shift();
  if (rating === "again") {
    lapses[idx] = (lapses[idx] || 0) + 1;
    due.push(idx); // back to end
  } else if (rating === "hard") {
    lapses[idx] = (lapses[idx] || 0) + 0.5;
    due.splice(Math.min(3, due.length), 0, idx); // insert at pos 3
  }
  // easy → removed from due (card "learned")
  ease[idx] = rating;
  _fcState.flipped = false;
  renderFlashcard();
};

function renderFlashcardComplete() {
  const app = document.getElementById("app");
  const { cards, ease, lapses } = _fcState;
  const learned = Object.values(ease).filter((v) => v === "easy").length;
  const hard = Object.values(ease).filter((v) => v === "hard").length;
  const again = Object.values(lapses).filter((v) => v >= 1).length;
  const xp = Math.round(learned * 2 + hard * 1);
  addXP(xp, "Flashcards");
  app.innerHTML = `
    <div style="text-align:center;padding:20px 0">
      <div style="font-size:3rem;margin-bottom:12px">🎉</div>
      <div style="font-size:1.5rem;font-weight:900;color:#fff;margin-bottom:4px">Deck Complete!</div>
      <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:24px">+${xp} XP earned</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:24px">
        <div style="background:rgba(15,202,140,0.1);border:1px solid rgba(15,202,140,0.3);border-radius:14px;padding:16px">
          <div style="font-size:1.6rem;font-weight:900;color:#0fca8c">${learned}</div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:3px">Learned ✅</div>
        </div>
        <div style="background:rgba(240,180,41,0.1);border:1px solid rgba(240,180,41,0.3);border-radius:14px;padding:16px">
          <div style="font-size:1.6rem;font-weight:900;color:#f0b429">${hard}</div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:3px">Hard 😅</div>
        </div>
        <div style="background:rgba(240,86,74,0.1);border:1px solid rgba(240,86,74,0.3);border-radius:14px;padding:16px">
          <div style="font-size:1.6rem;font-weight:900;color:#f0564a">${again}</div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:3px">Again 🔁</div>
        </div>
      </div>
      <div style="display:flex;gap:10px">
        <button onclick="generateFlashcards()" class="btn btn-primary" style="flex:1;padding:13px;background:linear-gradient(135deg,#0fca8c,#4f8ef7);border:none">Study Again</button>
        <button onclick="renderFlashcardsSetup()" class="btn btn-secondary" style="flex:1;padding:13px">New Deck</button>
      </div>
    </div>
  `;
}
window.renderFlashcardsSetup = renderFlashcardsSetup;

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
  // Award gems for top-3 finish (once per week per rank)
  if (myRank >= 1 && myRank <= 3) {
    const weekKey = `gem_league_${new Date().toISOString().slice(0, 10).slice(0, 7)}_r${myRank}`;
    if (!localStorage.getItem(weekKey)) {
      localStorage.setItem(weekKey, "1");
      const gemReward = 4 - myRank; // rank1=3, rank2=2, rank3=1
      S.gems = (S.gems || 0) + gemReward;
      saveState();
      updateHeader();
      setTimeout(
        () =>
          showXPFloat(
            `💎 +${gemReward} Gem${gemReward > 1 ? "s" : ""}! Top ${myRank}!`,
          ),
        600,
      );
    }
  }
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
    <style>
      @keyframes _glow{0%,100%{box-shadow:0 0 20px rgba(79,142,247,0.3)}50%{box-shadow:0 0 35px rgba(79,142,247,0.55)}}
      ._gcfg{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.09);border-radius:18px;padding:16px;margin-bottom:18px}
    </style>
    <div style="margin-bottom:18px">
      <div style="font-size:1.5rem;font-weight:900;background:linear-gradient(135deg,#4f8ef7,#9b6dff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px">${t("games_title")}</div>
      <div style="font-size:0.82rem;color:var(--text-muted)">${t("games_sub")}</div>
    </div>
    <div class="_gcfg">
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
    <div style="display:flex;flex-direction:column;gap:14px">
      <div onclick="showQuizPicker()" style="cursor:pointer;border-radius:20px;overflow:hidden;border:1.5px solid rgba(79,142,247,0.4);transition:all .25s" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 12px 40px rgba(79,142,247,0.3)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
        <div style="background:linear-gradient(135deg,rgba(79,142,247,0.25),rgba(79,142,247,0.08));padding:20px;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden">
          <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(79,142,247,0.15);filter:blur(30px)"></div>
          <div style="width:60px;height:60px;border-radius:16px;background:rgba(79,142,247,0.2);border:2px solid rgba(79,142,247,0.5);display:flex;align-items:center;justify-content:center;font-size:2rem;flex-shrink:0;box-shadow:0 0 20px rgba(79,142,247,0.3)">🧠</div>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="font-size:1.05rem;font-weight:900;color:#fff">${t("quiz_title")}</span>
              <span style="background:rgba(79,142,247,0.25);border:1px solid rgba(79,142,247,0.5);color:#93c5fd;font-size:0.62rem;font-weight:800;padding:2px 8px;border-radius:20px">MCQ</span>
            </div>
            <div style="font-size:0.78rem;color:rgba(255,255,255,0.55);margin-bottom:6px">${t("quiz_desc")}</div>
            <div style="font-size:0.75rem;font-weight:800;color:#4f8ef7">${t("quiz_xp")}</div>
          </div>
          <div style="font-size:1.5rem;color:rgba(79,142,247,0.7)">›</div>
        </div>
      </div>
      <div onclick="startGame('scramble')" style="cursor:pointer;border-radius:20px;overflow:hidden;border:1.5px solid rgba(155,109,255,0.4);transition:all .25s" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 12px 40px rgba(155,109,255,0.3)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
        <div style="background:linear-gradient(135deg,rgba(155,109,255,0.25),rgba(155,109,255,0.08));padding:20px;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden">
          <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(155,109,255,0.15);filter:blur(30px)"></div>
          <div style="width:60px;height:60px;border-radius:16px;background:rgba(155,109,255,0.2);border:2px solid rgba(155,109,255,0.5);display:flex;align-items:center;justify-content:center;font-size:2rem;flex-shrink:0;box-shadow:0 0 20px rgba(155,109,255,0.3)">🔤</div>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="font-size:1.05rem;font-weight:900;color:#fff">${t("scramble_title")}</span>
              <span style="background:rgba(155,109,255,0.25);border:1px solid rgba(155,109,255,0.5);color:#c4b5fd;font-size:0.62rem;font-weight:800;padding:2px 8px;border-radius:20px">WORD</span>
            </div>
            <div style="font-size:0.78rem;color:rgba(255,255,255,0.55);margin-bottom:6px">${t("scramble_desc")}</div>
            <div style="font-size:0.75rem;font-weight:800;color:#9b6dff">${t("scramble_xp")}</div>
          </div>
          <div style="font-size:1.5rem;color:rgba(155,109,255,0.7)">›</div>
        </div>
      </div>
      <div onclick="renderClassroomLobby()" style="cursor:pointer;border-radius:20px;overflow:hidden;border:1.5px solid rgba(240,180,41,0.4);transition:all .25s" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 12px 40px rgba(240,180,41,0.3)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
        <div style="background:linear-gradient(135deg,rgba(240,180,41,0.22),rgba(240,180,41,0.06));padding:20px;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden">
          <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(240,180,41,0.15);filter:blur(30px)"></div>
          <div style="width:60px;height:60px;border-radius:16px;background:rgba(240,180,41,0.2);border:2px solid rgba(240,180,41,0.5);display:flex;align-items:center;justify-content:center;font-size:2rem;flex-shrink:0;box-shadow:0 0 20px rgba(240,180,41,0.3)">🏫</div>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="font-size:1.05rem;font-weight:900;color:#fff">Classroom</span>
              <span style="background:rgba(240,180,41,0.25);border:1px solid rgba(240,180,41,0.5);color:#fcd34d;font-size:0.62rem;font-weight:800;padding:2px 8px;border-radius:20px">LIVE</span>
            </div>
            <div style="font-size:0.78rem;color:rgba(255,255,255,0.55);margin-bottom:6px">Create or join a room — quiz your friends live</div>
            <div style="font-size:0.75rem;font-weight:800;color:#f0b429">+XP for top rank 🏆</div>
          </div>
          <div style="font-size:1.5rem;color:rgba(240,180,41,0.7)">›</div>
        </div>
      </div>
      <div onclick="startGame('math')" style="cursor:pointer;border-radius:20px;overflow:hidden;border:1.5px solid rgba(15,202,140,0.4);transition:all .25s" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 12px 40px rgba(15,202,140,0.3)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
        <div style="background:linear-gradient(135deg,rgba(15,202,140,0.22),rgba(15,202,140,0.06));padding:20px;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden">
          <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(15,202,140,0.15);filter:blur(30px)"></div>
          <div style="width:60px;height:60px;border-radius:16px;background:rgba(15,202,140,0.2);border:2px solid rgba(15,202,140,0.5);display:flex;align-items:center;justify-content:center;font-size:2rem;flex-shrink:0;box-shadow:0 0 20px rgba(15,202,140,0.3)">🧮</div>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="font-size:1.05rem;font-weight:900;color:#fff">${t("math_title")}</span>
              <span style="background:rgba(15,202,140,0.2);border:1px solid rgba(15,202,140,0.5);color:#6ee7b7;font-size:0.62rem;font-weight:800;padding:2px 8px;border-radius:20px">SPEED</span>
            </div>
            <div style="font-size:0.78rem;color:rgba(255,255,255,0.55);margin-bottom:6px">${t("math_desc")}</div>
            <div style="font-size:0.75rem;font-weight:800;color:#0fca8c">${t("math_xp")}</div>
          </div>
          <div style="font-size:1.5rem;color:rgba(15,202,140,0.7)">›</div>
        </div>
      </div>
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
    _gameConfig = {
      classNum,
      subject,
      chapter,
      level: getPerf().level,
      difficulty: _gameConfig.difficulty || "medium",
      count: _gameConfig.count || 10,
    };
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
        difficulty: _gameConfig.difficulty || "medium",
        count: _gameConfig.count || 10,
      });
      navigate("quiz", { questions: data.questions || [], subject, chapter });
    } else if (type === "scramble") {
      const data = await apiPost("/scramble", { classNum, subject, chapter });
      navigate("scramble", { words: data.words || [], subject, chapter });
    } else if (type === "math") {
      const data = await apiPost("/mathchallenge", {
        classNum,
        chapter,
        count: _gameConfig.count || 10,
        difficulty: _gameConfig.difficulty || "medium",
      });
      navigate("math", { problems: data.problems || [], chapter });
    }
  } catch (e) {
    app2.innerHTML = `<div class="glass" style="padding:20px;color:var(--red)">Failed to load game: ${e.message}<br><br><button class="btn btn-secondary btn-sm" onclick="navigate('games')">Back</button></div>`;
  }
}

window.showQuizPicker = () => {
  const classNum =
    document.getElementById("gameClass")?.value || S.classPreference;
  const subject =
    document.getElementById("gameSubject")?.value || S.subjectPreference;
  const chapter =
    document.getElementById("gameChapter")?.value || S.chapterPreference;
  if (!chapter) {
    alert("Please select a chapter first!");
    return;
  }
  _gameConfig = {
    ..._gameConfig,
    classNum,
    subject,
    chapter,
    level: getPerf().level,
  };
  renderDifficultyPicker({
    title: "🧠 Quiz Battle",
    color: "#4f8ef7",
    backFn: "renderGames",
    onConfirm: () =>
      _launchGame(
        "quiz",
        _gameConfig.classNum,
        _gameConfig.subject,
        _gameConfig.chapter,
      ),
  });
};

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
    logQuestion({
      subject:
        document.getElementById("gameSubject")?.value || S.subjectPreference,
      chapter:
        document.getElementById("gameChapter")?.value || S.chapterPreference,
      correct: isCorrect,
      source: "game-quiz",
    });
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
  const isHi = getLanguage() === "hi";
  const TABS = [
    { id: "papers", label: isHi ? "📄 पेपर" : "📄 Papers" },
    { id: "trends", label: isHi ? "📊 PYQ" : "📊 PYQ" },
    { id: "notes", label: isHi ? "📒 नोट्स" : "📒 Notes" },
    { id: "summary", label: isHi ? "📝 सारांश" : "📝 Summary" },
    { id: "visual", label: isHi ? "🎬 वीडियो" : "🎬 Visual" },
    { id: "ncert", label: isHi ? "📗 NCERT" : "📗 NCERT" },
    { id: "formulas", label: isHi ? "🔢 सूत्र" : "🔢 Formulas" },
    { id: "important", label: isHi ? "⭐ महत्वपूर्ण" : "⭐ Important" },
    { id: "saved", label: isHi ? "💾 सहेजे" : "💾 Saved" },
  ];
  app.innerHTML = `
    <h1 class="gradient-heading section-heading">📚 ${isHi ? "अध्ययन संसाधन" : "Study Resources"}</h1>
    <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:20px">
      <div style="display:flex;gap:0;border-bottom:2px solid rgba(255,255,255,0.08);min-width:max-content">
        ${TABS.map((tb, i) => `<button id="tab-${tb.id}" onclick="switchResourceTab('${tb.id}')" style="padding:10px 12px;background:none;border:none;white-space:nowrap;color:${i === 0 ? "#4f8ef7" : "var(--text-muted)"};font-weight:700;font-size:0.78rem;font-family:inherit;border-bottom:2px solid ${i === 0 ? "#4f8ef7" : "transparent"};cursor:pointer;margin-bottom:-2px;transition:all .18s">${tb.label}</button>`).join("")}
      </div>
    </div>
    <div id="resource-tab-content"></div>
  `;
  window.switchResourceTab = (tab) => {
    TABS.forEach((tb) => {
      const el = document.getElementById("tab-" + tb.id);
      if (!el) return;
      const active = tab === tb.id;
      el.style.color = active ? "#4f8ef7" : "var(--text-muted)";
      el.style.borderBottomColor = active ? "#4f8ef7" : "transparent";
    });
    const fns = {
      papers: renderPapersTab,
      trends: renderStudyTrendsTab,
      notes: renderNotesTab,
      summary: renderSummaryTab,
      visual: renderVisualTab,
      ncert: renderNcertTab,
      formulas: renderFormulasTab,
      important: renderImportantQsTab,
      saved: renderStudySavedTab,
    };
    (fns[tab] || renderPapersTab)();
  };
  switchResourceTab("papers");
}

// ── PYQ Trends tab (moved from standalone page) ──────────────
function renderStudyTrendsTab() {
  // reuse the existing trends analyser but inject into resource-tab-content
  const el = document.getElementById("resource-tab-content");
  if (!el) return;
  // Temporarily swap app to render, then move innerHTML
  const isHi = getLanguage() === "hi";
  el.innerHTML = `<div id="trends-inner" style="padding:0"></div>`;
  // Render the full trends content inline
  renderTrendsAnalyser(true); // pass flag to render inline
}

// ── Chapter Summaries (AI) ────────────────────────────────────
function renderSummaryTab() {
  const el = document.getElementById("resource-tab-content");
  if (!el) return;
  const isHi = getLanguage() === "hi";
  const classNum = S.classPreference || "10";
  const subj = S.subjectPreference || "Science";
  const chaps = CHAPTERS[classNum]?.[subj] || [];
  el.innerHTML = `
    <div style="background:rgba(155,109,255,0.06);border:1.5px solid rgba(155,109,255,0.2);border-radius:18px;padding:18px">
      <div style="font-size:1rem;font-weight:900;color:#9b6dff;margin-bottom:14px">📝 ${isHi ? "अध्याय सारांश" : "Chapter Summaries"}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <select id="sum-subj" onchange="window._sumSubjChange()" style="padding:8px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:rgba(30,30,50,0.9);color:var(--text);font-size:0.85rem;font-family:inherit">
          ${["Maths", "Science", "Social Science", "English", "Hindi"].map((s) => `<option value="${s}" ${s === subj ? "selected" : ""}>${s}</option>`).join("")}
        </select>
        <select id="sum-chap" style="padding:8px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:rgba(30,30,50,0.9);color:var(--text);font-size:0.85rem;font-family:inherit">
          <option value="">${isHi ? "— अध्याय चुनें —" : "— Select Chapter —"}</option>
          ${chaps.map((c) => `<option value="${c}">${c}</option>`).join("")}
        </select>
      </div>
      <button onclick="window._genSummary()" class="btn btn-primary" style="width:100%;padding:12px;font-weight:900;background:linear-gradient(135deg,#9b6dff,#4f8ef7);border:none">${isHi ? "सारांश बनाएं →" : "Generate Summary →"}</button>
      <div id="sum-result" style="margin-top:16px"></div>
    </div>
  `;
  window._sumSubjChange = () => {
    const s = document.getElementById("sum-subj")?.value;
    const c = document.getElementById("sum-chap");
    if (!c || !s) return;
    const chs = CHAPTERS[classNum]?.[s] || [];
    c.innerHTML = `<option value="">${isHi ? "— अध्याय चुनें —" : "— Select Chapter —"}</option>${chs.map((ch) => `<option value="${ch}">${ch}</option>`).join("")}`;
  };
  window._genSummary = async () => {
    const subject = document.getElementById("sum-subj")?.value || subj;
    const chapter = document.getElementById("sum-chap")?.value;
    if (!chapter) {
      alert(isHi ? "अध्याय चुनें" : "Please select a chapter");
      return;
    }
    const res = document.getElementById("sum-result");
    if (res)
      res.innerHTML = `<div style="text-align:center;padding:20px">${typingLoader()}</div>`;
    try {
      const data = await apiPost("/chapter-summary", {
        classNum,
        subject,
        chapter,
        lang: getLanguage(),
        detailed: true,
      });
      if (res)
        res.innerHTML = `<div class="glass" style="padding:16px;border-radius:14px">${markdownToHtml(data.summary || data.content || "")}</div>`;
    } catch (e) {
      if (res)
        res.innerHTML = `<div style="color:var(--red)">${e.message}</div>`;
    }
  };
}

// ── Visual Explanations (YouTube links) ───────────────────────
function renderVisualTab() {
  const el = document.getElementById("resource-tab-content");
  if (!el) return;
  const isHi = getLanguage() === "hi";
  const classNum = S.classPreference || "10";
  const VISUAL_LINKS = {
    Science: {
      "Chemical Reactions and Equations": {
        yt: "https://www.youtube.com/results?search_query=CBSE+class+10+Chemical+Reactions+Equations+hindi+english",
        desc: "Balancing equations, types of reactions",
      },
      "Life Processes": {
        yt: "https://www.youtube.com/results?search_query=CBSE+class+10+Life+Processes+explanation",
        desc: "Nutrition, respiration, transportation",
      },
      Electricity: {
        yt: "https://www.youtube.com/results?search_query=CBSE+class+10+Electricity+chapter+explanation",
        desc: "Ohm's law, circuits, resistance",
      },
      "Light – Reflection and Refraction": {
        yt: "https://www.youtube.com/results?search_query=CBSE+class+10+Light+Reflection+Refraction",
        desc: "Mirrors, lenses, ray diagrams",
      },
    },
    Maths: {
      "Real Numbers": {
        yt: "https://www.youtube.com/results?search_query=CBSE+class+10+Real+Numbers+explanation",
        desc: "Euclid's algorithm, irrational numbers",
      },
      Polynomials: {
        yt: "https://www.youtube.com/results?search_query=CBSE+class+10+Polynomials+explanation",
        desc: "Zeroes, division algorithm",
      },
      Triangles: {
        yt: "https://www.youtube.com/results?search_query=CBSE+class+10+Triangles+similarity+proof",
        desc: "Similarity, Pythagoras theorem",
      },
      "Quadratic Equations": {
        yt: "https://www.youtube.com/results?search_query=CBSE+class+10+Quadratic+Equations+explanation",
        desc: "Discriminant, factoring, formula",
      },
    },
  };
  const subj = S.subjectPreference || "Science";
  const links = VISUAL_LINKS[subj] || {};
  const subjects = ["Maths", "Science", "Social Science", "English", "Hindi"];
  el.innerHTML = `
    <div style="background:rgba(6,182,212,0.06);border:1.5px solid rgba(6,182,212,0.2);border-radius:18px;padding:18px">
      <div style="font-size:1rem;font-weight:900;color:#06b6d4;margin-bottom:14px">🎬 ${isHi ? "दृश्य व्याख्याएं" : "Visual Explanations"}</div>
      <div style="margin-bottom:14px">
        <select onchange="window._switchVisualSubj(this.value)" style="padding:8px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:rgba(30,30,50,0.9);color:var(--text);font-size:0.85rem;font-family:inherit">
          ${subjects.map((s) => `<option value="${s}" ${s === subj ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </div>
      <div id="visual-list">
        ${
          Object.keys(links).length
            ? Object.entries(links)
                .map(
                  ([ch, info]) => `
          <a href="${info.yt}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(6,182,212,0.07);border:1px solid rgba(6,182,212,0.2);border-radius:14px;margin-bottom:10px;text-decoration:none;transition:border-color .18s" onmouseover="this.style.borderColor='rgba(6,182,212,0.5)'" onmouseout="this.style.borderColor='rgba(6,182,212,0.2)'">
            <span style="font-size:1.6rem;flex-shrink:0">▶️</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:0.88rem;font-weight:800;color:var(--text)">${ch}</div>
              <div style="font-size:0.72rem;color:var(--text-muted)">${info.desc}</div>
            </div>
            <span style="font-size:0.7rem;color:#06b6d4;font-weight:700">YouTube →</span>
          </a>`,
                )
                .join("")
            : `
          <a href="https://www.youtube.com/results?search_query=CBSE+class+${classNum}+${encodeURIComponent(subj)}+explanation" target="_blank" rel="noopener" style="display:block;padding:16px;background:rgba(6,182,212,0.07);border:1px solid rgba(6,182,212,0.2);border-radius:14px;text-decoration:none;text-align:center;color:#06b6d4;font-weight:700">
            🔍 ${isHi ? "YouTube पर खोजें" : "Search on YouTube"} — Class ${classNum} ${subj}
          </a>`
        }
        <a href="https://www.youtube.com/@MagnetBrains" target="_blank" rel="noopener" style="display:block;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-top:12px;text-decoration:none;text-align:center;color:var(--text-muted);font-size:0.8rem">🎓 Magnet Brains CBSE Channel →</a>
        <a href="https://www.youtube.com/@vedantu_9_10" target="_blank" rel="noopener" style="display:block;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-top:8px;text-decoration:none;text-align:center;color:var(--text-muted);font-size:0.8rem">🎓 Vedantu Class 9-10 Channel →</a>
      </div>
    </div>
  `;
  window._switchVisualSubj = (s) => {
    const url = `https://www.youtube.com/results?search_query=CBSE+class+${classNum}+${encodeURIComponent(s)}+chapter+explanation`;
    document.getElementById("visual-list").innerHTML =
      `<a href="${url}" target="_blank" rel="noopener" style="display:block;padding:16px;background:rgba(6,182,212,0.07);border:1px solid rgba(6,182,212,0.2);border-radius:14px;text-decoration:none;text-align:center;color:#06b6d4;font-weight:700">🔍 ${isHi ? "YouTube पर खोजें" : "Search on YouTube"} — Class ${classNum} ${s}</a>`;
  };
}

// ── NCERT Solutions & PDFs ────────────────────────────────────
function renderNcertTab() {
  const el = document.getElementById("resource-tab-content");
  if (!el) return;
  const isHi = getLanguage() === "hi";
  const classNum = S.classPreference || "10";
  const NCERT_BASE = "https://ncert.nic.in";
  const BOOKS = {
    10: [
      {
        subject: "Maths",
        title: "Mathematics",
        code: "jemh1",
        pdf: `${NCERT_BASE}/textbook/textbook.htm?jemh1=0-15`,
      },
      {
        subject: "Science",
        title: "Science",
        code: "jesc1",
        pdf: `${NCERT_BASE}/textbook/textbook.htm?jesc1=0-16`,
      },
      {
        subject: "Social Science",
        title: "Contemporary India II",
        code: "jess2",
        pdf: `${NCERT_BASE}/textbook/textbook.htm?jess2=0-7`,
      },
      {
        subject: "Social Science",
        title: "India and the Contemporary World",
        code: "jess3",
        pdf: `${NCERT_BASE}/textbook/textbook.htm?jess3=0-5`,
      },
      {
        subject: "Social Science",
        title: "Understanding Economic Development",
        code: "jess4",
        pdf: `${NCERT_BASE}/textbook/textbook.htm?jess4=0-5`,
      },
      {
        subject: "English",
        title: "First Flight",
        code: "jfst1",
        pdf: `${NCERT_BASE}/textbook/textbook.htm?jfst1=0-11`,
      },
      {
        subject: "Hindi",
        title: "Kshitiz II",
        code: "khst2",
        pdf: `${NCERT_BASE}/textbook/textbook.htm?khst2=0-17`,
      },
    ],
  };
  const books = BOOKS[classNum] || BOOKS["10"];
  el.innerHTML = `
    <div style="background:rgba(15,202,140,0.06);border:1.5px solid rgba(15,202,140,0.2);border-radius:18px;padding:18px">
      <div style="font-size:1rem;font-weight:900;color:#0fca8c;margin-bottom:6px">📗 ${isHi ? "NCERT पाठ्यपुस्तकें और हल" : "NCERT Textbooks & Solutions"}</div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:16px">${isHi ? "आधिकारिक NCERT वेबसाइट से" : "Official NCERT website — ncert.nic.in"}</div>

      <div style="font-size:0.7rem;font-weight:900;letter-spacing:.08em;color:#0fca8c;text-transform:uppercase;margin-bottom:10px">📥 ${isHi ? "Class" : "Class"} ${classNum} ${isHi ? "पाठ्यपुस्तक PDF" : "Textbook PDFs"}</div>
      ${books
        .map(
          (b) => `
        <a href="${b.pdf}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:10px;padding:11px 14px;background:rgba(15,202,140,0.07);border:1px solid rgba(15,202,140,0.2);border-radius:12px;margin-bottom:8px;text-decoration:none;transition:border-color .18s" onmouseover="this.style.borderColor='rgba(15,202,140,0.5)'" onmouseout="this.style.borderColor='rgba(15,202,140,0.2)'">
          <span style="font-size:1.2rem">📘</span>
          <div style="flex:1">
            <div style="font-size:0.85rem;font-weight:800;color:var(--text)">${b.title}</div>
            <div style="font-size:0.7rem;color:var(--text-muted)">${b.subject}</div>
          </div>
          <span style="font-size:0.7rem;color:#0fca8c;font-weight:700">Open PDF →</span>
        </a>`,
        )
        .join("")}

      <div style="font-size:0.7rem;font-weight:900;letter-spacing:.08em;color:#4f8ef7;text-transform:uppercase;margin-top:20px;margin-bottom:10px">💡 ${isHi ? "NCERT हल (आधिकारिक साइट)" : "NCERT Solutions (Official Site)"}</div>
      <a href="https://ncert.nic.in/textbook.php" target="_blank" rel="noopener" style="display:block;padding:14px;background:rgba(79,142,247,0.08);border:1.5px solid rgba(79,142,247,0.25);border-radius:14px;text-decoration:none;text-align:center;color:#4f8ef7;font-weight:700;margin-bottom:8px">📖 ${isHi ? "NCERT पाठ्यपुस्तक देखें" : "Browse NCERT Textbooks"} →</a>
      <a href="https://ncert.nic.in/exemplar-problems.php" target="_blank" rel="noopener" style="display:block;padding:14px;background:rgba(79,142,247,0.06);border:1px solid rgba(79,142,247,0.15);border-radius:14px;text-decoration:none;text-align:center;color:var(--text-muted);font-size:0.85rem">📐 ${isHi ? "NCERT Exemplar प्रश्न" : "NCERT Exemplar Problems"} →</a>
    </div>
  `;
}

// ── Important Questions (AI-generated) ────────────────────────
function renderImportantQsTab() {
  const el = document.getElementById("resource-tab-content");
  if (!el) return;
  const isHi = getLanguage() === "hi";
  const classNum = S.classPreference || "10";
  const subj = S.subjectPreference || "Science";
  const chaps = CHAPTERS[classNum]?.[subj] || [];
  el.innerHTML = `
    <div style="background:rgba(240,180,41,0.06);border:1.5px solid rgba(240,180,41,0.2);border-radius:18px;padding:18px">
      <div style="font-size:1rem;font-weight:900;color:#f0b429;margin-bottom:14px">⭐ ${isHi ? "महत्वपूर्ण प्रश्न" : "Important Questions"}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <select id="imp-subj" onchange="window._impSubjChange()" style="padding:8px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:rgba(30,30,50,0.9);color:var(--text);font-size:0.85rem;font-family:inherit">
          ${["Maths", "Science", "Social Science", "English", "Hindi"].map((s) => `<option value="${s}" ${s === subj ? "selected" : ""}>${s}</option>`).join("")}
        </select>
        <select id="imp-chap" style="padding:8px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:rgba(30,30,50,0.9);color:var(--text);font-size:0.85rem;font-family:inherit">
          <option value="">${isHi ? "— अध्याय चुनें —" : "— Select Chapter —"}</option>
          ${chaps.map((c) => `<option value="${c}">${c}</option>`).join("")}
        </select>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
        ${["1 Mark", "2 Marks", "3 Marks", "5 Marks", "All"].map((m) => `<button class="imp-marks-btn" data-m="${m}" onclick="window._setImpMarks('${m}')" style="padding:5px 12px;border-radius:20px;border:1.5px solid ${m === "All" ? "#f0b429" : "rgba(255,255,255,0.1)"};background:${m === "All" ? "rgba(240,180,41,0.18)" : "transparent"};color:${m === "All" ? "#f0b429" : "var(--text-muted)"};font-size:0.72rem;font-weight:800;cursor:pointer;font-family:inherit">${m}</button>`).join("")}
      </div>
      <button onclick="window._genImportantQs()" class="btn btn-primary" style="width:100%;padding:12px;font-weight:900;background:linear-gradient(135deg,#f0b429,#f97316);border:none">${isHi ? "महत्वपूर्ण प्रश्न लाएं →" : "Generate Important Questions →"}</button>
      <div id="imp-result" style="margin-top:16px"></div>
    </div>
  `;
  let _impMarks = "All";
  window._setImpMarks = (m) => {
    _impMarks = m;
    document.querySelectorAll(".imp-marks-btn").forEach((btn) => {
      const active = btn.dataset.m === m;
      btn.style.borderColor = active ? "#f0b429" : "rgba(255,255,255,0.1)";
      btn.style.background = active ? "rgba(240,180,41,0.18)" : "transparent";
      btn.style.color = active ? "#f0b429" : "var(--text-muted)";
    });
  };
  window._impSubjChange = () => {
    const s = document.getElementById("imp-subj")?.value;
    const c = document.getElementById("imp-chap");
    if (!c || !s) return;
    const chs = CHAPTERS[classNum]?.[s] || [];
    c.innerHTML = `<option value="">${isHi ? "— अध्याय चुनें —" : "— Select Chapter —"}</option>${chs.map((ch) => `<option value="${ch}">${ch}</option>`).join("")}`;
  };
  window._genImportantQs = async () => {
    const subject = document.getElementById("imp-subj")?.value || subj;
    const chapter = document.getElementById("imp-chap")?.value;
    if (!chapter) {
      alert(isHi ? "अध्याय चुनें" : "Please select a chapter");
      return;
    }
    const res = document.getElementById("imp-result");
    if (res)
      res.innerHTML = `<div style="text-align:center;padding:20px">${typingLoader()}</div>`;
    try {
      const data = await apiPost("/important-questions", {
        classNum,
        subject,
        chapter,
        marks: _impMarks,
        lang: getLanguage(),
      });
      const qs = data.questions || [];
      if (res)
        res.innerHTML =
          qs
            .map(
              (q, i) => `
        <div style="background:rgba(240,180,41,0.06);border:1px solid rgba(240,180,41,0.2);border-radius:14px;padding:14px;margin-bottom:10px">
          <div style="display:flex;align-items:flex-start;gap:10px">
            <span style="font-size:0.7rem;font-weight:900;color:#f0b429;flex-shrink:0;padding-top:2px">Q${i + 1}</span>
            <div style="flex:1">
              <div style="font-size:0.88rem;color:var(--text);line-height:1.5">${escapeHtml(q.question || q)}</div>
              ${q.marks ? `<div style="font-size:0.68rem;color:#f0b429;margin-top:5px;font-weight:700">[${q.marks} ${isHi ? "अंक" : "Marks"}]</div>` : ""}
            </div>
          </div>
        </div>`,
            )
            .join("") ||
          `<div style="color:var(--text-muted);text-align:center;padding:16px">${isHi ? "कोई प्रश्न नहीं मिले" : "No questions found"}</div>`;
    } catch (e) {
      if (res)
        res.innerHTML = `<div style="color:var(--red)">${e.message}</div>`;
    }
  };
}

// ── Saved Questions (moved from nav) ─────────────────────────
function renderStudySavedTab() {
  const el = document.getElementById("resource-tab-content");
  if (!el) return;
  // Inject renderSaved output into the tab
  const temp = document.createElement("div");
  const orig = document.getElementById("app");
  const origHTML = orig.innerHTML;
  renderSaved();
  const savedHTML = document.getElementById("app").innerHTML;
  orig.innerHTML = origHTML; // restore resources page
  // Re-attach tab listeners
  const TABS = [
    "papers",
    "trends",
    "notes",
    "summary",
    "visual",
    "ncert",
    "formulas",
    "important",
    "saved",
  ];
  TABS.forEach((tb) => {
    const btn = document.getElementById("tab-" + tb);
    if (btn) {
      btn.style.color = tb === "saved" ? "#4f8ef7" : "var(--text-muted)";
      btn.style.borderBottomColor = tb === "saved" ? "#4f8ef7" : "transparent";
    }
  });
  document.getElementById("resource-tab-content").innerHTML = savedHTML;
}

function renderPapersTab() {
  const papers = INAPP_PAPERS;
  const TAG_COLOR = {
    "Sample Paper": "#4f8ef7",
    PYQ: "#9b6dff",
    "Marking Scheme": "#0fca8c",
  };
  const TAG_BG = {
    "Sample Paper": "rgba(79,142,247,0.12)",
    PYQ: "rgba(155,109,255,0.12)",
    "Marking Scheme": "rgba(15,202,140,0.1)",
  };
  const SUBJECTS = [
    "All",
    "Maths",
    "Science",
    "Social Science",
    "English",
    "Hindi",
  ];

  const filterPills = `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px">
    ${SUBJECTS.map((s, i) => {
      const active = i === 0;
      return `<button class="subject-filter-pill${active ? " active" : ""}" data-subject="${s}" onclick="filterPapers('${s}')" style="padding:7px 15px;border-radius:22px;border:1.5px solid ${active ? "#4f8ef7" : "rgba(255,255,255,0.1)"};background:${active ? "rgba(79,142,247,0.18)" : "rgba(255,255,255,0.04)"};color:${active ? "#4f8ef7" : "var(--text-muted)"};font-size:0.76rem;font-weight:800;cursor:pointer;font-family:inherit;transition:all .2s;letter-spacing:0.02em;box-shadow:${active ? "0 0 12px rgba(79,142,247,0.25)" : "none"}">${s}</button>`;
    }).join("")}
  </div>`;

  const grouped = {};
  papers.forEach((p) => {
    if (!grouped[p.tag]) grouped[p.tag] = [];
    grouped[p.tag].push(p);
  });

  let cardsHtml = filterPills;
  Object.entries(grouped).forEach(([tag, items]) => {
    const color = TAG_COLOR[tag] || "#4f8ef7";
    const bg = TAG_BG[tag] || "rgba(79,142,247,0.08)";
    cardsHtml += `<div class="papers-group" style="margin-bottom:26px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <div style="height:22px;width:3px;background:${color};border-radius:3px;box-shadow:0 0 8px ${color}88"></div>
        <span style="font-size:0.7rem;font-weight:900;letter-spacing:0.12em;color:${color};text-transform:uppercase">${tag}s</span>
        <span style="background:${color}18;color:${color};border:1px solid ${color}33;font-size:0.65rem;font-weight:800;padding:1px 8px;border-radius:20px">${items.length}</span>
      </div>
      ${items
        .map(
          (p) => `
        <div data-subject="${p.subject}" class="paper-card" onclick="showPaper('${p.id}')" style="margin-bottom:10px;cursor:pointer">
          <div style="background:${bg};border:1.5px solid ${color}25;border-radius:16px;padding:16px;transition:all .25s;position:relative;overflow:hidden"
            onmouseover="this.style.borderColor='${color}66';this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 30px ${color}22'"
            onmouseout="this.style.borderColor='${color}25';this.style.transform='';this.style.boxShadow=''">
            <div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:${color}10;filter:blur(20px)"></div>
            <div style="display:flex;align-items:flex-start;gap:12px;justify-content:space-between">
              <div style="flex:1;min-width:0">
                <div style="font-weight:800;color:var(--text);font-size:0.9rem;margin-bottom:8px;line-height:1.35">${p.label}</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  <span style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);color:var(--text-muted);font-size:0.68rem;font-weight:700;padding:2px 9px;border-radius:20px">${p.year}</span>
                  <span style="background:${color}15;border:1px solid ${color}30;color:${color};font-size:0.68rem;font-weight:700;padding:2px 9px;border-radius:20px">${p.subject}</span>
                  <span style="color:var(--text-muted);font-size:0.68rem">${p.maxMarks} marks · ${p.time}</span>
                </div>
              </div>
              <div style="flex-shrink:0;background:${color};color:#fff;border-radius:12px;padding:8px 16px;font-size:0.78rem;font-weight:900;box-shadow:0 4px 14px ${color}55;white-space:nowrap">View →</div>
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
      btn.style.borderColor = active ? "#4f8ef7" : "rgba(255,255,255,0.1)";
      btn.style.background = active
        ? "rgba(79,142,247,0.18)"
        : "rgba(255,255,255,0.04)";
      btn.style.color = active ? "#4f8ef7" : "var(--text-muted)";
      btn.style.boxShadow = active ? "0 0 12px rgba(79,142,247,0.25)" : "none";
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

function renderPdfPapersTab() {
  const TAG_COLOR = { "Sample Paper": "#4f8ef7", PYQ: "#a78bfa" };
  const SUBJECTS = [
    "All",
    "Maths",
    "Science",
    "Social Science",
    "English",
    "Hindi",
  ];

  const grouped = {};
  PDF_PAPERS.forEach((p) => {
    if (!grouped[p.tag]) grouped[p.tag] = [];
    grouped[p.tag].push(p);
  });

  let html = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">
    ${SUBJECTS.map((s, i) => `<button class="pdf-filter-pill${i === 0 ? " active" : ""}" data-subject="${s}" onclick="filterPdfPapers('${s}')" style="padding:6px 14px;border-radius:20px;border:1px solid ${i === 0 ? "#4f8ef7" : "rgba(255,255,255,0.12)"};background:${i === 0 ? "rgba(79,142,247,0.15)" : "rgba(255,255,255,0.05)"};color:${i === 0 ? "#4f8ef7" : "var(--text-muted)"};font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s">${s}</button>`).join("")}
  </div>`;

  Object.entries(grouped).forEach(([tag, items]) => {
    const color = TAG_COLOR[tag] || "#4f8ef7";
    html += `<div class="pdf-papers-group" style="margin-bottom:20px">
      <div style="font-size:0.72rem;font-weight:800;letter-spacing:0.08em;color:${color};text-transform:uppercase;margin-bottom:10px">${tag}s</div>
      ${items
        .map(
          (p) => `
        <div data-subject="${p.subject}" class="pdf-paper-card" onclick="openPdfModal('${p.id}')" style="margin-bottom:10px;cursor:pointer">
          <div class="glass" style="padding:14px 16px;border:1px solid ${color}28;transition:all .2s" onmouseover="this.style.borderColor='${color}88';this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='${color}28';this.style.transform=''">
            <div style="display:flex;align-items:center;gap:10px;justify-content:space-between">
              <div>
                <div style="font-weight:700;color:var(--text);font-size:0.9rem;margin-bottom:3px">${p.label}</div>
                <div style="font-size:0.75rem;color:var(--text-muted)">${p.year} · ${p.subject}</div>
              </div>
              <div style="flex-shrink:0;background:${color}18;border:1px solid ${color}44;border-radius:8px;padding:6px 14px;font-size:0.78rem;font-weight:700;color:${color}">Open PDF →</div>
            </div>
          </div>
        </div>`,
        )
        .join("")}
    </div>`;
  });

  document.getElementById("resource-tab-content").innerHTML = html;

  window.filterPdfPapers = (subject) => {
    document.querySelectorAll(".pdf-filter-pill").forEach((btn) => {
      const active = btn.dataset.subject === subject;
      btn.style.borderColor = active ? "#4f8ef7" : "rgba(255,255,255,0.12)";
      btn.style.background = active
        ? "rgba(79,142,247,0.15)"
        : "rgba(255,255,255,0.05)";
      btn.style.color = active ? "#4f8ef7" : "var(--text-muted)";
    });
    document.querySelectorAll(".pdf-paper-card").forEach((card) => {
      card.style.display =
        subject === "All" || card.dataset.subject === subject
          ? "block"
          : "none";
    });
    document.querySelectorAll(".pdf-papers-group").forEach((group) => {
      group.style.display = [...group.querySelectorAll(".pdf-paper-card")].some(
        (c) => c.style.display !== "none",
      )
        ? "block"
        : "none";
    });
  };

  window.openPdfModal = (id) => {
    const paper = PDF_PAPERS.find((p) => p.id === id);
    if (!paper) return;
    window.open(paper.url, "_blank");
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
    "Civics",
    "Economics",
    "English",
    "Hindi",
  ];
  const activeClass = S.classPreference || "10";
  const activeSubject = S.subjectPreference || "Maths";

  const NOTES = {
    10: {
      Maths: {
        "Real Numbers": [
          "Euclid's Division Lemma: a = bq + r where 0 ≤ r < b",
          "HCF by Euclid's algorithm: apply lemma repeatedly until r = 0",
          "HCF × LCM = Product of two numbers (only for two numbers)",
          "Fundamental Theorem of Arithmetic: every integer > 1 has unique prime factorisation",
          "Irrational numbers: √2, √3, √5, π — cannot be expressed as p/q",
          "Sum/product of rational and irrational is irrational",
          "Decimal of rational number: terminating if denominator has only 2ⁿ × 5ᵐ factors",
          "Non-terminating repeating decimal → rational · Non-terminating non-repeating → irrational",
        ],
        Polynomials: [
          "Degree of polynomial = highest power of variable",
          "Linear: degree 1 · Quadratic: degree 2 · Cubic: degree 3",
          "Zeroes of p(x): values of x where p(x) = 0 (graphically: x-intercepts)",
          "A polynomial of degree n has at most n zeroes",
          "Sum of zeroes α+β = −b/a · Product of zeroes αβ = c/a (quadratic ax²+bx+c)",
          "For cubic ax³+bx²+cx+d: α+β+γ = −b/a · αβ+βγ+γα = c/a · αβγ = −d/a",
          "Division algorithm: p(x) = g(x)·q(x) + r(x), degree r < degree g",
        ],
        "Pair of Linear Equations in Two Variables": [
          "General form: a₁x + b₁y + c₁ = 0 and a₂x + b₂y + c₂ = 0",
          "Unique solution (consistent): a₁/a₂ ≠ b₁/b₂ → lines intersect",
          "Infinite solutions (consistent, dependent): a₁/a₂ = b₁/b₂ = c₁/c₂ → lines coincide",
          "No solution (inconsistent): a₁/a₂ = b₁/b₂ ≠ c₁/c₂ → lines parallel",
          "Methods: Substitution, Elimination, Cross-multiplication, Graphical",
          "Cross-multiplication: x/(b₁c₂−b₂c₁) = y/(c₁a₂−c₂a₁) = 1/(a₁b₂−a₂b₁)",
        ],
        "Quadratic Equations": [
          "Standard form: ax² + bx + c = 0, a ≠ 0",
          "Methods: factorisation, completing the square, quadratic formula",
          "Quadratic formula: x = (−b ± √(b²−4ac)) / 2a",
          "Discriminant D = b² − 4ac",
          "D > 0 → two distinct real roots · D = 0 → two equal real roots · D < 0 → no real roots",
          "Sum of roots = −b/a · Product of roots = c/a",
          "Completing the square: x² + bx = (x + b/2)² − (b/2)²",
        ],
        "Arithmetic Progressions": [
          "AP: a, a+d, a+2d, ... where a = first term, d = common difference",
          "nth term: aₙ = a + (n−1)d",
          "Last term l = a + (n−1)d",
          "Sum of n terms: Sₙ = n/2 × (2a + (n−1)d)",
          "If last term known: Sₙ = n/2 × (a + l)",
          "d = aₙ − aₙ₋₁ (common difference = any term minus previous term)",
          "If a, b, c are in AP then 2b = a + c",
          "Sum of first n natural numbers: n(n+1)/2",
        ],
        Triangles: [
          "Basic Proportionality Theorem (Thales): line parallel to one side divides other two proportionally",
          "Converse of BPT: if a line divides two sides proportionally, it is parallel to third side",
          "Criteria for similarity: AA, SSS, SAS",
          "If triangles similar, ratio of areas = square of ratio of corresponding sides",
          "Pythagoras Theorem: in right triangle, hyp² = base² + perp²",
          "Converse: if a² + b² = c², the angle opposite c is 90°",
          "Median divides triangle into two triangles of equal area",
        ],
        "Coordinate Geometry": [
          "Distance formula: d = √((x₂−x₁)² + (y₂−y₁)²)",
          "Section formula (internal): x = (m₁x₂+m₂x₁)/(m₁+m₂), y = (m₁y₂+m₂y₁)/(m₁+m₂)",
          "Midpoint: ((x₁+x₂)/2, (y₁+y₂)/2)",
          "Area of triangle = ½|x₁(y₂−y₃) + x₂(y₃−y₁) + x₃(y₁−y₂)|",
          "Collinear points: area of triangle formed = 0",
          "Slope of line = (y₂−y₁)/(x₂−x₁) = tan θ",
        ],
        "Introduction to Trigonometry": [
          "sin θ = opp/hyp · cos θ = adj/hyp · tan θ = opp/adj",
          "cosec θ = 1/sin θ · sec θ = 1/cos θ · cot θ = 1/tan θ",
          "sin²θ + cos²θ = 1",
          "1 + tan²θ = sec²θ",
          "1 + cot²θ = cosec²θ",
          "Values: sin 0°=0, sin 30°=½, sin 45°=1/√2, sin 60°=√3/2, sin 90°=1",
          "cos decreases as angle increases (0° to 90°) · sin increases",
          "tan 90° is undefined",
        ],
        "Some Applications of Trigonometry": [
          "Angle of elevation: angle above horizontal to object",
          "Angle of depression: angle below horizontal to object",
          "In problems: draw diagram, identify right triangle, apply trig ratio",
          "Height of object = distance × tan(angle of elevation)",
          "Two observer problems: use angle of elevation and depression together",
          "tan 30° = 1/√3 · tan 45° = 1 · tan 60° = √3",
        ],
        Circles: [
          "Tangent to circle is perpendicular to radius at point of contact",
          "From an external point, two tangents to circle are equal in length",
          "Tangent-chord angle = inscribed angle in alternate segment",
          "A line can intersect a circle at 0, 1 (tangent), or 2 points",
          "Common tangents: 3 if circles touch externally, 1 if internally, 4 if separate",
          "Length of tangent from external point P: PT² = PO² − r²",
        ],
        "Areas Related to Circles": [
          "Circumference = 2πr · Area = πr²",
          "Arc length = (θ/360°) × 2πr",
          "Area of sector = (θ/360°) × πr²",
          "Area of segment = Area of sector − Area of triangle",
          "Area of minor segment + Area of major segment = πr²",
          "Use π = 22/7 or 3.14 as directed",
        ],
        "Surface Areas and Volumes": [
          "Cylinder: CSA = 2πrh · TSA = 2πr(r+h) · V = πr²h",
          "Cone: CSA = πrl · TSA = πr(r+l) · V = ⅓πr²h · l = √(r²+h²)",
          "Sphere: SA = 4πr² · V = (4/3)πr³",
          "Hemisphere: CSA = 2πr² · TSA = 3πr² · V = (2/3)πr³",
          "Frustum: CSA = π(r₁+r₂)l · V = ⅓πh(r₁²+r₂²+r₁r₂) · l = √(h²+(r₁−r₂)²)",
          "Combination solids: add/subtract volumes as needed",
        ],
        Statistics: [
          "Mean (direct): x̄ = Σfᵢxᵢ / Σfᵢ",
          "Mean (assumed mean): x̄ = a + Σfᵢdᵢ/Σfᵢ where dᵢ = xᵢ − a",
          "Mean (step deviation): x̄ = a + (Σfᵢuᵢ/Σfᵢ) × h where uᵢ = (xᵢ−a)/h",
          "Median = l + ((n/2 − cf)/f) × h",
          "Mode = l + ((f₁−f₀)/(2f₁−f₀−f₂)) × h",
          "Empirical relation: Mode = 3 Median − 2 Mean",
          "Ogive: cumulative frequency graph · used to find median graphically",
        ],
        Probability: [
          "P(E) = number of favourable outcomes / total number of outcomes",
          "0 ≤ P(E) ≤ 1",
          "P(E) + P(Ē) = 1",
          "Impossible event: P = 0 · Certain event: P = 1",
          "Equally likely outcomes: each has same probability",
          "Complementary events: P(not E) = 1 − P(E)",
          "Sample space: set of all possible outcomes",
        ],
      },
      Physics: {
        "Light Reflection and Refraction": [
          "Laws of reflection: angle of incidence = angle of reflection, incident ray, normal and reflected ray are coplanar",
          "Mirror formula: 1/f = 1/v + 1/u (sign convention: distances measured from pole)",
          "Magnification m = −v/u = h'/h",
          "Concave mirror: converging · used in torches, shaving mirrors, solar furnaces",
          "Convex mirror: diverging · always virtual, erect, diminished image · used in rear-view mirrors",
          "Snell's Law: n₁ sin i = n₂ sin r",
          "Refractive index n = c/v = sin i / sin r",
          "Lens formula: 1/f = 1/v − 1/u",
          "Power of lens P = 1/f (in metres) · unit: dioptre (D)",
          "Convex lens: converging · concave lens: diverging",
          "Total internal reflection occurs when i > critical angle and ray goes from denser to rarer",
        ],
        Electricity: [
          "Electric current I = Q/t · unit: ampere (A)",
          "Potential difference V = W/Q · unit: volt (V)",
          "Ohm's Law: V = IR (at constant temperature)",
          "Resistance R = ρl/A where ρ = resistivity",
          "Series circuit: R = R₁+R₂+R₃ · current same throughout · voltage divides",
          "Parallel circuit: 1/R = 1/R₁+1/R₂+1/R₃ · voltage same · current divides",
          "Power P = VI = I²R = V²/R · unit: watt (W)",
          "Electrical energy E = Pt = VIt · 1 kWh = 3.6 × 10⁶ J",
          "Heating effect: H = I²Rt (Joule's law)",
          "Fuse wire: high resistance, low melting point · protects circuit",
        ],
        "Magnetic Effects of Electric Current": [
          "Magnetic field around straight conductor: concentric circles",
          "Right-hand thumb rule: thumb → current, curled fingers → field direction",
          "Solenoid: behaves like a bar magnet when current flows",
          "Electromagnet: soft iron core + solenoid",
          "Fleming's Left-Hand Rule: force on current-carrying conductor in field (motor principle)",
          "Fleming's Right-Hand Rule: direction of induced current (generator principle)",
          "Electromagnetic induction: changing magnetic field induces EMF",
          "DC (Direct current): flows in one direction · AC (Alternating current): reverses direction",
          "AC frequency in India = 50 Hz",
          "Electric motor: converts electrical → mechanical energy",
          "Electric generator: converts mechanical → electrical energy",
        ],
        "Human Eye and Colourful World": [
          "Near point of normal eye = 25 cm · Far point = infinity",
          "Accommodation: ability of eye lens to adjust focal length",
          "Myopia (near-sightedness): image forms in front of retina · corrected by concave lens",
          "Hypermetropia (far-sightedness): image forms behind retina · corrected by convex lens",
          "Presbyopia: loss of accommodation with age · corrected by bifocal lens",
          "Dispersion: splitting of white light into spectrum by prism (VIBGYOR)",
          "Scattering: blue light scatters most (shortest wavelength) → sky appears blue",
          "Tyndall effect: scattering of light by colloidal particles",
          "Red sky at sunrise/sunset: light travels longer path, blue scattered away, red remains",
          "Rainbow: dispersion + total internal reflection in water droplets",
        ],
      },
      Chemistry: {
        "Chemical Reactions and Equations": [
          "Chemical equation: reactants → products",
          "Balanced equation obeys law of conservation of mass",
          "Types: Combination (A+B→AB) · Decomposition (AB→A+B) · Displacement (A+BC→AC+B) · Double displacement · Redox",
          "Oxidation: gain of O₂ / loss of H₂ / loss of electrons",
          "Reduction: loss of O₂ / gain of H₂ / gain of electrons",
          "Redox reaction: oxidation and reduction occur simultaneously",
          "Exothermic: releases energy · Endothermic: absorbs energy",
          "Corrosion: slow oxidation of metals (e.g. rusting of iron)",
          "Rancidity: oxidation of fats/oils in food · prevented by antioxidants, N₂ flushing",
        ],
        "Acids Bases and Salts": [
          "Acid: gives H⁺ ions in solution · turns blue litmus red · pH < 7",
          "Base: gives OH⁻ ions · turns red litmus blue · pH > 7",
          "Neutralisation: Acid + Base → Salt + Water",
          "pH scale: 0–14 · pH 7 = neutral · < 7 = acidic · > 7 = basic",
          "Strong acid: fully dissociates (HCl, H₂SO₄, HNO₃)",
          "Weak acid: partially dissociates (CH₃COOH, H₂CO₃)",
          "Baking soda: NaHCO₃ · used in cooking, antacid",
          "Washing soda: Na₂CO₃·10H₂O · used in glass, soap, paper making",
          "Bleaching powder: CaOCl₂ · used as disinfectant, bleaching agent",
          "Plaster of Paris: CaSO₄·½H₂O · used in moulds, fractures",
        ],
        "Metals and Non-metals": [
          "Metals: lustrous, malleable, ductile, good conductors of heat and electricity",
          "Non-metals: brittle, poor conductors (except graphite), non-lustrous",
          "Reactivity series (high to low): K > Na > Ca > Mg > Al > Zn > Fe > Pb > H > Cu > Ag > Au",
          "Metals above H in reactivity series displace H₂ from dilute acids",
          "Ionic bond: metal loses electrons, non-metal gains electrons",
          "Ore: rock/mineral containing metal compound in sufficient quantity",
          "Refining: purification of impure metal (electrolytic refining most common)",
          "Corrosion prevention: painting, galvanising, alloying, electroplating",
          "Alloys: homogeneous mixture of metals (e.g. brass = Cu + Zn, steel = Fe + C)",
        ],
        "Carbon and its Compounds": [
          "Carbon is tetravalent (valency 4) — forms 4 covalent bonds",
          "Catenation: unique ability of carbon to bond with other carbon atoms in chains/rings",
          "Saturated compounds: only single bonds (alkanes) · formula CₙH₂ₙ₊₂",
          "Unsaturated: double bonds (alkenes CₙH₂ₙ) or triple bonds (alkynes CₙH₂ₙ₋₂)",
          "Isomers: same molecular formula, different structural formula",
          "Functional groups: −OH (alcohol), −COOH (carboxylic acid), −CHO (aldehyde), −CO− (ketone), −X (halide)",
          "Ethanol (C₂H₅OH): drinking alcohol · Ethanoic acid (CH₃COOH): vinegar",
          "Saponification: fat + NaOH → soap + glycerol (soap making)",
          "Soaps: sodium salts of fatty acids · work poorly in hard water",
          "Detergents: work well in hard water · branched chains are non-biodegradable",
        ],
      },
      Biology: {
        "Life Processes": [
          "Photosynthesis: 6CO₂ + 6H₂O + sunlight → C₆H₁₂O₆ + 6O₂ (in chloroplasts)",
          "Autotrophs make own food · Heterotrophs depend on others",
          "Stomata: CO₂ enters leaf, O₂ exits · guard cells regulate opening",
          "Aerobic respiration: glucose + O₂ → CO₂ + H₂O + 38 ATP",
          "Anaerobic in yeast: glucose → ethanol + CO₂ + less energy",
          "Anaerobic in muscle: glucose → lactic acid (causes cramps)",
          "Nutrition types: holozoic, parasitic, saprophytic, autotrophic",
          "Human digestive system: mouth → oesophagus → stomach → small intestine → large intestine",
          "Enzymes: amylase (starch→sugar), pepsin (protein), lipase (fats)",
          "Villi: finger-like projections in small intestine → increase surface area for absorption",
          "Transpiration: loss of water from leaves as vapour through stomata",
          "Double circulation: blood passes through heart twice per cycle (pulmonary + systemic)",
          "Excretion: removal of metabolic wastes · kidney filters blood → urine",
          "Nephron: functional unit of kidney · filtration → reabsorption → urine",
        ],
        "Control and Coordination": [
          "Nervous system: brain + spinal cord (CNS) + peripheral nerves",
          "Neuron: basic unit · dendrites receive signals, axon transmits",
          "Synapse: junction between two neurons · signals cross via neurotransmitters",
          "Reflex arc: receptor → sensory nerve → spinal cord → motor nerve → effector",
          "Reflex action: involuntary, fast response (e.g. withdrawing hand from fire)",
          "Brain: cerebrum (thinking/memory), cerebellum (balance), medulla (involuntary actions)",
          "Hormones: chemical messengers secreted by endocrine glands",
          "Adrenaline (adrenal gland): fight or flight response",
          "Insulin (pancreas): lowers blood sugar · Glucagon: raises blood sugar",
          "Thyroxine (thyroid gland): controls metabolism · requires iodine",
          "Growth hormone (pituitary): controls growth",
          "Tropisms: plant movements in response to stimuli (phototropism, geotropism, hydrotropism, thigmotropism)",
          "Auxin: plant hormone causing phototropism (shoot bends towards light)",
        ],
        "How do Organisms Reproduce": [
          "Reproduction: production of new organisms of same kind",
          "Asexual: fission (Amoeba, Paramoecium), budding (Hydra, yeast), spore formation (Rhizopus), fragmentation (Spirogyra), vegetative propagation (plants)",
          "Binary fission: one organism splits into two",
          "Vegetative propagation: new plant from roots, stems, or leaves (e.g. potato from tuber, rose from cutting)",
          "Sexual reproduction involves gametes — sperm (male) + ovum (female)",
          "Fertilisation: fusion of gametes to form zygote",
          "In humans: internal fertilisation, development in uterus (~9 months)",
          "Menstrual cycle: ~28 days · ovulation at day 14 · menstruation if no fertilisation",
          "Puberty: physical changes due to sex hormones (testosterone/estrogen)",
          "Contraception: physical (condoms), chemical (pills), surgical (vasectomy/tubectomy)",
          "Sexually transmitted infections (STIs): HIV, gonorrhoea, syphilis",
          "Flower parts: sepals, petals, stamens (anther + filament), pistil (stigma + style + ovary)",
          "Pollination: self (within same flower) or cross (different flower/plant)",
          "Seed: embryo + endosperm + seed coat · germination needs water, warmth, air",
        ],
        "Heredity and Evolution": [
          "Heredity: passing of traits from parents to offspring",
          "Mendel's Law of Segregation: two alleles for each trait separate during gamete formation",
          "Mendel's Law of Independent Assortment: genes for different traits assort independently",
          "Dominant allele (T) masks recessive (t) · TT and Tt show dominant trait, tt shows recessive",
          "Genotype: genetic composition · Phenotype: observable expression",
          "Monohybrid cross ratio: 3:1 (phenotype) · 1:2:1 (genotype)",
          "Dihybrid cross ratio: 9:3:3:1",
          "Sex determination: XX = female · XY = male · father determines sex of child",
          "Evolution: gradual change in heritable characteristics of populations over time",
          "Natural selection: organisms with favourable traits survive and reproduce more",
          "Acquired traits (Lamarck) vs inherited traits (Darwin): only genetic changes are inherited",
          "Homologous organs: same structure, different function (e.g. human arm, whale flipper, bat wing) → common ancestry",
          "Analogous organs: different structure, same function (e.g. bat wing, insect wing) → convergent evolution",
          "Fossils: remains of dead organisms → evidence of evolution",
          "Speciation: formation of new species due to geographic isolation, genetic drift, natural selection",
        ],
        "Our Environment": [
          "Ecosystem: biotic (living) + abiotic (non-living) components interacting",
          "Food chain: producers → primary consumers → secondary consumers → tertiary consumers",
          "Food web: interconnected food chains in an ecosystem",
          "Energy flow: only 10% energy transfers to next trophic level (10% law)",
          "Decomposers: bacteria and fungi break down dead organic matter",
          "Biodegradable: can be broken down by microorganisms (e.g. food waste, paper)",
          "Non-biodegradable: cannot be broken down (e.g. plastic, DDT, metal)",
          "Ozone layer (stratosphere): absorbs harmful UV radiation",
          "Ozone depletion: caused by CFCs (chlorofluorocarbons) → increase in UV → skin cancer, cataracts",
          "Biological magnification: concentration of pollutants increases at higher trophic levels",
          "Waste management: reduce, reuse, recycle (3 Rs)",
        ],
      },
      History: {
        "The Rise of Nationalism in Europe": [
          "Nationalism: sense of common identity based on shared culture, language, history",
          "French Revolution 1789: ideas of liberty, equality, fraternity spread across Europe",
          "Napoleon: spread revolutionary ideas, introduced legal reforms (Napoleonic Code)",
          "Romanticism: cultural movement that promoted nationalism through art, music, poetry",
          "Giuseppe Mazzini: Italian nationalist · founded 'Young Italy' movement",
          "Garibaldi: 'Red Shirts' · military campaign to unify Italy",
          "Italy unified 1861 under Victor Emmanuel II, 1871 complete with Rome",
          "Germany: Bismarck (Chancellor of Prussia) unified Germany 1866–71 through 'blood and iron' policy",
          "Frankfurt Parliament 1848: first German national assembly · failed",
          "Zollverein (1834): customs union → economic unity before political unity in Germany",
          "Balkans: ethnic tensions due to multi-ethnic empires → 'powder keg of Europe'",
          "Treaty of Vienna 1815: tried to restore old monarchies after Napoleon",
          "1830 and 1848 revolutions swept through Europe demanding liberal constitutions",
        ],
        "Nationalism in India": [
          "INC founded 1885 by A.O. Hume",
          "Rowlatt Act 1919: detention without trial → Indian protests",
          "Jallianwala Bagh massacre: April 13, 1919 · General Dyer ordered firing",
          "Non-Cooperation Movement 1920–22: boycott of foreign goods, courts, schools",
          "Called off after Chauri Chaura incident (Feb 1922): mob burned police station",
          "Simon Commission 1927: no Indian member → protests and boycott",
          "Civil Disobedience Movement 1930: Salt March (Dandi) 385 km by Gandhi",
          "Gandhi-Irwin Pact 1931: CDM suspended",
          "Round Table Conferences: 1930, 1931, 1932 — Gandhi attended 2nd",
          "Quit India Movement: August 1942 · 'Do or Die' slogan",
          "Swaraj = self-rule · Purna Swaraj declared 26 Jan 1930",
          "Bhagat Singh, Sukhdev, Rajguru: revolutionary nationalists",
          "Role of women: Sarojini Naidu, Kasturba Gandhi active in movements",
          "Dalits: B.R. Ambedkar organised movement for their rights · Poona Pact 1932",
        ],
        "The Making of a Global World": [
          "Silk Route: ancient trade routes connecting Asia, Middle East, Europe",
          "Columbus reached America 1492 · Vasco da Gama reached India 1498",
          "Colonisation of Americas → diseases killed large indigenous populations (smallpox etc.)",
          "19th century: mass migration from Europe to Americas and Australia",
          "Indentured labour system: Indian workers taken to Fiji, Mauritius, Caribbean as cheap labour",
          "World War I (1914–18): disrupted global trade and finance",
          "Rinderpest (cattle plague): devastated Africa in 1890s → land taken over by Europeans",
          "The Great Depression (1929): stock market crash in USA → worldwide economic collapse",
          "Bretton Woods Conference 1944: established IMF and World Bank",
          "Post-WWII: decolonisation, new nations, new trade patterns",
          "Globalisation: increasing interconnection of economies, cultures and societies",
        ],
        "The Age of Industrialisation": [
          "Proto-industrialisation: production before factories — merchants gave raw material to rural families",
          "First Industrial Revolution in Britain (late 18th century): textiles, iron, steam power",
          "Richard Arkwright: spinning frame · James Watt: steam engine improvements",
          "Cotton textile industry first to industrialise in Britain",
          "Most workers worked in small workshops, not big factories even in 1850s",
          "India: textile industry (Bombay), jute (Calcutta), iron & steel (Tata Steel, Jamshedpur 1912)",
          "Colonialism affected Indian industry: cheap British imports destroyed traditional weavers",
          "Swadeshi movement boosted Indian goods during nationalist period",
          "Child and women labour was common in early factories",
          "Merchant capital vs Industrial capital: merchants controlled early industry through putting-out system",
        ],
        "Print Culture and the Modern World": [
          "Woodblock printing in China (9th century) · Gutenberg printing press (1440s, Germany)",
          "Gutenberg: movable metal type printing press → mass production of books",
          "Print capitalism: newspapers and books created shared language and national identity (Benedict Anderson)",
          "Erasmus: used print to spread humanist ideas",
          "Martin Luther's 95 Theses (1517): printed widely → Protestant Reformation",
          "Newspapers in India: first printed 1780 (Bengal Gazette by James Augustus Hicky)",
          "Raja Ram Mohan Roy used press to spread reform ideas",
          "Print and women: novels gave women access to education and reform ideas",
          "Print and poor: cheap books, pamphlets spread literacy among workers",
          "Censorship: colonial govt censored Indian press (Vernacular Press Act 1878)",
          "Bal Gangadhar Tilak: used Kesari newspaper to spread nationalist ideas",
          "Print created public opinion — essential for freedom movement",
        ],
      },
      Geography: {
        "Resources and Development": [
          "Resource: anything available in environment satisfying human needs with technology and economic feasibility",
          "Types: natural (renewable/non-renewable), human-made, human resources",
          "Renewable: replenished naturally (solar, wind, water) · Non-renewable: finite (coal, petroleum, minerals)",
          "Land use: forest, land under cultivation, fallow, unculturable land",
          "Land degradation: deforestation, overgrazing, mining, waterlogging, soil erosion",
          "Soil conservation methods: crop rotation, contour ploughing, terrace farming, afforestation, shelter belts",
          "Soil types in India: alluvial (most fertile, river plains), black (cotton soil, Deccan), red/yellow (iron oxide), laterite, arid, forest soils",
          "Sustainable development: meeting present needs without compromising future generations",
          "Rio de Janeiro Summit 1992: Agenda 21 — sustainable development action plan",
        ],
        "Forest and Wildlife Resources": [
          "India: 12% of world's biodiversity · 4th in plant diversity",
          "IUCN categories: Normal, Vulnerable, Endangered, Extinct, Rare species",
          "Deforestation causes: agriculture, mining, urbanisation, fuelwood collection",
          "Wildlife Protection Act 1972 · Forest Conservation Act 1980",
          "Project Tiger: started 1973 · successful in increasing tiger population",
          "Reserved forests: fully protected by govt · Protected forests: limited use allowed",
          "Community and private forests: managed by communities/private parties",
          "Van Panchayats (Uttarakhand): village councils managing forests",
          "Chipko Movement: villagers hugged trees to prevent felling (Uttarakhand, 1970s)",
          "Beej Bachao Andolan (Tehri), Navdanya (Vandana Shiva): seed conservation",
          "Biodiversity hotspots: areas with high endemic species under threat",
        ],
        "Water Resources": [
          "Freshwater = 2.5% of Earth's total water · most locked in glaciers and groundwater",
          "India receives most water through monsoons — highly uneven distribution",
          "Water scarcity: due to growing population, over-exploitation, unequal distribution",
          "Multipurpose river valley projects: irrigation, HEP, flood control, navigation, recreation",
          "Major dams: Bhakra Nangal (Punjab), Hirakud (Odisha), Nagarjuna Sagar (Andhra Pradesh)",
          "Opposition to large dams: displacement of people, loss of forests, silting, earthquakes",
          "Narmada Bachao Andolan: protest against Sardar Sarovar Dam",
          "Rainwater harvesting: tankas (Rajasthan), johads, stepwells (baolis), rooftop collection",
          "Bambusbend (Bihar), Pyne (Bihar), Khadins (Rajasthan): traditional water harvesting",
          "Groundwater depletion: due to over-irrigation, urbanisation → need for recharge",
        ],
        Agriculture: [
          "India is primarily agricultural — employs ~50% of population",
          "Types of farming: subsistence (for family), commercial (for market), plantation",
          "Kharif crops: sown June-July, harvested September-October (rice, maize, cotton, soybean)",
          "Rabi crops: sown October-November, harvested March-April (wheat, barley, mustard, peas)",
          "Zaid crops: grown between rabi and kharif (watermelon, muskmelon, cucumber)",
          "Green Revolution (1960s–70s): HYV seeds, fertilisers, irrigation → increased food production",
          "White Revolution (Operation Flood): increased milk production",
          "India's major crops: rice (West Bengal, UP), wheat (Punjab, Haryana), sugarcane, tea (Assam), coffee (Karnataka)",
          "Problems: small landholdings, dependence on monsoon, debt, soil degradation",
          "Land reforms: abolition of zamindari, land ceiling acts, cooperative farming",
        ],
        "Minerals and Energy Resources": [
          "Mineral: naturally occurring substance with definite chemical composition",
          "Metallic minerals: ferrous (iron ore, manganese) and non-ferrous (copper, bauxite, lead)",
          "Non-metallic: limestone, mica, gypsum, salt",
          "Iron ore: Jharkhand, Odisha, Chhattisgarh, Goa — major producers",
          "Bauxite (aluminium ore): Odisha, Jharkhand",
          "Mica: Jharkhand, Bihar, Rajasthan — used in electrical industries",
          "Conventional energy: coal, petroleum, natural gas, thermal power, HEP",
          "Coal fields: Jharia, Raniganj, Bokaro (Gondwana fields best quality)",
          "Petroleum: Digboi (Assam), Mumbai High, delta regions (Godavari, Krishna)",
          "Non-conventional: solar, wind, biogas, tidal, geothermal",
          "Wind power: Tamil Nadu, Rajasthan, Gujarat — India is world leader in wind power",
          "Solar: Rajasthan has highest solar potential",
          "Mineral conservation: use judiciously, recycle, find substitutes",
        ],
        "Manufacturing Industries": [
          "Manufacturing converts raw materials into finished goods → creates employment, wealth",
          "Industries classified: agro-based, mineral-based, public sector, private sector, cottage/small/large-scale",
          "Cotton textile: largest industry · Mumbai (Manchester of India), Ahmedabad",
          "Jute textile: West Bengal (Hugli river belt) — India world's largest producer",
          "Sugar: Uttar Pradesh and Bihar → shifting to Maharashtra and Karnataka",
          "Iron & Steel: Jharkhand, Odisha, Chhattisgarh, West Bengal (Jamshedpur, Durgapur, Rourkela, Bhilai)",
          "SAIL: Steel Authority of India Ltd (public sector)",
          "Cement: Rajasthan, MP, Andhra Pradesh, Gujarat",
          "IT industry: Bengaluru (Silicon Valley of India), Hyderabad, Pune, Chennai, Mumbai",
          "Industrial pollution: air (smoke), water (effluents), land (solid waste), noise",
          "Industrial estates and SEZs (Special Economic Zones) promote industrial development",
        ],
        "Lifelines of National Economy": [
          "Transport: roadways, railways, pipelines, waterways, airways",
          "Roadways: largest network · Golden Quadrilateral (Delhi-Mumbai-Chennai-Kolkata) 5,846 km",
          "National Highways: NH-44 longest (Srinagar to Kanyakumari), maintained by NHAI",
          "Railways: 2nd largest in Asia · Indian Railways under Zones",
          "Broad gauge, metre gauge and narrow gauge tracks",
          "Konkan Railway: 760 km, Mumbai to Mangalore through Western Ghats",
          "Inland waterways: NW-1 (Ganga), NW-2 (Brahmaputra), NW-3 (Kerala)",
          "Major sea ports: Mumbai (busiest), Chennai, Kolkata, Vishakhapatnam, Kandla",
          "Airways: domestic (Air India) and international · Indira Gandhi International (Delhi) busiest",
          "Oil and gas pipelines: Assam to Barauni, Gujarat to Jalandhar (major)",
          "Communication: personal (telephone, internet) and mass (TV, radio, newspapers)",
          "Trade: domestic (within country) and international (between countries)",
          "India exports: gems, jewellery, engineering goods, software · imports: crude oil, machinery",
        ],
      },
      Civics: {
        "Power Sharing": [
          "Power sharing: dividing power among different organs/levels of government",
          "Belgium: Dutch-speaking majority vs French-speaking minority → equal representation in central govt",
          "Sri Lanka: Sinhala Buddhist majority dominated → civil war with Tamil minority",
          "Horizontal power sharing: among organs of government (legislature, executive, judiciary)",
          "Vertical power sharing: among different levels of government (central, state, local)",
          "Power sharing among political parties, pressure groups, social groups",
          "Prudential reasons for power sharing: reduces conflict, ensures stability",
          "Moral reasons: respects diversity, upholds democratic principles",
        ],
        Federalism: [
          "Federalism: two or more levels of government — each with its own powers",
          "India: federal system with central (union) government and state governments",
          "Three lists: Union List (97 subjects, central govt), State List (66 subjects, state govts), Concurrent List (47 subjects, both)",
          "Residual powers with central government in India",
          "Linguistic reorganisation of states (1956): states formed on language basis",
          "Panchayati Raj (73rd Amendment 1992): 3-tier local government in rural areas",
          "Gram Panchayat → Panchayat Samiti → Zila Parishad",
          "74th Amendment: urban local bodies (municipalities, municipal corporations)",
          "Coalition government: when no single party gets majority",
          "Decentralisation: transfer of power from central/state govt to local bodies",
        ],
        "Democracy and Diversity": [
          "Social differences can be created by birth (race, gender) or choice (religion, politics)",
          "Social division: when social difference becomes source of identity and conflict",
          "Civil Rights Movement USA (1954–68): African Americans fought against racial discrimination",
          "Overlapping differences → dangerous (reinforce each other) vs cross-cutting → manageable",
          "Outcomes depend on: political representation, constitutional safeguards, people's attitudes",
          "Affirmative action: reservations/quotas for marginalised groups",
          "Black Power Movement: more militant arm of Civil Rights Movement",
          "Identities are multiple and not singular — person can belong to multiple groups",
        ],
        "Gender Religion and Caste": [
          "Gender division: not biological but social — society assigns roles to men and women",
          "Patriarchy: male-dominated social system",
          "Women's political representation in India: 33% reservation in Panchayats · less in Parliament",
          "Feminist movements: sought equal rights for women",
          "Religion: personal faith should be separated from state politics (secularism)",
          "Communalism: when religious identity is used for political mobilisation",
          "India is secular state: no official religion, equal treatment of all religions",
          "Caste in politics: candidates and voters consider caste while voting",
          "Caste system: hierarchical social division inherited at birth (unique to India)",
          "Constitution abolished untouchability and caste discrimination",
          "Dalit movement: fight against caste discrimination (B.R. Ambedkar)",
        ],
        "Popular Struggles and Movements": [
          "Bolivia Water Wars 2000: govt privatised water → public protests → govt reversed decision",
          "Nepal Movement 2006: alliance of parties + Maoists → king restored democracy",
          "Pressure groups: organisations that influence government policies (FEDECOR in Bolivia)",
          "Interest groups: promote interests of members (trade unions, business groups)",
          "Movement groups: seek broader social goals (women's movement, environmental movement)",
          "Sectional interest groups vs public interest groups",
          "Methods: demonstrations, strikes, petitions, lobbying, media campaigns",
          "Healthy democracy: requires active citizens and organised movements",
        ],
        "Political Parties": [
          "Political party: group of people with shared ideology who contest elections and hold power",
          "Functions: contest elections, form governments, make laws, shape public opinion",
          "Party system: one-party (China), two-party (USA, UK), multi-party (India)",
          "India: multi-party system with coalition governments",
          "National parties: recognised in 4+ states (BJP, INC, BSP, NCP, CPM, CPI, NCP)",
          "State parties: recognised in specific states",
          "Challenges: dynasty politics, criminalisation, money power, lack of inner democracy",
          "Reforms: Electoral Commission regulations, Right to Information Act, judicial activism",
        ],
        "Outcomes of Democracy": [
          "Democracy produces accountable and legitimate government",
          "Democratic government is responsive to citizens' needs",
          "Economic outcomes: democracy doesn't necessarily produce faster economic growth",
          "Reduction in inequality and poverty: mixed record — India's democracy has not eliminated poverty",
          "Social outcomes: democracy respects dignity, accommodates diversity",
          "Dignity and freedom: democracy respects individual rights (especially of women and minorities)",
          "Transparency: citizens have right to information",
          "Democracy better than alternatives: ensures peaceful transfer of power, protects rights",
          "Evaluating democracy: regular free elections, rule of law, protection of rights, separation of powers",
        ],
        "Challenges to Democracy": [
          "Foundational challenge: establishing democracy (countries under dictatorships)",
          "Challenge of expansion: extending democratic rights to more citizens and areas",
          "Challenge of deepening: strengthening institutions, ensuring equal participation",
          "Political reform: improving quality of democracy",
          "Redefining democracy: moving from formal to substantive democracy",
          "Constitutional amendments to improve representation",
          "Role of civil society: NGOs, social movements, media in deepening democracy",
          "Citizens' capacity to monitor and evaluate government is essential",
        ],
      },
      Economics: {
        Development: [
          "Development: improvement in quality of life and living standards",
          "Different people have different development goals (national vs individual)",
          "National Development: sustained improvement in per capita income and quality of life",
          "Per Capita Income (PCI): total income ÷ total population",
          "World Bank classifies countries by PCI: high income > $12,000, middle income, low income",
          "Human Development Index (HDI): combines life expectancy, education, per capita income",
          "Sustainable development: development that meets present needs without compromising future",
          "Income is not the only indicator — literacy, health, gender equality also matter",
          "Kerala vs Punjab: Kerala has lower income but better health and education indicators",
        ],
        "Sectors of the Indian Economy": [
          "Primary sector: agriculture, mining, forestry, fishing — involves natural resources",
          "Secondary sector: manufacturing and industry — transforms raw materials",
          "Tertiary sector: services — banking, transport, communication, trade, IT",
          "GDP (Gross Domestic Product): total value of goods and services produced in a year",
          "In India: tertiary sector contributes most to GDP but primary employs most people",
          "Disguised unemployment: more workers than needed (common in agriculture)",
          "Unorganised sector: no fixed hours, no job security, low wages (80% of workers in India)",
          "Organised sector: formal employment, regular wages, social security benefits",
          "NREGA (National Rural Employment Guarantee Act): guarantees 100 days of employment per year",
        ],
        "Money and Credit": [
          "Barter system: exchange goods without money · problems: double coincidence of wants",
          "Money: medium of exchange, store of value, unit of account, standard of deferred payment",
          "Currency: notes and coins issued by Reserve Bank of India (RBI)",
          "Demand deposits: money deposited in banks, can be withdrawn anytime (cheques)",
          "Credit: loan given to borrower · involves trust and repayment promise",
          "Collateral: asset pledged against loan (land, vehicle, savings)",
          "Formal credit: banks and cooperatives · regulated by RBI",
          "Informal credit: moneylenders, relatives, traders · higher interest, exploitative",
          "Self Help Groups (SHGs): groups of poor women who save together and access loans",
          "Grameen Bank (Bangladesh): pioneer of microfinance/SHGs",
        ],
        "Globalisation and the Indian Economy": [
          "Globalisation: integration of economies through trade, investment, technology",
          "Multinational corporations (MNCs): companies operating in multiple countries",
          "MNCs set up production where costs are low (labour, land) → India, China attractive",
          "Foreign investment by MNCs increases productive capacity and employment",
          "Liberalisation: removing government restrictions on trade and investment",
          "Privatisation: transfer of public enterprises to private ownership",
          "WTO (World Trade Organisation): promotes free trade, resolves trade disputes",
          "India liberalised economy in 1991 (LPG reforms: Liberalisation, Privatisation, Globalisation)",
          "Benefits: economic growth, employment, consumer choices, technology transfer",
          "Concerns: small industries suffer competition from MNCs, unequal distribution of benefits",
          "Fair globalisation: benefits should reach all sections, not just wealthy",
        ],
        "Consumer Rights": [
          "Consumer: person who buys goods or services for personal use",
          "Consumer exploitation: underweight goods, adulteration, false advertising, overpricing",
          "Consumer Protection Act 1986 (amended 2019): protects consumer interests",
          "Rights of consumers: right to safety, right to be informed, right to choose, right to be heard, right to redress, right to consumer education",
          "Consumer Forum: District, State, and National levels for complaints",
          "COPRA (Consumer Protection Act): framework for consumer redressal",
          "RTI (Right to Information Act 2005): citizens can demand information from govt",
          "ISO certification: international quality standard for products",
          "Hallmark: quality certification for gold jewellery",
          "AGMARK: quality certification for agricultural products",
          "Consumer awareness: being a well-informed consumer is essential for protection",
        ],
      },
      English: {
        "A Letter to God": [
          "Author: G.L. Fuentes (Mexican) · Story set in rural Mexico",
          "Lencho is a hardworking farmer — entire corn crop destroyed by hailstorm",
          "Lencho writes a letter to God asking for 100 pesos to sow crops again",
          "Post office employees collect 70 pesos among themselves and send it",
          "Lencho receives money but thinks post office workers stole 30 pesos — writes to God again saying 'do not send by post office'",
          "Theme: unshakeable faith vs dramatic irony · human kindness mistaken for dishonesty",
          "Lencho's faith in God is innocent but blind",
        ],
        "Nelson Mandela Long Walk to Freedom": [
          "Author: Nelson Mandela (autobiography excerpt)",
          "Mandela became South Africa's first Black president · sworn in 10 May 1994",
          "Apartheid: policy of racial segregation in South Africa — ended in 1994",
          "White minority had enslaved Black majority for decades",
          "Twin obligations: to family AND to people (his community, his country)",
          "Great men (Oliver Tambo, Walter Sisulu) made him see that his freedom was linked to his people's freedom",
          "Oppressor also loses humanity by oppressing others — both oppressor and oppressed need liberation",
          "Theme: courage, sacrifice, leadership, dignity",
        ],
        "Two Stories About Flying": [
          "Part 1 — 'His First Flight' (Liam O'Flaherty): young seagull afraid to fly despite being fully grown",
          "Seagull's family ignores him, mother tempts him with food held just out of reach",
          "Hunger overcomes fear — he dives and flies successfully",
          "Theme: courage, overcoming fear, taking the first step",
          "Part 2 — 'Black Aeroplane' (Frederick Forsyth): pilot flying from Paris to England in night",
          "Enters storm clouds, loses all instruments, fuel almost gone",
          "Mysterious black aeroplane appears and guides him safely to landing",
          "At airport he asks about the other plane — controllers saw no other plane on radar",
          "Theme: mystery, faith, imagination vs reality",
        ],
        "From the Diary of Anne Frank": [
          "Author: Anne Frank · Jewish girl hiding from Nazis in Amsterdam 1942–44",
          "Family hid in 'Secret Annexe' above her father's office",
          "Writes diary as letters to imaginary friend 'Kitty'",
          "Describes loneliness, daily life in hiding, hope for future",
          "Anne finds it hard to write about feelings — does not have true friends she can confide in",
          "Teachers notice students' chatter taking too much time — discusses homework/report cards",
          "Theme: loneliness, courage, hope, resilience of human spirit",
          "Anne was arrested in 1944 and died in Bergen-Belsen concentration camp aged 15",
        ],
        "The Hundred Dresses Part 1": [
          "Author: Eleanor Estes",
          "Characters: Wanda Petronski (poor Polish girl), Maddie and Peggy (classmates)",
          "Wanda is teased about her name and wearing the same faded dress every day",
          "She claims she has a hundred dresses in her closet — becomes a joke",
          "Peggy leads the teasing · Maddie feels uncomfortable but doesn't speak up",
          "Wanda is quiet, sits in corner, has no friends",
          "Theme: bullying, empathy, social exclusion, moral courage",
        ],
        "The Hundred Dresses Part 2": [
          "Wanda's father writes to school — they are moving as his children are teased about their Polish name",
          "Drawing contest results announced — Wanda has won with designs of a hundred dresses",
          "Miss Mason reads the letter — class feels ashamed of their treatment of Wanda",
          "Peggy and Maddie write to Wanda asking forgiveness",
          "Wanda replies warmly and says Peggy and Maddie can keep the drawings of the dresses",
          "Maddie realises she should have spoken up — resolves never to stand by in silence when someone is bullied",
          "Theme: remorse, forgiveness, standing up against injustice",
        ],
        "Glimpses of India": [
          "Part 1 — 'A Baker from Goa' (Lucio Rodrigues): describes old Goan tradition of bread-making",
          "Portuguese traders introduced bread culture · bakers called 'paders'",
          "Baker's basket (jhadi) and his songs were familiar sounds in Goan childhood",
          "Part 2 — 'Coorg' (Lokesh Abrol): Coorg (Kodagu), Karnataka — land of rolling hills, coffee, spices, forests",
          "Coorgi people: martial tradition, fiercely independent, said to be of Greek or Arab origin",
          "Kaveri River originates in Coorg",
          "Part 3 — 'Tea from Assam' (Arup Kumar Datta): Pranjol and Rajvir travel through Assam tea gardens",
          "Legend of tea: Chinese emperor Shen Nung or Indian Buddhist monk Bodhidharma",
          "Assam and Darjeeling: India's major tea regions",
        ],
        "Mijbil the Otter": [
          "Author: Gavin Maxwell",
          "Maxwell acquires an otter in Iraq named Mijbil (a species later named Lutrogale perspicillata maxwelli)",
          "Mijbil is playful, loves water, invents his own games",
          "Maxwell had to take Mijbil to England on a plane — struggled to get permission",
          "Plane journey: Mijbil escapes his box during the flight, causing panic among passengers",
          "In London, Mijbil becomes famous — people ask strange questions about what animal he is",
          "Theme: bond between humans and animals, animal intelligence, responsibility of pet ownership",
        ],
        "Madam Rides the Bus": [
          "Author: Vallikkannan",
          "Valli is an 8-year-old girl who longs to ride the town bus she sees from her front door",
          "Saves money secretly, plans trip carefully by listening to adults",
          "Boards the bus alone during afternoon — enjoys the journey through the countryside",
          "Sees a dead cow on the return journey — reality of death saddens her",
          "Returns home safely before mother wakes from nap — keeps her adventure secret",
          "Theme: childhood curiosity, independence, encounter with reality of life and death",
        ],
        "The Sermon at Benares": [
          "Author: Betty Renshaw",
          "Kisa Gotami's son dies — she refuses to accept death and asks for medicine",
          "Goes to Buddha · Buddha asks her to bring mustard seed from house where no one has died",
          "She goes from house to house — everyone has lost someone · she understands death is universal",
          "Returns to Buddha, accepts son's death, becomes his disciple",
          "Buddha's teaching: sorrow is caused by one's longing for the living and grief for the dead",
          "Theme: acceptance of death, grief, wisdom, impermanence of life",
        ],
        "The Proposal": [
          "Author: Anton Chekhov (Russian playwright)",
          "One-act comedy/farce",
          "Characters: Ivan Lomov (neighbour), Natalya Stepanovna, and her father Chubukov",
          "Lomov comes to propose marriage but every conversation turns into a quarrel (about Oxen Meadows, then dogs)",
          "Despite quarrelling over trivial matters, both families want the marriage",
          "Lomov faints during argument — Natalya panics wanting to know if he has proposed",
          "They are quickly married despite beginning another quarrel",
          "Theme: satire on petty disputes, marriage for status/land, human irrationality",
        ],
        "Grammar: Determiners": [
          "Determiners specify and identify nouns",
          "Articles: a/an (indefinite), the (definite)",
          "Demonstratives: this, that, these, those",
          "Possessives: my, your, his, her, our, their",
          "Quantifiers: some, any, many, few, little, much, several",
          "Numbers: one, two, first, second etc.",
          "Use 'a' before consonant sounds, 'an' before vowel sounds",
        ],
        "Grammar: Tenses": [
          "Simple present: habitual/universal truths · Present continuous: action happening now",
          "Present perfect: action completed with present relevance (have/has + V3)",
          "Simple past: completed action in past · Past continuous: ongoing past action",
          "Past perfect: action completed before another past action (had + V3)",
          "Future: will/shall + V1 · Future perfect: will have + V3",
          "Signal words: always/usually (present) · yesterday/ago (past) · tomorrow/soon (future)",
        ],
        "Grammar: Modals": [
          "Can: ability/permission (present) · Could: ability (past)/polite request",
          "Will: future intention · Would: past habit/polite request",
          "Shall: first person future/offers · Should: advice/obligation",
          "May: possibility/permission (formal) · Might: lesser possibility",
          "Must: strong obligation/logical conclusion · Need not: not necessary",
          "Ought to: moral obligation · Used to: past habit (no longer)",
        ],
        "Grammar: Subject-Verb Concord": [
          "Singular subject → singular verb · Plural subject → plural verb",
          "Collective nouns (army, team) → singular verb (as a unit)",
          "Either/Neither + singular noun → singular verb",
          "Either/Neither + plural noun → plural verb (or verb agrees with nearer noun)",
          "Each/Every + singular noun → singular verb",
          "There is/are: verb agrees with the noun that follows",
          "Titles of books, films → singular verb",
        ],
        "Grammar: Reported Speech": [
          "Direct: the speaker's exact words in inverted commas",
          "Indirect: reports what was said without inverted commas",
          "Tense changes: is→was, am→was, are→were, will→would, can→could, may→might",
          "Pronoun changes: I→he/she, we→they, you→I/he/she/they (context dependent)",
          "Time/place changes: now→then, today→that day, here→there, tomorrow→next day",
          "Reporting verbs: said, told, asked, replied, admitted, denied, suggested, promised",
          "Questions in indirect speech: if/whether (yes/no) · question word retained (wh-questions)",
        ],
      },
      Hindi: {
        Surdas: [
          "भक्तिकाल के प्रमुख कवि · सगुण भक्ति धारा (कृष्ण भक्ति)",
          "बचपन से नेत्रहीन थे पर भगवान कृष्ण के अनन्य भक्त",
          "सूरसागर, सूरसारावली, साहित्यलहरी — प्रमुख ग्रंथ",
          "पाठ में माता यशोदा श्रीकृष्ण को माखन चुराने पर उलाहना देती हैं",
          "कृष्ण के बाल रूप का सजीव चित्रण — वात्सल्य रस की प्रधानता",
          "भाषा: ब्रजभाषा · काव्य रूप: पद",
        ],
        Tulsidas: [],
        Dev: [
          "रीतिकाल के कवि · श्रृंगार रस की प्रधानता",
          "प्रकृति का मानवीकरण — सावन के बादलों से कृष्ण की तुलना",
          "भाषा: ब्रजभाषा · काव्य में चित्रात्मकता और संगीतात्मकता",
          "उद्धव-गोपी संवाद — विरह और योग-ज्ञान का विरोध",
        ],
        "Jayashankar Prasad": [
          "छायावाद के चार प्रमुख स्तम्भों में से एक (प्रसाद, निराला, पंत, महादेवी)",
          "कामायनी (महाकाव्य), चन्द्रगुप्त (नाटक), आँसू (काव्य) — प्रमुख रचनाएँ",
          "पाठ 'आत्मकथ्य' में कवि जीवन के दर्द और रहस्य को शब्दों में नहीं बाँधना चाहते",
          "जीवन के गहरे दुखों को छिपाकर मुस्कान बनाए रखने का भाव",
          "भाषा: खड़ी बोली · विशेषता: सौंदर्यबोध, प्रकृति चित्रण",
        ],
        "Suryakant Tripathi Nirala": [
          "छायावाद के प्रमुख कवि · 'महाप्राण निराला' के नाम से प्रसिद्ध",
          "मुक्त छंद के जनक — पारम्परिक काव्य नियमों से मुक्ति",
          "पाठ 'उत्साह' — बादलों से गर्जन-तर्जन करने, नई क्रांति लाने का आह्वान",
          "पाठ 'अट नहीं रही है' — वसंत की सुंदरता का वर्णन",
          "समाज के शोषित-पीड़ित वर्ग के प्रति सहानुभूति",
        ],
        Nagarjun: [
          "प्रगतिशील काव्यधारा के कवि · जनकवि कहलाते हैं",
          "किसान, मजदूर, शोषित जन के कवि",
          "पाठ 'यह दंतुरित मुस्कान' — शिशु की मुस्कान से मृतप्राय हृदय में जीवन का संचार",
          "पाठ 'फसल' — फसल किसान के श्रम, प्रकृति (नदियाँ, सूरज, हवा, मिट्टी) का सामूहिक परिणाम",
          "भाषा: सरल, जनभाषा · बिंब और प्रतीकों का सहज प्रयोग",
        ],
        "Girija Kumar Mathur": [
          "पाठ 'छाया मत छूना' — बीते सुखों की याद दुख बढ़ाती है · वर्तमान में जीने का संदेश",
          "जो बीत गया उसकी छाया से दूर रहो — उसे याद करने से पीड़ा बढ़ती है",
          "भाषा: खड़ी बोली · भाव: निराशावाद से उठकर वर्तमान में जीने की प्रेरणा",
        ],
        Rituraj: [
          "पाठ 'कन्यादान' — माँ बेटी को विदाई के समय सीख देती है",
          "माँ: बेटी को सुंदरता पर गर्व न करने, गहनों के बंधन से बचने की सलाह",
          "नारी शक्ति का स्वाभिमान — अन्याय का विरोध करने का साहस",
          "भाषा: सरल खड़ी बोली · स्त्री-विमर्श की दृष्टि महत्त्वपूर्ण",
        ],
        "Manglesh Dabral": [
          "समकालीन हिंदी कवि · सामाजिक-राजनीतWa�क चेतना",
          "पाठ 'संगतकार' — गायक के साथ गाने वाला संगतकार मुख्य कलाकार की प्रसिद्धि में सहायक",
          "संगतकार अपनी आवाज़ जानबूझकर धीमी रखता है — विनम्रता और समर्पण",
          "थीम: सहयोगी की भूमिका, अहंकारहीनता, साथ देने का महत्त्व",
        ],
        "Swayam Prakash": [
          "पाठ 'नेताजी का चश्मा' — छोटे कस्बे में नेताजी सुभाष की मूर्ति पर असली चश्मा नहीं",
          "हालदार साहब हर बार देखते हैं कि कैप्टन (अपाहिज चश्मेवाला) मूर्ति को चश्मा लगाता है",
          "एक दिन कैप्टन नहीं रहा — बच्चों ने सरकंडे का चश्मा लगाया",
          "थीम: देशभक्ति · छोटे लोगों का बड़ा देशप्रेम",
        ],
        "Ramvriksha Benipuri": [
          "पाठ 'बालगोबिन भगत' — रेखाचित्र · साधु स्वभाव के किसान जो कबीरपंथी हैं",
          "पुत्र की मृत्यु पर रोने की बजाय भजन गाते हैं — आत्मा परमात्मा से मिली",
          "पतोहू को दूसरी शादी करने के लि �� खुद भेजते हैं",
          "थीम: वैराग्य, सांसारिक मोह से मुक्ति, सामाजिक कुरीतियों का विरोध",
        ],
        Yashpal: [
          "पाठ 'लखनवी अंदाज़' — नवाबी संस्कृति पर व्यंग्य",
          "लेखक सेकंड क्लास में बैठे नवाब को देखता है — नवाब खीरे को नमक-मिर्च लगाकर खिड़की से फेंकते हैं",
          "नवाब अंदाज़ और दिखावे में विश्वास रखते हैं — वास्तव में भूखे थे",
          "थीम: दिखावटी जीवन, सामंती मानसिकता पर व्यंग्य",
        ],
        "Sarveshwar Dayal Saxena": [
          "पाठ 'मानवीय करुणा की दिव्य चमक' — फादर बुल्के पर संस्मरण",
          "फादर बुल्के: बेल्जियम के ईसाई पादरी जो हिंदी से प्रेम करते थे",
          "रामकथा पर शोध किया · अंग्रेज़ी-हिंदी शब्दकोश बनाया",
          "थीम: मानवीयता, करुणा, सांस्कृतिक एकता",
        ],
        "Manu Bhandari": [
          "पाठ 'एक कहानी यह भी' — आत्मकथ्य",
          "लेखिका के पिता देशभक्त और स्वाभिमानी पर घर में तानाशाह",
          "मन्नू अपनी छात्र राजनीति, पिता की अपेक्षाओं और अपनी पहचान के बीच संघर्ष",
          "थीम: नारी स्वतंत्रता, पारिवारिक दबाव, आत्मनिर्भरता",
        ],
        "Mahavir Prasad Dwivedi": [
          "पाठ 'स्त्री शिक्षा के विरोधी कुतर्कों का खंडन' — तर्कपूर्ण निबंध",
          "स्त्री शिक्षा के विरोधियों के तर्कों को एक-एक कर खंडित करते हैं",
          "प्रमाण देते हैं कि प्राचीन भारत में स्त्रियाँ शिक्षित थीं (गार्गी, मैत्रेयी)",
          "थीम: स्त्री शिक्षा का समर्थन, सामाजिक कुरीतियों का विरोध",
        ],
        "Mata ka Anchal": [
          "लेखक: शिवपूजन सहाय · संस्मरण",
          "बच्चे का पिता के साथ खेलना, राम-भजन सुनना, पिता का भक्त बनाने का प्रयास",
          "साँप का डर लगने पर बच्चा माँ की गोद में जा छुपता है — माँ का आँचल सबसे सुरक्षित",
          "थीम: माँ का ममत्व, बचपन की निश्चिंतता, माँ-बच्चे का अटूट रिश्ता",
        ],
        "George Pancham ki Naak": [
          "लेखक: कमलेश्वर · व्यंग्य रचना",
          "ब्रिटेन की रानी के भारत आगमन से पहले जॉर्ज पंचम की मूर्ति की टूटी नाक ठीक करने की समस्या",
          "देश भर में नाक ढूँढी जाती है — कोई नाक नहीं मिलती",
          "अंत में जीवित व्यक्ति की नाक लगाने का सुझाव",
          "थीम: उपनिवेशवादी मानसिकता, आत्मसम्मान की कमी पर तीखा व्यंग्य",
        ],
        "Sana Sana Haath Jodi": [
          "लेखिका: मधु कांकरिया · यात्रा वृत्तांत",
          "सिक्किम और गंगटोक की यात्रा का सजीव वर्णन",
          "प्रकृति का अद्भुत सौंदर्य — हिमालय, बौद्ध मठ, कवि रवीन्द्रनाथ की पंक्तियाँ",
          "पर्यावरण प्रदूषण की चिंता, पहाड़ी जीवन की कठिनाइयाँ",
          "थीम: प्रकृति प्रेम, पर्यटन, पर्यावरण संरक्षण",
        ],
        "Ehi Thaiya Jhulani Herani Ho Rama": [
          "लेखक: शिवप्रसाद मिश्र 'रुद्र' · काशी की संस्कृति पर",
          "दुलारी और टुन्नू की कहानी — काशी के लोकगीत, विदेशी कपड़ों का बहिष्कार",
          "टुन्नू की देशभक्ति — विदेशी कपड़े छोड़ता है, ब्रिटिश अधिकारी द्वारा मारा जाता है",
          "दुलारी टुन्नू के मरने के बाद उसका खद्दर का कपड़ा ओढ़कर जुलूस में शामिल होती है",
          "थीम: देशभक्ति, स्वदेशी आंदोलन, त्याग",
        ],
        "Main Kyun Likhta Hoon": [
          "लेखक: अज्ञेय (सच्चिदानंद हीरानंद वात्स्यायन)",
          "लेखन की प्रेरणा पर विचार — आत्म-अभिव्यक्ति और स्वतंत्रता के लिए",
          "लिखना अनुभव को पाठक तक पहुँचाना है — लेखक का दायित्व",
          "अज्ञेय: प्रयोगवाद के प्रवर्तक · 'तारसप्तक' का संपादन",
          "थीम: साहित्य का उद्देश्य, लेखन की प्रेरणा और स्वतंत्रता",
        ],
        "Vyakaran: Rachna ke Aadhar par Vaakya Bhed": [
          "सरल वाक्य: एक उद्देश्य + एक विधेय (मैं खाता हूँ)",
          "संयुक्त वाक्य: दो या अधिक सरल वाक्य + संयोजक (और, परंतु, किंतु, इसलिए)",
          "मिश्र वाक्य: एक प्रधान + एक या अधिक आश्रित उपवाक्य (जब...तब, यद्यपि...तथापि)",
          "उपवाक्य: वाक्य का वह भाग जिसमें कर्ता और क्रिया हो",
          "मिश्र वाक्य में संज्ञा उपवाक्य, विशेषण उपवाक्य, क्रियाविशेषण उपवाक्य",
        ],
        "Vyakaran: Vaachya": [
          "कर्तृवाच्य: क्रिया कर्ता के अनुसार (राम खाना खाता है)",
          "कर्मवाच्य: क्रिया कर्म के अनुसार (राम द्वारा खाना खाया जाता है)",
          "भाववाच्य: क्रिया भाव के अनुसार — अकर्मक क्रिया (मुझसे चला नहीं जाता)",
          "कर्तृवाच्य से कर्मवाच्य बनाना: कर्ता + 'द्वारा/से' · कर्म की विभक्ति हटाएँ · क्रिया बदलें",
          "भाववाच्य में बहुधा नकारात्मकता का भाव होता है",
        ],
        "Vyakaran: Pad Parichay": [
          "पद परिचय: वाक्य में प्रत्येक शब्द का व्याकरणिक विश्लेषण",
          "संज्ञा: प्रकार, लिंग, वचन, कारक, क्रिया से संबंध",
          "सर्वनाम: प्रकार, पुरुष, लिंग, वचन, कारक",
          "विशेषण: प्रकार, लिंग, वचन, विशेष्य",
          "क्रिया: प्रकार (सकर्मक/अकर्मक), काल, वाच्य, कर्ता",
          "क्रियाविशेषण: प्रकार, जिस क्रिया का विशेषण",
          "अव्यय: प्रकार (संबंधबोधक, समुच्चयबोधक, विस्मयादिबोधक)",
        ],
        "Vyakaran: Alankaar": [
          "अलंकार: काव्य की शोभा बढ़ाने वाले उपकरण",
          "शब्दालंकार: शब्दों की ध्वनि पर आधारित — अनुप्रास, यमक, श्लेष",
          "अनुप्रास: एक ही वर्ण की आवृत्ति (चारु-चंद्र की चंचल किरणें)",
          "यमक: एक ही शब्द अलग-अलग अर्थ में (काली घटा का घमंड घटा)",
          "श्लेष: एक शब्द में एक साथ कई अर्थ",
          "अर्थालंकार: अर्थ पर आधारित — उपमा, रूपक, उत्प्रेक्षा, अतिशयोक्ति",
          "उपमा: दो वस्तुओं की समानता (नयन मृग-सा चंचल — सा, जैसा)",
          "रूपक: उपमेय पर उपमान का आरोप (चरण-कमल) — वाचकांश नहीं",
          "उत्प्रेक्षा: उपमेय में उपमान की संभावना (मनु ज्यों, मानो)",
        ],
      },
    },
    9: {
      Maths: {
        "Number Systems": [
          "Natural numbers ⊂ Whole numbers ⊂ Integers ⊂ Rational numbers ⊂ Real numbers",
          "Irrational numbers cannot be expressed as p/q (e.g. √2, √3, π)",
          "Every real number has a unique point on the number line",
          "Decimal expansion: terminating or non-terminating repeating → rational",
          "Non-terminating non-repeating → irrational",
          "Laws of exponents: aᵐ × aⁿ = aᵐ⁺ⁿ · (aᵐ)ⁿ = aᵐⁿ · a⁰ = 1",
        ],
        Polynomials: [
          "Monomial: 1 term · Binomial: 2 terms · Trinomial: 3 terms",
          "Zero of polynomial p(x): value of x where p(x) = 0",
          "Remainder theorem: p(x) divided by (x−a), remainder = p(a)",
          "Factor theorem: (x−a) is a factor of p(x) if p(a) = 0",
          "Algebraic identities: (a+b)² = a²+2ab+b² · (a−b)² = a²−2ab+b² · a²−b² = (a+b)(a−b)",
        ],
        Triangles: [
          "Congruence: SSS, SAS, ASA, AAS, RHS",
          "In isosceles triangle, angles opposite equal sides are equal",
          "Angle sum property: sum of angles of triangle = 180°",
          "Exterior angle = sum of two non-adjacent interior angles",
          "Triangle inequality: sum of any two sides > third side",
        ],
        Statistics: [
          "Mean = Σx/n (ungrouped data)",
          "Median = middle value when data arranged in order",
          "Mode = most frequently occurring value",
          "Range = maximum − minimum",
          "Frequency distribution: organising data in class intervals",
        ],
      },
      Physics: {
        Motion: [
          "Distance = total path covered (scalar) · Displacement = shortest path (vector)",
          "Speed = distance/time · Velocity = displacement/time (vector)",
          "Uniform motion: equal distances in equal time intervals",
          "Acceleration a = (v−u)/t · unit: m/s²",
          "Equations of motion: v = u+at · s = ut+½at² · v² = u²+2as",
          "Graphical representation: distance-time and velocity-time graphs",
        ],
        "Force and Laws of Motion": [
          "Newton's 1st Law (Inertia): body stays at rest/uniform motion unless external force acts",
          "Newton's 2nd Law: F = ma · force = rate of change of momentum",
          "Newton's 3rd Law: every action has equal and opposite reaction",
          "Momentum p = mv · unit: kg·m/s",
          "Conservation of momentum: total momentum remains constant when no external force",
        ],
        Gravitation: [
          "Universal Law: F = Gm₁m₂/r² · G = 6.67 × 10⁻¹¹ N·m²/kg²",
          "g = 9.8 m/s² on Earth's surface · g = GM/R²",
          "Weight W = mg · Mass is constant everywhere; weight varies",
          "Free fall: object falling only under gravity (no air resistance)",
          "Buoyancy: upward force on object submerged in fluid",
          "Archimedes' Principle: buoyant force = weight of fluid displaced",
        ],
        "Work and Energy": [
          "Work W = F × d × cos θ · unit: joule (J)",
          "Work = 0 if force ⊥ displacement or no displacement",
          "Kinetic energy KE = ½mv²",
          "Potential energy PE = mgh",
          "Law of conservation of energy: energy is neither created nor destroyed",
          "Power P = W/t = F × v · unit: watt (W) · 1 HP = 746 W",
        ],
      },
      Chemistry: {
        "Matter in Our Surroundings": [
          "Matter: solid, liquid, gas — based on arrangement and movement of particles",
          "Solid: fixed shape and volume · Liquid: fixed volume, no fixed shape · Gas: no fixed shape or volume",
          "Melting point of ice = 0°C · Boiling point of water = 100°C",
          "Sublimation: solid → gas directly (dry ice, iodine, camphor)",
          "Evaporation: surface phenomenon, causes cooling",
          "Latent heat: heat absorbed/released during state change without temperature change",
        ],
        "Atoms and Molecules": [
          "Law of conservation of mass: mass of reactants = mass of products",
          "Law of definite proportions: compound always has same elements in fixed mass ratio",
          "Atom = smallest particle of element · Molecule = group of atoms",
          "Atomic mass unit (amu): 1 amu = 1/12th mass of C-12",
          "Mole concept: 1 mole = 6.022 × 10²³ particles (Avogadro's number)",
          "Molar mass = atomic/molecular mass in grams",
        ],
      },
      Biology: {
        "The Fundamental Unit of Life": [
          "Cell = basic structural and functional unit of life",
          "Plant cell: cell wall, large central vacuole, chloroplasts, plastids",
          "Animal cell: centrioles, small vacuoles, no cell wall or plastids",
          "Nucleus: control centre, contains DNA · nuclear membrane, nucleolus, chromosomes",
          "Mitochondria: powerhouse, produce ATP (energy)",
          "Osmosis: movement of water across semi-permeable membrane from high to low concentration",
          "Plasmolysis: cell shrinks when placed in hypertonic solution",
        ],
        Tissues: [
          "Plant tissues: meristematic (actively dividing) and permanent (differentiated)",
          "Meristematic: apical (root/shoot tip), lateral (girth), intercalary (between nodes)",
          "Simple permanent: parenchyma (basic function), collenchyma (flexibility), sclerenchyma (strength)",
          "Complex permanent: xylem (water transport), phloem (food transport)",
          "Animal tissues: epithelial, connective, muscular, nervous",
          "Epithelial: covers surfaces · Connective: provides support (bone, blood, cartilage)",
          "Muscular: striated (voluntary), smooth (involuntary), cardiac",
          "Neurons: basic unit of nervous tissue · dendrites → cell body → axon",
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
// FORMULAS TAB – Math & Science quick reference
// ============================================================
function renderFormulasTab() {
  const _ftContainer =
    document.getElementById("resource-tab-content") ||
    document.getElementById("app");
  const COLORS = [
    "#f0b429",
    "#0fca8c",
    "#9b6dff",
    "#4f8ef7",
    "#ec4899",
    "#f0564a",
    "#06b6d4",
    "#a78bfa",
  ];
  const FORMULAS = {
    "📐 Maths": {
      "Real Numbers & Polynomials": [
        { f: "HCF × LCM = a × b", l: "Product of two numbers" },
        { f: "Euclid's Division: a = bq + r (0 ≤ r < b)", l: "Division lemma" },
        { f: "α + β = −b/a, αβ = c/a", l: "Zeroes of quadratic ax²+bx+c" },
        { f: "α+β+γ = −b/a, αβγ = −d/a", l: "Zeroes of cubic ax³+bx²+cx+d" },
      ],
      "Quadratic Equations": [
        { f: "x = (−b ± √(b²−4ac)) / 2a", l: "Quadratic formula" },
        {
          f: "D = b²−4ac",
          l: "D>0: 2 real roots · D=0: equal roots · D<0: no real roots",
        },
      ],
      "Arithmetic Progressions": [
        { f: "aₙ = a + (n−1)d", l: "nth term of AP" },
        { f: "Sₙ = n/2 · [2a + (n−1)d]", l: "Sum of n terms" },
        { f: "Sₙ = n/2 · (a + l)", l: "Sum when last term l is known" },
      ],
      "Triangles & Coordinate Geometry": [
        { f: "AC² = AB² + BC²", l: "Pythagoras theorem" },
        {
          f: "ar(△ABC)/ar(△PQR) = (AB/PQ)²",
          l: "Similar triangles — area ratio",
        },
        { f: "d = √[(x₂−x₁)² + (y₂−y₁)²]", l: "Distance formula" },
        { f: "M = ((x₁+x₂)/2, (y₁+y₂)/2)", l: "Midpoint formula" },
        {
          f: "P = ((mx₂+nx₁)/(m+n), (my₂+ny₁)/(m+n))",
          l: "Section formula (internal)",
        },
        {
          f: "A = ½|x₁(y₂−y₃)+x₂(y₃−y₁)+x₃(y₁−y₂)|",
          l: "Area of triangle (coords)",
        },
      ],
      Trigonometry: [
        {
          f: "sin θ = opp/hyp · cos θ = adj/hyp · tan θ = opp/adj",
          l: "Basic ratios",
        },
        { f: "sin²θ + cos²θ = 1", l: "Pythagorean identity" },
        { f: "1 + tan²θ = sec²θ · 1 + cot²θ = cosec²θ", l: "Other identities" },
        {
          f: "sin 0°=0, 30°=½, 45°=1/√2, 60°=√3/2, 90°=1",
          l: "Standard values — sin",
        },
        {
          f: "cos 0°=1, 30°=√3/2, 45°=1/√2, 60°=½, 90°=0",
          l: "Standard values — cos",
        },
      ],
      "Circles & Areas": [
        { f: "Area of circle = πr²", l: "Circle area" },
        { f: "Circumference = 2πr", l: "Circle perimeter" },
        { f: "Area of sector = (θ/360) × πr²", l: "Sector area" },
        { f: "Arc length = (θ/360) × 2πr", l: "Arc length" },
        {
          f: "Area of segment = Area sector − Area triangle",
          l: "Segment area",
        },
      ],
      "Surface Area & Volume": [
        { f: "Cube: SA=6a², V=a³", l: "Cube" },
        { f: "Cuboid: SA=2(lb+bh+lh), V=lbh", l: "Cuboid" },
        { f: "Cylinder: CSA=2πrh, TSA=2πr(r+h), V=πr²h", l: "Cylinder" },
        { f: "Cone: CSA=πrl, TSA=πr(r+l), V=⅓πr²h, l=√(r²+h²)", l: "Cone" },
        { f: "Sphere: SA=4πr², V=⁴⁄₃πr³", l: "Sphere" },
        { f: "Hemisphere: CSA=2πr², TSA=3πr², V=⅔πr³", l: "Hemisphere" },
      ],
      "Statistics & Probability": [
        { f: "Mean = Σfx / Σf", l: "Grouped data mean (direct method)" },
        { f: "Median = l + [(n/2−cf)/f] × h", l: "Median of grouped data" },
        {
          f: "Mode = l + [(f₁−f₀)/(2f₁−f₀−f₂)] × h",
          l: "Mode of grouped data",
        },
        { f: "3 Median = Mode + 2 Mean", l: "Empirical relationship" },
        { f: "P(E) = favourable outcomes / total outcomes", l: "Probability" },
        { f: "P(Ē) = 1 − P(E)", l: "Complement rule" },
      ],
    },
    "🔬 Physics": {
      "Light — Reflection": [
        {
          f: "1/f = 1/v + 1/u (mirror)",
          l: "Mirror formula (use sign convention)",
        },
        { f: "m = −v/u = h'/h", l: "Magnification — mirror" },
        { f: "f = R/2", l: "Focal length = half radius of curvature" },
      ],
      "Light — Refraction": [
        { f: "n = c/v = sin i / sin r", l: "Refractive index / Snell's law" },
        { f: "1/f = 1/v − 1/u (lens)", l: "Lens formula" },
        { f: "m = v/u = h'/h", l: "Magnification — lens" },
        { f: "P = 1/f (m), unit: D (dioptre)", l: "Power of lens" },
        { f: "P = P₁ + P₂", l: "Combined power of lenses" },
      ],
      Electricity: [
        { f: "V = IR", l: "Ohm's law" },
        { f: "R = ρl/A", l: "Resistance — ρ is resistivity" },
        { f: "Rs = R₁+R₂+R₃", l: "Series combination" },
        { f: "1/Rp = 1/R₁+1/R₂+1/R₃", l: "Parallel combination" },
        { f: "P = VI = I²R = V²/R", l: "Electric power" },
        { f: "H = I²Rt (Joule's law)", l: "Heat produced" },
        { f: "1 kWh = 3.6×10⁶ J", l: "Commercial unit of energy" },
      ],
      "Magnetic Effects": [
        { f: "F = BIl sinθ", l: "Force on current-carrying conductor" },
        {
          f: "Fleming's Left Hand Rule",
          l: "Thumb=Force, Index=B-field, Middle=Current",
        },
        {
          f: "Fleming's Right Hand Rule",
          l: "For generators — induced current direction",
        },
      ],
    },
    "🧪 Chemistry": {
      "Chemical Reactions": [
        { f: "Combination: A + B → AB", l: "Two reactants form one product" },
        { f: "Decomposition: AB → A + B", l: "One reactant splits" },
        {
          f: "Displacement: A + BC → AC + B",
          l: "More reactive displaces less",
        },
        { f: "Double displacement: AB + CD → AD + CB", l: "Ions exchange" },
        { f: "2Mg + O₂ → 2MgO", l: "Magnesium burning (combination)" },
      ],
      "Acids, Bases & Salts": [
        { f: "Acid + Base → Salt + Water", l: "Neutralisation reaction" },
        { f: "pH < 7: acid · pH = 7: neutral · pH > 7: base", l: "pH scale" },
        { f: "NaOH + HCl → NaCl + H₂O", l: "Example neutralisation" },
        {
          f: "CuSO₄·5H₂O = Blue vitriol",
          l: "Water of crystallisation example",
        },
      ],
      "Metals & Non-Metals": [
        { f: "Metal + O₂ → Metal oxide (basic)", l: "Metal oxidation" },
        {
          f: "Non-metal + O₂ → Non-metal oxide (acidic)",
          l: "Non-metal oxidation",
        },
        { f: "2Na + 2H₂O → 2NaOH + H₂↑", l: "Sodium with water" },
        { f: "Fe₂O₃ + 2Al → Al₂O₃ + 2Fe + heat", l: "Thermite reaction" },
        {
          f: "Reactivity: K>Na>Ca>Mg>Al>Zn>Fe>Pb>H>Cu>Au",
          l: "Activity series",
        },
      ],
      "Carbon Compounds": [
        {
          f: "CₙH₂ₙ₊₂ (Alkane) · CₙH₂ₙ (Alkene) · CₙH₂ₙ₋₂ (Alkyne)",
          l: "Homologous series",
        },
        {
          f: "Saponification: Ester + NaOH → Soap + Glycerol",
          l: "Soap making",
        },
        {
          f: "Each homologue differs by −CH₂− (14 mass units)",
          l: "Homologous series rule",
        },
      ],
    },
    "🌿 Biology": {
      "Life Processes": [
        {
          f: "Photosynthesis: 6CO₂+6H₂O → C₆H₁₂O₆+6O₂ (sunlight+chlorophyll)",
          l: "Photosynthesis",
        },
        {
          f: "Aerobic: C₆H₁₂O₆+6O₂ → 6CO₂+6H₂O + 38 ATP",
          l: "Aerobic respiration",
        },
        { f: "Anaerobic (yeast): C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂", l: "Fermentation" },
      ],
      "Control & Coordination": [
        {
          f: "Reflex arc: Stimulus→Receptor→Sensory nerve→Spinal cord→Motor nerve→Effector→Response",
          l: "Reflex arc pathway",
        },
        { f: "DNA → mRNA → Protein", l: "Central dogma of molecular biology" },
      ],
      Heredity: [
        {
          f: "Phenotype ratio (monohybrid) = 3:1 (dominant:recessive)",
          l: "Mendel's monohybrid cross",
        },
        {
          f: "Genotype ratio = 1 TT : 2 Tt : 1 tt",
          l: "Monohybrid genotype ratio",
        },
        { f: "Dihybrid phenotype ratio = 9:3:3:1", l: "Dihybrid cross" },
      ],
    },
  };

  const subjects = Object.keys(FORMULAS);
  let selSubj = subjects[0];
  let searchQ = "";

  function buildHTML() {
    const subj = FORMULAS[selSubj] || {};
    const cats = Object.keys(subj);
    const q = searchQ.toLowerCase().trim();
    return cats
      .map((cat, ci) => {
        const col = COLORS[ci % COLORS.length];
        const items = (subj[cat] || []).filter(
          (item) =>
            !q ||
            item.f.toLowerCase().includes(q) ||
            item.l.toLowerCase().includes(q),
        );
        if (!items.length) return "";
        return `<div style="margin-bottom:16px">
        <div style="font-size:0.62rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:${col};background:${col}15;border:1px solid ${col}30;border-radius:20px;padding:3px 10px;display:inline-block;margin-bottom:8px">${cat}</div>
        ${items
          .map(
            (item) => `<div onclick="
          try{navigator.clipboard.writeText('${item.f.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, " ")}').then(()=>{this.querySelector('.fs-copied').style.opacity=1;setTimeout(()=>{if(this.querySelector('.fs-copied'))this.querySelector('.fs-copied').style.opacity=0;},1200)});}catch(e){}
        " style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:10px 13px;margin-bottom:7px;cursor:pointer;position:relative;transition:border-color .15s" onmouseover="this.style.borderColor='${col}55'" onmouseout="this.style.borderColor='rgba(255,255,255,0.07)'">
          <div style="font-family:'Courier New',monospace;font-size:0.87rem;color:#fff;font-weight:700;line-height:1.5;margin-bottom:4px;padding-right:40px">${escapeHtml(item.f)}</div>
          <div style="font-size:0.71rem;color:var(--text-muted);line-height:1.4">${escapeHtml(item.l)}</div>
          <div class="fs-copied" style="position:absolute;top:8px;right:10px;font-size:0.62rem;font-weight:800;color:#0fca8c;opacity:0;transition:opacity .2s;pointer-events:none">✓ Copied</div>
        </div>`,
          )
          .join("")}
      </div>`;
      })
      .join("");
  }

  document.getElementById("resource-tab-content").innerHTML = `
    <style>
      .fs-subj-btn{padding:6px 14px;border-radius:20px;border:1.5px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:var(--text-muted);font-size:0.74rem;font-weight:800;cursor:pointer;font-family:inherit;transition:all .18s;white-space:nowrap}
      .fs-subj-btn.on{border-color:#f0b429;background:rgba(240,180,41,0.12);color:#f0b429}
    </style>
    <div style="position:relative;margin-bottom:14px">
      <input id="fs-search" type="text" placeholder="🔍 Search formulas..." style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.1);border-radius:12px;padding:9px 13px;color:#fff;font-size:0.83rem;font-family:inherit;outline:none" oninput="fsSearch(this.value)" onfocus="this.style.borderColor='rgba(240,180,41,0.4)'" onblur="this.style.borderColor='rgba(255,255,255,0.1)'">
    </div>
    <div style="display:flex;gap:7px;overflow-x:auto;padding-bottom:4px;margin-bottom:16px;scrollbar-width:none">
      ${subjects.map((s) => `<button class="fs-subj-btn${s === selSubj ? " on" : ""}" id="fsbtn-${s.replace(/[^a-z]/gi, "_")}" onclick="fsSwitchSubj('${s.replace(/'/g, "\\'")}')">${s}</button>`).join("")}
    </div>
    <div id="fs-content">${buildHTML()}</div>
  `;

  window.fsSwitchSubj = (s) => {
    subjects.forEach((sub) => {
      const el = document.getElementById(
        "fsbtn-" + sub.replace(/[^a-z]/gi, "_"),
      );
      if (el) {
        el.classList.toggle("on", sub === s);
      }
    });
    selSubj = s;
    searchQ = "";
    const si = document.getElementById("fs-search");
    if (si) si.value = "";
    document.getElementById("fs-content").innerHTML = buildHTML();
  };
  window.fsSearch = (q) => {
    searchQ = q;
    document.getElementById("fs-content").innerHTML = buildHTML();
  };
}

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
  navigate("landing");
  window.S = S;
  if (!loadPerformance()) showOnboardingModal();
}

showNameSplash(init);

// ============================================================
// POWERUPS SYSTEM
// ============================================================

function showPwrToast(msg, color) {
  const el = document.getElementById("pwr-toast");
  if (!el) return;
  el.innerHTML = `<div style="font-size:0.78rem;font-weight:700;color:${color || "#f7c74f"};background:rgba(0,0,0,0.5);border-radius:8px;padding:5px 12px;display:inline-block;animation:_pwrPop .3s ease">${msg}</div>`;
  setTimeout(() => {
    if (el) el.innerHTML = "";
  }, 2500);
}

// Inject the toast animation keyframe once
(function () {
  if (document.getElementById("_pwr-style")) return;
  const s = document.createElement("style");
  s.id = "_pwr-style";
  s.textContent = `@keyframes _pwrPop{from{transform:scale(0.8) translateY(4px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}`;
  document.head.appendChild(s);
})();

// ── Gem Shop for Classroom Powerups ──
const _GEM_SHOP = [
  {
    id: "fiftyFifty",
    name: "Eliminator",
    emoji: "⚡",
    desc: "Remove 2 wrong options from MCQ",
    cost: 2,
    color: "#f7c74f",
  },
  {
    id: "extraTime",
    name: "Time Warp",
    emoji: "⏰",
    desc: "+15 seconds on the timer",
    cost: 1,
    color: "#4fd9b3",
  },
  {
    id: "shield",
    name: "Compass",
    emoji: "🧭",
    desc: "Hint toward the correct answer",
    cost: 3,
    color: "#f7714f",
  },
  {
    id: "skip",
    name: "Oracle",
    emoji: "🔮",
    desc: "Skip & reveal answer + explanation",
    cost: 5,
    color: "#9b6dff",
  },
];

window.openGemShop = function () {
  const existing = document.getElementById("_gem-shop-overlay");
  if (existing) {
    existing.remove();
    return;
  }
  const overlay = document.createElement("div");
  overlay.id = "_gem-shop-overlay";
  overlay.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(4px)";
  overlay.innerHTML = `
    <div style="width:100%;max-width:480px;background:#0f1623;border-radius:24px 24px 0 0;padding:24px 20px 32px;border-top:1px solid rgba(255,255,255,0.1);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div style="font-size:1.1rem;font-weight:900;color:#fff">💎 Gem Shop <span style="font-size:0.8rem;color:#c084fc;font-weight:700">${S.gems || 0} gems</span></div>
        <button onclick="document.getElementById('_gem-shop-overlay').remove()" style="background:rgba(255,255,255,0.08);border:none;color:#fff;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;font-family:inherit">×</button>
      </div>
      <div style="font-size:0.72rem;color:#5a6a8a;margin-bottom:16px">Earn gems: 10 correct answers = 1 💎 · Top 3 league = 3 💎 · Complete weekly mission = 2 💎</div>
      <div style="display:flex;flex-direction:column;gap:10px" id="_gs-items">
        ${_GEM_SHOP
          .map(
            (p) => `
          <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;border:1.5px solid ${p.color}33;background:${p.color}0d">
            <span style="font-size:1.8rem">${p.emoji}</span>
            <div style="flex:1">
              <div style="font-size:0.9rem;font-weight:900;color:#fff">${p.name}</div>
              <div style="font-size:0.72rem;color:#5a6a8a">${p.desc}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:0.7rem;color:#c084fc;font-weight:800;margin-bottom:4px">${p.cost} 💎</div>
              <button onclick="window.buyPwr('${p.id}',${p.cost})" id="gs-buy-${p.id}" style="padding:5px 12px;border-radius:8px;border:none;background:${(S.gems || 0) >= p.cost ? p.color : "rgba(255,255,255,0.07)"};color:${(S.gems || 0) >= p.cost ? "#000" : "#5a6a8a"};font-size:0.72rem;font-weight:800;cursor:${(S.gems || 0) >= p.cost ? "pointer" : "not-allowed"};font-family:inherit;transition:all .2s">${(S.gems || 0) >= p.cost ? "Buy" : "Need " + p.cost + "💎"}</button>
            </div>
          </div>`,
          )
          .join("")}
      </div>
    </div>`;
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
};

window.buyPwr = function (type, cost) {
  if ((S.gems || 0) < cost) return;
  S.gems -= cost;
  saveState();
  updateHeader();
  _pwrUps[type] = (_pwrUps[type] || 0) + 1;
  // Refresh shop gem count + button states
  const shopGem = document.querySelector("#_gem-shop-overlay .shopgems");
  _GEM_SHOP.forEach((p) => {
    const btn = document.getElementById(`gs-buy-${p.id}`);
    if (btn) {
      const canAfford = (S.gems || 0) >= p.cost;
      btn.style.background = canAfford ? p.color : "rgba(255,255,255,0.07)";
      btn.style.color = canAfford ? "#000" : "#5a6a8a";
      btn.style.cursor = canAfford ? "pointer" : "not-allowed";
      btn.textContent = canAfford ? "Buy" : `Need ${p.cost}💎`;
    }
  });
  // Update gem count in shop header
  const shopHeader = document.querySelector(
    "#_gem-shop-overlay div div:first-child",
  );
  if (shopHeader)
    shopHeader.innerHTML = `💎 Gem Shop <span style="font-size:0.8rem;color:#c084fc;font-weight:700">${S.gems || 0} gems</span>`;
  // Re-enable the powerup button in the game bar
  const barBtn = document.getElementById(
    type === "fiftyFifty"
      ? "pwr-5050"
      : type === "extraTime"
        ? "pwr-time"
        : type === "skip"
          ? "pwr-skip"
          : "pwr-shield",
  );
  if (barBtn) {
    barBtn.style.opacity = "1";
    barBtn.style.pointerEvents = "auto";
    const last = barBtn.querySelector("span:last-child");
    if (last) last.textContent = _pwrUps[type] + "x left";
  }
  // Update gem count on shop button
  const shopCountEl = document.getElementById("gem-shop-count");
  if (shopCountEl) shopCountEl.textContent = (S.gems || 0) + " gems";
  showPwrToast(
    `${_GEM_SHOP.find((p) => p.id === type)?.emoji} ${_GEM_SHOP.find((p) => p.id === type)?.name} purchased!`,
    "#c084fc",
  );
};

window.usePwr = function (type) {
  if (_pwrUps[type] <= 0 && !(type === "shield" && _pwrShieldActive)) return;

  if (type === "fiftyFifty") {
    // Remove 2 wrong options, keep correct + 1 wrong
    const q = _crState?.questions?.[_crCurrentQ];
    if (!q) return;
    const correctAns = q.answer;
    const opts = document.querySelectorAll("._cropt");
    let removed = 0;
    opts.forEach((btn) => {
      if (removed >= 2) return;
      if (btn.textContent.trim() !== correctAns && !btn.disabled) {
        btn.style.opacity = "0.25";
        btn.style.pointerEvents = "none";
        btn.style.textDecoration = "line-through";
        removed++;
      }
    });
    _pwrUps.fiftyFifty--;
    showPwrToast("⚡ Eliminator — two wrong options removed!", "#f7c74f");
    document
      .getElementById("pwr-5050")
      .querySelector("span:last-child").textContent =
      _pwrUps.fiftyFifty + "x left";
    if (_pwrUps.fiftyFifty === 0) {
      const b = document.getElementById("pwr-5050");
      b.style.opacity = "0.35";
      b.style.pointerEvents = "none";
    }
  } else if (type === "extraTime") {
    _crTimeLeft = Math.min(_crTimeLeft + 15, 90);
    const numEl = document.getElementById("cr-timer-num");
    if (numEl) {
      numEl.textContent = _crTimeLeft;
      numEl.style.color = "#4fd9b3";
      setTimeout(() => {
        if (numEl) numEl.style.color = "#f0b429";
      }, 1500);
    }
    _pwrUps.extraTime--;
    showPwrToast("⏰ Time Warp — +15 seconds added!", "#4fd9b3");
    document
      .getElementById("pwr-time")
      .querySelector("span:last-child").textContent =
      _pwrUps.extraTime + "x left";
    if (_pwrUps.extraTime === 0) {
      const b = document.getElementById("pwr-time");
      b.style.opacity = "0.35";
      b.style.pointerEvents = "none";
    }
  } else if (type === "skip") {
    // Auto-submit a SKIP and move to next question
    _pwrUps.skip--;
    const skipQ = _crState?.questions?.[_crCurrentQ];
    const skipAns = skipQ?.answer || "—";
    const skipExp = skipQ?.explanation || skipQ?.exp || "";
    showPwrToast("🔮 Oracle activated!", "#9b6dff");
    stopCrTimer();
    _crAnswered[_crCurrentQ] = "SKIP";
    // Show answer + explanation before advancing
    const toast = document.getElementById("pwr-toast");
    if (toast)
      toast.innerHTML = `<div style="font-size:0.78rem;padding:8px 10px;border-radius:10px;border:1px solid rgba(155,109,255,0.3);background:rgba(155,109,255,0.1);color:#eef2ff;margin-bottom:4px;line-height:1.5"><span style="font-weight:800;color:#9b6dff;">🔮 Oracle: </span><b>Answer: ${escapeHtml(skipAns)}</b>${skipExp ? `<br><span style="color:#a0aec0">${escapeHtml(skipExp)}</span>` : ""}</div>`;
    setTimeout(() => {
      const total = _crState?.questions?.length || 1;
      if (_crCurrentQ + 1 < total) {
        goNextCrQ();
      } else {
        showCrAllDone();
      }
    }, 3000);
    const b = document.getElementById("pwr-skip");
    if (b) {
      b.style.opacity = "0.35";
      b.style.pointerEvents = "none";
      b.querySelector("span:last-child").textContent = "0x left";
    }
  } else if (type === "shield") {
    if (_pwrShieldActive) return; // already on
    _pwrShieldActive = true;
    _pwrUps.shield = Math.max(0, _pwrUps.shield - 1);
    showPwrToast("🧭 Compass ON — next wrong answer absorbed!", "#f7714f");
    const b = document.getElementById("pwr-shield");
    if (b) {
      b.style.background = "rgba(247,113,79,0.25)";
      b.querySelector("span:last-child").textContent = "ACTIVE";
      b.style.pointerEvents = "none";
    }
  }
};

window.pracPwr = async function (type, idx, btn) {
  const q = S.todayPractice?.[idx];
  if (!q) return;
  const hintEl = document.getElementById(`prac-pwr-hint-${idx}`);
  if (!hintEl) return;

  // Prevent double-click
  if (btn && btn.disabled) return;

  // ── XP cost: 20 XP per powerup ──
  const XP_COST = 20;
  if ((S.xp || 0) < XP_COST) {
    hintEl.innerHTML = `<div style="font-size:0.78rem;color:#f7714f;padding:8px 10px;border-radius:10px;border:1px solid rgba(247,113,79,0.2);background:rgba(247,113,79,0.07);">❌ Not enough XP! You need ${XP_COST} XP to use a powerup.</div>`;
    return;
  }

  // Disable btn immediately to prevent re-entry
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = "0.5";
  }

  // Deduct XP
  S.xp -= XP_COST;
  saveState();
  updateHeader();

  hintEl.innerHTML = `<div style="font-size:0.78rem;color:#5a6a8a;padding:8px 10px;border-radius:10px;border:1px dashed rgba(255,255,255,0.1);">✨ Using powerup (-${XP_COST} XP)...</div>`;

  const prompts = {
    hint: `Give a short helpful HINT (2-3 sentences, no full answer) for this CBSE question: "${q.question}". Subject: ${S.subjectPreference}, Class ${S.classPreference}.`,
    eliminate: `Give the single most important KEY POINT or concept needed to answer this question (1-2 sentences): "${q.question}". Subject: ${S.subjectPreference}.`,
    simplify: `Rephrase this exam question in much simpler language a student can easily understand. Just the rephrased question, nothing else: "${q.question}"`,
  };
  const colors = { hint: "#f7c74f", eliminate: "#4fd9b3", simplify: "#9b6dff" };
  const labels = {
    hint: "💡 Hint",
    eliminate: "🎯 Key Point",
    simplify: "🔍 Simplified",
  };

  try {
    const res = await fetch("/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompts[type], history: [] }),
    });
    const data = await res.json();
    const text =
      data.reply ||
      data.message ||
      data.content ||
      "Try breaking the question into parts and recall the chapter.";
    hintEl.innerHTML = `<div style="font-size:0.82rem;line-height:1.55;padding:10px 12px;border-radius:10px;border:1px solid rgba(${type === "hint" ? "247,199,79" : type === "eliminate" ? "79,217,179" : "155,109,255"},0.25);background:rgba(${type === "hint" ? "247,199,79" : type === "eliminate" ? "79,217,179" : "155,109,255"},0.07);color:#eef2ff;margin-bottom:6px;"><span style="font-weight:800;color:${colors[type]}">${labels[type]}: </span>${escapeHtml(text)}</div>`;
  } catch (e) {
    hintEl.innerHTML = `<div style="font-size:0.78rem;color:#f7714f;padding:8px;">Powerup unavailable right now.</div>`;
    // Refund XP if failed
    S.xp += XP_COST;
    saveState();
    updateHeader();
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = "1";
    }
  }
};

// ============================================================
// ABOUT PAGE — for judges / new users
// ============================================================
function renderAbout() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div style="padding:16px;max-width:480px;margin:0 auto;">
      <button onclick="navigate('landing')" style="background:none;border:none;color:#5a6a8a;font-size:0.82rem;cursor:pointer;font-family:inherit;margin-bottom:16px;display:flex;align-items:center;gap:6px;">← Back</button>

      <!-- Hero -->
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:3rem;margin-bottom:8px;">⚡</div>
        <div style="font-size:1.6rem;font-weight:900;background:linear-gradient(135deg,#4f8ef7,#9b6dff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">StasisEducation</div>
        <div style="font-size:0.88rem;color:#5a6a8a;margin-top:6px;line-height:1.5;">AI-powered personalized CBSE tutor<br>for Classes 6–10</div>
      </div>

      <!-- Problem -->
      <div style="background:rgba(247,113,79,0.08);border:1px solid rgba(247,113,79,0.2);border-radius:18px;padding:18px;margin-bottom:12px;">
        <div style="font-size:0.75rem;font-weight:800;color:#f7714f;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">❌ The Problem</div>
        <div style="font-size:0.9rem;color:#eef2ff;line-height:1.6;">Students spend hours studying but don't know which topics they're actually weak in. Traditional tuition is expensive, one-size-fits-all, and boring. Most students give up before exams.</div>
      </div>

      <!-- Solution -->
      <div style="background:rgba(79,217,179,0.08);border:1px solid rgba(79,217,179,0.2);border-radius:18px;padding:18px;margin-bottom:12px;">
        <div style="font-size:0.75rem;font-weight:800;color:#4fd9b3;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">✅ Our Solution</div>
        <div style="font-size:0.9rem;color:#eef2ff;line-height:1.6;">StasisEducation uses AI to identify your weak chapters, generate personalized practice questions, and make studying feel like a game — so students actually want to study.</div>
      </div>

      <!-- Features -->
      <div style="font-size:0.85rem;font-weight:800;color:#eef2ff;margin-bottom:10px;">🚀 Key Features</div>
      ${[
        [
          "🤖",
          "AI Tutor (Nova)",
          "Ask any CBSE question, get instant explanations",
        ],
        [
          "📝",
          "Daily Practice",
          "AI-generated questions tailored to your level",
        ],
        [
          "🎯",
          "Weak Topic Finder",
          "Identifies exactly which chapters need more work",
        ],
        ["⚔️", "Leagues", "Compete with classmates, earn XP together"],
        ["🎮", "Classroom Quiz", "Live multiplayer quiz battles with powerups"],
        [
          "📊",
          "Progress Reports",
          "Visual charts showing your improvement over time",
        ],
        [
          "🏆",
          "Gamification",
          "XP, levels, badges, streaks to keep you motivated",
        ],
        ["📄", "CBSE Papers", "50+ past year and sample papers in one place"],
      ]
        .map(
          ([icon, title, desc]) => `
        <div style="display:flex;align-items:flex-start;gap:12px;padding:12px;border-radius:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);margin-bottom:8px;">
          <div style="font-size:1.3rem;flex-shrink:0;">${icon}</div>
          <div>
            <div style="font-size:0.85rem;font-weight:800;color:#eef2ff;">${title}</div>
            <div style="font-size:0.76rem;color:#5a6a8a;margin-top:2px;">${desc}</div>
          </div>
        </div>`,
        )
        .join("")}

      <!-- Tech Stack -->
      <div style="background:rgba(79,142,247,0.07);border:1px solid rgba(79,142,247,0.18);border-radius:16px;padding:16px;margin-top:4px;">
        <div style="font-size:0.75rem;font-weight:800;color:#4f8ef7;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">🛠 Built With</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${["HTML / CSS / JavaScript", "Node.js + Express", "Groq AI (LLaMA 3.3)", "Supabase (PostgreSQL)", "Clerk Auth", "Vite"].map((t) => `<span style="padding:4px 12px;border-radius:20px;background:rgba(79,142,247,0.12);color:#4f8ef7;font-size:0.72rem;font-weight:700;">${t}</span>`).join("")}
        </div>
      </div>

      <!-- Theme -->
      <div style="margin-top:16px;text-align:center;padding:16px;border-radius:16px;background:rgba(155,109,255,0.07);border:1px solid rgba(155,109,255,0.2);">
        <div style="font-size:0.75rem;font-weight:700;color:#9b6dff;text-transform:uppercase;letter-spacing:0.08em;">Anvesh Bharat 2026 — Future Classroom</div>
        <div style="font-size:0.82rem;color:#5a6a8a;margin-top:6px;">Technology for a Better Tomorrow</div>
      </div>
    </div>
  `;
}

// ============================================================
// WEAK TOPICS — find chapters with low accuracy
// ============================================================
function renderWeakTopics() {
  const app = document.getElementById("app");
  const history = S.questionHistory || [];

  // Build chapter accuracy map
  const chapterMap = {};
  history.forEach((q) => {
    const key = `${q.subject}||${q.chapter}`;
    if (!chapterMap[key])
      chapterMap[key] = {
        subject: q.subject,
        chapter: q.chapter,
        correct: 0,
        total: 0,
      };
    chapterMap[key].total++;
    if (q.correct) chapterMap[key].correct++;
  });

  const chapters = Object.values(chapterMap)
    .filter((c) => c.total >= 2) // need at least 2 attempts
    .map((c) => ({ ...c, accuracy: Math.round((c.correct / c.total) * 100) }))
    .sort((a, b) => a.accuracy - b.accuracy); // weakest first

  const weak = chapters.filter((c) => c.accuracy < 60);
  const ok = chapters.filter((c) => c.accuracy >= 60 && c.accuracy < 80);
  const strong = chapters.filter((c) => c.accuracy >= 80);

  // Weekly XP chart data (last 7 days)
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date().getDay();
  const weekXP = S.weeklyXP || [0, 0, 0, 0, 0, 0, 0];
  const maxXP = Math.max(1, ...weekXP);

  app.innerHTML = `
    <div style="padding:16px;max-width:480px;margin:0 auto;">
      <button onclick="navigate('landing')" style="background:none;border:none;color:#5a6a8a;font-size:0.82rem;cursor:pointer;font-family:inherit;margin-bottom:16px;display:flex;align-items:center;gap:6px;">← Back</button>

      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <div style="font-size:1.6rem;">🎯</div>
        <div>
          <div style="font-size:1.15rem;font-weight:900;color:#eef2ff;">My Weak Topics</div>
          <div style="font-size:0.78rem;color:#5a6a8a;">Based on your practice history</div>
        </div>
      </div>

      <!-- Weekly XP Progress Chart -->
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:16px;margin-bottom:16px;">
        <div style="font-size:0.82rem;font-weight:800;color:#eef2ff;margin-bottom:14px;">📈 Weekly XP Progress</div>
        <div style="display:flex;align-items:flex-end;gap:6px;height:80px;">
          ${weekXP
            .map((xp, i) => {
              const isToday = i === today;
              const h = Math.max(4, Math.round((xp / maxXP) * 70));
              return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
              <div style="font-size:0.6rem;color:${xp > 0 ? "#4f8ef7" : "#3a4a62"};">${xp > 0 ? xp : ""}</div>
              <div style="width:100%;height:${h}px;border-radius:6px 6px 3px 3px;background:${isToday ? "linear-gradient(180deg,#4f8ef7,#9b6dff)" : xp > 0 ? "rgba(79,142,247,0.4)" : "rgba(255,255,255,0.05)"};transition:height 0.5s;"></div>
              <div style="font-size:0.6rem;color:${isToday ? "#4f8ef7" : "#3a4a62"};font-weight:${isToday ? "800" : "400"};">${days[i]}</div>
            </div>`;
            })
            .join("")}
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:10px;">
          <div style="font-size:0.72rem;color:#5a6a8a;">Total this week: <span style="color:#4f8ef7;font-weight:700;">${weekXP.reduce((a, b) => a + b, 0)} XP</span></div>
          <div style="font-size:0.72rem;color:#5a6a8a;">${history.length} questions answered</div>
        </div>
      </div>

      <!-- Subject accuracy overview -->
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:16px;margin-bottom:16px;">
        <div style="font-size:0.82rem;font-weight:800;color:#eef2ff;margin-bottom:12px;">📚 Subject Accuracy</div>
        ${
          Object.entries(S.subjectCounts || {})
            .filter(([, c]) => c > 0)
            .map(([subj, count]) => {
              const subjHistory = history.filter((q) => q.subject === subj);
              const correct = subjHistory.filter((q) => q.correct).length;
              const acc =
                subjHistory.length > 0
                  ? Math.round((correct / subjHistory.length) * 100)
                  : null;
              const color =
                acc === null
                  ? "#5a6a8a"
                  : acc >= 80
                    ? "#4fd9b3"
                    : acc >= 60
                      ? "#f7c74f"
                      : "#f7714f";
              return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div style="font-size:0.82rem;color:#eef2ff;width:90px;flex-shrink:0;">${subj}</div>
            <div style="flex:1;background:rgba(255,255,255,0.06);border-radius:20px;height:8px;overflow:hidden;">
              <div style="height:100%;width:${acc || 0}%;background:${color};border-radius:20px;transition:width 0.6s;"></div>
            </div>
            <div style="font-size:0.72rem;font-weight:700;color:${color};width:36px;text-align:right;">${acc !== null ? acc + "%" : "—"}</div>
          </div>`;
            })
            .join("") ||
          '<div style="color:#3a4a62;text-align:center;font-size:0.82rem;padding:12px;">No data yet — start practicing!</div>'
        }
      </div>

      <!-- Weak chapters -->
      ${
        weak.length > 0
          ? `
        <div style="font-size:0.82rem;font-weight:800;color:#f7714f;margin-bottom:8px;">🔴 Needs Work (below 60%)</div>
        ${weak.map((c) => chapterCard(c)).join("")}
      `
          : ""
      }

      ${
        ok.length > 0
          ? `
        <div style="font-size:0.82rem;font-weight:800;color:#f7c74f;margin-bottom:8px;margin-top:14px;">🟡 Getting There (60–80%)</div>
        ${ok.map((c) => chapterCard(c)).join("")}
      `
          : ""
      }

      ${
        strong.length > 0
          ? `
        <div style="font-size:0.82rem;font-weight:800;color:#4fd9b3;margin-bottom:8px;margin-top:14px;">🟢 Strong (above 80%)</div>
        ${strong.map((c) => chapterCard(c)).join("")}
      `
          : ""
      }

      ${
        chapters.length === 0
          ? `
        <div style="text-align:center;padding:32px 16px;color:#5a6a8a;">
          <div style="font-size:2rem;margin-bottom:10px;">📝</div>
          <div style="font-size:0.88rem;">No data yet.<br>Complete some practice questions first!</div>
          <button onclick="navigate('practice')" style="margin-top:14px;padding:10px 24px;border-radius:12px;border:none;background:linear-gradient(135deg,#4f8ef7,#9b6dff);color:white;font-weight:700;font-size:0.85rem;cursor:pointer;font-family:inherit;">Start Practicing →</button>
        </div>
      `
          : ""
      }
    </div>
  `;
}

function chapterCard(c) {
  const color =
    c.accuracy >= 80 ? "#4fd9b3" : c.accuracy >= 60 ? "#f7c74f" : "#f7714f";
  const bg =
    c.accuracy >= 80
      ? "rgba(79,217,179,0.07)"
      : c.accuracy >= 60
        ? "rgba(247,199,79,0.07)"
        : "rgba(247,113,79,0.07)";
  const border =
    c.accuracy >= 80
      ? "rgba(79,217,179,0.2)"
      : c.accuracy >= 60
        ? "rgba(247,199,79,0.2)"
        : "rgba(247,113,79,0.2)";
  return `
    <div style="background:${bg};border:1px solid ${border};border-radius:14px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;">
      <div style="flex:1;">
        <div style="font-size:0.85rem;font-weight:700;color:#eef2ff;">${escapeHtml(c.chapter || "General")}</div>
        <div style="font-size:0.72rem;color:#5a6a8a;margin-top:2px;">${c.subject} · ${c.total} questions attempted</div>
        <div style="margin-top:6px;background:rgba(255,255,255,0.06);border-radius:20px;height:5px;overflow:hidden;">
          <div style="height:100%;width:${c.accuracy}%;background:${color};border-radius:20px;"></div>
        </div>
      </div>
      <div style="text-align:center;flex-shrink:0;">
        <div style="font-size:1.2rem;font-weight:900;color:${color};">${c.accuracy}%</div>
        <div style="font-size:0.6rem;color:#5a6a8a;">accuracy</div>
      </div>
      ${c.accuracy < 60 ? `<button onclick="(()=>{S.subjectPreference='${c.subject}';S.practiceChapter='${c.chapter}';saveState();navigate('practice');})()" style="padding:6px 10px;border-radius:8px;border:none;background:rgba(247,113,79,0.2);color:#f7714f;font-size:0.7rem;font-weight:700;cursor:pointer;font-family:inherit;flex-shrink:0;">Practice →</button>` : ""}
    </div>`;
}

// ============================================================
// LEAGUES SYSTEM — server-backed
// ============================================================

function getMyLeagueId() {
  return localStorage.getItem("stasis_my_league") || null;
}

function getStudentId() {
  let id = localStorage.getItem("stasis_student_id");
  if (!id) {
    id = "S" + Math.random().toString(36).slice(2, 8).toUpperCase();
    localStorage.setItem("stasis_student_id", id);
  }
  return id;
}

async function fetchLeague(leagueId) {
  try {
    const res = await fetch(`/api/league/${leagueId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.league;
  } catch {
    return null;
  }
}

window.awardLeagueXP = async function (amount) {
  const leagueId = getMyLeagueId();
  if (!leagueId) return;
  try {
    await fetch("/api/league/xp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leagueId, memberId: getStudentId(), amount }),
    });
  } catch {}
};

async function renderLeagues() {
  const app = document.getElementById("app");
  const myLeagueId = getMyLeagueId();
  const myId = getStudentId();

  // Fetch live league from server
  app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:200px;color:#5a6a8a;">⚔️ Loading league...</div>`;
  let currentLeague = null;
  if (myLeagueId) {
    currentLeague = await fetchLeague(myLeagueId);
    if (!currentLeague) localStorage.removeItem("stasis_my_league");
  }
  // Auto-detect: check if this player was added to a league by someone else
  if (!currentLeague) {
    try {
      const res = await fetch(`/api/league/find/${myId}`);
      const data = await res.json();
      if (data.league) {
        currentLeague = data.league;
        localStorage.setItem("stasis_my_league", data.league.id);
        // Update name in case stored as "Pending"
        await fetch("/api/league/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leagueId: data.league.id,
            member: {
              id: myId,
              name: localStorage.getItem("stasis_name") || "Student",
            },
          }),
        });
      }
    } catch {}
  }

  app.innerHTML = `
    <div style="padding:16px;max-width:480px;margin:0 auto;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
        <div style="font-size:1.6rem;">⚔️</div>
        <div>
          <div style="font-size:1.15rem;font-weight:900;color:#eef2ff;">Leagues</div>
          <div style="font-size:0.78rem;color:#5a6a8a;">Compete with your squad</div>
        </div>
      </div>

      <div style="background:rgba(79,217,179,0.08);border:1px solid rgba(79,217,179,0.2);border-radius:14px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <div>
          <div style="font-size:0.7rem;font-weight:700;color:#4fd9b3;text-transform:uppercase;letter-spacing:0.06em;">Your Player ID</div>
          <div style="font-size:1.1rem;font-weight:900;color:#eef2ff;font-family:monospace;letter-spacing:0.1em;">${myId}</div>
          <div style="font-size:0.7rem;color:#3a4a62;margin-top:2px;">Share this with friends so they can add you to a league</div>
        </div>
        <button onclick="window.copyPlayerId()" style="padding:8px 14px;border-radius:8px;border:1px solid rgba(79,217,179,0.25);background:rgba(79,217,179,0.08);color:#4fd9b3;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:inherit;flex-shrink:0;">📋 Copy ID</button>
      </div>

      <div id="league-main-area">
        ${currentLeague ? renderMyLeagueHTML(currentLeague, myId) : `<div style="text-align:center;padding:20px 16px;color:#5a6a8a;font-size:0.85rem;">You're not in a league yet.<br>Create one below or ask a friend for their League ID.</div>`}
      </div>

      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:16px;margin-top:16px;">
        <div style="font-size:0.85rem;font-weight:800;color:#eef2ff;margin-bottom:12px;">🏆 Create a New League</div>
        <input id="league-name-input" placeholder="League name (e.g. Class 10 Rivals)" maxlength="30"
          style="width:100%;box-sizing:border-box;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#eef2ff;font-size:0.9rem;font-family:inherit;outline:none;margin-bottom:10px;">
        <div style="font-size:0.75rem;color:#5a6a8a;margin-bottom:6px;">Add member Player IDs (comma-separated). Your ID is auto-included.</div>
        <input id="league-members-input" placeholder="e.g. S4AB2X, SFGH3Y" maxlength="300"
          style="width:100%;box-sizing:border-box;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#eef2ff;font-size:0.9rem;font-family:monospace;outline:none;margin-bottom:12px;text-transform:uppercase;">
        <button onclick="window.createLeague()" style="width:100%;padding:13px;border-radius:12px;border:none;background:linear-gradient(135deg,#f7c74f,#f7714f);color:#07070f;font-size:0.95rem;font-weight:800;cursor:pointer;font-family:inherit;">⚔️ Create League</button>
      </div>

      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:16px;margin-top:12px;">
        <div style="font-size:0.85rem;font-weight:800;color:#eef2ff;margin-bottom:10px;">🔗 Join an Existing League</div>
        <div style="display:flex;gap:8px;">
          <input id="join-league-input" placeholder="League ID (e.g. LGAB3XY)" maxlength="12"
            style="flex:1;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#eef2ff;font-family:monospace;font-size:0.9rem;outline:none;text-transform:uppercase;">
          <button onclick="window.joinLeagueById()" style="padding:10px 16px;border-radius:10px;border:none;background:linear-gradient(135deg,#4f8ef7,#9b6dff);color:white;font-weight:700;font-size:0.85rem;cursor:pointer;font-family:inherit;">Join</button>
        </div>
      </div>
    </div>
  `;
}

function renderMyLeagueHTML(league, myId) {
  if (!league)
    return `<div style="color:#5a6a8a;text-align:center;padding:16px;">League not found.</div>`;

  const CHALLENGE_Q = 10;
  const sorted = [...league.members].sort((a, b) => (b.xp || 0) - (a.xp || 0));
  const totalQ = league.members.reduce((s, m) => s + (m.questions || 0), 0);
  const target = league.members.length * CHALLENGE_Q;
  const pct = Math.min(Math.round((totalQ / target) * 100), 100);
  const daysLeft = Math.max(
    0,
    Math.ceil(
      ((league.expires_at || league.expiresAt || 0) - Date.now()) / 86400000,
    ),
  );
  const medals = ["🥇", "🥈", "🥉"];

  return `
    <div style="background:linear-gradient(135deg,rgba(247,199,79,0.1),rgba(247,113,79,0.08));border:1.5px solid rgba(247,199,79,0.25);border-radius:20px;padding:18px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
        <div>
          <div style="font-size:1rem;font-weight:900;color:#eef2ff;">⚔️ ${escapeHtml(league.name)}</div>
          <div style="font-size:0.7rem;font-family:monospace;color:#5a6a8a;margin-top:2px;">League ID: ${league.id}</div>
        </div>
        <span style="padding:4px 10px;border-radius:20px;background:rgba(247,113,79,0.12);color:#f7714f;font-size:0.72rem;font-weight:700;flex-shrink:0;">⏰ ${daysLeft}d left</span>
      </div>

      <div style="background:rgba(0,0,0,0.25);border-radius:12px;padding:12px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <div style="font-size:0.78rem;font-weight:700;color:#f7c74f;">🎯 Weekly Challenge — ${CHALLENGE_Q} questions each</div>
          <div style="font-size:0.72rem;color:#5a6a8a;">${pct}%</div>
        </div>
        <div style="background:rgba(255,255,255,0.08);border-radius:20px;height:7px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#f7c74f,#f7714f);border-radius:20px;transition:width 0.5s;"></div>
        </div>
        <div style="font-size:0.72rem;color:#5a6a8a;margin-top:6px;">${totalQ}/${target} questions done · ${pct === 100 ? "🎉 Challenge Complete!" : "Keep going!"}</div>
      </div>

      <div style="font-size:0.75rem;font-weight:700;color:#7a8aaa;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Leaderboard</div>
      ${sorted
        .map((m, i) => {
          const isMe = m.id === myId;
          return `<div style="display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;background:${isMe ? "rgba(79,142,247,0.12)" : "rgba(255,255,255,0.03)"};border:1px solid ${isMe ? "rgba(79,142,247,0.25)" : "transparent"};margin-bottom:5px;">
          <div style="font-size:1rem;width:24px;text-align:center;">${medals[i] || i + 1}</div>
          <div style="flex:1;">
            <div style="font-size:0.85rem;font-weight:700;color:${isMe ? "#4f8ef7" : "#eef2ff"};">${escapeHtml(m.name)}${isMe ? " (You)" : ""}</div>
            <div style="font-size:0.7rem;color:#5a6a8a;">${m.questions || 0} questions done</div>
          </div>
          <div style="font-size:0.85rem;font-weight:800;color:#f7c74f;">⚡ ${m.xp || 0}</div>
        </div>`;
        })
        .join("")}

      <button onclick="window.leaveLeague()" style="margin-top:12px;width:100%;padding:8px;border-radius:10px;border:1px solid rgba(247,113,79,0.2);background:transparent;color:#f7714f;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit;">Leave League</button>
    </div>
  `;
}

window.copyPlayerId = function () {
  navigator.clipboard.writeText(getStudentId()).catch(() => {});
  const btn = event.target;
  const orig = btn.textContent;
  btn.textContent = "✅ Copied!";
  setTimeout(() => {
    btn.textContent = orig;
  }, 1500);
};

window.createLeague = async function () {
  const name = document.getElementById("league-name-input")?.value.trim();
  if (!name) {
    alert("Enter a league name");
    return;
  }
  const myId = getStudentId();
  const myName = localStorage.getItem("stasis_name") || "You";
  const rawMembers =
    document.getElementById("league-members-input")?.value || "";
  const extraIds = rawMembers
    .split(",")
    .map((x) => x.trim().toUpperCase())
    .filter((x) => x.length > 2 && x !== myId);

  const members = [{ id: myId, name: myName, xp: 0, questions: 0 }];
  extraIds.forEach((id) =>
    members.push({ id, name: "Pending " + id, xp: 0, questions: 0 }),
  );

  try {
    const res = await fetch("/api/league/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, members }),
    });
    const data = await res.json();
    if (!data.league) {
      alert("Failed to create league");
      return;
    }
    localStorage.setItem("stasis_my_league", data.league.id);
    navigate("leagues");
  } catch (e) {
    alert("Network error — try again");
  }
};

window.joinLeagueById = async function () {
  const id = (document.getElementById("join-league-input")?.value || "")
    .trim()
    .toUpperCase();
  if (!id) return;
  const myId = getStudentId();
  const myName = localStorage.getItem("stasis_name") || "Student";
  try {
    const res = await fetch("/api/league/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leagueId: id,
        member: { id: myId, name: myName, xp: 0, questions: 0 },
      }),
    });
    if (res.status === 404) {
      alert("League not found. Check the League ID and try again.");
      return;
    }
    const data = await res.json();
    localStorage.setItem("stasis_my_league", data.league.id);
    navigate("leagues");
  } catch (e) {
    alert("Network error — try again");
  }
};

window.leaveLeague = function () {
  localStorage.removeItem("stasis_my_league");
  navigate("leagues");
};

// Auto-refresh league every 15s when on leagues page
function startLeagueRefresh() {
  stopLeagueRefresh();
  _leagueRefreshTimer = setInterval(async () => {
    const leagueId = getMyLeagueId();
    if (!leagueId) return;
    const league = await fetchLeague(leagueId);
    if (!league) return;
    const area = document.getElementById("league-main-area");
    if (area) area.innerHTML = renderMyLeagueHTML(league, getStudentId());
  }, 15000);
}

// ============================================================
// STASIS AI CHATBOT — uses existing apiPost() helper
// ============================================================
(function initStasisChatbot() {
  let chatHistory = [];
  let isOpen = false;
  let isMaximised = false;
  let isLoading = false;

  const style = document.createElement("style");
  style.textContent = `
    #nova-fab {
      position:fixed;bottom:88px;right:20px;z-index:9999;
      width:52px;height:52px;border-radius:16px;
      background:linear-gradient(135deg,#0fca8c 0%,#06b6d4 100%);
      box-shadow:0 4px 24px rgba(15,202,140,0.5);
      border:none;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      transition:transform .22s cubic-bezier(.34,1.56,.64,1),box-shadow .2s;
    }
    #nova-fab:hover{transform:scale(1.12) rotate(-4deg);box-shadow:0 8px 36px rgba(15,202,140,0.7)}
    #nova-fab::before{
      content:'';position:absolute;inset:-5px;border-radius:20px;
      background:linear-gradient(135deg,#0fca8c,#06b6d4);
      opacity:0;animation:sai-pulse 2.4s ease-in-out infinite;
    }
    @keyframes sai-pulse{0%,100%{opacity:0;transform:scale(1)}50%{opacity:0.18;transform:scale(1.18)}}
    #nova-panel{
      position:fixed;z-index:9998;bottom:152px;right:20px;
      width:348px;max-height:520px;
      background:linear-gradient(160deg,rgba(8,14,26,0.98) 0%,rgba(6,10,20,0.99) 100%);
      backdrop-filter:blur(24px);
      border:1px solid rgba(15,202,140,0.18);border-radius:22px;
      box-shadow:0 12px 60px rgba(0,0,0,0.8),0 0 0 1px rgba(255,255,255,0.04),inset 0 1px 0 rgba(255,255,255,0.06);
      display:flex;flex-direction:column;overflow:hidden;
      transform:scale(0.9) translateY(16px);opacity:0;pointer-events:none;
      transition:transform .3s cubic-bezier(0.34,1.56,0.64,1),opacity .22s;
      transform-origin:bottom right;
    }
    #nova-panel.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}
    #nova-panel.maximised{
      width:min(700px,calc(100vw - 28px));
      max-height:min(600px,calc(100vh - 108px));
    }
    #nova-header{
      display:flex;align-items:center;gap:10px;padding:13px 15px 12px;
      background:linear-gradient(135deg,rgba(15,202,140,0.08),rgba(6,182,212,0.05));
      border-bottom:1px solid rgba(15,202,140,0.12);
      flex-shrink:0;position:relative;
    }
    #nova-header::after{
      content:'';position:absolute;bottom:0;left:15px;right:15px;height:1px;
      background:linear-gradient(90deg,transparent,rgba(15,202,140,0.3),transparent);
    }
    #nova-avatar{
      width:36px;height:36px;border-radius:11px;
      background:linear-gradient(135deg,#0fca8c,#06b6d4);
      display:flex;align-items:center;justify-content:center;
      font-size:18px;flex-shrink:0;
      box-shadow:0 4px 14px rgba(15,202,140,0.4);
    }
    #nova-title{flex:1}
    #nova-title strong{display:block;font-size:.9rem;color:#fff;font-weight:800;letter-spacing:-.01em}
    #nova-title span{font-size:.65rem;color:#0fca8c;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
    .nhbtn{
      background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;
      color:rgba(255,255,255,0.4);cursor:pointer;padding:5px 8px;
      font-size:.78rem;line-height:1;transition:.15s;
    }
    .nhbtn:hover{background:rgba(15,202,140,0.12);border-color:rgba(15,202,140,0.3);color:#0fca8c}
    #nova-msgs{
      flex:1;overflow-y:auto;padding:14px 12px;
      display:flex;flex-direction:column;gap:9px;scroll-behavior:smooth;
    }
    #nova-msgs::-webkit-scrollbar{width:3px}
    #nova-msgs::-webkit-scrollbar-thumb{background:rgba(15,202,140,0.3);border-radius:10px}
    .nmsg{display:flex;max-width:88%}
    .nmsg.user{align-self:flex-end;justify-content:flex-end}
    .nmsg.ai{align-self:flex-start}
    .nbub{
      padding:9px 13px;border-radius:16px;
      font-size:.82rem;line-height:1.6;word-break:break-word;
    }
    .nmsg.user .nbub{
      background:linear-gradient(135deg,#0fca8c,#06b6d4);
      color:#fff;border-bottom-right-radius:4px;
      box-shadow:0 3px 14px rgba(15,202,140,0.3);
    }
    .nmsg.ai .nbub{
      background:rgba(255,255,255,0.05);
      border:1px solid rgba(255,255,255,0.08);
      color:rgba(255,255,255,0.88);border-bottom-left-radius:4px;
    }
    .nbub p{margin:0 0 5px}.nbub p:last-child{margin:0}
    .nbub strong{color:#fff}
    .nbub code{background:rgba(15,202,140,0.12);border:1px solid rgba(15,202,140,0.2);border-radius:4px;padding:1px 5px;font-size:.77rem;color:#0fca8c}
    .nbub pre{background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:10px;overflow-x:auto;margin:6px 0 0}
    .nbub pre code{background:none;padding:0;border:none;color:#e2e8f0}
    .nbub ul,.nbub ol{margin:3px 0;padding-left:16px}
    .nbub li{margin-bottom:2px}
    .nova-typing{display:flex;gap:5px;align-items:center;padding:11px 14px}
    .nova-dot{width:7px;height:7px;border-radius:50%;background:linear-gradient(135deg,#0fca8c,#06b6d4);animation:ndot 1.3s infinite}
    .nova-dot:nth-child(2){animation-delay:.18s}
    .nova-dot:nth-child(3){animation-delay:.36s}
    @keyframes ndot{0%,60%,100%{transform:translateY(0);opacity:.6}30%{transform:translateY(-7px);opacity:1}}
    .nova-redir{
      background:rgba(15,202,140,0.07);border:1px solid rgba(15,202,140,0.22);
      border-radius:14px;padding:11px 13px;font-size:.79rem;
      color:rgba(255,255,255,0.85);line-height:1.5;
      max-width:88%;align-self:flex-start;
    }
    .nova-redir-btn{
      display:inline-block;margin-top:8px;
      background:linear-gradient(135deg,#0fca8c,#06b6d4);
      color:#fff;border:none;border-radius:8px;
      padding:5px 13px;font-size:.74rem;font-weight:800;cursor:pointer;font-family:inherit;
      box-shadow:0 2px 10px rgba(15,202,140,0.35);
    }
    #nova-input-row{
      padding:10px 12px;border-top:1px solid rgba(15,202,140,0.1);
      display:flex;gap:8px;flex-shrink:0;
      background:rgba(15,202,140,0.03);
    }
    #nova-input{
      flex:1;background:rgba(255,255,255,0.05);
      border:1.5px solid rgba(255,255,255,0.09);border-radius:12px;
      padding:9px 13px;color:#fff;font-size:.82rem;font-family:inherit;
      outline:none;resize:none;max-height:76px;line-height:1.5;
      transition:border-color .2s,background .2s;
    }
    #nova-input::placeholder{color:rgba(255,255,255,0.25)}
    #nova-input:focus{border-color:rgba(15,202,140,0.45);background:rgba(15,202,140,0.04)}
    #nova-send{
      width:38px;height:38px;border-radius:12px;flex-shrink:0;
      background:linear-gradient(135deg,#0fca8c,#06b6d4);
      border:none;cursor:pointer;display:flex;align-items:center;
      justify-content:center;align-self:flex-end;
      transition:opacity .2s,transform .18s;
      box-shadow:0 3px 14px rgba(15,202,140,0.4);
    }
    #nova-send:hover{opacity:.88;transform:scale(1.08)}
    #nova-send:disabled{opacity:.3;cursor:not-allowed;transform:none;box-shadow:none}
    #nova-send svg{width:17px;height:17px;fill:white}
    #nova-welcome{
      display:flex;flex-direction:column;align-items:center;
      justify-content:center;flex:1;text-align:center;padding:22px 18px;gap:10px;
    }
    #nova-welcome .nw-icon{
      width:56px;height:56px;border-radius:17px;
      background:linear-gradient(135deg,#0fca8c,#06b6d4);
      display:flex;align-items:center;justify-content:center;
      font-size:26px;box-shadow:0 6px 24px rgba(15,202,140,0.4);
      margin-bottom:2px;
    }
    #nova-welcome h3{margin:0;font-size:1rem;color:#fff;font-weight:900;letter-spacing:-.01em}
    #nova-welcome .nw-sub{font-size:.78rem;color:rgba(255,255,255,0.38);line-height:1.55;max-width:220px}
    .nw-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:4px}
    .nw-chip{
      background:rgba(15,202,140,0.08);border:1px solid rgba(15,202,140,0.2);
      border-radius:20px;padding:5px 12px;font-size:.71rem;
      color:rgba(255,255,255,0.55);cursor:pointer;transition:.15s;font-family:inherit;font-weight:600;
    }
    .nw-chip:hover{background:rgba(15,202,140,0.2);border-color:rgba(15,202,140,0.4);color:#fff}
    .sai-badge{
      display:inline-flex;align-items:center;gap:4px;
      font-size:.6rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
      color:#0fca8c;background:rgba(15,202,140,0.1);border:1px solid rgba(15,202,140,0.2);
      border-radius:20px;padding:2px 7px;margin-top:4px;
    }
  `;
  document.head.appendChild(style);

  const fab = document.createElement("button");
  fab.id = "nova-fab";
  fab.title = "Chat with Stasis AI";
  fab.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/></svg>`;
  document.body.appendChild(fab);

  const panel = document.createElement("div");
  panel.id = "nova-panel";
  panel.innerHTML = `
    <div id="nova-header">
      <div id="nova-avatar">⟡</div>
      <div id="nova-title"><strong>Stasis AI</strong><span>● Online</span></div>
      <button class="nhbtn" id="nova-max-btn" title="Maximise">⤢</button>
      <button class="nhbtn" id="nova-close-btn" title="Close">✕</button>
    </div>
    <div id="nova-msgs">
      <div id="nova-welcome">
        <div class="nw-icon">⟡</div>
        <h3>Hey, I'm Stasis AI!</h3>
        <p class="nw-sub">Your general AI assistant. Ask me anything — science, code, trivia, creative writing. For CBSE study help, use the Home tab!</p>
        <div class="nw-chips">
          <button class="nw-chip" data-q="Explain quantum entanglement simply">⚛️ Quantum</button>
          <button class="nw-chip" data-q="Write a Python bubble sort">🐍 Python</button>
          <button class="nw-chip" data-q="What's trending in AI right now?">🤖 AI news</button>
          <button class="nw-chip" data-q="Give me a fun logic puzzle">🧩 Puzzle</button>
        </div>
      </div>
    </div>
    <div id="nova-input-row">
      <textarea id="nova-input" placeholder="Ask Stasis AI anything…" rows="1"></textarea>
      <button id="nova-send"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
    </div>`;
  document.body.appendChild(panel);

  const msgsEl = panel.querySelector("#nova-msgs");
  const inputEl = panel.querySelector("#nova-input");
  const sendBtn = panel.querySelector("#nova-send");

  function renderMd(t) {
    return t
      .replace(
        /```[\w]*\n?([\s\S]*?)```/g,
        (_, c) => `<pre><code>${c.replace(/</g, "&lt;")}</code></pre>`,
      )
      .replace(/`([^`\n]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
      .replace(/^#{1,3} (.+)$/gm, "<strong>$1</strong>")
      .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
      .replace(/\n{2,}/g, "</p><p>")
      .replace(/\n/g, "<br>");
  }

  const GRADE_RE =
    /\b(class|grade|std)\s*(6|7|8|9|10)\b|(cbse|ncert|board.?exam)/i;
  const HW_RE =
    /\b(solve|calculate|find the|prove that|derive|balance the equation|write a note on|what is the formula)\b/i;
  function isSchoolQ(t) {
    return GRADE_RE.test(t) || HW_RE.test(t);
  }

  function addMsg(role, html, asRedir) {
    msgsEl.querySelector("#nova-welcome")?.remove();
    if (asRedir) {
      const d = document.createElement("div");
      d.className = "nova-redir";
      d.innerHTML = html;
      msgsEl.appendChild(d);
    } else {
      const w = document.createElement("div");
      w.className = `nmsg ${role}`;
      w.innerHTML = `<div class="nbub">${html}</div>`;
      msgsEl.appendChild(w);
    }
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function addTyping() {
    msgsEl.querySelector("#nova-welcome")?.remove();
    const w = document.createElement("div");
    w.className = "nmsg ai";
    w.id = "nova-typing";
    w.innerHTML = `<div class="nbub"><div class="nova-typing"><div class="nova-dot"></div><div class="nova-dot"></div><div class="nova-dot"></div></div></div>`;
    msgsEl.appendChild(w);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return w;
  }

  async function send(prefill) {
    const text = (prefill || inputEl.value).trim();
    if (!text || isLoading) return;
    inputEl.value = "";
    inputEl.style.height = "auto";
    isLoading = true;
    sendBtn.disabled = true;

    addMsg("user", renderMd(text));

    if (isSchoolQ(text)) {
      addMsg(
        "ai",
        `Looks like a school question! 🎯 Stasis handles CBSE perfectly — head to Home.<br><button class="nova-redir-btn" onclick="navigate('home')">🏠 Go to Home</button>`,
        true,
      );
      isLoading = false;
      sendBtn.disabled = false;
      return;
    }

    const t = addTyping();
    try {
      // Use the same apiPost() that all other routes use — defined at line ~1837
      const data = await apiPost("/chatbot", {
        message: text,
        history: chatHistory,
      });
      t.remove();
      const reply = data.reply || "Try again?";
      addMsg("ai", renderMd(reply));
      chatHistory.push({ role: "user", content: text });
      chatHistory.push({ role: "assistant", content: reply });
      if (chatHistory.length > 40) chatHistory = chatHistory.slice(-40);
    } catch (e) {
      t.remove();
      addMsg("ai", `Error: ${e.message}. Is the server running? 🔌`);
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  panel.querySelector("#nova-close-btn").addEventListener("click", () => {
    isOpen = false;
    panel.classList.remove("open");
  });
  panel.querySelector("#nova-max-btn").addEventListener("click", () => {
    isMaximised = !isMaximised;
    panel.classList.toggle("maximised", isMaximised);
    const b = panel.querySelector("#nova-max-btn");
    b.textContent = isMaximised ? "⤡" : "⤢";
    b.title = isMaximised ? "Restore" : "Maximise";
  });
  fab.addEventListener("click", () => {
    isOpen = !isOpen;
    panel.classList.toggle("open", isOpen);
    if (isOpen) setTimeout(() => inputEl.focus(), 260);
  });
  sendBtn.addEventListener("click", () => send());
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  inputEl.addEventListener("input", () => {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 76) + "px";
  });
  panel.addEventListener("click", (e) => {
    const c = e.target.closest(".nw-chip");
    if (c) send(c.dataset.q);
  });
})();

// ============================================================
// FORMULA SHEET
// ============================================================
function renderFormulaSheet() {
  const app = document.getElementById("app");
  const cls = S.classPreference || "10";
  const FORMULAS = {
    Maths: {
      Algebra: [
        { f: "(a+b)² = a²+2ab+b²", l: "Square of sum" },
        { f: "(a-b)² = a²-2ab+b²", l: "Square of difference" },
        { f: "(a+b)(a-b) = a²-b²", l: "Difference of squares" },
        { f: "(a+b)³ = a³+3a²b+3ab²+b³", l: "Cube of sum" },
        { f: "a³+b³ = (a+b)(a²-ab+b²)", l: "Sum of cubes" },
        { f: "a³-b³ = (a-b)(a²+ab+b²)", l: "Difference of cubes" },
        { f: "Quadratic: x = (-b±√(b²-4ac)) / 2a", l: "Quadratic formula" },
        {
          f: "Discriminant D = b²-4ac",
          l: "D>0: 2 real roots, D=0: 1 root, D<0: no real root",
        },
      ],
      "Arithmetic Progressions": [
        { f: "aₙ = a + (n-1)d", l: "nth term of AP" },
        { f: "Sₙ = n/2 · [2a + (n-1)d]", l: "Sum of n terms" },
        { f: "Sₙ = n/2 · (a + l)", l: "Sum when last term l is known" },
      ],
      "Triangles & Geometry": [
        { f: "Pythagoras: a²+b²=c²", l: "Right-angled triangle" },
        { f: "Area = ½ × base × height", l: "Triangle area" },
        { f: "Heron's: A = √(s(s-a)(s-b)(s-c))", l: "s = (a+b+c)/2" },
        { f: "Area of circle = πr²", l: "Circle area" },
        { f: "Circumference = 2πr", l: "Circle perimeter" },
        { f: "Area of sector = (θ/360)×πr²", l: "Sector area" },
        { f: "Arc length = (θ/360)×2πr", l: "Arc length" },
      ],
      Statistics: [
        { f: "Mean = Σfx / Σf", l: "Grouped data mean" },
        {
          f: "Mode = l + [(f₁-f₀)/(2f₁-f₀-f₂)] × h",
          l: "Mode of grouped data",
        },
        { f: "Median = l + [(n/2-cf)/f] × h", l: "Median of grouped data" },
        { f: "3 Median = Mode + 2 Mean", l: "Empirical relationship" },
      ],
      Trigonometry: [
        { f: "sin²θ + cos²θ = 1", l: "Pythagorean identity" },
        { f: "1 + tan²θ = sec²θ", l: "Secant identity" },
        { f: "1 + cot²θ = cosec²θ", l: "Cosecant identity" },
        {
          f: "sin θ = opp/hyp, cos θ = adj/hyp, tan θ = opp/adj",
          l: "Basic ratios",
        },
        {
          f: "sin 0°=0, sin 30°=½, sin 45°=1/√2, sin 60°=√3/2, sin 90°=1",
          l: "Standard values",
        },
      ],
      "Surface Area & Volume": [
        { f: "Cube: SA=6a², V=a³", l: "Cube" },
        { f: "Cuboid: SA=2(lb+bh+lh), V=lbh", l: "Cuboid" },
        { f: "Cylinder: CSA=2πrh, TSA=2πr(r+h), V=πr²h", l: "Cylinder" },
        { f: "Cone: CSA=πrl, TSA=πr(r+l), V=⅓πr²h, l=√(r²+h²)", l: "Cone" },
        { f: "Sphere: SA=4πr², V=⁴⁄₃πr³", l: "Sphere" },
        { f: "Hemisphere: CSA=2πr², TSA=3πr², V=⅔πr³", l: "Hemisphere" },
      ],
      "Coordinate Geometry": [
        {
          f: "Distance = √((x₂-x₁)²+(y₂-y₁)²)",
          l: "Distance between two points",
        },
        { f: "Midpoint = ((x₁+x₂)/2, (y₁+y₂)/2)", l: "Midpoint formula" },
        {
          f: "Section formula: ((mx₂+nx₁)/(m+n), (my₂+ny₁)/(m+n))",
          l: "Internal division",
        },
        {
          f: "Area of Δ = ½|x₁(y₂-y₃)+x₂(y₃-y₁)+x₃(y₁-y₂)|",
          l: "Triangle area with coords",
        },
      ],
    },
    Physics: {
      Motion: [
        { f: "v = u + at", l: "First equation of motion" },
        { f: "s = ut + ½at²", l: "Second equation of motion" },
        { f: "v² = u² + 2as", l: "Third equation of motion" },
        { f: "v_avg = (u+v)/2", l: "Average velocity (uniform acceleration)" },
      ],
      "Force & Laws": [
        { f: "F = ma", l: "Newton's 2nd law" },
        { f: "p = mv", l: "Momentum" },
        { f: "F·t = Δp", l: "Impulse-momentum theorem" },
        { f: "W = F·d·cosθ", l: "Work done" },
        { f: "KE = ½mv²", l: "Kinetic energy" },
        { f: "PE = mgh", l: "Potential energy" },
        { f: "Power = W/t = F·v", l: "Power" },
      ],
      Gravitation: [
        { f: "F = Gm₁m₂/r²", l: "Universal law of gravitation" },
        { f: "g = GM/R²", l: "Acceleration due to gravity" },
        { f: "Weight W = mg", l: "Weight" },
        { f: "Escape velocity = √(2gR)", l: "Escape velocity" },
      ],
      Electricity: [
        { f: "V = IR", l: "Ohm's law" },
        { f: "P = VI = I²R = V²/R", l: "Electric power" },
        { f: "E = Pt", l: "Electrical energy" },
        { f: "Series: R = R₁+R₂+R₃", l: "Resistors in series" },
        { f: "Parallel: 1/R = 1/R₁+1/R₂+1/R₃", l: "Resistors in parallel" },
        { f: "Q = It", l: "Charge" },
        { f: "H = I²Rt", l: "Heat produced (Joule's law)" },
      ],
      Light: [
        { f: "1/f = 1/v - 1/u", l: "Mirror formula" },
        { f: "1/f = 1/v + 1/u (lens)", l: "Lens formula" },
        { f: "m = -v/u (mirror) = v/u (lens) = h₂/h₁", l: "Magnification" },
        { f: "P = 1/f (metres)", l: "Power of lens (dioptre)" },
        { f: "n = c/v = sin i / sin r", l: "Refractive index / Snell's law" },
      ],
    },
    Chemistry: {
      "Chemical Reactions": [
        { f: "Mole = mass(g) / molar mass", l: "Mole calculation" },
        {
          f: "Number of particles = moles × 6.022×10²³",
          l: "Avogadro's number",
        },
        {
          f: "Molarity M = moles of solute / litres of solution",
          l: "Molarity",
        },
      ],
      "Acids & Bases": [
        { f: "pH = -log[H⁺]", l: "pH definition" },
        { f: "pH < 7: acid, pH = 7: neutral, pH > 7: base", l: "pH scale" },
        { f: "Acid + Base → Salt + Water", l: "Neutralisation" },
      ],
      "Periodic Table Trends": [
        {
          f: "Atomic radius: decreases across period, increases down group",
          l: "Atomic radius trend",
        },
        {
          f: "Ionisation energy: increases across period, decreases down group",
          l: "IE trend",
        },
        {
          f: "Electronegativity: increases across period, decreases down group",
          l: "EN trend",
        },
      ],
      "Metals & Non-Metals": [
        { f: "Metal + O₂ → Metal oxide (basic)", l: "Metal oxidation" },
        {
          f: "Non-metal + O₂ → Non-metal oxide (acidic)",
          l: "Non-metal oxidation",
        },
        { f: "2Mg + O₂ → 2MgO", l: "Magnesium burning" },
        { f: "Metal + Acid → Salt + H₂↑", l: "Metal-acid reaction" },
      ],
    },
    Biology: {
      Cell: [
        {
          f: "Cell theory: all living things are made of cells",
          l: "Cell theory",
        },
        {
          f: "Cell wall (plant) → Cell membrane → Cytoplasm → Nucleus",
          l: "Basic cell structure",
        },
        {
          f: "Plant cell has: cell wall, chloroplast, large vacuole",
          l: "Plant vs animal cell",
        },
      ],
      "Life Processes": [
        {
          f: "Photosynthesis: 6CO₂+6H₂O → C₆H₁₂O₆+6O₂ (light, chlorophyll)",
          l: "Photosynthesis equation",
        },
        {
          f: "Aerobic respiration: C₆H₁₂O₆+6O₂ → 6CO₂+6H₂O + 38 ATP",
          l: "Aerobic respiration",
        },
        { f: "Anaerobic (yeast): C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂", l: "Fermentation" },
        { f: "BMR = energy needed at rest", l: "Basal metabolic rate" },
      ],
      Genetics: [
        {
          f: "Mendel's Law of Segregation: alleles separate during gamete formation",
          l: "Law of Segregation",
        },
        {
          f: "Genotype ratio monohybrid: 1:2:1 (TT:Tt:tt)",
          l: "Monohybrid cross",
        },
        {
          f: "Phenotype ratio: 3:1 (dominant:recessive)",
          l: "Phenotype ratio",
        },
        { f: "DNA → RNA → Protein", l: "Central dogma" },
      ],
    },
  };
  const subjects = Object.keys(FORMULAS);
  let selSubj = subjects[0];

  function renderSheetUI() {
    const subj = FORMULAS[selSubj] || {};
    const cats = Object.keys(subj);
    app.innerHTML = `
      <style>
        .fs-formula{font-family:'Courier New',monospace;font-size:0.88rem;color:#fff;font-weight:700;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:7px 10px;word-break:break-word;line-height:1.5}
        .fs-cat-hdr{font-size:0.65rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;margin:16px 0 8px;padding:4px 10px;border-radius:20px;display:inline-block}
        .fs-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:12px 14px;margin-bottom:8px}
        .fs-label{font-size:0.72rem;color:var(--text-muted);margin-top:5px;line-height:1.4}
        .fs-tab{padding:6px 14px;border-radius:20px;border:1.5px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:var(--text-muted);font-size:0.76rem;font-weight:800;cursor:pointer;font-family:inherit;transition:all .18s;white-space:nowrap}
        .fs-tab.active{border-color:#f0b429;background:rgba(240,180,41,0.12);color:#f0b429}
      </style>
      <button onclick="navigate('home')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;padding:0;font-family:inherit;margin-bottom:16px;display:block">‹ Back</button>
      <div style="font-size:1.3rem;font-weight:900;background:linear-gradient(135deg,#f0b429,#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px">📐 Formula Sheet</div>
      <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:16px">Tap any formula to copy it</div>
      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;margin-bottom:20px;scrollbar-width:none">
        ${subjects.map((s) => `<button class="fs-tab${s === selSubj ? " active" : ""}" onclick="fsSwitchSubj('${s}')">${s}</button>`).join("")}
      </div>
      ${cats
        .map((cat, ci) => {
          const cols = [
            "#f0b429",
            "#0fca8c",
            "#9b6dff",
            "#4f8ef7",
            "#ec4899",
            "#f0564a",
          ][ci % 6];
          return `<div>
          <div class="fs-cat-hdr" style="color:${cols};background:${cols}18;border:1px solid ${cols}30">${cat}</div>
          ${(subj[cat] || [])
            .map(
              (
                item,
              ) => `<div class="fs-card" onclick="navigator.clipboard&&navigator.clipboard.writeText('${item.f.replace(/'/g, "\\'")}').then(()=>{this.style.borderColor='#0fca8c';setTimeout(()=>this.style.borderColor='',1000)})" style="cursor:pointer">
            <div class="fs-formula">${escapeHtml(item.f)}</div>
            <div class="fs-label">${escapeHtml(item.l)}</div>
          </div>`,
            )
            .join("")}
        </div>`;
        })
        .join("")}
    `;
    window.fsSwitchSubj = (s) => {
      selSubj = s;
      renderSheetUI();
    };
  }
  renderSheetUI();
}
window.renderFormulaSheet = renderFormulaSheet;

// ============================================================
// CHAPTER SUMMARY
// ============================================================
function renderChapterSummary() {
  const app = document.getElementById("app");
  const cls = S.classPreference || "10";
  const subj = S.subjectPreference || "Maths";
  const subjects = [
    "Maths",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Geography",
    "Civics",
    "Economics",
    "English",
    "Hindi",
  ];
  const chapters = getChapters(cls, subj);
  app.innerHTML = `
    <button onclick="navigate('home')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;padding:0;font-family:inherit;margin-bottom:18px;display:block">‹ Back</button>
    <div style="font-size:1.3rem;font-weight:900;background:linear-gradient(135deg,#0fca8c,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px">📖 Chapter Summary</div>
    <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:20px">AI generates a crisp exam-ready summary of any chapter</div>
    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><label class="form-label">Class</label>
          <select id="cs-class" class="form-select" style="margin-top:4px" onchange="csUpdateChapters()">
            ${["6", "7", "8", "9", "10"].map((c) => `<option value="${c}" ${cls === c ? "selected" : ""}>${c}</option>`).join("")}
          </select></div>
        <div><label class="form-label">Subject</label>
          <select id="cs-subject" class="form-select" style="margin-top:4px" onchange="csUpdateChapters()">
            ${subjects.map((s) => `<option value="${s}" ${subj === s ? "selected" : ""}>${s}</option>`).join("")}
          </select></div>
      </div>
      <div><label class="form-label">Chapter</label>
        <select id="cs-chapter" class="form-select" style="margin-top:4px">
          <option value="">Select chapter</option>
          ${chapters.map((c) => `<option value="${c}">${c}</option>`).join("")}
        </select></div>
    </div>
    <button onclick="generateChapterSummary()" class="btn btn-primary" style="width:100%;padding:14px;font-size:1rem;font-weight:900;background:linear-gradient(135deg,#0fca8c,#06b6d4);border:none;box-shadow:0 4px 20px rgba(15,202,140,0.4)">Generate Summary →</button>
    <div id="cs-err" style="color:var(--red);font-size:0.82rem;margin-top:10px;text-align:center"></div>
    <div id="cs-result" style="margin-top:20px"></div>
  `;
  window.csUpdateChapters = () => {
    const sel = document.getElementById("cs-chapter");
    const chs = getChapters(
      document.getElementById("cs-class").value,
      document.getElementById("cs-subject").value,
    );
    sel.innerHTML =
      `<option value="">Select chapter</option>` +
      chs.map((c) => `<option value="${c}">${c}</option>`).join("");
  };
  window.generateChapterSummary = async () => {
    const classNum = document.getElementById("cs-class").value;
    const subject = document.getElementById("cs-subject").value;
    const chapter = document.getElementById("cs-chapter").value;
    const err = document.getElementById("cs-err");
    const result = document.getElementById("cs-result");
    if (!chapter) {
      if (err) err.textContent = "Please select a chapter";
      return;
    }
    if (err) err.textContent = "";
    result.innerHTML = `<div style="text-align:center;padding:40px 0">${typingLoader()}<div style="font-size:0.82rem;color:var(--text-muted);margin-top:10px">Generating summary...</div></div>`;
    try {
      const data = await apiPost("/chapter-summary", {
        classNum,
        subject,
        chapter,
      });
      const d = data.summary || {};
      result.innerHTML = `
        <div style="background:rgba(15,202,140,0.06);border:1.5px solid rgba(15,202,140,0.2);border-radius:18px;padding:16px;animation:csSlide .3s ease">
          <div style="font-size:0.65rem;font-weight:900;letter-spacing:.1em;color:#0fca8c;text-transform:uppercase;margin-bottom:8px">📖 ${escapeHtml(chapter)}</div>
          <div style="font-size:1rem;font-weight:900;color:#fff;margin-bottom:14px">${escapeHtml(subject)} · Class ${classNum}</div>
          ${d.overview ? `<div style="font-size:0.84rem;color:var(--text-secondary);line-height:1.65;margin-bottom:16px;padding:10px 12px;background:rgba(255,255,255,0.04);border-radius:10px">${escapeHtml(d.overview)}</div>` : ""}
          ${
            (d.keyPoints || []).length
              ? `
            <div style="font-size:0.65rem;font-weight:900;letter-spacing:.1em;color:#0fca8c;text-transform:uppercase;margin-bottom:8px">⚡ Key Points</div>
            <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px">
              ${(d.keyPoints || []).map((p) => `<div style="display:flex;gap:8px;align-items:flex-start;font-size:0.83rem;color:var(--text-secondary);line-height:1.5"><span style="color:#0fca8c;flex-shrink:0;margin-top:1px">✓</span>${escapeHtml(p)}</div>`).join("")}
            </div>`
              : ""
          }
          ${
            (d.importantTerms || []).length
              ? `
            <div style="font-size:0.65rem;font-weight:900;letter-spacing:.1em;color:#9b6dff;text-transform:uppercase;margin-bottom:8px">📌 Important Terms</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">
              ${(d.importantTerms || []).map((t) => `<span style="background:rgba(155,109,255,0.1);border:1px solid rgba(155,109,255,0.25);color:#9b6dff;border-radius:20px;padding:3px 10px;font-size:0.74rem;font-weight:700">${escapeHtml(t)}</span>`).join("")}
            </div>`
              : ""
          }
          ${
            (d.examTips || []).length
              ? `
            <div style="font-size:0.65rem;font-weight:900;letter-spacing:.1em;color:#f0b429;text-transform:uppercase;margin-bottom:8px">🎯 Board Exam Tips</div>
            <div style="display:flex;flex-direction:column;gap:5px">
              ${(d.examTips || []).map((t) => `<div style="display:flex;gap:8px;align-items:flex-start;font-size:0.82rem;color:var(--text-secondary);line-height:1.5;padding:7px 10px;background:rgba(240,180,41,0.06);border-radius:9px;border-left:3px solid #f0b429"><span style="color:#f0b429;flex-shrink:0">★</span>${escapeHtml(t)}</div>`).join("")}
            </div>`
              : ""
          }
        </div>
        <style>@keyframes csSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}</style>
      `;
    } catch (e) {
      result.innerHTML = `<div style="color:var(--red);font-size:0.84rem">Error: ${e.message}</div>`;
    }
  };
}
window.renderChapterSummary = renderChapterSummary;

// ============================================================
// POMODORO STUDY TIMER
// ============================================================
function renderPomodoro() {
  const app = document.getElementById("app");
  let phase = "study"; // study | break | longbreak
  let totalSecs = 25 * 60;
  let secsLeft = totalSecs;
  let running = false;
  let interval = null;
  let sessionsCompleted = 0;
  const STUDY = 25 * 60,
    SHORT = 5 * 60,
    LONG = 15 * 60;

  function fmt(s) {
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }
  function phaseName(p) {
    return { study: "Study", break: "Short Break", longbreak: "Long Break" }[p];
  }
  function phaseColor(p) {
    return { study: "#ec4899", break: "#0fca8c", longbreak: "#4f8ef7" }[p];
  }

  function render() {
    const pct = Math.round((1 - secsLeft / totalSecs) * 100);
    const col = phaseColor(phase);
    const circumference = 2 * Math.PI * 80;
    const dash = circumference * (1 - secsLeft / totalSecs);
    app.innerHTML = `
      <style>
        @keyframes pmPulse{0%,100%{opacity:1}50%{opacity:0.6}}
        .pm-running .pm-ring-progress{animation:none}
      </style>
      <button onclick="if(interval){clearInterval(interval);interval=null;} navigate('home')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;padding:0;font-family:inherit;margin-bottom:16px;display:block">‹ Back</button>
      <div style="font-size:1.3rem;font-weight:900;background:linear-gradient(135deg,#ec4899,#9b6dff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px">⏱️ Study Timer</div>
      <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:24px">Pomodoro technique — 25 min focus, then break</div>

      <div style="text-align:center;padding:10px 0 24px">
        <svg width="200" height="200" viewBox="0 0 200 200" style="display:block;margin:0 auto">
          <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="10"/>
          <circle cx="100" cy="100" r="80" fill="none" stroke="${col}" stroke-width="10"
            stroke-linecap="round"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${circumference - dash}"
            transform="rotate(-90 100 100)"
            style="transition:stroke-dashoffset 0.8s ease,stroke .4s;filter:drop-shadow(0 0 8px ${col}88)"/>
          <text x="100" y="95" text-anchor="middle" fill="#fff" font-size="36" font-weight="900" font-family="system-ui,sans-serif">${fmt(secsLeft)}</text>
          <text x="100" y="122" text-anchor="middle" fill="${col}" font-size="13" font-weight="800" font-family="system-ui,sans-serif">${phaseName(phase)}</text>
          <text x="100" y="141" text-anchor="middle" fill="rgba(255,255,255,0.35)" font-size="11" font-family="system-ui,sans-serif">Session ${sessionsCompleted + 1}</text>
        </svg>
      </div>

      <div style="display:flex;gap:10px;justify-content:center;margin-bottom:20px">
        <button onclick="pmSetPhase('study')" style="padding:7px 16px;border-radius:20px;border:1.5px solid ${phase === "study" ? "#ec4899" : "rgba(255,255,255,0.1)"};background:${phase === "study" ? "rgba(236,72,153,0.12)" : "rgba(255,255,255,0.04)"};color:${phase === "study" ? "#ec4899" : "var(--text-muted)"};font-size:0.75rem;font-weight:800;cursor:pointer;font-family:inherit">🎯 Study</button>
        <button onclick="pmSetPhase('break')" style="padding:7px 16px;border-radius:20px;border:1.5px solid ${phase === "break" ? "#0fca8c" : "rgba(255,255,255,0.1)"};background:${phase === "break" ? "rgba(15,202,140,0.12)" : "rgba(255,255,255,0.04)"};color:${phase === "break" ? "#0fca8c" : "var(--text-muted)"};font-size:0.75rem;font-weight:800;cursor:pointer;font-family:inherit">☕ Short Break</button>
        <button onclick="pmSetPhase('longbreak')" style="padding:7px 16px;border-radius:20px;border:1.5px solid ${phase === "longbreak" ? "#4f8ef7" : "rgba(255,255,255,0.1)"};background:${phase === "longbreak" ? "rgba(79,142,247,0.12)" : "rgba(255,255,255,0.04)"};color:${phase === "longbreak" ? "#4f8ef7" : "var(--text-muted)"};font-size:0.75rem;font-weight:800;cursor:pointer;font-family:inherit">🌙 Long Break</button>
      </div>

      <div style="display:flex;gap:12px;justify-content:center;margin-bottom:24px">
        <button onclick="pmToggle()" style="width:64px;height:64px;border-radius:50%;border:none;background:linear-gradient(135deg,${col},${col}aa);box-shadow:0 4px 20px ${col}55;cursor:pointer;font-size:1.5rem;display:flex;align-items:center;justify-content:center;transition:transform .18s" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'">${running ? "⏸" : "▶"}</button>
        <button onclick="pmReset()" style="width:48px;height:48px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;margin-top:8px;color:var(--text-muted)">↺</button>
      </div>

      ${
        sessionsCompleted > 0
          ? `
      <div style="text-align:center;background:rgba(240,180,41,0.08);border:1px solid rgba(240,180,41,0.2);border-radius:14px;padding:12px">
        <div style="font-size:0.7rem;font-weight:900;letter-spacing:.1em;color:#f0b429;text-transform:uppercase;margin-bottom:4px">Today's Focus</div>
        <div style="font-size:1.4rem;font-weight:900;color:#fff">${sessionsCompleted} ${"🍅".repeat(Math.min(sessionsCompleted, 8))}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">${sessionsCompleted * 25} minutes of focused study</div>
      </div>`
          : ""
      }
    `;
    window.pmToggle = () => {
      running = !running;
      if (running) {
        interval = setInterval(() => {
          secsLeft--;
          if (secsLeft <= 0) {
            clearInterval(interval);
            interval = null;
            running = false;
            if (phase === "study") {
              sessionsCompleted++;
              S.pomodoroSessions = (S.pomodoroSessions || 0) + 1;
              saveState();
              phase = sessionsCompleted % 4 === 0 ? "longbreak" : "break";
              totalSecs = phase === "longbreak" ? LONG : SHORT;
            } else {
              phase = "study";
              totalSecs = STUDY;
            }
            secsLeft = totalSecs;
            try {
              new Audio(
                "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA",
              ).play();
            } catch (e) {}
          }
          render();
        }, 1000);
      } else {
        clearInterval(interval);
        interval = null;
      }
      render();
    };
    window.pmReset = () => {
      clearInterval(interval);
      interval = null;
      running = false;
      secsLeft = totalSecs;
      render();
    };
    window.pmSetPhase = (p) => {
      clearInterval(interval);
      interval = null;
      running = false;
      phase = p;
      totalSecs = p === "study" ? STUDY : p === "break" ? SHORT : LONG;
      secsLeft = totalSecs;
      render();
    };
  }
  render();
}
window.renderPomodoro = renderPomodoro;
// ============================================================
// SETTINGS PAGE
// ============================================================
function renderSettings() {
  const app = document.getElementById("app");

  // Defaults for settings keys
  const cfg = {
    pomodoroFocus: S.pomodoroFocus ?? 25,
    pomodoroShort: S.pomodoroShort ?? 5,
    pomodoroLong: S.pomodoroLong ?? 15,
    pomodoroLongAfter: S.pomodoroLongAfter ?? 4,
    autoStartBreaks: S.autoStartBreaks ?? false,
    autoStartFocus: S.autoStartFocus ?? false,
    dailyGoal: S.dailyGoal ?? 120,
    weeklyGoal: S.weeklyGoal ?? 600,
    sessionSound: S.sessionSound ?? true,
    soundVolume: S.soundVolume ?? 70,
    ambientVolume: S.ambientVolume ?? 30,
    // Study filter
    filterDifficulty: S.filterDifficulty ?? "all", // easy|medium|hard|all
    filterType: S.filterType ?? "all", // mcq|short|long|all
    filterSubject: S.filterSubject ?? "all",
    filterChapter: S.filterChapter ?? "all",
    filterMarks: S.filterMarks ?? "all", // 1|2|3|5|all
    filterYearFrom: S.filterYearFrom ?? 2018,
    filterYearTo: S.filterYearTo ?? 2025,
    filterBoard: S.filterBoard ?? "CBSE",
    filterExamType: S.filterExamType ?? "all", // board|school|practice|all
    filterLanguage: S.filterLanguage ?? "all",
    // Eye comfort
    eyeBrightness: S.eyeBrightness ?? 100,
    eyeWarmth: S.eyeWarmth ?? 0,
    eyeContrast: S.eyeContrast ?? 100,
    eyeBlueLight: S.eyeBlueLight ?? false,
    eyeAutoNight: S.eyeAutoNight ?? false,
  };

  const subjects = [
    "all",
    "Maths",
    "Science",
    "Social Science",
    "English",
    "Hindi",
  ];
  const theme = localStorage.getItem("stasis_theme") || "dark";

  function sect(icon, title, content) {
    return `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:18px;padding:20px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:18px">
        <span style="font-size:1.1rem">${icon}</span>
        <span style="font-size:0.85rem;font-weight:900;letter-spacing:.06em;color:var(--text);text-transform:uppercase">${title}</span>
      </div>
      ${content}
    </div>`;
  }

  function row(label, sub, control) {
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
      <div>
        <div style="font-size:0.83rem;font-weight:600;color:var(--text)">${label}</div>
        ${sub ? `<div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px">${sub}</div>` : ""}
      </div>
      ${control}
    </div>`;
  }

  function numInput(id, val, min, max) {
    return `<input id="s_${id}" type="number" value="${val}" min="${min}" max="${max}" style="width:70px;padding:6px 10px;border-radius:9px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:var(--text);font-size:0.85rem;font-weight:700;font-family:inherit;text-align:center">`;
  }

  function toggle(id, val) {
    return `<label style="position:relative;display:inline-block;width:42px;height:24px;cursor:pointer">
      <input type="checkbox" id="s_${id}" ${val ? "checked" : ""} onchange="window._sCfg('${id}',this.checked)" style="opacity:0;width:0;height:0">
      <span style="position:absolute;inset:0;border-radius:24px;background:${val ? "#4f8ef7" : "rgba(255,255,255,0.12)"};transition:.2s" id="s_${id}_track">
        <span style="position:absolute;width:18px;height:18px;border-radius:50%;background:#fff;top:3px;left:${val ? "21px" : "3px"};transition:.2s"></span>
      </span>
    </label>`;
  }

  function chip(id, opts, val) {
    return `<div style="display:flex;gap:6px;flex-wrap:wrap">${opts.map((o) => `<button onclick="window._sChip('${id}','${o.v}')" id="s_chip_${id}_${o.v}" style="padding:4px 12px;border-radius:20px;border:1.5px solid ${val === o.v ? "#4f8ef7" : "rgba(255,255,255,0.12)"};background:${val === o.v ? "rgba(79,142,247,0.15)" : "transparent"};color:${val === o.v ? "#4f8ef7" : "var(--text-muted)"};font-size:0.72rem;font-weight:800;cursor:pointer;font-family:inherit;transition:all .15s">${o.l}</button>`).join("")}</div>`;
  }

  function slider(id, val, min, max, unit) {
    return `<div style="display:flex;align-items:center;gap:10px">
      <input type="range" id="s_${id}" min="${min}" max="${max}" value="${val}" oninput="window._sSlider('${id}',this.value)" style="width:120px;accent-color:#4f8ef7">
      <span id="s_${id}_lbl" style="font-size:0.78rem;font-weight:700;color:var(--text);min-width:36px">${val}${unit}</span>
    </div>`;
  }

  function sel(id, opts, val) {
    return `<select id="s_${id}" onchange="window._sCfg('${id}',this.value)" style="padding:6px 10px;border-radius:9px;border:1px solid rgba(255,255,255,0.12);background:rgba(30,30,50,0.9);color:var(--text);font-size:0.8rem;font-weight:600;font-family:inherit">${opts.map((o) => `<option value="${o.v}" ${val === o.v ? "selected" : ""}>${o.l}</option>`).join("")}</select>`;
  }

  // Eye comfort filter CSS (applied live)
  function applyEyeFilter() {
    const b = S.eyeBrightness ?? 100,
      w = S.eyeWarmth ?? 0,
      c = S.eyeContrast ?? 100;
    const sepia = Math.round(w * 0.4);
    const hue = w > 0 ? `-${Math.round(w * 0.1)}deg` : "0deg";
    document.documentElement.style.filter = `brightness(${b}%) contrast(${c}%) sepia(${sepia}%) hue-rotate(${hue})`;
  }

  // Preset timer chips
  const timerPresets = [
    { v: "classic", l: "Classic · 25/5" },
    { v: "deep", l: "Deep · 50/10" },
    { v: "sprint", l: "Sprint · 15/3" },
    { v: "long", l: "Long · 90/20" },
  ];

  const diffOpts = [
    { v: "all", l: "All" },
    { v: "easy", l: "Easy" },
    { v: "medium", l: "Medium" },
    { v: "hard", l: "Hard" },
  ];
  const typeOpts = [
    { v: "all", l: "All" },
    { v: "mcq", l: "MCQ" },
    { v: "short", l: "Short Ans" },
    { v: "long", l: "Long Ans" },
    { v: "assertion", l: "A&R" },
    { v: "casebased", l: "Case-based" },
  ];
  const marksOpts = [
    { v: "all", l: "All" },
    { v: "1", l: "1M" },
    { v: "2", l: "2M" },
    { v: "3", l: "3M" },
    { v: "5", l: "5M" },
  ];
  const examOpts = [
    { v: "all", l: "All" },
    { v: "board", l: "Board" },
    { v: "school", l: "School Test" },
    { v: "practice", l: "Practice" },
    { v: "mock", l: "Mock" },
  ];
  const boardOpts = [
    { v: "CBSE", l: "CBSE" },
    { v: "ICSE", l: "ICSE" },
    { v: "State", l: "State Board" },
  ];
  const langOpts = [
    { v: "all", l: "All" },
    { v: "en", l: "English" },
    { v: "hi", l: "Hindi" },
  ];

  const curThemeName =
    theme === "dark"
      ? "🌙 Dark"
      : theme === "light"
        ? "☀️ Light"
        : "🌿 Eye Comfort";

  app.innerHTML = `
    <button onclick="navigate('home')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;padding:0;font-family:inherit;margin-bottom:18px;display:block">‹ Back</button>
    <div style="font-size:1.3rem;font-weight:900;background:linear-gradient(135deg,#4f8ef7,#9b6dff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px">⚙️ Settings</div>
    <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:24px">Tune your timer, goals, filters and appearance</div>

    ${sect(
      "⏱️",
      "Focus Timer",
      `<div style="margin-bottom:14px">${chip("timerPreset", timerPresets, cfg.pomodoroFocus === 25 && cfg.pomodoroShort === 5 ? "classic" : cfg.pomodoroFocus === 50 ? "deep" : cfg.pomodoroFocus === 15 ? "sprint" : cfg.pomodoroFocus === 90 ? "long" : "custom")}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div style="font-size:0.7rem;font-weight:700;color:var(--text-muted);margin-bottom:5px">Focus (min)</div>${numInput("pomodoroFocus", cfg.pomodoroFocus, 5, 120)}</div>
        <div><div style="font-size:0.7rem;font-weight:700;color:var(--text-muted);margin-bottom:5px">Short break (min)</div>${numInput("pomodoroShort", cfg.pomodoroShort, 1, 30)}</div>
        <div><div style="font-size:0.7rem;font-weight:700;color:var(--text-muted);margin-bottom:5px">Long break (min)</div>${numInput("pomodoroLong", cfg.pomodoroLong, 5, 60)}</div>
        <div><div style="font-size:0.7rem;font-weight:700;color:var(--text-muted);margin-bottom:5px">Long break after</div>${numInput("pomodoroLongAfter", cfg.pomodoroLongAfter, 2, 8)}</div>
      </div>
      ${row("Auto-start breaks", "Break timer starts when focus ends", toggle("autoStartBreaks", cfg.autoStartBreaks))}
      ${row("Auto-start focus", "Next focus when break ends", toggle("autoStartFocus", cfg.autoStartFocus))}`,
    )}

    ${sect(
      "📚",
      "Question Scope",
      row(
        "Difficulty",
        "Filter questions by difficulty",
        chip("filterDifficulty", diffOpts, cfg.filterDifficulty),
      ) +
        row(
          "Question type",
          "Format of the question",
          chip("filterType", typeOpts, cfg.filterType),
        ) +
        row(
          "Marks",
          "Filter by question marks",
          chip("filterMarks", marksOpts, cfg.filterMarks),
        ) +
        row(
          "Exam type",
          "Source of the question",
          chip("filterExamType", examOpts, cfg.filterExamType),
        ) +
        row(
          "Subject",
          "Narrow to one subject",
          sel(
            "filterSubject",
            subjects.map((s) => ({
              v: s,
              l: s === "all" ? "All Subjects" : s,
            })),
            cfg.filterSubject,
          ),
        ) +
        row(
          "Board",
          "Curriculum board",
          chip(
            "filterBoard",
            [
              { v: "CBSE", l: "CBSE" },
              { v: "ICSE", l: "ICSE" },
              { v: "State", l: "State" },
            ],
            cfg.filterBoard,
          ),
        ) +
        row(
          "Language",
          "Question language",
          chip("filterLanguage", langOpts, cfg.filterLanguage),
        ) +
        `<div style="padding:10px 0">
        <div style="font-size:0.83rem;font-weight:600;color:var(--text);margin-bottom:8px">Year range</div>
        <div style="display:flex;align-items:center;gap:10px">
          ${numInput("filterYearFrom", cfg.filterYearFrom, 2010, 2025)}
          <span style="color:var(--text-muted);font-size:0.8rem">to</span>
          ${numInput("filterYearTo", cfg.filterYearTo, 2010, 2025)}
        </div>
      </div>`,
    )}

    ${sect(
      "🎯",
      "Goals",
      row(
        "Daily focus goal",
        "Target study minutes per day",
        numInput("dailyGoal", cfg.dailyGoal, 10, 480),
      ) +
        row(
          "Weekly focus goal",
          "Target study minutes per week",
          numInput("weeklyGoal", cfg.weeklyGoal, 60, 3360),
        ),
    )}

    ${sect(
      "🔊",
      "Sound",
      row(
        "End-of-session sound",
        "Chime when a session finishes",
        toggle("sessionSound", cfg.sessionSound),
      ) +
        row(
          "Sound volume",
          "",
          slider("soundVolume", cfg.soundVolume, 0, 100, "%"),
        ) +
        row(
          "Ambient volume",
          "Background sound default",
          slider("ambientVolume", cfg.ambientVolume, 0, 100, "%"),
        ),
    )}

    ${sect(
      "🌙",
      "Appearance",
      row(
        "Theme",
        "Current: <b>${curThemeName}</b>",
        `<div style="display:flex;gap:6px">
          <button onclick="setTheme('dark');renderSettings()" style="padding:6px 12px;border-radius:20px;border:1.5px solid ${theme === "dark" ? "#4f8ef7" : "rgba(255,255,255,0.12)"};background:${theme === "dark" ? "rgba(79,142,247,0.18)" : "transparent"};color:${theme === "dark" ? "#4f8ef7" : "var(--text-muted)"};font-size:0.75rem;font-weight:700;cursor:pointer;font-family:inherit">🌙 Dark</button>
          <button onclick="setTheme('light');renderSettings()" style="padding:6px 12px;border-radius:20px;border:1.5px solid ${theme === "light" ? "#f0b429" : "rgba(255,255,255,0.12)"};background:${theme === "light" ? "rgba(240,180,41,0.18)" : "transparent"};color:${theme === "light" ? "#f0b429" : "var(--text-muted)"};font-size:0.75rem;font-weight:700;cursor:pointer;font-family:inherit">☀️ Light</button>
          <button onclick="setTheme('eye');renderSettings()" style="padding:6px 12px;border-radius:20px;border:1.5px solid ${theme === "eye" ? "#0fca8c" : "rgba(255,255,255,0.12)"};background:${theme === "eye" ? "rgba(15,202,140,0.18)" : "transparent"};color:${theme === "eye" ? "#0fca8c" : "var(--text-muted)"};font-size:0.75rem;font-weight:700;cursor:pointer;font-family:inherit">🌿 Eye</button>
        </div>`,
      ),
    )}

    ${sect(
      "👁️",
      "Eye Comfort",
      `<div style="background:rgba(15,202,140,0.06);border:1px solid rgba(15,202,140,0.15);border-radius:12px;padding:10px 14px;margin-bottom:14px;font-size:0.75rem;color:#0fca8c">Works in all themes — adjusts screen filter independently of dark/light mode.</div>` +
        row(
          "Brightness",
          "",
          slider("eyeBrightness", cfg.eyeBrightness, 50, 100, "%"),
        ) +
        row(
          "Contrast",
          "",
          slider("eyeContrast", cfg.eyeContrast, 70, 120, "%"),
        ) +
        row(
          "Warmth",
          "Reduces cool blue tones",
          slider("eyeWarmth", cfg.eyeWarmth, 0, 100, "%"),
        ) +
        row(
          "Blue-light filter",
          "Applies warm sepia overlay",
          toggle("eyeBlueLight", cfg.eyeBlueLight),
        ) +
        row(
          "Auto night mode",
          "Increase warmth after 8 PM",
          toggle("eyeAutoNight", cfg.eyeAutoNight),
        ) +
        `<button onclick="window._sResetEye()" style="margin-top:10px;padding:6px 16px;border-radius:20px;border:1.5px solid rgba(255,255,255,0.12);background:transparent;color:var(--text-muted);font-size:0.75rem;font-weight:700;cursor:pointer;font-family:inherit">Reset eye comfort</button>`,
    )}

    ${sect(
      "👤",
      "Account",
      row(
        "Signed in as",
        "${S.name || 'Guest'}",
        `<button onclick="logoutUser()" style="padding:6px 14px;border-radius:20px;border:1.5px solid rgba(239,68,68,0.4);background:rgba(239,68,68,0.08);color:#ef4444;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">Sign Out</button>`,
      ),
    )}
    <button onclick="window._sSave()" style="width:100%;padding:14px;border-radius:14px;border:none;background:linear-gradient(135deg,#4f8ef7,#9b6dff);color:#fff;font-size:0.9rem;font-weight:900;cursor:pointer;font-family:inherit;margin-top:4px;margin-bottom:32px">Save Settings</button>
  `;

  // ── Handlers ──
  window._sCfg = (id, val) => {
    S[id] = val;
    // live toggle visual
    const track = document.getElementById(`s_${id}_track`);
    if (track) {
      track.style.background = val ? "#4f8ef7" : "rgba(255,255,255,0.12)";
      const knob = track.querySelector("span");
      if (knob) knob.style.left = val ? "21px" : "3px";
    }
    if (id === "eyeBlueLight") {
      S.eyeWarmth = val ? 60 : 0;
      S.eyeBrightness = val ? 90 : 100;
      applyEyeFilter();
    }
    if (id === "eyeAutoNight") {
      const h = new Date().getHours();
      if (val && (h >= 20 || h < 6)) {
        S.eyeWarmth = 50;
        applyEyeFilter();
      }
    }
  };

  window._sChip = (id, val) => {
    S[id] = val;
    document.querySelectorAll(`[id^="s_chip_${id}_"]`).forEach((b) => {
      const active = b.id === `s_chip_${id}_${val}`;
      b.style.borderColor = active ? "#4f8ef7" : "rgba(255,255,255,0.12)";
      b.style.background = active ? "rgba(79,142,247,0.15)" : "transparent";
      b.style.color = active ? "#4f8ef7" : "var(--text-muted)";
    });
    // Apply timer preset
    if (id === "timerPreset") {
      const presets = {
        classic: [25, 5, 15, 4],
        deep: [50, 10, 25, 3],
        sprint: [15, 3, 10, 4],
        long: [90, 20, 30, 2],
      };
      const p = presets[val];
      if (p) {
        [
          "pomodoroFocus",
          "pomodoroShort",
          "pomodoroLong",
          "pomodoroLongAfter",
        ].forEach((k, i) => {
          S[k] = p[i];
          const el = document.getElementById(`s_${k}`);
          if (el) el.value = p[i];
        });
      }
    }
  };

  window._sSlider = (id, val) => {
    S[id] = Number(val);
    const lbl = document.getElementById(`s_${id}_lbl`);
    if (lbl) lbl.textContent = val + (id.includes("Volume") ? "%" : "%");
    if (id.startsWith("eye")) applyEyeFilter();
  };

  window._sResetEye = () => {
    ["eyeBrightness", "eyeContrast", "eyeWarmth"].forEach((k) => {
      S[k] = k === "eyeBrightness" ? 100 : k === "eyeContrast" ? 100 : 0;
    });
    S.eyeBlueLight = false;
    S.eyeAutoNight = false;
    document.documentElement.style.filter = "";
    renderSettings();
  };

  window._sSave = () => {
    // Read all number inputs back
    [
      "pomodoroFocus",
      "pomodoroShort",
      "pomodoroLong",
      "pomodoroLongAfter",
      "dailyGoal",
      "weeklyGoal",
      "filterYearFrom",
      "filterYearTo",
    ].forEach((k) => {
      const el = document.getElementById(`s_${k}`);
      if (el) S[k] = Number(el.value);
    });
    saveState();
    // Flash button
    const btn = event.target;
    btn.textContent = "✅ Saved!";
    btn.style.background = "linear-gradient(135deg,#0fca8c,#4f8ef7)";
    setTimeout(() => {
      btn.textContent = "Save Settings";
      btn.style.background = "linear-gradient(135deg,#4f8ef7,#9b6dff)";
    }, 1800);
  };

  // Apply eye comfort on load
  applyEyeFilter();
}
window.renderSettings = renderSettings;

// ============================================================
// EXAM PAPER AUTOPILOT
// ============================================================
function renderAutopilot() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <button onclick="navigate('home')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;padding:0;font-family:inherit;margin-bottom:18px;display:block">‹ Back</button>
    <div style="font-size:1.3rem;font-weight:900;background:linear-gradient(135deg,#f0b429,#f7714f);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px">📸 Exam Paper Autopilot</div>
    <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:20px">Upload a PYQ or sample paper → AI reads every topic → auto-schedules your full revision plan</div>

    <!-- How it works -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:20px">
      ${[
        ["📸", "Upload your paper", "PYQ, sample, or mock test"],
        ["🧠", "AI scans topics", "Finds every concept asked"],
        ["📅", "Plan generated", "Full revision schedule built"],
      ]
        .map(
          ([e, t, s]) => `
        <div style="background:rgba(240,180,41,0.06);border:1px solid rgba(240,180,41,0.15);border-radius:14px;padding:12px;text-align:center">
          <div style="font-size:1.4rem;margin-bottom:6px">${e}</div>
          <div style="font-size:0.72rem;font-weight:800;color:var(--text);margin-bottom:3px">${t}</div>
          <div style="font-size:0.65rem;color:var(--text-muted)">${s}</div>
        </div>`,
        )
        .join("")}
    </div>

    <!-- Upload area -->
    <div id="ap-upload-area" onclick="document.getElementById('ap-file-input').click()" style="border:2px dashed rgba(240,180,41,0.35);border-radius:18px;padding:36px 20px;text-align:center;cursor:pointer;background:rgba(240,180,41,0.04);transition:all .2s;margin-bottom:16px"
      onmouseover="this.style.borderColor='rgba(240,180,41,0.7)';this.style.background='rgba(240,180,41,0.08)'"
      onmouseout="this.style.borderColor='rgba(240,180,41,0.35)';this.style.background='rgba(240,180,41,0.04)'">
      <div style="font-size:2.5rem;margin-bottom:10px">📄</div>
      <div style="font-size:0.9rem;font-weight:800;color:var(--text);margin-bottom:4px">Tap to upload sample or past year paper</div>
      <div style="font-size:0.75rem;color:var(--text-muted)">JPG or PNG · Photo your paper</div>
      <input type="file" id="ap-file-input" accept="image/*" style="display:none" onchange="apOnImage(this)">
    </div>

    <!-- Preview (hidden until upload) -->
    <div id="ap-preview-wrap" style="display:none;margin-bottom:16px;position:relative">
      <img id="ap-preview" style="width:100%;border-radius:14px;border:1px solid rgba(255,255,255,0.1)">
      <button onclick="apRemoveImage()" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);border:none;color:#fff;border-radius:50%;width:28px;height:28px;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
    </div>

    <!-- Options -->
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px;margin-bottom:16px">
      <div style="font-size:0.7rem;font-weight:900;letter-spacing:.08em;color:var(--text-muted);text-transform:uppercase;margin-bottom:12px">Plan Options</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);margin-bottom:5px">Exam date</div>
          <input type="date" id="ap-exam-date" style="width:100%;padding:7px 10px;border-radius:9px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:var(--text);font-size:0.8rem;font-family:inherit" value="${new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]}" min="${new Date().toISOString().split("T")[0]}">
        </div>
        <div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);margin-bottom:5px">Class</div>
          <select id="ap-class" style="width:100%;padding:7px 10px;border-radius:9px;border:1px solid rgba(255,255,255,0.12);background:rgba(30,30,50,0.9);color:var(--text);font-size:0.8rem;font-family:inherit">
            ${["6", "7", "8", "9", "10"].map((c) => `<option value="${c}" ${(S.classPreference || "10") === c ? "selected" : ""}>${c}</option>`).join("")}
          </select>
        </div>
        <div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);margin-bottom:5px">Daily study time</div>
          <select id="ap-daily" style="width:100%;padding:7px 10px;border-radius:9px;border:1px solid rgba(255,255,255,0.12);background:rgba(30,30,50,0.9);color:var(--text);font-size:0.8rem;font-family:inherit">
            ${[
              ["1h", "1"],
              ["2h", "2"],
              ["3h", "3"],
              ["4h", "4"],
            ]
              .map(
                ([l, v]) =>
                  `<option value="${v}" ${v === "2" ? "selected" : ""}>${l}</option>`,
              )
              .join("")}
          </select>
        </div>
        <div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);margin-bottom:5px">Focus</div>
          <select id="ap-focus" style="width:100%;padding:7px 10px;border-radius:9px;border:1px solid rgba(255,255,255,0.12);background:rgba(30,30,50,0.9);color:var(--text);font-size:0.8rem;font-family:inherit">
            <option value="weak-first">Weak topics first</option>
            <option value="paper-order">Paper order</option>
            <option value="high-marks">High marks first</option>
            <option value="balanced">Balanced</option>
          </select>
        </div>
      </div>
    </div>

    <div id="ap-err" style="color:#f7714f;font-size:0.82rem;margin-bottom:10px;text-align:center;min-height:18px"></div>
    <button id="ap-btn" onclick="apRun()" style="width:100%;padding:14px;border-radius:14px;border:none;background:linear-gradient(135deg,#f0b429,#f7714f);color:#fff;font-size:0.9rem;font-weight:900;cursor:pointer;font-family:inherit;opacity:0.5" disabled>
      Upload a paper to continue
    </button>

    <!-- Results area -->
    <div id="ap-results" style="margin-top:24px"></div>
  `;

  let _apImgData = null;

  window.apOnImage = (input) => {
    const file = input.files[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      // Reject PDFs over 400KB (base64 would exceed API limit)

      // PDF path — read as base64 and show a styled preview card
      const reader = new FileReader();
      reader.onload = (ev) => {
        _apImgData = {
          pdfBase64: ev.target.result.split(",")[1],
          mimeType: "application/pdf",
        };
        document.getElementById("ap-preview-wrap").style.display = "block";
        document.getElementById("ap-preview-wrap").innerHTML = `
          <div style="background:rgba(240,180,41,0.08);border:1px solid rgba(240,180,41,0.25);border-radius:14px;padding:20px;text-align:center;position:relative">
            <div style="font-size:2.5rem">📄</div>
            <div style="font-size:0.85rem;font-weight:800;color:var(--text);margin-top:6px">${file.name}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px">${(file.size / 1024).toFixed(0)} KB • PDF</div>
            <button onclick="apRemoveImage()" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);border:none;color:#fff;border-radius:50%;width:28px;height:28px;font-size:1rem;cursor:pointer">✕</button>
          </div>`;
        document.getElementById("ap-upload-area").style.display = "none";
        const btn = document.getElementById("ap-btn");
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.textContent = "🚀 Analyse Paper & Build Plan";
      };
      reader.readAsDataURL(file);
      return;
    }

    // Image path (existing logic)
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 1200;
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
        const compressed = canvas.toDataURL("image/jpeg", 0.85);
        _apImgData = {
          imageBase64: compressed.split(",")[1],
          mimeType: "image/jpeg",
        };
        document.getElementById("ap-preview").src = compressed;
        document.getElementById("ap-preview-wrap").style.display = "block";
        document.getElementById("ap-upload-area").style.display = "none";
        const btn = document.getElementById("ap-btn");
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.textContent = "🚀 Analyse Paper & Build Plan";
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  window.apRemoveImage = () => {
    _apImgData = null;
    document.getElementById("ap-file-input").value = "";
    document.getElementById("ap-preview-wrap").style.display = "none";
    document.getElementById("ap-upload-area").style.display = "block";
    const btn = document.getElementById("ap-btn");
    btn.disabled = true;
    btn.style.opacity = "0.5";
    btn.textContent = "Upload a paper to continue";
    document.getElementById("ap-results").innerHTML = "";
  };

  window.apRun = async () => {
    if (!_apImgData) return;
    const examDate = document.getElementById("ap-exam-date").value;
    const classNum = document.getElementById("ap-class").value;
    const dailyHours = Number(document.getElementById("ap-daily").value);
    const focus = document.getElementById("ap-focus").value;
    const err = document.getElementById("ap-err");
    const btn = document.getElementById("ap-btn");
    const results = document.getElementById("ap-results");
    err.textContent = "";

    btn.disabled = true;
    btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px">${typingLoader()} Scanning paper...</span>`;

    results.innerHTML = `
      <div style="background:rgba(240,180,41,0.06);border:1px solid rgba(240,180,41,0.15);border-radius:14px;padding:16px;text-align:center">
        <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px">Reading your sample paper...</div>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          ${[
            "Detecting subjects",
            "Extracting topics",
            "Mapping to chapters",
            "Checking PYQ patterns",
            "Building schedule",
          ]
            .map(
              (s, i) =>
                `<div id="ap-step-${i}" style="padding:4px 10px;border-radius:20px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:var(--text-muted);font-size:0.7rem;font-weight:700;transition:all .4s">${s}</div>`,
            )
            .join("")}
        </div>
      </div>`;

    // Animate steps
    let stepIdx = 0;
    const stepAnim = setInterval(() => {
      const el = document.getElementById(`ap-step-${stepIdx}`);
      if (el) {
        el.style.borderColor = "#f0b429";
        el.style.color = "#f0b429";
        el.style.background = "rgba(240,180,41,0.1)";
      }
      stepIdx++;
      if (stepIdx >= 5) clearInterval(stepAnim);
    }, 900);

    try {
      const daysLeft = Math.max(
        1,
        Math.round((new Date(examDate) - Date.now()) / 86400000),
      );
      const data = await apiPost("/autopilot", {
        ..._apImgData,
        classNum,
        examDate,
        dailyHours,
        daysLeft,
        focus,
        subjectCounts: S.subjectCounts || {},
        weakContext: Object.entries(S.subjectCounts || {})
          .map(([k, v]) => `${k}:${v}`)
          .join(", "),
      });

      clearInterval(stepAnim);

      // Store as revision schedule so user can view it in Revision Plan too
      S.revisionSchedule = {
        ...data,
        examDate,
        classNum,
        subjects: data.subjects || [],
        dailyHours,
        createdAt: Date.now(),
        source: "autopilot",
      };
      saveState();

      // Render results
      const topics = data.topics || [];
      const schedule = data.schedule || [];
      const subjectList = data.subjects || [];

      results.innerHTML = `
        <!-- Success banner -->
        <div style="background:rgba(15,202,140,0.08);border:1.5px solid rgba(15,202,140,0.25);border-radius:14px;padding:14px 16px;margin-bottom:16px;display:flex;align-items:center;gap:12px">
          <span style="font-size:1.5rem">✅</span>
          <div>
            <div style="font-size:0.85rem;font-weight:900;color:#0fca8c">Plan ready — ${daysLeft} days to go</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">${topics.length} topics detected across ${subjectList.length} subjects</div>
          </div>
        </div>

        <!-- Stats row -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">
          ${[
            ["📚", topics.length, "Topics found"],
            ["📅", schedule.length, "Study days"],
            ["⏱️", dailyHours + "h", "Per day"],
          ]
            .map(
              ([
                e,
                v,
                l,
              ]) => `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px;text-align:center">
            <div style="font-size:1.1rem">${e}</div>
            <div style="font-size:1.2rem;font-weight:900;color:var(--text)">${v}</div>
            <div style="font-size:0.65rem;color:var(--text-muted)">${l}</div>
          </div>`,
            )
            .join("")}
        </div>

        <!-- Topics detected -->
        ${
          topics.length > 0
            ? `
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px;margin-bottom:16px">
          <div style="font-size:0.7rem;font-weight:900;letter-spacing:.08em;color:var(--text-muted);text-transform:uppercase;margin-bottom:10px">Topics detected in your paper</div>
          <div style="display:flex;flex-wrap:wrap;gap:7px">
            ${topics.map((t) => `<span style="padding:4px 10px;border-radius:20px;background:rgba(240,180,41,0.1);border:1px solid rgba(240,180,41,0.25);color:#f0b429;font-size:0.72rem;font-weight:700">${t}</span>`).join("")}
          </div>
        </div>`
            : ""
        }

        <!-- First 5 days of schedule preview -->
        ${
          schedule.length > 0
            ? `
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px;margin-bottom:16px">
          <div style="font-size:0.7rem;font-weight:900;letter-spacing:.08em;color:var(--text-muted);text-transform:uppercase;margin-bottom:10px">Your first ${Math.min(5, schedule.length)} days</div>
          ${schedule
            .slice(0, 5)
            .map(
              (day, i) => `
            <div style="display:flex;gap:12px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05)${i === Math.min(4, schedule.length - 1) ? ";border:none" : ""}">
              <div style="width:36px;height:36px;border-radius:10px;background:rgba(240,180,41,0.12);border:1px solid rgba(240,180,41,0.25);display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:900;color:#f0b429;flex-shrink:0">D${i + 1}</div>
              <div style="flex:1">
                <div style="font-size:0.82rem;font-weight:700;color:var(--text)">${day.title || day.topic || "Study session"}</div>
                <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px">${day.description || day.subject || ""}</div>
              </div>
              ${day.marks ? `<div style="font-size:0.7rem;font-weight:800;color:#f0b429;flex-shrink:0">${day.marks}M</div>` : ""}
            </div>`,
            )
            .join("")}
        </div>`
            : ""
        }

        <!-- PYQ warning if topics repeat -->
        ${
          data.pyqAlert
            ? `
        <div style="background:rgba(247,113,79,0.08);border:1px solid rgba(247,113,79,0.2);border-radius:12px;padding:12px 14px;margin-bottom:16px;font-size:0.78rem;color:#f7714f">
          ⚠️ ${data.pyqAlert}
        </div>`
            : ""
        }

        <!-- Actions -->
        <div style="display:flex;gap:10px">
          <button onclick="navigate('revision')" style="flex:1;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,#06b6d4,#4f8ef7);color:#fff;font-size:0.82rem;font-weight:900;cursor:pointer;font-family:inherit">📅 View Full Plan</button>
          <button onclick="apRemoveImage()" style="padding:12px 16px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.12);background:transparent;color:var(--text-muted);font-size:0.82rem;font-weight:700;cursor:pointer;font-family:inherit">↺ New Paper</button>
        </div>
      `;

      btn.textContent = "✅ Plan Generated";
      btn.style.background = "linear-gradient(135deg,#0fca8c,#4f8ef7)";
    } catch (e) {
      clearInterval(stepAnim);
      const msg = e.message || "";
      if (msg.includes("413")) {
        err.textContent =
          "PDF too large for analysis. Try a smaller PDF or upload a photo instead.";
      } else if (msg.includes("422")) {
        err.textContent =
          "Couldn't read text from this PDF. Try uploading a photo of the paper.";
      } else {
        err.textContent = "Could not analyse paper. Please try again.";
      }
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.textContent = "🚀 Analyse Paper & Build Plan";
      results.innerHTML = "";
    }
  };
}
window.renderAutopilot = renderAutopilot;
