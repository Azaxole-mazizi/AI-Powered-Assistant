import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createThread, deleteThread, listThreads } from "@/lib/data.functions";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "AI Chat — ConnectSmart AI" }, { name: "description", content: "Chat with ConnectSmart AI across multiple threads to plan tasks, draft emails, analyse meetings and explore research." }, { property: "og:title", content: "AI Chat — ConnectSmart AI" }, { property: "og:description", content: "Chat with ConnectSmart AI across multiple threads to plan tasks, draft emails, analyse meetings and explore research." }] }),
  component: ChatLayout,
});

function ChatLayout() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const params = useParams({ strict: false }) as { threadId?: string };
  const listFn = useServerFn(listThreads);
  const createFn = useServerFn(createThread);
  const deleteFn = useServerFn(deleteThread);

  const { data: threads = [] } = useQuery({ queryKey: ["threads"], queryFn: () => listFn() });

  const create = useMutation({
    mutationFn: () => createFn({ data: { title: "New conversation" } }),
    onSuccess: (t: any) => { qc.invalidateQueries({ queryKey: ["threads"] }); nav({ to: "/chat/$threadId", params: { threadId: t.id } }); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      if (params.threadId === id) nav({ to: "/chat" });
    },
  });

  return (
    <div className="flex h-screen">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-sidebar/40 lg:flex">
        <div className="p-3">
          <Button onClick={() => create.mutate()} className="w-full bg-gradient-primary text-primary-foreground shadow-elegant">
            <Plus className="mr-2 h-4 w-4" /> New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {threads.length === 0 && <p className="px-3 py-6 text-center text-xs text-muted-foreground">No conversations yet</p>}
          {threads.map((t: any) => {
            const active = params.threadId === t.id;
            return (
              <div key={t.id} className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${active ? "bg-accent" : "hover:bg-accent/60"}`}>
                <Link to="/chat/$threadId" params={{ threadId: t.id }} className="flex flex-1 items-center gap-2 truncate">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{t.title}</span>
                </Link>
                <button onClick={() => del.mutate(t.id)} className="opacity-0 transition group-hover:opacity-100" aria-label="Delete">
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            );
          })}
        </div>
      </aside>
      <div className="flex-1 overflow-hidden"><Outlet /></div>
    </div>
  );
}