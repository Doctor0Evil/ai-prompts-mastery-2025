const { ratePrompt } = require('./utils/promptQualityRater');

const prompt = `
Act as a senior technical writer.
Explain how to use this JavaScript library to a beginner developer.
Include a short example and a 3-step getting-started checklist.
`;

const result = ratePrompt(prompt);
console.log(JSON.stringify(result, null, 2));
