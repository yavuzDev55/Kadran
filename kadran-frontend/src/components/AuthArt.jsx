// Line-art desk scene for the sign-in / register pages. Ported from the Design Tools reference
// (authSVG); its CSS variables are mapped to the app's tokens so it follows the light/dark theme.
const PAPER = { fill: "rgb(var(--color-surface))" };
const COURSE = { fill: "rgb(var(--color-course))" };
const EXAM = { fill: "rgb(var(--color-exam))" };
const HOMEWORK = { fill: "rgb(var(--color-homework))" };
const CUSTOM = { fill: "rgb(var(--color-custom))" };

export default function AuthArt() {
  return (
    <svg viewBox="0 0 520 660" preserveAspectRatio="xMidYMax meet" style={{ overflow: "visible" }} aria-hidden="true" focusable="false">
      <defs>
        <pattern id="art-a" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="1" opacity=".25" />
        </pattern>
        <pattern id="art-b" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r=".8" fill="currentColor" opacity=".35" />
        </pattern>
        <pattern id="art-c" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 6V0h6" stroke="currentColor" fill="none" opacity=".25" />
        </pattern>
      </defs>
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity=".62">
        <path d="M52 66h250v212H52z" style={PAPER} />
        <path d="M52 66h250v38H52z" fill="url(#art-a)" />
        <path d="M100 56v20M150 56v20M200 56v20M250 56v20" />
        <path d="M52 104h250" />
        <g opacity=".5"><path d="M52 138h250M52 172h250M52 206h250M52 240h250M110 104v174M169 104v174M228 104v174" /></g>
        <rect x="53" y="139" width="56" height="32" style={COURSE} opacity=".4" />
        <rect x="53" y="139" width="56" height="32" fill="url(#art-a)" />
        <rect x="170" y="173" width="57" height="32" style={EXAM} opacity=".4" />
        <rect x="170" y="173" width="57" height="32" fill="url(#art-b)" />
        <rect x="229" y="207" width="72" height="32" style={HOMEWORK} opacity=".4" />
        <path d="M231 238h68" strokeWidth="2" />
        <rect x="111" y="207" width="57" height="32" style={CUSTOM} opacity=".4" />
        <rect x="111" y="207" width="57" height="32" fill="url(#art-c)" />
        <circle cx="140" cy="155" r="11" strokeWidth="1.6" />
        <circle cx="410" cy="132" r="62" />
        <circle cx="410" cy="132" r="53" opacity=".55" />
        <circle cx="410" cy="132" r="58" fill="url(#art-b)" stroke="none" opacity=".6" />
        <path d="M410 84v8M458 132h-8M410 180v-8M362 132h8" />
        <path d="M410 132V104M410 132l22 13" strokeWidth="2" />
        <circle cx="410" cy="132" r="3" />
        <path d="M372 236l62-6 6 64-62 6z" fill="url(#art-a)" opacity=".8" />
        <path d="M372 236l62-6 6 64-62 6z" style={PAPER} opacity=".5" />
        <path d="M386 258l36-3M388 272l30-3M390 286l22-2" opacity=".7" />
        <circle cx="404" cy="236" r="3" />
        <path d="M-600 520h1720" strokeWidth="1.6" />
        <path d="M-600 560h1720" opacity=".5" />
        <rect x="-600" y="520" width="1720" height="400" fill="url(#art-b)" stroke="none" opacity=".6" />
        <path d="M150 520l12-34h86l-12 34z" style={PAPER} />
        <path d="M236 520l12-34h86l-12 34z" style={PAPER} />
        <path d="M236 520l12-34" />
        <path d="M178 502h50M172 511h50M262 502h50M256 511h50" opacity=".6" />
        <path d="M130 508l86-22" />
        <path d="M216 486l6-2" />
        <rect x="360" y="486" width="110" height="34" rx="2" style={PAPER} />
        <path d="M376 486v34M382 486v34" opacity=".7" />
        <rect x="368" y="452" width="94" height="34" rx="2" fill="url(#art-a)" />
        <path d="M382 452v34" opacity=".7" />
        <rect x="374" y="424" width="80" height="28" rx="2" style={PAPER} />
        <path d="M388 424v28M394 424v28" opacity=".7" />
        <ellipse cx="76" cy="514" rx="30" ry="6" style={PAPER} />
        <path d="M76 508V420l52-62" />
        <circle cx="76" cy="420" r="3" />
        <circle cx="128" cy="358" r="3" />
        <g transform="rotate(34 150 336)">
          <path d="M118 322h64l14 36h-92z" fill="url(#art-a)" />
          <path d="M118 322h64l14 36h-92z" />
        </g>
        <path d="M300 520v-48h38v48" fill="url(#art-b)" />
        <path d="M300 480h38" opacity=".6" />
        <path d="M309 472l-8-38M318 472l1-42M328 472l10-34" />
      </g>
    </svg>
  );
}
