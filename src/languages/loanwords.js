/* English words that turn up inside other languages.

   Someone learning a foreign language on this app reads English fluently, so
   an English loanword is never what trips them up — it only stands out
   visually, and that is exactly what a model latches onto. Three prompt
   revisions with an explicit ban and a counter-example of their own did not
   stop it, which is why this sits in code.

   Shared rather than per pack: the list is the same wherever it applies, and
   what differs between languages is only whether the suffix rule may fire —
   that part lives in each pack as loanwordSuffixes. */

export const LOANWORDS = new Set(
  ("mail email meeting feedback team link online offline software hardware marketing " +
    "manager staff budget deadline workshop coach sponsor spam hype fake target ranking " +
    "casting catering shopping parking camping chat post blog tweet streaming influencer " +
    "gaming hobby ticket check master briefing kickoff standup review release update " +
    "learning agreement incoming enrolment enrollment").split(" "),
);
