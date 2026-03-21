"""
Long-form content generation module for God Mode.
Generates 3000-4000 words per chapter using materials as source.
"""

import re
import random
import hashlib
from typing import Optional, List, Dict


# ===== EXPANSION ENGINE =====

def expand_paragraph(rng, base_text: str, topic: str, min_words: int = 150) -> str:
    """Expand a short statement into a full paragraph of min_words."""
    words = base_text.split()
    if len(words) >= min_words:
        return base_text
    
    expansions = [
        f" Isso é particularmente significativo quando consideramos o contexto mais amplo de {topic}. "
        f"Não se trata apenas de um detalhe isolado, mas de um padrão que se repete ao longo de "
        f"toda a narrativa, revelando conexões que não são imediatamente óbvias para o observador casual.",
        
        f" Para compreender plenamente a importância deste momento, é preciso voltar alguns passos "
        f"e examinar o que levou até aqui. As circunstâncias não surgiram do nada — foram construídas "
        f"ao longo do tempo, camada por camada, até que o peso acumulado tornou inevitável o que aconteceu.",
        
        f" O que torna este ponto particularmente fascinante é a forma como ele se conecta com "
        f"outros elementos da história. Como peças de um quebra-cabeça que só fazem sentido quando "
        f"vistas em conjunto, cada detalhe contribui para uma imagem maior e mais completa.",
        
        f" Há uma lição importante aqui que vai além do óbvio. Na superfície, parece ser simplesmente "
        f"mais um evento entre muitos. Mas quando analisamos com mais cuidado, percebemos que este "
        f"momento carrega em si as sementes de tudo o que viria depois.",
        
        f" É impossível falar sobre isso sem mencionar o contexto emocional envolvido. As decisões "
        f"que foram tomadas não aconteceram no vácuo — foram influenciadas por medos, esperanças, "
        f"experiências passadas e pela pressão das circunstâncias do momento.",
        
        f" Quando olhamos para trás com a clareza que só o tempo proporciona, os padrões se tornam "
        f"evidentes. O que na época parecia confuso ou aleatório agora revela uma lógica própria, "
        f"uma sequência de causa e efeito que conecta todos os acontecimentos.",
    ]
    
    result = base_text
    while len(result.split()) < min_words:
        result += rng.choice(expansions)
    return result


def generate_transition(rng, from_section: str, to_section: str) -> str:
    """Generate a transition paragraph between sections."""
    transitions = [
        f"Mas essa é apenas parte da história. Para compreender o quadro completo, é necessário "
        f"examinar outro aspecto igualmente importante que se entrelaça com o que acabamos de ver.",
        
        f"Essa compreensão nos leva naturalmente ao próximo ponto, que aprofunda e complementa "
        f"o que foi discutido até aqui. A conexão entre esses elementos é mais profunda do que "
        f"pode parecer à primeira vista.",
        
        f"Com essa base estabelecida, podemos agora explorar uma dimensão adicional que enriquece "
        f"significativamente nossa compreensão. O que segue adiciona camadas de complexidade ao "
        f"panorama que estamos construindo.",
        
        f"A narrativa que se desenrola a partir daqui revela novos aspectos que, embora distintos "
        f"do que vimos anteriormente, compartilham raízes comuns e se alimentam mutuamente. "
        f"É nessa interseção que encontramos os insights mais valiosos.",
    ]
    return rng.choice(transitions)


# ===== LONG-FORM FROM MATERIALS =====

