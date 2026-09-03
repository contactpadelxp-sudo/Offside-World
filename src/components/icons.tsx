import type { SVGProps } from "react";

/**
 * Jeu d'icônes maison — Offside Foot Indoor.
 *
 * Parti pris graphique : des **aplats pleins et géométriques**, sans contour
 * de trait uniforme. C'est volontairement l'inverse des jeux d'icônes
 * génériques (traits fins de 2 px, coins arrondis partout) que l'on retrouve
 * sur tous les sites : le rendu est plus affirmé, cohérent avec le logo en
 * lettres pleines, et reste lisible à 12–14 px là où un contour fin se casse.
 *
 * Toutes les icônes héritent de la couleur du texte (`currentColor`) et se
 * dimensionnent par `className` (ex. « size-4 »).
 */

export type IconType = (props: SVGProps<SVGSVGElement>) => React.ReactElement;

function Svg({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ══════════ Marque & activités ══════════ */

/** Ballon de football : disque plein, pentagone central et pièces du pourtour en réserve. */
export const Ballon: IconType = (p) => (
  <Svg {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 1.8a10.2 10.2 0 1 0 0 20.4 10.2 10.2 0 0 0 0-20.4Zm0 6.6 3.42 2.49-1.31 4.02H9.89L8.58 10.89 12 8.4Zm4.23-3.73a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm2.62 8.05a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM12 17.7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm-6.85-4.98a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm2.62-8.05a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"
    />
  </Svg>
);

export const Gateau: IconType = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="2.4" r="1.5" />
    <path d="M11.1 4.6h1.8v3.1h-1.8z" />
    <path d="M4.2 8.6h15.6a2.2 2.2 0 0 1 2.2 2.2v3.1H2V10.8a2.2 2.2 0 0 1 2.2-2.2Z" />
    <path d="M2 15.5h20v3.8A2.2 2.2 0 0 1 19.8 21.5H4.2A2.2 2.2 0 0 1 2 19.3v-3.8Z" />
  </Svg>
);

export const Trophee: IconType = (p) => (
  <Svg {...p}>
    <path d="M7 2.5h10V8a5 5 0 0 1-10 0V2.5Z" />
    <path d="M5.4 4H2.8v2.2a4.4 4.4 0 0 0 3.9 4.4V8.3A2.2 2.2 0 0 1 5.4 6.2V4Z" />
    <path d="M18.6 4h2.6v2.2a4.4 4.4 0 0 1-3.9 4.4V8.3a2.2 2.2 0 0 0 1.3-2.1V4Z" />
    <path d="M10.9 13.4h2.2v3.9h-2.2z" />
    <path d="M7.2 18.4h9.6a1 1 0 0 1 1 1v2.1H6.2v-2.1a1 1 0 0 1 1-1Z" />
  </Svg>
);

export const Groupe: IconType = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="7" r="4" />
    <path d="M9 12.8c-3.9 0-7 2.6-7 5.7V21.5h14v-3c0-3.1-3.1-5.7-7-5.7Z" />
    <circle cx="18" cy="8.4" r="2.9" />
    <path d="M18 13.6c-.9 0-1.8.2-2.6.5a8.6 8.6 0 0 1 2.6 4.4v3H22v-3c0-2.4-1.8-4.9-4-4.9Z" />
  </Svg>
);

export const Enfant: IconType = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="6.6" r="4.6" />
    <path d="M12 12.6c-4.1 0-7.5 2.8-7.5 6.4V22h15v-3c0-3.6-3.4-6.4-7.5-6.4Z" />
  </Svg>
);

