import { AlertTriangle } from "lucide-react";

export function AIDisclaimer() {
  return (
    <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
      <AlertTriangle className="h-3.5 w-3.5" />
      AI-generated outputs should be reviewed before making business decisions.
    </p>
  );
}