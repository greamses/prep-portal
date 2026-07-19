/* GRAMMAR — Letters & Notes. Authoring format and rules are documented in
   diary.js — read them before adding one.

   Letters carry their own conventions — the comma after a greeting and after a
   sign-off — which is why the band runs to Grade 12: a formal application
   letter is examined material long after diary writing stops.

   Note the blank lines. A letter whose greeting, body and sign-off run
   together in one paragraph is not a letter, and "Dear Bola," only reads as
   correct with the body starting underneath it. */

export const PASSAGES = [
  {
    id: 'letter-birthday',
    title: 'A Note to a Friend',
    band: [5, 8],
    text: `Dear {{P|Bola|Bola,}}

Thank you for the birthday card you sent me. It arrived on {{C|friday|Friday}}, exactly on the day itself, which was perfect. My parents took me and my cousins to the cinema in the afternoon. We saw the new film about the {{S|astronort|astronaut}}, and it was much funnier than {{C|i|I}} expected. I wish you could {{U|of|have}} come with us. Are you still coming to {{C|ibadan|Ibadan}} in {{C|december|December}}? Write back soon.

Your {{P|friend|friend,}}
Tunde`,
  },
  {
    id: 'letter-application',
    title: 'An Application Letter',
    band: [9, 12],
    text: `Dear Sir or {{P|Madam|Madam,}}

I am writing to apply for the position of laboratory assistant advertised in the {{C|daily|Daily}} Times on 3 {{C|march|March}}. I completed my secondary education at {{C|government|Government}} College, Ikeja, where I studied Chemistry, {{P|Biology|Biology,}} and Physics. I was {{S|responsable|responsible}} for {{S|maintaning|maintaining}} the equipment in the school laboratory during my final year. The stock records {{U|was|were}} checked by me every term. I believe that this {{P|experience|experience,}} together with my attention to detail, would make me a suitable candidate. I have enclosed my curriculum vitae and the names of two referees. I would be grateful to {{S|recieve|receive}} a reply.

Yours {{P|faithfully|faithfully,}}
Ngozi Okafor`,
  },
  {
    id: 'letter-complaint',
    title: 'A Letter of Complaint',
    band: [8, 12],
    text: `Dear Mr {{P|Adeyemi|Adeyemi,}}

I am writing to complain about the textbooks delivered to our school on {{C|monday|Monday}}. Twelve of the forty copies arrived with pages {{P|missing|missing,}} and three had {{S|dameged|damaged}} covers. Neither of the boxes {{U|were|was}} sealed. Our students cannot use them. I telephoned your office on {{C|tuesday|Tuesday}}, but nobody was {{S|avaliable|available}} to speak to me. I would be {{S|greatful|grateful}} if you could arrange a replacement before next {{P|terms|term’s}} examinations. Please confirm in writing that this is possible.

Yours {{P|sincerely|sincerely,}}
Mrs F. Balogun`,
  },
  {
    id: 'letter-thank-you',
    title: 'A Thank-You Note',
    band: [5, 9],
    text: `Dear Aunty {{P|Nkechi|Nkechi,}}

Thank you for the shoes you sent for my birthday. They fit {{P|perfectly|perfectly,}} and I have already worn them to church twice. {{U|There|Their}} colour is exactly right. Mummy says I must not wear them to {{P|school|school,}} but I have shown them to my {{S|freinds|friends}}. We are all well here. Chidi has started {{S|walkin|walking}}, and he follows me {{S|everywere|everywhere}}. Please tell {{C|uncle|Uncle}} Emeka that I passed my mathematics test. I hope you will visit us at {{C|christmas|Christmas}}.

Your {{P|niece|niece,}}
Adaeze`,
  },
  {
    id: 'letter-editor',
    title: 'A Letter to the Editor',
    band: [9, 12],
    text: `Dear {{P|Editor|Editor,}}

I am writing about the article on street trading that you published on 12 {{C|may|May}}. Your correspondent argued that hawkers should be removed from the roads {{S|entirley|entirely}}. I believe that view is {{S|mistaiken|mistaken}}. Many of these traders support whole {{P|families|families,}} and {{U|their|there}} is no other work available to them. A better answer would be to build proper markets near the bus stops in {{C|lagos|Lagos}}. The state government has promised such markets {{P|before|before,}} but very few have been {{S|compleated|completed}}. {{U|Its|It’s}} time your readers heard both sides.

Yours {{P|faithfully|faithfully,}}
K. Adebayo`,
  },
];