export const Batiment: IconType = (p) => (
  <Svg {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.5 2h11v20h-11V2Zm3 3.2h2.1v2.1H6.5V5.2Zm4 0h2.1v2.1h-2.1V5.2Zm-4 4h2.1v2.1H6.5V9.2Zm4 0h2.1v2.1h-2.1V9.2Zm-4 4h2.1v2.1H6.5v-2.1Zm4 0h2.1v2.1h-2.1v-2.1Z"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15.8 8h4.7v14h-4.7V8Zm1.6 2.7h1.6v2.1h-1.6v-2.1Zm0 4.2h1.6V17h-1.6v-2.1Z"
    />
  </Svg>
);

/* ══════════ Navigation & flèches ══════════ */

export const FlecheDroite: IconType = (p) => (
  <Svg {...p}>
    <path d="M3 10.7h11.2v2.6H3z" />
    <path d="M13.2 5.4 20 12l-6.8 6.6V5.4Z" />
  </Svg>
);

export const FlecheGauche: IconType = (p) => (
  <Svg {...p}>
    <path d="M9.8 10.7H21v2.6H9.8z" />
    <path d="M10.8 5.4 4 12l6.8 6.6V5.4Z" />
  </Svg>
);

export const FlecheDiagonale: IconType = (p) => (
  <Svg {...p}>
    <path d="M7 5h12v12h-3v-6.9l-7.5 7.5-2.1-2.1L13.9 8H7V5Z" />
  </Svg>
);

export const ChevronBas: IconType = (p) => (
  <Svg {...p}>
    <path d="M12 16.6 4.4 9l2.5-2.5L12 11.6l5.1-5.1L19.6 9 12 16.6Z" />
  </Svg>
);

export const ChevronHaut: IconType = (p) => (
  <Svg {...p}>
    <path d="M12 7.4 19.6 15l-2.5 2.5L12 12.4l-5.1 5.1L4.4 15 12 7.4Z" />
  </Svg>
);

export const Menu: IconType = (p) => (
  <Svg {...p}>
    <path d="M3 5.4h18v2.6H3zM3 10.7h18v2.6H3zM3 16h18v2.6H3z" />
  </Svg>
);

export const Croix: IconType = (p) => (
  <Svg {...p}>
    <path d="M18.7 7.4 16.6 5.3 12 9.9 7.4 5.3 5.3 7.4 9.9 12l-4.6 4.6 2.1 2.1L12 14.1l4.6 4.6 2.1-2.1L14.1 12l4.6-4.6Z" />
  </Svg>
);

export const Plus: IconType = (p) => (
  <Svg {...p}>
    <path d="M10.6 3h2.8v7.6H21v2.8h-7.6V21h-2.8v-7.6H3v-2.8h7.6V3Z" />
  </Svg>
);

export const Coche: IconType = (p) => (
  <Svg {...p}>
    <path d="M9.6 18.4 3.2 12l2.6-2.6 3.8 3.8 8.6-8.6L20.8 7.2 9.6 18.4Z" />
  </Svg>
);

export const Maison: IconType = (p) => (
  <Svg {...p}>
    <path d="M12 2 1.5 11.2h3V22h6v-6h3v6h6V11.2h3L12 2Z" />
  </Svg>
);

export const LienExterne: IconType = (p) => (
  <Svg {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 6.6A2.6 2.6 0 0 1 6.6 4H11v2.8H6.8v10.4h10.4V13H20v4.4A2.6 2.6 0 0 1 17.4 20H6.6A2.6 2.6 0 0 1 4 17.4V6.6Z"
    />
    <path d="M13.2 3H21v7.8h-2.9V7.9L12 14l-2-2 6.1-6.1h-2.9V3Z" />
  </Svg>
);

/* ══════════ États & informations ══════════ */

export const AlerteCercle: IconType = (p) => (
  <Svg {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 1.8a10.2 10.2 0 1 0 0 20.4 10.2 10.2 0 0 0 0-20.4Zm-1.3 4.7h2.6v7.4h-2.6V6.5Zm0 9.1h2.6v2.6h-2.6v-2.6Z"
    />
  </Svg>
);

export const AlerteTriangle: IconType = (p) => (
  <Svg {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2.4 22.6 21H1.4L12 2.4Zm-1.3 6.7h2.6v6.2h-2.6V9.1Zm0 8h2.6v2.6h-2.6v-2.6Z"
    />
  </Svg>
);

export const Info: IconType = (p) => (
  <Svg {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 1.8a10.2 10.2 0 1 0 0 20.4 10.2 10.2 0 0 0 0-20.4ZM10.7 5.4h2.6V8h-2.6V5.4Zm0 4.4h2.6v8.4h-2.6V9.8Z"
    />
  </Svg>
);

export const Horloge: IconType = (p) => (
  <Svg {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 1.8a10.2 10.2 0 1 0 0 20.4 10.2 10.2 0 0 0 0-20.4Zm-1.3 4.5h2.6v5.4l3.7 2.2-1.3 2.2-5-3V6.3Z"
    />
  </Svg>
);

export const Bouclier: IconType = (p) => (
  <Svg {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 1.8 3.8 4.9v6.7c0 4.7 3.4 8.9 8.2 10.6 4.8-1.7 8.2-5.9 8.2-10.6V4.9L12 1.8Zm-.9 14.3-3.6-3.6 1.9-1.9 1.7 1.7 4.2-4.2 1.9 1.9-6.1 6.1Z"
    />
  </Svg>
);

export const Cadenas: IconType = (p) => (
  <Svg {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7 7a5 5 0 0 1 10 0v2h1.4A1.6 1.6 0 0 1 20 10.6v9.3a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19.9v-9.3A1.6 1.6 0 0 1 5.6 9H7V7Zm2.6 2h4.8V7a2.4 2.4 0 0 0-4.8 0v2Z"
    />
  </Svg>
);

export const Etoile: IconType = (p) => (
  <Svg {...p}>
    <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8l-6.2 3.2L7 14.2l-5-4.9 6.9-1L12 2Z" />
  </Svg>
);

export const Ampoule: IconType = (p) => (
  <Svg {...p}>
    <path d="M12 2a7 7 0 0 0-4 12.7v2.2h8v-2.2A7 7 0 0 0 12 2Z" />
    <path d="M8.6 18.1h6.8v2.2H8.6z" />
    <path d="M9.9 21.4h4.2V23H9.9z" />
  </Svg>
);

/* ══════════ Contact & documents ══════════ */

export const Enveloppe: IconType = (p) => (
  <Svg {...p}>
    <path d="M21.4 4.6H2.6L12 11.1l9.4-6.5Z" />
    <path d="M2 6.4v13h20v-13l-10 6.9L2 6.4Z" />
  </Svg>
);

export const Epingle: IconType = (p) => (
  <Svg {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2a7.2 7.2 0 0 0-7.2 7.2C4.8 14.6 12 22 12 22s7.2-7.4 7.2-12.8A7.2 7.2 0 0 0 12 2Zm0 9.7a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"
    />
  </Svg>
);

export const Telephone: IconType = (p) => (
  <Svg {...p}>
    <path d="M6.6 2.4H3.4A1.6 1.6 0 0 0 1.8 4v2c0 8.9 7.3 16.2 16.2 16.2h2A1.6 1.6 0 0 0 21.6 20.6v-3.1a1.6 1.6 0 0 0-1.3-1.6l-3.6-.7a1.6 1.6 0 0 0-1.6.7l-1.1 1.5a13.2 13.2 0 0 1-5.4-5.4l1.5-1.1a1.6 1.6 0 0 0 .7-1.6L8.2 3.7a1.6 1.6 0 0 0-1.6-1.3Z" />
  </Svg>
);

export const Calendrier: IconType = (p) => (
  <Svg {...p}>
    <path d="M7.4 2h2.4v4H7.4zM14.2 2h2.4v4h-2.4z" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.8 4.4h18.4V22H2.8V4.4Zm2.5 5.1v10h13.4v-10H5.3Z"
    />
    <path d="M6.9 11.4h3v2.7h-3zM11.9 11.4h3v2.7h-3zM6.9 15.8h3v2.7h-3zM11.9 15.8h3v2.7h-3z" />
  </Svg>
);

export const Document: IconType = (p) => (
  <Svg {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 2h9l7 7v13H4V2Zm3.2 8.6h9.6v2.2H7.2v-2.2Zm0 4.4h9.6v2.2H7.2V15Zm0-8.8h4.3v2.2H7.2V6.2Z"
    />
  </Svg>
);

export const PressePapier: IconType = (p) => (
  <Svg {...p}>
    <path d="M8.6 2h6.8v3.6H8.6z" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.6 4H7v1.6A1.6 1.6 0 0 0 8.6 7.2h6.8A1.6 1.6 0 0 0 17 5.6V4h.4A1.6 1.6 0 0 1 19 5.6v14.8A1.6 1.6 0 0 1 17.4 22H6.6A1.6 1.6 0 0 1 5 20.4V5.6A1.6 1.6 0 0 1 6.6 4Zm1.4 6.5h8v2.2H8v-2.2Zm0 4.4h8v2.2H8v-2.2Zm0 4.4h5v2.2H8v-2.2Z"
    />
  </Svg>
);

export const Carte: IconType = (p) => (
  <Svg {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2 6.6A1.6 1.6 0 0 1 3.6 5h16.8A1.6 1.6 0 0 1 22 6.6V9H2V6.6ZM2 11h20v6.4A1.6 1.6 0 0 1 20.4 19H3.6A1.6 1.6 0 0 1 2 17.4V11Zm3 3h5.2v2.2H5V14Z"
    />
  </Svg>
);

export const Colis: IconType = (p) => (
  <Svg {...p}>
    <path d="M12 2 2 7l10 5 10-5-10-5Z" />
    <path d="M2 9.3v8.2L11 22v-8.2L2 9.3Z" />
    <path d="M13 22l9-4.5V9.3L13 13.8V22Z" />
  </Svg>
);

export const Cookie: IconType = (p) => (
  <Svg {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 1.8a10.2 10.2 0 1 0 0 20.4 10.2 10.2 0 0 0 0-20.4ZM8.8 7a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Zm6.6 1a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6ZM7.9 13.8a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Zm6.6.5a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6Z"
    />
  </Svg>
);

export const Reglages: IconType = (p) => (
  <Svg {...p}>
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
      <path key={a} d="M10.3 0.7h3.4v3.7h-3.4z" transform={`rotate(${a} 12 12)`} />
    ))}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 3.4a8.6 8.6 0 1 0 0 17.2 8.6 8.6 0 0 0 0-17.2Zm0 5.2a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8Z"
    />
  </Svg>
);

export const Visuel: IconType = (p) => (
  <Svg {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.4 4h19.2v16H2.4V4Zm2.5 2.5v11h14.2v-11H4.9Z"
    />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M6 17.5h12l-4.4-5.6-2.6 3.2-1.6-1.8L6 17.5Z" />
  </Svg>
);

export const QrCode: IconType = (p) => (
  <Svg {...p}>
    <path fillRule="evenodd" clipRule="evenodd" d="M2.6 2.6h8.4V11H2.6V2.6Zm2.6 2.6v3.2h3.2V5.2H5.2Z" />
    <path fillRule="evenodd" clipRule="evenodd" d="M13 2.6h8.4V11H13V2.6Zm2.6 2.6v3.2h3.2V5.2h-3.2Z" />
    <path fillRule="evenodd" clipRule="evenodd" d="M2.6 13h8.4v8.4H2.6V13Zm2.6 2.6v3.2h3.2v-3.2H5.2Z" />
    <path d="M13 13h3.6v3.6H13zM17.8 17.8h3.6v3.6h-3.6zM17.8 13h3.6v2.1h-3.6zM13 17.8h2.1v3.6H13z" />
  </Svg>
);
