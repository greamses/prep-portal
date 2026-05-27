/* ════════════════════════════════════════
   video.js (Updated for English-Only Results)
════════════════════════════════════════ */
import { state } from '../state.js';

const _videoCache = {};

const _VIDEO_MODELS = [
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-pro:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
];

function _isMathSubject(subject) {
  return /math|maths|further math/i.test(subject);
}

/* ════════════════════════════════════════
   CHANNEL MAP
════════════════════════════════════════ */
function _getChannels(subject, level) {
  const isLowerPrim = /primary [123]|pry [123]/i.test(level);
  const isUpperPrim = /primary [456]|pry [456]/i.test(level);
  const isPrimary   = isLowerPrim || isUpperPrim;
  const isJSS       = /jss/i.test(level);

  if (/further math/i.test(subject)) return [
    { name: '3Blue1Brown',                  handle: '3blue1brown'                  },
    { name: 'blackpenredpen',               handle: 'blackpenredpen'               },
    { name: 'Mathologer',                   handle: 'mathologer'                   },
    { name: 'Eddie Woo',                    handle: 'misterwootube'                },
    { name: 'Professor Leonard',            handle: 'professorleonard'             },
  ];
  if (/math/i.test(subject) && isLowerPrim) return [
    { name: 'Numberblocks',                 handle: 'learningblocks'               },
    { name: 'Peekaboo Kidz',                handle: 'peekabookidz'                 },
    { name: 'Smile and Learn',              handle: 'smileandlearn'                },
    { name: 'Math Antics',                  handle: 'mathantics'                   },
    { name: 'Scratch Garden',               handle: 'scratchgarden'                },
    { name: 'Miacademy Learning',           handle: 'miacademy'                    },
    { name: 'Onlock Learning',              handle: 'onlocklearning'               },
    { name: 'Jack Hartmann',                handle: 'jackhartmannkidsmusic'        },
  ];
  if (/math/i.test(subject) && isUpperPrim) return [
    { name: 'Math Antics',                  handle: 'mathantics'                   },
    { name: 'Miacademy Learning',           handle: 'miacademy'                    },
    { name: 'Onlock Learning',              handle: 'onlocklearning'               },
    { name: 'Smile and Learn',              handle: 'smileandlearn'                },
    { name: 'Numberphile',                  handle: 'numberphile'                  },
    { name: 'Khan Academy',                 handle: 'khanacademy'                  },
    { name: 'Khan Academy',                 handle: 'sumsofanarchy'                  },
  ];
  if (/math/i.test(subject) && isJSS) return [
    { name: 'Math Antics',                  handle: 'mathantics'                   },
    { name: 'Khan Academy',                 handle: 'khanacademy'                  },
    { name: 'Onlock Learning',              handle: 'onlocklearning'               },
    { name: 'Eddie Woo',                    handle: 'misterwootube'                },
    { name: 'Numberphile',                  handle: 'numberphile'                  },
    { name: 'TabletClass Math',             handle: 'tabletclassmath'              },
  ];
  if (/math/i.test(subject)) return [
    { name: 'blackpenredpen',               handle: 'blackpenredpen'               },
    { name: '3Blue1Brown',                  handle: '3blue1brown'                  },
    { name: 'Khan Academy',                 handle: 'khanacademy'                  },
    { name: 'Eddie Woo',                    handle: 'misterwootube'                },
    { name: 'Professor Leonard',            handle: 'professorleonard'             },
    { name: 'The Organic Chemistry Tutor',  handle: 'theorganicchemistrytutorm'    },
  ];

  if (/physics/i.test(subject) && isPrimary) return [
    { name: 'SciShow Kids',                 handle: 'scishowkids'                  },
    { name: "It's AumSum",                  handle: 'aumsum'                       },
    { name: 'Peekaboo Kidz',                handle: 'peekabookidz'                 },
    { name: 'Kurzgesagt',                   handle: 'kurzgesagt'                   },
    { name: 'Smile and Learn',              handle: 'smileandlearn'                },
  ];
  if (/physics/i.test(subject)) return [
    { name: 'Veritasium',                   handle: 'veritasium'                   },
    { name: 'MinutePhysics',                handle: 'minutephysics'                },
    { name: 'Physics Girl',                 handle: 'physicsgirl'                  },
    { name: 'The Organic Chemistry Tutor',  handle: 'theorganicchemistrytutorm'    },
    { name: 'Flipping Physics',             handle: 'flippingphysics'              },
  ];

  if (/chemistry/i.test(subject) && isPrimary) return [
    { name: "It's AumSum",                  handle: 'aumsum'                       },
    { name: 'SciShow Kids',                 handle: 'scishowkids'                  },
    { name: 'Peekaboo Kidz',                handle: 'peekabookidz'                 },
    { name: 'Kurzgesagt',                   handle: 'kurzgesagt'                   },
  ];
  if (/chemistry/i.test(subject)) return [
    { name: 'Tyler DeWitt',                 handle: 'tylerdewitt'                  },
    { name: 'NileRed',                      handle: 'nilered'                      },
    { name: 'The Organic Chemistry Tutor',  handle: 'theorganicchemistrytutorm'    },
    { name: 'Periodic Videos',              handle: 'periodicvideos'               },
    { name: 'Professor Dave',               handle: 'professordaveexplains'        },
  ];

  if (/biology/i.test(subject) && isPrimary) return [
    { name: 'SciShow Kids',                 handle: 'scishowkids'                  },
    { name: 'Peekaboo Kidz',                handle: 'peekabookidz'                 },
    { name: 'Kurzgesagt',                   handle: 'kurzgesagt'                   },
    { name: "It's AumSum",                  handle: 'aumsum'                       },
    { name: 'National Geographic Kids',     handle: 'natgeokids'                   },
  ];
  if (/biology/i.test(subject)) return [
    { name: 'Amoeba Sisters',               handle: 'amoebasisters'                },
    { name: 'Kurzgesagt',                   handle: 'kurzgesagt'                   },
    { name: 'Professor Dave',               handle: 'professordaveexplains'        },
    { name: 'Stated Clearly',               handle: 'statedclearly'                },
    { name: 'BioMan Biology',               handle: 'biomanbio'                    },
  ];

  if (/basic science/i.test(subject) && isPrimary) return [
    { name: 'SciShow Kids',                 handle: 'scishowkids'                  },
    { name: 'Peekaboo Kidz',                handle: 'peekabookidz'                 },
    { name: "It's AumSum",                  handle: 'aumsum'                       },
    { name: 'Smile and Learn',              handle: 'smileandlearn'                },
    { name: 'Onlock Learning',              handle: 'onlocklearning'               },
    { name: 'National Geographic Kids',     handle: 'natgeokids'                   },
    { name: 'Miacademy Learning',           handle: 'miacademy'                    },
  ];
  if (/basic science/i.test(subject)) return [
    { name: 'Kurzgesagt',                   handle: 'kurzgesagt'                   },
    { name: 'SciShow',                      handle: 'scishow'                      },
    { name: 'Amoeba Sisters',               handle: 'amoebasisters'                },
    { name: "It's AumSum",                  handle: 'aumsum'                       },
    { name: 'Veritasium',                   handle: 'veritasium'                   },
  ];

  if (/english/i.test(subject) && isLowerPrim) return [
    { name: 'Alphablocks',                  handle: 'learningblocks'               },
    { name: 'Grammar Songs by Melissa',     handle: 'grammarsongsmelissa'          },
    { name: 'Scratch Garden',               handle: 'scratchgarden'                },
    { name: 'Onlock Learning',              handle: 'onlocklearning'               },
    { name: 'Jack Hartmann',                handle: 'jackhartmannkidsmusic'        },
    { name: 'Smile and Learn',              handle: 'smileandlearn'                },
    { name: 'Miacademy Learning',           handle: 'miacademy'                    },
    { name: 'Peekaboo Kidz',                handle: 'peekabookidz'                 },
  ];
  if (/english/i.test(subject) && isUpperPrim) return [
    { name: 'Grammar Songs by Melissa',     handle: 'grammarsongsmelissa'          },
    { name: 'Scratch Garden',               handle: 'scratchgarden'                },
    { name: 'Onlock Learning',              handle: 'onlocklearning'               },
    { name: 'English Tree TV',              handle: 'englishteetv'                 },
    { name: 'Miacademy Learning',           handle: 'miacademy'                    },
    { name: 'BBC Bitesize',                 handle: 'bbcbitesize'                  },
    { name: 'Smile and Learn',              handle: 'smileandlearn'                },
  ];
  if (/english/i.test(subject) && isJSS) return [
    { name: 'TED-Ed',                       handle: 'teded'                        },
    { name: 'Grammar Songs by Melissa',     handle: 'grammarsongsmelissa'          },
    { name: 'Onlock Learning',              handle: 'onlocklearning'               },
    { name: 'CrashCourse',                  handle: 'crashcourse'                  },
    { name: 'BBC Bitesize',                 handle: 'bbcbitesize'                  },
    { name: 'English with Lucy',            handle: 'englishwithlucy'              },
  ];
  if (/english/i.test(subject)) return [
    { name: 'TED-Ed',                       handle: 'teded'                        },
    { name: 'CrashCourse',                  handle: 'crashcourse'                  },
    { name: 'English with Lucy',            handle: 'englishwithlucy'              },
    { name: 'Merriam-Webster',              handle: 'merriamwebster'               },
    { name: 'BBC Learning English',         handle: 'bbclearningenglish'           },
  ];

  if (/literature/i.test(subject)) return [
    { name: 'TED-Ed',                       handle: 'teded'                        },
    { name: 'CrashCourse',                  handle: 'crashcourse'                  },
    { name: 'The School of Life',           handle: 'theschooloflifetv'            },
    { name: 'Overly Sarcastic Productions', handle: 'overlysarcasticproductions'   },
    { name: 'Like Stories of Old',          handle: 'likestoriesofold'             },
  ];
  if (/government|civic/i.test(subject)) return [
    { name: 'CrashCourse',                  handle: 'crashcourse'                  },
    { name: 'TED-Ed',                       handle: 'teded'                        },
    { name: 'CGP Grey',                     handle: 'cgpgrey'                      },
    { name: 'PolyMatter',                   handle: 'polymatter'                   },
    { name: 'Overly Sarcastic Productions', handle: 'overlysarcasticproductions'   },
  ];
  if (/history/i.test(subject)) return [
    { name: 'Overly Sarcastic Productions', handle: 'overlysarcasticproductions'   },
    { name: 'Kings and Generals',           handle: 'kingsandgenerals'             },
    { name: 'CrashCourse',                  handle: 'crashcourse'                  },
    { name: 'Toldinstone',                  handle: 'toldinstone'                  },
    { name: 'Fall of Civilizations',        handle: 'fallofcivilizationspodcast'   },
    { name: 'Historia Civilis',             handle: 'historiacivilis'              },
  ];
  if (/economics/i.test(subject)) return [
    { name: 'ACDC Econ',                    handle: 'acdcecon'                     },
    { name: 'Economics Explained',          handle: 'economicsexplained'           },
    { name: 'CrashCourse',                  handle: 'crashcourse'                  },
    { name: 'Marginal Revolution University', handle: 'marginalu'                  },
    { name: 'PolyMatter',                   handle: 'polymatter'                   },
  ];
  if (/commerce|accounting|financial/i.test(subject)) return [
    { name: 'Accounting Stuff',             handle: 'accountingstuff'              },
    { name: 'ACDC Econ',                    handle: 'acdcecon'                     },
    { name: 'Edspira',                      handle: 'edspira'                      },
    { name: 'Khan Academy',                 handle: 'khanacademy'                  },
    { name: 'Two Teachers',                 handle: 'twoteachers'                  },
  ];

  if (/geography/i.test(subject) && isPrimary) return [
    { name: 'National Geographic Kids',     handle: 'natgeokids'                   },
    { name: 'Smile and Learn',              handle: 'smileandlearn'                },
    { name: 'SciShow Kids',                 handle: 'scishowkids'                  },
    { name: 'Geography Now',                handle: 'geographynow'                 },
  ];
  if (/geography/i.test(subject)) return [
    { name: 'Geography Now',                handle: 'geographynow'                 },
    { name: 'Real Life Lore',               handle: 'reallifelore'                 },
    { name: 'Wendover Productions',         handle: 'wendoverproductions'          },
    { name: 'GeoRussia',                    handle: 'georussia'                    },
    { name: 'Kurzgesagt',                   handle: 'kurzgesagt'                   },
  ];

  if (/social studies/i.test(subject) && isPrimary) return [
    { name: 'Smile and Learn',              handle: 'smileandlearn'                },
    { name: 'Peekaboo Kidz',                handle: 'peekabookidz'                 },
    { name: 'Onlock Learning',              handle: 'onlocklearning'               },
    { name: 'Miacademy Learning',           handle: 'miacademy'                    },
    { name: 'National Geographic Kids',     handle: 'natgeokids'                   },
    { name: 'TED-Ed',                       handle: 'teded'                        },
  ];
  if (/social studies/i.test(subject)) return [
    { name: 'TED-Ed',                       handle: 'teded'                        },
    { name: 'Kurzgesagt',                   handle: 'kurzgesagt'                   },
    { name: 'CrashCourse',                  handle: 'crashcourse'                  },
    { name: 'PolyMatter',                   handle: 'polymatter'                   },
  ];

  if (/computer|ict/i.test(subject) && isLowerPrim) return [
    { name: 'Code.org',                     handle: 'codeorg'                      },
    { name: 'Hopscotch',                    handle: 'hopscotch'                    },
    { name: 'Scratch Team',                 handle: 'scratch'                      },
    { name: 'Onlock Learning',              handle: 'onlocklearning'               },
    { name: 'Smile and Learn',              handle: 'smileandlearn'                },
    { name: 'CS Unplugged',                 handle: 'csunplugged'                  },
  ];
  if (/computer|ict/i.test(subject) && isUpperPrim) return [
    { name: 'Code.org',                     handle: 'codeorg'                      },
    { name: 'Hopscotch',                    handle: 'hopscotch'                    },
    { name: 'Scratch Team',                 handle: 'scratch'                      },
    { name: 'Onlock Learning',              handle: 'onlocklearning'               },
    { name: 'Miacademy Learning',           handle: 'miacademy'                    },
    { name: 'TED-Ed',                       handle: 'teded'                        },
  ];
  if (/computer|ict/i.test(subject) && isJSS) return [
    { name: 'Code.org',                     handle: 'codeorg'                      },
    { name: 'CS50 Harvard',                 handle: 'cs50'                         },
    { name: 'Computerphile',                handle: 'computerphile'                },
    { name: 'Khan Academy',                 handle: 'khanacademy'                  },
    { name: 'Fireship',                     handle: 'fireship'                     },
  ];
  if (/computer|ict/i.test(subject)) return [
    { name: 'Fireship',                     handle: 'fireship'                     },
    { name: 'CS50 Harvard',                 handle: 'cs50'                         },
    { name: 'Computerphile',                handle: 'computerphile'                },
    { name: 'Traversy Media',               handle: 'traversymedia'                },
    { name: 'NetworkChuck',                 handle: 'networkchuck'                 },
    { name: 'TechWorld with Nana',          handle: 'techworldwithnana'            },
  ];

  if (/agricultural|agric/i.test(subject) && isPrimary) return [
    { name: 'SciShow Kids',                 handle: 'scishowkids'                  },
    { name: 'National Geographic Kids',     handle: 'natgeokids'                   },
    { name: 'Smile and Learn',              handle: 'smileandlearn'                },
  ];
  if (/agricultural|agric/i.test(subject)) return [
    { name: 'Real Agriculture',             handle: 'realagriculture'              },
    { name: 'Practical Engineering',        handle: 'practicalengineeringchannel'  },
    { name: 'Khan Academy',                 handle: 'khanacademy'                  },
    { name: 'FAO',                          handle: 'unfao'                        },
  ];
  if (/business|marketing/i.test(subject)) return [
    { name: 'CrashCourse',                  handle: 'crashcourse'                  },
    { name: 'ACDC Econ',                    handle: 'acdcecon'                     },
    { name: 'TED-Ed',                       handle: 'teded'                        },
    { name: 'Patrick Dang',                 handle: 'patrickdang'                  },
    { name: 'HubSpot Marketing',            handle: 'hubspot'                      },
  ];
  if (/home economics|home ec/i.test(subject)) return [
    { name: 'Smile and Learn',              handle: 'smileandlearn'                },
    { name: 'SciShow Kids',                 handle: 'scishowkids'                  },
    { name: 'Khan Academy',                 handle: 'khanacademy'                  },
  ];
  if (/fine art|creative art/i.test(subject)) return [
    { name: 'The Art Assignment',           handle: 'theartassignment'             },
    { name: 'Proko',                        handle: 'proko'                        },
    { name: 'Drawfee Show',                 handle: 'drawfeeshow'                  },
    { name: 'Nerdforge',                    handle: 'nerdforge'                    },
  ];

  return [
    { name: 'Kurzgesagt',                   handle: 'kurzgesagt'                   },
    { name: 'TED-Ed',                       handle: 'teded'                        },
    { name: 'CrashCourse',                  handle: 'crashcourse'                  },
    { name: 'Onlock Learning',              handle: 'onlocklearning'               },
    { name: 'Smile and Learn',              handle: 'smileandlearn'                },
    { name: 'Peekaboo Kidz',                handle: 'peekabookidz'                 },
  ];
}

