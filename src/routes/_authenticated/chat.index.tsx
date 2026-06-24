import { createFileRoute } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatEmpty,
});

function ChatEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <img src={logo} alt="" width={64} height={64} className="mb-4 h-16 w-16 opacity-80" />
      <h2 className="font-display text-2xl font-semibold">Start a new conversation</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Ask ConnectSmart AI to help plan your day, draft an email, summarise a meeting, or analyse a report.
      </p>
    </div>
  );
}