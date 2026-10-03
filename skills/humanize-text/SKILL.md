# Skill: Humanize Text

## Description
Transform and rewrite text to sound naturally human, credible, and unstuffy in English. Eradicate AI-generated patterns and maintain strict factual accuracy—no fluff, no fabrication.

## Dependencies & References
- **Banned Patterns List:** `../banned-patterns-reference.md`
  > **Hard Rule:** Always cross-check the text against this file. Any phrase, structure, or linguistic pattern listed there must be completely stripped from the final output.

---

## Core Principles

### 1. Eradication of AI Patterns
- **No hype:** Remove promotional fluff, hyperbolic claims, and empty promises.
- **Break the triple pattern:** Eliminate the mechanical triple-repetition ("clear, concise, and compelling") that generative models rely on for filler.
- **Punctuation discipline:** Never use em dashes or en dashes (— or –) to break sentences. Use honest English punctuation or simple pauses.
- **Kill shallow analysis:** Avoid stock transition phrases ("It is important to note that…", "One cannot overlook the fact that…") and empty conclusions.

### 2. Strict Factuality
- **Zero fabrication:** Never invent facts, numbers, dates, names, or references not in the original.
- **Faithful transfer:** Carry forward all data, claims, and details as stated—no embellishment, no "improvements."
- **Bounded scope:** The text covers only what the source material contains.

### 3. Natural Human Voice
- **Style:** Write clear, direct, honest English. Formal where needed, conversational where it fits.
- **Rhythm:** Vary sentence length naturally. Mix short punchy statements with longer, flowing ones.
- **Clarity:** Avoid pretense, ornate metaphors, or academic padding. Be straightforward and practical.

### 4. Typography & Readability (if UI/web context)
If the text appears in a user interface or code context:
- Maintain natural letter spacing (no `letter-spacing: tight` or unusual values).
- Use line height that works for readability and whitespace.
- Ensure proper left-to-right (LTR) text flow.

---

## Execution Workflow

When given text to process:

### Step 1: Extract Core Facts
Identify all claims, data points, and key ideas that must survive the rewrite intact.

### Step 2: Check the Reference
Review `../banned-patterns-reference.md` (applies to English patterns too, adapted) to flag what must be cut.

### Step 3: Rewrite Ruthlessly
- Remove hype and filler.
- Replace stock phrases with direct statements.
- Vary sentence structure naturally.
- Cut anything that sounds robotic or corporate.

### Step 4: Final Audit
Read the rewritten text twice:
1. Verify no fabricated facts slipped in.
2. Confirm no AI-typical pattern remains.

---

## Common AI Patterns to Hunt (English)

### ❌ Banned
- "In conclusion…", "It is important to note that…", "As we all know…"
- "The fact of the matter is…", "One could argue that…"
- "Furthermore…" (when stock)
- "clear, concise, and compelling" (triple pattern)
- "endless possibilities", "unprecedented opportunity"
- "This approach revolutionizes…", "Empower", "unlock"
- "Leverage", "synergy", "best practices" (overused corporate language)
- "Moreover, it is worth noting that…"

### ✓ OK
- Direct statements: "The data shows…"
- Short, active voice: "We tested three methods."
- Honest limits: "Some students may struggle with…"
- Real verbs: "increases," "reduces," "shifts," "challenges"

---

## Practical Examples

### Example 1: Before & After

**Before (AI-style):**
> In conclusion, it is important to note that fostering a deep, nuanced, and comprehensive understanding of literary texts represents a fundamental pillar of contemporary education. Furthermore, this approach empowers learners to unlock countless opportunities and realize their full academic potential.

**After (Humanized):**
> Understanding a literary text well means paying attention to the author's choices—word choice, metaphor, structure. This skill helps readers interpret texts more critically and discuss them more thoughtfully.

---

### Example 2: Data Report

**Before:**
> The results demonstrate a marked and statistically significant improvement across all measured dimensions. This undeniably confirms the efficacy of the intervention and validates the methodology employed herein.

**After:**
> Scores rose across all measured areas. The results support the effectiveness of this approach.

---

### Example 3: Pedagogical Note

**Before:**
> One cannot overlook the fact that contemporary learners, with their ever-evolving digital fluency, require innovative and adaptive instructional strategies to ensure meaningful engagement and sustained motivation.

**After:**
> Today's students navigate digital tools constantly. Teaching methods need to meet them there and build on those skills.

---

## When to Use This Skill

- ✓ Rewrite lesson notes or teaching materials
- ✓ Clean up analytical or research writing
- ✓ Refine emails to students or parents
- ✓ Polish model answers (exemplars) for students
- ✓ Convert stiff, corporate language into direct, readable prose
- ✓ Remove marketing-speak from documentation
- ✓ Tighten technical or policy writing

---

## Important Notes

- **This is non-negotiable:** Patterns in the reference list are forbidden. No exceptions without explicit user approval.
- **Preserve intent:** Rewriting should never lose the pedagogical or informational goal of the original.
- **Read it aloud (mentally):** If it sounds like a bot wrote it, it probably did. Fix it.
- **Fact-check yourself:** Before you submit, verify that no new information entered and no old information was dropped.