/* ════════════════════════════════════════
   GEMINI TOPIC PLANNING
════════════════════════════════════════ */
async function _fetchTopicData(questionText, subject, level, channels) {
  const isMath = _isMathSubject(subject);
  const mathExtra = isMath ?
    `\nAlso return up to 3 interactive math tools (Khan Academy, GeoGebra, Desmos, Mathway, Brilliant, CK-12) with direct URLs and 1 hands-on activity.` :
    '';
  
  const chNames = channels.slice(0, 4).map(c => c.name);
  const chList = chNames.map((n, i) => `Channel ${i + 1}: ${n}`).join('\n');
  
  // UPDATED PROMPT: Explicitly demanding English and excluding Hindi content
  const prompt = `You are an educational video relevance expert for Nigerian school students.
LEVEL: ${level}
SUBJECT: ${subject}
EXAM QUESTION: "${questionText}"

CRITICAL: All content must be in ENGLISH. Do not suggest channels or queries that would lead to Hindi, Urdu, or other non-English language videos.

TASK 1 — Identify the single precise concept being tested.
TASK 2 — Extract 4-6 MUST-MATCH keywords.
TASK 3 — Write one search query per suggested channel. 
IMPORTANT: Append the word "English" or "Lesson" to the queries to ensure language accuracy.

Suggested channels:
${chList}
${mathExtra}

Return ONLY valid JSON — no markdown:
{
  "topicLabel": "<precise concept, max 6 words>",
  "mustMatchTerms": ["<keyword1>", "<keyword2>", "<keyword3>", "<keyword4>"],
  "searches": [
    { "query": "<Channel> <precise concept> English lesson", "channel": "<Channel>", "angle": "<what this teaches>" },
    { "query": "<Channel> <precise concept> English lesson", "channel": "<Channel>", "angle": "<what this teaches>" },
    { "query": "<Channel> <precise concept> English lesson", "channel": "<Channel>", "angle": "<what this teaches>" },
    { "query": "<Channel> <precise concept> English lesson", "channel": "<Channel>", "angle": "<what this teaches>" }
  ]${isMath ? `,
  "interactive": [{ "name": "<tool>", "url": "<url>", "type": "practice|visualiser|game", "description": "<one sentence>" }],
  "manipulative": "<one sentence hands-on physical activity>"` : ''}
}`;
  
  let token;
  try { token = await window._getAuthToken(); } catch { return null; }

  for (const modelUrl of _VIDEO_MODELS) {
    try {
      const res = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          modelUrl,
          body: {
            systemInstruction: { parts: [{ text: prompt }] },
            contents: [{ parts: [{ text: `Plan English-language video resources for: ${questionText}` }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.3, maxOutputTokens: 800 },
          },
        }),
      });
      if (res.status === 429 || res.status === 503 || !res.ok) continue;
      const raw = await res.json();
      const text = raw.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const s = text.indexOf('{'),
        e = text.lastIndexOf('}');
      if (s < 0 || e < 0) continue;
      return JSON.parse(
        text.slice(s, e + 1)
        .replace(/\r\n/g, '\\n').replace(/\r/g, '\\n').replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '')
      );
    } catch (_) { /* try next model */ }
  }
  return null;
}


