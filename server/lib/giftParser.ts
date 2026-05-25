/**
 * GIFT (General Import Format Technology) parser
 * Parses GIFT format files used in Moodle
 * 
 * Basic GIFT format:
 * ::Question Title:: Question text {~wrong answer ~another wrong = correct answer ~another wrong}
 * 
 * Question types supported:
 * - Multiple choice: {~option1 =option2 ~option3}
 * - True/False: {T} or {F}
 * - Short answer: {answer1 =answer2}
 * - Essay: {}
 * - Weighted answers: {~%50%partial ~%-50%wrong =answer}
 * 
 * Format details:
 * = indicates correct answer (100% weight)
 * ~ indicates wrong answers (distractors, 0% weight)
 * %N% indicates weight percentage (can be 0-100, or negative for penalty)
 * # is used for feedback
 * 
 * Weighted answer examples:
 * ~%50%answer     - 50% partial credit
 * ~%-50%answer    - 50% penalty for this wrong answer
 * ~%33.333%answer - 33.333% credit for this option
 */

export interface GiftQuestion {
  title?: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'numerical' | 'matching';
  options?: {
    text: string;
    isCorrect: boolean;
    weight?: number; // Percentage: 100 for correct, 0-100 for partial, negative for wrong
    feedback?: string;
  }[];
  correctAnswers?: string[];
  feedback?: string;
}

export interface ParsedGiftData {
  title?: string;
  description?: string;
  questions: GiftQuestion[];
  questionCount: number;
  parseErrors: string[];
}

/**
 * Remove HTML/XML comments and escape sequences
 */
function sanitizeLine(line: string): string {
  // Remove HTML comments
  line = line.replace(/<!--.*?-->/g, '');
  // Unescape common entities
  line = line.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  return line;
}

/**
 * Parse individual question from GIFT format
 */
function parseQuestion(questionText: string): GiftQuestion | null {
  const trimmed = questionText.trim();
  if (!trimmed) return null;

  let title: string | undefined;
  let questionBody = trimmed;

  // Extract title if it exists: ::Title::
  const titleMatch = questionBody.match(/^::(.*?)::/);
  if (titleMatch) {
    title = titleMatch[1].trim();
    questionBody = questionBody.substring(titleMatch[0].length).trim();
  }

  // Extract answers section: {....}
  const answerMatch = questionBody.match(/\{([^}]*)\}$/);
  if (!answerMatch) {
    // No answers - might be essay question
    return {
      title,
      text: questionBody,
      type: 'essay',
    };
  }

  const answerSection = answerMatch[1];
  const textPart = questionBody.substring(0, questionBody.length - answerMatch[0].length).trim();

  // Parse answers
  const options: GiftQuestion['options'] = [];
  const correctAnswers: string[] = [];

  // Check for true/false
  if (answerSection.toUpperCase() === 'T' || answerSection.toUpperCase() === 'TRUE') {
    return {
      title,
      text: textPart,
      type: 'true_false',
      correctAnswers: ['true'],
    };
  }
  if (answerSection.toUpperCase() === 'F' || answerSection.toUpperCase() === 'FALSE') {
    return {
      title,
      text: textPart,
      type: 'true_false',
      correctAnswers: ['false'],
    };
  }

  // Parse multiple choice or short answer
  const answerParts = answerSection.split(/(?:^|[^\\])~|(?:^|[^\\])=/);
  let isMultipleChoice = answerSection.includes('~');

  // Better parsing that handles ~ and = properly with weights
  const answerTokens: { text: string; isCorrect: boolean; weight?: number; feedback?: string }[] = [];
  let currentPos = 0;
  let isCorrect = answerSection[0] === '=';

  // Split by ~ and = while preserving the delimiter and handling weights
  const regex = /([~=](?:%[-\d.]+%)?[^~=]*)/g;
  let match;
  while ((match = regex.exec(answerSection)) !== null) {
    const token = match[1];
    const delimiter = token[0]; // ~ or =
    let isCorr = delimiter === '=';
    let weight: number | undefined;
    let answer = token.substring(1).trim();

    // Extract weight if present: %50% or %-50%
    const weightMatch = answer.match(/^%(-?\d+(?:\.\d+)?)%\s*/);
    if (weightMatch) {
      weight = parseFloat(weightMatch[1]);
      answer = answer.substring(weightMatch[0].length).trim();
      // If weight is explicitly provided, use it to determine correctness
      // weight > 0 means partial or full credit, weight < 0 means penalty
      if (weight === 100) {
        isCorr = true;
      } else if (weight <= 0) {
        isCorr = false;
      }
    } else if (isCorr) {
      // If no explicit weight but marked with =, it's 100% correct
      weight = 100;
    } else {
      // If no explicit weight and marked with ~, it's 0% (wrong)
      weight = 0;
    }

    // Extract feedback if present: answer # feedback
    let feedback: string | undefined;
    const feedbackMatch = answer.match(/#\s*(.*?)$/);
    if (feedbackMatch) {
      feedback = feedbackMatch[1].trim();
      answer = answer.substring(0, feedbackMatch.index).trim();
    }

    if (answer) {
      answerTokens.push({
        text: answer,
        isCorrect: isCorr,
        weight,
        feedback,
      });
      if (isCorr) {
        correctAnswers.push(answer);
      }
    }
  }

  // If no tokens found, this might be a short answer
  if (answerTokens.length === 0) {
    // Try simple split
    const answers = answerSection.split(/[~=]/);
    for (const answer of answers) {
      const trimmedAnswer = answer.trim();
      if (trimmedAnswer) {
        const isCorr = answerSection.includes(`=${trimmedAnswer}`);
        answerTokens.push({
          text: trimmedAnswer,
          isCorrect: isCorr,
          weight: isCorr ? 100 : 0,
        });
      }
    }
  }

  const question: GiftQuestion = {
    title,
    text: textPart,
    type: answerTokens.length > 2 || isMultipleChoice ? 'multiple_choice' : 'short_answer',
    options: answerTokens,
    correctAnswers: correctAnswers.length > 0 ? correctAnswers : undefined,
  };

  return question;
}

