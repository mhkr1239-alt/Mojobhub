// مراقب ظهور العناصر عند التمرير (Scroll Reveal)
// يضيف الكلاس reveal-in لكل عنصر [data-reveal] يدخل نافذة العرض،
// ويلتقط العناصر الجديدة تلقائيًا عبر MutationObserver
// (تبديل الصفحات، تغيير الفلاتر، تحميل البيانات من قاعدة البيانات).

let io: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // يُكشف العنصر إذا دخل الشاشة، أو إذا تجاوزه التمرير (أعلى النافذة)
          // حتى لا تبقى عناصر مخفية بعد القفز السريع أو مفاتيح End
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
            (entry.target as HTMLElement).classList.add('reveal-in');
            io!.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: '200000px 0px -6% 0px' }
    );
  }
  return io;
}

/** يُستدعى مرة واحدة في PublicLayout — يعيد دالة تنظيف */
export function initReveal(): () => void {
  const revealAll = () =>
    document
      .querySelectorAll<HTMLElement>('[data-reveal]')
      .forEach((el) => el.classList.add('reveal-in'));

  // متصفح بلا IntersectionObserver: أظهر كل شيء فورًا (تدهور آمن)
  if (typeof IntersectionObserver === 'undefined') {
    revealAll();
    return () => {};
  }

  const obs = getObserver();
  document
    .querySelectorAll<HTMLElement>('[data-reveal]')
    .forEach((el) => obs.observe(el));

  // التقاط العناصر المضافة لاحقًا إلى الشجرة
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches('[data-reveal]')) obs.observe(node);
        node
          .querySelectorAll<HTMLElement>('[data-reveal]')
          .forEach((el) => obs.observe(el));
      });
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return () => mo.disconnect();
}
