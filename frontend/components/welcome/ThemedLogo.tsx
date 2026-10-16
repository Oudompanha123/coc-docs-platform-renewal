/**
 * The product logo in the right version for the theme — both are in the
 * page and CSS shows one (`dark:`), so it is right from the first frame
 * rather than swapping once JavaScript has read the theme. Works on
 * /welcome (`.landing-auto`) and inside the shells (`data-shell`).
 */
export function ThemedLogo({ className }: { className: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed local asset, not user content */}
      <img src="/logo-coc-docs-platform.png" alt="Coc Docs Platform" className={`${className} dark:hidden`} />
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed local asset, not user content */}
      <img
        src="/logo-coc-docs-platform-dark-mode.png"
        alt="Coc Docs Platform"
        className={`${className} hidden dark:block`}
      />
    </>
  );
}
