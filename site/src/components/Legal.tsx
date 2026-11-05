// Privacy policy (LGPD) and terms of use, in Portuguese and English. The
// controller's name, tax id and contact come from build variables so they are
// set once at deploy time; until then the page says they are missing.
import type { ReactNode } from "react";
import { useT } from "../i18n";

export type LegalDoc = "privacy" | "terms";

const UPDATED = "2026-11-03";
const env = import.meta.env;
const OWNER = {
  name: (env.VITE_LEGAL_NAME as string | undefined) ?? "",
  id: (env.VITE_LEGAL_ID as string | undefined) ?? "",
  email: (env.VITE_LEGAL_EMAIL as string | undefined) ?? "",
};

type Section = { h: string; body: ReactNode[] };

function owner(pt: boolean) {
  const missing = pt ? "[a preencher antes do lançamento]" : "[to be filled in before launch]";
  return {
    who: OWNER.name ? `${OWNER.name}${OWNER.id ? ` (${OWNER.id})` : ""}` : missing,
    mail: OWNER.email ? <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a> : missing,
  };
}

function privacy(pt: boolean): Section[] {
  const o = owner(pt);
  return pt ? [
    { h: "Quem cuida dos seus dados", body: [<>O Visa Job Atlas é operado por {o.who}, controlador dos dados pessoais tratados no serviço. Contato para privacidade e para o encarregado de dados: {o.mail}.</>] },
    { h: "O que tratamos e por quê", body: [
      <><b>Seu CV.</b> O arquivo é lido dentro do seu navegador e nunca é enviado para nós. O texto fica guardado só nesta aba do navegador (sessionStorage) e some quando você a fecha.</>,
      <><b>Perfil e respostas.</b> As habilidades, o nível, os anos de experiência, os idiomas, a formação e as certificações extraídos do CV, mais suas respostas (cidadanias, país onde mora, países de interesse, prioridades), são enviados à nossa API para cruzar com as vagas. Não guardamos isso, a menos que você ative os alertas por e-mail. Base legal: execução do serviço que você pediu (LGPD, art. 7º, V).</>,
      <><b>Conta.</b> Se você entrar, guardamos seu e-mail e, no login com Google, o nome e a foto que o Google envia. Base legal: execução de contrato.</>,
      <><b>Pagamentos.</b> O pagamento é feito no Mercado Pago, que coleta os dados do cartão, do Pix ou do boleto; nós não recebemos esses dados. Guardamos o plano, o status, as datas, o valor e os identificadores do pagamento ou da assinatura. Base legal: execução de contrato e cumprimento de obrigação legal (registros fiscais).</>,
      <><b>Kits de candidatura.</b> Quando você pede um kit, o texto do seu CV e o texto da vaga são enviados à Anthropic (modelo Claude) para escrevê-lo. O kit fica salvo na sua conta; o texto do CV não é guardado por nós. Pelos termos comerciais da Anthropic, esses dados não são usados para treinar modelos e são retidos por ela por tempo limitado. Base legal: execução de contrato.</>,
      <><b>Códigos Pro.</b> Quando você usa um código (por exemplo, o que vem com um e-book), guardamos o código, a oferta a que pertence e a data em que sua conta o usou, para que cada código valha uma vez só. Se o código foi enviado a você por e-mail, guardamos também esse e-mail junto ao código. Base legal: execução de contrato.</>,
      <><b>Compras do e-book na Kiwify.</b> Quando você compra um e-book que dá direito a tempo de Pro, a Kiwify nos avisa do pedido. Guardamos só o número do pedido, o produto, o status e o e-mail da compra (nada de nome, CPF, telefone ou dados de pagamento), para ativar o Pro na conta que entrar com esse e-mail ou que informar o pedido, e para desfazer a ativação em caso de reembolso. Base legal: execução de contrato.</>,
      <><b>Painel de candidaturas e alertas.</b> Guardamos as vagas que você salva, com status e notas. Se você ativar os alertas, guardamos o perfil, as respostas e a ordem de países para enviar as vagas novas por e-mail. Base legal: seu consentimento, que você pode retirar a qualquer momento pelo link em cada e-mail ou desligando os alertas.</>,
      <><b>Dados técnicos.</b> Nossos provedores registram endereço IP e dados da requisição para segurança e prevenção de abuso. Base legal: legítimo interesse (art. 7º, IX). Não usamos cookies de publicidade nem ferramentas de rastreamento. O navegador guarda o idioma escolhido e a sessão de login (localStorage).</>,
    ] },
    { h: "Com quem compartilhamos", body: [
      "Só com os fornecedores que fazem o serviço funcionar, e só o necessário: Cloudflare (hospedagem e rede), Supabase (banco de dados e login), Mercado Pago (pagamentos), Kiwify (venda dos e-books), Anthropic (escrita dos kits) e Resend (envio dos alertas). Não vendemos nem alugamos dados pessoais.",
      "Alguns desses fornecedores tratam dados fora do Brasil, por exemplo nos Estados Unidos. Essa transferência internacional se apoia nas garantias contratuais que eles oferecem (LGPD, art. 33).",
    ] },
    { h: "Por quanto tempo", body: [
      "Dados da conta, kits, painel e alertas: até você apagá-los ou excluir a conta. Registros de pagamento: pelo prazo exigido pela legislação fiscal (em geral, cinco anos), mesmo após a exclusão da conta, sem vínculo com o seu perfil. Registros técnicos dos provedores: pelo prazo de cada um.",
    ] },
    { h: "Seus direitos", body: [
      "Você pode confirmar se tratamos seus dados, acessá-los, corrigi-los, pedir a portabilidade, a anonimização ou a exclusão, saber com quem os compartilhamos e retirar o consentimento (LGPD, art. 18).",
      <>No menu da conta, &quot;Baixar meus dados&quot; entrega uma cópia de tudo o que guardamos, e &quot;Excluir conta&quot; apaga a conta e os dados ligados a ela (uma assinatura mensal ativa é cancelada antes). Para qualquer outro pedido, escreva para {o.mail}. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</>,
    ] },
    { h: "Menores de idade", body: ["O serviço é para maiores de 18 anos."] },
    { h: "Mudanças nesta política", body: [`Avisaremos no site, e por e-mail aos assinantes, antes de mudanças relevantes. Última atualização: ${UPDATED}.`] },
  ] : [
    { h: "Who looks after your data", body: [<>Visa Job Atlas is operated by {o.who}, the controller of the personal data processed by the service. Contact for privacy and for the data protection officer: {o.mail}.</>] },
    { h: "What we process and why", body: [
      <><b>Your CV.</b> The file is read inside your browser and never sent to us. Its text stays only in this browser tab (sessionStorage) and is gone when you close it.</>,
      <><b>Profile and answers.</b> The skills, level, years of experience, languages, degree and certifications read from your CV, plus your answers (citizenships, country of residence, target countries, priorities), are sent to our API to match you with jobs. We don't keep them unless you turn on email alerts. Legal basis: performing the service you asked for (LGPD art. 7, V).</>,
      <><b>Account.</b> If you sign in we keep your email and, with Google sign-in, the name and picture Google sends. Legal basis: performing a contract.</>,
      <><b>Payments.</b> You pay on Mercado Pago, which collects the card, Pix or boleto details; we never receive them. We keep the plan, status, dates, amount and the payment or subscription ids. Legal basis: performing a contract and legal obligations (tax records).</>,
      <><b>Application kits.</b> When you ask for a kit, your CV text and the posting are sent to Anthropic (the Claude model) to write it. The kit is saved to your account; we don't store the CV text. Under Anthropic's commercial terms this data isn't used to train models, and Anthropic keeps it for a limited time. Legal basis: performing a contract.</>,
      <><b>Pro codes.</b> When you use a code (for example the one that comes with an ebook), we keep the code, the offer it belongs to and when your account used it, so each code works only once. If the code was emailed to you, we also keep that email with the code. Legal basis: performing a contract.</>,
      <><b>Ebook purchases on Kiwify.</b> When you buy an ebook that comes with Pro time, Kiwify notifies us of the order. We keep only the order number, product, status and purchase email (no name, CPF, phone or payment details), to turn Pro on for the account that signs in with that email or enters the order, and to undo it after a refund. Legal basis: performing a contract.</>,
      <><b>Tracker and alerts.</b> We keep the jobs you save, with status and notes. If you turn on alerts, we keep your profile, answers and country order to email you new postings. Legal basis: your consent, which you can withdraw at any time through the link in every email or by turning alerts off.</>,
      <><b>Technical data.</b> Our providers log IP addresses and request details for security and abuse prevention. Legal basis: legitimate interest (art. 7, IX). We use no advertising cookies or tracking tools. Your browser stores your language and sign-in session (localStorage).</>,
    ] },
    { h: "Who we share it with", body: [
      "Only the providers that run the service, and only what they need: Cloudflare (hosting and network), Supabase (database and sign-in), Mercado Pago (payments), Kiwify (ebook sales), Anthropic (writing kits) and Resend (sending alerts). We don't sell or rent personal data.",
      "Some of these providers process data outside Brazil, for example in the United States. That international transfer relies on the contractual safeguards they offer (LGPD art. 33).",
    ] },
    { h: "How long we keep it", body: [
      "Account data, kits, tracker and alerts: until you delete them or your account. Payment records: as long as tax law requires (usually five years), also after the account is deleted, without a link to your profile. Providers' technical logs: for each provider's period.",
    ] },
    { h: "Your rights", body: [
      "You can confirm whether we process your data, access it, correct it, ask for portability, anonymisation or deletion, learn who we share it with, and withdraw consent (LGPD art. 18).",
      <>In the account menu, &quot;Download my data&quot; gives you a copy of everything we keep, and &quot;Delete account&quot; removes the account and its data (a live monthly subscription is cancelled first). For anything else, write to {o.mail}. You can also complain to Brazil&apos;s data protection authority (ANPD).</>,
    ] },
    { h: "Children", body: ["The service is for people aged 18 and over."] },
    { h: "Changes to this policy", body: [`We'll announce material changes on the site, and by email to subscribers, before they apply. Last updated: ${UPDATED}.`] },
  ];
}

