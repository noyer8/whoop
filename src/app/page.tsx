const blocs = [
  { titre: "Dashboard récup/charge", desc: "Z4-Z5 vs 150 min, strain, recovery, tendances HRV/FC", etat: "à venir" },
  { titre: "Journal d'entraînement", desc: "Saisie séances : type, exos, RPE, notes", etat: "à venir" },
  { titre: "Douleurs", desc: "Log par zone + intensité + timeline", etat: "à venir" },
  { titre: "Tests / Bronco", desc: "Historique chronos + courbe de progression", etat: "à venir" },
  { titre: "Planning", desc: "Semaine prévue vs réalisé", etat: "à venir" },
  { titre: "Croisements", desc: "Douleur ↔ séances, recovery ↔ foot, Z4-Z5 ↔ Bronco", etat: "à venir" },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Whoop Tracker</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Suivi perso de performance — milieu de terrain en prépa physique.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {blocs.map((b) => (
          <li
            key={b.titre}
            className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{b.titre}</h2>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500 dark:bg-neutral-800">
                {b.etat}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-500">{b.desc}</p>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-xs text-neutral-400">
        Étape 1/6 — setup projet, connexion Supabase et migrations en place.
      </p>
    </main>
  );
}
