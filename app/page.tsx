"use client";
import React, { useState, useEffect } from "react";
import { PDFDocument } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';

// --- INITIALIZE SUPABASE CLIENT ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- EXODUS GAME DATA ---
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const MAX_SKILLS = 4;
const WEALTH_BY_LEVEL = [0, 500, 1000, 2500, 5000, 10000, 18000, 30000, 50000, 75000, 120000];

const EQUIPMENT_CATALOG = [
  { 
    category: "Standard Weapons", 
    items: [ 
      { name: "Vanguard Autopistol", cost: 75, tags: ["Pistols", "Simple Weapons"], damage: "1d6 Kinetic", range: "40/120 ft.", notes: "Light" }, 
      { name: "Scrap-built Shotgun", cost: 50, tags: ["Shotguns", "Simple Weapons"], damage: "2d4 Kinetic", range: "20/60 ft.", notes: "Scatter" }, 
      { name: "Assault Rifle", cost: 150, tags: ["Rifles", "Martial Weapons"], damage: "1d8 Kinetic", range: "80/240 ft.", notes: "Burst Fire" }, 
      { name: "Heavy Scattergun", cost: 200, tags: ["Heavy Guns"], damage: "2d6 Kinetic", range: "30/90 ft.", notes: "Heavy, Two-Handed" }, 
      { name: "Sniper Rifle", cost: 250, tags: ["Rifles", "Martial Weapons"], damage: "1d10 Kinetic", range: "150/400 ft.", notes: "Heavy, Two-Handed" }, 
      { name: "Thermal Blade", cost: 100, tags: ["Blades", "Martial Weapons"], damage: "1d8 Fire", range: "Melee", notes: "Finesse" } 
    ] 
  },
  { 
    category: "Armor & Defense", 
    items: [ 
      { name: "Traveler Void Suit - Light", cost: 100, tags: ["Light Armor"] }, 
      { name: "Combat Carapace - Medium", cost: 250, tags: ["Medium Armor"] }, 
      { name: "Cataphract Chassis - Heavy", cost: 1000, tags: ["Heavy Armor", "Mechs"] }, 
      { name: "Deflector Shield Generator", cost: 300, tags: ["Gear"] } 
    ] 
  },
  { 
    category: "Field Gear & Tools", 
    items: [ 
      { name: "Standard Issue Datapad", cost: 25, tags: ["Gear"] }, 
      { name: "Ration Packs (x5)", cost: 10, tags: ["Gear"] }, 
      { name: "Trauma Med-Kit", cost: 50, tags: ["Gear"] }, 
      { name: "Breaching Explosives", cost: 75, tags: ["Gear"] }, 
      { name: "Recon Drone", cost: 150, tags: ["Tech Drones"] }, 
      { name: "Hacking Spikes", cost: 100, tags: ["Gear"] } 
    ] 
  }
];

const AEGIS_CATALOG = [
  { name: "Ocular HUD", slot: "Head", notes: "Grants darkvision 60ft and integrated targeting." },
  { name: "Sub-dermal Plating", slot: "Torso", notes: "Reduces incoming kinetic damage by 3." },
  { name: "Myomer Muscle Weave", slot: "Left Arm", notes: "Advantage on Athletics checks for lifting." },
  { name: "Grav-Boots", slot: "Legs", notes: "Halve falling damage, triple jump distance." },
  { name: "Neural Coprocessor", slot: "Internal", notes: "Advantage on Intelligence saving throws." },
  { name: "Adrenal Pump", slot: "Internal", notes: "Once per rest, take an extra Bonus Action." },
];

const MECH_WEAPONS = [
  { name: "Thermal Broadsword", act: "1 Action", range: "Melee", notes: "2 Heat / 2d10 Fire Damage" },
  { name: "Heavy Scattergun", act: "1 Action", range: "30 ft.", notes: "1 Heat / 3d6 Kinetic Damage" },
  { name: "Shoulder Missile Pod", act: "1 Action", range: "120 ft.", notes: "3 Heat / 4d6 Explosive Damage (AoE)" },
  { name: "Rotary Autocannon", act: "1 Action", range: "80 ft.", notes: "2 Heat / 2d8 Kinetic (Rapid Fire)" }
];

const REMNANTS = [
  { name: "Phase Shifter", act: "Bonus Action", range: "Self", notes: "Teleport up to 30ft to an unoccupied space." },
  { name: "Kinetic Barrier", act: "Reaction", range: "Self", notes: "Add +5 to AC against one incoming ranged attack." },
  { name: "Neural Uplink", act: "1 Action", range: "Touch", notes: "Instantly interface with and decrypt Celestial tech." },
  { name: "Graviton Anchor", act: "1 Action", range: "60 ft.", notes: "Target must make STR save or be immobilized." }
];

const SYMBIONT_STRAINS = [
  "The Obsidian Weave", "Crimson Spore", "Azure Crystalline Strain", 
  "The Mercury Blight", "Void-Glass Parasite", "The Amethyst Infection",
  "Onyx Marrow", "The Phosphor Strain"
];

const SYMBIONT_VISUALS = [
  "Translucent skin revealing glowing, crystalline veins beneath.",
  "Eyes replaced by multi-faceted, unblinking jewel-like structures.",
  "Jagged, metallic-looking growths erupting along the spine and forearms.",
  "Skin takes on an iridescent, shimmering quality under direct light.",
  "Blood is thick, silver, and slightly luminous when exposed.",
  "Fingertips end in sharp, natural diamond-hard points.",
  "A faintly glowing, geometric pattern runs across the chest and neck.",
  "Voice has a subtle, dual-layered metallic echo."
];

const COMPANION_SPECIES = ["Bear", "Tiger", "Raven", "Boar", "Dog", "Frog", "Wolf", "Panther"];
const BODY_SLOTS = ["Head", "Torso", "Left Arm", "Right Arm", "Legs", "Internal"];

type StatKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

const originData: Record<string, {name: string, desc: string} & Record<StatKey, number>> = {
  archeologist: { name: "Archeologist", str: 0, dex: 0, con: 2, int: 1, wis: 0, cha: 0, desc: "A dedicated seeker of knowledge. You piece together the puzzles of fallen cultures and unearth ancient mysteries." },
  criminal: { name: "Criminal", str: 1, dex: 2, con: 0, int: 0, wis: 0, cha: 0, desc: "You survive by breaking the rules. Whether hacking encryptions or ghosting past guards, the underworld is your domain." },
  detective: { name: "Detective", str: 0, dex: 1, con: 0, int: 0, wis: 2, cha: 0, desc: "You dig into the cracks of society, finding out things others want hidden to uncover the truth and bring the guilty to justice." },
  grifter: { name: "Grifter", str: 0, dex: 0, con: 1, int: 0, wis: 0, cha: 2, desc: "You thrive in the seedy underbelly of society. A con artist who relies on wits, charm, and bravado to part the wealthy from their wealth." },
  hotshot: { name: "Hotshot", str: 0, dex: 2, con: 0, int: 0, wis: 0, cha: 1, desc: "You are all about speed. A legendary pilot or getaway driver who pushes machines to the absolute limit to escape any threat." },
  inventor: { name: "Inventor", str: 0, dex: 0, con: 0, int: 2, wis: 1, cha: 0, desc: "Celestial technology is crystal clear to you. You use your brilliant mind to repair, build, and forge a new future for humanity." },
  soldier: { name: "Soldier", str: 2, dex: 1, con: 0, int: 0, wis: 0, cha: 0, desc: "War gave you structure and meaning. You are a disciplined warrior with no peer on the battlefield, surviving lethal engagements." },
  spy: { name: "Spy", str: 0, dex: 0, con: 0, int: 1, wis: 0, cha: 2, desc: "You work in the shadows. An elite expert in espionage, you slip past guards and tap enemy comms to steer society from the dark." },
};

const classData: Record<string, any> = {
  cataphract: { name: "Cataphract", hitDie: 6, avgHp: 4, saves: "Wisdom, Constitution", role: "Heavy Mech Pilot", img: "/cataphract.jpg", proficiencies: "Light Armor, Medium Armor, Heavy Armor, Mechs, Simple Weapons, Martial Weapons, Heavy Guns, Gear", desc: "Elite mechanized warriors bonded to heavy exo-suits. You are the ultimate frontline defender, managing heat levels while laying down devastating weapons fire.", features: [ { name: "Mechanized Chassis Bond", desc: "Permanently bonded to a combat mech suit. Movement and reactions sync via neural interface." }, { name: "Traveler's Treasury (Lvl 2)", desc: "Install Treasury Remnants directly into suit slots. Attack modifiers and save DCs use Wisdom." } ], subclasses: [ { name: "Siegebreaker", desc: "A heavy-ordnance specialist that pushes Mech heat capacity for AoE destruction.", features: [{ name: "Artillery Stance", desc: "Advantage on heavy weapon attacks when stationary, but heat dissipation is halved." }] }, { name: "Vanguard", desc: "A highly mobile shock-trooper designed to break enemy lines.", features: [{ name: "Kinetic Charge", desc: "Use Mech thrusters to close gaps rapidly, gaining bonus melee damage." }] } ] },
  daemon: { name: "Daemon", hitDie: 10, avgHp: 6, saves: "Dexterity, Strength", role: "Silicate Symbiont", img: "/daemon.jpg", proficiencies: "Light Armor, Medium Armor, Simple Weapons, Martial Weapons, Blades, Pistols, Gear", desc: "A lethal cybernetic skirmisher bonded with a Silicate symbiont. You absorb kinetic impacts to fuel movement, always balancing on the edge of a violent Shadow frenzy.", features: [ { name: "Silicate Symbiosis", desc: "An alien bio-tech parasite enhances your speed, durability, and aggression." }, { name: "Kinetic Absorption", desc: "Take physical damage to generate Energy Points, fueling rapid movement and strikes." } ], subclasses: [ { name: "Shadow Weaver", desc: "Embraces the Silicate's stealth capabilities to strike unseen.", features: [{ name: "Active Camouflage", desc: "Expend Energy Points to become invisible in dim light until you attack." }] }, { name: "Bloodtracker", desc: "A brutal hunter that uses the symbiont to rapidly regenerate tissue.", features: [{ name: "Symbiotic Regeneration", desc: "Consume Energy Points to instantly heal physical wounds." }] } ] },
  prodigy: { name: "Prodigy", hitDie: 8, avgHp: 5, saves: "Intelligence, Charisma", role: "Remnant Wielder", img: "/prodigy.jpg", proficiencies: "Light Armor, Simple Weapons, Pistols, Tech Drones, Remnants, Gear", desc: "A master of ancient Celestial technology. Utilizing a Neural Induction implant, you wield mysterious Treasury Remnants to rewrite the rules of the battlefield.", features: [ { name: "Neural Induction", desc: "Genetically modified palms allow you to directly interface with alien tech." }, { name: "Remnant Wielder", desc: "Channel raw offensive and utility power through equipped Treasury Remnants." } ], subclasses: [ { name: "Savant", desc: "A reckless channeler of raw Celestial power.", features: [{ name: "Remnant Overload", desc: "Push a Remnant past its limits to double range/damage, taking force damage in return." }] }, { name: "Archivist", desc: "A tactical scholar who manipulates Remnant utility.", features: [{ name: "Field Manipulation", desc: "Alter gravity in a 15ft radius, slowing enemies." }] } ] },
  ranger: { name: "Ranger", hitDie: 8, avgHp: 5, saves: "Dexterity, Wisdom", role: "Awakened Beast Master", img: "/ranger.jpg", proficiencies: "Light Armor, Medium Armor, Simple Weapons, Martial Weapons, Rifles, Shotguns, Gear", desc: "A frontier survivalist partnered with an Awakened animal companion. Together, you scout hostile alien environments and execute coordinated tactical strikes.", features: [ { name: "Awakened Companion", desc: "Fight alongside a genetically uplifted, hyper-intelligent animal partner." }, { name: "Frontier Survivalist", desc: "Master of navigating, tracking, and surviving in hostile alien environments." } ], subclasses: [ { name: "Frontiersman", desc: "A master of the wild, excelling in long-range combat.", features: [{ name: "Dead-Eye", desc: "Ignore half and three-quarters cover when attacking with Rifles from afar." }] }, { name: "Pack Leader", desc: "Fights in perfect tandem with their Awakened companion.", features: [{ name: "Flanking Maneuver", desc: "Engaging the same target as your companion lets you score criticals on 19-20." }] } ] },
};

