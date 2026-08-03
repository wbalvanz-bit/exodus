"use client";
import React, { useState } from "react";
import { PDFDocument } from 'pdf-lib';

// --- EXODUS GAME DATA ---
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const MAX_SKILLS = 4;
const WEALTH_BY_LEVEL = [0, 500, 1000, 2500, 5000, 10000, 18000, 30000, 50000, 75000, 120000];

// --- EQUIPMENT CATALOG ---
const EQUIPMENT_CATALOG = [
  { category: "Standard Weapons", items: [ { name: "Vanguard Autopistol", cost: 75, tags: ["Pistols", "Simple Weapons"] }, { name: "Scrap-built Shotgun", cost: 50, tags: ["Shotguns", "Simple Weapons"] }, { name: "Assault Rifle", cost: 150, tags: ["Rifles", "Martial Weapons"] }, { name: "Heavy Scattergun", cost: 200, tags: ["Heavy Guns"] }, { name: "Sniper Rifle", cost: 250, tags: ["Rifles", "Martial Weapons"] }, { name: "Thermal Blade", cost: 100, tags: ["Blades", "Martial Weapons"] } ] },
  { category: "Armor & Defense", items: [ { name: "Traveler Void Suit - Light", cost: 100, tags: ["Light Armor"] }, { name: "Combat Carapace - Medium", cost: 250, tags: ["Medium Armor"] }, { name: "Cataphract Chassis - Heavy", cost: 1000, tags: ["Heavy Armor", "Mechs"] }, { name: "Deflector Shield Generator", cost: 300, tags: ["Gear"] } ] },
  { category: "Field Gear & Tools", items: [ { name: "Standard Issue Datapad", cost: 25, tags: ["Gear"] }, { name: "Ration Packs (x5)", cost: 10, tags: ["Gear"] }, { name: "Trauma Med-Kit", cost: 50, tags: ["Gear"] }, { name: "Breaching Explosives", cost: 75, tags: ["Gear"] }, { name: "Recon Drone", cost: 150, tags: ["Tech Drones"] }, { name: "Hacking Spikes", cost: 100, tags: ["Gear"] } ] },
  { category: "Treasury Remnants", items: [ { name: "Remnant: Phase Shifter", cost: 0, tags: ["Remnants"] }, { name: "Remnant: Kinetic Barrier", cost: 0, tags: ["Remnants"] }, { name: "Remnant: Neural Uplink", cost: 0, tags: ["Remnants"] } ] }
];

const originData: Record<string, any> = {
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
  cataphract: { name: "Cataphract", hitDie: 6, avgHp: 4, saves: "Wisdom, Constitution", role: "Heavy Mech Pilot", img: "/cataphract.jpg", proficiencies: "Light Armor, Medium Armor, Heavy Armor, Mechs, Simple Weapons, Martial Weapons, Heavy Guns, Gear", desc: "Elite mechanized warriors bonded to heavy exo-suits. You are the ultimate frontline defender, managing heat levels while laying down devastating weapons fire.", features: [ { name: "Mechanized Chassis Bond", desc: "You are permanently bonded to a specialized combat mech suit." }, { name: "Heat Management", desc: "Your abilities generate Heat Points (HP). Exceeding dissipation thresholds risks system failure." } ] },
  daemon: { name: "Daemon", hitDie: 10, avgHp: 6, saves: "Dexterity, Strength", role: "Silicate Symbiont", img: "/daemon.jpg", proficiencies: "Light Armor, Medium Armor, Simple Weapons, Martial Weapons, Blades, Pistols, Gear", desc: "A lethal cybernetic skirmisher bonded with a Silicate symbiont. You absorb kinetic impacts to fuel movement, always balancing on the edge of a violent Shadow frenzy.", features: [ { name: "Silicate Symbiosis", desc: "An alien bio-tech parasite enhances your speed, durability, and aggression." }, { name: "Kinetic Absorption", desc: "Take physical damage to generate Energy Points, fueling rapid movement and strikes." } ] },
  prodigy: { name: "Prodigy", hitDie: 8, avgHp: 5, saves: "Intelligence, Charisma", role: "Remnant Wielder", img: "/prodigy.jpg", proficiencies: "Light Armor, Simple Weapons, Pistols, Tech Drones, Remnants, Gear", desc: "A master of ancient Celestial technology. Utilizing a Neural Induction implant, you wield mysterious Treasury Remnants to rewrite the rules of the battlefield.", features: [ { name: "Neural Induction", desc: "Genetically modified palms allow you to directly interface with alien tech." }, { name: "Remnant Wielder", desc: "Channel raw offensive and utility power through equipped Treasury Remnants." } ] },
  ranger: { name: "Ranger", hitDie: 8, avgHp: 5, saves: "Dexterity, Wisdom", role: "Awakened Beast Master", img: "/ranger.jpg", proficiencies: "Light Armor, Medium Armor, Simple Weapons, Martial Weapons, Rifles, Shotguns, Gear", desc: "A frontier survivalist partnered with an Awakened animal companion. Together, you scout hostile alien environments and execute coordinated tactical strikes.", features: [ { name: "Awakened Companion", desc: "Fight alongside a genetically uplifted, hyper-intelligent animal partner." }, { name: "Frontier Survivalist", desc: "Master of navigating, tracking, and surviving in hostile alien environments." } ] },
};

type StatKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

const SKILL_LIST: { name: string; stat: StatKey }[] = [
  { name: "Athletics", stat: "str" }, { name: "Acrobatics", stat: "dex" }, { name: "Piloting", stat: "dex" }, { name: "Stealth", stat: "dex" },
  { name: "Astronautics", stat: "int" }, { name: "Botany", stat: "int" }, { name: "Culture", stat: "int" }, { name: "Electronics", stat: "int" }, { name: "Genetics", stat: "int" }, { name: "History", stat: "int" }, { name: "Zoology", stat: "int" },
  { name: "Insight", stat: "wis" }, { name: "Mechanics", stat: "wis" }, { name: "Medicine", stat: "wis" }, { name: "Perception", stat: "wis" }, { name: "Streetwise", stat: "wis" },
  { name: "Deception", stat: "cha" }, { name: "Persuasion", stat: "cha" }
];

export default function ExodusCreator() {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState<"background" | "appearance" | "loadout">("background");
  const [isExporting, setIsExporting] = useState(false);
  
  // Basic Info
  const [name, setName] = useState("");
  const [level, setLevel] = useState(1);
  const [origin, setOrigin] = useState("archeologist");
  const [charClass, setCharClass] = useState("cataphract");
  const [proficientSkills, setProficientSkills] = useState<string[]>([]);
  
  // Appearance & Lore State
  const [baseAge, setBaseAge] = useState(24);
  const [appearance, setAppearance] = useState({
    gender: "", height: "", weight: "", eyes: "", hair: "", complexion: ""
  });
  const [physicalBuild, setPhysicalBuild] = useState("");

  // Inventory State
  const [inventory, setInventory] = useState<{name: string, cost: number}[]>([ { name: "Standard Issue Datapad", cost: 25 }, { name: "Traveler Void Suit - Light", cost: 100 } ]);
  const [selectedCatalogItemStr, setSelectedCatalogItemStr] = useState(JSON.stringify(EQUIPMENT_CATALOG[0].items[0]));
  const [newCustomItemName, setNewCustomItemName] = useState("");
  const [newCustomItemCost, setNewCustomItemCost] = useState<number | "">("");
  
  const [baseStats, setBaseStats] = useState<Record<StatKey, number>>({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 });

  // --- DERIVED STAT & ECONOMY CALCULATIONS ---
  const getMod = (score: number) => Math.floor((score - 10) / 2);
  const formatMod = (mod: number) => (mod >= 0 ? `+${mod}` : mod.toString());

  const stats: StatKey[] = ["str", "dex", "con", "int", "wis", "cha"];
  const statNamesMap: Record<StatKey, string> = { str: "Strength", dex: "Dexterity", con: "Constitution", int: "Intelligence", wis: "Wisdom", cha: "Charisma" };

  const currentOrigin = originData[origin];
  const currentClass = classData[charClass];

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

  // Time Dilation Age Calculations
  const biologicalAge = baseAge + ((level - 1) * 2);
  const chronologicalAge = baseAge + ((level - 1) * 45);

  const maxFunds = WEALTH_BY_LEVEL[level] || 500;
  const spentIC = inventory.reduce((total, item) => total + (item.cost || 0), 0);
  const availableFunds = maxFunds - spentIC;

  const parsedCatalogItem = JSON.parse(selectedCatalogItemStr || "{}");
  const canAffordCatalogItem = parsedCatalogItem.cost !== undefined && parsedCatalogItem.cost <= availableFunds;

  const skillsRemaining = MAX_SKILLS - proficientSkills.length;
  const isSkillCapReached = skillsRemaining === 0;

  // --- HANDLERS ---
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

  const handleAppearanceChange = (field: keyof typeof appearance, value: string) => {
    setAppearance(prev => ({ ...prev, [field]: value }));
  };

  const randomizeCosmetics = () => {
    const genders = ["Male", "Female", "Non-Binary", "Androgynous", "Fluid"];
    const eyes = ["Amber", "Ice Blue", "Deep Brown", "Steel Gray", "Emerald", "Hazel", "Violet", "Cyber-Gold", "Void Black"];
    const hairs = ["Jet Black", "Chestnut", "Ash Blonde", "Copper Red", "Stark White", "Silver", "Neon Blue", "Crimson", "Shaved"];
    const complexions = ["Fair", "Pale", "Olive", "Rich Tan", "Brown", "Dark Mahogany", "Obsidian", "Scarred", "Vitiligo"];
    
    const randomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const ft = Math.floor(Math.random() * 2) + 5;
    const inc = Math.floor(Math.random() * 12);
    const wt = Math.floor(Math.random() * 130) + 120;

    setAppearance({
      gender: randomItem(genders),
      height: `${ft}'${inc}"`,
      weight: `${wt} lbs`,
      eyes: randomItem(eyes),
      hair: randomItem(hairs),
      complexion: randomItem(complexions)
    });
  };

  const deriveBuildFromStats = () => {
    const highTraits: Record<string, string> = {
      str: "Heavily muscled with an imposing frame, showing clear signs of high-G conditioning.",
      dex: "Lithe and wire-thin, moving with a fluid zero-G grace and sharp reflexes.",
      con: "Rugged, scarred, and thick-skinned. Bears the physical marks of surviving harsh frontier worlds.",
      int: "Eyes constantly dart as if reading a HUD. Sports visible neural-induction ports.",
      wis: "Carries the hyper-aware, thousand-yard stare of a veteran traveler who has survived the unknown.",
      cha: "Striking and naturally magnetic. Carries themselves with a confident swagger and impeccable off-world presentation."
    };
    
    const lowTraits: Record<string, string> = {
      str: "Slender and lightly built, lacking physical bulk. Accustomed to controlled low-G environments.",
      dex: "Stiff or deliberate in movement, relying heavily on armor rather than natural agility.",
      con: "Pale or delicate, looking as though they require environmental suits to handle atmospheric shifts.",
      int: "Lacks the typical tech-wear or cortical implants common among mechanics.",
      wis: "Restless and easily distracted, with an unweathered, somewhat naive expression regarding danger.",
      cha: "Abrasive or intensely private. Tends to fade into the background with an unassuming demeanor."
    };

    let highestStat = "str"; let highestVal = 0;
    let lowestStat = "str"; let lowestVal = 30;

    for (const [key, val] of Object.entries(totalStats)) {
      if (val > highestVal) { highestVal = val; highestStat = key; }
      if (val < lowestVal) { lowestVal = val; lowestStat = key; }
    }

    if (highestStat === lowestStat) {
      setPhysicalBuild("An average, well-balanced physical build.");
    } else {
      setPhysicalBuild(`${highTraits[highestStat]} ${lowTraits[lowestStat]}`);
    }
  };

  const addCatalogItem = () => {
    if (canAffordCatalogItem && parsedCatalogItem.name) {
      setInventory([...inventory, { name: parsedCatalogItem.name, cost: parsedCatalogItem.cost }]);
    }
  };

  const addCustomItem = () => {
    const cost = Number(newCustomItemCost) || 0;
    if (newCustomItemName.trim() !== "" && cost <= availableFunds) {
      setInventory([...inventory, { name: newCustomItemName.trim(), cost: cost }]);
      setNewCustomItemName(""); setNewCustomItemCost("");
    }
  };

  const removeItem = (indexToRemove: number) => {
    setInventory(inventory.filter((_, idx) => idx !== indexToRemove));
  };

  // --- PDF EXPORT FUNCTION ---
  const handleExportFillablePDF = async () => {
    try {
      setIsExporting(true);
      const existingPdfBytes = await fetch('/Exodus_Sheet_Template.pdf').then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();

      const safeSetText = (fieldName: string, text: string) => {
        try { const field = form.getTextField(fieldName); if (field) field.setText(text); } 
        catch (e) { console.warn(`Could not map text field: ${fieldName}`); }
      };

      const safeCheck = (fieldName: string, isChecked: boolean) => {
        try { const field = form.getCheckBox(fieldName); if (field) { if (isChecked) field.check(); else field.uncheck(); } } 
        catch (e) { console.warn(`Could not map checkbox: ${fieldName}`); }
      };

      // 1. Identity & Vitals
      safeSetText('Traveler Profile — NAME', name || "Unknown");
      safeSetText('Traveler Profile — ORIGIN', currentOrigin.name);
      safeSetText('Traveler Profile — CLASS', currentClass.name);
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
      
      const passivePerception = 10 + modifiers.wis + (proficientSkills.includes("Perception") ? profBonus : 0);
      safeSetText('PASSIVE PERCEPTION', passivePerception.toString());

      // 2. Attributes & Saving Throws
      stats.forEach(stat => {
        const statProper = statNamesMap[stat];
        safeSetText(`${statProper} — SCORE`, totalStats[stat].toString());
        safeSetText(`${statProper} — MODIFIER`, formatMod(modifiers[stat]));
        
        const isSaveProf = currentClass.saves.toLowerCase().includes(statProper.toLowerCase());
        const saveMod = modifiers[stat] + (isSaveProf ? profBonus : 0);
        
        safeSetText(`${statProper} — SAVING THROW text`, formatMod(saveMod));
        safeCheck(`${statProper} — SAVING THROW`, isSaveProf);
      });

      // 3. Skills
      SKILL_LIST.forEach(skill => {
        const statProper = statNamesMap[skill.stat];
        const isProf = proficientSkills.includes(skill.name);
        const skillMod = modifiers[skill.stat] + (isProf ? profBonus : 0);
        
        safeSetText(`${statProper} — ${skill.name.toUpperCase()} text`, formatMod(skillMod));
        safeCheck(`${statProper} — ${skill.name.toUpperCase()}`, isProf);
      });

      // 4. Equipment Proficiencies
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

      // 5. Equipment, Features & Lore
      safeSetText('IMPERIAL COIN (IC) 1', availableFunds.toString());
      safeSetText('EQUIPMENT', inventory.map(i => `${i.name} (${i.cost > 0 ? i.cost + ' IC' : 'Free'})`).join('\n'));
      
      safeSetText('Equipment Proficiencies — TOOLS + OTHER TRAINING', currentClass.proficiencies.replace(/, Gear|Remnants, /g, ""));
      safeSetText('CLASS FEATURES — Column 1', currentClass.features.map((f: any) => `${f.name}:\n${f.desc}`).join('\n\n'));
      safeSetText('BACKSTORY + PERSONALITY', currentOrigin.desc);

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
    <div 
      className="min-h-screen text-slate-200 font-sans print:bg-white print:text-black"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2000&auto=format&fit=crop')" }}
    >
      <div className="print:hidden p-4 md:p-8 max-w-7xl mx-auto bg-black/70 backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.15)] overflow-hidden flex flex-col lg:flex-row min-h-[800px]">
        
        {/* LEFT COLUMN: Data Entry & Stats */}
        <div className="w-full lg:w-7/12 p-6 md:p-10 lg:border-r border-cyan-500/30 flex flex-col gap-6 relative">
          
          <div className="border-b border-cyan-500/50 pb-4">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-widest uppercase">
              EXODUS
            </h1>
            <p className="text-cyan-200/70 text-sm tracking-widest uppercase mt-1">Traveler Database Interface</p>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex gap-4 border-b border-slate-700">
            <button 
              onClick={() => setActiveTab("background")} 
              className={`pb-2 uppercase tracking-wider font-bold text-xs sm:text-sm transition-colors ${activeTab === "background" ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-cyan-200'}`}
            >
              1. Origin
            </button>
            <button 
              onClick={() => setActiveTab("appearance")} 
              className={`pb-2 uppercase tracking-wider font-bold text-xs sm:text-sm transition-colors ${activeTab === "appearance" ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-cyan-200'}`}
            >
              2. Details
            </button>
            <button 
              onClick={() => setActiveTab("loadout")} 
              className={`pb-2 uppercase tracking-wider font-bold text-xs sm:text-sm transition-colors ${activeTab === "loadout" ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-cyan-200'}`}
            >
              3. Loadout
            </button>
          </div>

          {/* TAB 1: BACKGROUND & STATS */}
          {activeTab === "background" && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-cyan-400 font-bold border-b border-slate-700 pb-2">I. IDENTITY</h3>
                  <div>
                    <label className="block text-xs uppercase text-slate-400 mb-1">Designation</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-900/80 border border-slate-700 rounded p-2 text-white focus:border-cyan-400 focus:outline-none" placeholder="Enter name..." />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-slate-400 mb-1">Constellation Level</label>
                    <input type="number" min="1" max="10" value={level} onChange={e => setLevel(Number(e.target.value))} className="w-full bg-slate-900/80 border border-slate-700 rounded p-2 text-white focus:border-cyan-400 focus:outline-none" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-cyan-400 font-bold border-b border-slate-700 pb-2">II. BACKGROUND</h3>
                  <div className="flex flex-col">
                    <label className="block text-xs uppercase text-slate-400 mb-1">Origin Path</label>
                    <select value={origin} onChange={e => setOrigin(e.target.value)} className="w-full bg-slate-900/80 border border-slate-700 rounded p-2 text-white focus:border-cyan-400 focus:outline-none">
                      {Object.entries(originData).map(([key, data]) => (
                        <option key={key} value={key}>{data.name} (+{Object.values(data).filter(v => typeof v === 'number' && v > 0).join(', +')})</option>
                      ))}
                    </select>
                    <div className="mt-2 p-3 bg-slate-800/50 border-l-2 border-cyan-500 rounded-r text-xs text-slate-300">
                      {currentOrigin.desc}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-slate-700 pb-2">
                  <h3 className="text-cyan-400 font-bold">III. GENETIC ATTRIBUTES</h3>
                  <span className="text-[10px] text-slate-500 tracking-wider">STANDARD ARRAY ACTIVE</span>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {stats.map(stat => (
                    <div key={stat} className="bg-slate-900/80 border border-slate-700 rounded p-2 text-center shadow-inner">
                      <label className="block text-xs uppercase text-cyan-500 font-bold mb-2">{stat}</label>
                      <select 
                        value={baseStats[stat]} 
                        onChange={e => handleStatChange(stat, Number(e.target.value))} 
                        className="w-full bg-black border border-slate-600 rounded p-1 text-center text-cyan-400 font-bold mb-2 focus:border-cyan-400 outline-none text-lg cursor-pointer"
                      >
                        {STANDARD_ARRAY.map(val => <option key={val} value={val}>{val}</option>)}
                      </select>
                      <div className="text-2xl font-black text-white">{totalStats[stat]}</div>
                      <div className="text-xs text-slate-400 font-bold mt-1">MOD: {formatMod(modifiers[stat])}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPEARANCE & LORE */}
          {activeTab === "appearance" && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300 h-full">
              
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-slate-700 pb-2">
                  <h3 className="text-cyan-400 font-bold">IV. TIME DILATION & AGE</h3>
                </div>
                <p className="text-xs text-slate-400 italic mb-4">
                  Travelers spend decades in cryosleep moving between stars. While only a short time passes for you, the universe continues to age around you.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-900/80 border border-slate-700 rounded p-4 text-center">
                    <label className="block text-[10px] uppercase text-slate-400 font-bold mb-2">Base Departure Age</label>
                    <input 
                      type="number" min="16" max="60" value={baseAge} 
                      onChange={e => setBaseAge(Number(e.target.value))} 
                      className="w-full bg-black border border-slate-600 rounded p-2 text-center text-white font-bold focus:border-cyan-400 outline-none text-xl"
                    />
                  </div>
                  
                  <div className="bg-cyan-900/20 border border-cyan-800/50 rounded p-4 text-center flex flex-col justify-center">
                    <label className="block text-[10px] uppercase text-cyan-500 font-bold mb-1">Biological Age</label>
                    <div className="text-3xl font-black text-cyan-400">{biologicalAge}</div>
                    <div className="text-[9px] text-cyan-600 uppercase mt-1">Subjective Years</div>
                  </div>

                  <div className="bg-purple-900/20 border border-purple-800/50 rounded p-4 text-center flex flex-col justify-center">
                    <label className="block text-[10px] uppercase text-purple-500 font-bold mb-1">Years Since Birth</label>
                    <div className="text-3xl font-black text-purple-400">{chronologicalAge}</div>
                    <div className="text-[9px] text-purple-600 uppercase mt-1">Objective Years</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-slate-700 pb-2">
                  <h3 className="text-cyan-400 font-bold">V. PHYSICAL APPEARANCE</h3>
                  <div className="flex gap-2">
                    <button onClick={randomizeCosmetics} className="text-[10px] font-bold tracking-wider px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors uppercase border border-slate-600">
                      Randomize Cosmetics
                    </button>
                    <button onClick={deriveBuildFromStats} className="text-[10px] font-bold tracking-wider px-3 py-1 rounded bg-cyan-900/50 text-cyan-400 hover:bg-cyan-800 transition-colors uppercase border border-cyan-700/50">
                      Derive Build from Stats
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "Gender", key: "gender", placeholder: "e.g. Female" },
                    { label: "Height", key: "height", placeholder: "e.g. 5'8\"" },
                    { label: "Weight", key: "weight", placeholder: "e.g. 150 lbs" },
                    { label: "Eye Color", key: "eyes", placeholder: "e.g. Hazel" },
                    { label: "Hair Color", key: "hair", placeholder: "e.g. Black" },
                    { label: "Complexion", key: "complexion", placeholder: "e.g. Fair" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-[10px] uppercase text-slate-400 mb-1 pl-1">{field.label}</label>
                      <input 
                        type="text" value={appearance[field.key as keyof typeof appearance]} 
                        onChange={e => handleAppearanceChange(field.key as keyof typeof appearance, e.target.value)} 
                        className="w-full bg-slate-900/80 border border-slate-700 rounded p-2 text-white focus:border-cyan-400 focus:outline-none text-sm" 
                        placeholder={field.placeholder} 
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] uppercase text-cyan-500 font-bold mb-1 pl-1">Physical Build & Traits</label>
                  <textarea 
                    value={physicalBuild}
                    onChange={e => setPhysicalBuild(e.target.value)}
                    className="w-full h-20 bg-slate-900/80 border border-slate-700 rounded p-2 text-white focus:border-cyan-400 focus:outline-none text-sm resize-none"
                    placeholder="Click 'Derive Build from Stats' to analyze your genetics, or type a custom description..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SKILLS & LOADOUT */}
          {activeTab === "loadout" && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300 h-full">
              
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-slate-700 pb-2">
                  <h3 className="text-cyan-400 font-bold">VI. SKILL MATRIX</h3>
                  <span className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded ${isSkillCapReached ? 'bg-cyan-900/50 text-cyan-400' : 'bg-red-900/30 text-red-400'}`}>
                    {isSkillCapReached ? "MAXIMUM SKILLS" : `${skillsRemaining} MORE REQUIRED`}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 max-h-[220px] overflow-y-auto">
                  {SKILL_LIST.map(skill => {
                    const isProficient = proficientSkills.includes(skill.name);
                    const totalSkillMod = modifiers[skill.stat] + (isProficient ? profBonus : 0);
                    const isDisabled = !isProficient && isSkillCapReached;
                    
                    return (
                      <label key={skill.name} className={`flex items-center p-2 rounded transition-all border border-transparent ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-800/50 cursor-pointer hover:border-slate-700'}`}>
                        <input 
                          type="checkbox" checked={isProficient} onChange={() => toggleSkill(skill.name)} disabled={isDisabled}
                          className="mr-3 w-4 h-4 accent-cyan-500 bg-slate-900 border-slate-600 rounded disabled:opacity-50"
                        />
                        <span className="w-8 font-black text-white text-right mr-2">{formatMod(totalSkillMod)}</span>
                        <span className={`text-sm ${isProficient ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
                          {skill.name} <span className="text-[10px] text-slate-500 uppercase">({skill.stat})</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 flex flex-col flex-1">
                <div className="flex justify-between items-end border-b border-slate-700 pb-2">
                  <h3 className="text-cyan-400 font-bold">VII. INVENTORY & GEAR</h3>
                  <span className={`text-xs font-bold tracking-wider px-2 py-1 rounded ${availableFunds < 0 ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}>
                    FUNDS: {availableFunds.toLocaleString()} IC
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <select 
                    value={selectedCatalogItemStr} onChange={(e) => setSelectedCatalogItemStr(e.target.value)}
                    className="flex-1 bg-slate-900/80 border border-slate-700 rounded p-2 text-white focus:border-cyan-400 focus:outline-none text-xs"
                  >
                    {EQUIPMENT_CATALOG.map((category, idx) => (
                      <optgroup key={idx} label={category.category} className="bg-slate-800 text-cyan-400 font-bold">
                        {category.items.map((item, i) => {
                          const isTrained = item.tags.some(tag => currentClass.proficiencies.includes(tag));
                          return (
                            <option key={i} value={JSON.stringify(item)} className={isTrained ? 'text-green-400' : 'text-slate-400'}>
                              {isTrained ? '✔ ' : '⚠ '} {item.name} {item.cost > 0 ? `(${item.cost} IC)` : '(Free)'} {isTrained ? '' : '- Untrained'}
                            </option>
                          );
                        })}
                      </optgroup>
                    ))}
                  </select>
                  <button 
                    onClick={addCatalogItem} disabled={!canAffordCatalogItem}
                    className={`rounded px-4 py-2 font-bold uppercase text-[10px] transition-colors ${canAffordCatalogItem ? 'bg-cyan-900 hover:bg-cyan-700 text-cyan-400 border border-cyan-700' : 'bg-red-900/30 text-red-500/50 border border-red-900/30 cursor-not-allowed'}`}
                  >
                    Buy
                  </button>
                </div>

                <div className="flex gap-2 pb-2 border-b border-slate-800/50">
                  <input type="text" value={newCustomItemName} onChange={e => setNewCustomItemName(e.target.value)} className="flex-1 bg-slate-900/80 border border-slate-700 rounded p-2 text-white focus:border-cyan-400 focus:outline-none text-xs placeholder-slate-500" placeholder="Custom gear..." />
                  <input type="number" min="0" value={newCustomItemCost} onChange={e => setNewCustomItemCost(Number(e.target.value))} className="w-20 bg-slate-900/80 border border-slate-700 rounded p-2 text-white focus:border-cyan-400 focus:outline-none text-xs placeholder-slate-500 text-right" placeholder="Cost" />
                  <button onClick={addCustomItem} disabled={!newCustomItemName.trim() || Number(newCustomItemCost) > availableFunds} className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-600 rounded px-3 py-2 font-bold uppercase text-[10px] transition-colors">Add</button>
                </div>
                
                <ul className="space-y-2 flex-1 max-h-[175px] overflow-y-auto pr-2 mt-2">
                  {inventory.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center bg-slate-800/50 p-2 rounded border border-slate-700/50 group">
                      <div>
                        <span className="text-sm text-slate-300 block leading-tight">{item.name}</span>
                        <span className="text-[10px] text-cyan-600 font-bold">{item.cost > 0 ? `${item.cost} IC` : '0 IC'}</span>
                      </div>
                      <button onClick={() => removeItem(idx)} className="text-slate-500 hover:text-red-400 font-bold text-lg leading-none px-2 focus:outline-none transition-colors opacity-50 group-hover:opacity-100" title="Sell / Remove Item">×</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Visuals & Stats */}
        <div className="w-full lg:w-5/12 flex flex-col bg-black/40">
          
          {/* UPDATED IMAGE BLOCK: Dropdown moved to bottom right */}
          <div className="h-72 lg:h-80 w-full bg-cover bg-center border-b border-cyan-500/30 relative" style={{ backgroundImage: `url(${currentClass.img})` }}>
            {/* Darken Top and Bottom for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/10 to-black/80 z-0"></div>
            
            {/* Description & Title (Moved to Top Left) */}
            <div className="absolute top-4 left-6 z-10 max-w-sm pr-4">
              <h2 className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-lg leading-none">{currentClass.name}</h2>
              <p className="text-cyan-400 uppercase tracking-widest text-sm drop-shadow-md mb-2">{currentClass.role}</p>
              <p className="text-slate-200 text-xs drop-shadow-md leading-relaxed hidden sm:block">
                {currentClass.desc}
              </p>
            </div>

            {/* Class Selector Buttons (Bottom) */}
            <div className="absolute bottom-4 left-4 right-4 z-10 grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(classData).map(([key, data]) => {
                const isActive = charClass === key;
                return (
                  <button 
                    key={key} 
                    onClick={() => setCharClass(key)}
                    className={`py-2 px-1 uppercase font-bold text-[10px] tracking-wider rounded transition-all backdrop-blur-sm border ${
                      isActive 
                        ? 'bg-cyan-600/80 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.5)]' 
                        : 'bg-black/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
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
                <div className="bg-slate-900/80 rounded-lg p-3 border border-cyan-900">
                  <div className="text-slate-400 text-[10px] uppercase mb-1">Max HP</div>
                  <div className="text-3xl font-black text-white">{maxHp}</div>
                  <div className="text-slate-500 text-[9px] mt-1">Hit Die: d{currentClass.hitDie}</div>
                </div>
                <div className="bg-slate-900/80 rounded-lg p-3 border border-cyan-900">
                  <div className="text-slate-400 text-[10px] uppercase mb-1">Armor Class</div>
                  <div className="text-3xl font-black text-cyan-400">{armorClass}</div>
                  <div className="text-slate-500 text-[9px] mt-1">Base + DEX</div>
                </div>
                <div className="bg-slate-900/80 rounded-lg p-3 border border-cyan-900">
                  <div className="text-slate-400 text-[10px] uppercase mb-1">Proficiency</div>
                  <div className="text-3xl font-black text-white">+{profBonus}</div>
                  <div className="text-slate-500 text-[9px] mt-1">Lvl {level}</div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <h3 className="text-cyan-400 font-bold border-b border-slate-700 pb-2 mb-4">CLASS LOADOUT</h3>
              <div className="bg-slate-900/60 rounded p-4 border border-slate-800 space-y-4 flex-1">
                <div>
                  <span className="text-cyan-500 font-bold uppercase text-xs tracking-wider block mb-1">Saving Throws</span>
                  <p className="text-sm text-white">{currentClass.saves}</p>
                </div>
                <div>
                  <span className="text-cyan-500 font-bold uppercase text-xs tracking-wider block mb-1">Armor & Weapon Proficiencies</span>
                  <p className="text-sm text-slate-300">{currentClass.proficiencies.replace(/, Gear|Remnants, /g, "")}</p>
                </div>
                <div className="pt-2 border-t border-slate-700/50">
                  <span className="text-cyan-500 font-bold uppercase text-xs tracking-wider block mb-2">Level 1 Features</span>
                  <ul className="space-y-3">
                    {currentClass.features.map((feature: any, idx: number) => (
                      <li key={idx} className="text-sm">
                        <strong className="text-white block">{feature.name}</strong>
                        <span className="text-slate-400 text-xs">{feature.desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* DYNAMIC EXPORT BUTTON */}
            <div className="mt-auto pt-4 flex gap-2">
              <button 
                onClick={handleExportFillablePDF}
                disabled={isExporting || !isSkillCapReached}
                className={`w-full font-black uppercase tracking-widest py-3 rounded transition-all text-sm ${
                  isSkillCapReached && !isExporting
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                {isExporting 
                  ? "Compiling PDF..." 
                  : !isSkillCapReached 
                  ? `Select ${skillsRemaining} More Skill${skillsRemaining !== 1 ? 's' : ''} to Export` 
                  : "Export Official Character Sheet"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
