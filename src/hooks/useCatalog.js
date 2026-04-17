/*
 * useCatalog — thin React wrapper around the catalog loader. Returns a
 * { status, data, error } triple so callers can render a skeleton, the
 * data, or an error state without juggling promises themselves.
 */

import { useEffect, useState } from "react";
import { loadCatalog } from "../lib/catalog.js";

export const useCatalog = () => {
    const [state, setState] = useState({ status: "loading", data: null, error: null });

    useEffect(() => {
        let cancelled = false;
        loadCatalog()
            .then((catalog) => {
                if (!cancelled) setState({ status: "ready", data: catalog, error: null });
            })
            .catch((err) => {
                if (!cancelled) setState({ status: "error", data: null, error: err });
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return state;
};
