// A starter pool of candidates, so there's something to review before running `discover`.
// Run once: node seed.mjs   (safe to re-run; known URLs are skipped)

import { addCandidates } from "./curate.mjs";

const yt = (handle) => `https://www.youtube.com/@${handle}`;

const SEED = [
  // Science
  ["Veritasium", "youtube", yt("veritasium"), "Science", "Big-budget science explainers and experiments by Derek Muller."],
  ["Kurzgesagt – In a Nutshell", "youtube", yt("kurzgesagt"), "Science", "Animated explainers on space, biology and big questions."],
  ["3Blue1Brown", "youtube", yt("3blue1brown"), "Science", "Visual math explanations by Grant Sanderson."],
  ["Steve Mould", "youtube", yt("SteveMould"), "Science", "Hands-on physics demos of surprising everyday effects."],
  ["SmarterEveryDay", "youtube", yt("smartereveryday"), "Science", "Destin Sandlin investigates how things work, often in slow motion."],
  ["Numberphile", "youtube", yt("numberphile"), "Science", "Mathematicians explain favorite numbers and puzzles on brown paper."],
  ["Sixty Symbols", "youtube", yt("sixtysymbols"), "Science", "Physicists from the University of Nottingham on physics and astronomy."],
  ["PBS Space Time", "youtube", yt("pbsspacetime"), "Science", "In-depth astrophysics and physics for curious non-experts."],
  ["SciShow", "youtube", yt("SciShow"), "Science", "Quick, well-researched science news and explainers."],
  ["NileRed", "youtube", yt("NileRed"), "Science", "Chemistry projects, from turning gloves into grape soda to making crystals."],
  ["Anton Petrov", "youtube", yt("whatdamath"), "Science", "Calm daily summaries of new space and science papers."],
  ["Scott Manley", "youtube", yt("scottmanley"), "Science", "Spaceflight history and rocket launches explained by an astronomer."],
  ["Quanta Magazine", "website", "https://www.quantamagazine.org", "Science", "Independent journalism on math, physics, biology and computer science."],
  ["Nautilus", "website", "https://nautil.us", "Science", "Science magazine connecting research to culture and ideas."],
  ["Bartosz Ciechanowski", "blog", "https://ciechanow.ski", "Science", "Interactive essays on how things work, from GPS to mechanical watches."],
  ["What If? (xkcd)", "website", "https://what-if.xkcd.com", "Science", "Serious scientific answers to absurd hypothetical questions."],
  ["Ologies", "podcast", "https://www.alieward.com/ologies", "Science", "Alie Ward interviews experts in a different -ology each episode."],
  ["The Royal Institution", "youtube", yt("TheRoyalInstitution"), "Science", "Science lectures and talks from a 200-year-old London institution."],

  // History
  ["OverSimplified", "youtube", yt("OverSimplified"), "History", "Funny animated retellings of major historical events."],
  ["Kings and Generals", "youtube", yt("KingsandGenerals"), "History", "Animated documentaries on military history and campaigns."],
  ["Extra History", "youtube", yt("extrahistory"), "History", "Animated series on historical stories and figures."],
  ["History Matters", "youtube", yt("HistoryMatters"), "History", "Short animated answers to specific history questions."],
  ["Fall of Civilizations", "youtube", yt("FallofCivilizations"), "History", "Long, atmospheric documentaries on how civilizations collapsed."],
  ["Tasting History with Max Miller", "youtube", yt("TastingHistory"), "History", "Recreates historical recipes and tells the stories behind them."],
  ["Townsends", "youtube", yt("townsends"), "History", "18th-century cooking and daily life, recreated."],
  ["Hardcore History", "podcast", "https://www.dancarlin.com", "History", "Dan Carlin's epic multi-hour history episodes."],
  ["The Rest Is History", "podcast", "https://therestishistory.com", "History", "Two historians chat through stories from every era."],
  ["In Our Time", "podcast", "https://www.bbc.co.uk/programmes/b006qykl", "History", "BBC discussion show where academics explain history, science and ideas."],
  ["The Memory Palace", "podcast", "https://thememorypalace.us", "History", "Short, beautifully written stories from the past."],
  ["The Public Domain Review", "website", "https://publicdomainreview.org", "History", "Essays and collections exploring curious public domain works."],
  ["Letters of Note", "newsletter", "https://news.lettersofnote.com", "History", "Notable letters from history, one at a time."],

  // How things work (engineering, geography, economics)
  ["Practical Engineering", "youtube", yt("PracticalEngineeringChannel"), "How Things Work", "Civil engineering explained: dams, roads, water and infrastructure."],
  ["Real Engineering", "youtube", yt("RealEngineering"), "How Things Work", "Engineering behind aircraft, energy and technology."],
  ["Technology Connections", "youtube", yt("TechnologyConnections"), "How Things Work", "Deep dives into everyday technology like dishwashers and lightbulbs."],
  ["Wendover Productions", "youtube", yt("Wendoverproductions"), "How Things Work", "Logistics, travel and economics of how the world runs."],
  ["Half as Interesting", "youtube", yt("halfasinteresting"), "How Things Work", "Short, funny videos on odd facts about the world."],
  ["CGP Grey", "youtube", yt("CGPGrey"), "How Things Work", "Explainers on politics, geography and systems."],
  ["RealLifeLore", "youtube", yt("RealLifeLore"), "How Things Work", "Geography and geopolitics explained with maps."],
  ["Mustard", "youtube", yt("MustardChannel"), "How Things Work", "Animated stories of aviation and engineering history."],
  ["Construction Physics", "newsletter", "https://www.construction-physics.com", "How Things Work", "Brian Potter on the economics and history of building things."],
  ["Works in Progress", "website", "https://worksinprogress.co", "How Things Work", "Magazine of new and underrated ideas for improving the world."],
  ["Planet Money", "podcast", "https://www.npr.org/sections/money/", "How Things Work", "NPR show explaining the economy through stories."],
  ["99% Invisible", "podcast", "https://99percentinvisible.org", "How Things Work", "Stories about design and architecture we don't notice."],
  ["Low-tech Magazine", "website", "https://solar.lowtechmagazine.com", "How Things Work", "Old and simple technologies that still work, on a solar-powered site."],

  // Craft & making
  ["Clickspring", "youtube", yt("Clickspring"), "Craft & Making", "Meticulous clockmaking and machining videos."],
  ["This Old Tony", "youtube", yt("ThisOldTony"), "Craft & Making", "Funny machining and workshop videos."],
  ["Stuff Made Here", "youtube", yt("StuffMadeHere"), "Craft & Making", "Ambitious engineering builds with honest failures."],
  ["Applied Science", "youtube", yt("AppliedScience"), "Craft & Making", "Ben Krasnow's advanced home lab experiments."],
  ["Adam Savage's Tested", "youtube", yt("tested"), "Craft & Making", "Adam Savage's builds, prop making and workshop tips."],
  ["Simone Giertz", "youtube", yt("simonegiertz"), "Craft & Making", "Inventive builds and product design, with humor."],

  // Food
  ["J. Kenji López-Alt", "youtube", yt("JKenjiLopezAlt"), "Food", "Point-of-view cooking videos from a food science writer."],
  ["Adam Ragusea", "youtube", yt("aragusea"), "Food", "Practical home cooking and food science."],
  ["Ethan Chlebowski", "youtube", yt("EthanChlebowski"), "Food", "Thoughtful home cooking that explains the why."],
  ["Babish Culinary Universe", "youtube", yt("bingingwithbabish"), "Food", "Recipes from movies and TV, plus cooking basics."],
  ["Serious Eats", "website", "https://www.seriouseats.com", "Food", "Tested recipes and food science articles."],

  // Film, music & culture
  ["Every Frame a Painting", "youtube", yt("everyframeapainting"), "Film & Music", "Short video essays on film form (archive)."],
  ["Nerdwriter1", "youtube", yt("Nerdwriter1"), "Film & Music", "Video essays on art, film and culture."],
  ["Lessons from the Screenplay", "youtube", yt("LessonsfromtheScreenplay"), "Film & Music", "How screenplays make great films work."],
  ["Jacob Geller", "youtube", yt("JacobGeller"), "Film & Music", "Video essays on games, art and ideas."],
  ["Adam Neely", "youtube", yt("AdamNeely"), "Film & Music", "Music theory and the musical world, from a jazz bassist."],
  ["12tone", "youtube", yt("12tone"), "Film & Music", "Music theory explained with drawings in a notebook."],
  ["Song Exploder", "podcast", "https://songexploder.net", "Film & Music", "Musicians take apart their songs and explain how they were made."],
  ["Twenty Thousand Hertz", "podcast", "https://www.20k.org", "Film & Music", "Stories behind the world's most recognizable sounds."],
  ["The Honest Broker", "newsletter", "https://www.honest-broker.com", "Film & Music", "Ted Gioia on music, culture and media."],
  ["The Art Assignment", "youtube", yt("theartassignment"), "Film & Music", "Art history and art making for everyone."],

  // Ideas & essays
  ["Wait But Why", "blog", "https://waitbutwhy.com", "Ideas & Essays", "Long, illustrated essays on big topics by Tim Urban."],
  ["The Marginalian", "blog", "https://www.themarginalian.org", "Ideas & Essays", "Maria Popova on books, art, science and how to live."],
  ["Kottke.org", "blog", "https://kottke.org", "Ideas & Essays", "One of the oldest blogs, linking to interesting things since 1998."],
  ["Experimental History", "newsletter", "https://www.experimental-history.com", "Ideas & Essays", "Psychologist Adam Mastroianni's funny essays on science and life."],
  ["Paul Graham", "blog", "https://paulgraham.com/articles.html", "Ideas & Essays", "Essays on startups, writing and thinking."],
  ["Craig Mod", "blog", "https://craigmod.com", "Ideas & Essays", "Writing on walking, Japan, books and making things."],
  ["Austin Kleon", "blog", "https://austinkleon.com", "Ideas & Essays", "Daily notes on creativity and reading."],
  ["Dynomight", "blog", "https://dynomight.net", "Ideas & Essays", "Careful, funny essays that dig into questions most people skip."],
  ["Aeon", "website", "https://aeon.co", "Ideas & Essays", "Essays and short films on philosophy, science and culture."],
  ["The Browser", "newsletter", "https://thebrowser.com", "Ideas & Essays", "Five hand-picked pieces of great writing every day."],
  ["Five Books", "website", "https://fivebooks.com", "Ideas & Essays", "Experts recommend the five best books on their subject."],
  ["Conversations with Tyler", "podcast", "https://conversationswithtyler.com", "Ideas & Essays", "Economist Tyler Cowen's wide-ranging interviews."],
  ["Revisionist History", "podcast", "https://www.pushkin.fm/podcasts/revisionist-history", "Ideas & Essays", "Malcolm Gladwell revisits overlooked or misunderstood events."],
  ["Freakonomics Radio", "podcast", "https://freakonomics.com", "Ideas & Essays", "The hidden side of everything, through economics."],

  // Odd & delightful
  ["Atlas Obscura", "website", "https://www.atlasobscura.com", "Odd & Delightful", "Guide to the world's hidden wonders and curious places."],
  ["Futility Closet", "website", "https://www.futilitycloset.com", "Odd & Delightful", "Curiosities from history, language and math."],
  ["No Such Thing As A Fish", "podcast", "https://www.nosuchthingasafish.com", "Odd & Delightful", "QI researchers share their favorite facts of the week."],
  ["Tom Scott", "youtube", yt("TomScottGo"), "Odd & Delightful", "Short videos on interesting places and ideas (large archive)."],
  ["Vsauce", "youtube", yt("Vsauce"), "Odd & Delightful", "Michael Stevens follows curious questions wherever they go."],
  ["True Facts (Ze Frank)", "youtube", yt("zefrank"), "Odd & Delightful", "Hilarious narrated nature documentaries that are also accurate."],
  ["xkcd", "website", "https://xkcd.com", "Odd & Delightful", "Webcomic of romance, sarcasm, math and language."],
  ["Saturday Morning Breakfast Cereal", "website", "https://www.smbc-comics.com", "Odd & Delightful", "Webcomic on science, philosophy and absurdity."],
  ["The Pudding", "website", "https://pudding.cool", "Odd & Delightful", "Visual essays that explain culture with data."],
  ["Captain Disillusion", "youtube", yt("CaptainDisillusion"), "Odd & Delightful", "Debunks viral videos by explaining the visual effects."],
  ["LEMMiNO", "youtube", yt("LEMMiNO"), "Odd & Delightful", "Polished documentaries on mysteries and unsolved cases."],

  // Language & words
  ["RobWords", "youtube", yt("RobWords"), "Language", "The stories behind English words and phrases."],
  ["The Allusionist", "podcast", "https://www.theallusionist.org", "Language", "Helen Zaltzman on language and words."],

  // Nature
  ["BBC Earth", "youtube", yt("bbcearth"), "Nature", "Clips from BBC nature documentaries."],
  ["Deep Look", "youtube", yt("KQEDDeepLook"), "Nature", "Ultra-close-up videos of small creatures, from KQED and PBS."],
  ["Geography Now", "youtube", yt("GeographyNow"), "Nature", "Country-by-country geography guides."],
];

const added = addCandidates(
  SEED.map(([name, platform, url, topic, blurb]) => ({ name, platform, url, topic, blurb })),
  "seed",
);
console.log(`Added ${added} of ${SEED.length} seed candidates. Run "node curate.mjs verify" next.`);
