/**
 * Turnier: Gruppenphase plus K.o., optional Bigscreen-Tafel.
 *
 * true: Schalter in der Online-Lobby, Logik und Tafel aktiv.
 * false: Dateien bleiben, UI und Nachrichten werden ignoriert.
 *
 * TOURNAMENT_MODE_ENABLED ist derselbe Schalter (Alias).
 */
export const TOURNAMENT_LIVE = true;
export { TOURNAMENT_LIVE as TOURNAMENT_MODE_ENABLED };

/** Unter dieser Zahl kein Turnier, nur eine normale Runde. */
export const CUP_MIN = 4;

/** Obere Grenze für den Raum, wenn das Turnier an ist. */
export const CUP_MAX = 32;

/** Eine normale Runde bleibt bei acht Plätzen. */
export const TABLE_CAP = 8;
