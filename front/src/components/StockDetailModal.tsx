import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import type { TickerRow } from "../types";
import StockChart from "./StockChart";
import RiseContext from "./RiseContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: TickerRow | null;
}

/**
 * Modal for inspecting a single ticker in detail.  Shows both the rise
 * context comparison and the full time series chart.  If no row is
 * provided, the modal is hidden.
 */
export default function StockDetailModal({ open, onOpenChange, row }: Props) {
  if (!row) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {row.name}{" "}
            <span className="text-muted-foreground text-sm">({row.symbol})</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* 상승 전/시작/최신 비교 */}
          <RiseContext row={row} />
          {/* 전체 시계열 */}
          <StockChart row={row} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
