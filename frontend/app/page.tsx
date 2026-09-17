import { redirect } from "next/navigation";

/**
 * The bare origin, for somebody who typed localhost:3000 or followed a link
 * with no path.
 *
 * <p>Sends them to the workspace, not to the sign-in form. This redirected to
 * /login unconditionally, so anyone already signed in was bounced back to a
 * login page they did not need — which reads as the session having been lost.
 *
 * <p>No session check here on purpose. This is a server component and the
 * session is an httpOnly cookie the backend owns (ADR-011), so deciding here
 * would mean a second round trip to ask a question the destination already
 * asks: RequireSession guards everything under (shell) and sends a visitor
 * with no session to /login. One authority, not two that can disagree.
 */
export default function Home() {
  redirect("/overview");
}
