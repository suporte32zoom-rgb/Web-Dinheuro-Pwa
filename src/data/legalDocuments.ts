import { LegalDocument, LegalDocId } from "../types/legal";

export const LEGAL_DOCUMENTS: Record<LegalDocId, LegalDocument> = {
  "termos-de-uso": {
    id: "termos-de-uso",
    title: "Termos de Uso e Serviço",
    subtitle: "Condições gerais de acesso, navegação e utilização do ecossistema digital DinhEuro",
    path: "/termos-de-uso",
    lastUpdated: "Outubro de 2026 (Versão 2.4)",
    badge: "Contrato Vinculante",
    sections: [
      {
        id: "aceitacao",
        title: "1. Aceitação dos Termos e Capacidade Civil",
        content: [
          "Ao acessar, navegar, instalar via Progressive Web App (PWA) ou utilizar quaisquer ferramentas, calculadoras, cotações em tempo real e conteúdos disponibilizados no portal DinhEuro (dinheuro.com e dinheuro.com.br), o Usuário declara ter capacidade jurídica plena e concordar de forma irrevogável e integral com estes Termos de Uso e com a nossa Política de Privacidade.",
          "Caso o Usuário não concorde com qualquer disposição aqui estabelecida, deverá descontinuar imediatamente o acesso e a utilização dos serviços oferecidos pela plataforma.",
        ],
      },
      {
        id: "natureza",
        title: "2. Objeto e Natureza da Plataforma",
        content: [
          "O DinhEuro é uma plataforma digital privada de agregação de informações, cotações financeiras em tempo real, inteligência de mercado, conversão de moedas e correspondência tecnológica.",
          "A plataforma atua exclusivamente como fornecedora e agregadora de informações públicas e de mercado, disponibilizando dashboards de dados econômicos, índices globais (Ibovespa, S&P 500, Nasdaq, DAX, Nikkei), cotações de câmbio (EUR/BRL, USD/BRL, GBP/BRL), criptoativos e commodities.",
          "O DinhEuro NÃO é uma instituição financeira, corretora de títulos e valores mobiliários, casa de análise independente ou gestora de recursos nos termos da Lei nº 6.385/1976 e da Resolução CVM nº 19/2021.",
        ],
      },
      {
        id: "disclaimer-financeiro",
        title: "3. Isenção de Responsabilidade Financeira e Ausência de Consultoria (Disclaimer)",
        content: [
          "Nenhuma informação, dado estatístico, cotação, índice, simulação de câmbio, resumo analítico ou resposta gerada pela plataforma ou por seus módulos automatizados constitui recomendação direta de investimento, assessoria financeira, oferta pública de valores mobiliários ou convite para captação de recursos.",
          "As operações nos mercados financeiros, cambiais, acionários e de criptoativos envolvem riscos significativos de perda patrimonial. A rentabilidade passada não representa qualquer garantia de rentabilidade futura.",
          "O Usuário é o único e exclusivo responsável por suas decisões de alocação de capital e investimentos, cabendo-lhe consultar profissionais credenciados (como assessores de investimentos e consultores CVM/ANBIMA) antes de realizar qualquer operação financeira.",
        ],
      },
      {
        id: "propriedade-intelectual",
        title: "4. Propriedade Intelectual e Licença de Uso",
        content: [
          "A marca DinhEuro, logotipos, códigos-fonte, arquitetura de software, layouts de interface, banco de dados e marcas nominativas e figurativas são de titularidade exclusiva do DinhEuro e de seus fundadores, protegidos pelas Leis Federais nº 9.279/1996 (Propriedade Industrial) e nº 9.610/1998 (Direitos Autorais).",
          "É terminantemente proibida a cópia, reprodução, engenharia reversa, redistribuição não autorizada, raspagem de dados (web scraping) com fins concorrenciais ou uso comercial não autorizado de qualquer conteúdo do ecossistema DinhEuro sem anuência prévia e expressa por escrito.",
        ],
      },
      {
        id: "conduta-e-regras",
        title: "5. Conduta do Usuário e Restrições de Uso",
        content: [
          "O Usuário compromete-se a utilizar a plataforma em estrita conformidade com a legislação brasileira vigente, a moral e a boa-fé.",
          "Fica expressamente vedado ao Usuário: (i) introduzir vírus, worms, trojans ou scripts maliciosos; (ii) tentar contornar mecanismos de autenticação e segurança; (iii) sobrecarregar a infraestrutura de APIs com chamadas abusivas automatizadas fora dos limites estabelecidos; (iv) utilizar a plataforma para quaisquer finalidades ilícitas ou de lavagem de capitais.",
        ],
      },
      {
        id: "disponibilidade",
        title: "6. Disponibilidade de Serviços e Limitação de Responsabilidade",
        content: [
          "O DinhEuro emprega os melhores esforços técnicos para assegurar disponibilidade ininterrupta e dados de alta precisão. No entanto, por depender de redes de telecomunicações, provedores de nuvem e APIs externas de bolsas mundiais e bancos centrais, o portal não garante operação isenta de interrupções, latências, falhas ou atrasos normativos de cotação.",
          "Em nenhuma hipótese o DinhEuro, seus desenvolvedores ou parceiros serão responsabilizados por lucros cessantes, perdas financeiras, danos diretos ou indiretos decorrentes do uso ou da impossibilidade de uso da plataforma.",
        ],
      },
      {
        id: "foro",
        title: "7. Vigência, Alterações e Foro de Eleição",
        content: [
          "Estes Termos de Uso vigoram por prazo indeterminado e podem ser atualizados periodicamente para refletir avanços regulatórios ou melhorias de produto. A continuidade do uso após modificações caracteriza a aceitação plena dos novos termos.",
          "Fica eleito o Foro da Comarca da Capital do Estado de São Paulo como único competente para dirimir quaisquer controvérsias oriundas deste instrumento, com renúncia expressa a qualquer outro, por mais privilegiado que seja.",
        ],
      },
    ],
  },

  "politica-de-privacidade": {
    id: "politica-de-privacidade",
    title: "Política de Privacidade e Proteção de Dados",
    subtitle: "Transparência total e estrita conformidade com a LGPD (Lei nº 13.709/2018) e GDPR",
    path: "/politica-de-privacidade",
    lastUpdated: "Outubro de 2026 (Versão 2.4)",
    badge: "Em Conformidade com a LGPD",
    sections: [
      {
        id: "compromisso",
        title: "1. Nosso Compromisso com a sua Privacidade",
        content: [
          "O DinhEuro (dinheuro.com / dinheuro.com.br) tem como princípio inviolável a proteção, a privacidade e a segurança dos dados de seus usuários e visitantes. Tratamos seus dados com base na boa-fé e nos princípios da finalidade, adequação, necessidade, livre acesso, qualidade e transparência previstos no Artigo 6º da Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018).",
          "Nossa infraestrutura opera com criptografia de ponta a ponta (HTTPS/TLS 1.3), garantindo que suas preferências locais e navegação permaneçam protegidas contra acessos não autorizados.",
        ],
      },
      {
        id: "dados-coletados",
        title: "2. Dados que Coletamos e Armazenamento Local (Privacy by Design)",
        content: [
          "Privacidade em Primeiro Lugar: O DinhEuro adota a arquitetura 'Privacy by Design'. Você pode utilizar a plataforma de forma totalmente anônima, sem necessidade de criação prévia de conta para consultar cotações e mercados.",
          "Armazenamento Local no Navegador (Local-Only): Dados de carteira virtual simulada, listas de monitoramento (Watchlist), preferências de temas e limites de alertas de preços são armazenados EXCLUSIVAMENTE na memória do seu próprio navegador (localStorage / IndexedDB). O DinhEuro NÃO envia suas alocações financeiras simuladas para servidores externos nem compartilha seus saldos com terceiros.",
          "Dados Técnicos de Conexão: Coletamos registros de acesso estritamente necessários (endereço IP, data e hora da solicitação, tipo de navegador e sistema operacional) em cumprimento ao Artigo 15 do Marco Civil da Internet (Lei nº 12.965/2014).",
          "Dados de Notificação Push: Caso você autorize o recebimento de alertas de mercado via PWA, armazenamos o token de inscrição seguro do Web Push disponibilizado pelo seu navegador para o envio das cotações programadas.",
        ],
      },
      {
        id: "finalidade",
        title: "3. Finalidade e Bases Legais do Tratamento (Art. 7º da LGPD)",
        content: [
          "Tratamos os dados estritamente para as seguintes finalidades legítimas:",
          "a) Execução de Serviços e Contrato (Art. 7º, V): Permitir a navegação no PWA, renderização dos gráficos financeiros e conversão de moedas;",
          "b) Legítimo Interesse (Art. 7º, IX): Garantir a segurança da informação, prevenir ataques cibernéticos e aferir o desempenho e latência das APIs financeiras;",
          "c) Consentimento Explícito (Art. 7º, I): Envio de alertas de preços de ativos cadastrados pelo usuário via Web Push e cookies não essenciais de análise de tráfego;",
          "d) Cumprimento de Obrigação Legal (Art. 7º, II): Manutenção de logs de acesso conforme estipulado pelo Marco Civil da Internet.",
        ],
      },
      {
        id: "compartilhamento",
        title: "4. Ausência de Venda de Dados e Compartilhamento Restrito",
        content: [
          "O DinhEuro NUNCA vendeu, não vende e nunca venderá dados pessoais ou informações financeiras de seus usuários a corretores de dados (data brokers), agências de marketing ou terceiros.",
          "O compartilhamento de dados técnicos ocorre de forma estritamente controlada apenas com provedores de infraestrutura de alta confiabilidade (servidores em nuvem com conformidade ISO 27001 e SOC 2) e provedores de APIs de dados financeiros sob termos rígidos de confidencialidade.",
        ],
      },
      {
        id: "direitos-titular",
        title: "5. Direitos do Titular de Dados Pessoais (Art. 18 da LGPD)",
        content: [
          "Conforme estabelecido pela LGPD, você possui os seguintes direitos invioláveis quanto aos seus dados pessoais:",
          "• Confirmação da existência de tratamento e acesso facilitado aos dados;",
          "• Correção de dados incompletos, inexatos ou desatualizados;",
          "• Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;",
          "• Portabilidade dos dados a outro fornecedor de serviço, mediante requisição expressa;",
          "• Eliminação dos dados pessoais tratados com o seu consentimento;",
          "• Revogação do consentimento a qualquer momento de forma simples e gratuita.",
          "Como suas informações de carteira e monitoramento residem no seu dispositivo, você pode apagá-las instantaneamente limpando os dados de navegação do DinhEuro em seu navegador.",
        ],
      },
      {
        id: "seguranca",
        title: "6. Medidas de Segurança da Informação",
        content: [
          "Empregamos padrões internacionais de segurança cibernética, incluindo protocolo HTTPS com TLS de última geração, cabeçalhos de segurança HTTP (HSTS, CSP, X-Frame-Options, X-Content-Type-Options) e segregação técnica de ambientes.",
          "Nenhuma informação bancária sensível, como senhas de bancos, tokens de cartões ou contas de custódia, é solicitada ou processada em nosso sistema.",
        ],
      },
      {
        id: "dpo",
        title: "7. Encarregado de Proteção de Dados (DPO) e Canal de Atendimento",
        content: [
          "Em cumprimento ao Artigo 41 da Lei nº 13.709/2018 (LGPD), indicamos nosso Encarregado de Proteção de Dados (Data Protection Officer - DPO) para atuar como canal de comunicação oficial entre o DinhEuro, os titulares dos dados e a Autoridade Nacional de Proteção de Dados (ANPD).",
          "Para exercer qualquer um dos seus direitos, solicitar esclarecimentos ou relatar questões relativas a privacidade, entre em contato diretamente com o DPO:",
          "E-mail do DPO: admin@dinheuro.com.br",
          "Tempo estimado de resposta às solicitações: até 5 (cinco) dias úteis.",
        ],
      },
    ],
  },

  "politica-de-cookies": {
    id: "politica-de-cookies",
    title: "Política de Cookies e Tecnologias de Rastreamento",
    subtitle: "Transparência técnica sobre o uso de cookies, cache offline e armazenamento local no PWA",
    path: "/politica-de-cookies",
    lastUpdated: "Outubro de 2026 (Versão 2.4)",
    badge: "Transparência de Cookies",
    sections: [
      {
        id: "o-que-sao",
        title: "1. O que são Cookies e Tecnologias Semelhantes?",
        content: [
          "Cookies são pequenos arquivos de texto armazenados no seu navegador de internet ou dispositivo móvel quando você visita websites ou utiliza aplicações web progressivas (PWAs).",
          "Além de cookies convencionais, o DinhEuro utiliza tecnologias modernas de armazenamento na web como LocalStorage, SessionStorage e Service Workers (Cache Storage), cujo propósito é assegurar tempo de resposta ultrarrápido, permitir a navegação offline em casos de oscilação de rede e memorizar suas preferências locais de navegação.",
        ],
      },
      {
        id: "categorias-cookies",
        title: "2. Categorias de Cookies Utilizadas no DinhEuro",
        content: [
          "Classificamos as tecnologias de armazenamento em três categorias claras:",
          "a) Cookies e Armazenamentos Estritamente Necessários (Essenciais): Fundamentais para o funcionamento da plataforma. Permitem a inicialização do PWA, a conexão com o servidor de dados, navegação responsiva em abas e a preservação do seu consentimento LGPD. Não podem ser desativados sem comprometer a estabilidade do portal.",
          "b) Cookies e Armazenamentos de Preferências (Funcionais): Memorizam as suas escolhas para proporcionar uma experiência personalizada, incluindo o último ativo visualizado, tickers adicionados à sua Watchlist, posição das moedas simuladas e configurações de notificações sonoras.",
          "c) Cookies Analíticos e de Desempenho: Coletam dados de métricas agregadas e totalmente anônimas sobre a velocidade de carregamento dos gráficos, latência da API de cotações e eventuais falhas de conexão de rede, visando ao aprimoramento contínuo da estabilidade.",
        ],
      },
      {
        id: "tabela-tecnologias",
        title: "3. Tabela Detalhada de Armazenamento Local no DinhEuro",
        content: [
          "• dinheuro_lgpd_accepted: Armazena o registro de consentimento dos termos e cookies da LGPD no seu navegador. Validade: 12 meses.",
          "• dinheuro_lgpd_timestamp: Data e hora precisa em que o consentimento foi fornecido pelo titular. Validade: 12 meses.",
          "• dinheuro_watchlist_v1: Lista dos códigos de ações e moedas favoritadas pelo investidor para acompanhamento rápido. Armazenado localmente.",
          "• dinheuro_portfolio_positions: Registro de posições simuladas de compra e venda cadastradas pelo usuário. Não trafega para a nuvem.",
          "• dinheuro_notification_settings: Preferências de limites de preços e alertas push ativos.",
        ],
      },
      {
        id: "gerenciamento-cookies",
        title: "4. Como Gerenciar ou Desativar Cookies no seu Navegador",
        content: [
          "Você possui total autonomia para aceitar, configurar ou rejeitar cookies a qualquer momento:",
          "1. Diretamente nesta plataforma: Utilize o botão 'Redefinir Preferências de Cookies' localizado no rodapé do DinhEuro para abrir o painel de consentimento e revisar suas preferências;",
          "2. Pelo navegador: A maioria dos navegadores permite bloquear ou excluir cookies instalados por meio das configurações de privacidade:",
          "• Google Chrome: Configurações > Privacidade e segurança > Cookies de terceiros;",
          "• Mozilla Firefox: Configurações > Privacidade e Segurança > Cookies e dados de sites;",
          "• Apple Safari: Preferências > Privacidade > Bloquear todos os cookies;",
          "• Microsoft Edge: Configurações > Cookies e permissões de site.",
          "Atenção: A desativação completa de cookies essenciais ou do LocalStorage pode inviabilizar o salvamento de carteiras virtuais e o funcionamento offline do PWA.",
        ],
      },
    ],
  },

  "sobre": {
    id: "sobre",
    title: "Sobre o DinhEuro",
    subtitle: "A inteligência financeira definitiva para quem pensa e investe globalmente",
    path: "/sobre",
    lastUpdated: "Outubro de 2026",
    badge: "Hub Institucional",
    sections: [
      {
        id: "quem-somos",
        title: "1. Quem Somos e Nosso Propósito",
        content: [
          "O DinhEuro (dinheuro.com / dinheuro.com.br) nasceu da necessidade urgente de conectar investidores brasileiros, nômades digitais, estudantes e empresas ao mercado financeiro global com máxima transparência, velocidade em milissegundos e sem burocracia.",
          "Criamos um ecossistema de alto rendimento combinando cotações em tempo real de ações da B3 (Ibovespa), bolsas norte-americanas (NYSE/Nasdaq), bolsas europeias e asiáticas, taxas de câmbio unificadas (Euro, Dólar, Libra, Iene), criptoativos de alta liquidez e commodities essenciais.",
        ],
      },
      {
        id: "missao-visao-valores",
        title: "2. Missão, Visão e Valores",
        content: [
          "• Nossa Missão: Democratizar o acesso a ferramentas financeiras institucionais, fornecendo dados de mercado em tempo real, calculadoras cambiais precisas e análises macroeconômicas confiáveis.",
          "• Nossa Visão: Ser a referência primária na América Latina e na Europa para quem precisa converter, monitorar e tomar decisões financeiras com dados de alta fidelidade.",
          "• Nossos Valores: Rigor científico, transparência incondicional, compromisso com a privacidade do investidor (Privacy by Design), velocidade de execução e conformidade regulatória rigorosa.",
        ],
      },
      {
        id: "infraestrutura",
        title: "3. Infraestrutura Tecnológica de Classe Mundial",
        content: [
          "O DinhEuro é desenvolvido como uma aplicação web progressiva (PWA) de ponta, permitindo instalação nativa instantânea no iOS, Android, Windows e macOS sem depender de lojas de aplicativos pesadas.",
          "Nossos feeds de dados são alimentados por integrações de baixa latência com provedores globais de dados de mercado (incluindo AwesomeAPI, Finnhub, Financial Modeling Prep e bancos centrais oficiais), garantindo redundância, sincronismo milimétrico e integridade contínua.",
        ],
      },
      {
        id: "contato-corporativo",
        title: "4. Contato e Informações Corporativas",
        content: [
          "O portal DinhEuro opera com padrões rígidos de governança digital e suporte técnico especializado.",
          "• Portal Oficial: https://dinheuro.com.br e https://dinheuro.com",
          "• Contato Administrativo e Jurídico: admin@dinheuro.com.br",
          "• Encarregado de Proteção de Dados (DPO): admin@dinheuro.com.br",
          "• Horário de Atendimento Institucional: Segunda a sexta-feira, das 09h às 18h (Horário de Brasília).",
        ],
      },
    ],
  },

  "disclaimer": {
    id: "disclaimer",
    title: "Aviso Legal e Isenção de Responsabilidade Financeira",
    subtitle: "Caráter estritamente informativo, origem das cotações e declaração formal de riscos de mercado",
    path: "/disclaimer",
    lastUpdated: "Outubro de 2026",
    badge: "Advertência de Risco",
    sections: [
      {
        id: "carater-informativo",
        title: "1. Caráter Estritamente Educativo e Informativo",
        content: [
          "O portal DinhEuro é um veículo eletrônico de difusão de informações financeiras, cotações de mercado e ferramentas analíticas públicas. NENHUM CONTEÚDO veiculado no site deve ser interpretado como oferta, solicitação, consultoria, recomendação de investimento ou indicação de compra ou venda de quaisquer ativos financeiros, ações, cotas de fundos, derivativos ou moedas.",
          "O DinhEuro não presta serviços de assessoria financeira individualizada, não gere carteiras e não atua como instituição financeira ou corretora autorizada pelo Banco Central do Brasil (Bacen) ou pela Comissão de Valores Mobiliários (CVM).",
        ],
      },
      {
        id: "origem-dados-delays",
        title: "2. Origem das Cotações, Provedores e Delays Normativos",
        content: [
          "As cotações de ações, commodities, índices mundiais e moedas são obtidas a partir de fontes e APIs de mercado consideradas confiáveis (tais como AwesomeAPI, Finnhub, Financial Modeling Prep, Banco Central do Brasil e Banco Central Europeu).",
          "Aviso sobre Atrasos Normativos: As cotações de bolsas de valores (como B3 e bolsas internacionais) podem conter atrasos normativos exigidos pelos reguladores de até 15 minutos em relação à negociação em pregão viva-voz ou book de ofertas institucional. As cotações de câmbio comercial e de criptomoedas operam em regime 24/7 com atualizações contínuas.",
          "O DinhEuro não se responsabiliza por eventuais imprecisões numéricas, atrasos de provedores de dados, erros tipográficos ou omissões resultantes de instabilidade nas fontes originárias.",
        ],
      },
      {
        id: "advertencia-risco",
        title: "3. Advertência Geral sobre Riscos de Mercado",
        content: [
          "Investimentos em mercados de capitais, ações, títulos de renda fixa, fundos imobiliários, câmbio e criptoativos envolvem riscos significativos de perda de capital. A volatilidade dos mercados pode acarretar flutuações rápidas e imprevistas no patrimônio do investidor.",
          "A rentabilidade observada no passado NÃO constitui promessa ou garantia de rentabilidade no futuro. Toda decisão de investimento é de exclusiva responsabilidade do Usuário, que deve avaliar seu perfil de risco (suitability), objetivos financeiros e horizonte temporal antes de comprometer recursos.",
        ],
      },
      {
        id: "simuladores-cambio",
        title: "4. Simuladores Cambiais e Taxas Efetivas",
        content: [
          "Os valores gerados pelo conversor de moedas do DinhEuro utilizam taxas de câmbio de referência (câmbio comercial e cotações de atacado). As taxas finais praticadas por bancos, corretoras de câmbio, cartões de crédito e casas de câmbio no varejo podem variar substancialmente em virtude da incidência de spread cambial, tarifas bancárias e Imposto sobre Operações Financeiras (IOF).",
          "Sempre confirme a taxa efetiva total (VET - Valor Efetivo Total) diretamente com a instituição autorizada que executará a sua operação de câmbio.",
        ],
      },
    ],
  },
};
