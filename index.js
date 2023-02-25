#!/usr/bin/env node

const axios = require("axios");
const prompts = require("prompts");
const fs = require("fs");
const os = require("os");
const { Configuration, OpenAIApi } = require("openai");

const configFilePath = `${os.homedir()}/.codegptconfig`;

async function generateCode(prompt, apiKey) {
  const configuration = new Configuration({
    apiKey: apiKey,
  });
  const openai = new OpenAIApi(configuration);
  
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  // const data = response.data.choices[0].text.trim();
  const data = response.data.choices.map(choice => choice.text.trim()).join('\n');

  return data;
}

const promptApiKey = async () => {
  const { apiKey } = await prompts({
    type: "text",
    name: "apiKey",
    message: "Enter your OpenAI API key:",
  });

  return apiKey;
};

async function isExistOpenApiKey() {
  if (!fs.existsSync(configFilePath)) {
    const apiKey = await promptApiKey();
    fs.writeFileSync(configFilePath, apiKey);
  }
}

async function promptFilePath() {
  const defaultPath = process.cwd();
  const { filePath } = await prompts({
    type: 'text',
    name: 'filePath',
    message: 'Enter file path (default: current directory):',
    initial: defaultPath
  });

  return filePath || defaultPath;
}

async function getLanguage() {
  const { language } = await prompts({
    type: 'select',
    name: 'language',
    message: 'Select programming language:',
    choices: [
      { title: 'JavaScript', value: { text: 'JavaScript', ext: 'js' } },
      { title: 'TypeScript', value: { text: 'TypeScript', ext: 'ts' } },
      { title: 'React + TypeScript', value: { text: 'React in TypeScript', ext: 'tsx' } },
      { title: 'Python', value: { text: 'Python', ext: 'py' } },
      { title: 'Ruby', value: { text: 'Ruby', ext: 'rb' } },
      { title: 'Java', value: { text: 'Java', ext: 'java' } },
      { title: 'C++', value: { text: 'C++', ext: 'cpp' } }
    ]
  });

  return language;
}

const createCodeFiles = async ({ language, fileName, filePath, request }) => {
  const apiKey = fs.readFileSync(configFilePath, "utf-8");
  const code = await generateCode(`// Generate ${language.text} code\n${request}`, apiKey);

  const extension = language.ext;
  const path = `${filePath}/${fileName}.${extension}`;

  fs.writeFile(path, code, (err) => {
    if (err) throw err;
    console.log(`Code generated successfully at ${path}`);
  });
};

const run = async () => {
  await isExistOpenApiKey()

  const { request } = await prompts({
    type: "text",
    name: "request",
    message: "Give the description of code you want to generate",
  });

  const language = await getLanguage()

  const { fileName } = await prompts({
    type: "text",
    name: "fileName",
    message: "Enter file name",
  });

  const filePath = await promptFilePath();

  await createCodeFiles({ language, fileName, filePath, request });
};

run()