/**
 * Parse GIFT format content
 */
export function parseGiftContent(content: string): ParsedGiftData {
  const lines = content.split('\n');
  const questions: GiftQuestion[] = [];
  const parseErrors: string[] = [];

  let currentQuestion = '';
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = sanitizeLine(lines[i]).trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('//')) continue;

    // Track brace depth to handle multi-line questions
    braceDepth += (line.match(/{/g) || []).length;
    braceDepth -= (line.match(/}/g) || []).length;

    currentQuestion += (currentQuestion ? ' ' : '') + line;

    // If we've closed all braces, we have a complete question
    if (currentQuestion && braceDepth === 0 && currentQuestion.includes('{') && currentQuestion.includes('}')) {
      try {
        const question = parseQuestion(currentQuestion);
        if (question) {
          questions.push(question);
        }
        currentQuestion = '';
      } catch (error) {
        parseErrors.push(`Error parsing question on line ${i + 1}: ${error}`);
        currentQuestion = '';
      }
    }
  }

  // Handle last question if incomplete
  if (currentQuestion.trim()) {
    try {
      const question = parseQuestion(currentQuestion);
      if (question) {
        questions.push(question);
      }
    } catch (error) {
      parseErrors.push(`Error parsing final question: ${error}`);
    }
  }

  return {
    questions,
    questionCount: questions.length,
    parseErrors,
  };
}

/**
 * Validate GIFT file format
 */
export function validateGiftFormat(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!content || content.trim().length === 0) {
    errors.push('GIFT file is empty');
    return { isValid: false, errors };
  }

  // Check for matching braces
  const openBraces = (content.match(/{/g) || []).length;
  const closeBraces = (content.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
  }

  // Try to parse
  const parsed = parseGiftContent(content);
  if (parsed.questionCount === 0) {
    errors.push('No valid questions found in GIFT format');
  }

  if (parsed.parseErrors.length > 0) {
    errors.push(...parsed.parseErrors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
