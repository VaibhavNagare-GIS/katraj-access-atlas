const system = matchMedia('(prefers-reduced-motion: reduce)');
let manual = false;
export const reduced = () => system.matches || manual;
export function initMotion() {
  const button = document.getElementById('motion-toggle');
  const apply = () => {
    document.body.classList.toggle('reduced-motion', reduced());
    button.textContent = reduced() ? 'Motion: off' : 'Motion: on';
    button.setAttribute('aria-pressed', String(reduced()));
    document.dispatchEvent(new CustomEvent('motionchange', { detail: reduced() }));
  };
  button.addEventListener('click', () => {
    manual = !reduced();
    apply();
  });
  system.addEventListener('change', apply);
  apply();
  document.body.classList.add('motion-ready');
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          observer.unobserve(e.target);
        }
      }),
    { threshold: 0.06 },
  );
  document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
  let pending = false;
  const bar = document.querySelector('.reading-progress');
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    pending = false;
  };
  addEventListener(
    'scroll',
    () => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}
