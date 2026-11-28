# Playtest report — <persona>, <YYYY-MM-DD>

- **Persona:** trader | curious traveler | helper
- **Seed:** <seed>
- **Build:** <short hash or "uncommitted">
- **Dev server:** http://127.0.0.1:5173
- **Duration:** <minutes>
- **Screens visited:** <list, in order>
- **Session type:** agent session (not human evidence)

## Story of the session

<six to twelve sentences: what this player tried, in order, and what happened.>

## Pre-pass evidence

- **Command:** `pnpm playtest:review -- --persona <persona>`
- **Candidates tested:**
  1. <candidate> — confirmed | not reproduced | not visible in the replay

## Feedback dimensions

- **Clarity:** <what was easy or hard to understand, and where>
- **Confusion:** <the moment the player asked “what do I do now?”, if any>
- **Character interactions:** <who wanted what, who remembered, who felt like a button>
- **Mechanics:** <what the player understood about cost, time, cargo, language, standing>
- **Friction:** <cost in time or confidence, even when nothing was broken>
- **Emotional tone:** <what the session made the player feel, with the moment it rested on>
- **Enjoyment:** <what the player wanted to do next; do not infer a rating from metrics>
- **Inconsistencies:** <story, journal, price or state that disagreed with itself>

## Bugs

### B1 — <one-line symptom>

- Severity: blocking | major | minor | cosmetic
- Where: <screen / control / place / day>
- Steps:
  1. <from a fresh run where possible>
- Expected:
- Actual:
- Evidence: <message text, console line, screenshot description>
- Notes: <when it started, whether reload changes it>

## Friction

| Where         | What the player was trying to do | What cost them time or confidence                   |
| ------------- | -------------------------------- | --------------------------------------------------- |
| <screen, day> | <intention>                      | <the moment and the question they asked themselves> |

## Ideas

### I1 — <short name>

- Pillar: <spec §1 pillar>
- Player problem: <what this session showed>
- Evidence: <the moment above>
- Cost: copy | UI | content | mechanic (mechanic needs the scope gate)
- Sketch: <two or three sentences, not a design doc>

## The seven questions

| #   | Question                                            | Verdict                                                  | Confidence          |
| --- | --------------------------------------------------- | -------------------------------------------------------- | ------------------- |
| 1   | Travel loop enjoyment                               | strong / promising / weak / failed / not enough evidence | low / medium / high |
| 2   | Trading as a reason to travel                       |                                                          |                     |
| 3   | Character memorability and desire to return         |                                                          |                     |
| 4   | Language progression as reward, not obstruction     |                                                          |                     |
| 5   | Faction relationships as understandable opportunity |                                                          |                     |
| 6   | Vivid, distinctive ancient world                    |                                                          |                     |
| 7   | Mystery as curiosity, not confusion                 |                                                          |                     |

<one paragraph of evidence per question, quoting the moment it rests on>

## Recommendation

<the first thing you would fix, and why>
