import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Brain, Calendar, Mail, Sparkles, Target, Zap, BarChart3, FileSearch } from "lucide-react";
import heroImage from "@/assets/hero.jpg";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ConnectSmart AI — AI Workplace Productivity Assistant" },
      { name: "description", content: "Reclaim your focus. AI-powered planning, meeting intelligence, email drafting and burnout detection in one workspace." },
      { property: "og:title", content: "ConnectSmart AI" },
      { property: "og:description", content: "Your AI-powered workplace productivity assistant." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Brain, title: "AI Productivity Coach", desc: "Daily insights, focus blocks and burnout risk scoring." },
  { icon: Calendar, title: "Smart Task Planner", desc: "Eisenhower matrix scheduling with intelligent priorities." },
  { icon: Mail, title: "Email Generator", desc: "Draft client, team and manager emails in any tone." },
  { icon: FileSearch, title: "Meeting Intelligence", desc: "Turn raw notes into action items and decisions." },
  { icon: BarChart3, title: "Productivity Reports", desc: "Weekly trends, hours saved and performance scores." },
  { icon: Sparkles, title: "Research Assistant", desc: "Summaries, risks and executive briefings on demand." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-md bg-background/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="ConnectSmart AI" width={32} height={32} className="h-8 w-8" />
            <span className="font-display text-lg font-semibold tracking-tight">ConnectSmart AI</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/auth"><Button size="sm" className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">Get started</Button></Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Zap className="h-3 w-3" /> Powered by Lovable AI
            </div>
            <h1 className="mt-5 font-display text-5xl font-bold leading-tight tracking-tight md:text-6xl">
              Your <span className="text-gradient">AI productivity</span> partner at work.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              ConnectSmart AI plans your day, drafts your emails, summarises your meetings and protects you from burnout — so you can do your best work.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth"><Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">Start free</Button></Link>
              <Link to="/auth"><Button size="lg" variant="outline">Sign in</Button></Link>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4 text-primary" /> No credit card required.
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-primary opacity-20 blur-3xl" />
            <img src={heroImage} alt="AI productivity dashboard" width={1536} height={1024} className="relative rounded-3xl shadow-elegant border border-border/50" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/60 bg-gradient-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Everything you need to work smarter</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">A unified AI workspace that turns scattered tools into one intelligent assistant.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="glass rounded-2xl p-6 transition hover:shadow-elegant">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} ConnectSmart AI. AI-generated outputs should be reviewed before making business decisions.
      </footer>
    </div>
  );
}