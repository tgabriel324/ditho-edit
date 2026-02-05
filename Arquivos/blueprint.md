1. O Motor de Injeção e Isolamento (The Canvas Engine)
Sandboxing de Iframe: O site editado vive dentro de um iframe isolado. Isso garante que o CSS do seu editor não "vaze" para o site do cliente e vice-versa.
Visual DOM Proxy: O editor monitora as mudanças no DOM em tempo real. Cada clique é capturado e transformado em um objeto de estado para o painel lateral.
Auto-ID Generation: Se um elemento do site não tem um ID, o motor gera um ID único (nx-xxxx) instantaneamente para que possamos rastreá-lo e editá-lo sem erro.
2. Sistema de Design Dinâmico (Dynamic Design System)
Color Tokenizer: Ao carregar um site, o sistema faz um "scan" de todas as cores hexadecimais. Ele identifica as 8 cores mais usadas e as converte em variáveis CSS globais (--nx-c-0 até --nx-c-7).
Hot-Swapping de Cores: Quando o usuário muda uma cor na aba "Project", o editor injeta um novo bloco :root no iframe, mudando a cor do site inteiro instantaneamente, sem precisar reescrever o HTML.
Font-Family Extractor: O Gemini identifica as fontes usadas e as mapeia para que você saiba exatamente o que está editando.
3. Capacidades de Edição Visual (WYSIWYG)
Double-Click Inline Editing: O usuário pode clicar duas vezes em qualquer texto (H1-H6, P, Span, Buttons) e digitar diretamente no site. O feedback visual muda para verde (Modo Edição) e salva ao perder o foco.
Gestão de Imagens Profissional: O sistema detecta tags <img>. Ele permite:
Trocar por URL.
Upload de arquivo local (convertido em Base64 para visualização imediata).
Controle de Object-Fit (Cover/Contain/Fill) para a imagem não esticar.
Smart Branding (Logo Swap): Se o sistema detectar um texto que parece um logo (em headers ou com classes de marca), ele ativa o botão "Replace with Image". Ele faz um "transplante" cirúrgico do nó do DOM: remove o texto e coloca a imagem mantendo o posicionamento original.
4. Gestão de Layout e Estilo
Painel de Propriedades Reativo: Controle visual de Display, Direction (Row/Column), Padding, Margin e Gap.
Estética Visual: Controle de Border-Radius (arredondamento), cores de fundo e cores de texto com seletores hexadecimais.
Ações de Nó: Botões rápidos para Duplicar (clonagem profunda com novos IDs) e Deletar qualquer elemento selecionado.
5. O Cérebro: Gemini Architect
Refatoração Cirúrgica: Você pode selecionar um elemento (um botão, um card, um header) e dar comandos como "Deixe este card com efeito de vidro fosco". A IA recebe o HTML bruto, processa a instrução e devolve o HTML refatorado.
Design Analysis: No momento da criação, a IA analisa o HTML para sugerir a paleta de cores e identificar as seções semânticas do site.
6. Workspace e UX (User Experience)
Simulador de Responsividade: Alternância instantânea entre Desktop (1440px), Tablet (768px) e Mobile (375px) com animações de transição.
Sistema de Zoom: Escala o canvas de 50% a 150% para trabalhar em detalhes ou ver o layout completo em telas menores.
Dashboard de Projetos: Área para gerenciar múltiplos sites, com pré-visualização e status de atualização.
Configurações de Domínio: Interface completa para definir subdomínios gratuitos .nexus.ai e instruções de DNS (CNAME) para domínios profissionais.