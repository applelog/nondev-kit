---
name: fix
description: Find out exactly what is broken before changing any code, by checking the project yourself and then asking the user a few easy questions about what they did and what they saw. Use when the user reports a problem without enough detail to act on, for example "it's broken", "fix it", "it doesn't work", or "it worked before and now it doesn't".
---

# Fix: from "it's broken" to a precise fix

A beginner says "fix it". An experienced person says "the save button does nothing on the phone when the title is empty". Your job is to get from the first to the second before you touch the code. A fix based on a guess often breaks something else.

## When not to run this

Skip the questions when you already know all three: what the user did, what they saw, and what they expected. Go straight to "Reproduce".

## Step 1: check what you can check yourself

Do this before asking anything. Never ask the user for something you can look up.

- What changed since it last worked: `git status`, `git diff`, recent commits.
- DEVLOG.md: the Now section and Open issues.
- Run the app or its tests and read the error output and logs.
- If a browser or preview tool is available, open the page and try it.

## Step 2: ask what only the user knows

- Ask in the user's language, in plain words, in one message.
- At most 4 questions. Skip any that step 1 or the user already answered.
- Multiple choice where possible, always with "Not sure".
- Add half a sentence on why you ask when it is not obvious.

Pick from these, in this order:

1. **What were you doing right before it went wrong?** Ask for the steps: which page, what they clicked or typed.
2. **What did you see?** Nothing happened / An error message / The wrong result / It looks broken / It is very slow.
   If there was a message, ask for a screenshot or the copied text. Exact words matter more than a description.
3. **What did you expect to happen instead?**
4. **Does it happen every time?** Every time / Sometimes / It happened once.
5. **Where does it happen?** Phone / Computer / Both / Not sure. Ask which browser only if it could matter.
6. **Does it depend on who or what?** Only when logged in / Only when logged out / Only with certain content (long text, empty field, a specific item) / Not sure.
7. **When did it last work?** Earlier today / Before the last change we made / It never worked / Not sure.

If you need something from the browser's error console, give exact steps (which keys to press, what to copy). Do not assume the user knows what a console is.

## Step 3: reproduce

Make the problem happen yourself, using the user's steps. Then say in one or two plain sentences what is wrong and why, with the evidence (the error line, the commit that changed it).

If you cannot reproduce it, say so. Do not fix by guessing. Offer 2-3 options, for example: add a small log and ask the user to try again, ask one more question, or go back to the last working version.

## Step 4: fix

- Commit first, so there is a restore point.
- One cause, one fix. Make the smallest change that removes the cause.
- If the best fix changes what the product does, costs money, or cannot be undone, propose it and wait for the answer.
- If two attempts fail, stop. Explain what you tried and give options, including going back to the last working version. Going back discards work, so ask before doing it.

## Step 5: confirm and record

- Run the user's steps again and confirm the problem is gone. Run the existing tests.
- Tell the user how to check it themselves: where to go and what they should now see.
- Say what you checked and what you did not.
- If the project has tests, add one for this problem.
- Write to DEVLOG.md when the fix is a workaround, when the cause could return, or when something is left open.
