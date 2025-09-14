interface Props {
  label: string;
  value?: number | string;
}

export default function DataRow({ label, value }: Props) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">
        {typeof value === "number" ? value.toFixed(2) : value ?? "-"}
      </span>
    </div>
  );
}