/* ════════════════════════════════════════
   FETCH RESOURCES
════════════════════════════════════════ */
async function _fetchVideoResources(questionText, subject, level) {
  const cacheKey = `${level}::${subject}::${questionText.slice(0, 80)}`;
  if (_videoCache[cacheKey]) return _videoCache[cacheKey];

  const isLowerPrim = /primary [123]|pry [123]/i.test(level);
  const isUpperPrim = /primary [456]|pry [456]/i.test(level);
  const isPrimary   = isLowerPrim || isUpperPrim;

  const channels    = _getChannels(subject, level);
  const topChannels = channels.slice(0, 4);

  /* Ask Gemini for 4 channel-specific queries — silent fallback on failure */
  let topicData = null;
  try { topicData = await _fetchTopicData(questionText, subject, level, channels); } catch (_) {}

  const topicLabel = topicData?.topicLabel || subject;

  /* Keywords used to filter YouTube results — prefer Gemini's, fall back to topic words */
  const mustMatchTerms = topicData?.mustMatchTerms?.length
    ? topicData.mustMatchTerms
    : topicLabel
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3); /* strip common short words */

  /* Build up to 4 searches — prefer Gemini's, fall back to channel-name-prefixed queries */
  const questionCore = questionText.length > 80
    ? questionText.slice(0, 80).replace(/\s+\S*$/, '')
    : questionText;

  const searches = topicData?.searches?.length >= 4
    ? topicData.searches.slice(0, 4)
    : topChannels.map((ch, i) => {
        const geminiQ = topicData?.searches?.[i];
        return {
          query  : geminiQ?.query || `${ch.name} ${questionCore}`,
          channel: geminiQ?.channel || ch.name,
          angle  : geminiQ?.angle   || ch.name,
        };
      });

  let videos = [];

  {
    for (let i = 0; i < searches.length; i++) {
      try {
        /* Pass keywords so _ytSearch can filter irrelevant results */
        const result = await _ytSearch(searches[i].query, mustMatchTerms, isPrimary);

        /* Deduplicate by videoId — only push if relevant and not already seen */
        if (result && !videos.some(v => v.videoId === result.videoId)) {
          videos.push({
            mode    : 'embed',
            videoId : result.videoId,
            title   : result.title,
            channel : result.channel,
            angle   : searches[i].angle || searches[i].channel || '',
            thumb   : result.thumbnail,
            watchUrl: `https://www.youtube.com/watch?v=${result.videoId}`,
            embedUrl: `https://www.youtube.com/embed/${result.videoId}?rel=0&modestbranding=1`,
          });
        }
        /* No else — if null, this slot is simply skipped. We may end up with 1, 2, or 3 videos. */
      } catch (_) { /* skip this slot on error */ }
    }
  }

  if (!videos.length) {
    /* No API key — show channel search cards using the topic-specific queries */
    videos = searches.map((s, i) => ({
      mode     : 'search',
      channel  : s.channel || topChannels[i]?.name || s.query.split(' ')[0],
      handle   : topChannels[i]?.handle || '',
      angle    : s.angle || s.channel || '',
      searchUrl: topChannels[i]?.handle
        ? `https://www.youtube.com/@${topChannels[i].handle}/search?query=${encodeURIComponent(s.query)}`
        : `https://www.youtube.com/results?search_query=${encodeURIComponent(s.query)}`,
      query    : s.query,
    }));
  }

  const result = { topicLabel, videos, interactive: topicData?.interactive || null, manipulative: topicData?.manipulative || null };
  _videoCache[cacheKey] = result;
  return result;
}

