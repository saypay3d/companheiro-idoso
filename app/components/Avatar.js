'use client';

const BORDA = {
  ouvindo:  '#2ecc71',
  pensando: '#9b59b6',
  falando:  '#3498db',
  dormindo: '#7f8c8d',
  iniciando:'#444',
};

/* ─── VOVOZINHA ─── */
function VovoSVG({ estado }) {
  const dormindo = estado === 'dormindo';
  const pensando = estado === 'pensando';
  const falando  = estado === 'falando';
  const pyOff    = pensando ? -6 : 0;

  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
      style={{ display:'block', width:'100%', height:'100%', borderRadius:'50%' }}>

      {/* Cabelo grisalho */}
      <ellipse cx="100" cy="112" rx="80" ry="80" fill="#FFE4C4" />
      <ellipse cx="100" cy="38"  rx="40" ry="32" fill="#CACACA" />
      <ellipse cx="100" cy="42"  rx="28" ry="22" fill="#DCDCDC" />
      <ellipse cx="28"  cy="92"  rx="22" ry="42" fill="#CACACA" />
      <ellipse cx="172" cy="92"  rx="22" ry="42" fill="#CACACA" />
      {/* Laçinho no coque */}
      <ellipse cx="86"  cy="22"  rx="10" ry="7"  fill="#E87070" />
      <ellipse cx="114" cy="22"  rx="10" ry="7"  fill="#E87070" />
      <circle  cx="100" cy="22"  r="5"            fill="#C04040" />

      {/* Bochechas */}
      <ellipse cx="46"  cy="130" rx="22" ry="13" fill="#F08080" opacity=".32" />
      <ellipse cx="154" cy="130" rx="22" ry="13" fill="#F08080" opacity=".32" />

      {/* Sobrancelhas */}
      {!dormindo && (
        <>
          <path d={pensando ? 'M58,82 Q76,74 88,80' : 'M60,86 Q76,79 88,84'}
            stroke="#B0A0A0" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d={pensando ? 'M112,80 Q124,74 142,82' : 'M112,84 Q124,79 140,86'}
            stroke="#B0A0A0" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* Armação dos óculos */}
      <ellipse cx="76"  cy="104" rx="22" ry="17" fill="rgba(255,240,200,.25)" stroke="#8B7355" strokeWidth="2.5" />
      <ellipse cx="124" cy="104" rx="22" ry="17" fill="rgba(255,240,200,.25)" stroke="#8B7355" strokeWidth="2.5" />
      <line x1="98" y1="104" x2="102" y2="104" stroke="#8B7355" strokeWidth="2" />
      <line x1="27"  y1="98"  x2="54"  y2="102" stroke="#8B7355" strokeWidth="2" />
      <line x1="173" y1="98"  x2="146" y2="102" stroke="#8B7355" strokeWidth="2" />

      {/* Olhos */}
      {dormindo ? (
        <>
          <path d="M60,104 Q76,114 92,104"  stroke="#9A7070" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M108,104 Q124,114 140,104" stroke="#9A7070" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="76"  cy="104" rx="12" ry="14" fill="white" />
          <g className={pensando ? 'av-pupila-cima' : 'av-pupila-mov'}>
            <circle cx="76"  cy={104+pyOff} r="7"   fill="#3D2B1F" />
            <circle cx="78"  cy={102+pyOff} r="2.5" fill="white" />
          </g>
          <ellipse cx="76"  cy="104" rx="12.5" ry="14.5" fill="#FFE4C4" className="av-palpebra" />

          <ellipse cx="124" cy="104" rx="12" ry="14" fill="white" />
          <g className={pensando ? 'av-pupila-cima' : 'av-pupila-mov'} style={{animationDelay:'.1s'}}>
            <circle cx="124" cy={104+pyOff} r="7"   fill="#3D2B1F" />
            <circle cx="126" cy={102+pyOff} r="2.5" fill="white" />
          </g>
          <ellipse cx="124" cy="104" rx="12.5" ry="14.5" fill="#FFE4C4" className="av-palpebra av-palpebra-r" />

          {/* Ruguinhas gentis */}
          <path d="M90,93 L94,89" stroke="#DDA0A0" strokeWidth="1" opacity=".4" strokeLinecap="round" />
          <path d="M110,89 L114,93" stroke="#DDA0A0" strokeWidth="1" opacity=".4" strokeLinecap="round" />
        </>
      )}

      {/* Nariz */}
      <ellipse cx="100" cy="124" rx="5" ry="3.5" fill="#D4956D" opacity=".3" />

      {/* Boca */}
      {falando  && <ellipse cx="100" cy="142" rx="17" ry="9" fill="#C06060" className="av-boca-fala" />}
      {dormindo && <ellipse cx="100" cy="142" rx="9"  ry="5" fill="#C06060" opacity=".5" />}
      {pensando && <path d="M86,142 Q100,145 114,142" stroke="#C06060" strokeWidth="3" fill="none" strokeLinecap="round" />}
      {!falando && !dormindo && !pensando && (
        <path d="M80,139 Q100,156 120,139" stroke="#C06060" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      )}

      {/* Bolinhas pensamento */}
      {pensando && <>
        <circle cx="130" cy="76" r="4"   fill="#9b59b6" className="av-dot-1" />
        <circle cx="143" cy="63" r="5.5" fill="#9b59b6" className="av-dot-2" />
        <circle cx="158" cy="48" r="7"   fill="#9b59b6" className="av-dot-3" />
      </>}

      {/* ZZZ */}
      {dormindo && <g fontFamily="system-ui,sans-serif" fontWeight="bold">
        <text x="150" y="78"  fontSize="13" fill="#9f8f8f" className="av-z1">Z</text>
        <text x="162" y="62"  fontSize="17" fill="#9f8f8f" className="av-z2">Z</text>
        <text x="176" y="44"  fontSize="21" fill="#9f8f8f" className="av-z3">Z</text>
      </g>}
    </svg>
  );
}

