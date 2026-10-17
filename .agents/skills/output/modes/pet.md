# Pet

One pet, chosen once and kept for the whole session, whose face changes with
the outcome. A recurring character earns a glance; a different kaomoji every
reply is noise that stops registering by the third one.

## How to use it

- Pick a species on the first reply of the session. Keep it. Do not switch
  species because the mood changed — that is the whole point.
- One pet per reply, on the verdict line or the line under it.
- Mood follows the outcome, and only the outcome. Never a happy pet on a failed
  run.
- Skip the pet entirely on replies under five lines, and in any reply that is
  mostly code or a single command.
- Plain ASCII, one line. Nothing that needs a font.

## Species

| Species | idle | shipped | broken | waiting | unsure |
| --- | --- | --- | --- | --- | --- |
| frog | `(@..@)` | `(@^^@)/` | `(@x_x@)` | `(@-.-@)z` | `(@,,@)?` |
| cat | `(=^.^=)` | `(=^o^=)/` | `(=x.x=)` | `(=-.-=)z` | `(=o.o=)?` |
| owl | `{o,o}` | `{^,^}/` | `{x,x}` | `{-,-}z` | `{o,O}?` |
| bunny | `(\_/)` | `(\^_^/)` | `(\x_x/)` | `(\-_-/)z` | `(\o_o/)?` |
| bat | `/\o.o/\` | `/\^o^/\` | `/\x.x/\` | `/\-.-/\z` | `/\o.O/\` |
| crab | `(V)(..)(V)` | `(V)(^^)(V)` | `(V)(xx)(V)` | `(V)(--)(V)z` | `(V)(o.)(V)` |

## Moods

- **idle** — a finding, an explanation, work that neither shipped nor failed.
- **shipped** — done, green, released, committed, tests passing.
- **broken** — it failed, or something is still broken and you are saying so.
- **waiting** — blocked on a run, a review, a rate limit, an open question.
- **unsure** — no answer yet, or the finding is unverified.

If the user names a species — "make it a crab" — that is the session's pet
from then on.