/* ════════════════════════════════════════
   RENDER PANEL
════════════════════════════════════════ */
function _renderVideoPanel(row, data, isMath) {
  const esc = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const videoItems = (data.videos || []).map(v => {
    if (v.mode === 'embed') return `
      <div class="pvr-embed-block">
        <div class="pvr-embed-thumb-wrap" data-embedurl="${esc(v.embedUrl)}"
          tabindex="0" role="button" aria-label="Play ${esc(v.title)}">
          <img class="pvr-thumb" src="${esc(v.thumb)}" alt="${esc(v.title)}" loading="lazy">
          <div class="pvr-play-btn">▶</div>
        </div>
        <div class="pvr-embed-info">
          <div class="pvr-embed-title">${esc(v.title)}</div>
          <div class="pvr-embed-meta">
            <span class="pvr-embed-channel">${esc(v.channel)}</span>
            ${v.angle ? `<span class="pvr-embed-angle">${esc(v.angle)}</span>` : ''}
          </div>
          <a class="pvr-watch-link" href="${esc(v.watchUrl)}" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a>
        </div>
      </div>`;
    return `
      <a class="pvr-search-card" href="${esc(v.searchUrl)}" target="_blank" rel="noopener noreferrer">
        <div class="pvr-search-yt-icon">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        </div>
        <div class="pvr-search-info">
          <div class="pvr-search-channel">${esc(v.channel)}</div>
          <div class="pvr-search-query">${esc(v.angle || v.query)}</div>
          <div class="pvr-search-hint">Tap to search this channel on YouTube →</div>
        </div>
      </a>`;
  }).join('');

  let interactiveCards = '';
  if (isMath && Array.isArray(data.interactive) && data.interactive.length) {
    interactiveCards = `
      <div class="pvr-section-label">Interactive Practice</div>
      ${data.interactive.map(r => `
        <a class="pvr-tool-card" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">
          <div class="pvr-tool-type pvr-type-${esc(r.type)}">${esc(r.type)}</div>
          <div class="pvr-tool-info">
            <div class="pvr-tool-name">${esc(r.name)}</div>
            <div class="pvr-tool-desc">${esc(r.description)}</div>
          </div>
          <div class="pvr-ext-icon">↗</div>
        </a>`).join('')}
      ${data.manipulative ? `
        <div class="pvr-manipulative">
          <div class="pvr-manip-icon">✋</div>
          <div class="pvr-manip-text"><strong>Hands-on:</strong> ${esc(data.manipulative)}</div>
        </div>` : ''}`;
  }

  const modeLabel = data.videos?.[0]?.mode === 'embed'
    ? `<span class="pvr-mode-badge pvr-mode-live">▶ Live Videos</span>`
    : `<span class="pvr-mode-badge pvr-mode-search">🔍 Channel Search</span>`;

  row.innerHTML = `
    <div class="pvr-panel">
      <div class="pvr-header">
        <span class="pvr-topic">${esc(data.topicLabel || 'Resources')}</span>
        ${modeLabel}
        <button class="pvr-close-btn" type="button">✕</button>
      </div>
      <div class="pvr-section-label">Videos</div>
      ${videoItems}
      ${interactiveCards}
    </div>`;

  row.querySelectorAll('.pvr-embed-thumb-wrap').forEach(wrap => {
    const activate = () => {
      const iframe = document.createElement('div');
      iframe.className = 'pvr-iframe-wrap';
      iframe.innerHTML = `<iframe src="${wrap.dataset.embedurl}&autoplay=1"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen loading="lazy" frameborder="0"></iframe>`;
      wrap.replaceWith(iframe);
    };
    wrap.addEventListener('click', activate);
    wrap.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') activate(); });
  });

  row.querySelector('.pvr-close-btn').addEventListener('click', () => {
    row.innerHTML = `<button class="paper-video-btn" type="button">▶ Watch Video</button>`;
    row.querySelector('.paper-video-btn').addEventListener('click', () =>
      handleVideoBtn(row.querySelector('.paper-video-btn')));
  });
}