def gen_long_from_materials(
    rng, title: str, num: int, genre: str, topic: str,
    project_title: str, materials_text: str, key_facts: List[str],
    is_fiction: bool, target_words: int = 3500
) -> str:
    """Generate 3000-4000 word chapter from source materials."""
    
    # Split materials into chunks for this chapter
    total_chapters = 10  # assume
    chunk_size = max(500, len(materials_text) // total_chapters)
    start = min((num - 1) * chunk_size, max(0, len(materials_text) - chunk_size))
    primary_chunk = materials_text[start:start + chunk_size * 2]
    
    # Also get surrounding context
    context_before = materials_text[max(0, start - 500):start]
    context_after = materials_text[start + chunk_size * 2:start + chunk_size * 3]
    
    # Extract sentences from all available text
    all_sentences = [s.strip() for s in re.split(r'[.!?\n]+', primary_chunk) if len(s.strip()) > 15]
    context_sentences = [s.strip() for s in re.split(r'[.!?\n]+', context_before + context_after) if len(s.strip()) > 15]
    
    # Select relevant facts for this chapter
    facts_per_chapter = max(5, len(key_facts) // total_chapters)
    chapter_facts = key_facts[(num-1)*facts_per_chapter : num*facts_per_chapter]
    if not chapter_facts:
        chapter_facts = key_facts[-facts_per_chapter:] if key_facts else []
    
    parts = []
    
    if is_fiction:
        parts.extend(_long_fiction_from_materials(
            rng, title, num, topic, project_title,
            all_sentences, context_sentences, chapter_facts, target_words
        ))
    else:
        parts.extend(gen_long_nonfiction_from_materials(
            rng, title, num, topic, project_title,
            all_sentences, chapter_facts, target_words
        ))
    
    result = "\n\n".join(parts)
    
    # Ensure minimum word count
    while len(result.split()) < target_words * 0.85:
        result += "\n\n" + _gen_filler_section(rng, topic, title, is_fiction)
    
    return result


def _long_fiction_from_materials(rng, title, num, topic, project_title,
                                  sentences, context_sentences, facts, target_words):
    """Long-form fiction chapter from materials (3000-4000 words)."""
    parts = []
    
    # ===== ABERTURA (300-400 palavras) =====
    opening_templates = [
        "Há dias que começam como qualquer outro — o sol nascendo no mesmo ângulo, "
        "os mesmos sons da rua, a mesma rotina que nos dá a ilusão reconfortante de que o mundo "
        "é previsível. {date_ref}foi um desses dias que começou assim, mas que terminaria de "
        "forma completamente diferente.\n\n"
        "É curioso como a memória funciona. Alguns momentos se gravam com uma nitidez quase "
        "fotográfica — cada detalhe preservado, cada sensação registrada com uma fidelidade que "
        "desafia o tempo. Outros, igualmente importantes, se desfazem como neblina sob o sol da "
        "manhã, deixando apenas impressões vagas e a frustração de saber que algo importante "
        "se perdeu. Este momento pertencia à primeira categoria.",

        "A história que estou prestes a contar não é simples. Nenhuma história verdadeira é. "
        "As versões simples são as que contamos para estranhos em festas — resumidas, polidas, "
        "com começo, meio e fim bem definidos. A verdade é sempre mais bagunçada, mais cheia "
        "de contradições, mais humana.\n\n"
        "{first_fact}\n\n"
        "Mas começar pelo começo é mais difícil do que parece. Onde exatamente as coisas "
        "começaram? Qual foi o primeiro dominó a cair na sequência que nos trouxe até aqui? "
        "A resposta depende de quão longe estamos dispostos a olhar para trás.",

        "Se eu pudesse voltar àquele momento e observar a cena de fora — como um espectador "
        "assistindo a um filme que já viu — saberia exatamente o que procurar. Os sinais estavam "
        "todos lá, claros como água. Mas quando estamos dentro da história, vivendo cada segundo "
        "sem o benefício da retrospectiva, até os sinais mais óbvios passam despercebidos.\n\n"
        "{first_fact}\n\n"
        "O que aconteceu a seguir mudaria o curso de tudo. Não de forma dramática — não houve "
        "explosões ou revelações cinematográficas. Foi mais sutil que isso, mais silencioso, "
        "e por isso mesmo mais profundo.",
    ]
    
    first_fact = sentences[0] if sentences else "Os acontecimentos daquele período deixaram marcas que o tempo não apagou"
    date_refs = ["Aquele dia ", "Naquela manhã ", "Naquele momento ", ""]
    
    opening = rng.choice(opening_templates).replace(
        "{first_fact}", first_fact
    ).replace("{date_ref}", rng.choice(date_refs))
    parts.append(opening)
    
    # ===== DESENVOLVIMENTO (6-8 seções de 300-500 palavras cada) =====
    used_sentences = set()
    
    for section_idx in range(rng.randint(6, 8)):
        # Pick material sentences for this section
        available = [s for i, s in enumerate(sentences) if i not in used_sentences]
        if not available:
            available = sentences  # reuse if exhausted
        
        section_sentences = []
        for _ in range(rng.randint(2, 4)):
            if available:
                idx = rng.randint(0, len(available) - 1)
                section_sentences.append(available[idx])
                if idx < len(sentences):
                    used_sentences.add(sentences.index(available[idx]) if available[idx] in sentences else 0)
        
        # Build section with different narrative techniques
        technique = rng.choice(["memory", "dialogue", "reflection", "scene", "analysis"])
        
        if technique == "memory":
            section = _build_memory_section(rng, section_sentences, topic, facts, section_idx)
        elif technique == "dialogue":
            section = _build_dialogue_section(rng, section_sentences, topic)
        elif technique == "reflection":
            section = _build_reflection_section(rng, section_sentences, topic)
        elif technique == "scene":
            section = _build_scene_section(rng, section_sentences, topic)
        else:
            section = _build_analysis_section(rng, section_sentences, topic, facts)
        
        if section_idx > 0:
            parts.append(generate_transition(rng, "", ""))
        parts.append(section)
    
    # ===== FECHAMENTO (200-300 palavras) =====
    closing_templates = [
        f"Olhando para trás, consigo ver com clareza o que na época era impossível perceber. "
        f"Cada decisão, cada encontro, cada momento de dúvida fazia parte de algo maior — "
        f"um padrão que só se revela quando temos distância suficiente para ver o desenho inteiro.\n\n"
        f"O que aprendi com tudo isso não cabe em uma frase bonita ou em uma lição de moral "
        f"empacotada para consumo fácil. A vida real não funciona assim. O que aprendi é que "
        f"estamos sempre no meio da história, nunca no final. Que as certezas de hoje são as "
        f"perguntas de amanhã. E que a coragem não é a ausência do medo, mas a decisão de "
        f"seguir em frente apesar dele.\n\n"
        f"Os acontecimentos descritos neste capítulo foram apenas o começo. O que viria a seguir "
        f"testaria todos os limites do que eu achava ser possível.",

        f"Há uma tendência natural de buscar significado nos eventos — de conectar os pontos "
        f"e criar uma narrativa coerente que dê sentido a tudo. Às vezes essa narrativa é "
        f"precisa. Outras vezes, é apenas a história que precisamos contar a nós mesmos para "
        f"continuar.\n\n"
        f"O que posso dizer com certeza é que os eventos deste período — com todas as suas "
        f"imperfeições, contradições e momentos de pura humanidade — me transformaram de "
        f"maneiras que eu não conseguiria articular naquele momento. As transformações mais "
        f"profundas são assim: silenciosas, graduais, e só perceptíveis em retrospecto.\n\n"
        f"Mas a história não termina aqui. Longe disso.",
    ]
    parts.append(rng.choice(closing_templates))
    
    return parts


def _build_memory_section(rng, sentences, topic, facts, idx):
    """Build a memory/flashback section."""
    intros = [
        "A memória que me vem agora é de um momento específico — ",
        "Lembro com clareza do dia em que ",
        "Entre todas as lembranças daquele período, uma se destaca com particular nitidez: ",
        "Há momentos que ficam gravados na memória com uma precisão quase dolorosa. Este é um deles: ",
    ]
    
    parts = [rng.choice(intros)]
    
    for sent in sentences:
        parts.append(f"{sent}.")
        parts.append("")
        
        reflections = [
            f"Na época, eu não compreendia plenamente o significado disso. Era apenas mais um "
            f"acontecimento em uma sequência de acontecimentos que parecia não ter fim. Mas o "
            f"tempo tem uma forma peculiar de revelar o que estava escondido — de mostrar as "
            f"conexões que existiam mas que ainda não eram visíveis.",
            
            f"Essa lembrança carrega consigo uma carga emocional que não diminuiu com o passar "
            f"dos anos. Pelo contrário — quanto mais tempo passa, mais claramente percebo o "
            f"impacto que aquele momento teve em tudo o que veio depois.",
            
            f"O que me impressiona, olhando para trás, é como os pequenos detalhes se tornaram "
            f"os mais significativos. Não foram os grandes gestos ou as decisões dramáticas que "
            f"definiram esse período. Foram os momentos silenciosos, as conversas sussurradas, "
            f"os olhares que diziam mais do que as palavras conseguiam expressar.",
        ]
        parts.append(rng.choice(reflections))
    
    if facts and idx < len(facts):
        parts.append(f"\n{facts[idx]}. Este fato, aparentemente simples, "
                     f"carregava implicações que só se tornariam claras muito tempo depois.")
    
    return "\n".join(parts)


def _build_dialogue_section(rng, sentences, topic):
    """Build a section with dialogue."""
    chars = ["eu", "ela", "ele"]
    c1 = rng.choice(chars)
    c2 = rng.choice([c for c in chars if c != c1])
    
    parts = [
        f"A conversa que tivemos naquele dia ficou gravada na minha memória:\n",
    ]
    
    for i, sent in enumerate(sentences):
        if i % 2 == 0:
            parts.append(f'"Você sabia que {sent.lower() if not sent[0].isdigit() else sent}?" '
                        f'perguntei, sem conseguir esconder a emoção na voz.')
            parts.append("")
            parts.append(
                f'Houve uma pausa. O tipo de pausa que acontece quando alguém está '
                f'escolhendo cuidadosamente as palavras, pesando cada uma contra o silêncio '
                f'que a precede.'
            )
        else:
            parts.append(f'"Sim," {c2} respondeu depois de um momento. "E isso muda tudo, não é?"')
            parts.append("")
            parts.append(
                f'"Muda," concordei. "Muda mais do que eu consigo expressar agora." '
                f'As palavras saíram com um peso que surpreendeu a nós dois. '
                f'Algumas verdades são assim — mais pesadas quando ditas em voz alta do que '
                f'quando existiam apenas como pensamentos.'
            )
    
    parts.append("")
    parts.append(
        f"Aquela conversa marcou um ponto de virada. Não porque resolveu algo — conversas "
        f"raramente resolvem de verdade — mas porque tornou impossível continuar fingindo "
        f"que certas coisas não existiam. Uma vez que as palavras são ditas, elas criam "
        f"uma realidade que não pode ser desfeita. E com essa nova realidade veio a "
        f"necessidade de fazer escolhas que até então podiam ser adiadas."
    )
    
    return "\n".join(parts)


def _build_reflection_section(rng, sentences, topic):
    """Build a reflective/philosophical section."""
    parts = []
    
    openers = [
        f"Olhando para trás com a perspectiva que só o tempo proporciona, consigo identificar "
        f"padrões que na época eram completamente invisíveis. ",
        f"Há uma diferença fundamental entre viver um momento e compreendê-lo. "
        f"A compreensão quase sempre vem depois — às vezes anos depois — "
        f"quando finalmente temos distância suficiente para ver o quadro completo. ",
        f"O que aprendi ao longo desses anos é que as experiências mais transformadoras "
        f"raramente parecem transformadoras enquanto estão acontecendo. ",
    ]
    parts.append(rng.choice(openers))
    
    for sent in sentences:
        parts.append(f"\n{sent}.\n")
        
        reflections = [
            f"Este ponto merece uma reflexão mais profunda. Na superfície, parece ser algo "
            f"simples e direto. Mas quando examinamos com mais cuidado, descobrimos camadas "
            f"de significado que não são imediatamente aparentes. A simplicidade aparente "
            f"esconde uma complexidade que só se revela para quem tem a paciência de olhar "
            f"além do óbvio.\n\n"
            f"É como aquelas imagens tridimensionais que eram populares nos anos 90 — à "
            f"primeira vista, parecem apenas um padrão aleatório de cores. Mas quando você "
            f"relaxa o olhar e permite que a perspectiva mude, uma imagem completamente "
            f"diferente emerge. A vida funciona da mesma forma: os padrões estão lá, "
            f"esperando para serem percebidos.",
            
            f"Quando compartilho essa experiência com outras pessoas, frequentemente recebo "
            f"respostas que revelam quão universal ela é. Não nos detalhes específicos — "
            f"cada vida tem seus detalhes únicos — mas na estrutura subjacente. Todos nós "
            f"passamos por momentos de transição, de descoberta, de perda e de reconstrução. "
            f"O que nos diferencia não é a experiência em si, mas o que fazemos com ela.\n\n"
            f"E é precisamente isso que torna este relato relevante além do pessoal: "
            f"não porque os fatos são extraordinários, mas porque as emoções, os dilemas "
            f"e as transformações que eles provocaram são profundamente humanos.",
        ]
        parts.append(rng.choice(reflections))
    
    return "\n".join(parts)


def _build_scene_section(rng, sentences, topic):
    """Build a vivid scene description."""
    settings = [
        "A sala estava silenciosa, exceto pelo tique-taque do relógio na parede — "
        "um som tão constante que normalmente passava despercebido, mas que naquele momento "
        "parecia amplificado, cada segundo marcado com uma precisão quase cruel.",
        
        "A luz da tarde entrava pela janela em ângulo, criando padrões geométricos no chão "
        "de madeira. Era uma daquelas tardes em que o tempo parece desacelerar, como se o "
        "próprio universo estivesse fazendo uma pausa para observar o que acontecia ali.",
        
        "O cheiro de café recém-feito se misturava com algo mais antigo — o cheiro de "
        "livros, de madeira velha, de memórias acumuladas ao longo de anos. Era um cheiro "
        "reconfortante e ao mesmo tempo melancólico, como tudo que nos lembra da passagem do tempo.",
    ]
    
    parts = [rng.choice(settings), ""]
    
    for sent in sentences:
        scene_intros = [
            f"Foi nesse cenário que ",
            f"Enquanto observava a cena ao redor, ",
            f"O momento seguinte trouxe consigo ",
        ]
        parts.append(f"{rng.choice(scene_intros)}{sent.lower() if not sent[0].isdigit() else sent}.")
        parts.append("")
        
        sensory = [
            "Posso sentir até hoje o peso daquele momento — não apenas emocionalmente, "
            "mas fisicamente. A pressão no peito, a garganta apertada, as mãos que não "
            "sabiam onde se colocar. O corpo guarda memórias que a mente às vezes tenta esquecer.",
            
            "Os sons ao redor pareciam distantes, como se viessem de outro mundo. "
            "Toda a minha atenção estava concentrada naquele instante, naquela realidade "
            "que se formava diante dos meus olhos com a inevitabilidade de uma maré subindo.",
        ]
        parts.append(rng.choice(sensory))
        parts.append("")
    
    return "\n".join(parts)


def _build_analysis_section(rng, sentences, topic, facts):
    """Build an analytical section examining material events."""
    parts = [
        f"Analisando os eventos com o distanciamento que o tempo permite, "
        f"alguns aspectos se tornam claros:\n"
    ]
    
    for i, sent in enumerate(sentences):
        parts.append(f"**{i+1}.** {sent}.")
        parts.append("")
        
        analyses = [
            f"A importância deste ponto não pode ser subestimada. Ele representa um "
            f"momento de inflexão — um daqueles instantes em que o fluxo dos acontecimentos "
            f"muda de direção de forma irreversível. Antes deste momento, certas possibilidades "
            f"ainda existiam. Depois, o campo dos possíveis se reconfigurou completamente, "
            f"fechando alguns caminhos e abrindo outros que antes eram inimagináveis.\n\n"
            f"O que é particularmente interessante é como este evento se conecta com tudo "
            f"o que veio antes. Não foi um raio em céu azul — foi a culminação de uma série "
            f"de pequenos movimentos, cada um aparentemente insignificante por si só, mas que "
            f"juntos criaram as condições para que este momento acontecesse exatamente como aconteceu.",
            
            f"Para quem olha de fora, pode parecer algo trivial. Mas para quem estava ali, "
            f"vivendo cada segundo, cada detalhe carregava um peso enorme. É uma das ironias "
            f"da experiência humana: os momentos mais significativos da nossa vida raramente "
            f"parecem significativos para os outros. E os momentos que o mundo considera "
            f"importantes — formaturas, promoções, marcos visíveis — frequentemente são "
            f"menos transformadores do que os momentos silenciosos que ninguém mais testemunha.",
        ]
        parts.append(rng.choice(analyses))
    
    if facts:
        parts.append("\nConectando com outros elementos da narrativa:")
        for fact in facts[:3]:
            parts.append(f"- {fact}")
    
    return "\n".join(parts)


def _gen_filler_section(rng, topic, title, is_fiction):
    """Generate additional content to reach word count target."""
    if is_fiction:
        fillers = [
            f"Os dias que se seguiram trouxeram consigo uma rotina nova — não a rotina "
            f"confortável do hábito, mas a rotina inquieta de quem está se adaptando a uma "
            f"realidade que ainda não entende completamente. Cada manhã trazia perguntas que "
            f"a noite anterior não havia conseguido responder. E cada noite trazia uma exaustão "
            f"que não era apenas física — era a exaustão de quem está processando mais do que "
            f"a mente pode processar conscientemente.\n\n"
            f"Havia momentos de clareza, é claro. Momentos em que tudo parecia fazer sentido, "
            f"em que o caos se organizava em padrões reconhecíveis e o caminho adiante parecia "
            f"não apenas visível mas inevitável. Esses momentos eram preciosos precisamente "
            f"porque eram raros. Entre eles, havia o trabalho diário de simplesmente continuar — "
            f"de colocar um pé na frente do outro, de tomar as pequenas decisões que compõem "
            f"a maior parte da vida, de acreditar que o esforço valia a pena mesmo quando "
            f"as evidências pareciam sugerir o contrário.\n\n"
            f"É fácil, em retrospecto, transformar esse período em uma narrativa de superação. "
            f"Mas a verdade é mais complexa. Não houve um momento único de virada, nenhuma "
            f"epifania dramática que mudou tudo. Houve, sim, um acúmulo gradual de pequenas "
            f"mudanças — cada uma aparentemente insignificante, mas que juntas redirecionaram "
            f"o curso inteiro dos acontecimentos.",
            
            f"O tempo tem uma qualidade curiosa: quando estamos no meio de algo difícil, "
            f"ele parece se arrastar. Cada hora dura uma eternidade, cada dia é um exercício "
            f"de resistência. Mas quando olhamos para trás, esses mesmos períodos parecem "
            f"ter passado em um piscar de olhos. É como se a memória comprimisse o sofrimento, "
            f"mantendo apenas os marcos — os momentos que definiram o antes e o depois.\n\n"
            f"Entre esses marcos, havia a vida cotidiana. As refeições preparadas sem entusiasmo "
            f"mas com a persistência de quem sabe que precisa se alimentar. As conversas que "
            f"começavam sobre o clima e terminavam em lugares inesperados. Os silêncios que "
            f"diziam mais do que qualquer palavra poderia dizer. Esses momentos, aparentemente "
            f"insignificantes, eram na verdade o tecido do qual a vida era feita.\n\n"
            f"E é por isso que insisto em registrá-los aqui, mesmo que pareçam ordinários. "
            f"Porque a extraordinariedade da vida humana não está nos grandes eventos — "
            f"está na forma como transformamos o ordinário em significado.",
        ]
    else:
        fillers = [
            f"Para aprofundar essa compreensão, é importante considerar as múltiplas dimensões "
            f"envolvidas. {topic} não existe em isolamento — é parte de um ecossistema complexo "
            f"de fatores que se influenciam mutuamente. Ignorar essa complexidade leva a "
            f"simplificações que, embora confortáveis, são fundamentalmente enganosas.\n\n"
            f"A pesquisa nesta área tem avançado significativamente nos últimos anos, trazendo "
            f"novas perspectivas que desafiam suposições antigas. O que antes era aceito como "
            f"verdade estabelecida agora é questionado, revisado e, em muitos casos, substituído "
            f"por entendimentos mais nuançados e empiricamente fundamentados.\n\n"
            f"O que isso significa na prática? Significa que qualquer abordagem a {topic} que "
            f"se baseie em fórmulas simples ou receitas prontas está fadada a produzir resultados "
            f"inconsistentes. O verdadeiro domínio requer a capacidade de navegar na "
            f"complexidade — de manter múltiplas perspectivas simultaneamente e de ajustar "
            f"a abordagem conforme o contexto exige.\n\n"
            f"Esta não é uma mensagem de desânimo. Pelo contrário: é um convite a abraçar "
            f"a complexidade como fonte de riqueza e oportunidade, não como obstáculo. "
            f"Aqueles que conseguem trabalhar com a complexidade — ao invés de contra ela — "
            f"descobrem possibilidades que permaneceriam invisíveis para quem insiste em "
            f"simplificar tudo.",
        ]
    
    return rng.choice(fillers)


# ===== LONG-FORM NON-FICTION FROM MATERIALS =====

def gen_long_nonfiction_from_materials(rng, title, num, topic, project_title,
                                        sentences, facts, target_words=3500):
    """Generate long non-fiction chapter from source materials."""
    parts = []
    
    # Introduction (400-500 words)
    parts.append(f"## {title}\n")
    
    intros = [
        f"A análise aprofundada dos materiais de referência revela aspectos de {topic} "
        f"que merecem uma exploração cuidadosa e detalhada. Neste capítulo, examinamos "
        f"os temas centrais, as conexões entre os diferentes elementos, e as implicações "
        f"práticas que emergem dessa investigação.\n\n"
        f"É importante abordar este material com a devida atenção à complexidade. "
        f"Os dados e relatos disponíveis pintam um quadro rico e multifacetado que resiste "
        f"a simplificações apressadas. Cada ponto de dados, cada relato, cada observação "
        f"contribui para uma compreensão mais completa — mas apenas se consideramos o "
        f"contexto em que se insere e as conexões que mantém com os demais elementos.",
        
        f"O que torna {title.lower()} particularmente relevante é a forma como os temas "
        f"identificados nos materiais de referência se entrelaçam, criando um panorama "
        f"que vai muito além da soma de suas partes individuais. Neste capítulo, nosso "
        f"objetivo é desvelar essas conexões e extrair os insights mais valiosos.\n\n"
        f"A metodologia aqui empregada é deliberadamente abrangente: analisamos os materiais "
        f"não apenas pelo seu conteúdo explícito, mas também pelas entrelinhas — pelos "
        f"padrões que se repetem, pelas ausências que são tão reveladoras quanto as presenças, "
        f"e pelas tensões que existem entre diferentes perspectivas sobre o mesmo tema.",
    ]
    parts.append(rng.choice(intros))
    
    # Main sections based on materials (5-7 sections, 400-600 words each)
    used = set()
    section_count = min(7, max(5, len(sentences) // 3))
    
    for sec_idx in range(section_count):
        available = [s for i, s in enumerate(sentences) if i not in used]
        if not available:
            available = sentences
        
        # Pick 2-4 sentences for this section
        section_sents = []
        for _ in range(min(4, len(available))):
            if available:
                s = rng.choice(available)
                section_sents.append(s)
                if s in sentences:
                    used.add(sentences.index(s))
                available = [x for x in available if x != s]
        
        section_titles = [
            f"### Análise {sec_idx + 1}: {section_sents[0][:50]}..." if section_sents else f"### Seção {sec_idx + 1}",
            f"### Perspectiva {sec_idx + 1}",
            f"### Dimensão {sec_idx + 1}: Aprofundamento",
            f"### Evidência {sec_idx + 1}: Dados e Observações",
        ]
        parts.append(rng.choice(section_titles))
        
        for sent in section_sents:
            parts.append(f"\nDe acordo com os materiais analisados: **{sent}.**\n")
            
            expansions = [
                f"Esta informação é significativa por múltiplas razões. Em primeiro lugar, "
                f"estabelece um marco temporal e contextual que nos permite situar os "
                f"acontecimentos dentro de uma narrativa mais ampla. Em segundo lugar, "
                f"revela dinâmicas subjacentes que influenciaram — e continuam influenciando — "
                f"o desenvolvimento de {topic}.\n\n"
                f"Quando cruzamos esta informação com outros dados disponíveis, um padrão "
                f"emerge: não se trata de um evento isolado, mas de parte de uma sequência "
                f"que se repete com variações ao longo do tempo. Reconhecer este padrão é "
                f"essencial para qualquer tentativa séria de compreensão.",
                
                f"A relevância deste ponto vai além do óbvio. Embora na superfície pareça "
                f"ser uma observação simples, ela aponta para questões estruturais mais "
                f"profundas que afetam todo o campo de {topic}. A tendência natural é "
                f"tratar informações como esta de forma isolada, mas isso seria um erro. "
                f"O verdadeiro valor está nas conexões — nas formas como este dado se "
                f"relaciona com outros dados e como, juntos, constroem uma narrativa "
                f"mais completa e mais verdadeira do que qualquer um deles sozinho.",
                
                f"Para contextualizar adequadamente, é preciso considerar o momento "
                f"histórico e as circunstâncias específicas em que isso se deu. As decisões "
                f"e eventos não acontecem no vácuo — são moldados por pressões, expectativas "
                f"e limitações que nem sempre são visíveis para o observador externo. "
                f"Uma análise que ignore esses fatores contextuais será necessariamente "
                f"incompleta, senão enganosa.",
            ]
            parts.append(rng.choice(expansions))
        
        if sec_idx < len(facts):
            parts.append(f"\n**Fato-chave relacionado:** {facts[sec_idx]}\n")
    
    # Conclusion (300-400 words)
    parts.append(f"\n### Síntese e Conclusões\n")
    parts.append(
        f"A análise apresentada neste capítulo revela que {topic} é um campo "
        f"consideravelmente mais complexo e nuançado do que as descrições superficiais "
        f"sugerem. Os materiais de referência fornecem evidências convincentes de que "
        f"qualquer abordagem simplista está fadada a ser, na melhor das hipóteses, "
        f"incompleta, e na pior, enganosa.\n\n"
        f"Os principais achados podem ser resumidos em três pontos centrais:\n\n"
    )
    
    for i, fact in enumerate(facts[:3]):
        parts.append(f"**{i+1}.** {fact}")
    
    parts.append(
        f"\n\nEstes achados não apenas aprofundam nossa compreensão de {topic}, "
        f"mas também apontam direções claras para a continuidade da análise. "
        f"No próximo capítulo, expandiremos essa investigação para abranger "
        f"aspectos complementares que emergiram dos materiais mas que ainda "
        f"não foram adequadamente explorados."
    )
    
    return parts
