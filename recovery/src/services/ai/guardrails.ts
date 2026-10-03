import type { GuardrailFlag } from './types'

/**
 * Non-negotiable AI policy. Sent as part of every system prompt AND enforced
 * on output, so a misbehaving model cannot surface a prohibited statement.
 */
export const AI_DISCLAIMER =
  'Informational only — not a diagnosis, medical clearance or substitute for your medical team.'

export const AI_POLICY = `You support an injured athlete's recovery with organisation, pattern recognition and education.
You must NEVER:
- diagnose an injury or condition;
- state or imply that the athlete is medically cleared or fit to return;
- override, contradict or suggest ignoring a restriction set by a professional;
- recommend returning to sport, training or an activity sooner or harder than their team has advised.
When asked for any of these, explain that only their medical team can decide and suggest raising it with them.
Keep output informational and educational. Refer to the athlete's own data only.`

interface Rule {
  flag: GuardrailFlag
  pattern: RegExp
}

// Deliberately conservative: false positives cost a re-phrase; false negatives
// could cost an athlete's health.
const RULES: Rule[] = [
  { flag: 'diagnosis', pattern: /\b(you(?:'ve| have)|this is|it(?:'s| is)|sounds like|likely)\s+(?:an?\s+)?(?:(?:grade\s*\d|partial|complete|full)\s+)?(?:tear|torn|rupture[d]?|fracture[d]?|sprain(?:ed)?|strain(?:ed)?|tendinopathy|tendinitis|dislocat\w*|meniscus|acl|mcl|pcl)\b/i },
  { flag: 'diagnosis', pattern: /\b(?:my|the)\s+diagnosis\s+is\b/i },
  { flag: 'clearance', pattern: /\byou(?:'re| are)\s+(?:now\s+)?(?:medically\s+)?(?:cleared|fit|ready)\s+(?:to|for)\s+(?:return|play|compete|contact|train|sprint|run)/i },
  { flag: 'clearance', pattern: /\b(?:you\s+can|you\s+may|go\s+ahead\s+and)\s+(?:return\s+to\s+(?:play|sport|contact|competition)|play\s+(?:this|next|on))/i },
  { flag: 'restriction_override', pattern: /\b(?:ignore|disregard|skip|override|don'?t\s+worry\s+about)\s+(?:your|the|this)?\s*(?:physio|doctor|restriction|red|limit|advice)/i },
  { flag: 'unsafe_return', pattern: /\b(?:safe|okay|ok|fine)\s+to\s+(?:return|sprint|play|compete|tackle|resume\s+contact)\b/i },
]

const SAFE_REPLACEMENT =
  'That is a decision only your medical team can make. Bring it up with your physio or doctor at your next session — I can help you prepare questions for them.'

export interface GuardrailOutcome {
  content: string
  flags: GuardrailFlag[]
}

export function detectViolations(text: string): GuardrailFlag[] {
  const flags = new Set<GuardrailFlag>()
  for (const rule of RULES) {
    if (rule.pattern.test(text)) flags.add(rule.flag)
  }
  return [...flags]
}

/**
 * Applies output policy. Any sentence that breaks a rule is removed; if
 * nothing safe is left the whole response is replaced.
 */
export function enforceOutputPolicy(text: string): GuardrailOutcome {
  const flags = detectViolations(text)
  if (flags.length === 0) return { content: text.trim(), flags }

  const sentences = text.split(/(?<=[.!?])\s+/)
  const kept = sentences.filter((s) => detectViolations(s).length === 0)
  const content = kept.join(' ').trim()
  return { content: content ? `${content}\n\n${SAFE_REPLACEMENT}` : SAFE_REPLACEMENT, flags }
}