function terms(pt: boolean): Section[] {
  const o = owner(pt);
  return pt ? [
    { h: "O serviço", body: [<>O Visa Job Atlas, operado por {o.who}, cruza seu perfil com vagas públicas e regras de visto e monta um plano para conseguir um emprego com visto patrocinado. Ao usar o serviço você aceita estes termos.</>] },
    { h: "O que o serviço não é", body: [
      "Não é aconselhamento jurídico nem de imigração, e não garante emprego, entrevista nem visto. As regras de visto mudam: confirme cada rota no site oficial do governo antes de agir.",
      "As vagas vêm de sites de empresas, sites públicos de emprego e registros governamentais. Podem estar desatualizadas ou incorretas. A candidatura é feita no site de cada empresa; não intermediamos contratações.",
    ] },
    { h: "Planos e pagamento", body: [
      "Grátis: as três vagas mais compatíveis, os três melhores países e o primeiro trecho do plano.",
      "Pro mensal: R$ 39,99 por mês, cobrado no cartão pelo Mercado Pago e renovado todo mês até você cancelar.",
      "Pro 3 meses: R$ 99,99 em um pagamento (Pix, cartão ou boleto), com 90 dias de acesso e sem renovação automática. Um novo passe soma mais 90 dias.",
      "Você pode cancelar o plano mensal a qualquer momento no menu da conta; o acesso continua até o fim do período já pago. Mudanças de preço serão avisadas com pelo menos 30 dias de antecedência e não afetam um período já pago.",
    ] },
    { h: "Direito de arrependimento e reembolso", body: [
      <>Você pode desistir da compra em até 7 dias após o pagamento e receber o valor de volta (Código de Defesa do Consumidor, art. 49). Escreva para {o.mail} com o e-mail da conta. Depois desse prazo, não há reembolso proporcional, mas o plano mensal pode ser cancelado para não renovar.</>,
    ] },
    { h: "Códigos Pro", body: [
      "Um código Pro dá o número de dias indicado nele, uma vez, para uma conta; cada conta pode usar um código por oferta. Ele vale até a data de validade, não tem valor em dinheiro, não renova e não pode ser trocado. Se você já tem um plano mensal que renova, o código não é aplicado. Se a compra que deu direito ao código for reembolsada, podemos cancelar um código ainda não usado.",
    ] },
    { h: "Uso justo", body: [
      "O Pro inclui até 30 kits de candidatura por mês; contas grátis têm um kit de amostra. É proibido acessar o serviço de forma automatizada, revender os dados ou burlar os limites de cada plano. Podemos suspender contas que abusem do serviço.",
    ] },
    { h: "Conteúdo escrito por IA", body: [
      "Os kits são escritos por um modelo de inteligência artificial a partir do seu CV e da vaga. Ele é instruído a usar só o que está no seu CV, mas pode errar. Revise tudo antes de enviar: você é responsável pelo que envia em seu nome.",
    ] },
    { h: "Sua conta", body: ["Mantenha o acesso ao seu e-mail seguro e informe dados verdadeiros. Você pode baixar seus dados ou excluir a conta a qualquer momento, como descrito na Política de Privacidade."] },
    { h: "Disponibilidade", body: ["Trabalhamos para manter o serviço no ar, mas ele pode ter interrupções. Podemos mudar ou encerrar funções; se encerrarmos o Pro, devolvemos o valor proporcional do período pago e não usado."] },
    { h: "Responsabilidade", body: ["Dentro do que a lei permite, não respondemos por decisões tomadas com base nas informações do serviço, nem pelo conteúdo de sites de terceiros. Nada aqui limita os seus direitos como consumidor."] },
    { h: "Lei e foro", body: [`Estes termos seguem a lei brasileira. Fica eleito o foro do domicílio do consumidor. Última atualização: ${UPDATED}.`] },
  ] : [
    { h: "The service", body: [<>Visa Job Atlas, operated by {o.who}, matches your profile with public job postings and visa rules and builds a plan for getting a visa-sponsored job. By using it you accept these terms.</>] },
    { h: "What it is not", body: [
      "It is not legal or immigration advice, and it does not guarantee a job, an interview or a visa. Visa rules change: confirm every route on the official government site before you act.",
      "Postings come from company career sites, public job boards and government registers. They can be outdated or wrong. You apply on each employer's site; we don't take part in hiring.",
    ] },
    { h: "Plans and payment", body: [
      "Free: your three best-matching jobs, your top three countries and the first leg of the plan.",
      "Pro monthly: R$39.99 a month, charged to your card through Mercado Pago and renewed every month until you cancel.",
      "Pro 3 months: R$99.99 in one payment (Pix, card or boleto) for 90 days of access, with no automatic renewal. Another pass adds 90 more days.",
      "You can cancel the monthly plan at any time from the account menu; access continues until the end of the period already paid. Price changes will be announced at least 30 days ahead and don't affect a period already paid.",
    ] },
    { h: "Right of withdrawal and refunds", body: [
      <>You can withdraw from a purchase within 7 days of paying and get your money back (Brazilian Consumer Code, art. 49). Write to {o.mail} from the account's email. After that there are no partial refunds, but the monthly plan can be cancelled so it doesn&apos;t renew.</>,
    ] },
    { h: "Pro codes", body: [
      "A Pro code gives the number of days stated with it, once, to one account; each account can use one code per offer. It works until its expiry date, has no cash value, doesn't renew and can't be exchanged. If you already have a monthly plan that renews, the code isn't applied. If the purchase that came with the code is refunded, we may cancel a code that hasn't been used yet.",
    ] },
    { h: "Fair use", body: [
      "Pro includes up to 30 application kits a month; free accounts get one sample kit. Automated access, reselling the data or getting around a plan's limits is not allowed. We may suspend accounts that abuse the service.",
    ] },
    { h: "AI-written content", body: [
      "Kits are written by an artificial intelligence model from your CV and the posting. It is told to use only what your CV shows, but it can make mistakes. Review everything before you send it: you are responsible for what you send in your name.",
    ] },
    { h: "Your account", body: ["Keep access to your email secure and give truthful information. You can download your data or delete your account at any time, as described in the Privacy Policy."] },
    { h: "Availability", body: ["We work to keep the service up, but it may have interruptions. We may change or end features; if we end Pro, we refund the unused part of the period you paid for."] },
    { h: "Liability", body: ["As far as the law allows, we are not liable for decisions made on the basis of the service's information or for the content of third-party sites. Nothing here limits your rights as a consumer."] },
    { h: "Law and venue", body: [`These terms are governed by Brazilian law. Disputes go to the courts of the consumer's domicile. Last updated: ${UPDATED}.`] },
  ];
}

export default function Legal({ doc, onClose }: { doc: LegalDoc; onClose: () => void }) {
  const { t, lang } = useT();
  const pt = lang === "pt";
  const sections = doc === "privacy" ? privacy(pt) : terms(pt);
  return (
    <article className="legal card">
      <h1>{doc === "privacy" ? t("privacyLink") : t("termsLink")}</h1>
      {sections.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          {s.body.map((b, i) => <p key={i}>{b}</p>)}
        </section>
      ))}
      <button className="btn" onClick={onClose}>{t("back")}</button>
    </article>
  );
}
