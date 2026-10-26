type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const PlayIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
);
export const CloseIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const ArrowLeft = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}><path d="M15 5l-7 7 7 7" /></svg>
);
export const ArrowRight = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}><path d="M9 5l7 7-7 7" /></svg>
);
export const ArrowUpRight = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}><path d="M7 17L17 7M8 7h9v9" /></svg>
);
export const InstagramIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" /></svg>
);
export const TikTokIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor"><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.6V9a7.3 7.3 0 0 0 4.3 1.4V7.3a4.3 4.3 0 0 1-3.2-1.5z" /></svg>
);
export const MailIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6.5L12 13l8.5-6.5" /></svg>
);
export const PinIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
);
export const PhoneIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
);