/* ── Public entry point ── */
export async function handleVideoBtn(btn) {
  const row = btn.closest('.paper-video-row');
  if (!row) return;
  const qTextEl      = row.closest('.paper-q-block')?.querySelector('.paper-q-text');
  const questionText = qTextEl?.textContent?.trim() || btn.dataset.qtext || '';
  const isMath       = _isMathSubject(state.st.subject);

  row.innerHTML = `<div class="pvr-loading"><span class="pvr-spinner"></span>Finding resources…</div>`;

  try {
    const data = await _fetchVideoResources(questionText, state.st.subject, state.st.cls);
    _renderVideoPanel(row, data, isMath);
  } catch (err) {
    row.innerHTML = `
      <div class="pvr-error">Could not load resources — ${err.message}.
        <button class="paper-video-btn pvr-retry-btn" type="button" style="margin-left:8px">Retry</button>
      </div>`;
    row.querySelector('.pvr-retry-btn').addEventListener('click', () => {
      row.innerHTML = `<button class="paper-video-btn" type="button">▶ Watch Video</button>`;
      const newBtn = row.querySelector('.paper-video-btn');
      if (questionText) newBtn.dataset.qtext = questionText;
      newBtn.addEventListener('click', () => handleVideoBtn(newBtn));
      handleVideoBtn(newBtn);
    });
  }
}


