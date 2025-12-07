/**
 * Prompt templates and presets
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  mode: "miriam" | "compare" | "judge" | "research";
  prompt: string;
  system?: string;
  defaultModels?: string[];
  category: string;
}

export const TEMPLATES: Template[] = [
  {
    id: "coding-assistant",
    name: "Coding Assistant",
    description: "Get help with programming questions and code review",
    mode: "miriam",
    prompt: "Explain how to implement a REST API endpoint in Python using FastAPI",
    system: "You are an expert software engineer. Provide clear, well-structured code examples with explanations.",
    category: "Development",
  },
  {
    id: "code-comparison",
    name: "Code Comparison",
    description: "Compare different approaches to solving a coding problem",
    mode: "compare",
    prompt: "Write a function to find the maximum element in a binary tree. Show different algorithmic approaches.",
    system: "You are a software engineer. Provide clean, efficient code with time/space complexity analysis.",
    defaultModels: ["qwen/qwen-2.5-7b-instruct:free", "deepseek/deepseek-chat:free", "meta-llama/llama-3.2-3b-instruct:free"],
    category: "Development",
  },
  {
    id: "marketing-copy",
    name: "Marketing Copy",
    description: "Generate compelling marketing copy for your product",
    mode: "compare",
    prompt: "Write a short marketing description for a new AI-powered project management tool",
    system: "You are a professional copywriter. Create engaging, persuasive copy that highlights key benefits.",
    defaultModels: ["qwen/qwen-2.5-7b-instruct:free", "deepseek/deepseek-chat:free"],
    category: "Marketing",
  },
  {
    id: "translation",
    name: "Translation Quality",
    description: "Compare translation quality across models",
    mode: "judge",
    prompt: "Translate the following to French: 'The quick brown fox jumps over the lazy dog. This is a test of translation quality across multiple languages.'",
    system: "You are a professional translator. Provide accurate, natural translations.",
    defaultModels: ["qwen/qwen-2.5-7b-instruct:free", "deepseek/deepseek-chat:free", "meta-llama/llama-3.2-3b-instruct:free"],
    category: "Language",
  },
  {
    id: "qa-evaluation",
    name: "Q&A Evaluation",
    description: "Judge which model provides the best answer to a question",
    mode: "judge",
    prompt: "What are the main differences between machine learning and deep learning? Provide a comprehensive explanation.",
    system: "You are an AI researcher. Provide accurate, detailed explanations with examples.",
    defaultModels: ["qwen/qwen-2.5-7b-instruct:free", "deepseek/deepseek-chat:free", "meta-llama/llama-3.2-3b-instruct:free"],
    category: "Education",
  },
  {
    id: "research-analysis",
    name: "Research Analysis",
    description: "Deep dive into a topic with multiple expert perspectives",
    mode: "research",
    prompt: "What are the potential impacts of quantum computing on cybersecurity? Analyze from technical, business, and ethical perspectives.",
    category: "Research",
  },
  {
    id: "product-strategy",
    name: "Product Strategy",
    description: "Get strategic insights from multiple expert viewpoints",
    mode: "research",
    prompt: "What are the key considerations when launching a new SaaS product in 2024?",
    category: "Business",
  },
  {
    id: "creative-writing",
    name: "Creative Writing",
    description: "Compare creative writing styles across models",
    mode: "compare",
    prompt: "Write a short story (200 words) about a robot discovering emotions for the first time.",
    system: "You are a creative writer. Write engaging, emotionally resonant stories.",
    defaultModels: ["qwen/qwen-2.5-7b-instruct:free", "deepseek/deepseek-chat:free"],
    category: "Creative",
  },
];

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: string): Template[] {
  return TEMPLATES.filter((t) => t.category === category);
}

export function getTemplatesByMode(mode: Template["mode"]): Template[] {
  return TEMPLATES.filter((t) => t.mode === mode);
}