const SKILL_LIST: { name: string; stat: StatKey }[] = [
  { name: "Athletics", stat: "str" }, { name: "Acrobatics", stat: "dex" }, { name: "Piloting", stat: "dex" }, { name: "Stealth", stat: "dex" },
  { name: "Astronautics", stat: "int" }, { name: "Botany", stat: "int" }, { name: "Culture", stat: "int" }, { name: "Electronics", stat: "int" }, { name: "Genetics", stat: "int" }, { name: "History", stat: "int" }, { name: "Zoology", stat: "int" },
  { name: "Insight", stat: "wis" }, { name: "Mechanics", stat: "wis" }, { name: "Medicine", stat: "wis" }, { name: "Perception", stat: "wis" }, { name: "Streetwise", stat: "wis" },
  { name: "Deception", stat: "cha" }, { name: "Persuasion", stat: "cha" }
];

export default function ExodusCreator() {
  // Navigation & Modes
  const [activeTab, setActiveTab] = useState<"background" | "appearance" | "loadout" | "tech" | "asset">("background");
  const [viewMode, setViewMode] = useState<"player" | "gm">("player");
  const [isExporting, setIsExporting] = useState(false);
  
  // Auth & Cloud State
  const [user, setUser] = useState<any>(null);
  
  // ADD YOUR GOOGLE EMAIL HERE:
  const GM_EMAIL = "wbalvanz@gmail.com"; 
  const isGM = user?.email === GM_EMAIL;
  const [savedCharacters, setSavedCharacters] = useState<any[]>([]); // Player's own sheets
  const [allCampaignCharacters, setAllCampaignCharacters] = useState<any[]>([]); // GM View sheets
  const [currentCharacterId, setCurrentCharacterId] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState("");

  // Character State
  const [name, setName] = useState("");
  const [level, setLevel] = useState(1);
  const [origin, setOrigin] = useState("archeologist");
  const [charClass, setCharClass] = useState("cataphract");
  const [subclassIndex, setSubclassIndex] = useState(0);
  const [proficientSkills, setProficientSkills] = useState<string[]>([]);
  const [baseAge, setBaseAge] = useState(24);
  const [appearance, setAppearance] = useState({ gender: "", height: "", weight: "", eyes: "", hair: "", complexion: "" });
  const [physicalBuild, setPhysicalBuild] = useState("");

  const [inventory, setInventory] = useState<any[]>([ 
    { name: "Standard Issue Datapad", cost: 25 }, 
    { name: "Traveler Void Suit - Light", cost: 100 },
    { name: "Vanguard Autopistol", cost: 75, damage: "1d6 Kinetic", range: "40/120 ft.", notes: "Light" }
  ]);
  const [selectedCatalogItemStr, setSelectedCatalogItemStr] = useState(JSON.stringify(EQUIPMENT_CATALOG[0].items[0]));
  const [newCustomItemName, setNewCustomItemName] = useState("");
  const [newCustomItemCost, setNewCustomItemCost] = useState<number | "">("");
  
  // Tech & Extras State
  const [augments, setAugments] = useState(Array(4).fill({ name: "", slot: "", notes: "" }));
  const [remnants, setRemnants] = useState(Array(3).fill({ name: "", act: "", range: "", notes: "" }));
  
  // Class-Specific State
  const [mechChassis, setMechChassis] = useState<"Assault" | "Scout">("Assault");
  const [mechProfile, setMechProfile] = useState({ name: "", ac: "18", hp: "20", speed: "30 ft." });
  const [mechWeapons, setMechWeapons] = useState(Array(2).fill({ name: "", act: "", range: "", notes: "" }));
  const [companion, setCompanion] = useState({ name: "", species: "", ac: "", hp: "", speed: "", notes: "" });
  const [symbiont, setSymbiont] = useState({ strain: "", visual: "", energyMax: "", notes: "" });
  const [prodigyLoad, setProdigyLoad] = useState({ currentStrain: "0" });
  
  const [baseStats, setBaseStats] = useState<Record<StatKey, number>>({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 });

  // --- DERIVED CALCULATIONS ---
  const getMod = (score: number) => Math.floor((score - 10) / 2);
  const formatMod = (mod: number) => (mod >= 0 ? `+${mod}` : mod.toString());

  const stats: StatKey[] = ["str", "dex", "con", "int", "wis", "cha"];
  const statNamesMap: Record<StatKey, string> = { str: "Strength", dex: "Dexterity", con: "Constitution", int: "Intelligence", wis: "Wisdom", cha: "Charisma" };

  const currentOrigin = originData[origin];
  const currentClass = classData[charClass];
  const currentSubclass = currentClass.subclasses[subclassIndex] || currentClass.subclasses[0];

  const totalStats = {
    str: baseStats.str + currentOrigin.str, dex: baseStats.dex + currentOrigin.dex, con: baseStats.con + currentOrigin.con,
    int: baseStats.int + currentOrigin.int, wis: baseStats.wis + currentOrigin.wis, cha: baseStats.cha + currentOrigin.cha,
  };

  const modifiers = {
    str: getMod(totalStats.str), dex: getMod(totalStats.dex), con: getMod(totalStats.con),
    int: getMod(totalStats.int), wis: getMod(totalStats.wis), cha: getMod(totalStats.cha),
  };

  const profBonus = Math.ceil(level / 4) + 1;
  const baseHp = currentClass.hitDie + modifiers.con;
  const leveledHp = (level - 1) * (currentClass.avgHp + modifiers.con);
  const maxHp = baseHp + leveledHp;
  const armorClass = 10 + modifiers.dex;

  const biologicalAge = baseAge + ((level - 1) * 2);
  const chronologicalAge = baseAge + ((level - 1) * 45);

  const maxFunds = WEALTH_BY_LEVEL[level] || 500;
  const spentIC = inventory.reduce((total, item) => total + (item.cost || 0), 0);
  const availableFunds = maxFunds - spentIC;

  const parsedCatalogItem = JSON.parse(selectedCatalogItemStr || "{}");
  const canAffordCatalogItem = parsedCatalogItem.cost !== undefined && parsedCatalogItem.cost <= availableFunds;

  const skillsRemaining = MAX_SKILLS - proficientSkills.length;
  const isSkillCapReached = skillsRemaining === 0;

  const calculatedOverloadCap = Math.max(1, modifiers.int + profBonus);

  // Auto-Update Mech Stats based on Chassis & Level
  useEffect(() => {
    if (charClass === 'cataphract') {
      if (mechChassis === 'Assault') {
        setMechProfile(prev => ({ ...prev, ac: "18", hp: ((level * 10) + 10).toString(), speed: "30 ft." }));
      } else {
        setMechProfile(prev => ({ ...prev, ac: "15", hp: ((level * 8) + 8).toString(), speed: "50 ft." }));
      }
    }
  }, [mechChassis, level, charClass]);


  // --- SUPABASE AUTH & CLOUD SYNC ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCloudCharacters(session.user.id);
        fetchAllCampaignCharacters();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCloudCharacters(session.user.id);
        fetchAllCampaignCharacters();
      } else {
        setSavedCharacters([]);
        setAllCampaignCharacters([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentCharacterId(null);
  };

  // Fetch only the logged-in player's characters
  const fetchCloudCharacters = async (userId: string) => {
    const { data, error } = await supabase.from('characters').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
    if (!error) setSavedCharacters(data || []);
  };

  // Fetch ALL characters for the GM View (Bypasses RLS due to our new policy)
  const fetchAllCampaignCharacters = async () => {
    const { data, error } = await supabase.from('characters').select('*').order('updated_at', { ascending: false });
    if (!error) setAllCampaignCharacters(data || []);
  };

  const saveToCloud = async () => {
    if (!user) return alert("Please sign in with Google first!");
    setCloudStatus("Saving to Cloud...");
    
    // Add dynamically calculated armor and maxHP into the payload for the GM dashboard to easily read
    const characterPayload = {
      name, level, origin, charClass, subclassIndex, proficientSkills,
      baseAge, appearance, physicalBuild, inventory, augments, remnants,
      mechChassis, mechProfile, mechWeapons, companion, symbiont, prodigyLoad, baseStats,
      derivedStats: { maxHp, armorClass }
    };

    const payload: any = {
      user_id: user.id,
      name: name || "Unnamed Traveler",
      class: charClass,
      level: level,
      character_data: characterPayload
    };

    // If we have an ID, we UPSERT (Update) instead of creating a duplicate
    if (currentCharacterId) {
      payload.id = currentCharacterId;
    }

    const { data, error } = await supabase.from('characters').upsert([payload]).select();

    if (error) {
      console.error(error);
      setCloudStatus("Save failed.");
    } else {
      setCloudStatus("Successfully saved!");
      if (data && data.length > 0) setCurrentCharacterId(data[0].id); // Lock onto this ID for future saves
      fetchCloudCharacters(user.id);
      fetchAllCampaignCharacters();
      setTimeout(() => setCloudStatus(""), 3000);
    }
  };

  const createNewCharacter = () => {
    setCurrentCharacterId(null);
    setName("");
    setLevel(1);
    setCloudStatus("Started New Character");
    setTimeout(() => setCloudStatus(""), 3000);
  };

  const loadCloudCharacter = (charRecord: any) => {
    const d = charRecord.character_data;
    setCurrentCharacterId(charRecord.id); // Set the active ID so we overwrite it later
    setName(d.name || "");
    setLevel(d.level || 1);
    setOrigin(d.origin || "archeologist");
    setCharClass(d.charClass || "cataphract");
    setSubclassIndex(d.subclassIndex || 0);
    setProficientSkills(d.proficientSkills || []);
    setBaseAge(d.baseAge || 24);
    setAppearance(d.appearance || { gender: "", height: "", weight: "", eyes: "", hair: "", complexion: "" });
    setPhysicalBuild(d.physicalBuild || "");
    setInventory(d.inventory || []);
    setAugments(d.augments || Array(4).fill({ name: "", slot: "", notes: "" }));
    setRemnants(d.remnants || Array(3).fill({ name: "", act: "", range: "", notes: "" }));
    setMechChassis(d.mechChassis || "Assault");
    setMechProfile(d.mechProfile || { name: "", ac: "18", hp: "20", speed: "30 ft." });
    setMechWeapons(d.mechWeapons || Array(2).fill({ name: "", act: "", range: "", notes: "" }));
    setCompanion(d.companion || { name: "", species: "", ac: "", hp: "", speed: "", notes: "" });
    setSymbiont(d.symbiont || { strain: "", visual: "", energyMax: "", notes: "" });
    setProdigyLoad(d.prodigyLoad || { currentStrain: "0" });
    setBaseStats(d.baseStats || { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 });
    setCloudStatus(`Loaded "${d.name}"`);
    setTimeout(() => setCloudStatus(""), 3000);
  };

  const deleteCloudCharacter = async (id: string) => {
    if (!confirm("Are you sure you want to delete this character from the cloud?")) return;
    const { error } = await supabase.from('characters').delete().eq('id', id);
    if (!error) {
      if (currentCharacterId === id) setCurrentCharacterId(null);
      fetchCloudCharacters(user?.id);
      fetchAllCampaignCharacters();
    }
  };


  // --- HANDLERS ---
  const handleClassChange = (key: string) => { 
    setCharClass(key); 
    setSubclassIndex(0); 
    if (activeTab === 'asset') setActiveTab('asset');
  };
  
  const handleStatChange = (stat: StatKey, newValue: number) => {
    setBaseStats(prev => {
      const statToSwap = (Object.keys(prev) as StatKey[]).find(key => prev[key] === newValue);
      if (statToSwap && statToSwap !== stat) return { ...prev, [stat]: newValue, [statToSwap]: prev[stat] };
      return { ...prev, [stat]: newValue };
    });
  };

  const toggleSkill = (skillName: string) => {
    setProficientSkills(prev => {
      if (prev.includes(skillName)) return prev.filter(s => s !== skillName);
      if (prev.length < MAX_SKILLS) return [...prev, skillName];
      return prev;
    });
  };

  const handleAppearanceChange = (field: keyof typeof appearance, value: string) => { setAppearance(prev => ({ ...prev, [field]: value })); };
  const handleCompanionChange = (field: string, value: string) => { setCompanion(prev => ({ ...prev, [field]: value })); };
  const handleSymbiontChange = (field: string, value: string) => { setSymbiont(prev => ({ ...prev, [field]: value })); };
  const handleMechProfileChange = (field: string, value: string) => { setMechProfile(prev => ({ ...prev, [field]: value })); };

  const generateSymbiont = () => {
    const randomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const calculatedMaxEP = Math.max(1, modifiers.con + 2);
    setSymbiont({
      strain: randomItem(SYMBIONT_STRAINS),
      visual: randomItem(SYMBIONT_VISUALS),
      energyMax: calculatedMaxEP.toString(),
      notes: "Absorb physical damage to generate EP. Expend EP to fuel subclass abilities."
    });
  };

  const handleAugmentSelect = (index: number, value: string) => {
    setAugments(prev => {
      const newAugs = [...prev];
      if (value === 'custom') {
        newAugs[index] = { ...newAugs[index], name: 'Custom Augment' };
      } else {
        const found = AEGIS_CATALOG.find(a => a.name === value);
        if (found) {
          const isSlotTaken = prev.some((a, idx) => a.slot === found.slot && idx !== index);
          newAugs[index] = { name: found.name, slot: isSlotTaken ? '' : found.slot, notes: found.notes };
        } else {
          newAugs[index] = { name: '', slot: '', notes: '' };
        }
      }
      return newAugs;
    });
  };

  const handleAugmentFieldChange = (index: number, field: string, value: string) => {
    const newAugs = [...augments];
    newAugs[index] = { ...newAugs[index], [field]: value };
    setAugments(newAugs);
  };

  const handleRemnantSelect = (index: number, value: string) => {
    setRemnants(prev => {
      const newRems = [...prev];
      if (value === 'custom') newRems[index] = { ...newRems[index], name: 'Custom Remnant' };
      else {
        const found = REMNANTS.find(r => r.name === value);
        if (found) newRems[index] = { name: found.name, act: found.act, range: found.range, notes: found.notes };
        else newRems[index] = { name: '', act: '', range: '', notes: '' };
      }
      return newRems;
    });
  };

  const handleRemnantChange = (index: number, field: string, value: string) => {
    const newRems = [...remnants];
    newRems[index] = { ...newRems[index], [field]: value };
    setRemnants(newRems);
  };

  const handleMechWeaponSelect = (index: number, value: string) => {
    setMechWeapons(prev => {
      const newWeaps = [...prev];
      if (value === 'custom') newWeaps[index] = { ...newWeaps[index], name: 'Custom Weapon' };
      else {
        const found = MECH_WEAPONS.find(w => w.name === value);
        if (found) newWeaps[index] = { name: found.name, act: found.act, range: found.range, notes: found.notes };
        else newWeaps[index] = { name: '', act: '', range: '', notes: '' };
      }
      return newWeaps;
    });
  };

  const handleMechWeaponChange = (index: number, field: string, value: string) => {
    const newWeaps = [...mechWeapons];
    newWeaps[index] = { ...newWeaps[index], [field]: value };
    setMechWeapons(newWeaps);
  };

  const addCatalogItem = () => { 
    if (canAffordCatalogItem && parsedCatalogItem.name) {
      setInventory([...inventory, { ...parsedCatalogItem }]); 
    }
  };
  const addCustomItem = () => { 
    const cost = Number(newCustomItemCost) || 0; 
    if (newCustomItemName.trim() !== "" && cost <= availableFunds) { 
      setInventory([...inventory, { name: newCustomItemName.trim(), cost: cost }]); 
      setNewCustomItemName(""); setNewCustomItemCost(""); 
    } 
  };
  const removeItem = (indexToRemove: number) => { setInventory(inventory.filter((_, idx) => idx !== indexToRemove)); };

  const randomizeCosmetics = () => {
    const genders = ["Male", "Female", "Non-Binary", "Androgynous", "Fluid"];
    const eyes = ["Amber", "Ice Blue", "Deep Brown", "Steel Gray", "Emerald", "Hazel", "Violet", "Cyber-Gold", "Void Black"];
    const hairs = ["Jet Black", "Chestnut", "Ash Blonde", "Copper Red", "Stark White", "Silver", "Neon Blue", "Crimson", "Shaved"];
    const complexions = ["Fair", "Pale", "Olive", "Rich Tan", "Brown", "Dark Mahogany", "Obsidian", "Scarred", "Vitiligo"];
    const randomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    setAppearance({ gender: randomItem(genders), height: `${Math.floor(Math.random() * 2) + 5}'${Math.floor(Math.random() * 12)}"`, weight: `${Math.floor(Math.random() * 130) + 120} lbs`, eyes: randomItem(eyes), hair: randomItem(hairs), complexion: randomItem(complexions) });
  };

  const deriveBuildFromStats = () => {
    const highTraits: Record<string, string> = { str: "Heavily muscled with an imposing frame.", dex: "Lithe and wire-thin, moving with a fluid zero-G grace.", con: "Rugged and thick-skinned, bearing scars of the frontier.", int: "Sports visible neural-induction ports and cyber-links.", wis: "Carries the hyper-aware, thousand-yard stare of a veteran.", cha: "Striking and naturally magnetic with an impeccable presentation." };
    const lowTraits: Record<string, string> = { str: "Slender and lightly built, accustomed to low-G.", dex: "Stiff or deliberate in movement, relying heavily on armor.", con: "Pale or delicate, requiring frequent environmental aid.", int: "Lacks the typical tech-wear or cortical implants.", wis: "Restless and easily distracted with a naive expression.", cha: "Abrasive or intensely private, fading into the background." };
    let highestStat = "str"; let highestVal = 0; let lowestStat = "str"; let lowestVal = 30;
    for (const [key, val] of Object.entries(totalStats)) {
      if (val > highestVal) { highestVal = val; highestStat = key; }
      if (val < lowestVal) { lowestVal = val; lowestStat = key; }
    }
    setPhysicalBuild(highestStat === lowestStat ? "An average, well-balanced physical build." : `${highTraits[highestStat]} ${lowTraits[lowestStat]}`);
  };

  const formatOriginLabel = (key: string, data: any) => {
    const mods = [];
    if (data.str > 0) mods.push(`+${data.str} STR`);
    if (data.dex > 0) mods.push(`+${data.dex} DEX`);
    if (data.con > 0) mods.push(`+${data.con} CON`);
    if (data.int > 0) mods.push(`+${data.int} INT`);
    if (data.wis > 0) mods.push(`+${data.wis} WIS`);
    if (data.cha > 0) mods.push(`+${data.cha} CHA`);
    return `${data.name} (${mods.join(', ')})`;
  };

  const handleExportFillablePDF = async () => {
    try {
      setIsExporting(true);
      const existingPdfBytes = await fetch('/Exodus_Sheet_Template.pdf').then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();

      const safeSetText = (fieldName: string, text: string) => { try { const field = form.getTextField(fieldName); if (field) field.setText(text); } catch (e) { } };
      const safeCheck = (fieldName: string, isChecked: boolean) => { try { const field = form.getCheckBox(fieldName); if (field) { if (isChecked) field.check(); else field.uncheck(); } } catch (e) { } };

      safeSetText('Traveler Profile — NAME', name || "Unknown");
      safeSetText('Traveler Profile — ORIGIN', currentOrigin.name);
      safeSetText('Traveler Profile — CLASS', `${currentClass.name} (${currentSubclass.name})`);
      safeSetText('Traveler Profile — CONSTELLATION LEVEL', level.toString());
      safeSetText('Traveler Profile — AGE (Biological)', biologicalAge.toString());
      safeSetText('Traveler Profile — AGE (Yrs Since Birth)', chronologicalAge.toString());
      
      const appearanceStr = `Gender: ${appearance.gender || '-'} | Height: ${appearance.height || '-'} | Weight: ${appearance.weight || '-'}\nEyes: ${appearance.eyes || '-'} | Hair: ${appearance.hair || '-'} | Complexion: ${appearance.complexion || '-'}\nBuild: ${physicalBuild || 'Not documented.'}`;
      safeSetText('APPEARANCE', appearanceStr);

      safeSetText('Armor Class — CLASS', armorClass.toString());
      safeSetText('Hit Points — CURRENT', maxHp.toString());
      safeSetText('Hit Points — MAX (Temp Hit Points)', maxHp.toString());
      safeSetText('Hit Dice — MAX (Hit Dice)', `${level}d${currentClass.hitDie}`);
      
      safeSetText('PROFICIENCY BONUS', `+${profBonus}`);
      safeSetText('SPEED', "30 ft.");
      safeSetText('INITIATIVE', formatMod(modifiers.dex));
      safeSetText('PASSIVE PERCEPTION', (10 + modifiers.wis + (proficientSkills.includes("Perception") ? profBonus : 0)).toString());

      stats.forEach(stat => {
        const statProper = statNamesMap[stat];
        safeSetText(`${statProper} — SCORE`, totalStats[stat].toString());
        safeSetText(`${statProper} — MODIFIER`, formatMod(modifiers[stat]));
        const isSaveProf = currentClass.saves.toLowerCase().includes(statProper.toLowerCase());
        safeSetText(`${statProper} — SAVING THROW text`, formatMod(modifiers[stat] + (isSaveProf ? profBonus : 0)));
        safeCheck(`${statProper} — SAVING THROW`, isSaveProf);
      });

      SKILL_LIST.forEach(skill => {
        const statProper = statNamesMap[skill.stat];
        const isProf = proficientSkills.includes(skill.name);
        safeSetText(`${statProper} — ${skill.name.toUpperCase()} text`, formatMod(modifiers[skill.stat] + (isProf ? profBonus : 0)));
        safeCheck(`${statProper} — ${skill.name.toUpperCase()}`, isProf);
      });

      const profs = currentClass.proficiencies;
      safeCheck('Equipment Proficiencies — Armor — LIGHT', profs.includes('Light Armor'));
      safeCheck('Equipment Proficiencies — Armor — MEDIUM', profs.includes('Medium Armor'));
      safeCheck('Equipment Proficiencies — Armor — HEAVY', profs.includes('Heavy Armor'));
      safeCheck('Equipment Proficiencies — Armor — MECH', profs.includes('Mechs'));
      safeCheck('Equipment Proficiencies — Weapons — BLADES', profs.includes('Blades'));
      safeCheck('Equipment Proficiencies — Weapons — DRONES', profs.includes('Tech Drones'));
      safeCheck('Equipment Proficiencies — Weapons — EXPLOSIVES', profs.includes('Explosives'));
      safeCheck('Equipment Proficiencies — Weapons — HEAVY GUNS', profs.includes('Heavy Guns'));
      safeCheck('Equipment Proficiencies — Weapons — PISTOLS', profs.includes('Pistols'));
      safeCheck('Equipment Proficiencies — Weapons — RIFLES', profs.includes('Rifles'));
      safeCheck('Equipment Proficiencies — Weapons — SHOTGUNS', profs.includes('Shotguns'));

      safeSetText('IMPERIAL COIN (IC) 1', availableFunds.toString());
      safeSetText('EQUIPMENT', inventory.map(i => `${i.name} (${i.cost > 0 ? i.cost + ' IC' : 'Free'})`).join('\n'));
      safeSetText('Equipment Proficiencies — TOOLS + OTHER TRAINING', currentClass.proficiencies.replace(/, Gear|Remnants, /g, ""));
      
      const baseFeatures = currentClass.features.map((f: any) => `${f.name}:\n${f.desc}`).join('\n\n');
      const subFeatures = currentSubclass.features.map((f: any) => `${f.name}:\n${f.desc}`).join('\n\n');
      
      let classFeaturesText = `${baseFeatures}\n\n[${currentSubclass.name} Traits]\n${subFeatures}`;
      
      if (charClass === 'ranger' && companion.name) {
        classFeaturesText += `\n\n[Awakened Companion: ${companion.name}]\nSpecies: ${companion.species} | HP: ${companion.hp} | AC: ${companion.ac} | Spd: ${companion.speed}\nNotes: ${companion.notes}`;
      }
      if (charClass === 'daemon' && symbiont.strain) {
        classFeaturesText += `\n\n[Silicate Symbiont: ${symbiont.strain}]\nEnergy Cap: ${symbiont.energyMax} EP | Mutations: ${symbiont.visual}\nNotes: ${symbiont.notes}`;
      }
      if (charClass === 'prodigy') {
        classFeaturesText += `\n\n[Neural Induction Interface]\nOverload Threshold: ${calculatedOverloadCap} | Current Strain: ${prodigyLoad.currentStrain}`;
      }
      if (charClass === 'cataphract') {
        classFeaturesText += `\n\n[Mech Chassis: ${mechChassis}]\nWeapon Slots: ${mechChassis === 'Assault' ? '2' : '1'}`;
        if (mechProfile.name || mechProfile.ac || mechProfile.hp || mechProfile.speed) {
          classFeaturesText += `\nDesignation: ${mechProfile.name || 'Unnamed'} | HP: ${mechProfile.hp || '-'} | AC: ${mechProfile.ac || '-'} | Spd: ${mechProfile.speed || '-'}`;
        }
      }

      safeSetText('CLASS FEATURES — Column 1', classFeaturesText);
      safeSetText('BACKSTORY + PERSONALITY', currentOrigin.desc);

      augments.forEach((aug, i) => {
        safeSetText(`Aegis Augments — NAME ${i + 1}`, aug.name);
        safeSetText(`Aegis Augments — SLOT ${i + 1}`, aug.slot);
        safeSetText(`Aegis Augments — NOTES ${i + 1}`, aug.notes);
      });

      remnants.forEach((rem, i) => {
        safeSetText(`Treasury Remnants — LEVEL ${i + 1}`, level.toString());
        safeSetText(`Treasury Remnants — NAME ${i + 1}`, rem.name);
        safeSetText(`Treasury Remnants — ACTIVATION TIME ${i + 1}`, rem.act);
        safeSetText(`Treasury Remnants — RANGE ${i + 1}`, rem.range);
        safeSetText(`Treasury Remnants — NOTES ${i + 1}`, rem.notes);
      });

      const weaponsToExport: {name: string, damage: string, notes: string}[] = [];

      if (charClass === 'cataphract') {
        const allowedSlots = mechChassis === 'Assault' ? 2 : 1;
        mechWeapons.slice(0, allowedSlots).forEach(weap => {
          if (weap.name) {
            weaponsToExport.push({
              name: weap.name,
              damage: weap.notes, 
              notes: `Range: ${weap.range} | Act: ${weap.act}`
            });
          }
        });
      }

      inventory.forEach(item => {
        if (item.damage) { 
          weaponsToExport.push({
            name: item.name,
            damage: item.damage,
            notes: `Range: ${item.range || 'Melee'} | ${item.notes || ''}`
          });
        }
      });

      weaponsToExport.slice(0, 4).forEach((weap, i) => {
        safeSetText(`Weapons + Attacks — NAME ${i + 1}`, weap.name);
        safeSetText(`Weapons + Attacks — DAMAGE & TYPE ${i + 1}`, weap.damage);
        safeSetText(`Weapons + Attacks — NOTES ${i + 1}`, weap.notes);
      });

      form.flatten();
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `EXODUS_Sheet_${name || "Traveler"}.pdf`;
      link.click();
      
      setIsExporting(false);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Error exporting PDF. Ensure Exodus_Sheet_Template.pdf is in the public folder.");
      setIsExporting(false);
    }
  };

  // --- RENDER UI ---
  return (
    <div className="min-h-screen text-slate-200 font-sans print:bg-white print:text-black" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2000&auto=format&fit=crop')" }}>
      <div className="print:hidden p-4 md:p-8 max-w-7xl mx-auto bg-black/70 backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.15)] overflow-hidden flex flex-col min-h-[800px]">
        
        {/* TOP HEADER: Title & Cloud Auth */}
        <div className="border-b border-cyan-500/50 pb-4 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-widest uppercase">
              EXODUS
            </h1>
            <p className="text-cyan-200/70 text-sm tracking-widest uppercase mt-1">Traveler Database Interface</p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3">
          {/* View Mode Toggle */}
            {user && isGM && (
              <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                <button 
                  onClick={() => setViewMode("player")} 
                  className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition-colors ${viewMode === 'player' ? 'bg-cyan-600 text-black' : 'text-slate-400 hover:text-white'}`}
                >
                  Character Creator
                </button>
                <button 
                  onClick={() => setViewMode("gm")} 
                  className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition-colors ${viewMode === 'gm' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  GM Dashboard
                </button>
              </div>
            )}

            {/* Cloud Auth & Sync Bar */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700 p-2 rounded-lg text-xs">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400 font-bold truncate max-w-[120px] hidden sm:block">{user.email}</span>
                  {viewMode === "player" && (
                    <>
                      <button onClick={createNewCharacter} className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-3 py-1.5 rounded transition-colors uppercase">New</button>
                      <button onClick={saveToCloud} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-3 py-1.5 rounded uppercase transition-colors flex items-center gap-2">
                        {currentCharacterId ? "Update Cloud" : "Save to Cloud"}
                      </button>
                    </>
                  )}
                  <button onClick={logout} className="text-slate-400 hover:text-red-400 font-bold">Logout</button>
                </div>
              ) : (
                <button onClick={loginWithGoogle} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-3 py-1.5 rounded uppercase transition-colors flex items-center gap-1">
                  Sign In with Google to Save
                </button>
              )}
            </div>
          </div>
        </div>

        {cloudStatus && (
          <div className="bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-xs px-3 py-1.5 rounded text-center font-bold animate-pulse mb-4">
            {cloudStatus}
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* GM DASHBOARD VIEW */}
        {/* --------------------------------------------------------- */}
        {viewMode === "gm" && user ? (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-end border-b border-purple-500/50 pb-2">
              <h2 className="text-xl font-bold text-purple-400 uppercase tracking-widest">Active Campaign Roster</h2>
              <button onClick={fetchAllCampaignCharacters} className="text-xs bg-purple-900/40 text-purple-300 px-3 py-1 rounded border border-purple-700/50 hover:bg-purple-800/60">Refresh Data</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allCampaignCharacters.length === 0 ? (
                <p className="text-slate-500 italic">No characters found in the database.</p>
              ) : (
                allCampaignCharacters.map((char) => {
                  const d = char.character_data;
                  return (
                    <div key={char.id} className="bg-slate-900/80 border border-purple-500/30 rounded-lg p-4 shadow-lg relative overflow-hidden flex flex-col gap-3">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
                      
                      <div className="flex justify-between items-start border-b border-slate-700/50 pb-2">
                        <div>
                          <h3 className="text-lg font-black text-white uppercase">{d.name || "Unnamed"}</h3>
                          <p className="text-xs text-purple-400 uppercase tracking-wider">{d.charClass} — Lvl {d.level}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center mt-2">
                        <div className="bg-black/50 rounded p-2 border border-slate-700">
                          <span className="block text-[9px] text-slate-500 uppercase">Max HP</span>
                          <span className="text-xl font-bold text-white">{d.derivedStats?.maxHp || '-'}</span>
                        </div>
                        <div className="bg-black/50 rounded p-2 border border-slate-700">
                          <span className="block text-[9px] text-slate-500 uppercase">Armor Class</span>
                          <span className="text-xl font-bold text-cyan-400">{d.derivedStats?.armorClass || '-'}</span>
                        </div>
                        <div className="bg-black/50 rounded p-2 border border-slate-700">
                          <span className="block text-[9px] text-slate-500 uppercase">Speed</span>
                          <span className="text-lg font-bold text-slate-300">30 ft</span>
                        </div>
                      </div>

                      {d.charClass === 'cataphract' && d.mechProfile && (
                        <div className="mt-2 bg-cyan-900/20 p-2 rounded border border-cyan-800/30 text-xs">
                          <span className="text-cyan-500 font-bold uppercase block mb-1">Mech: {d.mechProfile.name || "Unnamed"}</span>
                          <div className="flex justify-between text-slate-300">
                            <span>HP: {d.mechProfile.hp}</span>
                            <span>AC: {d.mechProfile.ac}</span>
                            <span>Spd: {d.mechProfile.speed}</span>
                          </div>
                        </div>
                      )}
                      
                      {d.charClass === 'ranger' && d.companion && d.companion.name && (
                        <div className="mt-2 bg-green-900/20 p-2 rounded border border-green-800/30 text-xs">
                          <span className="text-green-500 font-bold uppercase block mb-1">Companion: {d.companion.name}</span>
                          <div className="flex justify-between text-slate-300">
                            <span>HP: {d.companion.hp}</span>
                            <span>AC: {d.companion.ac}</span>
                            <span>Spd: {d.companion.speed}</span>
                          </div>
                        </div>
                      )}

                      <div className="mt-auto pt-2 flex justify-between items-center text-[10px] text-slate-600">
                        <span>Updated: {new Date(char.updated_at).toLocaleDateString()}</span>
                        {/* Only allow loading/deleting if it's THEIR character */}
                        {char.user_id === user.id && (
                          <div className="flex gap-2">
                            <button onClick={() => { loadCloudCharacter(char); setViewMode('player'); }} className="text-cyan-500 hover:text-cyan-400 font-bold uppercase">Edit</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* --------------------------------------------------------- */
          /* PLAYER VIEW (Character Creator) */
          /* --------------------------------------------------------- */
          <div className="flex flex-col lg:flex-row flex-1 w-full animate-in fade-in duration-300">
            {/* LEFT COLUMN: Data Entry & Stats */}
            <div className="w-full lg:w-7/12 pr-0 lg:pr-10 lg:border-r border-cyan-500/30 flex flex-col gap-6 relative">
              
              {/* CLOUD SAVED ROSTER (Player's Own Characters) */}
              {user && savedCharacters.length > 0 && (
                <div className="bg-slate-900/60 border border-slate-800 p-3 rounded text-xs space-y-2 mb-2">
                  <span className="text-cyan-500 font-bold uppercase tracking-wider block">Your Saved Characters</span>
                  <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                    {savedCharacters.map((char) => (
                      <div key={char.id} className="flex justify-between items-center bg-black/40 p-1.5 rounded border border-slate-700/50">
                        <span className="text-white font-bold">{char.name || "Unnamed"} <span className="text-slate-400 font-normal">({char.class} - Lvl {char.level})</span></span>
                        <div className="flex gap-3">
                          <button onClick={() => loadCloudCharacter(char)} className="text-cyan-400 hover:underline font-bold uppercase text-[10px]">Load</button>
                          <button onClick={() => deleteCloudCharacter(char.id)} className="text-red-400 hover:underline font-bold uppercase text-[10px]">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 sm:gap-4 border-b border-slate-700 pb-1">
                <button onClick={() => setActiveTab("background")} className={`uppercase tracking-wider font-bold text-[9px] sm:text-xs transition-colors px-1 ${activeTab === "background" ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-cyan-200'}`}>1. Origin</button>
                <button onClick={() => setActiveTab("appearance")} className={`uppercase tracking-wider font-bold text-[9px] sm:text-xs transition-colors px-1 ${activeTab === "appearance" ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-cyan-200'}`}>2. Details</button>
                <button onClick={() => setActiveTab("loadout")} className={`uppercase tracking-wider font-bold text-[9px] sm:text-xs transition-colors px-1 ${activeTab === "loadout" ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-cyan-200'}`}>3. Loadout</button>
                <button onClick={() => setActiveTab("tech")} className={`uppercase tracking-wider font-bold text-[9px] sm:text-xs transition-colors px-1 ${activeTab === "tech" ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-cyan-200'}`}>4. Tech</button>
                <button onClick={() => setActiveTab("asset")} className={`uppercase tracking-wider font-bold text-[9px] sm:text-xs transition-colors px-1 ${activeTab === "asset" ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-cyan-200'}`}>5. Class Asset</button>
              </div>

              {/* TAB 1: BACKGROUND */}
              {activeTab === "background" && (
                <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-cyan-400 font-bold border-b border-slate-700 pb-2">I. IDENTITY</h3>
                      <div><label className="block text-xs uppercase text-slate-400 mb-1">Designation</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-900/80 border border-slate-700 rounded p-2 text-white focus:border-cyan-400 focus:outline-none" placeholder="Enter name..." /></div>
                      <div><label className="block text-xs uppercase text-slate-400 mb-1">Constellation Level</label><input type="number" min="1" max="10" value={level} onChange={e => setLevel(Number(e.target.value))} className="w-full bg-slate-900/80 border border-slate-700 rounded p-2 text-white focus:border-cyan-400 focus:outline-none" /></div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-cyan-400 font-bold border-b border-slate-700 pb-2">II. BACKGROUND</h3>
                      <div className="flex flex-col"><label className="block text-xs uppercase text-slate-400 mb-1">Origin Path</label>
                        <select value={origin} onChange={e => setOrigin(e.target.value)} className="w-full bg-slate-900/80 border border-slate-700 rounded p-2 text-white focus:border-cyan-400 focus:outline-none">
                          {Object.entries(originData).map(([key, data]) => (
                            <option key={key} value={key}>{formatOriginLabel(key, data)}</option>
                          ))}
                        </select>
                        <div className="mt-2 p-3 bg-slate-800/50 border-l-2 border-cyan-500 rounded-r text-xs text-slate-300">{currentOrigin.desc}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-700 pb-2">
                      <h3 className="text-cyan-400 font-bold">III. GENETIC ATTRIBUTES</h3><span className="text-[10px] text-slate-500 tracking-wider">STANDARD ARRAY ACTIVE</span>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {stats.map(stat => (
                        <div key={stat} className="bg-slate-900/80 border border-slate-700 rounded p-2 text-center shadow-inner">
                          <label className="block text-xs uppercase text-cyan-500 font-bold mb-2">{stat}</label>
                          <select value={baseStats[stat]} onChange={e => handleStatChange(stat, Number(e.target.value))} className="w-full bg-black border border-slate-600 rounded p-1 text-center text-cyan-400 font-bold mb-2 focus:border-cyan-400 outline-none text-lg cursor-pointer">
                            {STANDARD_ARRAY.map(val => <option key={val} value={val}>{val}</option>)}
                          </select>
                          <div className="text-2xl font-black text-white">{totalStats[stat]}</div><div className="text-xs text-slate-400 font-bold mt-1">MOD: {formatMod(modifiers[stat])}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: APPEARANCE */}
              {activeTab === "appearance" && (
                <div className="flex flex-col gap-8 animate-in fade-in duration-300 h-full">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-700 pb-2"><h3 className="text-cyan-400 font-bold">IV. TIME DILATION & AGE</h3></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div className="bg-slate-900/80 border border-slate-700 rounded p-4 text-center"><label className="block text-[10px] uppercase text-slate-400 font-bold mb-2">Departure Age</label><input type="number" min="16" max="60" value={baseAge} onChange={e => setBaseAge(Number(e.target.value))} className="w-full bg-black border border-slate-600 rounded p-2 text-center text-white font-bold focus:border-cyan-400 outline-none text-xl" /></div>
                      <div className="bg-cyan-900/20 border border-cyan-800/50 rounded p-4 flex flex-col justify-center"><label className="block text-[10px] uppercase text-cyan-500 font-bold mb-1">Biological Age</label><div className="text-3xl font-black text-cyan-400">{biologicalAge}</div></div>
                      <div className="bg-purple-900/20 border border-purple-800/50 rounded p-4 flex flex-col justify-center"><label className="block text-[10px] uppercase text-purple-500 font-bold mb-1">Years Since Birth</label><div className="text-3xl font-black text-purple-400">{chronologicalAge}</div></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-700 pb-2">
                      <h3 className="text-cyan-400 font-bold">V. PHYSICAL APPEARANCE</h3>
                      <div className="flex gap-2">
                        <button onClick={randomizeCosmetics} className="text-[10px] font-bold tracking-wider px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors uppercase border border-slate-600">Randomize Cosmetics</button>
                        <button onClick={deriveBuildFromStats} className="text-[10px] font-bold tracking-wider px-3 py-1 rounded bg-cyan-900/50 text-cyan-400 hover:bg-cyan-800 transition-colors uppercase border border-cyan-700/50">Derive Build from Stats</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[{ label: "Gender", key: "gender" }, { label: "Height", key: "height" }, { label: "Weight", key: "weight" }, { label: "Eye Color", key: "eyes" }, { label: "Hair Color", key: "hair" }, { label: "Complexion", key: "complexion" }].map((field) => (
                        <div key={field.key}><label className="block text-[10px] uppercase text-slate-400 mb-1">{field.label}</label><input type="text" value={appearance[field.key as keyof typeof appearance]} onChange={e => handleAppearanceChange(field.key as keyof typeof appearance, e.target.value)} className="w-full bg-slate-900/80 border border-slate-700 rounded p-2 text-white focus:border-cyan-400 text-sm" /></div>
                      ))}
                    </div>
                    <div className="pt-2"><label className="block text-[10px] uppercase text-cyan-500 font-bold mb-1 pl-1">Physical Build & Traits</label><textarea value={physicalBuild} onChange={e => setPhysicalBuild(e.target.value)} className="w-full h-20 bg-slate-900/80 border border-slate-700 rounded p-2 text-white focus:border-cyan-400 text-sm resize-none" placeholder="Click 'Derive Build from Stats'..." /></div>
                  </div>
                </div>
              )}

              {/* TAB 3: LOADOUT */}
              {activeTab === "loadout" && (
                <div className="flex flex-col gap-8 animate-in fade-in duration-300 h-full">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-700 pb-2">
                      <h3 className="text-cyan-400 font-bold">VI. SKILL MATRIX</h3>
                      <span className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded ${isSkillCapReached ? 'bg-cyan-900/50 text-cyan-400' : 'bg-red-900/30 text-red-400'}`}>{isSkillCapReached ? "MAXIMUM SKILLS" : `${skillsRemaining} MORE REQUIRED`}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 max-h-[220px] overflow-y-auto">
                      {SKILL_LIST.map(skill => {
                        const isProficient = proficientSkills.includes(skill.name);
                        const totalSkillMod = modifiers[skill.stat] + (isProficient ? profBonus : 0);
                        return (
                          <label key={skill.name} className={`flex items-center p-2 rounded transition-all border border-transparent ${!isProficient && isSkillCapReached ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-800/50 cursor-pointer hover:border-slate-700'}`}>
                            <input type="checkbox" checked={isProficient} onChange={() => toggleSkill(skill.name)} disabled={!isProficient && isSkillCapReached} className="mr-3 w-4 h-4 accent-cyan-500 bg-slate-900 border-slate-600 rounded disabled:opacity-50" />
                            <span className="w-8 font-black text-white text-right mr-2">{formatMod(totalSkillMod)}</span>
                            <span className={`text-sm ${isProficient ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>{skill.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-4 flex flex-col flex-1">
                    <div className="flex justify-between items-end border-b border-slate-700 pb-2"><h3 className="text-cyan-400 font-bold">VII. INVENTORY & GEAR</h3><span className={`text-xs font-bold tracking-wider px-2 py-1 rounded ${availableFunds < 0 ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}>FUNDS: {availableFunds.toLocaleString()} IC</span></div>
                    <div className="flex gap-2">
                      <select value={selectedCatalogItemStr} onChange={(e) => setSelectedCatalogItemStr(e.target.value)} className="flex-1 bg-slate-900/80 border border-slate-700 rounded p-2 text-white focus:border-cyan-400 text-xs">
                        {EQUIPMENT_CATALOG.map((category, idx) => (
                          <optgroup key={idx} label={category.category} className="bg-slate-800 text-cyan-400 font-bold">
                            {category.items.map((item, i) => {
                              const isTrained = item.tags.some(tag => currentClass.proficiencies.includes(tag));
                              return (<option key={i} value={JSON.stringify(item)} className={isTrained ? 'text-green-400' : 'text-slate-400'}>{isTrained ? '✔ ' : '⚠ '} {item.name} {item.cost > 0 ? `(${item.cost} IC)` : '(Free)'}</option>);
                            })}
                          </optgroup>
                        ))}
                      </select>
                      <button onClick={addCatalogItem} disabled={!canAffordCatalogItem} className={`rounded px-4 py-2 font-bold uppercase text-[10px] ${canAffordCatalogItem ? 'bg-cyan-900 text-cyan-400' : 'bg-red-900/30 text-red-500/50'}`}>Buy</button>
                    </div>
                    <ul className="space-y-2 flex-1 max-h-[175px] overflow-y-auto pr-2 mt-2">
                      {inventory.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-center bg-slate-800/50 p-2 rounded border border-slate-700/50 group">
                          <div><span className="text-sm text-slate-300 block">{item.name}</span><span className="text-[10px] text-cyan-600 font-bold">{item.cost > 0 ? `${item.cost} IC` : '0 IC'}</span></div>
                          <button onClick={() => removeItem(idx)} className="text-slate-500 hover:text-red-400 font-bold text-lg px-2 opacity-50 group-hover:opacity-100">×</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 4: TECH */}
              {activeTab === "tech" && (
                <div className="flex flex-col gap-8 animate-in fade-in duration-300 h-full overflow-y-auto pr-2 pb-4">
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-700 pb-2"><h3 className="text-cyan-400 font-bold">VIII. AEGIS AUGMENTS</h3><span className="text-[10px] text-slate-400">CYBERNETICS & BIO-TECH</span></div>
                    <div className="space-y-3">
                      {augments.map((aug, i) => (
                        <div key={i} className="flex gap-2 bg-slate-900/50 p-3 rounded border border-slate-700/50">
                          <div className="flex flex-col gap-2 w-1/3">
                            <select 
                              value={AEGIS_CATALOG.find(a => a.name === aug.name) ? aug.name : (aug.name ? 'custom' : '')} 
                              onChange={(e) => handleAugmentSelect(i, e.target.value)}
                              className="bg-black border border-slate-700 rounded p-1 text-[11px] text-white focus:outline-none"
                            >
                              <option value="">-- Catalog --</option>
                              {AEGIS_CATALOG.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                              <option value="custom">Custom...</option>
                            </select>
                            <input type="text" value={aug.name} onChange={e => handleAugmentFieldChange(i, 'name', e.target.value)} placeholder="Augment Name..." className="bg-transparent border-b border-slate-700 text-sm text-cyan-300 focus:outline-none" />
                          </div>
                          <div className="flex flex-col gap-2 w-2/3">
                            <select 
                              value={aug.slot} 
                              onChange={e => handleAugmentFieldChange(i, 'slot', e.target.value)}
                              className="bg-black border border-slate-700 rounded p-1 text-[11px] text-slate-400 focus:outline-none"
                            >
                              <option value="">-- Select Slot --</option>
                              {BODY_SLOTS.map(slotOption => {
                                const isTaken = augments.some((a, idx) => a.slot === slotOption && idx !== i);
                                return (
                                  <option key={slotOption} value={slotOption} disabled={isTaken}>
                                    {slotOption} {isTaken ? "(In Use)" : ""}
                                  </option>
                                );
                              })}
                            </select>
                            <input type="text" value={aug.notes} onChange={e => handleAugmentFieldChange(i, 'notes', e.target.value)} placeholder="Effect Notes..." className="bg-transparent border-b border-slate-700 text-xs text-slate-300 focus:outline-none" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* REMNANT BLOCK */}
                  {charClass !== 'prodigy' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-end border-b border-slate-700 pb-2">
                        <h3 className="text-cyan-400 font-bold">IX. TREASURY REMNANTS</h3>
                        <span className="text-[10px] text-slate-400">CELESTIAL ARTIFACTS</span>
                      </div>
                      
                      {charClass === 'cataphract' && (
                        <p className="text-xs text-slate-400 italic mb-2 leading-tight">
                          *Note: As a Cataphract, your 'Traveler's Treasury' feature allows you to permanently install Enhancement Remnants into your exosuit chassis, using your Wisdom modifier for rolls.
                        </p>
                      )}

                      <div className="space-y-3">
                        {remnants.map((rem, i) => (
                          <div key={i} className="flex gap-2 bg-slate-900/50 p-3 rounded border border-slate-700/50">
                            <div className="flex flex-col gap-2 w-1/3 justify-between">
                              <select 
                                value={REMNANTS.find(r => r.name === rem.name) ? rem.name : (rem.name ? 'custom' : '')} 
                                onChange={(e) => handleRemnantSelect(i, e.target.value)}
                                className="bg-black border border-slate-700 rounded p-1 text-[11px] text-white focus:outline-none"
                              >
                                <option value="">-- Catalog --</option>
                                {REMNANTS.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                                <option value="custom">Custom...</option>
                              </select>
                              <input type="text" value={rem.name} onChange={e => handleRemnantChange(i, 'name', e.target.value)} placeholder="Remnant Name..." className="bg-transparent border-b border-slate-700 text-sm text-purple-400 focus:outline-none" />
                            </div>
                            <div className="flex flex-col gap-2 w-1/6 justify-between mt-auto">
                              <label className="text-[9px] text-slate-500 uppercase">Action</label>
                              <input type="text" value={rem.act} onChange={e => handleRemnantChange(i, 'act', e.target.value)} className="bg-transparent border-b border-slate-700 text-xs text-slate-300 focus:outline-none" placeholder="e.g. 1 Act" />
                            </div>
                            <div className="flex flex-col gap-2 w-1/6 justify-between mt-auto">
                              <label className="text-[9px] text-slate-500 uppercase">Range</label>
                              <input type="text" value={rem.range} onChange={e => handleRemnantChange(i, 'range', e.target.value)} className="bg-transparent border-b border-slate-700 text-xs text-slate-300 focus:outline-none" placeholder="e.g. 60ft" />
                            </div>
                            <div className="flex flex-col gap-2 w-2/6 justify-between mt-auto">
                              <label className="text-[9px] text-slate-500 uppercase">Notes</label>
                              <input type="text" value={rem.notes} onChange={e => handleRemnantChange(i, 'notes', e.target.value)} className="bg-transparent border-b border-slate-700 text-xs text-slate-300 focus:outline-none" placeholder="Effect..." />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: CLASS ASSET (DYNAMIC) */}
              {activeTab === "asset" && (
                <div className="flex flex-col gap-8 animate-in fade-in duration-300 h-full overflow-y-auto pr-2 pb-4">
                  
                  {charClass === 'cataphract' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-end border-b border-slate-700 pb-2">
                        <h3 className="text-cyan-400 font-bold">MECH HANGAR & WEAPONS</h3>
                        <span className="text-[10px] text-slate-400">EXOSUIT LOADOUT</span>
                      </div>
                      
                      {/* MECH CHASSIS SELECTION */}
                      <div className="bg-cyan-900/20 border border-cyan-800/50 rounded p-3 mb-3 flex items-center justify-between">
                        <div>
                          <h4 className="text-cyan-400 font-bold text-xs uppercase">Chassis Type</h4>
                          <p className="text-[10px] text-cyan-600/80">Assault (2 Weapons) or Scout (1 Weapon, 2 Remnants at Lvl 5).</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setMechChassis('Assault')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all border ${mechChassis === 'Assault' ? 'bg-cyan-600/20 border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.2)]' : 'bg-black/40 border-slate-700 text-slate-500 hover:text-slate-300'}`}>Assault</button>
                          <button onClick={() => setMechChassis('Scout')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all border ${mechChassis === 'Scout' ? 'bg-cyan-600/20 border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.2)]' : 'bg-black/40 border-slate-700 text-slate-500 hover:text-slate-300'}`}>Scout</button>
                        </div>
                      </div>

                      {/* MECH COMBAT PROFILE */}
                      <div className="flex flex-col gap-4 bg-slate-900/50 p-4 rounded border border-slate-700/50">
                        <div className="flex flex-col w-full">
                          <label className="text-[10px] text-slate-500 uppercase mb-1">Mech Designation / Name</label>
                          <input type="text" value={mechProfile.name} onChange={e => handleMechProfileChange('name', e.target.value)} className="bg-transparent border-b border-slate-700 text-lg font-bold text-cyan-400 focus:outline-none placeholder-slate-600" placeholder="e.g. BT-7274..." />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex flex-col w-1/3">
                            <label className="text-[10px] text-slate-500 uppercase mb-1">Armor Class</label>
                            <input type="number" value={mechProfile.ac} onChange={e => handleMechProfileChange('ac', e.target.value)} className="bg-black border border-slate-700 rounded p-2 text-center text-white focus:outline-none" placeholder="AC" />
                          </div>
                          <div className="flex flex-col w-1/3">
                            <label className="text-[10px] text-slate-500 uppercase mb-1 flex justify-between">Hit Points <span className="text-[8px] text-cyan-600 normal-case">(Auto-scales)</span></label>
                            <input type="number" value={mechProfile.hp} onChange={e => handleMechProfileChange('hp', e.target.value)} className="bg-black border border-slate-700 rounded p-2 text-center text-white focus:outline-none" placeholder="HP" />
                          </div>
                          <div className="flex flex-col w-1/3">
                            <label className="text-[10px] text-slate-500 uppercase mb-1">Speed</label>
                            <input type="text" value={mechProfile.speed} onChange={e => handleMechProfileChange('speed', e.target.value)} className="bg-black border border-slate-700 rounded p-2 text-center text-white focus:outline-none" placeholder="e.g. 40ft" />
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 italic mb-2 leading-tight mt-2">
                        *Note: Install your Mech's heavy weapons below. {mechChassis === 'Assault' ? 'Assault chassis allows 2 weapons.' : 'Scout chassis allows 1 weapon. (Use the Tech tab for your Remnants).'}
                      </p>

                      <div className="space-y-3">
                        {mechWeapons.slice(0, mechChassis === 'Assault' ? 2 : 1).map((weap, i) => (
                          <div key={i} className="flex gap-2 bg-slate-900/50 p-3 rounded border border-slate-700/50">
                            <div className="flex flex-col gap-2 w-1/3 justify-between">
                              <select value={MECH_WEAPONS.find(w => w.name === weap.name) ? weap.name : (weap.name ? 'custom' : '')} onChange={(e) => handleMechWeaponSelect(i, e.target.value)} className="bg-black border border-slate-700 rounded p-1 text-[11px] text-white focus:outline-none">
                                <option value="">-- Catalog --</option>
                                {MECH_WEAPONS.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
                                <option value="custom">Custom...</option>
                              </select>
                              <input type="text" value={weap.name} onChange={e => handleMechWeaponChange(i, 'name', e.target.value)} placeholder="Weapon Name..." className="bg-transparent border-b border-slate-700 text-sm text-cyan-400 focus:outline-none" />
                            </div>
                            <div className="flex flex-col gap-2 w-1/6 justify-between mt-auto">
                              <label className="text-[9px] text-slate-500 uppercase">Action</label>
                              <input type="text" value={weap.act} onChange={e => handleMechWeaponChange(i, 'act', e.target.value)} className="bg-transparent border-b border-slate-700 text-xs text-slate-300 focus:outline-none" placeholder="e.g. 1 Act" />
                            </div>
                            <div className="flex flex-col gap-2 w-1/6 justify-between mt-auto">
                              <label className="text-[9px] text-slate-500 uppercase">Range</label>
                              <input type="text" value={weap.range} onChange={e => handleMechWeaponChange(i, 'range', e.target.value)} className="bg-transparent border-b border-slate-700 text-xs text-slate-300 focus:outline-none" placeholder="e.g. 120ft" />
                            </div>
                            <div className="flex flex-col gap-2 w-2/6 justify-between mt-auto">
                              <label className="text-[9px] text-slate-500 uppercase">Heat / Damage</label>
                              <input type="text" value={weap.notes} onChange={e => handleMechWeaponChange(i, 'notes', e.target.value)} className="bg-transparent border-b border-slate-700 text-xs text-slate-300 focus:outline-none" placeholder="e.g. 3 Heat / 4d6 dmg" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {charClass === 'ranger' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-end border-b border-slate-700 pb-2">
                        <h3 className="text-cyan-400 font-bold">AWAKENED COMPANION</h3>
                        <span className="text-[10px] text-slate-400">TRANSHUMAN ANIMAL PARTNER</span>
                      </div>
                      <p className="text-xs text-slate-400 italic mb-2 leading-tight">
                        *Note: Your Awakened companion is a hyper-intelligent, genetically uplifted partner. They understand language, possess distinct cultures, and fight alongside you as an equal.
                      </p>
                      <div className="flex flex-col gap-4 bg-slate-900/50 p-4 rounded border border-slate-700/50">
                        <div className="flex gap-4">
                          <div className="flex flex-col w-1/2">
                            <label className="text-[10px] text-slate-500 uppercase mb-1">Companion Name</label>
                            <input type="text" value={companion.name} onChange={e => handleCompanionChange('name', e.target.value)} className="bg-transparent border-b border-slate-700 text-lg font-bold text-green-400 focus:outline-none placeholder-slate-600" placeholder="Enter name..." />
                          </div>
                          <div className="flex flex-col w-1/2">
                            <label className="text-[10px] text-slate-500 uppercase mb-1">Species</label>
                            <div className="flex gap-2">
                              <select value={COMPANION_SPECIES.includes(companion.species) ? companion.species : (companion.species ? 'custom' : '')} onChange={(e) => handleCompanionChange('species', e.target.value === 'custom' ? 'Custom' : e.target.value)} className="bg-black border border-slate-700 rounded p-2 text-xs text-white focus:outline-none w-1/2">
                                <option value="">-- Select --</option>
                                {COMPANION_SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
                                <option value="custom">Other...</option>
                              </select>
                              <input type="text" value={companion.species} onChange={e => handleCompanionChange('species', e.target.value)} className="bg-transparent border-b border-slate-700 text-sm text-slate-300 focus:outline-none w-1/2" placeholder="Species..." />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex flex-col w-1/4"><label className="text-[10px] text-slate-500 uppercase mb-1">Armor Class</label><input type="number" value={companion.ac} onChange={e => handleCompanionChange('ac', e.target.value)} className="bg-black border border-slate-700 rounded p-2 text-center text-white focus:outline-none" placeholder="AC" /></div>
                          <div className="flex flex-col w-1/4"><label className="text-[10px] text-slate-500 uppercase mb-1">Hit Points</label><input type="number" value={companion.hp} onChange={e => handleCompanionChange('hp', e.target.value)} className="bg-black border border-slate-700 rounded p-2 text-center text-white focus:outline-none" placeholder="HP" /></div>
                          <div className="flex flex-col w-1/4"><label className="text-[10px] text-slate-500 uppercase mb-1">Speed</label><input type="text" value={companion.speed} onChange={e => handleCompanionChange('speed', e.target.value)} className="bg-black border border-slate-700 rounded p-2 text-center text-white focus:outline-none" placeholder="e.g. 40ft" /></div>
                        </div>
                        <div className="flex flex-col mt-2">
                          <label className="text-[10px] text-slate-500 uppercase mb-1">Attacks & Special Traits</label>
                          <textarea value={companion.notes} onChange={e => handleCompanionChange('notes', e.target.value)} className="w-full h-16 bg-black border border-slate-700 rounded p-2 text-white focus:border-cyan-400 text-sm resize-none" placeholder="Bite: +5 to hit (1d6+3 piercing)..." />
                        </div>
                      </div>
                    </div>
                  )}

                  {charClass === 'daemon' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-end border-b border-slate-700 pb-2">
                        <h3 className="text-cyan-400 font-bold">SILICATE SYMBIONT</h3>
                        <div className="flex gap-2 items-center">
                          <span className="text-[10px] text-slate-400 mr-2">BIOLOGICAL PARASITE</span>
                          <button onClick={generateSymbiont} className="text-[10px] font-bold tracking-wider px-3 py-1 rounded bg-red-900/40 text-red-400 hover:bg-red-800/60 transition-colors uppercase border border-red-700/50 shadow-[0_0_10px_rgba(255,0,0,0.1)]">
                            Generate Mutation
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 italic mb-2 leading-tight">
                        *Note: You are bonded with a bio-mineral alien Silicate. Log its strain, your physical mutations, and track the Kinetic Energy Points (EP) you generate by taking damage.
                      </p>
                      <div className="flex flex-col gap-4 bg-slate-900/50 p-4 rounded border border-slate-700/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                        <div className="flex gap-4 relative z-10">
                          <div className="flex flex-col w-1/2">
                            <label className="text-[10px] text-slate-500 uppercase mb-1">Symbiont Strain</label>
                            <input type="text" value={symbiont.strain} onChange={e => handleSymbiontChange('strain', e.target.value)} className="bg-transparent border-b border-slate-700 text-lg font-bold text-red-400 focus:outline-none placeholder-slate-600" placeholder="e.g. The Crimson Weave..." />
                          </div>
                          <div className="flex flex-col w-1/2">
                            <label className="text-[10px] text-slate-500 uppercase mb-1 flex justify-between">
                              Max Energy Capacity (EP)
                              <span className="text-[8px] text-slate-600 normal-case">(Base: CON Mod + 2)</span>
                            </label>
                            <input type="number" value={symbiont.energyMax} onChange={e => handleSymbiontChange('energyMax', e.target.value)} className="w-full bg-black border border-slate-700 rounded p-2 text-center text-white focus:outline-none" placeholder="Max EP" />
                          </div>
                        </div>
                        <div className="flex flex-col relative z-10">
                          <label className="text-[10px] text-slate-500 uppercase mb-1">Visual Alterations / Mutations</label>
                          <input type="text" value={symbiont.visual} onChange={e => handleSymbiontChange('visual', e.target.value)} className="bg-transparent border-b border-slate-700 text-sm text-slate-300 focus:outline-none" placeholder="e.g. Translucent skin, glowing red veins..." />
                        </div>
                        <div className="flex flex-col mt-2 relative z-10">
                          <label className="text-[10px] text-slate-500 uppercase mb-1">Resonance Notes & Abilities</label>
                          <textarea value={symbiont.notes} onChange={e => handleSymbiontChange('notes', e.target.value)} className="w-full h-16 bg-black border border-slate-700 rounded p-2 text-white focus:border-red-400 text-sm resize-none" placeholder="Takes 1 point of kinetic damage to generate 1 EP..." />
                        </div>
                      </div>
                    </div>
                  )}

                  {charClass === 'prodigy' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-end border-b border-slate-700 pb-2">
                        <h3 className="text-cyan-400 font-bold">NEURAL INDUCTION & REMNANTS</h3>
                        <span className="text-[10px] text-slate-400">CELESTIAL ARTIFACTS</span>
                      </div>
                      
                      <div className="bg-cyan-900/20 border border-cyan-800/50 rounded p-3 mb-3 flex items-center justify-between">
                        <div>
                          <h4 className="text-cyan-400 font-bold text-xs uppercase">Neural Induction Load</h4>
                          <p className="text-[10px] text-cyan-600/80">Track the mental strain of channeling Celestial tech.</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center">
                            <label className="text-[8px] uppercase text-cyan-500 font-bold mb-1">Current Strain</label>
                            <input type="number" value={prodigyLoad.currentStrain} onChange={e => setProdigyLoad({...prodigyLoad, currentStrain: e.target.value})} className="w-12 bg-black border border-cyan-700 rounded text-center text-white focus:outline-none text-sm p-1" />
                          </div>
                          <div className="flex flex-col items-center">
                            <label className="text-[8px] uppercase text-cyan-500 font-bold mb-1 text-center">Max Overload Cap<br/><span className="text-[6px] text-slate-500 normal-case">(INT Mod + Prof)</span></label>
                            <div className="w-12 bg-cyan-950 border border-cyan-700 rounded text-center text-cyan-300 font-bold text-sm p-1 cursor-not-allowed">
                              {calculatedOverloadCap}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {remnants.map((rem, i) => (
                          <div key={i} className="flex gap-2 bg-slate-900/50 p-3 rounded border border-slate-700/50">
                            <div className="flex flex-col gap-2 w-1/3 justify-between">
                              <select value={REMNANTS.find(r => r.name === rem.name) ? rem.name : (rem.name ? 'custom' : '')} onChange={(e) => handleRemnantSelect(i, e.target.value)} className="bg-black border border-slate-700 rounded p-1 text-[11px] text-white focus:outline-none">
                                <option value="">-- Catalog --</option>
                                {REMNANTS.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                                <option value="custom">Custom...</option>
                              </select>
                              <input type="text" value={rem.name} onChange={e => handleRemnantChange(i, 'name', e.target.value)} placeholder="Remnant Name..." className="bg-transparent border-b border-slate-700 text-sm text-purple-400 focus:outline-none" />
                            </div>
                            <div className="flex flex-col gap-2 w-1/6 justify-between mt-auto">
                              <label className="text-[9px] text-slate-500 uppercase">Action</label>
                              <input type="text" value={rem.act} onChange={e => handleRemnantChange(i, 'act', e.target.value)} className="bg-transparent border-b border-slate-700 text-xs text-slate-300 focus:outline-none" placeholder="e.g. 1 Act" />
                            </div>
                            <div className="flex flex-col gap-2 w-1/6 justify-between mt-auto">
                              <label className="text-[9px] text-slate-500 uppercase">Range</label>
                              <input type="text" value={rem.range} onChange={e => handleRemnantChange(i, 'range', e.target.value)} className="bg-transparent border-b border-slate-700 text-xs text-slate-300 focus:outline-none" placeholder="e.g. 60ft" />
                            </div>
                            <div className="flex flex-col gap-2 w-2/6 justify-between mt-auto">
                              <label className="text-[9px] text-slate-500 uppercase">Notes</label>
                              <input type="text" value={rem.notes} onChange={e => handleRemnantChange(i, 'notes', e.target.value)} className="bg-transparent border-b border-slate-700 text-xs text-slate-300 focus:outline-none" placeholder="Effect..." />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Visuals & Stats (Hidden in GM Mode) */}
            <div className="w-full lg:w-5/12 flex flex-col bg-black/40">
              <div className="h-72 lg:h-80 w-full bg-cover bg-center border-b border-cyan-500/30 relative" style={{ backgroundImage: `url(${currentClass.img})` }}>
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/10 to-black/80 z-0"></div>
                <div className="absolute top-4 left-6 z-10 max-w-sm pr-4">
                  <h2 className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-lg leading-none">{currentClass.name}</h2>
                  <p className="text-cyan-400 uppercase tracking-widest text-sm drop-shadow-md mb-2">{currentClass.role}</p>
                  <p className="text-slate-200 text-xs drop-shadow-md leading-relaxed hidden sm:block">{currentClass.desc}</p>
                </div>
                <div className="absolute bottom-4 left-4 right-4 z-10 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(classData).map(([key, data]) => {
                    const isActive = charClass === key;
                    return (
                      <button key={key} onClick={() => handleClassChange(key)} className={`py-2 px-1 uppercase font-bold text-[10px] tracking-wider rounded transition-all backdrop-blur-sm border ${ isActive ? 'bg-cyan-600/80 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.5)]' : 'bg-black/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white' }`}>
                        {data.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 md:p-8 flex-1 flex flex-col gap-6">
                <div>
                  <h3 className="text-cyan-400 font-bold border-b border-slate-700 pb-2 mb-4">COMBAT TELEMETRY</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-slate-900/80 rounded-lg p-3 border border-cyan-900"><div className="text-slate-400 text-[10px] uppercase mb-1">Max HP</div><div className="text-3xl font-black text-white">{maxHp}</div><div className="text-slate-500 text-[9px] mt-1">Hit Die: d{currentClass.hitDie}</div></div>
                    <div className="bg-slate-900/80 rounded-lg p-3 border border-cyan-900"><div className="text-slate-400 text-[10px] uppercase mb-1">Armor Class</div><div className="text-3xl font-black text-cyan-400">{armorClass}</div><div className="text-slate-500 text-[9px] mt-1">Base + DEX</div></div>
                    <div className="bg-slate-900/80 rounded-lg p-3 border border-cyan-900"><div className="text-slate-400 text-[10px] uppercase mb-1">Proficiency</div><div className="text-3xl font-black text-white">+{profBonus}</div><div className="text-slate-500 text-[9px] mt-1">Lvl {level}</div></div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-end border-b border-slate-700 pb-2 mb-4"><h3 className="text-cyan-400 font-bold">CLASS LOADOUT</h3></div>
                  <div className="bg-slate-900/60 rounded p-4 border border-slate-800 space-y-4 flex-1">
                    <div>
                      <span className="text-cyan-500 font-bold uppercase text-xs tracking-wider block mb-2">Subclass Paradigm</span>
                      <div className="flex gap-2 mb-2">
                        {currentClass.subclasses.map((sc: any, idx: number) => (
                          <button key={idx} onClick={() => setSubclassIndex(idx)} className={`flex-1 py-1.5 px-2 rounded text-[10px] font-bold uppercase transition-all border ${ subclassIndex === idx ? 'bg-cyan-600/20 border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.2)]' : 'bg-black/40 border-slate-700 text-slate-500 hover:text-slate-300' }`}>
                            {sc.name}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 italic mb-4">{currentSubclass.desc}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700/50">
                      <div><span className="text-cyan-500 font-bold uppercase text-xs tracking-wider block mb-1">Saving Throws</span><p className="text-sm text-white">{currentClass.saves}</p></div>
                      <div><span className="text-cyan-500 font-bold uppercase text-xs tracking-wider block mb-1">Proficiencies</span><p className="text-xs text-slate-300 leading-tight">{currentClass.proficiencies.replace(/, Gear|Remnants, /g, "")}</p></div>
                    </div>
                    <div className="pt-2 border-t border-slate-700/50">
                      <span className="text-cyan-500 font-bold uppercase text-xs tracking-wider block mb-2">Level 1 Features</span>
                      <ul className="space-y-3">
                        {currentClass.features.map((feature: any, idx: number) => (
                          <li key={`base-${idx}`} className="text-sm"><strong className="text-white block">{feature.name}</strong><span className="text-slate-400 text-xs">{feature.desc}</span></li>
                        ))}
                        {currentSubclass.features.map((feature: any, idx: number) => (
                          <li key={`sub-${idx}`} className="text-sm"><strong className="text-cyan-300 block">{feature.name} <span className="text-[10px] text-cyan-700 uppercase">({currentSubclass.name})</span></strong><span className="text-slate-400 text-xs">{feature.desc}</span></li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 flex gap-2">
                  <button onClick={handleExportFillablePDF} disabled={isExporting || !isSkillCapReached} className={`w-full font-black uppercase tracking-widest py-3 rounded transition-all text-sm ${ isSkillCapReached && !isExporting ? 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' }`}>
                    {isExporting ? "Compiling PDF..." : !isSkillCapReached ? `Select ${skillsRemaining} More Skill${skillsRemaining !== 1 ? 's' : ''} to Export` : "Export Official Character Sheet"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}