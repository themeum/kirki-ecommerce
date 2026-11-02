import { useId } from 'react';

import type { IconDimensionProps } from '@/types/components/icon';

const ANIMATION_CSS = `
@keyframes trex-jump{0%,22%,88%,to{transform:translateY(0) scale(1,1)}26%{transform:translateY(0) scale(1.04,.9);animation-timing-function:cubic-bezier(.2,.8,.3,1)}29%{transform:translateY(-4px) scale(.97,1.05);animation-timing-function:cubic-bezier(.2,.8,.3,1)}40%{transform:translateY(-11px) scale(1,1);animation-timing-function:ease-in-out}56%{transform:translateY(-12px) scale(1,1);animation-timing-function:ease-in-out}72%{transform:translateY(-11px) scale(1,1);animation-timing-function:cubic-bezier(.6,0,.9,.5)}81%{transform:translateY(0) scale(.98,1.03)}84%{transform:translateY(0) scale(1.05,.9)}}
@keyframes trex-tilt{0%,44%,50%,64%,to{transform:rotate(0deg)}46.5%{transform:rotate(-5deg)}54%,60%{transform:rotate(5deg)}}
@keyframes trex-h-side{0%,67.5%,to{opacity:1}42.75%{opacity:0}}
@keyframes trex-h-34{0%,44.25%,67.5%,to{opacity:0}42.75%,66%{opacity:1}}
@keyframes trex-h-front{0%,66%,to{opacity:0}44.25%{opacity:1}}
@keyframes trex-lids{0%,59%,to{opacity:0}57.5%{opacity:1}}
@keyframes trex-run-vis{0%,84%,to{opacity:1}27%{opacity:0}}
@keyframes trex-jump-vis{0%,84%,to{opacity:0}27%{opacity:1}}
@keyframes trex-step{0%{opacity:1}50%,to{opacity:0}}
@keyframes trex-gap-vis{0%,80%,to{opacity:0}29%{opacity:1}}
@keyframes trex-scroll{0%{transform:translateX(0)}to{transform:translateX(-68.1279px)}}
.trex-vb{transform-box:view-box}
.trex-body{transform-origin:60px 54px;animation:trex-jump 5s infinite}
.trex-head{transform-origin:65.3px 33px;animation:trex-tilt 5s infinite ease-in-out}
.trex-ground{animation:trex-scroll 1.8s linear infinite}
.trex-gap{animation:trex-gap-vis 5s infinite step-end}
.trex-run{animation:trex-run-vis 5s infinite step-end}
.trex-jumping{animation:trex-jump-vis 5s infinite step-end}
.trex-step-a{animation:trex-step .3s infinite step-end}
.trex-step-b{animation:trex-step .3s infinite step-end reverse}
.trex-h-side{animation:trex-h-side 5s infinite step-end}
.trex-h-34{animation:trex-h-34 5s infinite step-end}
.trex-h-front{animation:trex-h-front 5s infinite step-end}
.trex-lids{animation:trex-lids 5s infinite step-end}
@media (prefers-reduced-motion:reduce){.trex-vb *,.trex-vb{animation:none!important}}
`;

