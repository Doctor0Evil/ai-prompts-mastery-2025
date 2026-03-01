/**
 * promptQualityRater.js
 *
 * Utility for AI Prompts Mastery 2025:
 * - Scores a single prompt on clarity, structure, context, and actionability.
 * - Returns a normalized quality score (0–100) plus suggestions.
 * - Optionally generates a cleaned-up version of the prompt.
 */

/**
 * Heuristic scoring utilities
 */

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasPlaceholders(text) {
  return /\{[^}]+\}/.test(text);
}

function hasRoleInstruction(text) {
  return /(you are|act as|role:|system:)/i.test(text);
}

function hasStepsOrBullets(text) {
  return /(^\s*[\-\*]\s+|^\s*\d+\.\s+)/m.test(text);
}

function hasOutputConstraints(text) {
  return /(format|output|return|respond|structure|length|words|tokens)/i.test(text);
}

function hasExamples(text) {
  return /(example:|for instance|e\.g\.)/i.test(text);
}

/**
 * Main scoring function
 */
function ratePrompt(prompt) {
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return {
      score: 0,
      breakdown: {
        clarity: 0,
        structure: 0,
        context: 0,
        actionability: 0
      },
      suggestions: ['Provide a non-empty prompt string.'],
      improvedPrompt: ''
    };
  }

  const cleaned = prompt.trim();
  const wc = wordCount(cleaned);

  // Clarity: length not too short, not too long, avoids being a single vague sentence
  let clarity = 0;
  if (wc >= 8 && wc <= 250) clarity += 60;
  if (wc >= 20 && wc <= 150) clarity += 20;
  if (/[\.!?]$/.test(cleaned)) clarity += 10;
  if (hasPlaceholders(cleaned)) clarity += 10;
  clarity = Math.min(clarity, 100);

  // Structure: presence of bullets/steps, sections, or explicit formatting hints
  let structure = 0;
  if (hasStepsOrBullets(cleaned)) structure += 40;
  if (/\n{2,}/.test(cleaned)) structure += 20;
  if (hasOutputConstraints(cleaned)) structure += 40;
  structure = Math.min(structure, 100);

  // Context: role, domain hints, or examples
  let context = 0;
  if (hasRoleInstruction(cleaned)) context += 40;
  if (hasPlaceholders(cleaned)) context += 30;
  if (hasExamples(cleaned)) context += 30;
  context = Math.min(context, 100);

  // Actionability: clear ask plus constraints or steps
  let actionability = 0;
  if (/(write|generate|create|analyze|explain|summarize|design|debug|plan)/i.test(cleaned)) {
    actionability += 40;
  }
  if (hasStepsOrBullets(cleaned)) actionability += 20;
  if (hasOutputConstraints(cleaned)) actionability += 40;
  actionability = Math.min(actionability, 100);

  // Weighted overall score
  const score = Math.round(
    clarity * 0.35 +
    structure * 0.25 +
    context * 0.2 +
    actionability * 0.2
  );

  const suggestions = [];

  if (wc < 8) {
    suggestions.push('Add more detail: specify goal, audience, and constraints.');
  } else if (wc > 250) {
    suggestions.push('Shorten the prompt: focus on the key outcome and 2–3 constraints.');
  }

  if (!hasRoleInstruction(cleaned)) {
    suggestions.push('Consider adding a role, e.g., "You are an expert {domain} assistant...".');
  }

  if (!hasStepsOrBullets(cleaned)) {
    suggestions.push('Break complex tasks into numbered steps or bullet points.');
  }

  if (!hasOutputConstraints(cleaned)) {
    suggestions.push('Specify output format or length, e.g., "Return a 5-bullet summary".');
  }

  if (!hasPlaceholders(cleaned)) {
    suggestions.push('Introduce {placeholders} so users can easily customize the prompt.');
  }

  const improvedPrompt = buildImprovedPrompt(cleaned);

  return {
    score,
    breakdown: {
      clarity,
      structure,
      context,
      actionability
    },
    suggestions,
    improvedPrompt
  };
}

/**
 * Builds a gently normalized version of the prompt:
 * - Ensures a role line at the top.
 * - Ensures a clear "Task" and "Output" section if missing.
 */
function buildImprovedPrompt(original) {
  const lines = original.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const body = lines.join('\n');

  const hasTaskHeading = /task:/i.test(body);
  const hasOutputHeading = /output:/i.test(body);
  const hasRole = hasRoleInstruction(body);

  const normalized = [];

  if (!hasRole) {
    normalized.push('You are a helpful, expert AI assistant specializing in {domain}.');
    normalized.push('');
  }

  if (!hasTaskHeading) {
    normalized.push('Task:');
  }
  normalized.push(hasTaskHeading ? body : body);
  normalized.push('');

  if (!hasOutputHeading) {
    normalized.push('Output:');
    normalized.push('- Provide a clear, structured response.');
    normalized.push('- Use bullet points where helpful.');
    normalized.push('- Keep the answer concise but complete.');
  }

  return normalized.join('\n');
}

module.exports = {
  ratePrompt
};
