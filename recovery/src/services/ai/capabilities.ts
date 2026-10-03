import type { AiCapability, AiCapabilityDefinition } from './types'

export const AI_CAPABILITIES: Record<AiCapability, AiCapabilityDefinition> = {
  recovery_copilot: {
    audience: 'athlete',
    feature: 'ai.copilot',
    purpose: 'Answer the athlete\'s questions about their own recovery data and help them prepare questions for their team.',
  },
  recovery_trend_summary: {
    audience: 'athlete',
    feature: 'ai.insights',
    purpose: 'Summarise trends in the athlete\'s check-ins and recovery score over the period provided.',
  },
  journal_summary: {
    audience: 'athlete',
    feature: 'ai.insights',
    purpose: 'Summarise the athlete\'s journal entries for the period provided, in their own voice.',
  },
  document_summary: {
    audience: 'athlete',
    feature: 'documents.vault',
    purpose: 'Explain a medical document in plain language without adding interpretation beyond the text.',
  },
  milestone_suggestion: {
    audience: 'athlete',
    feature: 'milestones.advanced',
    purpose: 'Suggest milestones to DISCUSS with the athlete\'s team. Suggestions are never targets or clearance.',
  },
  athlete_progress_summary: {
    audience: 'athlete',
    feature: 'ai.insights',
    purpose: 'Write a motivating, factual summary of the athlete\'s progress so far.',
  },
  professional_progress_summary: {
    audience: 'professional',
    feature: 'ai.insights',
    purpose: 'Summarise adherence, check-in trends and changes since the last review for a professional, using only data they are authorised to see.',
  },
}
