# Recovery: how long a muscle shows as tired

This is the science behind the **Recovery** body graph on Statistics. Code: `lib/training/effort.ts`
(`recovery`), `RECOVERY_WINDOWS` in `constants/training.ts`. Written 2026-10-31 from a literature search: every number below
names the study it comes from, and the gaps are marked.

## The rule

After a workout, each muscle it trained gets a recovery window. The window depends on how many sets
that muscle got in that workout, counted as on the Sets graph (`docs/science/sets.md`): main muscle
1, helper 0.5, warm-up 0.3.

| Sets on the muscle | 🔴 Heavy recent load | 🟠 Partly recovered | 🟢 Likely ready |
|---|---|---|---|
| under 0.75 (a lone warm-up, one helper set) | no window | | |
| about 1 (0.75 up to 1.5) | first 12 h | until 30 h | after |
| 2–3 (1.5 up to 3.5) | first 24 h | until 48 h | after |
| 4+ (3.5 and more) | first 24 h | until 72 h | after |

- The clock starts when the workout starts.
- If you trained the muscle in several workouts in the last 72 h, the worst state counts.
- Green shows only for muscles trained in the last 7 days; the others stay grey.

## Where the numbers come from

### 48 h after 2–3 sets to failure

- **Morán-Navarro et al. 2017**, *Eur J Appl Physiol* (PMID 28965198), trained men.
  - 3×10 to failure recovered more slowly than the same work stopped short of failure.
  - The difference lasted 24–48 h, and muscle damage markers (CK) were higher.
- **Pareja-Blanco et al. 2017**, *Clin Physiol Funct Imaging* (PMID 26970332).
  - Sets to failure lowered jump height for up to 48 h and bench speed for up to 24 h.
  - Stopping at half the possible reps recovered faster.
- **Pareja-Blanco et al. 2020**, *J Strength Cond Res* (PMID 30036284).
  - Across 10 protocols, performance after training to failure "remained reduced up to
    48-hour post-exercise".
- **Vieira et al. 2022**, *Sports Med* (PMID 34881412), a meta-analysis of 20 studies.
  - Failure training costs more performance than non-failure training.
  - It also raises muscle damage markers more at 48 h.
- **Korak et al. 2015**, *Int J Exerc Sci*. At 48 h, about 80% of lifters were within 1 rep of their
  baseline.

### 72 h after 4 or more sets to failure

- **Belcher et al. 2019**, *Appl Physiol Nutr Metab* (PMID 30779596). Well-trained men did 4 sets
  to failure at 80% of their max. Squat speed was still 8.6% down for up to 72 h.
- **Goulart et al. 2021**, *Eur J Sport Sci* (PMID 32594858). After 10 sets to failure, performance
  needed "at least 48 h", and lifters felt recovered at 72 h.
- **Bartolomei et al. 2017**, *Eur J Appl Physiol* (PMID 28447186). After 8×10, strength was still
  down at 72 h.

### Red for the first 24 h

Every study above finds the biggest drop in the first day. So any muscle that got 2+ sets shows
red for 24 h, whatever the window.

### The same for every muscle

The studies don't show that arms, shoulders or any other muscle recover faster:

- **Chen et al. 2011**, *Eur J Appl Physiol* (PMID 20852880): elbow muscles took more damage than
  the thigh after eccentric work.
- **Vieira 2022**: speed dropped more in the upper body.
- **Belcher 2019**: squat, bench and deadlift recovered alike.

So there is one table for all muscles (earlier versions had different hours per muscle, with no
source).

### No extra weight for failure sets

The hours above already come from failure studies. Earlier versions counted a failure set 1.25×
for fatigue; that number had no source and is gone.

## Cardio

Football, tennis, sprints, running, hiking and walking keep their own curve (`lib/training/cardio.ts`, numbers
in `constants/cardio.ts`). A session's fatigue stays full for 24 h, then halves every 30 h. Above 0.6 shows
red, from 0.3 orange. Each activity has its own muscles (the legs, plus the shoulders for tennis), and it
never counts as sets.

## Gaps

- **The cardio loads and reference minutes are estimates.** Football's follow small-sided-game studies;
  the other activities have no source, only "running, hiking and walking load the legs progressively less".

- **About 1 set (30 h, red 12 h) is an estimate.** No study measures recovery after a single set.
- **No study compares 1, 2 and 3 sets directly.** The 2–3 vs 4+ split follows the protocols tested:
  3 sets in the 48 h studies, 4–10 sets in the 72 h ones.
- **The studies are small and narrow:**
  - 10–17 people each, mostly young men.
  - Mostly bench press and squat.
  - Nothing on chest isolation, back, abs or arm isolation in trained lifters.
- **Trained lifters recover a bit faster** from work they're used to: the repeated-bout effect, Doma
  et al. 2023 (PMID 38015738). The windows may be on the long side for you.
- **Counter-evidence:** Mangine et al. 2022 (PMID 34941608) found no difference at 24–72 h between 5
  bench sets to failure and 4 sets stopped 3 reps short.

## Sources

Read on 2026-10-31. "Abstract" means only the abstract was available; full texts are marked.

- Morán-Navarro 2017, Eur J Appl Physiol: PMID 28965198 (abstract)
- Pareja-Blanco 2017, Clin Physiol Funct Imaging: PMID 26970332 (abstract)
- Pareja-Blanco 2020, J Strength Cond Res: PMID 30036284 (abstract)
- Pareja-Blanco 2019, Sports: PMC6473797 (full text)
- Cornejo-Daza 2024, J Strength Cond Res: PMID 37972985 (abstract). Stopping well short of failure
  (20% speed loss) left no drop at 6–48 h.
- Vieira 2022, Sports Med: PMID 34881412 (abstract)
- Mangine 2022, J Strength Cond Res: PMID 34941608 (abstract)
- Belcher 2019, Appl Physiol Nutr Metab: PMID 30779596 (abstract)
- Bartolomei 2017, Eur J Appl Physiol: PMID 28447186 (abstract)
- Goulart 2021, Eur J Sport Sci: PMID 32594858 (abstract)
- Korak 2015, Int J Exerc Sci: https://digitalcommons.wku.edu/ijes/vol8/iss1/10 (abstract)
- Chen 2011, Eur J Appl Physiol: PMID 20852880 (abstract)
- Doma 2023, J Strength Cond Res: PMID 38015738 (abstract)

Abstracts by PMID: `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:<PMID>`