/* ════════════════════════════════════════
   YOUTUBE DATA API
════════════════════════════════════════ */

function _scoreTitle(title, keywords) {
  const t = title.toLowerCase();
  
  // NEW: Negative filter for non-English indicators
  const blacklist = ['hindi', 'urdu', 'tamil', 'malayalam', 'telugu', 'cbse', 'ncert', 'jee', 'neet'];
  if (blacklist.some(word => t.includes(word))) return -100; // Hard reject

  if (!keywords?.length) return 1;
  return keywords.filter(kw => t.includes(kw.toLowerCase())).length;
}

async function _ytSearch(query, keywords, isPrimary) {
  const duration = isPrimary ? 'any' : 'medium';

  const token = await window._getAuthToken();
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '5',
    videoEmbeddable: 'true',
    safeSearch: 'strict',
    videoDuration: duration,
    relevanceLanguage: 'en',
    regionCode: 'NG',
    q: query + ' English',
  });

  const res = await fetch(`/api/ai/youtube?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`YouTube API ${res.status}`);
  const data = await res.json();
  if (!data.items?.length) return null;

  const scored = data.items.map(item => ({
    item,
    score: _scoreTitle(item.snippet.title, keywords),
  }));

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  
  // Only accept if it matched at least one positive keyword and didn't hit the blacklist
  if (best.score < 1) return null; 

  const item = best.item;
  return {
    videoId  : item.id.videoId,
    title    : item.snippet.title,
    channel  : item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
  };
}

