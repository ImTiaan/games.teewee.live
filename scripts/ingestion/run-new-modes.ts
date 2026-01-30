
import dotenv from 'dotenv';
import path from 'path';
import { getServiceSupabase } from '../../lib/supabase/client';
import { StaticTextSource } from '../../lib/ingestion/sources/static-text';
import { humanParagraphs, aiParagraphs } from './data/human-machine';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
  const supabase = getServiceSupabase();

  console.log('Ensuring modes exist...');
  
  // 1. Activate/Create Modes
  const modesToUpsert = [
    {
      id: 'animal-fictional',
      title: 'Real Animal or Fictional',
      description: 'Evolution is wilder than fiction. Or is it?',
      round_type: 'binary',
      active: true,
      rules_json: { choices: ['Real', 'Fictional'] }
    },
    {
      id: 'job-fake',
      title: 'Real Job or Fake Job',
      description: 'Some people actually get paid to do this.',
      round_type: 'binary',
      active: true,
      rules_json: { choices: ['Real', 'Fake'] }
    },
    {
      id: 'human-machine',
      title: 'Human or AI Writer',
      description: 'Can you spot the soul in the machine?',
      round_type: 'binary',
      active: true,
      rules_json: { choices: ['Human', 'AI'] }
    },
    {
      id: 'urban-dictionary',
      title: 'Urban Dictionary Challenge',
      description: 'Can you speak the slang? Match the definition to the word.',
      round_type: 'multi',
      active: true,
      rules_json: { choices: [] }
    },
    {
      id: 'music-history',
      title: 'Music History Challenge',
      description: 'Guess the song starting from just a 1-second clip!',
      round_type: 'multi',
      active: true,
      rules_json: { choices: [] }
    }
  ];

  const { error: modeError } = await supabase
    .from('modes')
    .upsert(modesToUpsert, { onConflict: 'id' });

  if (modeError) {
    console.error('Error upserting modes:', modeError);
    return;
  }
  console.log('Modes configured.');

  // 2. Define Sources

  // --- ANIMALS ---
  const realAnimals = [
    "Okapi", "Narwhal", "Pangolin", "Axolotl", "Pink Fairy Armadillo", 
    "Blobfish", "Goblin Shark", "Maned Wolf", "Fossa", "Gerenuk",
    "Shoebill Stork", "Saiga Antelope", "Glaucus Atlanticus", "Aye-Aye", "Star-Nosed Mole",
    "Dumbo Octopus", "Sunda Colugo", "Markhor", "Raccoon Dog", "Lamprey",
    "Proboscis Monkey", "Kakapo", "Tarsier", "Tapir", "Echidna",
    "Platypus", "Cassowary", "Komodo Dragon", "Capybara", "Sloth",
    "Red Panda", "Fennec Fox", "Quokka", "Wombat", "Tasmanian Devil",
    "Sugar Glider", "Meerkat", "Lemur", "Chameleon", "Gecko",
    "Iguana", "Monitor Lizard", "Tortoise", "Sea Turtle", "Jellyfish",
    "Octopus", "Squid", "Cuttlefish", "Nautilus", "Seahorse",
    "Tasseled Wobbegong", "Fried Egg Jellyfish", "Sarcastic Fringehead", "Sparklemuffin Spider", "Chicken Turtle",
    "Hellbender", "Screaming Hairy Armadillo", "Yeti Crab", "Satanic Leaf-Tailed Gecko", "Mata Mata",
    "Dik-dik", "Bongo", "Zebra Duiker", "Lowland Streaked Tenrec", "Hispaniolan Solenodon",
    "Numbat", "Quoll", "Bilby", "Bandicoot", "Cuscus", "Potoroo", "Pademelon", "Tree Kangaroo",
    "Marsupial Mole", "Honey Badger", "Wolverine", "Sun Bear", "Sloth Bear", "Spectacled Bear",
    "Binturong", "Civet", "Genet", "Linsang", "Hyrax", "Aardvark", "Aardwolf", "Elephant Shrew",
    "Golden Mole", "Otter Shrew", "Moonrat", "Gymnure", "Desman", "Flying Lemur", "Tree Shrew",
    "Kinkajou", "Olinguito", "Coati", "Cacomistle", "Ringtail", "Fisher", "Tayra", "Grison",
    "Stoat", "Weasel", "Mink", "Polecat", "Ferret", "Badger", "Otter", "Sea Otter", "River Otter",
    "Giant Otter", "Clawless Otter", "Small-Clawed Otter", "Skunk", "Stink Badger", "Giant Panda",
    "Polar Bear", "Brown Bear", "Black Bear", "Grizzly Bear", "Kodiak Bear", "Spirit Bear",
    "Leafy Seadragon", "Barreleye Fish", "Vampire Squid", "Giant Isopod", "Anglerfish",
    "Beluga Whale", "Manatee", "Dugong", "Vaquita", "Irrawaddy Dolphin", "Amazon River Dolphin",
    "Naked Mole Rat", "Jerboa", "Gobi Jerboa", "Patagonian Mara", "Viscacha", "Agouti", "Paca",
    "Capuchin Monkey", "Howler Monkey", "Spider Monkey", "Marmoset", "Tamarin", "Saki Monkey",
    "Uakari", "Mandrill", "Drill", "Baboon", "Gelada", "Colobus Monkey", "Langur", "Macaque",
    "Gibbon", "Siamang", "Orangutan", "Gorilla", "Chimpanzee", "Bonobo", "Bushbaby", "Loris",
    "Potto", "Indri", "Sifaka", "Falanouc", "Malagasy Civet", "Dhole", "African Wild Dog",
    "Bat-Eared Fox", "Maned Wolf", "Bush Dog", "Tibetan Fox", "Corsac Fox", "Kit Fox", "Swift Fox",
    "Arctic Fox", "Gray Fox", "Island Fox", "Crab-Eating Fox", "Hoary Fox", "Pampas Fox",
    "Sechuran Fox", "Culpeo", "Darwin's Fox", "Chilla", "Blanford's Fox", "Cape Fox", "Pale Fox",
    "Rüppell's Fox", "Sand Fox", "Bengal Fox", "Fennec Fox", "Red Fox", "Coyote", "Wolf", "Jackal",
    "Dingo", "New Guinea Singing Dog", "Serval", "Caracal", "Ocelot", "Margay", "Jaguarundi",
    "Kodkod", "Oncilla", "Pampas Cat", "Geoffroy's Cat", "Andean Mountain Cat", "Pallas's Cat",
    "Sand Cat", "Black-Footed Cat", "Jungle Cat", "Fishing Cat", "Leopard Cat", "Flat-Headed Cat",
    "Rusty-Spotted Cat", "Marbled Cat", "Asian Golden Cat", "Bay Cat", "African Golden Cat",
    "Cheetah", "Puma", "Cougar", "Mountain Lion", "Jaguar", "Leopard", "Lion", "Tiger", "Snow Leopard",
    "Clouded Leopard", "Lynx", "Bobcat", "Iberian Lynx", "Canada Lynx", "Eurasian Lynx", "Civet",
    "Genet", "Linsang", "Mongoose", "Meerkat", "Hyena", "Aardwolf", "Fossa", "Euplerid"
  ].map(t => ({ text: t }));

  const fictionalAnimals = [
    "Jackalope", "Drop Bear", "Hoop Snake", "Wolpertinger", "Esquilax", 
    "Hodag", "Squonk", "Vegetable Lamb", "Bonnacon", "Yale",
    "Griffin", "Chimera", "Hydra", "Manticore", "Basilisk",
    "Cockatrice", "Wyvern", "Drake", "Kraken", "Leviathan",
    "Behemoth", "Phoenix", "Thunderbird", "Roc", "Simurgh",
    "Pegasus", "Unicorn", "Alicorn", "Kelpie", "Selkie",
    "Mermaid", "Siren", "Harpy", "Gorgon", "Minotaur",
    "Centaur", "Satyr", "Faun", "Cyclops", "Titan",
    "Giant", "Troll", "Ogre", "Goblin", "Kobold",
    "Gremlin", "Imp", "Demon", "Devil", "Angel",
    "Cerberus", "Orthrus", "Nemean Lion", "Sphinx", "Lamia",
    "Typhon", "Scylla", "Charybdis", "Polyphemus", "Medusa",
    "Stheno", "Euryale", "Chrysaor", "Geryon", "Cacus",
    "Antaeus", "Talos", "Hecatoncheires", "Erinyes", "Furies",
    "Moirai", "Fates", "Graces", "Muses", "Nymphs",
    "Dryads", "Naiads", "Oreads", "Oceanids", "Nereids",
    "Sileni", "Pan", "Priapus", "Lapiths", "Myrmidons",
    "Amazons", "Hyperboreans", "Arimaspians", "Hippogriff", "Garuda",
    "Naga", "Makara", "Yali", "Kirtimukha", "Gandharva",
    "Apsara", "Rakshasa", "Yaksha", "Asura", "Deva",
    "Oni", "Tengu", "Kappa", "Kitsune", "Tanuki",
    "Baku", "Nue", "Kirin", "Qilin", "Lung",
    "Ryu", "Amphiptere", "Lindworm", "Knucker", "Tatzelwurm",
    "Each Uisge", "Nuckelavee", "Banshee", "Leprechaun", "Clurichaun",
    "Far Darrig", "Pooka", "Dullahan", "Sluagh", "Bean Nighe",
    "Cat Sith", "Cu Sith", "Merrow", "Finfolk", "Trow",
    "Brownie", "Boggart", "Hobgoblin", "Redcap", "Knocker",
    "Spriggan", "Pixie", "Fairy", "Elf", "Dwarf",
    "Gnome", "Halfling", "Orc", "Ettin", "Jotun",
    "Huldra", "Draugr", "Valkyrie", "Einherjar", "Wendigo",
    "Skinwalker", "Sasquatch", "Bigfoot", "Yeti", "Abominable Snowman",
    "Alma", "Yeren", "Mande Barung", "Orang Pendek", "Ebu Gogo",
    "Flores Man", "Hobbit", "Chupacabra", "Jersey Devil", "Mothman",
    "Flatwoods Monster", "Dover Demon", "Loveland Frog", "Lizard Man", "Goatman",
    "Sheepsquatch", "Snallygaster", "Gowrow", "Wampus Cat", "Ozark Howler",
    "Beast of Bodmin", "Beast of Exmoor", "Black Shuck", "Barghest", "Gylou",
    "Empusa", "Mormo", "Accipiter", "Acheri", "Adlet",
    "Ahkiyyini", "Ahuizotl", "Aitvaras", "Akhlut", "Alkonost",
    "Ammit", "Amphisbaena", "Ankou", "Aniwye", "Ao Ao",
    "Apaosha", "Aqrabuamelu", "Aralez", "Asag", "Aswang",
    "Ba Jiao Gui", "Baba Yaga", "Baccoo", "Badalisc", "Bahamut",
    "Bakunawa", "Bal-Bal", "Barbegazi", "Bardi", "Basan",
    "Baykok", "Berserker", "Berbalang", "Bies", "Bishop-fish",
    "Black Annis", "Blemmye", "Bloody Mary", "Bodach", "Bogeyman",
    "Bogle", "Bolla", "Boogeyman", "Boo Hag", "Bugbear",
    "Bukavac", "Bunyip", "Burach Bhadi", "Bylgja", "Cadejo",
    "Caladrius", "Calchona", "Caleuche", "Calibos", "Camahueto",
    "Campe", "Camulatz", "Candileja", "Carbuncle", "Catoblepas",
    "Centicore", "Cerastes", "Ceryneian Hind", "Chamrosh", "Chaneque",
    "Changeling", "Charon", "Cherufe", "Cheval Mallet", "Chibaiskweda",
    "Chichevache", "Chickcharney", "Ciguapa", "Cihuateteo", "Cipactli",
    "Cirein-croin", "Coblynau", "Colo Colo", "Cretan Bull", "Crocotta",
    "Cuélebre", "Curupira", "Cynocephalus", "Dactyl", "Daemon",
    "Dahut", "Dakon", "Damysus", "Dandan", "Daphne",
    "Datsue-ba", "Deadly Nightshade", "Death Worm", "Deer Woman", "Deity",
    "Demigod", "Dhampir", "Diable", "Dibbuk", "Dilong",
    "Dip", "Dirawong", "Diwata", "Dobhar-chu", "Doch-troll"
  ].map(t => ({ text: t }));

  // --- JOBS ---
  const realJobs = [
    "Snake Milker", "Professional Sleeper", "Pet Food Taster", "Golf Ball Diver", "Odor Judge", 
    "Full-Time Netflix Viewer", "Professional Mourner", "Chicken Sexer", "Line Stander", "Bed Warmer",
    "Water Slide Tester", "Face Feeler", "Cuddle Professional", "Paint Dry Watcher", "Train Pusher",
    "Professional Hitchhiker", "Vomit Cleaner", "Gum Buster", "Toad Doctor", "Dice Inspector",
    "Fortune Cookie Writer", "Color Expert", "Flavorist", "Ethical Hacker", "White Hat",
    "Bounty Hunter", "Private Investigator", "Bodyguard", "Butler", "Nanny",
    "Au Pair", "Doula", "Midwife", "Mortician", "Embalmer",
    "Taxidermist", "Forensic Artist", "Crime Scene Cleaner", "Repo Man", "Process Server",
    "Bail Bondsman", "Pawnbroker", "Auctioneer", "Croupier", "Pit Boss",
    "Sommelier", "Barista", "Mixologist", "Cicero", "Concierge",
    "Ocularist", "Hippotherapist", "Perfusionist", "Scatologist", "Volcanologist",
    "Glaciologist", "Speleologist", "Limnologist", "Dendrologist", "Entomologist",
    "Herpetologist", "Ornithologist", "Ichthyologist", "Malacologist", "Arachnologist",
    "Myrmecologist", "Apiarist", "Falconer", "Farrier", "Cooper",
    "Fletcher", "Chandler", "Milliner", "Cobbler", "Cordwainer",
    "Tanner", "Currier", "Furrier", "Lapidary", "Gemologist",
    "Horologist", "Numismatist", "Philatelist", "Archivist", "Curator",
    "Librarian", "Genealogist", "Herald", "Scribe", "Calligrapher",
    "Illuminator", "Bookbinder", "Printer", "Typesetter", "Compositor",
    "Proofreader", "Editor", "Lexicographer", "Translator", "Interpreter",
    "Cryptographer", "Cartographer", "Surveyor", "Navigator", "Pilot",
    "Astronaut", "Diver", "Submariner", "Miner", "Prospector",
    "Driller", "Rigger", "Welder", "Blacksmith", "Locksmith",
    "Gunsmith", "Bladesmith", "Armorer", "Swordsmith", "Cutler",
    "Pewterer", "Silversmith", "Goldsmith", "Jeweler", "Watchmaker",
    "Clockmaker", "Instrument Maker", "Luthier", "Archetier", "Actuary",
    "Statistician", "Data Scientist", "Epidemiologist", "Demographer", "Economist",
    "Sociologist", "Anthropologist", "Archaeologist", "Paleontologist", "Historian",
    "Philosopher", "Theologian", "Clergy", "Rabbi", "Imam",
    "Priest", "Pastor", "Minister", "Bishop", "Cardinal",
    "Pope", "Monk", "Nun", "Abbot", "Abbess",
    "Friar", "Hermit", "Ascetic", "Yogi", "Guru",
    "Shaman", "Medicine Man", "Witch Doctor", "Healer", "Herbalist",
    "Acupuncturist", "Chiropractor", "Osteopath", "Homeopath", "Naturopath",
    "Massage Therapist", "Physical Therapist", "Occupational Therapist", "Speech Therapist", "Psychologist",
    "Psychiatrist", "Psychoanalyst", "Counselor", "Social Worker", "Case Manager",
    "Probation Officer", "Parole Officer", "Correctional Officer", "Warden", "Judge",
    "Magistrate", "Justice", "Attorney", "Lawyer", "Barrister",
    "Solicitor", "Paralegal", "Legal Secretary", "Court Reporter", "Bailiff",
    "Sheriff", "Deputy", "Constable", "Marshal", "Police Officer",
    "Detective", "Inspector", "Agent", "Spy", "Soldier",
    "Sailor", "Airman", "Marine", "Coast Guardsman", "Firefighter",
    "Paramedic", "EMT", "First Responder", "Lifeguard", "Ski Patrol",
    "Park Ranger", "Game Warden", "Zookeeper", "Aquarist", "Veterinarian",
    "Vet Tech", "Groomer", "Trainer", "Handler", "Jockey",
    "Musher", "Bullfighter", "Rodeo Clown", "Circus Performer", "Acrobat",
    "Aerialist", "Clown", "Juggler", "Magician", "Illusionist",
    "Mentalist", "Hypnotist", "Ventriloquist", "Puppeteer", "Mime",
    "Comedian", "Actor", "Actress", "Director", "Producer",
    "Screenwriter", "Playwright", "Cinematographer", "Sound Engineer", "Foley Artist",
    "Gaffer", "Grip", "Best Boy", "Boom Operator", "Stuntman",
    "Stuntwoman", "Body Double", "Extra", "Model", "Dancer",
    "Choreographer", "Singer", "Musician", "Composer", "Conductor",
    "DJ", "VJ", "Radio Host", "Podcaster", "Streamer",
    "YouTuber", "Influencer", "Blogger", "Vlogger", "Writer",
    "Author", "Poet", "Journalist", "Reporter", "Correspondent",
    "Columnist", "Critic", "Reviewer", "Pundit", "Commentator",
    "Anchor", "Broadcaster", "Announcer", "Narrator", "Voice Actor"
  ].map(t => ({ text: t }));

  const fakeJobs = [
    "Penguin Erector", "Cloud Cleaner", "Banana Straightener", "Glass Hammer Polisher", "Left-Handed Screwdriver Turner", 
    "Paint Drier Watcher", "Tartan Paint Mixer", "Spaghetti Tree Farmer", "Unicorn Groomer", "Wifi Cable Layer",
    "Shadow Catcher", "Wind Measurer", "Rainbow Chaser", "Moon Polisher", "Star Counter",
    "Cloud Shepherd", "Sun Tanner", "Rain Dodger", "Snow Melter", "Ice Breaker (literal)",
    "Leaf Painter", "Grass Comber", "Rock Softener", "Sand Counter", "Wave Smoother",
    "Air Guitar Tuner", "Pet Rock Trainer", "Invisible Friend Walker", "Ghost Buster", "Time Traveler",
    "Space Cowboy", "Alien Hunter", "Dragon Slayer", "Monster Truck Driver (literal)", "Zombie Apologist",
    "Vampire Hunter", "Werewolf Walker", "Fairy Godmother", "Genie in a Bottle", "Wizard",
    "Witch", "Warlock", "Sorcerer", "Mage", "Necromancer",
    "Druid", "Bard", "Rogue", "Paladin", "Cleric",
    "Professional Apologizer", "Bear Hugger", "Dust Bunny Breeder", "Pillow Fighter", "Water Dehydrator",
    "Ice Cube Warmer", "Fire Freezer", "Light Bulb Darkener", "Sound Silencer", "Hole Filler",
    "Empty Box Tester", "Air Grabbing Expert", "Nothing Doer", "Professional Loiterer", "Queue Jumper",
    "Line Cutter", "Door Slammer", "Window Licker", "Wall Stare", "Ceiling Gazer",
    "Floor Looker", "Shoe Sniffer", "Sock Matcher", "Glove Shrinker", "Hat Stretcher",
    "Belt Loosener", "Tie Tightener", "Button Popper", "Zipper Jammer", "Velcro Ripper",
    "Shoelace Knotter", "Pocket Picker (legal)", "Wallet Inspector", "Money Burner", "Gold Melter",
    "Diamond Crusher", "Pearl Dissolver", "Ruby Smasher", "Emerald Grinder", "Sapphire Pulverizer",
    "Opal Cracker", "Topaz Splitter", "Amethyst Breaker", "Garnet Crusher", "Citrine Smasher",
    "Peridot Grinder", "Aquamarine Pulverizer", "Tourmaline Cracker", "Onyx Splitter", "Jade Breaker",
    "Jasper Crusher", "Agate Smasher", "Quartz Grinder", "Marble Pulverizer", "Granite Cracker",
    "Slate Splitter", "Limestone Breaker", "Sandstone Crusher", "Atmosphere Recycler", "Gravity Tester",
    "Horizon Straightener", "Tide Pusher", "Volcano Corker", "Earthquake Gluer", "Tsunami Stopper",
    "Hurricane Catcher", "Tornado Untwister", "Lightning Bottler", "Thunder Muffler", "Raindrop Counter",
    "Snowflake Designer", "Hail Polisher", "Fog Thickener", "Mist Clearer", "Dew Collector",
    "Frost Melter", "Heatwave Cooler", "Cold Snap Warmer", "Climate Changer", "Season Adjuster",
    "Day Lengthener", "Night Shortener", "Time Stretcher", "Space Bender", "Reality Warper",
    "Dimension Hopper", "Universe Creator", "World Builder", "Life Giver", "Death Defier",
    "Soul Collector", "Spirit Guide", "Ghost Whisperer", "Demon Slayer", "Angel Summoner",
    "God Maker", "Myth Weaver", "Legend Spinner", "Fable Teller", "Story Eater",
    "Dream Catcher", "Nightmare Hunter", "Sleep Walker", "Thought Reader", "Mind Bender",
    "Brain Washer", "Memory Eraser", "Idea Planter", "Emotion Controller", "Feeling Feeler",
    "Sensation Seeker", "Perception Shifter", "Awareness Raiser", "Consciousness Expander", "Enlightenment Giver",
    "Nirvana Finder", "Zen Master", "Yoga Flyer", "Meditation Floater", "Chakra Aligner",
    "Aura Polisher", "Energy Healer", "Crystal Gazer", "Tarot Reader", "Palm Reader",
    "Tea Leaf Reader", "Bone Thrower", "Rune Caster", "Astrologer", "Horoscope Writer",
    "Zodiac Signer", "Planet Aligner", "Star Gazer", "Galaxy Hopper", "Nebula Surfer",
    "Black Hole Diver", "Supernova Watcher", "Comet Rider", "Meteor Catcher", "Asteroid Miner (Sci-Fi)",
    "Space Station Janitor", "Moon Base Cleaner", "Mars Colony Farmer", "Venus Terraformer", "Mercury Sunbather",
    "Jupiter Storm Chaser", "Saturn Ring Polisher", "Uranus Jokesmith", "Neptune Deep Diver", "Pluto Reinstater",
    "Sun Stoker", "Solar Flare Tamer", "Cosmic Ray Blocker", "Dark Matter Scooper", "Antimatter Container",
    "Wormhole Driller", "Warp Drive Tuner", "Hyperspace Navigator", "Teleporter Operator", "Replicator Repairman",
    "Holodeck Programmer", "Android Sheep Counter", "Cyborg Mechanic", "Robot Psychologist", "AI Therapist",
    "Virtual Reality Tester", "Augmented Reality Designer", "Simulation Glitch Fixer", "Matrix Architect", "Code Breaker",
    "Firewall Builder", "Virus Hunter", "Malware Destroyer", "Spam Eater", "Phishing Baiter",
    "Troll Feeder", "Bot Herder", "Meme Maker", "Viral Video Creator", "Clickbait Writer",
    "Fake News Generator", "Conspiracy Theorist", "Tin Foil Hat Maker", "Flat Earther", "Chemtrail Pilot",
    "Lizard Person", "Illuminati Member", "Freemason", "Templar Knight", "Rosicrucian",
    "Alchemist", "Philosopher's Stone Maker", "Elixir of Life Brewer", "Homunculus Grower", "Golem Shaper",
    "Frankenstein's Assistant", "Dracula's Butler", "Wolfman's Groomer", "Mummy's Wrapper", "Invisible Man's Tailor",
    "Swamp Thing's Gardener", "Godzilla's Dentist", "King Kong's Barber", "Alien's Translator", "Predator's Stylist",
    "Terminator's Polisher", "RoboCop's Oiler", "Jedi's Trainer", "Sith's Apprentice", "Wizard's Familiar",
    "Witch's Cat", "Fairy's Wingsmith", "Elf's Fletcher", "Dwarf's Miner", "Hobbit's Cook",
    "Orc's Dentist", "Troll's Bridge Keeper", "Dragon's Hoard Accountant", "Unicorn's Horn Polisher", "Mermaid's Fin Groomer",
    "Centaur's Shoer", "Minotaur's Maze Keeper", "Sphinx's Riddler", "Hydra's Head Counter", "Cerberus's Walker",
    "Pegasus's Groom", "Phoenix's Ash Sweeper", "Griffin's Nest Builder", "Basilisk's Optometrist", "Kraken's Tentacle Untangler"
  ].map(t => ({ text: t }));

  const humanTexts = humanParagraphs.map(t => ({ text: t }));
  const aiTexts = aiParagraphs.map(t => ({ text: t }));

  const sources = [
    new StaticTextSource('real-animals', 'Biology Database', 'animal-fictional', 'Real', realAnimals),
    new StaticTextSource('fictional-animals', 'Mythology Database', 'animal-fictional', 'Fictional', fictionalAnimals),
    new StaticTextSource('real-jobs', 'HR Database', 'job-fake', 'Real', realJobs),
    new StaticTextSource('fake-jobs', 'Satire Job Board', 'job-fake', 'Fake', fakeJobs),
    new StaticTextSource('human-texts', 'Literature Database', 'human-machine', 'Human', humanTexts),
    new StaticTextSource('ai-texts', 'GPT-3 Output', 'human-machine', 'AI', aiTexts)
  ];

  // 3. Ingest
  for (const source of sources) {
    console.log(`Fetching from ${source.name}...`);
    const items = await source.fetch();
    console.log(`Found ${items.length} items.`);
    
    let insertedCount = 0;
    let errorCount = 0;

    for (const item of items) {
      const { error } = await supabase
        .from('items')
        .upsert(item, { 
          onConflict: 'hash',
          ignoreDuplicates: true 
        });

      if (error) {
        console.error(`Error inserting item ${item.prompt_text}:`, error);
        errorCount++;
      } else {
        insertedCount++;
      }
    }
    
    console.log(`Ingested ${insertedCount} items for ${source.name} (Errors: ${errorCount})`);
  }
}

run();
