const examQuestions = [
  // ======================== PAGE 1 (Questions 1–5) ========================
  {
    question:
      "From the list of words lettered A to D, choose the one that is most nearly opposite in meaning to the underlined word and that will, at the same time, correctly fill the gap in the sentence.<br><br>A guest should not make <b>derogatory</b> remarks about what he is offered by his host but __________ statements.",
    image: null,
    options: ["candid", "appealing", "polite", "complimentary"],
    correctIndex: 3,
    hint: "Derogatory means insulting or showing disrespect. The opposite would be praising or flattering.",
    explanation: [
      "Complimentary means expressing praise or admiration, the opposite of derogatory.",
    ],
  },
  {
    question:
      "From the list of words lettered A to D, choose the one that is most nearly opposite in meaning to the underlined word and that will, at the same time, correctly fill the gap in the sentence.<br><br>The audience <b>applauded</b> the last speaker, but the first was __________.",
    image: null,
    options: ["booed", "rejected", "abused", "scorned"],
    correctIndex: 0,
    hint: "Applauded means clapped approvingly. The opposite is expressing disapproval vocally.",
    explanation: [
      "Booed is the direct opposite of applauded in an audience context.",
    ],
  },
  {
    question:
      "From the list of words lettered A to D, choose the one that is most nearly opposite in meaning to the underlined word and that will, at the same time, correctly fill the gap in the sentence.<br><br>The commander said that <b>raw</b> recruits could not dislodge the enemies: he needed __________ men.",
    image: null,
    options: ["skilled", "practical", "learned", "seasoned"],
    correctIndex: 3,
    hint: "Raw means inexperienced or untrained. The opposite is experienced or well-trained.",
    explanation: [
      "Seasoned means experienced and well-trained, opposite of raw.",
    ],
  },
  {
    question:
      "From the list of words lettered A to D, choose the one that is most nearly opposite in meaning to the underlined word and that will, at the same time, correctly fill the gap in the sentence.<br><br>John gave a <b>fictitious</b> account of the incident but his son's account was __________.",
    image: null,
    options: ["probable", "compelling", "factual", "necessary"],
    correctIndex: 2,
    hint: "Fictitious means made up or false. The opposite is true or based on facts.",
    explanation: [
      "Factual means based on facts and reality, opposite of fictitious.",
    ],
  },
  {
    question:
      "From the list of words lettered A to D, choose the one that is most nearly opposite in meaning to the underlined word and that will, at the same time, correctly fill the gap in the sentence.<br><br>While the refuse dump smelled <b>fetid</b>, the orchard exuded a __________ smell.",
    image: null,
    options: ["fragrant", "spicy", "clean", "dry"],
    correctIndex: 0,
    hint: "Fetid means smelling extremely unpleasant. The opposite is pleasant-smelling.",
    explanation: [
      "Fragrant means having a pleasant sweet smell, opposite of fetid.",
    ],
  },

  // ======================== PAGE 2 (Questions 6–10) ========================
  {
    question:
      "From the list of words lettered A to D, choose the one that is most nearly opposite in meaning to the underlined word and that will, at the same time, correctly fill the gap in the sentence.<br><br>Only some of the accused were <b>acquitted</b>; the rest were __________.",
    image: null,
    options: ["remanded", "convicted", "detained", "interdicted"],
    correctIndex: 1,
    hint: "Acquitted means found not guilty. The opposite is found guilty.",
    explanation: [
      "Convicted means declared guilty of a crime, opposite of acquitted.",
    ],
  },
  {
    question:
      "From the list of words lettered A to D, choose the one that is most nearly opposite in meaning to the underlined word and that will, at the same time, correctly fill the gap in the sentence.<br><br>The principal chastised Ben for his use of <b>coarse</b> language and advised him to emulate his sister's __________ behaviour.",
    image: null,
    options: ["pure", "neat", "refined", "organised"],
    correctIndex: 2,
    hint: "Coarse means vulgar or rude. The opposite is polite and cultured.",
    explanation: ["Refined means elegant and cultured, opposite of coarse."],
  },
  {
    question:
      "From the list of words lettered A to D, choose the one that is most nearly opposite in meaning to the underlined word and that will, at the same time, correctly fill the gap in the sentence.<br><br>It would have been my pleasure to <b>accept</b> your invitation but I have to __________ it because of a previous engagement.",
    image: null,
    options: ["jettison", "defer", "suspend", "decline"],
    correctIndex: 3,
    hint: "Accept means to agree to take. The opposite is to refuse.",
    explanation: ["Decline means to refuse politely, opposite of accept."],
  },
  {
    question:
      "From the list of words lettered A to D, choose the one that is most nearly opposite in meaning to the underlined word and that will, at the same time, correctly fill the gap in the sentence.<br><br>Older people are expected to be __________ where youths are <b>green</b>.",
    image: null,
    options: ["experienced", "cautious", "equipped", "considerate"],
    correctIndex: 0,
    hint: "Green means inexperienced or immature. The opposite is experienced.",
    explanation: [
      "Experienced means having knowledge and skill from practice, opposite of green.",
    ],
  },
  {
    question:
      "From the list of words lettered A to D, choose the one that is most nearly opposite in meaning to the underlined word and that will, at the same time, correctly fill the gap in the sentence.<br><br>I <b>accidentally</b> stepped on my brother but he told Mummy I did it __________.",
    image: null,
    options: ["thoughtfully", "intuitively", "deliberately", "annoyingly"],
    correctIndex: 2,
    hint: "Accidentally means unintentionally. The opposite is on purpose.",
    explanation: [
      "Deliberately means done intentionally, opposite of accidentally.",
    ],
  },

  // ======================== PAGE 3 (Questions 11–15) ========================
  {
    question:
      "From the words lettered A to D, choose the word that best completes each of the following sentences.<br><br>The runner was __________ at fifteen seconds at the end of the race.",
    image: null,
    options: ["taped", "timed", "belled", "flagged"],
    correctIndex: 1,
    hint: "Runners are measured by the time they take to complete a race.",
    explanation: ["Timed means having the duration measured with a stopwatch."],
  },
  {
    question:
      "From the words lettered A to D, choose the word that best completes each of the following sentences.<br><br>The appellate court has __________ the decision of the lower court.",
    image: null,
    options: ["obstructed", "nullified", "neutralized", "balanced"],
    correctIndex: 1,
    hint: "An appellate court can cancel or overturn a lower court's decision.",
    explanation: ["Nullified means made legally void or cancelled."],
  },
  {
    question:
      "From the words lettered A to D, choose the word that best completes each of the following sentences.<br><br>The defeated boxer left the ring looking extremely __________.",
    image: null,
    options: ["dislocated", "distorted", "desert", "dejected"],
    correctIndex: 3,
    hint: "A loser in a match would look sad or downcast.",
    explanation: ["Dejected means sad and depressed, typically after a loss."],
  },
  {
    question:
      "From the words lettered A to D, choose the word that best completes each of the following sentences.<br><br>There is an election __________ pending against the senator.",
    image: null,
    options: ["application", "appeal", "petition", "complaint"],
    correctIndex: 2,
    hint: "A formal written request challenging an election result is called a petition.",
    explanation: [
      "An election petition is a legal challenge to the outcome of an election.",
    ],
  },
  {
    question:
      "From the words lettered A to D, choose the word that best completes each of the following sentences.<br><br>The manager was not in when Addo called, so he left his __________ card.",
    image: null,
    options: [
      "supplementary",
      "complimentary",
      "complementary",
      "identification",
    ],
    correctIndex: 1,
    hint: "A card left when visiting someone who is not available is a visiting card.",
    explanation: [
      "A complimentary card (or visiting card) is left when the person is not present.",
    ],
  },

  // ======================== PAGE 4 (Questions 16–20) ========================
  {
    question:
      "From the words lettered A to D, choose the word that best completes each of the following sentences.<br><br>Coming from the kitchen was the sweet __________ of Mummy's soup.",
    image: null,
    options: ["aroma", "odour", "fragrance", "scent"],
    correctIndex: 0,
    hint: "A pleasant smell from cooking is often called an aroma.",
    explanation: [
      "Aroma refers to a pleasant, distinctive smell, especially of food.",
    ],
  },
  {
    question:
      "From the words lettered A to D, choose the word that best completes each of the following sentences.<br><br>There is a need to raise teachers' salary in order to boost their __________.",
    image: null,
    options: ["spirit", "moral", "soul", "morale"],
    correctIndex: 3,
    hint: "The word for confidence and enthusiasm of a group is morale.",
    explanation: [
      "Morale refers to the confidence, enthusiasm, and discipline of a person or group.",
    ],
  },
  {
    question:
      "From the words lettered A to D, choose the word that best completes each of the following sentences.<br><br>The librarian has not entered the new books in the __________.",
    image: null,
    options: ["catalogue", "roster", "list", "directory"],
    correctIndex: 0,
    hint: "Libraries use a systematic list of all their books.",
    explanation: [
      "A catalogue is a complete list of items, typically in alphabetical or systematic order.",
    ],
  },
  {
    question:
      "From the words lettered A to D, choose the word that best completes each of the following sentences.<br><br>The textbook is very costly; I cannot __________ it to my students.",
    image: null,
    options: ["commit", "afford", "endorse", "recommend"],
    correctIndex: 1,
    hint: "If something is too expensive, you cannot pay for it.",
    explanation: ["Afford means to have enough money to pay for something."],
  },
  {
    question:
      "From the words lettered A to D, choose the word that best completes each of the following sentences.<br><br>The weather is too hot; I need some water to __________ my thirst.",
    image: null,
    options: ["wet", "quench", "cool", "soak"],
    correctIndex: 1,
    hint: "The verb used with thirst is 'quench'.",
    explanation: ["Quench means to satisfy (one's thirst) by drinking."],
  },

  // ======================== PAGE 5 (Questions 21–25) ========================
  {
    question:
      "Choose the interpretation that is most appropriate for each sentence.<br><br>My grandmother once told me that old habits die hard. This means that old habits are __________.",
    image: null,
    options: [
      "easily corrected",
      "difficult to change",
      "short-lived",
      "forever changing",
    ],
    correctIndex: 1,
    hint: "Die hard means to disappear or cease only after a long struggle.",
    explanation: ["Old habits are difficult to break or change."],
  },
  {
    question:
      "Choose the interpretation that is most appropriate for each sentence.<br><br>If you ask him to sing, he will do it at the drop of a hat. This means that he will sing __________.",
    image: null,
    options: ["joyfully", "melodiously", "immediately", "sluggishly"],
    correctIndex: 2,
    hint: "At the drop of a hat means without any delay or hesitation.",
    explanation: ["He will sing immediately upon being asked."],
  },
  {
    question:
      "Choose the interpretation that is most appropriate for each sentence.<br><br>The man has lost a lot and he only keeps up appearances by driving a big car. This means that the man __________.",
    image: null,
    options: [
      "intends to work harder",
      "pretends that all is well",
      "wants everybody to see him",
      "wants to please his people",
    ],
    correctIndex: 1,
    hint: "Keeps up appearances means to maintain an outward show of prosperity or well-being despite difficulties.",
    explanation: ["He pretends that everything is fine even though it is not."],
  },
  {
    question:
      "Choose the interpretation that is most appropriate for each sentence.<br><br>The game was tough but our team lost by a whisker. This means that our team lost by __________.",
    image: null,
    options: [
      "default",
      "a wide margin",
      "not preparing well",
      "a narrow margin",
    ],
    correctIndex: 3,
    hint: "By a whisker means by a very small margin.",
    explanation: ["They lost by a very small or narrow margin."],
  },
  {
    question:
      "Choose the interpretation that is most appropriate for each sentence.<br><br>When the result was announced, it was discovered that Bimbo and Pam were neck and neck. This means that Bimbo and Pam __________.",
    image: null,
    options: [
      "had almost the same result",
      "failed badly",
      "had equal result",
      "passed well",
    ],
    correctIndex: 0,
    hint: "Neck and neck means very close or level in a race or competition.",
    explanation: ["They had almost the same result, very close together."],
  },

  // ======================== PAGE 6 (Questions 26–30) ========================
  {
    question:
      "Choose the interpretation that is most appropriate for each sentence.<br><br>The old woman's birthday was marked by her children with pomp. This means that the birthday was __________.",
    image: null,
    options: [
      "greatly celebrated",
      "remembered fondly",
      "widely advertised",
      "filmed and played back",
    ],
    correctIndex: 0,
    hint: "With pomp means with splendid display or ceremony.",
    explanation: [
      "The birthday was greatly celebrated with ceremony and splendor.",
    ],
  },
  {
    question:
      "Choose the interpretation that is most appropriate for each sentence.<br><br>When the man was accused of stealing the money, nobody raised an eyebrow. This means that nobody was __________.",
    image: null,
    options: ["sad", "pleased", "interested", "surprised"],
    correctIndex: 3,
    hint: "Raise an eyebrow means to show surprise, disbelief, or mild disapproval.",
    explanation: ["Nobody was surprised or shocked by the accusation."],
  },
  {
    question:
      "Choose the interpretation that is most appropriate for each sentence.<br><br>People do not often rely on men who allow their exalted position to go to their head. This means that people shun those who __________.",
    image: null,
    options: [
      "are highly placed",
      "are conceited because of their position",
      "are rude because of their position",
      "do not do their work",
    ],
    correctIndex: 1,
    hint: "To let something go to your head means to become conceited or arrogant because of it.",
    explanation: [
      "People shun those who become conceited or arrogant due to their high position.",
    ],
  },
  {
    question:
      "Choose the interpretation that is most appropriate for each sentence.<br><br>The manager hit the roof when he was presented with the estimate for the new project. This means that the manager __________.",
    image: null,
    options: [
      "mobilised the workers",
      "became very angry",
      "became very suspicious",
      "cancelled the project",
    ],
    correctIndex: 1,
    hint: "Hit the roof means to become very angry.",
    explanation: ["The manager became very angry."],
  },
  {
    question:
      "Choose the interpretation that is most appropriate for each sentence.<br><br>When he received the news that he had lost the election, he did not bat an eyelid. This means that he __________.",
    image: null,
    options: [
      "expected to lose the election",
      "stood perfectly still",
      "was shocked to have lost the election",
      "showed no feelings",
    ],
    correctIndex: 3,
    hint: "Not bat an eyelid means to show no surprise or emotion.",
    explanation: ["He showed no feelings or reaction to the news."],
  },

  // ======================== PAGE 7 (Questions 31–35) ========================
  {
    question:
      "Choose the word or group of words that is nearest in meaning to the underlined word as it is used in the sentence.<br><br>The boy was <b>reluctant</b> to carry out the order of his senior.",
    image: null,
    options: ["adamant", "slow", "sluggish", "unwilling"],
    correctIndex: 3,
    hint: "Reluctant means hesitant or unwilling to do something.",
    explanation: ["Unwilling means not ready or eager to do something."],
  },
  {
    question:
      "Choose the word or group of words that is nearest in meaning to the underlined word as it is used in the sentence.<br><br>Dr. Azeez <b>declined</b> the offer to chair the meeting.",
    image: null,
    options: ["rescinded", "shunned", "refused", "avoided"],
    correctIndex: 2,
    hint: "Declined means politely refused.",
    explanation: [
      "Refused means to indicate that one is not willing to do or accept something.",
    ],
  },
  {
    question:
      "Choose the word or group of words that is nearest in meaning to the underlined word as it is used in the sentence.<br><br>The match came to an <b>abrupt</b> end when the rain started.",
    image: null,
    options: ["sharp", "brisk", "quick", "sudden"],
    correctIndex: 3,
    hint: "Abrupt means sudden and unexpected.",
    explanation: ["Sudden means occurring or done quickly and unexpectedly."],
  },
  {
    question:
      "Choose the word or group of words that is nearest in meaning to the underlined word as it is used in the sentence.<br><br>The boy came through the window as <b>stealthily</b> as he could.",
    image: null,
    options: ["quietly", "carefully", "quickly", "slowly"],
    correctIndex: 0,
    hint: "Stealthily means in a cautious and secretive way, trying to avoid notice.",
    explanation: [
      "Quietly means with little or no sound, trying not to be heard.",
    ],
  },
  {
    question:
      "Choose the word or group of words that is nearest in meaning to the underlined word as it is used in the sentence.<br><br>Bimbo was <b>satisfied</b> with the result she got.",
    image: null,
    options: ["positive", "surprised", "contented", "appeased"],
    correctIndex: 2,
    hint: "Satisfied means pleased with what has been achieved.",
    explanation: [
      "Contented means feeling or showing satisfaction with one's possessions or situation.",
    ],
  },

  // ======================== PAGE 8 (Questions 36–40) ========================
  {
    question:
      "Choose the word or group of words that is nearest in meaning to the underlined word as it is used in the sentence.<br><br>It is <b>absurd</b> that people find it difficult to be honest.",
    image: null,
    options: ["strange", "abnormal", "alarming", "interesting"],
    correctIndex: 0,
    hint: "Absurd means wildly unreasonable, illogical, or inappropriate.",
    explanation: [
      "Strange means unusual or surprising in a way that is unsettling.",
    ],
  },
  {
    question:
      "Choose the word or group of words that is nearest in meaning to the underlined word as it is used in the sentence.<br><br>Even a <b>mediocre</b> student can pass that test.",
    image: null,
    options: ["dull", "fresh", "average", "lazy"],
    correctIndex: 2,
    hint: "Mediocre means of only moderate quality, not very good.",
    explanation: ["Average means typical or ordinary, not exceptional."],
  },
  {
    question:
      "Choose the word or group of words that is nearest in meaning to the underlined word as it is used in the sentence.<br><br>We called the carpenter to <b>repair</b> the broken door.",
    image: null,
    options: ["restore", "renovate", "replace", "mend"],
    correctIndex: 3,
    hint: "Repair means to fix something that is broken or damaged.",
    explanation: ["Mend means to repair something that is broken or damaged."],
  },
  {
    question:
      "Choose the word or group of words that is nearest in meaning to the underlined word as it is used in the sentence.<br><br>Mrs. Okpala gave the drunk a <b>contemptuous</b> look.",
    image: null,
    options: ["happy", "sorrowful", "knowing", "scornful"],
    correctIndex: 3,
    hint: "Contemptuous means showing contempt or scorn.",
    explanation: ["Scornful means feeling or expressing contempt or derision."],
  },
  {
    question:
      "Choose the word or group of words that is nearest in meaning to the underlined word as it is used in the sentence.<br><br>The Vice-Chancellor's speech at the occasion was <b>misconstrued</b>.",
    image: null,
    options: ["misrepresented", "misquoted", "misunderstood", "misreported"],
    correctIndex: 2,
    hint: "Misconstrued means interpreted wrongly.",
    explanation: ["Misunderstood means incorrectly interpreted or understood."],
  },

  // ======================== PAGE 9 (Questions 41–45) ========================
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>The soldiers lay _______ the town to arrest the terrorists.",
    image: null,
    options: ["siege on", "siege to", "siege with", "siege by"],
    correctIndex: 1,
    hint: "The correct collocation is 'lay siege to'.",
    explanation: [
      "Lay siege to means to surround a place with armed forces to capture it.",
    ],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>Power has not been restored _________ many parts of the town.",
    image: null,
    options: ["to", "in", "of", "with"],
    correctIndex: 0,
    hint: "Restore is followed by 'to' when indicating a place.",
    explanation: [
      "Restored to means brought back to a previous state or condition.",
    ],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>We got to the hall after the play ________ started.",
    image: null,
    options: ["is", "have", "had", "was"],
    correctIndex: 2,
    hint: "Use past perfect tense for an action completed before another past action.",
    explanation: ["Had started indicates the play began before they arrived."],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>The woman said the maid should ________ all the plates before going to bed.",
    image: null,
    options: ["wash out", "wash up", "wash off", "wash away"],
    correctIndex: 1,
    hint: "Wash up means to wash dishes and cutlery after a meal.",
    explanation: ["Wash up is the phrasal verb used for cleaning dishes."],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>John, would you mind lifting the box? _______",
    image: null,
    options: ["yes, i do", "No, i wouldn't", "Yes, i wouldn't", "No, i don't"],
    correctIndex: 1,
    hint: "Respond to 'would you mind' with a negative to indicate willingness.",
    explanation: ["No, I wouldn't means you are willing to help."],
  },

  // ======================== PAGE 10 (Questions 46–50) ========================
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>It was a long poem, but Rasheed learnt it ________",
    image: null,
    options: ["from memory", "to memory", "by heart", "to heart"],
    correctIndex: 2,
    hint: "The correct idiom is 'learn by heart'.",
    explanation: ["Learn by heart means to memorize something exactly."],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>Let's begin all over again, _________",
    image: null,
    options: ["may we", "shall we", "can we", "must we"],
    correctIndex: 1,
    hint: "Question tag for 'Let's' is 'shall we'.",
    explanation: [
      "Shall we is the standard tag question for imperative sentences beginning with Let's.",
    ],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>Something must be wrong with the school driver, he is _________ today.",
    image: null,
    options: [
      "rather driving carelessly",
      "carelessly driving rather",
      "driving rather carelessly",
      "rather carelessly driving",
    ],
    correctIndex: 2,
    hint: "The correct word order is verb + adverb of degree + adverb of manner.",
    explanation: ["Driving rather carelessly is the correct order."],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>What I admire about our football team is that they love ________",
    image: null,
    options: ["themselves", "one another", "the other", "ourselves"],
    correctIndex: 1,
    hint: "For mutual love within a group of more than two, use 'one another'.",
    explanation: [
      "One another is used for reciprocal actions among three or more people.",
    ],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>This is the teacher _______ told me the answer.",
    image: null,
    options: ["whom I said", "who I said", "who I said he", "I said that he"],
    correctIndex: 1,
    hint: "The relative pronoun 'who' is used as the subject of the clause.",
    explanation: [
      "Who I said told me the answer is correct because 'I said' is parenthetical.",
    ],
  },
  // ======================== PAGE 11 (Questions 51–55) ========================
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>Mary shouldn't have disobeyed the teacher, _________?",
    image: null,
    options: ["should she", "didn't she", "did she", "could he"],
    correctIndex: 0,
    hint: "For negative statements with 'shouldn't have', the tag is positive 'should she'.",
    explanation: [
      "Mary shouldn't have disobeyed, should she? is the correct question tag.",
    ],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>She wondered if the water was not _________ hot for drinking.",
    image: null,
    options: ["very", "so", "much", "too"],
    correctIndex: 3,
    hint: "The structure 'too + adjective + for something' indicates excess.",
    explanation: ["'Too hot for drinking' means excessively hot to drink."],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>I told him not to play _______ fire.",
    image: null,
    options: ["on", "with", "beneath", "upon"],
    correctIndex: 1,
    hint: "The correct collocation is 'play with fire'.",
    explanation: [
      "'Play with fire' means to engage in a dangerous or risky activity.",
    ],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>We enjoyed ourselves ________ much at the party.",
    image: null,
    options: ["too", "that", "as", "very"],
    correctIndex: 3,
    hint: "'Very' is used to emphasize the degree of enjoyment.",
    explanation: ["'Very much' is a common intensifier meaning greatly."],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>You will need to commit the formula ________ memory.",
    image: null,
    options: ["to", "in", "for", "by"],
    correctIndex: 0,
    hint: "The idiom is 'commit to memory'.",
    explanation: [
      "'Commit to memory' means to learn something so that you remember it.",
    ],
  },

  // ======================== PAGE 12 (Questions 56–60) ========================
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>The ushers told the people to _________ their shoes before they enter the hall.",
    image: null,
    options: ["put off", "put out", "take off", "take out"],
    correctIndex: 2,
    hint: "The phrasal verb for removing clothing or shoes is 'take off'.",
    explanation: ["'Take off' means to remove something you are wearing."],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>That book is neither _________",
    image: null,
    options: [
      "his or yours",
      "his not yours",
      "his nor yours",
      "his own nor yours",
    ],
    correctIndex: 2,
    hint: "The correlative conjunction pair is 'neither...nor'.",
    explanation: [
      "'Neither his nor yours' correctly uses the pair neither/nor.",
    ],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>The boy vomited a lot on the journey, doctor told us he suffered from ________",
    image: null,
    options: [
      "travel sickness",
      "travelling sickness",
      "travel sicknesses",
      "traveller sickness",
    ],
    correctIndex: 0,
    hint: "The condition is commonly called 'travel sickness'.",
    explanation: [
      "'Travel sickness' is motion sickness experienced during travel.",
    ],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>The man gave the girl a _________ fountain pen.",
    image: null,
    options: [
      "small new blue",
      "blue small new",
      "blue new small",
      "new small blue",
    ],
    correctIndex: 3,
    hint: "Adjective order: opinion/age/size/color/material.",
    explanation: ["'New small blue' follows the order: age, size, color."],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>I realized that i ________ you before.",
    image: null,
    options: ["had met", "met", "have met", "meet"],
    correctIndex: 0,
    hint: "Past perfect is used for an action completed before another past action.",
    explanation: [
      "'Had met' indicates meeting happened before the realization.",
    ],
  },

  // ======================== PAGE 13 (Questions 61–65) ========================
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>The boy had been warned not to _________ the money given to him.",
    image: null,
    options: ["loosen", "loose", "lost", "lose"],
    correctIndex: 3,
    hint: "'Lose' means to misplace or fail to keep.",
    explanation: [
      "'Lose' is the correct verb meaning to misplace or fail to retain.",
    ],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>The police officer was sacked because he gave _________ the command's secret.",
    image: null,
    options: ["off", "in", "away", "up"],
    correctIndex: 2,
    hint: "'Give away' means to reveal or disclose a secret.",
    explanation: ["'Gave away' means to disclose or betray a secret."],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>He bought a new set of _________ television.",
    image: null,
    options: ["coloured", "colour", "colours", "colouring"],
    correctIndex: 1,
    hint: "'Colour television' uses the noun 'colour' as an attributive noun.",
    explanation: ["'Colour television' is the standard compound noun."],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>The newspaper reported that ________ everybody died in the accident.",
    image: null,
    options: ["hardly", "almost", "scarcely", "barely"],
    correctIndex: 1,
    hint: "'Almost' means nearly all, which fits the context.",
    explanation: ["'Almost everybody' means nearly everyone."],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>He isn't coming here, _________?",
    image: null,
    options: ["is he", "isn't he", "doesn't he", "does he"],
    correctIndex: 0,
    hint: "For a negative statement, the tag is positive.",
    explanation: ["'Isn't coming' → positive tag 'is he'."],
  },

  // ======================== PAGE 14 (Questions 66–70) ========================
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>__________ are often quite caring.",
    image: null,
    options: [
      "mother-in-law",
      "mother-in-laws",
      "mothers-in-laws",
      "mothers-in-law",
    ],
    correctIndex: 3,
    hint: "The plural of compound noun 'mother-in-law' is 'mothers-in-law'.",
    explanation: ["Plural is formed on the main noun: mothers-in-law."],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>A spoilt child is usually prone ________ laziness.",
    image: null,
    options: ["to", "for", "with", "at"],
    correctIndex: 0,
    hint: "'Prone' is followed by the preposition 'to'.",
    explanation: ["'Prone to' means having a tendency to do something."],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>We do not accept the punishment __________ the boy.",
    image: null,
    options: ["meted to", "meted on", "meted out to", "meted in to"],
    correctIndex: 2,
    hint: "'Meted out to' is the correct phrasal verb meaning to give or assign punishment.",
    explanation: [
      "'Meted out to' means to dispense or give punishment to someone.",
    ],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>The team practised intensely for weeks before the match ________ it lost.",
    image: null,
    options: ["still yet", "for", "yet", "despite"],
    correctIndex: 2,
    hint: "'Yet' is used to contrast the effort with the result.",
    explanation: [
      "'Yet' introduces a contrasting idea: despite practice, they lost.",
    ],
  },
  {
    question:
      "From the words or group of words lettered A to D, choose the word or group of words that best completes each of the following sentences.<br><br>You cannot come between my sister and ________",
    image: null,
    options: ["myself", "me", "I", "mine"],
    correctIndex: 1,
    hint: "The pronoun after 'between' should be in object form.",
    explanation: [
      "'Between' is a preposition, so use the object pronoun 'me'.",
    ],
  },

  // ======================== PAGE 15 (Cloze Passage Questions 71–75) ========================
  {
    question:
      "In the following passage, the numbered gaps indicate missing words. Choose the most appropriate option for the gap labelled [71].<br><br>Hardly a day passes without news of terrible accidents on our roads. Most of the time, these are caused by the ignorance and __________ of drivers.",
    image: null,
    options: ["forgetfulness", "carelessness", "wickedness", "doubtfulness"],
    correctIndex: 1,
    hint: "Accidents are often caused by lack of attention or care.",
    explanation: [
      "Carelessness means lack of attention or concern, a common cause of accidents.",
    ],
  },
  {
    question:
      "In the following passage, the numbered gaps indicate missing words. Choose the most appropriate option for the gap labelled [72].<br><br>Besides the ignorance of the drivers, most of the vehicles that ply our roads are not __________.",
    image: null,
    options: ["road-friendly", "roadworthy", "streetwise", "road-tested"],
    correctIndex: 1,
    hint: "Vehicles need to be safe and fit for the road.",
    explanation: ["Roadworthy means fit to be used on the road."],
  },
  {
    question:
      "In the following passage, the numbered gaps indicate missing words. Choose the most appropriate option for the gap labelled [73].<br><br>Vehicle owners are issued with these certificates even when their vehicles have not been properly __________.",
    image: null,
    options: ["scrutinised", "appraised", "considered", "inspected"],
    correctIndex: 3,
    hint: "Vehicles need to be examined for safety before certification.",
    explanation: [
      "Inspected means examined carefully to ensure safety standards.",
    ],
  },
  {
    question:
      "In the following passage, the numbered gaps indicate missing words. Choose the most appropriate option for the gap labelled [74].<br><br>Most of the drivers do not have valid driver's __________.",
    image: null,
    options: ["document", "papers", "licence", "particulars"],
    correctIndex: 2,
    hint: "A driver's licence is the official document permitting driving.",
    explanation: [
      "Driver's licence is the official document that permits operation of a vehicle.",
    ],
  },
  {
    question:
      "In the following passage, the numbered gaps indicate missing words. Choose the most appropriate option for the gap labelled [75].<br><br>There are driving schools with qualified __________ to prepare prospective drivers.",
    image: null,
    options: ["trainers", "instructors", "experts", "teachers"],
    correctIndex: 1,
    hint: "Driving schools have people who specifically teach driving skills.",
    explanation: [
      "Instructors are people who teach practical skills, such as driving.",
    ],
  },
  // ======================== PAGE 16 (Cloze Passage – Questions 76–80) ========================
  {
    question:
      "In the following passage, the numbered gaps indicate missing words. Choose the most appropriate option for the gap labelled [76].<br><br>Hardly a day passes without news of terrible accidents on our roads. Most of the time, these are caused by the ignorance and <strong>-71-</strong> of drivers. Besides the ignorance of the drivers, most of the vehicles that ply our roads are not <strong>-72-</strong>. Vehicles are supposed to be tested annually before certificates are issued. However, vehicle owners are issued with these certificates even when their vehicles have not been properly <strong>-73-</strong>. Most of the drivers do not have valid driver's <strong>-74-</strong>. There are driving schools with qualified <strong>-75-</strong> to prepare prospective drivers. After a period of training, the prospective drivers are made to go through a road test. It is only when they pass this test that they are <strong>-76-</strong> to drive.",
    image: null,
    options: ["certified", "confirmed", "graded", "accredited"],
    correctIndex: null,
    hint: "Drivers are officially recognised as qualified after passing the test.",
    explanation: [
      "'Certified' means officially recognised as having met certain standards.",
    ],
  },
  {
    question:
      "In the following passage, the numbered gaps indicate missing words. Choose the most appropriate option for the gap labelled [77].<br><br>Some drivers never even had a learner's <strong>-77-</strong> when they were learning to drive.",
    image: null,
    options: ["permit", "clearance", "authority", "order"],
    correctIndex: null,
    hint: "A learner driver needs an official document allowing them to practise driving.",
    explanation: [
      "A learner's permit is a restricted licence for those learning to drive.",
    ],
  },
  {
    question:
      "In the following passage, the numbered gaps indicate missing words. Choose the most appropriate option for the gap labelled [78].<br><br>Consequently, they have no knowledge of <strong>-78-</strong> rules.",
    image: null,
    options: ["expressway", "traffic", "highway", "road"],
    correctIndex: null,
    hint: "Rules that govern the movement of vehicles and pedestrians.",
    explanation: [
      "Traffic rules are the regulations that control the movement of vehicles.",
    ],
  },
  {
    question:
      "In the following passage, the numbered gaps indicate missing words. Choose the most appropriate option for the gap labelled [79].<br><br>They are ignorant of what speed <strong>-79-</strong> means.",
    image: null,
    options: ["distance", "control", "mileage", "limit"],
    correctIndex: null,
    hint: "The maximum legal speed on a road is called the speed limit.",
    explanation: ["Speed limit is the maximum speed allowed by law."],
  },
  {
    question:
      "In the following passage, the numbered gaps indicate missing words. Choose the most appropriate option for the gap labelled [80].<br><br>To them, 100 kilometres per hour may mean minimum speed allowed. Little wonder the <strong>-80-</strong> on our roads.",
    image: null,
    options: ["murder", "scenes", "incidence", "carnage"],
    correctIndex: null,
    hint: "The word describes widespread death and destruction from accidents.",
    explanation: [
      "Carnage means the killing of a large number of people, often used for road accidents.",
    ],
  },

  // ======================== PAGE 17 (Vowel Sounds – Questions 81–85) ========================
  {
    question:
      "<em>Choose the word that has the <strong>same vowel sound</strong> as the one represented by the letter(s) underlined.</em><br><br>W<strong>o</strong>mb",
    image: null,
    options: ["book", "fool", "comb", "bomb"],
    correctIndex: 1,
    hint: "The vowel sound in 'womb' is /uː/ as in 'fool'.",
    explanation: [
      "Womb is pronounced /wuːm/; fool is /fuːl/; book has /ʊ/; comb has /əʊ/; bomb has /ɒ/.",
    ],
  },
  {
    question:
      "<em>Choose the word that has the <strong>same vowel sound</strong> as the one represented by the letter(s) underlined.</em><br><br>D<strong>ir</strong>t",
    image: null,
    options: ["pet", "worth", "sword", "deed"],
    correctIndex: 1,
    hint: "The vowel sound in 'dirt' is /ɜː/ as in 'worth'.",
    explanation: [
      "Dirt is /dɜːt/; worth is /wɜːθ/; pet has /e/; sword has /ɔː/; deed has /iː/.",
    ],
  },
  {
    question:
      "<em>Choose the word that has the <strong>same vowel sound</strong> as the one represented by the letter(s) underlined.</em><br><br>W<strong>or</strong>st",
    image: null,
    options: ["fiery", "cord", "put", "worship"],
    correctIndex: 3,
    hint: "The vowel sound in 'worst' is /ɜː/ as in the first syllable of 'worship'.",
    explanation: [
      "Worst is /wɜːst/; worship starts with /wɜː/; fiery has /aɪə/; cord has /ɔː/; put has /ʊ/.",
    ],
  },
  {
    question:
      "<em>Choose the word that has the <strong>same vowel sound</strong> as the one represented by the letter(s) underlined.</em><br><br>h<strong>a</strong>ll",
    image: null,
    options: ["shortage", "love", "courage", "country"],
    correctIndex: null,
    hint: "The vowel sound in 'hall' is /ɔː/. None of the options clearly contain /ɔː/; 'shortage' has /ɔː/ in the 'or' but the underlined 'a' is not there. This question may require careful listening.",
    explanation: [
      "Hall has the /ɔː/ vowel. The options have various vowels: shortage /ˈʃɔː.tɪdʒ/ contains /ɔː/ in the first syllable, but the underlined letter is 'a' in 'hall'; love /ʌ/; courage /ʌ/; country /ʌ/. The intended answer might be 'shortage' if the test expects the same sound regardless of spelling.",
    ],
  },
  {
    question:
      "<em>Choose the word that has the <strong>same vowel sound</strong> as the one represented by the letter(s) underlined.</em><br><br>p<strong>i</strong>t",
    image: null,
    options: ["blight", "pious", "hatred", "paint"],
    correctIndex: null,
    hint: "The vowel sound in 'pit' is /ɪ/. None of the options contain /ɪ/. Blight /aɪ/, pious /aɪə/, hatred /eɪ/ (first vowel), paint /eɪ/. Possibly a trick question or misprint.",
    explanation: [
      "Pit has the short /ɪ/ vowel. None of the options match; check for possible intended answer: 'hatred' has /eɪ/ not /ɪ/.",
    ],
  },
  // ======================== PAGE 18 (Questions 86–90) ========================
  {
    question:
      "<em>choose the word that has the <strong>same vowel sound</strong> as the one represented by the letter(s) underlined.</em><br><br>p<ins>ai</ins>nt",
    image: null,
    options: ["plait", "lisp", "busy", "late"],
    correctIndex: 3,
    hint: "The vowel sound in 'paint' is /eɪ/ as in 'late'.",
    explanation: [
      "'Paint' is pronounced /peɪnt/ with the diphthong /eɪ/.",
      "'Plait' is /plæt/ (or /pleɪt/ but usually short /æ/), 'lisp' is /lɪsp/, 'busy' is /ˈbɪzi/, and 'late' is /leɪt/.",
      "Only 'late' shares the exact /eɪ/ vowel sound.",
    ],
  },
  {
    question:
      "<em>choose the word that has the <strong>same vowel sound</strong> as the one represented by the letter(s) underlined.</em><br><br>can<ins>oe</ins>",
    image: null,
    options: ["truce", "pull", "doe", "shore"],
    correctIndex: 0,
    hint: "The vowel sound in 'canoe' is /uː/ as in 'truce'.",
    explanation: [
      "'Canoe' is pronounced /kəˈnuː/, with the 'oe' representing /uː/.",
      "'Truce' is /truːs/, also /uː/; 'pull' is /pʊl/ (short /ʊ/); 'doe' is /dəʊ/ (/əʊ/); 'shore' is /ʃɔː/ (/ɔː/).",
      "Only 'truce' has the same long /uː/ vowel.",
    ],
  },
  {
    question:
      "<em>choose the word that has the <strong>same vowel sound</strong> as the one represented by the letter(s) underlined.</em><br><br>f<ins>a</ins>tal",
    image: null,
    options: ["hard", "fat", "beard", "bail"],
    correctIndex: 3,
    hint: "The vowel sound in 'fatal' is /eɪ/ as in 'bail'.",
    explanation: [
      "'Fatal' is /ˈfeɪ.təl/, with the first 'a' producing /eɪ/.",
      "'Hard' is /hɑːd/ (/ɑː/); 'fat' is /fæt/ (/æ/); 'beard' is /bɪəd/ (/ɪə/); 'bail' is /beɪl/ (/eɪ/).",
      "Thus 'bail' matches the /eɪ/ diphthong.",
    ],
  },
  {
    question:
      "<em>choose the word that has the <strong>same vowel sound</strong> as the one represented by the letter(s) underlined.</em><br><br><ins>jeo</ins>pardy",
    image: null,
    options: ["check", "people", "probe", "fired"],
    correctIndex: 0,
    hint: "The vowel sound in 'jeopardy' is /ɛ/ as in 'check'.",
    explanation: [
      "'Jeopardy' is pronounced /ˈdʒɛp.ə.di/, with the 'e' in 'jep' giving the short /ɛ/ sound.",
      "'Check' is /tʃɛk/ (/ɛ/); 'people' is /ˈpiː.pəl/ (/iː/); 'probe' is /prəʊb/ (/əʊ/); 'fired' is /faɪəd/ (/aɪə/).",
      "Only 'check' contains the same /ɛ/ vowel.",
    ],
  },
  {
    question:
      "<em>choose the word that has the <strong>same vowel sound</strong> as the one represented by the letter(s) underlined.</em><br><br>st<ins>u</ins>ff",
    image: null,
    options: ["tune", "hoof", "tough", "doff"],
    correctIndex: 2,
    hint: "The vowel sound in 'stuff' is /ʌ/ as in 'tough'.",
    explanation: [
      "'Stuff' is /stʌf/ with the short /ʌ/ vowel.",
      "'Tune' is /tjuːn/ (/uː/ or /juː/); 'hoof' is /huːf/ or /hʊf/ (usually /uː/ or /ʊ/); 'tough' is /tʌf/ (/ʌ/); 'doff' is /dɒf/ (/ɒ/).",
      "'Tough' shares the exact /ʌ/ sound.",
    ],
  },

  // ======================== PAGE 19 (Questions 91–95) ========================
  {
    question:
      "<em>choose the word that has the <strong>same vowel sound</strong> as the one represented by the letter(s) underlined.</em><br><br>b<ins>ear</ins>",
    image: null,
    options: ["her", "year", "fare", "pie"],
    correctIndex: 2,
    hint: "The vowel sound in 'bear' is /eə/ as in 'fare'.",
    explanation: [
      "'Bear' is /beər/ with the centring diphthong /eə/.",
      "'Her' is /hɜː/ (/ɜː/); 'year' is /jɪər/ or /jɜː/ (usually /ɪə/); 'fare' is /feər/ (/eə/); 'pie' is /paɪ/ (/aɪ/).",
      "'Fare' gives the same /eə/ sound.",
    ],
  },
  {
    question:
      "<em>choose the word that has the <strong>same vowel sound</strong> as the one represented by the letter(s) underlined.</em><br><br>b<ins>oi</ins>l",
    image: null,
    options: ["coy", "soul", "how", "mode"],
    correctIndex: 0,
    hint: "The vowel sound in 'boil' is /ɔɪ/ as in 'coy'.",
    explanation: [
      "'Boil' is /bɔɪl/ with the diphthong /ɔɪ/.",
      "'Coy' is /kɔɪ/ (/ɔɪ/); 'soul' is /səʊl/ (/əʊ/); 'how' is /haʊ/ (/aʊ/); 'mode' is /məʊd/ (/əʊ/).",
      "Only 'coy' matches the /ɔɪ/ sound.",
    ],
  },
  {
    question:
      "<em>choose the word that has the <strong>same vowel sound</strong> as the one represented by the letter(s) underlined.</em><br><br>m<ins>a</ins>n",
    image: null,
    options: ["tape", "slash", "palm", "barn"],
    correctIndex: 1,
    hint: "The vowel sound in 'man' is /æ/ as in 'slash'.",
    explanation: [
      "'Man' is /mæn/ with the short /æ/ vowel.",
      "'Tape' is /teɪp/ (/eɪ/); 'slash' is /slæʃ/ (/æ/); 'palm' is /pɑːm/ (/ɑː/); 'barn' is /bɑːn/ (/ɑː/).",
      "'Slash' contains the same /æ/ sound.",
    ],
  },
  {
    question:
      "<em>choose the word that has the <strong>same vowel sound</strong> as the one represented by the letter(s) underlined.</em><br><br>h<ins>ear</ins>t",
    image: null,
    options: ["lust", "clear", "star", "heat"],
    correctIndex: 2,
    hint: "The vowel sound in 'heart' is /ɑː/ as in 'star'.",
    explanation: [
      "'Heart' is /hɑːt/, with the long open back vowel /ɑː/.",
      "'Lust' is /lʌst/ (/ʌ/); 'clear' is /klɪər/ (/ɪə/); 'star' is /stɑː/ (/ɑː/); 'heat' is /hiːt/ (/iː/).",
      "'Star' has the identical /ɑː/ sound.",
    ],
  },
  {
    question:
      "<em>choose the word that has the <strong>same vowel sound</strong> as the one represented by the letter(s) underlined.</em><br><br>f<ins>au</ins>lt",
    image: null,
    options: ["brought", "bowl", "loan", "laugh"],
    correctIndex: 0,
    hint: "The vowel sound in 'fault' is /ɔː/ as in 'brought'.",
    explanation: [
      "'Fault' is /fɔːlt/ with the /ɔː/ vowel.",
      "'Brought' is /brɔːt/ (/ɔː/); 'bowl' is /bəʊl/ (/əʊ/); 'loan' is /ləʊn/ (/əʊ/); 'laugh' is /lɑːf/ (/ɑː/).",
      "'Brought' shares the /ɔː/ sound.",
    ],
  },

  // ======================== PAGE 20 (Questions 96–100) – Consonant sounds ========================
  {
    question:
      "<em>choose the word that has the <strong>same consonant sound(s)</strong> as the one represented by the letter(s) underlined.</em><br><br><ins>g</ins>irl",
    image: null,
    options: ["badge", "gist", "bringing", "examine"],
    correctIndex: 2,
    hint: "The consonant sound in 'girl' is /ɡ/ as in 'bringing'.",
    explanation: [
      "'Girl' begins with the voiced velar plosive /ɡ/.",
      "'Badge' has /dʒ/; 'gist' has /dʒ/; 'bringing' has /ɡ/ (the 'g' in 'bring'); 'examine' also has /ɡ/ but the WAEC key commonly selects 'bringing'.",
      "Thus 'bringing' is the intended answer.",
    ],
  },
  {
    question:
      "<em>choose the word that has the <strong>same consonant sound(s)</strong> as the one represented by the letter(s) underlined.</em><br><br><ins>h</ins>eight",
    image: null,
    options: ["house", "heir", "honest", "hour"],
    correctIndex: 0,
    hint: "The consonant sound in 'height' is /h/ as in 'house'.",
    explanation: [
      "'Height' starts with the voiceless glottal fricative /h/.",
      "'House' begins with /h/; 'heir', 'honest', and 'hour' all have a silent 'h' (pronounced /eər/, /ɒnɪst/, /aʊər/).",
      "Only 'house' has the /h/ sound.",
    ],
  },
  {
    question:
      "<em>choose the word that has the <strong>same consonant sound(s)</strong> as the one represented by the letter(s) underlined.</em><br><br><ins>p</ins>ine",
    image: null,
    options: ["psalm", "push", "empty", "phone"],
    correctIndex: 1,
    hint: "The consonant sound in 'pine' is /p/ as in 'push'.",
    explanation: [
      "'Pine' begins with the voiceless bilabial plosive /p/.",
      "'Psalm' has a silent 'p' (/sɑːm/); 'push' has /p/; 'empty' has a /p/ sound (medial); 'phone' begins with /f/.",
      "While both 'push' and 'empty' contain /p/, the typical answer is 'push' because it matches the initial position and is unambiguous.",
    ],
  },
  {
    question:
      "<em>choose the word that has the <strong>same consonant sound(s)</strong> as the one represented by the letter(s) underlined.</em><br><br>mos<ins>t</ins>",
    image: null,
    options: ["sniffed", "though", "think", "listen"],
    correctIndex: 0,
    hint: "The consonant sound in 'most' is /t/ as in 'sniffed'.",
    explanation: [
      "'Most' ends with the voiceless alveolar plosive /t/.",
      "'Sniffed' ends with /t/ (the '-ed' is pronounced /t/ after voiceless sounds); 'though' ends with /ð/; 'think' ends with /k/ (or /ŋ/ if considering the whole word, but the final sound is /k/); 'listen' has a silent 't' (ends with /n/).",
      "Only 'sniffed' has the final /t/ sound.",
    ],
  },
  {
    question:
      "<em>choose the word that has the <strong>same consonant sound(s)</strong> as the one represented by the letter(s) underlined.</em><br><br><ins>z</ins>oo",
    image: null,
    options: ["stature", "cease", "days", "leisure"],
    correctIndex: 2,
    hint: "The consonant sound in 'zoo' is /z/ as in 'days'.",
    explanation: [
      "'Zoo' starts with the voiced alveolar fricative /z/.",
      "'Stature' has /st/ cluster and /tʃ/; 'cease' has /s/ (voiceless); 'days' ends with /z/; 'leisure' has /ʒ/ (voiced postalveolar fricative).",
      "The /z/ sound appears in 'days' (the final 's' is voiced after a vowel).",
    ],
  },
  // ======================== PAGE 21 (Questions 101–105) ========================
  {
    questionNumber: 101,
    questionText:
      "<em>choose the word that has the <strong>same consonant sound(s)</strong> as the one represented by the letter(s) underlined.</em><br><br>ba<ins>th</ins>",
    image: null,
    options: ["heart", "those", "bathe", "thigh"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 102,
    questionText:
      "<em>choose the word that has the <strong>same consonant sound(s)</strong> as the one represented by the letter(s) underlined.</em><br><br>ban<ins>d</ins>",
    image: null,
    options: ["breath", "asked", "handsome", "dream"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 103,
    questionText:
      "<em>choose the word that has the <strong>same consonant sound(s)</strong> as the one represented by the letter(s) underlined.</em><br><br>ar<ins>ch</ins>ive",
    image: null,
    options: ["challenge", "match", "chimera", "chime"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 104,
    questionText:
      "<em>choose the word that has the <strong>same consonant sound(s)</strong> as the one represented by the letter(s) underlined.</em><br><br>s<ins>w</ins>ine",
    image: null,
    options: ["one", "new", "know", "seen"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 105,
    questionText:
      "<em>choose the word that has the <strong>same consonant sound(s)</strong> as the one represented by the letter(s) underlined.</em><br><br>ba<ins>s</ins>e",
    image: null,
    options: ["boys", "clash", "lace", "lazy"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },

  // ======================== PAGE 22 (Questions 106–110) ========================
  {
    questionNumber: 106,
    questionText:
      "<em>choose the word that has the <strong>same consonant sound(s)</strong> as the one represented by the letter(s) underlined.</em><br><br>we<ins>pt</ins>",
    image: null,
    options: ["castle", "apostle", "slapped", "passed"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 107,
    questionText:
      "<em>choose the word that has the <strong>same consonant sound(s)</strong> as the one represented by the letter(s) underlined.</em><br><br>car<ins>d</ins>",
    image: null,
    options: ["sandwich", "hedge", "soldier", "maiden"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 108,
    questionText:
      "<em>choose the word that has the <strong>same consonant sound(s)</strong> as the one represented by the letter(s) underlined.</em><br><br><ins>f</ins>etch",
    image: null,
    options: ["approve", "tough", "thorough", "believe"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 109,
    questionText:
      "<em>choose the word that has the <strong>same consonant sound(s)</strong> as the one represented by the letter(s) underlined.</em><br><br>a<ins>rr</ins>est",
    image: null,
    options: ["lure", "shirt", "rule", "spurn"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 110,
    questionText:
      "<em>choose the word that has the <strong>same consonant sound(s)</strong> as the one represented by the letter(s) underlined.</em><br><br>wri<ins>tes</ins>",
    image: null,
    options: ["wards", "costs", "wins", "dines"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },

  // ======================== PAGE 23 (Questions 111–115) ========================
  {
    questionNumber: 111,
    questionText:
      "<em>choose the word that <strong>rhymes</strong> with the given word</em>.<br><br>suite",
    image: null,
    options: ["thrice", "suit", "sweet", "sweat"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 112,
    questionText:
      "<em>choose the word that <strong>rhymes</strong> with the given word</em>.<br><br>incite",
    image: null,
    options: ["inside", "disquiet", "excite", "surmise"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 113,
    questionText:
      "<em>choose the word that <strong>rhymes</strong> with the given word</em>.<br><br>flood",
    image: null,
    options: ["chord", "cud", "curd", "call"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 114,
    questionText:
      "<em>choose the word that <strong>rhymes</strong> with the given word</em>.<br><br>receipt",
    image: null,
    options: ["unkempt", "dealt", "deceit", "leapt"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 115,
    questionText:
      "<em>choose the word that <strong>rhymes</strong> with the given word</em>.<br><br>firm",
    image: null,
    options: ["born", "worm", "burn", "girl"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },

  // ======================== PAGE 24 (Questions 116–120) ========================
  {
    questionNumber: 116,
    questionText:
      "<em>From the words lettered A to D, choose the one that has the <strong>correct stress</strong>.</em><br><br>overwhelming",
    image: null,
    options: [
      "O-ver-whelm-ing",
      "o-VER-whelm-ing",
      "o-ver-WHELM-ing",
      "o-ver-whelm-ING",
    ],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 117,
    questionText:
      "<em>From the words lettered A to D, choose the one that has the <strong>correct stress</strong>.</em><br><br>melancholy",
    image: null,
    options: [
      "MEL-an-chol-y",
      "mel-AN-chol-y",
      "mel-an-CHOL-y",
      "mel-an-chol-Y",
    ],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 118,
    questionText:
      "<em>From the words lettered A to D, choose the one that has the <strong>correct stress</strong>.</em><br><br>inflammation",
    image: null,
    options: [
      "IN-flam-ma-tion",
      "in-FLAM-ma-tion",
      "in-flam-MA-tion",
      "in-flam-ma-TION",
    ],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 119,
    questionText:
      "<em>From the words lettered A to D, choose the one that has the <strong>correct stress</strong>.</em><br><br>calculation",
    image: null,
    options: [
      "CAL-cu-la-tion",
      "cal-CU-la-tion",
      "cal-cu-LA-tion",
      "cal-cu-la-TION",
    ],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 120,
    questionText:
      "<em>From the words lettered A to D, choose the one that has the <strong>correct stress</strong>.</em><br><br>economic",
    image: null,
    options: ["EC-o-nom-ic", "ec-O-nom-ic", "ec-o-NOM-ic", "ec-o-nom-IC"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },

  // ======================== PAGE 25 (Questions 121–125) ========================
  {
    questionNumber: 121,
    questionText:
      "In the following options lettered A to D, all the words except one have the same stress pattern. Identify the one with the different <strong>stress pattern.</strong><br><br>",
    image: null,
    options: ["undo", "ado", "unless", "legal"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 122,
    questionText:
      "In the following options lettered A to D, all the words except one have the same stress pattern. Identify the one with the different <strong>stress pattern.</strong>",
    image: null,
    options: ["despite", "petrol", "wardrobe", "vomit"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 123,
    questionText:
      "In the following options lettered A to D, all the words except one have the same stress pattern. Identify the one with the different <strong>stress pattern.</strong>",
    image: null,
    options: ["typist", "orphan", "mattress", "cigar"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 124,
    questionText:
      "In the following options lettered A to D, all the words except one have the same stress pattern. Identify the one with the different <strong>stress pattern.</strong>",
    image: null,
    options: ["colleague", "acute", "extent", "success"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 125,
    questionText:
      "In the following options lettered A to D, all the words except one have the same stress pattern. Identify the one with the different <strong>stress pattern.</strong>",
    image: null,
    options: ["formative", "character", "designate", "continue"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },

  // ======================== PAGE 26 (Questions 126–130) ========================
  {
    questionNumber: 126,
    questionText:
      "the word that receives the <strong>emphatic stress</strong> is written in capital letters. From the questions lettered A to D, choose the one to which the given sentence is the appropriate answer.<br><br>The man <strong>BROUGHT</strong> the newspaper.",
    image: null,
    options: [
      "Did the woman bring the newspaper?",
      "Did the man bring a newspaper?",
      "Did the man bring the magazine?",
      "Did the man read the newspaper?",
    ],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 127,
    questionText:
      "the word that receives the <strong>emphatic stress</strong> is written in capital letters. From the questions lettered A to D, choose the one to which the given sentence is the appropriate answer.<br><br>The woman wants <strong>MY</strong> car.",
    image: null,
    options: [
      "Does the woman want my radio?",
      "Does the man want my car?",
      "Does the woman want his car?",
      "Does the woman need my car?",
    ],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 128,
    questionText:
      "the word that receives the <strong>emphatic stress</strong> is written in capital letters. From the questions lettered A to D, choose the one to which the given sentence is the appropriate answer.<br><br>The president <strong>SPOKE</strong> to the press yesterday.",
    image: null,
    options: [
      "Did the minister speak to the press yesterday?",
      "Did the president speak to the lecturers yesterday?",
      "Did the president wave to the press yesterday?",
      "Did the president speak to the press today?",
    ],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 129,
    questionText:
      "the word that receives the <strong>emphatic stress</strong> is written in capital letters. From the questions lettered A to D, choose the one to which the given sentence is the appropriate answer.<br><br>Comfort prepared a <strong>DELICIOUS</strong> meal.",
    image: null,
    options: [
      "Did Comfort prepare a delicious snack?",
      "Did Comfort prepare a tasteless meal?",
      "Did Jummy prepare a delicious meal?",
      "Did Comfort order a delicious meal?",
    ],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 130,
    questionText:
      "the word that receives the <strong>emphatic stress</strong> is written in capital letters. From the questions lettered A to D, choose the one to which the given sentence is the appropriate answer.<br><br><strong>OUR</strong> Mathematics teacher has been transferred.",
    image: null,
    options: [
      "Has their Mathematics teacher been transferred?",
      "Has our Physics teacher been transferred?",
      "Has our Mathematics teacher been promoted?",
      "Has our Mathematics supervisor been transferred?",
    ],
    correctIndex: null,
    hint: null,
    explanation: [],
  },

  // ======================== PAGE 27 (Questions 131–135) ========================
  {
    questionNumber: 131,
    questionText:
      "<em>From the words lettered A to D, choose the word that contains the sound represented by the given <strong>phonetic symbol.</strong></em><br><br>/ai/",
    image: null,
    options: ["rare", "ice", "air", "fuel"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 132,
    questionText:
      "<em>From the words lettered A to D, choose the word that contains the sound represented by the given <strong>phonetic symbol.</strong></em><br><br>/æl/",
    image: null,
    options: ["bag", "park", "get", "class"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 133,
    questionText:
      "<em>From the words lettered A to D, choose the word that contains the sound represented by the given <strong>phonetic symbol.</strong></em><br><br>/d/",
    image: null,
    options: ["handkerchief", "passed", "handsome", "bride"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 134,
    questionText:
      "<em>From the words lettered A to D, choose the word that contains the sound represented by the given <strong>phonetic symbol.</strong></em><br><br>/e/",
    image: null,
    options: ["bite", "leave", "spare", "heaven"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 135,
    questionText:
      "<em>From the words lettered A to D, choose the word that contains the sound represented by the given <strong>phonetic symbol.</strong></em><br><br>/boa/",
    image: null,
    options: ["bore", "warp", "wander", "wonder"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },

  // ======================== PAGE 28 (Questions 136–140) ========================
  {
    questionNumber: 136,
    questionText:
      "<em>From the words lettered A to D, choose the word that contains the sound represented by the given <strong>phonetic symbol.</strong></em><br><br>/k/",
    image: null,
    options: ["civil", "choral", "chore", "choose"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 137,
    questionText:
      "<em>From the words lettered A to D, choose the word that contains the sound represented by the given <strong>phonetic symbol.</strong></em><br><br>/g/",
    image: null,
    options: ["gnash", "target", "gnaw", "sing"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 138,
    questionText:
      "<em>From the words lettered A to D, choose the word that contains the sound represented by the given <strong>phonetic symbol.</strong></em><br><br>/u:/",
    image: null,
    options: ["work", "grew", "teeth", "bull"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 139,
    questionText:
      "<em>From the words lettered A to D, choose the word that contains the sound represented by the given <strong>phonetic symbol.</strong></em><br><br>/ʃ/",
    image: null,
    options: ["badge", "catch", "bastion", "edition"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 140,
    questionText:
      "<em>From the words lettered A to D, choose the word that contains the sound represented by the given <strong>phonetic symbol.</strong></em><br><br>/ŋ/",
    image: null,
    options: ["know", "chance", "lean", "living"],
    correctIndex: null,
    hint: null,
    explanation: [],
  },

  // ======================== PAGE 29 (Questions 141–145) – Theory/Essay ========================
  {
    questionNumber: 141,
    questionText:
      "Your brother who is in the third year in another school has written to confide in you that he is about to stop schooling and go into business. Write a letter to him advising him against his decision.",
    image: null,
    options: [],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 142,
    questionText:
      "Write an article suitable for publication in a national newspaper on the topic: <em>The importance of Promoting Good Reading Habits in Students.</em>",
    image: null,
    options: [],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 143,
    questionText:
      "As the Senior Prefect of your school, write a letter to the Principal pointing out at least two practices among students that should be discouraged and two habits that should be promoted among teachers.",
    image: null,
    options: [],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 144,
    questionText:
      "A new Principal has been posted to your school. Write a speech you will deliver at the welcome party organised for him informing him about some problems faced by students.",
    image: null,
    options: [],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 145,
    questionText:
      "Write a story that ends with the statement: <em>I had never felt so embarrassed in my life.</em>",
    image: null,
    options: [],
    correctIndex: null,
    hint: null,
    explanation: [],
  },

  // ======================== PAGE 30 (Questions 146–147) – Comprehension ========================
  {
    questionNumber: 146,
    questionText:
      "<p><em>Read the following passage</em> <strong>carefully</strong> <em>and answer the questions on it.</em><br>\n&nbsp; &nbsp; &nbsp;My mother never thought it necessary to inform any of her children that she would pay them a visit in Lagos at any time. After all, no&nbsp;child would refuse her entry into their home. She had always been lucky to meet a member of the household each time she came Visiting and it was <ins>unimaginable</ins> to her that a day would come when no one would de at home to receive her.<br>\n&nbsp; &nbsp; &nbsp;In her usual manner, Mama boarded a vehicle from the village at noon with all her luggage which usually comprised the local delicacies we all enjoyed eating whenever she came visiting Since she was aware of the time of the day everyone would be back home from work, she was not worried when the bus made frequent stops to either pick up or discharge passengers. while the journey lasted, Mama chatted <ins>heartily</ins> with a fellow passenger<ins> who was also&nbsp;going to See her son in Lagos </ins>and the two exchanged telephone numbers.<br>\n&nbsp; &nbsp;&nbsp;Eventually, the vehicle crawled to a final stop and everyone alighted. Mama flagged down a taxi and headed for her daughters' house. Although the fare demanded by the driver, was <ins>outrageous</ins> and the money on her could not cover it. Mama believed that when she got to the house, her daughter or son-in-law would come to her aid by making up the difference.<br>\n&nbsp; &nbsp; &nbsp;How wrong she was! Unknown to Mama, my husband and I had traveled out of town on one of our<ins> numerous</ins> official assignments while my son had returned to the university campus, The only person on the premises was the new watchman. Mama s dilemma, however, began with the payment of the taxi fare. When she alighted with some of her luggage, she met the cold unfriendly stare of a complete stranger. She tried <ins>frantically</ins> to introduce herself to the watchman but could not communicate effectively because of the language barrier. To her embarrassment, the taxi driver called her a <ins>fraudulent</ins> old woman, left his contact number, and drove off in annoyance with one of her bags.<br>\n&nbsp; &nbsp; &nbsp; &nbsp;&nbsp;Mama remembered that the woman with whom she had traveled on the bus had given her her phone number and she decided to call her for help. After what seemed like an eternity, the woman's son drove in his car to fetch Mama. My mother was quite grateful for that but she will never forget the fact that she had to eat spaghetti and omelette for dinner.<br>\n&nbsp; &nbsp; &nbsp; &nbsp;That night, I received a call from a complete stranger informing me of my mother's ordeal. I had to rush back to Lagos the following day to bring Mama back home and get her bag from the taxi driver. My mother left for the village two days after and has&nbsp;since made it a point to call before she visits anyone.</p>\n\n<p>(a) Why did the writer's mother never inform her children of her intention to visit them?<br>\n(b) How did Mama while away the hours on the journey?<br>\n(c) State two difficulties Mama faced when she arrived Lagos.<br>\n(d) Why did the taxi driver leave with one of Mama's bags?<br>\n(e) Why do you think that Mama will never forget what she had for dinner?<br>\n(f)... <em>Who was also going to see her son in Lagos... </em>(i) What grammatical name is given to this expression as it is used In the passage? (ii) What is its function?<br>\n(g)... <em>seemed like an eternity</em>... What does this expression mean'?<br>\n(h) What lesson did Mama learn from this trip? (i) <em>For each of the following words, find another word or phrase which means the Same and which can replace it as it is ed in the passage: </em>(i) unimaginable; (ii) heartily; (iii) outrageous; (iv) numerous; (v) frantically; (vi) fraudulent.</p>",
    image: null,
    options: [],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
  {
    questionNumber: 147,
    questionText:
      "<p><em>Read the following passage</em> <strong>carefully</strong> <em>and answer the questions on it</em>.<br>\n&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;There&nbsp;are gifts of nature without which human survival on Earth is impossible. Some of these gifts include water, oxygen&nbsp;and&nbsp;the forest. The last is of particular interest. Forests occupy a vast landmass and are found in many parts of the World. They are uncultivated lands thickly covered with trees. Forests have played a significant role in the Survival of&nbsp;humans,&nbsp;Unfortunately, thousands of hectares are destroyed each year due to human activities. It is, however, becoming increasingly obvious that if appropriate steps are not taken to curb the wave of forest destruction, the future Survival of humans iş hanging in the balance. This realization is fueling the campaign to preserve this wonderful gift of nature.<br>\n&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Forests are more important to humans than humans are to them. Forest trees serve as a protection against erosion Without the canopy provided by trees, the land will be exposed to all the elements such as strong winds and heavy rainfall The strong winds blow the soil while running water washes away the top soil with its nutrients, Thus, the most fertile land becomes barren. Wood from trees also serves as an important material in building construction. It is cut and .processed for use in building houses and shelters which provide protection against the inclement weather. With this, the forest shields both humans and the Earth. It is therefore important to ensure the continued availability of this important natural resource. To this end, there is the need for the relevant authorities to enact laws that will mandate tree planting to replace felled ones. Where such laws already exist, efforts must be made to enforce compliance.<br>\n&nbsp; &nbsp; &nbsp; &nbsp;&nbsp;The inventiveness of humans has led to the discovery of another use for forest trees. Logs can be cut, chopped into pieces, ground by machines and turned into wood pulp which then goes through some other processes and paper is the end product. We can imagine the great things timber does when we look at the tons of books that are produced and read Worldwide. Thanks to technology, it is now possible to operate a paperless society to some extent. Everyone must therefore continue to make a conscious effort to protect the forest by going paperless. Soft copies of books should be preferred to hard copies. More newspaper publishers now have online outlets where news items are published. Hence, Subscription to these outlets will ensure, a reduction in the demand for paper.&nbsp;<br>\n&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Forests feed the earth, humans, and animals that live in them. Through the addition of humus and vegetable matter from dead leaves and droppings of animals, the soil is replenished with mulch, minerals, and manure, which are much better than fertilizers. Humans also get food from the nutrient-packed plants and animals of the forest and even use them for medicinal purposes. Thus. governments must discourage the cultivation of forest as farmlands by creating forest reserves. Such reserves should be protected by law to prevent encroachment. This will ensure unfettered growth of trees, and ultimately, the survival of humans.</p>\n\n<p>(a) In three sentences, one for each, state three benefits derived from forests.<br>\n(b)&nbsp;In three sentences, one for each, state three measures to control deforestation.</p>",
    image: null,
    options: [],
    correctIndex: null,
    hint: null,
    explanation: [],
  },
];
