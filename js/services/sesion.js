import { AUTH } from "../auth.js";
import { state } from "./album.js";

export async function prepararSesion() {
  const u = await AUTH.quienSoy();
  state.yo = u.emailAddress;
  state.yoNombre = u.displayName || state.yo;
  return u;
}