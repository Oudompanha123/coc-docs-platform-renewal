// Static image imports (`import appIcon from "@/app/icon.png"`), typed without
// relying on `next-env.d.ts`. Next declares these there, but that file is
// generated and gitignored, so a fresh checkout — CI's `tsc --noEmit` — has
// no declaration and the import fails to type-check. Same shape Next's own
// `StaticImageData` has.
//
// // req: AuthShell logo (ADR-104 r2.13)
declare module "*.png" {
  const content: { src: string; height: number; width: number; blurDataURL?: string };
  export default content;
}
