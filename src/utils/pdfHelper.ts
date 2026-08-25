import { WorkProject, ContractedProductItem, ContractAttachment } from '../types';

/**
 * Creates a formatted sample Base64/Data URI PDF representation of a steel fabrication contract
 */
export function generateSampleContractPdfDataUrl(project: {
  code: string;
  title: string;
  clientName: string;
  contractedValue: number;
  startDate: string;
  deadlineDate: string;
  steelWeightKg?: number;
  contractedProducts?: ContractedProductItem[];
}): string {
  // A clean, printable HTML document packaged as a data URI that can be rendered seamlessly in an iframe
  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contrato de Fornecimento e Estrutura Metálica - ${project.code}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1e293b;
      background: #f8fafc;
      padding: 40px;
      line-height: 1.5;
    }
    .page {
      background: #ffffff;
      max-width: 800px;
      margin: 0 auto;
      padding: 48px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }
    .header {
      border-bottom: 2px solid #ea580c;
      padding-bottom: 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #ea580c;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .contract-badge {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      color: #c2410c;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      text-align: right;
    }
    h1 {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      text-align: center;
      margin: 20px 0 24px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #ea580c;
      text-transform: uppercase;
      margin: 20px 0 8px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
    }
    .parties-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 14px;
      font-size: 12px;
      margin-bottom: 16px;
      color: #334155;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 20px;
      font-size: 11px;
    }
    .table th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      padding: 8px 10px;
      text-align: left;
      border: 1px solid #cbd5e1;
    }
    .table td {
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .clause {
      font-size: 11.5px;
      color: #334155;
      margin-bottom: 10px;
      text-align: justify;
    }
    .signatures {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      gap: 30px;
    }
    .sig-line {
      flex: 1;
      border-top: 1px solid #64748b;
      padding-top: 6px;
      text-align: center;
      font-size: 11px;
      color: #475569;
      font-weight: 600;
    }
    .seal {
      margin-top: 24px;
      padding: 10px;
      border: 1px dashed #22c55e;
      background: #f0fdf4;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 11px;
      color: #166534;
      font-weight: 700;
    }
    @media print {
      body { padding: 0; background: #fff; }
      .page { box-shadow: none; border: none; padding: 20px; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="brand-title">AÇOGESTÃO SERRALHERIA INDUSTRIAL</div>
        <div class="brand-sub">Estruturas Metálicas, Galpões & Serralheria de Aço</div>
      </div>
      <div class="contract-badge">
        CONTRATO N° ${project.code}<br>
        <span style="font-size:10px; font-weight:normal; color:#64748b;">Emitido em: ${new Date().toLocaleDateString('pt-BR')}</span>
      </div>
    </div>

    <h1>INSTRUMENTO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS E FORNECIMENTO DE ESTRUTURAS METÁLICAS</h1>

    <div class="section-title">1. DAS PARTES CONTRATANTES</div>
    <div class="parties-box">
      <strong>CONTRATADA:</strong> AçoMaster Indústria e Estruturas Metálicas Ltda, CNPJ 34.892.110/0001-45, Av. Industrial do Aço, 1500.<br>
      <strong>CONTRATANTE:</strong> ${project.clientName}, representada nos autos desta proposta contratual.<br>
      <strong>OBJETO DO CONTRATO:</strong> ${project.title}.
    </div>

    <div class="section-title">2. ESPECIFICAÇÕES TÉCNICAS E PRODUTOS CONTRATADOS</div>
    <p class="clause">
      A CONTRATADA compromete-se a fabricar, preparar, tratar superficialmente e montar em conformidade com as normas ABNT NBR 8800 (Projeto de Estruturas de Aço) e NBR 14762 os seguintes itens:
    </p>

    <table class="table">
      <thead>
        <tr>
          <th>Item / Descrição do Produto</th>
          <th>Qtd. Contratada</th>
          <th>Unid.</th>
          <th>Valor Unit. (R$)</th>
          <th>Total (R$)</th>
        </tr>
      </thead>
      <tbody>
        ${(project.contractedProducts && project.contractedProducts.length > 0
          ? project.contractedProducts.map(p => `
            <tr>
              <td><strong>${p.description}</strong></td>
              <td>${p.quantityTotal}</td>
              <td>${p.unit}</td>
              <td>R$ ${p.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              <td><strong>R$ ${p.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
            </tr>
          `).join('')
          : `
            <tr>
              <td><strong>${project.title}</strong> (Conforme Memorial Descritivo)</td>
              <td>1</td>
              <td>conjunto</td>
              <td>R$ ${project.contractedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              <td><strong>R$ ${project.contractedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
            </tr>
          `
        )}
      </tbody>
    </table>

    <div class="section-title">3. VALOR, CONDIÇÕES DE PAGAMENTO E PRAZOS</div>
    <p class="clause">
      <strong>3.1.</strong> Pela execução e entrega do objeto, o CONTRATANTE pagará o valor global fixo e irreajustável de 
      <strong>R$ ${project.contractedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
    </p>
    <p class="clause">
      <strong>3.2.</strong> O prazo de início dos trabalhos é fixado em <strong>${project.startDate}</strong> com conclusão prevista para <strong>${project.deadlineDate}</strong>.
    </p>

    <div class="section-title">4. DA GARANTIA E RESPONSABILIDADE TÉCNICA</div>
    <p class="clause">
      A CONTRATADA fornece garantia estrutural de 05 (cinco) anos para as estruturas metálicas fornecidas e 01 (um) ano para componentes mecânicos e revestimentos superficiais, acompanhada da devida Anotação de Responsabilidade Técnica (ART/CREA).
    </p>

    <div class="signatures">
      <div class="sig-line">
        <strong>CONTRATADA</strong><br>
        AçoMaster Indústria e Estruturas Metálicas<br>
        Diretoria Técnica
      </div>
      <div class="sig-line">
        <strong>CONTRATANTE</strong><br>
        ${project.clientName}<br>
        Representante Legal
      </div>
    </div>

    <div class="seal">
      <span>✔ DOCUMENTO REGISTRADO ELETRONICAMENTE - AUTENTICAÇÃO DIGITAL ICP-BRASIL</span>
    </div>
  </div>
</body>
</html>
`;

  return 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
}

/**
 * Creates a formatted Production Order & Shop Drawing (Desenho Técnico de Produção) Data URL for preview and download
 */
export function generateProductionOrderDrawingPdfDataUrl(order: {
  osNumber: string;
  projectCode: string;
  projectTitle: string;
  clientName: string;
  productDescription: string;
  quantity: number;
  unit: string;
  issuedAt: string;
  deadlineDate?: string;
  paintColor?: string;
  assignedTeam?: string;
  notes?: string;
  structureType?: string;
  weightKgEstimated?: number;
}): string {
  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Desenho de Produção e Ordem Fabril - ${order.osNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      padding: 30px;
      line-height: 1.4;
    }
    .sheet {
      background: #ffffff;
      max-width: 900px;
      margin: 0 auto;
      padding: 36px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      border: 2px solid #0f172a;
    }
    .header-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      border-bottom: 3px solid #ea580c;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .title-block h1 {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: -0.5px;
    }
    .title-block p {
      font-size: 11px;
      color: #ea580c;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    .os-badge {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 6px;
      text-align: right;
      font-family: 'JetBrains Mono', monospace;
    }
    .os-badge .lbl {
      font-size: 9px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .os-badge .val {
      font-size: 16px;
      font-weight: 700;
      color: #f97316;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 11px;
    }
    .info-item .k {
      color: #64748b;
      text-transform: uppercase;
      font-size: 9px;
      font-weight: 700;
      display: block;
    }
    .info-item .v {
      font-weight: 700;
      color: #0f172a;
    }
    .drawing-box {
      border: 2px dashed #94a3b8;
      background: #f8fafc;
      border-radius: 6px;
      padding: 24px;
      margin-bottom: 20px;
      text-align: center;
      position: relative;
    }
    .drawing-title {
      font-size: 12px;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    .cad-canvas {
      width: 100%;
      height: 240px;
      background: #0f172a;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .cad-canvas svg {
      width: 100%;
      height: 100%;
    }
    .specs-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 20px;
    }
    .specs-table th {
      background: #0f172a;
      color: white;
      text-align: left;
      padding: 8px 10px;
      font-size: 10px;
      text-transform: uppercase;
    }
    .specs-table td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      color: #1e293b;
    }
    .checklist-steps {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 20px;
      font-size: 10px;
    }
    .step-box {
      border: 1px solid #cbd5e1;
      padding: 8px;
      border-radius: 4px;
      background: #ffffff;
    }
    .step-box strong {
      display: block;
      color: #0f172a;
      margin-bottom: 4px;
      font-size: 10px;
      text-transform: uppercase;
    }
    .stamp-box {
      display: flex;
      justify-content: space-between;
      border-top: 2px solid #0f172a;
      padding-top: 14px;
      margin-top: 20px;
      font-size: 10px;
      color: #475569;
    }
    .sign-field {
      border-top: 1px solid #94a3b8;
      width: 180px;
      text-align: center;
      padding-top: 4px;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header-grid">
      <div class="title-block">
        <h1>DESENHO TÉCNICO & ORDEM DE PRODUÇÃO</h1>
        <p>AçoMaster Indústria e Estruturas Metálicas • Liberação PCP</p>
      </div>
      <div class="os-badge">
        <div class="lbl">Ordem de Produção / OS</div>
        <div class="val">${order.osNumber}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-item">
        <span class="k">Obra / Projeto</span>
        <span class="v">${order.projectCode} - ${order.projectTitle}</span>
      </div>
      <div class="info-item">
        <span class="k">Cliente</span>
        <span class="v">${order.clientName}</span>
      </div>
      <div class="info-item">
        <span class="k">Tipo de Estrutura</span>
        <span class="v">${order.structureType || 'Estrutura Metálica'}</span>
      </div>
      <div class="info-item">
        <span class="k">Item / Componente</span>
        <span class="v">${order.productDescription}</span>
      </div>
      <div class="info-item">
        <span class="k">Lote Liberado</span>
        <span class="v">${order.quantity} ${order.unit}</span>
      </div>
      <div class="info-item">
        <span class="k">Data de Emissão</span>
        <span class="v">${order.issuedAt}</span>
      </div>
      <div class="info-item">
        <span class="k">Prazo Limite Fábrica</span>
        <span class="v" style="color: #ea580c;">${order.deadlineDate || 'Imediato'}</span>
      </div>
      <div class="info-item">
        <span class="k">Acabamento / Pintura</span>
        <span class="v">${order.paintColor || 'Primer Epóxi'}</span>
      </div>
      <div class="info-item">
        <span class="k">Encarregado / Setor</span>
        <span class="v">${order.assignedTeam || 'Corte e Solda Fabril'}</span>
      </div>
    </div>

    <!-- ESQUEMA TÉCNICO / VETORIAL DE PRODUÇÃO -->
    <div class="drawing-box">
      <div class="drawing-title">
        <span>VISTA ESQUEMÁTICA E COTAS DE FABRICAÇÃO (REV. 01)</span>
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #64748b;">ESCALA 1:50</span>
      </div>
      <div class="cad-canvas">
        <svg viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Grid Background -->
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect width="800" height="240" fill="url(#grid)" />
          
          <!-- Structural Truss / Beam Drawing -->
          <g stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Top Chord -->
            <line x1="80" y1="90" x2="400" y2="40" stroke="#f97316" stroke-width="3" />
            <line x1="400" y1="40" x2="720" y2="90" stroke="#f97316" stroke-width="3" />
            <!-- Bottom Chord -->
            <line x1="80" y1="160" x2="720" y2="160" stroke="#38bdf8" stroke-width="3" />
            <!-- Columns / Supports -->
            <line x1="80" y1="90" x2="80" y2="210" stroke="#ffffff" stroke-width="4" />
            <line x1="720" y1="90" x2="720" y2="210" stroke="#ffffff" stroke-width="4" />
            <!-- Base Plates -->
            <line x1="50" y1="210" x2="110" y2="210" stroke="#fbbf24" stroke-width="4" />
            <line x1="690" y1="210" x2="750" y2="210" stroke="#fbbf24" stroke-width="4" />
            <!-- Web Members / Treliça -->
            <line x1="80" y1="160" x2="160" y2="80" stroke="#38bdf8" stroke-dasharray="3,3" />
            <line x1="160" y1="80" x2="240" y2="160" stroke="#38bdf8" />
            <line x1="240" y1="160" x2="320" y2="60" stroke="#38bdf8" />
            <line x1="320" y1="60" x2="400" y2="160" stroke="#38bdf8" />
            <line x1="400" y1="40" x2="400" y2="160" stroke="#f97316" stroke-width="2" />
            <line x1="400" y1="160" x2="480" y2="60" stroke="#38bdf8" />
            <line x1="480" y1="60" x2="560" y2="160" stroke="#38bdf8" />
            <line x1="560" y1="160" x2="640" y2="80" stroke="#38bdf8" />
            <line x1="640" y1="80" x2="720" y2="160" stroke="#38bdf8" stroke-dasharray="3,3" />
          </g>

          <!-- Annotations and Dimensions -->
          <text x="400" y="25" fill="#f97316" font-size="11" font-family="'JetBrains Mono', monospace" text-anchor="middle" font-weight="bold">VÃO LIVRE L = 15.000 mm (PERFIL W / ASTM A572)</text>
          <text x="80" y="230" fill="#94a3b8" font-size="9" font-family="'JetBrains Mono', monospace" text-anchor="middle">CHAPA DE BASE 3/4"</text>
          <text x="720" y="230" fill="#94a3b8" font-size="9" font-family="'JetBrains Mono', monospace" text-anchor="middle">CHAPA DE BASE 3/4"</text>
          <text x="400" y="185" fill="#38bdf8" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="middle">BANZO INFERIOR 2U 150x50x3.00</text>
        </svg>
      </div>
    </div>

    <!-- TABELA DE MATERIAIS & ESPECIFICAÇÕES -->
    <table class="specs-table">
      <thead>
        <tr>
          <th>Componente</th>
          <th>Especificação Técnica</th>
          <th>Material / Aço</th>
          <th>Processo Fabril</th>
          <th>Inspeção</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${order.productDescription}</strong></td>
          <td>Perfil Estrutural Conforme Projeto Executivo</td>
          <td>ASTM A36 / SAC 350</td>
          <td>Corte Plasma / Furação CNC</td>
          <td>Visual + Dimensional 100%</td>
        </tr>
        <tr>
          <td><strong>Gabarito de Soldagem</strong></td>
          <td>Eletrodo E7018 / MIG ER70S-6 (Garganta 6mm)</td>
          <td>AWS D1.1</td>
          <td>Solda Contínua Estrutural</td>
          <td>Ensaio Líquido Penetrante (LP)</td>
        </tr>
        <tr>
          <td><strong>Tratamento Superficial</strong></td>
          <td>Jateamento Abrasivo Padrão Sa 2.5</td>
          <td>Pintura ${order.paintColor || 'Epóxi Primer 80µm'}</td>
          <td>Cabine de Pintura e Secagem</td>
          <td>Medição de Espessura Úmida/Seca</td>
        </tr>
      </tbody>
    </table>

    ${order.notes ? `
    <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 10px 14px; border-radius: 6px; font-size: 11px; margin-bottom: 16px; color: #92400e;">
      <strong>OBSERVAÇÕES ESPECIAIS DE FÁBRICA:</strong> ${order.notes}
    </div>
    ` : ''}

    <!-- FLUXO DE LIBERAÇÃO -->
    <div class="checklist-steps">
      <div class="step-box">
        <strong>1. Corte & Preparo</strong>
        <span>[  ] Material Verificado</span><br>
        <span>Visto: ______________</span>
      </div>
      <div class="step-box">
        <strong>2. Solda Estrutural</strong>
        <span>[  ] Gabarito Conferido</span><br>
        <span>Visto: ______________</span>
      </div>
      <div class="step-box">
        <strong>3. Pintura & Sa 2.5</strong>
        <span>[  ] Espessura OK</span><br>
        <span>Visto: ______________</span>
      </div>
      <div class="step-box">
        <strong>4. Liberação PCP</strong>
        <span>[  ] Pronto p/ Obra</span><br>
        <span>Visto: ______________</span>
      </div>
    </div>

    <!-- RODAPÉ E ASSINATURAS -->
    <div class="stamp-box">
      <div>
        <strong>PCP AÇOMASTER</strong><br>
        Emissão: ${order.issuedAt}<br>
        Documento Oficial de Chão de Fábrica
      </div>
      <div class="sign-field">
        Encarregado de Produção
      </div>
      <div class="sign-field">
        Inspetor de Qualidade CQ
      </div>
    </div>
  </div>
</body>
</html>
`;

  return 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
}

/**
 * Trigger browser file download given a data URL or blob
 */
export function downloadFile(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format bytes to readable string (e.g. 2.4 MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

