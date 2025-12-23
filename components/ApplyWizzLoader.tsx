// // components/ApplyWizzLoader.tsx
// "use client";
// import * as React from "react";

// type Props = {
//   size?: number;          // pixel size (width = height)
//   background?: boolean;   // set true for a white square bg
//   label?: string;
// };

// export default function ApplyWizzLoader({
//   size = 96,
//   background = false,
//   label = "ApplyWizz LinkedIn Optimisation loading animation",
// }: Props) {
//   return (
//     <svg
//       width={size}
//       height={size}
//       viewBox="0 0 128 128"
//       xmlns="http://www.w3.org/2000/svg"
//       role="img"
//       aria-label={label}
//     >
//       <defs>
//         <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
//           <feGaussianBlur stdDeviation="2" result="blur" />
//           <feMerge>
//             <feMergeNode in="blur" />
//             <feMergeNode in="SourceGraphic" />
//           </feMerge>
//         </filter>
//       </defs>

//       {/* optional white background */}
//       {background && <rect x="0" y="0" width="128" height="128" fill="#FFFFFF" />}

//       {/* BRIEFCASE (LinkedIn blue) */}
//       <g id="briefcase" transform="translate(64 64)" opacity="1">
//         <rect x="-24" y="-14" width="48" height="32" rx="6" fill="#2A7BD1" />
//         <rect x="-24" y="-14" width="48" height="3" rx="1.5" fill="#206BB8" />
//         <rect x="-12" y="-22" width="24" height="8" rx="2" fill="#0A66C2" />

//         {/* spin 0–0.8s then hold; 2s loop */}
//         {/* gentle breathing zoom */}
// <animateTransform attributeName="transform" type="scale" additive="sum"
//   values="1; 1.04; 1" keyTimes="0; 0.5; 1" dur="2s" repeatCount="indefinite"/>

// {/* subtle tilt */}
// <animateTransform attributeName="transform" type="rotate" additive="sum"
//   values="-6 0 0; 6 0 0; -6 0 0" keyTimes="0; 0.5; 1" dur="2s" repeatCount="indefinite"/>

//         {/* shrink out 0.8–1.2s */}
//         <animateTransform
//           attributeName="transform"
//           type="scale"
//           additive="sum"
//           values="1; 1; 0; 0"
//           keyTimes="0; 0.4; 0.6; 1"
//           dur="2s"
//           repeatCount="indefinite"
//         />
//         <animate
//           attributeName="opacity"
//           values="1; 1; 0; 0"
//           keyTimes="0; 0.4; 0.6; 1"
//           dur="2s"
//           repeatCount="indefinite"
//         />
//       </g>

//       {/* AVATAR (ApplyWizz teal) */}
//       <g id="avatar" transform="translate(64 64)" opacity="0">
//         <circle r="22" fill="none" stroke="#14B8A6" strokeWidth="3" filter="url(#glow)" />
//         <circle r="8" cy="-4" fill="#14B8A6" />
//         <path d="M -14,10 Q 0,20 14,10 Q 8,4 0,4 Q -8,4 -14,10 Z" fill="#14B8A6" />

//         {/* morph-in 0.8–1.0s */}
//         <animate
//           attributeName="opacity"
//           values="0; 0; 1; 1"
//           keyTimes="0; 0.4; 0.5; 1"
//           dur="2s"
//           repeatCount="indefinite"
//         />
//         <animateTransform
//           attributeName="transform"
//           type="scale"
//           additive="sum"
//           values="0; 0; 1; 1"
//           keyTimes="0; 0.4; 0.5; 1"
//           dur="2s"
//           repeatCount="indefinite"
//         />

//         {/* gentle pulse 1.2–2.0s */}
//         <circle id="pulse" r="22" fill="none" stroke="#14B8A6" strokeWidth="2" opacity="0">
//           <animate attributeName="r" values="22; 22; 34" keyTimes="0; 0.6; 1" dur="2s" repeatCount="indefinite" />
//           <animate attributeName="opacity" values="0; 0; 0.45; 0" keyTimes="0; 0.6; 0.9; 1" dur="2s" repeatCount="indefinite" />
//         </circle>
//       </g>
//     </svg>
//   );
// }

"use client";
import * as React from "react";

type Props = {
  size?: number;          // pixel size (width = height)
  background?: boolean;   // set true for a white square bg
  label?: string;
};

export default function ApplyWizzLoader({
  size = 96,
  background = false,
  label = "ApplyWizz LinkedIn Optimisation loading animation",
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* optional white background */}
      {background && <rect x="0" y="0" width="128" height="128" fill="#FFFFFF" />}

      {/* BRIEFCASE (LinkedIn blue) */}
      <g id="briefcase" transform="translate(64 64)" opacity="1">
        {/* body */}
        <rect x="-24" y="-14" width="48" height="32" rx="6" fill="#0A66C2" />
        {/* lid accent */}
        <rect x="-24" y="-14" width="48" height="3" rx="1.5" fill="#0B5CB0" />
        {/* handle */}
        <rect x="-12" y="-22" width="24" height="8" rx="2" fill="#0A66C2" />

        {/* keep existing rotation exactly as before */}
        <animateTransform
          attributeName="transform"
          type="rotate"
          additive="sum"
          values="0 0 0; 360 0 0; 360 0 0"
          keyTimes="0; 0.4; 1"
          dur="2s"
          repeatCount="indefinite"
        />

        {/* SLOWER, SMOOTHER SHRINK (changed) */}
        <animateTransform
          attributeName="transform"
          type="scale"
          additive="sum"
          values="1; 1; 0.95; 0.80; 0"
          keyTimes="0; 0.60; 0.75; 0.90; 1"
          dur="2s"
          repeatCount="indefinite"
        />

        {/* SLOWER, SMOOTHER FADE (changed) */}
        <animate
          attributeName="opacity"
          values="1; 1; 0.90; 0.55; 0"
          keyTimes="0; 0.60; 0.75; 0.90; 1"
          dur="2s"
          repeatCount="indefinite"
        />
      </g>

      {/* AVATAR (ApplyWizz teal) */}
      <g id="avatar" transform="translate(64 64)" opacity="0">
        {/* glowing ring */}
        <circle r="22" fill="none" stroke="#14B8A6" strokeWidth="3" filter="url(#glow)" />
        {/* head */}
        <circle r="8" cy="-4" fill="#14B8A6" />
        {/* shoulders */}
        <path d="M -14,10 Q 0,20 14,10 Q 8,4 0,4 Q -8,4 -14,10 Z" fill="#14B8A6" />

        {/* morph-in */}
        <animate
          attributeName="opacity"
          values="0; 0; 1; 1"
          keyTimes="0; 0.4; 0.5; 1"
          dur="2s"
          repeatCount="indefinite"
        />
        <animateTransform
          attributeName="transform"
          type="scale"
          additive="sum"
          values="0; 0; 1; 1"
          keyTimes="0; 0.4; 0.5; 1"
          dur="2s"
          repeatCount="indefinite"
        />

        {/* gentle pulse */}
        <circle id="pulse" r="22" fill="none" stroke="#14B8A6" strokeWidth="2" opacity="0">
          <animate attributeName="r" values="22; 22; 34" keyTimes="0; 0.6; 1" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0; 0; 0.45; 0" keyTimes="0; 0.6; 0.9; 1" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
}
