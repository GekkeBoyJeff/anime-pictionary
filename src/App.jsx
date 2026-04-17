/*
 * App — top-level layout + route table.
 *
 * We use Wouter's hash/base routing under Vite's BASE_URL so the same build
 * works whether deployed at /anime-pictionary/ or at a custom-domain root.
 */

import { Route, Router, Switch } from "wouter";
import { Keuzescherm } from "./pages/Keuzescherm.jsx";
import { Inspiratiescherm } from "./pages/Inspiratiescherm.jsx";
import { Tekenscherm } from "./pages/Tekenscherm.jsx";
import { AdminLogin } from "./pages/AdminLogin.jsx";
import { AdminDashboard } from "./pages/AdminDashboard.jsx";
import { AdminHintEdit } from "./pages/AdminHintEdit.jsx";

/**
 * Vite exposes `BASE_URL` with a trailing slash. Wouter wants a prefix
 * without the trailing slash (unless it is `/`). Normalise here so the rest
 * of the app stays blissfully unaware.
 */
const routerBase = () => {
    const base = import.meta.env.BASE_URL ?? "/";
    if (base === "/") return "";
    return base.endsWith("/") ? base.slice(0, -1) : base;
};

const NotFound = () => (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
        <h1 className="font-display text-5xl text-sumi">404</h1>
        <p className="text-muted">Deze pagina bestaat niet.</p>
        <a
            href={`${import.meta.env.BASE_URL}`}
            className="inline-flex items-center justify-center rounded-full bg-spirit px-6 py-3 font-bold text-washi-soft"
        >
            Terug naar keuzescherm
        </a>
    </main>
);

export const App = () => (
    <Router base={routerBase()}>
        <Switch>
            <Route path="/" component={Keuzescherm} />
            <Route path="/anime/:malId" component={Inspiratiescherm} />
            <Route path="/anime/:malId/draw" component={Tekenscherm} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/login" component={AdminLogin} />
            <Route path="/admin/hints/:malId" component={AdminHintEdit} />
            <Route component={NotFound} />
        </Switch>
    </Router>
);
