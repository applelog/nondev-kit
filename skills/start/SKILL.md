---
name: start
description: Find out what the user wants to build by asking a few easy multiple-choice questions, then choose the technology for them and write a short plan. Use on the first message in a project that has no DEVLOG.md, or when a request to build something is too vague to act on (for example "make me an app").
---

# Start: from an idea to a plan

The user decides what to build. You decide how. Never ask the user to choose a technology.

## When not to run this

- DEVLOG.md already exists and the request is clear.
- The request already tells you at least 3 of: who uses it, the one core feature, web or app, login needed, data saved. Then build, and state what you assumed.
- The message is not about building something.

## How to ask

- Ask in the user's language, in plain words.
- One opening question (free answer), then round 1, then round 2. At most 4 questions per round and 8 in total, not counting the opening question.
- Send each round as one message. Use the question tool if one is available.
- Every question after the opening one is multiple choice with 2-4 options, one marked "(recommended)", and "Not sure, use your recommendation".
- Skip any question the user has already answered.
- Add half a sentence on why you ask, when it is not obvious.

## Opening question

> What do you want to make? Tell me like you'd tell a friend. One or two sentences is enough.

Give two examples, such as "A booking page for my hair salon" or "An app where my book club votes on the next book".

If the user is stuck, ask these instead: Who has the problem? What do they do about it today? What should become easier?

## Round 1 (ask all that are still unknown)

1. **Who will use it?** Just me / People I already know (friends, team, my customers) (recommended) / Anyone on the internet.
   Why recommended: a smaller first version is finished sooner and carries less risk.
2. **What is the one thing it must do on day one?** Offer 2-3 candidates taken from their opening answer, plus "Something else".
   Everything else goes to "Later".
3. **Where will people use it?** A website that works on phones and computers (recommended) / A phone app from the app store.
   Why recommended: no store review, lowest cost, can become an app later.
4. **Is there an app or site that feels close to what you want?** Yes (name it) / No.

## Round 2 (pick what is still needed, at most 4, in this order)

5. **Will it collect information about people?** Nothing personal / Basic (name, email) / Sensitive (payments, health, ID numbers, children). Always ask this one. Recommend the least that the core feature needs.
6. **Will people pay through it?** No / Later, not in the first version (recommended) / Yes, from day one.
7. **How much can you spend per month to keep it running?** Nothing, free only (recommended) / Up to about $20 / Flexible.
8. **Does each person need their own account?** Only if you cannot infer it.
9. **Should it remember things between visits?** Only if you cannot infer it.
10. **What should it feel like?** Clean and minimal (recommended) / Warm and friendly / Bold and playful / I have a brand or a reference.

If the answer to 5 is "Sensitive": tell the user the security check will be stricter and that an expert review is needed before release. Record this in Pinned.

## Choosing the technology (you decide, the user does not)

Start from the lowest rung that works. Move up one rung only when a reason below forces it.

1. A feature the hosting platform already has
2. A paid API
3. An open-source library
4. Building it yourself

Reasons to move up:
- **Core difference:** is this feature what makes the product special? If not, do not build it.
- **Cost:** users x calls per user x price per call, per month. Look up current prices; do not use remembered ones. Compare with the answer to question 7.
- **Data:** may this data leave to another company? (See question 5.)
- **Upkeep:** who maintains it? The user cannot maintain custom code, so count that against building.
- **Open-source health:** updated in the last 6 months, a permissive license, no known serious vulnerability.

If the honest answer is "this needs a custom-trained AI model", do not plan it. Say that this needs an expert, and explain why in two sentences.

Unless there is a reason not to, prefer one well-known, well-documented stack with a free tier. Check the project folder first: if code already exists, keep its stack.

## Finish: summary, confirm, journal

Show this and ask one question: "Shall I start with this?"

```
What:        <one sentence>
For whom:    <who>
Version 1:   <the one thing it must do>
Screens:     <each screen and what the user does on it, one line each>
Done when:   <2-4 things the user can try and see for themselves, e.g. "I add a booking and it is still there after I reload">
Later:       <features moved out of version 1>
Not doing:   <what version 1 leaves out on purpose>
I decided:   <form, tools with a one-line reason each, estimated monthly cost>
I assumed:   <anything you guessed without asking>
Steps:       plan > design > build > test > release, with one line each
```

"Done when" is the test for the whole version: write it so a non-developer can check each line without reading code. Later, when something breaks, it is what "working" means.

After the user confirms:
1. Create DEVLOG.md with the `vibe-starter:journal` format. Put the decisions, the "Done when" list, the monthly budget, and the personal-data level in Pinned. Put "Later" features under Open issues > Later.
2. Start a git repository if there is none.
3. Begin the first step.