/* ─── GATINHO ─── */
function GatoSVG({ estado }) {
  const dormindo = estado === 'dormindo';
  const pensando = estado === 'pensando';
  const falando  = estado === 'falando';
  const pyOff    = pensando ? -5 : 0;

  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
      style={{ display:'block', width:'100%', height:'100%', borderRadius:'50%' }}>

      {/* Orelhas */}
      <polygon points="30,82 55,26 82,74" fill="#FFD4B8" />
      <polygon points="118,74 145,26 170,82" fill="#FFD4B8" />
      <polygon points="38,76 55,36 74,70"  fill="#FFB5A0" />
      <polygon points="126,70 145,36 162,76" fill="#FFB5A0" />

      {/* Rosto */}
      <circle cx="100" cy="116" r="78" fill="#FFF8F0" />

      {/* Manchas de bochecha */}
      <ellipse cx="50"  cy="132" rx="24" ry="14" fill="#FFD0C8" opacity=".5" />
      <ellipse cx="150" cy="132" rx="24" ry="14" fill="#FFD0C8" opacity=".5" />

      {/* Sobrancelhas */}
      {!dormindo && (
        <>
          <path d={pensando ? 'M50,89 Q68,81 84,87' : 'M52,93 Q68,86 84,91'}
            stroke="#C8A080" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d={pensando ? 'M116,87 Q132,81 150,89' : 'M116,91 Q132,86 148,93'}
            stroke="#C8A080" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* Olhos grandes */}
      {dormindo ? (
        <>
          <path d="M48,108 Q70,122 92,108"   stroke="#C8A080" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M108,108 Q130,122 152,108" stroke="#C8A080" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          {/* Olho esquerdo */}
          <ellipse cx="70"  cy="108" rx="23" ry="25" fill="white" />
          <g className={pensando ? 'av-pupila-cima' : 'av-pupila-mov'}>
            <circle cx="70"  cy={110+pyOff} r="15" fill="#3AA351" />
            <circle cx="70"  cy={110+pyOff} r="8"  fill="#1a1a1a" />
            <circle cx="77"  cy={104+pyOff} r="5"  fill="white" />
            <circle cx="66"  cy={116+pyOff} r="2.5" fill="white" opacity=".55" />
          </g>
          <ellipse cx="70"  cy="108" rx="23.5" ry="25.5" fill="#FFF8F0" className="av-palpebra" />

          {/* Olho direito */}
          <ellipse cx="130" cy="108" rx="23" ry="25" fill="white" />
          <g className={pensando ? 'av-pupila-cima' : 'av-pupila-mov'} style={{animationDelay:'.1s'}}>
            <circle cx="130" cy={110+pyOff} r="15" fill="#3AA351" />
            <circle cx="130" cy={110+pyOff} r="8"  fill="#1a1a1a" />
            <circle cx="137" cy={104+pyOff} r="5"  fill="white" />
            <circle cx="126" cy={116+pyOff} r="2.5" fill="white" opacity=".55" />
          </g>
          <ellipse cx="130" cy="108" rx="23.5" ry="25.5" fill="#FFF8F0" className="av-palpebra av-palpebra-r" />
        </>
      )}

      {/* Nariz */}
      <polygon points="100,132 93,142 107,142" fill="#FFB5A0" />

      {/* Bigodes */}
      {[[-1,1],[-1,0],[-1,-1],[1,1],[1,0],[1,-1]].map(([side, row], i) => {
        const x1 = 100 + side * 6;
        const x2 = 100 + side * 44;
        const y  = 140 + row * 8;
        return <line key={i} x1={x1} y1={y} x2={x2} y2={y + row * 2} stroke="#D0B090" strokeWidth="1.5" opacity=".65" />;
      })}

      {/* Boca */}
      {falando  && <ellipse cx="100" cy="154" rx="16" ry="8" fill="#FF9999" className="av-boca-fala" />}
      {dormindo && <ellipse cx="100" cy="154" rx="8"  ry="5" fill="#FF9999" opacity=".5" />}
      {pensando && <path d="M88,152 Q100,155 112,152" stroke="#FF9999" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
      {!falando && !dormindo && !pensando && (
        <path d="M88,150 Q94,157 100,150 Q106,157 112,150" stroke="#FF9999" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}

      {/* Bolinhas pensamento */}
      {pensando && <>
        <circle cx="130" cy="84" r="4"   fill="#9b59b6" className="av-dot-1" />
        <circle cx="143" cy="71" r="5.5" fill="#9b59b6" className="av-dot-2" />
        <circle cx="158" cy="56" r="7"   fill="#9b59b6" className="av-dot-3" />
      </>}

      {/* ZZZ */}
      {dormindo && <g fontFamily="system-ui,sans-serif" fontWeight="bold">
        <text x="152" y="84"  fontSize="13" fill="#9f8f8f" className="av-z1">Z</text>
        <text x="163" y="68"  fontSize="17" fill="#9f8f8f" className="av-z2">Z</text>
        <text x="177" y="50"  fontSize="21" fill="#9f8f8f" className="av-z3">Z</text>
      </g>}
    </svg>
  );
}

/* ─── ROBÔ ─── */
function RoboSVG({ estado }) {
  const dormindo = estado === 'dormindo';
  const pensando = estado === 'pensando';
  const falando  = estado === 'falando';
  const pyOff    = pensando ? -5 : 0;

  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
      style={{ display:'block', width:'100%', height:'100%', borderRadius:'50%' }}>
      <defs>
        <linearGradient id="gRobo" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#7AAFD4" />
          <stop offset="100%" stopColor="#2C5F8A" />
        </linearGradient>
        <radialGradient id="gOlho" cx="33%" cy="28%" r="65%">
          <stop offset="0%"   stopColor="#80DDFF" />
          <stop offset="100%" stopColor="#0070AA" />
        </radialGradient>
      </defs>

      {/* Antena */}
      <line x1="100" y1="28" x2="100" y2="7" stroke="#5A8AB0" strokeWidth="4" strokeLinecap="round" />
      <circle cx="100" cy="5"  r="8" fill="#FFD700" />
      <circle cx="100" cy="5"  r="4" fill="#FFF0A0" />

      {/* Parafusos laterais */}
      <circle cx="22"  cy="112" r="14" fill="#3A6FA5" />
      <circle cx="22"  cy="112" r="7"  fill="#2C5F8A" />
      <circle cx="178" cy="112" r="14" fill="#3A6FA5" />
      <circle cx="178" cy="112" r="7"  fill="#2C5F8A" />

      {/* Cabeça */}
      <rect x="28" y="26" width="144" height="154" rx="36" fill="url(#gRobo)" />

      {/* Sobrancelhas LED */}
      {!dormindo && (
        <>
          <path d={pensando ? 'M44,70 Q66,60 88,66' : 'M46,73 Q66,66 86,72'}
            stroke="#00DDFF" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity=".85" />
          <path d={pensando ? 'M112,66 Q134,60 156,70' : 'M114,72 Q134,66 154,73'}
            stroke="#00DDFF" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity=".85" />
        </>
      )}

      {/* Telas dos olhos */}
      <rect x="42" y="76" width="50" height="50" rx="13" fill="#0A1E30" />
      <rect x="108" y="76" width="50" height="50" rx="13" fill="#0A1E30" />

      {/* Olhos */}
      {dormindo ? (
        <>
          <rect x="50"  y="97" width="34" height="7" rx="3.5" fill="#1A3A5C" />
          <rect x="116" y="97" width="34" height="7" rx="3.5" fill="#1A3A5C" />
        </>
      ) : (
        <>
          {/* Olho esquerdo */}
          <g className={pensando ? 'av-pupila-cima' : 'av-pupila-mov'}>
            <circle cx="67"  cy={101+pyOff} r="18" fill="url(#gOlho)" />
            <circle cx="67"  cy={101+pyOff} r="9"  fill="#003050" />
            <circle cx="74"  cy={ 95+pyOff} r="5"  fill="white" opacity=".9" />
            <circle cx="63"  cy={108+pyOff} r="2.5" fill="white" opacity=".4" />
          </g>
          {/* Pálpebra = shutter metálico */}
          <rect x="42" y="76" width="50" height="50" rx="13" fill="#4A7FBD" className="av-palpebra" />

          {/* Olho direito */}
          <g className={pensando ? 'av-pupila-cima' : 'av-pupila-mov'} style={{animationDelay:'.1s'}}>
            <circle cx="133" cy={101+pyOff} r="18" fill="url(#gOlho)" />
            <circle cx="133" cy={101+pyOff} r="9"  fill="#003050" />
            <circle cx="140" cy={ 95+pyOff} r="5"  fill="white" opacity=".9" />
            <circle cx="129" cy={108+pyOff} r="2.5" fill="white" opacity=".4" />
          </g>
          <rect x="108" y="76" width="50" height="50" rx="13" fill="#4A7FBD" className="av-palpebra av-palpebra-r" />
        </>
      )}

      {/* Painel da boca */}
      <rect x="55" y="146" width="90" height="26" rx="10" fill="#0A1E30" />

      {/* Boca */}
      {falando  && <ellipse cx="100" cy="159" rx="36" ry="10" fill="#00AAFF" opacity=".85" className="av-boca-fala" />}
      {dormindo && <rect x="68" y="155" width="64" height="5" rx="2.5" fill="#1A3A5C" />}
      {pensando && <path d="M66,159 Q100,164 134,159" stroke="#00DDFF" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".8" />}
      {!falando && !dormindo && !pensando && (
        <path d="M62,159 Q100,174 138,159" stroke="#00DDFF" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".85" />
      )}

      {/* Bolinhas pensamento */}
      {pensando && <>
        <circle cx="130" cy="68" r="4"   fill="#00DDFF" opacity=".8" className="av-dot-1" />
        <circle cx="143" cy="54" r="5.5" fill="#00DDFF" opacity=".8" className="av-dot-2" />
        <circle cx="158" cy="38" r="7"   fill="#00DDFF" opacity=".8" className="av-dot-3" />
      </>}

      {/* ZZZ */}
      {dormindo && <g fontFamily="system-ui,sans-serif" fontWeight="bold">
        <text x="150" y="76"  fontSize="13" fill="#5A8AB0" className="av-z1">Z</text>
        <text x="162" y="60"  fontSize="17" fill="#5A8AB0" className="av-z2">Z</text>
        <text x="176" y="42"  fontSize="21" fill="#5A8AB0" className="av-z3">Z</text>
      </g>}
    </svg>
  );
}

/* ─── COMPONENTE PRINCIPAL ─── */
export default function Avatar({ estado = 'iniciando', tipo = 'vovo' }) {
  const dormindo = estado === 'dormindo';
  const borda    = BORDA[estado] ?? '#444';
  const pulso    = estado === 'ouvindo' ? 'av-pulso-verde'
                 : estado === 'falando' ? 'av-pulso-azul' : '';
  const Comp     = tipo === 'gato' ? GatoSVG : tipo === 'robo' ? RoboSVG : VovoSVG;

  return (
    <>
      <style>{`
        @keyframes av-piscar {
          0%,88%,100% { transform:scaleY(0); }
          93%,97%     { transform:scaleY(1); }
        }
        @keyframes av-pupila {
          0%,100% { transform:translate(0px,0px);  }
          25%     { transform:translate(-4px,1px); }
          60%     { transform:translate(5px,-1px); }
          82%     { transform:translate(-2px,0px); }
        }
        @keyframes av-pupila-cima {
          0%,100% { transform:translateY(-5px); }
          50%     { transform:translateY(-7px); }
        }
        @keyframes av-boca-fala {
          0%,100% { transform:scaleY(0.1); }
          50%     { transform:scaleY(1);   }
        }
        @keyframes av-dot {
          0%,100% { transform:translateY(0);    opacity:.4; }
          50%     { transform:translateY(-10px); opacity:1;  }
        }
        @keyframes av-zzz {
          0%   { opacity:0; transform:translate(0,0)      scale(.6);  }
          35%  { opacity:1;                                             }
          100% { opacity:0; transform:translate(18px,-34px) scale(1.3); }
        }
        @keyframes av-pulso-verde {
          0%,100% { box-shadow:0 0 0  0 rgba(46,204,113,.7),0 0 0  0 rgba(46,204,113,.25); }
          55%     { box-shadow:0 0 0 22px rgba(46,204,113,0),0 0 0 44px rgba(46,204,113,0);  }
        }
        @keyframes av-pulso-azul {
          0%,100% { box-shadow:0 0 0  0 rgba(52,152,219,.7); }
          55%     { box-shadow:0 0 0 22px rgba(52,152,219,0); }
        }
        @keyframes av-respirar {
          0%,100% { transform:scale(1);    }
          50%     { transform:scale(1.018); }
        }
        .av-palpebra    { transform-box:fill-box; transform-origin:center top;
                          animation:av-piscar 4s ease-in-out infinite; }
        .av-palpebra-r  { animation-delay:.07s; }
        .av-pupila-mov  { transform-box:fill-box; transform-origin:center center;
                          animation:av-pupila 7s ease-in-out infinite; }
        .av-pupila-cima { transform-box:fill-box; transform-origin:center center;
                          animation:av-pupila-cima 3s ease-in-out infinite; }
        .av-boca-fala   { transform-box:fill-box; transform-origin:center top;
                          animation:av-boca-fala .38s ease-in-out infinite; }
        .av-dot-1 { animation:av-dot .9s ease-in-out 0s    infinite; }
        .av-dot-2 { animation:av-dot .9s ease-in-out .18s  infinite; }
        .av-dot-3 { animation:av-dot .9s ease-in-out .36s  infinite; }
        .av-z1    { animation:av-zzz 2.8s ease-out 0s   infinite; }
        .av-z2    { animation:av-zzz 2.8s ease-out 1s   infinite; }
        .av-z3    { animation:av-zzz 2.8s ease-out 1.9s infinite; }
        .av-pulso-verde { animation:av-pulso-verde 2.2s ease-in-out infinite; }
        .av-pulso-azul  { animation:av-pulso-azul   .7s ease-in-out infinite; }
        .av-respirar    { animation:av-respirar      4s ease-in-out infinite; }
        .av-wrap        { transition:border-color .5s ease; }
      `}</style>

      <div
        className={`av-wrap ${pulso} ${dormindo ? 'av-respirar' : ''}`}
        style={{
          width:'100%', height:'100%',
          borderRadius:'50%',
          border:`7px solid ${borda}`,
          boxSizing:'border-box',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}
      >
        <Comp estado={estado} />
      </div>
    </>
  );
}
