const axios = require("axios")
const readline = require("readline-sync")

const OLLAMA_URL = "http://localhost:11434/api/generate"
const MODEL = "qwen2.5:7b"

async function askLLM(prompt) {
  const response = await axios.post(OLLAMA_URL, {
    model: MODEL,
    prompt: prompt,
    stream: false
  })

  return response.data.response
}

const agents = {
  dev: "responsável por escrever código e arquitetar sistemas SaaS",
  infra: "responsável por infraestrutura, docker, cloud e servidores",
  product: "responsável por design de produto e roadmap",
  growth: "responsável por marketing e crescimento",
  analytics: "responsável por métricas e dados"
}

async function masterAgent(task) {

  const plannerPrompt = `
Você é um AI CTO que cria e gerencia SAAS e AIOS.

Sua missão é decidir qual agente deve executar a tarefa.

Agentes disponíveis:
${Object.entries(agents).map(a => `${a[0]}: ${a[1]}`).join("\n")}

Tarefa:
${task}

Responda no formato JSON:
{
"agent": "nome do agente",
"instruction": "instrução detalhada"
}
`

  const plan = await askLLM(plannerPrompt)

  let parsed
  try {
    parsed = JSON.parse(plan)
  } catch {
    console.log("Erro interpretando resposta do LLM")
    console.log(plan)
    return
  }

  console.log("\nMaster decidiu usar:", parsed.agent)

  const agentPrompt = `
Você é o agente ${parsed.agent}.

Sua função: ${agents[parsed.agent]}

Execute a tarefa:

${parsed.instruction}
`

  const result = await askLLM(agentPrompt)

  console.log("\nResultado do agente:\n")
  console.log(result)
}

async function main() {

  console.log("\nAIOS MASTER AGENT\n")

  while (true) {

    const task = readline.question("\nDigite uma tarefa (ou exit): ")

    if (task === "exit") break

    await masterAgent(task)
  }
}

main()
