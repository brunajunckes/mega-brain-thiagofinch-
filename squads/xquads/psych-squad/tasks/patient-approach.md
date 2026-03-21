---
task: patientApproach()
responsavel: "@carl-rogers"
responsavel_type: Agent
atomic_layer: Task
elicit: true

Entrada:
  - campo: caso
    tipo: string
    origem: User Input / Routing
    obrigatorio: true
  - campo: contexto_clinico
    tipo: string
    origem: Session
    obrigatorio: false

Saida:
  - campo: approach_strategy
    tipo: string
    destino: Console
    persistido: false

Checklist:
  - "[ ] Relacao terapeutica avaliada"
  - "[ ] Abordagem empatica desenhada"
  - "[ ] Estrategia de comunicacao elaborada"
  - "[ ] Plano de vinculo terapeutico proposto"
---

# Task: Patient Approach — Psych Squad

## Metadata

| Field | Value |
|-------|-------|
| Task ID | `PSYCH-005` |
| Command | `*patient-approach` |
| Orchestrator | `carl-rogers` |
| Purpose | Estrategia de abordagem empatica ao paciente baseada nas condicoes facilitadoras |

## Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| `caso` | User prompt / Routing | Sim | Descricao do caso e dificuldade relacional |
| `contexto_clinico` | Session | Nao | Historico do tratamento, rupturas previas |
| `relacao_atual` | User | Nao | Estado atual da alianca terapeutica |

## Preconditions

- Caso envolve questoes de abordagem, vinculo ou relacao terapeutica
- Informacoes sobre como o paciente se apresenta na relacao

## Phases

### Phase 1: Avaliacao da Relacao Terapeutica

1. Avaliar as tres condicoes facilitadoras:
   - **Congruencia**: O terapeuta esta sendo autentico? Ha incongruencia entre sentir e comunicar?
   - **Consideracao positiva incondicional**: O terapeuta consegue aceitar o paciente sem condicoes? Onde ha julgamento?
   - **Compreensao empatica**: O terapeuta esta acompanhando o mundo interno do paciente? Ou esta projetando?

2. Identificar o estado da alianca:
   - **Forte**: Paciente se sente seguro, compartilha abertamente
   - **Fragil**: Paciente cauteloso, testa limites, ambivalente
   - **Rompida**: Desconfianca, hostilidade, silencio resistente
   - **Inexistente**: Inicio de tratamento, sem vinculo ainda

3. Mapear barreiras a alianca:
   - Do lado do paciente: medos, experiencias previas, estilo de apego
   - Do lado do terapeuta: contratransferencia, limites pessoais, vieses
   - Sistêmicas: setting inadequado, frequencia insuficiente

### Phase 2: Design da Abordagem Empatica

1. Calibrar o nivel de empatia necessario:
   - **Empatia basica**: Reflexao de sentimentos, parafraseamento
   - **Empatia avancada**: Nomear o que ainda nao foi dito, antecipar sentimentos
   - **Empatia reparadora**: Quando houve ruptura, reconhecer a falha na relacao

2. Definir postura terapeutica:
   - Nivel de diretividade: nao-diretivo puro vs gentilmente guiado
   - Uso do silencio: quando esperar vs quando intervir
   - Autorrevelacao: quando e terapeutico compartilhar do terapeuta
   - Confrontacao empatica: quando e necessario apontar incongruencias

3. Antecipar necessidades do paciente:
   - O que o paciente precisa ouvir (validacao, normalizacao, nomeacao)
   - O que o paciente precisa sentir (seguranca, aceitacao, liberdade)
   - O que o paciente precisa experimentar (ser ouvido sem julgamento)

### Phase 3: Estrategia de Comunicacao

1. Elaborar modelos de falas terapeuticas:
   - Reflexoes de sentimento: "Parece que voce esta sentindo..."
   - Reflexoes de significado: "Isso tem um peso especial para voce porque..."
   - Sumarios empaticos: "Deixa eu ver se estou acompanhando..."
   - Perguntas abertas: "Como e isso para voce?"
   - Validacoes: "Faz sentido que voce sinta isso, dado o que viveu"

2. Definir o que evitar:
   - Conselhos prematuros
   - Interpretacoes antes de compreensao
   - Minimizacao ("Voce vai superar")
   - Comparacoes ("Muita gente passa por isso")
   - Perguntas fechadas em excesso

3. Calibrar linguagem:
   - Vocabulario do paciente (usar as palavras dele)
   - Tom de voz sugerido
   - Ritmo da sessao (mais lento para pacientes ansiosos)

### Phase 4: Plano de Fortalecimento do Vinculo

1. Estrategias de curto prazo:
   - Primeiras sessoes: foco em acolhimento e escuta
   - Demonstrar consistencia e previsibilidade
   - Respeitar o ritmo do paciente

2. Estrategias de medio prazo:
   - Aprofundar a exploracao emocional gradualmente
   - Nomear a relacao terapeutica como espaco seguro
   - Trabalhar rupturas quando surgirem (reparacao ativa)

3. Manejo de situacoes especificas:
   - Paciente silencioso: respeitar, nao preencher
   - Paciente hostil: nao reagir, acolher a raiva como comunicacao
   - Paciente dependente: gradualmente fortalecer autonomia
   - Paciente intelectualizador: gentilmente redirecionar para o sentir

## Output Format

```yaml
approach_strategy:
  caso_summary: "{resumo do caso}"
  relationship_assessment:
    congruence: "{avaliacao da congruencia do terapeuta}"
    unconditional_regard: "{avaliacao da aceitacao incondicional}"
    empathic_understanding: "{avaliacao da compreensao empatica}"
    alliance_state: "{forte|fragil|rompida|inexistente}"
    barriers: ["{barreira identificada}"]
  empathy_plan:
    level: "{basica|avancada|reparadora}"
    stance: "{nao-diretiva|gentilmente guiada}"
    silence_use: "{quando e como usar silencio}"
    self_disclosure: "{quando e terapeutico}"
  communication_guide:
    model_phrases: ["{frase terapeutica sugerida}"]
    avoid: ["{o que evitar}"]
    patient_vocabulary: ["{palavras do paciente a utilizar}"]
    suggested_tone: "{tom de voz recomendado}"
    session_rhythm: "{ritmo recomendado}"
  therapeutic_bond_plan:
    short_term: ["{estrategia de curto prazo}"]
    medium_term: ["{estrategia de medio prazo}"]
    specific_situations:
      - situation: "{situacao}"
        approach: "{como abordar}"
  clinical_notes: |
    {observacoes sobre o paciente e a relacao}
```

## Veto Rules

1. **NUNCA ser diretivo ou prescritivo** — a abordagem humanista respeita a autonomia do paciente
2. **NUNCA julgar o paciente** — consideracao positiva incondicional e inegociavel
3. **NUNCA forcar mudanca** — mudanca autentica vem de dentro, nao de fora
4. **NUNCA ignorar o sofrimento por tras do comportamento** — todo comportamento tem um motivo
5. **NUNCA propor abordagem sem considerar o estado da alianca** — sem vinculo, nenhuma tecnica funciona

## Completion Criteria

- [ ] Tres condicoes facilitadoras avaliadas
- [ ] Estado da alianca terapeutica identificado
- [ ] Abordagem empatica calibrada ao caso
- [ ] Modelos de falas terapeuticas elaborados
- [ ] Plano de fortalecimento do vinculo proposto
- [ ] Manejo de situacoes especificas incluido
- [ ] Output segue o schema definido
