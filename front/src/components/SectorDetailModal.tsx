import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import type { TickerRow } from "../lib/stocks";
import StockTable from "./StockTable";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sector: string | null;
  rows: TickerRow[];
}

export default function SectorDetailModal({
  open,
  onOpenChange,
  sector,
  rows,
}: Props) {
  if (!sector) return null;

  const sectorRows = rows.filter((r) => r.sector === sector);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{sector} 섹터 상세보기</DialogTitle>
        </DialogHeader>

        {/* 여기서는 테이블 뷰 활용 */}
        <StockTable rows={sectorRows} />
      </DialogContent>
    </Dialog>
  );
}
