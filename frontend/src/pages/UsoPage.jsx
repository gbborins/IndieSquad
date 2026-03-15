import CostTracker from '../components/CostTracker';

const ICON_BASE = "https://unpkg.com/pixelarticons@latest/svg";

export default function UsoPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <img src={`${ICON_BASE}/wallet.svg`} alt="uso" width={20} height={20}
          style={{ imageRendering: 'pixelated', filter: 'invert(1)', opacity: 0.5 }} />
        <span>Uso &amp; Custos</span>
      </div>
      <p className="page-description">Acompanhe o consumo de tokens e os custos estimados de cada agente da guilda.</p>
      <CostTracker />
    </div>
  );
}
