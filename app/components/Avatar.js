'use client';

const BORDA = {
  ouvindo:  '#2ecc71',
  pensando: '#9b59b6',
  falando:  '#3498db',
  dormindo: '#7f8c8d',
  iniciando:'#444',
};

export default function Avatar({ estado = 'iniciando' }) {
  const dormindo = estado === 'dormindo';
  const pensando = estado === 'pensando';
  const falando  = estado === 'falando';
  const borda    = BORDA[estado] ?? '#444';
  const pyOff    = pensando ? -5 : 0;

  const pulso = estado === 'ouvindo'  ? 'av-pulso-verde'
              : estado === 'falando'  ? 'av-pulso-azul'
              : '';

  return (
    <>
      <style>{`
        @keyframes av-piscar {
          0%,88%,100% { transform: scaleY(0); }
          93%,97%     { transform: scaleY(1); }
        }
        @keyframes av-pupila {
          0%,100% { transform: translate(0px,0px);   }
          25%     { transform: translate(-4px,1px);  }
          60%     { transform: translate(5px,-1px);  }
          82%     { transform: translate(-2px,0px);  }
        }
        @keyframes av-pupila-cima {
          0%,100% { transform: translateY(-5px); }
          50%     { transform: translateY(-7px); }
        }
        @keyframes av-boca-fala {
          0%,100% { transform: scaleY(0.12); }
          50%     { transform: scaleY(1);    }
        }
        @keyframes av-dot {
          0%,100% { transform: translateY(0);    opacity:.4; }
          50%     { transform: translateY(-10px); opacity:1;  }
        }
        @keyframes av-zzz {
          0%   { opacity:0; transform:translate(0,0)   scale(0.6); }
          35%  { opacity:1;                                          }
          100% { opacity:0; transform:translate(18px,-34px) scale(1.3); }
        }
        @keyframes av-pulso-verde {
          0%,100% { box-shadow:0 0 0  0 rgba(46,204,113,.7),0 0 0  0 rgba(46,204,113,.25); }
          55%     { box-shadow:0 0 0 22px rgba(46,204,113,0),0 0 0 44px rgba(46,204,113,0); }
        }
        @keyframes av-pulso-azul {
          0%,100% { box-shadow:0 0 0  0 rgba(52,152,219,.7); }
          55%     { box-shadow:0 0 0 22px rgba(52,152,219,0); }
        }
        @keyframes av-respirar {
          0%,100% { transform:scale(1);     }
          50%     { transform:scale(1.018); }
        }

        .av-palpebra   { transform-box:fill-box; transform-origin:center top;
                         animation:av-piscar 4s ease-in-out infinite; }
        .av-palpebra-r { animation-delay:.07s; }

        .av-pupila-mov  { transform-box:fill-box; transform-origin:center center;
                          animation:av-pupila 7s ease-in-out infinite; }
        .av-pupila-cima { transform-box:fill-box; transform-origin:center center;
                          animation:av-pupila-cima 3s ease-in-out infinite; }

        .av-boca-fala   { transform-box:fill-box; transform-origin:center top;
                          animation:av-boca-fala .38s ease-in-out infinite; }

        .av-dot-1 { animation:av-dot .9s ease-in-out 0s    infinite; }
        .av-dot-2 { animation:av-dot .9s ease-in-out .18s  infinite; }
        .av-dot-3 { animation:av-dot .9s ease-in-out .36s  infinite; }

        .av-z1 { animation:av-zzz 2.8s ease-out 0s   infinite; }
        .av-z2 { animation:av-zzz 2.8s ease-out 1s   infinite; }
        .av-z3 { animation:av-zzz 2.8s ease-out 1.9s infinite; }

        .av-pulso-verde { animation:av-pulso-verde 2.2s ease-in-out infinite; }
        .av-pulso-azul  { animation:av-pulso-azul   .7s ease-in-out infinite; }
        .av-respirar    { animation:av-respirar      4s ease-in-out infinite; }
        .av-wrap        { transition:border-color .5s ease; }
      `}</style>

      <div
        className={`av-wrap ${pulso} ${dormindo ? 'av-respirar' : ''}`}
        style={{
          width: '100%', height: '100%',
          borderRadius: '50%',
          border: `7px solid ${borda}`,
          boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', width: '100%', height: '100%', borderRadius: '50%' }}
        >
          <defs>
            <radialGradient id="gFace" cx="38%" cy="32%" r="65%">
              <stop offset="0%"   stopColor="#FFF4E0" stopOpacity=".7" />
              <stop offset="100%" stopColor="#E8A070" stopOpacity=".35" />
            </radialGradient>
          </defs>

          {/* Rosto */}
          <circle cx="100" cy="100" r="96" fill="#FDDBB4" />
          <circle cx="100" cy="100" r="96" fill="url(#gFace)" />

          {/* Cabelo */}
          <ellipse cx="100" cy="11"  rx="64" ry="26" fill="#8B6010" />
          <ellipse cx="34"  cy="52"  rx="20" ry="42" fill="#8B6010" />
          <ellipse cx="166" cy="52"  rx="20" ry="42" fill="#8B6010" />

          {/* Bochechas rosadas */}
          <ellipse cx="50"  cy="128" rx="23" ry="14" fill="#F08080" opacity=".35" />
          <ellipse cx="150" cy="128" rx="23" ry="14" fill="#F08080" opacity=".35" />

          {/* Sobrancelhas */}
          {dormindo ? (
            <>
              <path d="M53,74 Q68,70 82,73"   stroke="#7A5C2E" strokeWidth="3"   fill="none" strokeLinecap="round" />
              <path d="M118,73 Q132,70 147,74" stroke="#7A5C2E" strokeWidth="3"   fill="none" strokeLinecap="round" />
            </>
          ) : pensando ? (
            <>
              <path d="M52,66 Q68,58 82,64"   stroke="#7A5C2E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M118,70 Q132,63 147,70" stroke="#7A5C2E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M53,70 Q68,63 82,68"   stroke="#7A5C2E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M118,68 Q132,63 147,70" stroke="#7A5C2E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </>
          )}

          {/* Olhos */}
          {dormindo ? (
            <>
              <path d="M53,90 Q68,102 83,90"   stroke="#7A5C2E" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M117,90 Q132,102 147,90" stroke="#7A5C2E" strokeWidth="4" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Olho esquerdo */}
              <ellipse cx="68"  cy="90" rx="15"   ry="18"   fill="white" />
              <g className={pensando ? 'av-pupila-cima' : 'av-pupila-mov'}>
                <circle cx="68"  cy={90 + pyOff} r="9"   fill="#2C1A0E" />
                <circle cx="71"  cy={87 + pyOff} r="3.5" fill="white"   />
              </g>
              <ellipse cx="68"  cy="90" rx="15.5" ry="18.5" fill="#FDDBB4" className="av-palpebra" />

              {/* Olho direito */}
              <ellipse cx="132" cy="90" rx="15"   ry="18"   fill="white" />
              <g className={pensando ? 'av-pupila-cima' : 'av-pupila-mov'} style={{ animationDelay: '.1s' }}>
                <circle cx="132" cy={90 + pyOff} r="9"   fill="#2C1A0E" />
                <circle cx="135" cy={87 + pyOff} r="3.5" fill="white"   />
              </g>
              <ellipse cx="132" cy="90" rx="15.5" ry="18.5" fill="#FDDBB4" className="av-palpebra av-palpebra-r" />
            </>
          )}

          {/* Nariz */}
          <path d="M95,112 Q100,120 105,112" stroke="#D08060" strokeWidth="1.8" fill="none" opacity=".5" strokeLinecap="round" />

          {/* Boca */}
          {falando  && <ellipse cx="100" cy="142" rx="20" ry="9"  fill="#C06060" className="av-boca-fala" />}
          {dormindo && <ellipse cx="100" cy="142" rx="9"  ry="6"  fill="#C06060" opacity=".55" />}
          {pensando && <path d="M85,142 Q100,145 115,142" stroke="#C06060" strokeWidth="3" fill="none" strokeLinecap="round" />}
          {!falando && !dormindo && !pensando && (
            <path d="M78,138 Q100,157 122,138" stroke="#C06060" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          )}

          {/* Bolinhas de pensamento */}
          {pensando && (
            <>
              <circle cx="124" cy="70" r="5"   fill="#9b59b6" className="av-dot-1" />
              <circle cx="137" cy="57" r="6.5" fill="#9b59b6" className="av-dot-2" />
              <circle cx="152" cy="42" r="8"   fill="#9b59b6" className="av-dot-3" />
            </>
          )}

          {/* ZZZ */}
          {dormindo && (
            <g fontFamily="system-ui,sans-serif" fontWeight="bold">
              <text x="148" y="78"  fontSize="14" fill="#7f8c8d" className="av-z1">Z</text>
              <text x="160" y="62"  fontSize="18" fill="#7f8c8d" className="av-z2">Z</text>
              <text x="174" y="44"  fontSize="22" fill="#7f8c8d" className="av-z3">Z</text>
            </g>
          )}
        </svg>
      </div>
    </>
  );
}
