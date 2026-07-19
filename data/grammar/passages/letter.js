/* GRAMMAR — Letters & Notes. Authoring format is documented in diary.js.
   Letters carry their own conventions — the comma after a greeting and after a
   sign-off — which is why the band runs all the way to Grade 12: a formal
   application letter is examined material long after diary writing stops. */

export const PASSAGES = [
  {
    id: 'letter-birthday',
    title: 'A Note to a Friend',
    band: [5, 8],
    text: `Dear {{P|Bola|Bola,}} Thank you for the birthday card you sent me. It arrived on {{C|friday|Friday}}, exactly on the day itself, which was perfect. My parents took me and my cousins to the cinema in the afternoon. We saw the new film about the {{S|astronort|astronaut}} and it was much funnier than {{C|i|I}} expected. I wish you could {{U|of|have}} come with us. Are you still coming to {{C|ibadan|Ibadan}} in {{C|december|December}}? Write back soon. Your {{P|friend|friend,}} Tunde`,
  },
  {
    id: 'letter-application',
    title: 'An Application Letter',
    band: [9, 12],
    text: `Dear Sir or {{P|Madam|Madam,}} I am writing to apply for the position of laboratory assistant advertised in the {{C|daily|Daily}} Times on 3 {{C|march|March}}. I completed my secondary education at {{C|government|Government}} College, Ikeja, where I studied Chemistry, Biology and Physics. During my final year I was {{S|responsable|responsible}} for {{S|maintaning|maintaining}} the equipment in the school laboratory. The equipment {{U|were|was}} my responsibility alone. I believe that this {{P|experience|experience,}} together with my attention to detail, would make me a suitable candidate. I have enclosed my curriculum vitae and the names of two referees. I would be grateful to {{S|recieve|receive}} a reply. Yours {{P|faithfully|faithfully,}} Ngozi Okafor`,
  },
  {
    id: 'letter-complaint',
    title: 'A Letter of Complaint',
    band: [8, 12],
    text: `Dear Mr {{P|Adeyemi|Adeyemi,}} I am writing to complain about the textbooks delivered to our school on {{C|monday|Monday}}. Twelve of the forty copies arrived with pages {{P|missing|missing,}} and three had {{S|dameged|damaged}} covers. Neither of the boxes {{U|were|was}} sealed. Our students cannot use them. I telephoned your office on {{C|tuesday|Tuesday}} but nobody was {{S|avaliable|available}} to speak to me. I would be {{S|greatful|grateful}} if you could arrange a replacement before the term begins. Please confirm in writing that this is possible. Yours {{P|sincerely|sincerely,}} Mrs F. Balogun`,
  },
];