export const ErrorStateIcon = ({ height = 88, width = 88 }: IconDimensionProps) => {
  const id = useId();
  const clipId = `${id}-ground-clip`;
  const pebblesId = `${id}-pebbles`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 88 88"
      fill="none"
      aria-hidden="true"
    >
      <style>{ANIMATION_CSS}</style>
      <defs>
        <clipPath id={clipId}>
          <path d="M19.5 49.6h68.128v5H19.5z" />
        </clipPath>
        <g id={pebblesId} fill="#d40000">
          <path d="M80.93 50.279h2.232v.744H80.93zM44.465 51.023h2.977v.744h-2.977zM70.512 52.512h.744v.744h-.744zM40 53.256h2.977V54H40zM50.419 53.256h1.488V54h-1.488zM75.721 53.256h2.977v.744h-2.977z" />
        </g>
      </defs>
      <path fill="#fff" d="M72 44c0 21.112-6.964 28-28 28s-28-7.312-28-28 7.072-28 28-28 28 6.888 28 28" />
      <path
        stroke="#d40000"
        strokeOpacity=".08"
        strokeWidth="1.611"
        d="M44 16.806c10.421 0 17.136 1.725 21.28 5.848S71.194 33.49 71.194 44c0 10.514-1.745 17.225-5.875 21.347S54.476 71.194 44 71.194c-10.466 0-17.183-1.828-21.316-6.003-4.136-4.176-5.878-10.894-5.878-21.191 0-10.294 1.768-17.013 5.918-21.19 4.148-4.177 10.865-6.004 21.276-6.004Z"
      />
      <path
        fill="#d40000"
        fillOpacity=".08"
        d="M68.8 44c0 18.698-6.17 24.8-24.8 24.8-18.632 0-24.8-6.477-24.8-24.8 0-18.325 6.263-24.8 24.8-24.8 18.535 0 24.8 6.1 24.8 24.8"
      />
      <g fill="#d40000">
        <path d="m19.5 48.256 32.407-.21v.745L19.5 49zM66.791 48.047h20.837v.744H66.791z" />
        <path className="trex-gap" d="M51.8 48.047h15.1v.744H51.8z" />
      </g>
      <g clipPath={`url(#${clipId})`} className="trex-ground">
        <use href={`#${pebblesId}`} />
        <use x="68.128" href={`#${pebblesId}`} />
      </g>
      <g fill="#d40000" className="trex-vb trex-body">
        <path
          fillRule="evenodd"
          d="M62.326 31h5.953v5.14h2.977v2.976h-1.489v-1.488H68.28v5.21h-1.488v2.232h-1.489v1.488h-1.488v2.977h-2.977v-1.488H59.35v1.488h-4.465v-1.488h-1.489v-1.489h-1.488V45.07h-1.488V43.58H48.93v-1.488h-1.488v-8.93h1.488v2.977h1.489v1.488h1.488v1.488h2.977v-1.488h1.488v-1.489h2.233v-1.488h2.232v-1.488h1.488Z"
        />
        <g className="trex-run">
          <g className="trex-step-a">
            <path d="M54.884 49.4h2.977v1.623h-2.977zM62.325 49.4h1.488V54h-1.488zM63.814 52.512h1.488V54h-1.488z" />
          </g>
          <g className="trex-step-b">
            <path d="M54.884 49.4h1.488V54h-1.488zM56.372 49.4h1.488v1.623h-1.488zM56.372 52.512h1.488V54h-1.488zM62.325 49.4h2.977v1.623h-2.977z" />
          </g>
        </g>
        <g className="trex-jumping">
          <path d="M54.884 49.4h1.488V54h-1.488zM56.372 49.4h1.488v1.623h-1.488zM56.372 52.512h1.488V54h-1.488zM62.325 49.4h1.488V54h-1.488zM63.814 52.512h1.488V54h-1.488z" />
        </g>
        <g className="trex-vb trex-head">
          <path
            className="trex-h-side"
            fillRule="evenodd"
            d="M63.814 22H75.72v1.488h1.488v6.698h-7.442v1.488h4.466v1.489H62.325v-9.675h1.489zm1.488 2.233h1.489v1.488h-1.489z"
          />
          <path
            className="trex-h-34"
            fillRule="evenodd"
            d="M62.326 22h10.418v1.488h1.489v6.698h-5.954v1.488h2.977v1.489h-8.93v-1.489h-1.489v-8.186h1.489zm0 2.233h1.488v1.488h-1.488zm7.441 0h.745v1.488h-.745zm1.86 2.976h.745v.744h-.744zm-9.301 2.977h5.953v.744h-5.953z"
          />
          <path
            className="trex-h-front"
            fillRule="evenodd"
            d="M60.837 22h8.93v1.488h1.489v8.186h-1.489v1.489h-8.93v-1.489H59.35v-8.186h1.488zm0 2.233h1.489v1.488h-1.489zm7.442 0h1.489v1.488h-1.489zm-4.465 3.72h.744v.745h-.744zm2.232 0h.745v.745h-.744zm-5.209 2.233h8.93v.744h-8.93zm0-.744h.744v.744h-.744zm8.186 0h.744v.744h-.744z"
          />
          <g className="trex-lids">
            <path d="M60.837 24.233h1.488v1.488h-1.488zM68.279 24.233h1.488v1.488h-1.488z" />
          </g>
        </g>
      </g>
    </svg>
  );
};
