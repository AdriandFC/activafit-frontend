"use strict";
const $ = (s) => document.querySelector(s);
const soles = (n) => "S/ " + Math.round(n).toLocaleString("es-PE");
const estado = { socios: [], modelo: null, contactados: new Set() };
const etiqueta = { alto: "Alto", medio: "Medio", bajo: "Bajo" };

/* Regresión logística: coeficientes en data/modelo.json */
function riesgo(m) {
  const { intercepto, coef, media, desv } = estado.modelo;
  let z = intercepto + coef.genero * (m.genero === "Male" ? 1 : 0);
  for (const k of Object.keys(media)) z += coef[k] * ((m[k] - media[k]) / desv[k]);
  return 1 / (1 + Math.exp(-z));
}
function nivel(p) {
  const u = estado.modelo.umbrales;
  return p >= u.alto ? "alto" : p >= u.medio ? "medio" : "bajo";
}

/* Carga de datos con fetch */
async function cargar() {
  const get = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
  try {
    const [s, m] = await Promise.all([get("data/socios.json"), get("data/modelo.json")]);
    estado.modelo = m;
    estado.socios = s.map((x) => { const p = riesgo(x); return { ...x, p, nivel: nivel(p) }; }).sort((a, b) => b.p - a.p);
    $("#k-exito").textContent = Math.round(m.exitoCampana * 100);
    pintarPanel(); pintarTabla();
  } catch (e) {
    $("#estado").textContent = "No pudimos cargar los datos. Abre la app desde un servidor (Live Server o GitHub Pages) y recarga la página.";
  }
}

/* Panel */
function pintarPanel() {
  const c = { alto: 0, medio: 0, bajo: 0 };
  let enRiesgo = 0, retenido = 0, contactados = 0;
  for (const s of estado.socios) {
    c[s.nivel]++;
    if (s.nivel !== "bajo") enRiesgo += s.cuota;
    if (estado.contactados.has(s.id)) {
      contactados++;
      if (s.nivel !== "bajo") retenido += s.cuota * estado.modelo.exitoCampana;
    }
  }
  $("#k-alto").textContent = c.alto; $("#k-medio").textContent = c.medio; $("#k-bajo").textContent = c.bajo;
  $("#k-riesgo").textContent = soles(enRiesgo);
  $("#k-contactados").textContent = contactados;
  $("#k-retenido").textContent = soles(retenido);
}

/* Tabla con buscador y filtro */
function pintarTabla(foco) {
  const q = $("#buscar").value.trim().toLowerCase();
  const f = $("#nivel").value;
  const lista = estado.socios.filter((s) =>
    (f === "todos" || s.nivel === f) && (!q || s.nombre.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)));
  const cuerpo = $("#filas");
  cuerpo.replaceChildren();
  for (const s of lista) {
    const tr = document.createElement("tr");
    [`${s.nombre} (${s.id})`, `${s.antiguedad} meses`, s.visitas, s.renovaciones].forEach((t) => {
      const td = document.createElement("td"); td.textContent = t; tr.append(td);
    });
    const tdR = document.createElement("td");
    const pill = document.createElement("span");
    pill.className = "pill " + s.nivel;
    pill.textContent = `${etiqueta[s.nivel]} · ${Math.round(s.p * 100)}%`;
    tdR.append(pill); tr.append(tdR);
    const tdA = document.createElement("td");
    const b = document.createElement("button");
    const ya = estado.contactados.has(s.id);
    b.type = "button"; b.dataset.id = s.id;
    b.setAttribute("aria-pressed", ya);
    b.textContent = ya ? "Contactado" : "Marcar contactado";
    b.setAttribute("aria-label", `${ya ? "Quitar contacto de" : "Marcar contactado a"} ${s.nombre}`);
    b.addEventListener("click", () => {
      estado.contactados.has(s.id) ? estado.contactados.delete(s.id) : estado.contactados.add(s.id);
      pintarTabla(s.id); pintarPanel();
    });
    tdA.append(b); tr.append(tdA); cuerpo.append(tr);
  }
  if (foco) { const b = cuerpo.querySelector(`button[data-id="${foco}"]`); if (b) b.focus(); }
  $("#conteo").textContent = lista.length
    ? `${lista.length} de ${estado.socios.length} socios`
    : "Ningún socio coincide. Prueba con otro nombre o cambia el nivel de riesgo.";
}
$("#buscar").addEventListener("input", () => pintarTabla());
$("#nivel").addEventListener("change", () => pintarTabla());

/* Formulario validado */
const reglas = {
  edad: ["la edad", 5, 90], antiguedad: ["la antigüedad", 0, 120], ltv: ["el valor acumulado", 0, 10000],
  frecuencia: ["la frecuencia", 0, 7], visitas: ["las visitas", 0, 200],
  actividades: ["las actividades", 1, 10], renovaciones: ["las renovaciones", 0, 20],
};
function validar(d) {
  const e = {};
  for (const [k, [nom, min, max]] of Object.entries(reglas)) {
    const v = String(d[k] ?? "").trim();
    if (v === "") e[k] = `Escribe ${nom}.`;
    else if (Number.isNaN(Number(v))) e[k] = `Usa solo números en ${nom}.`;
    else if (Number(v) < min || Number(v) > max) e[k] = `Ingresa ${nom} entre ${min} y ${max}.`;
  }
  if (!d.genero) e.genero = "Elige el género del socio.";
  return e;
}
$("#form").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const r = $("#resultado"), resumen = $("#resumen-errores");
  r.replaceChildren();
  document.querySelectorAll(".err").forEach((s) => (s.textContent = ""));
  document.querySelectorAll("#form [aria-invalid]").forEach((i) => i.removeAttribute("aria-invalid"));
  if (!estado.modelo) { r.textContent = "Los datos aún no cargan. Vuelve a intentarlo en unos segundos."; return; }
  const datos = Object.fromEntries(new FormData(ev.target));
  const errores = validar(datos), claves = Object.keys(errores);
  if (claves.length) {
    claves.forEach((k) => { $("#e-" + k).textContent = errores[k]; $("#" + k).setAttribute("aria-invalid", "true"); });
    resumen.replaceChildren();
    const t = document.createElement("p");
    t.textContent = `Corrige ${claves.length} campo${claves.length > 1 ? "s" : ""} para continuar:`;
    const ul = document.createElement("ul");
    claves.forEach((k) => {
      const li = document.createElement("li"), a = document.createElement("a");
      a.href = "#" + k; a.textContent = errores[k];
      a.addEventListener("click", (e) => { e.preventDefault(); $("#" + k).focus(); });
      li.append(a); ul.append(li);
    });
    resumen.append(t, ul); resumen.hidden = false; resumen.focus();
    return;
  }
  resumen.hidden = true;
  const num = Object.fromEntries(Object.keys(reglas).map((k) => [k, Number(datos[k])]));
  const p = riesgo({ ...num, genero: datos.genero }), n = nivel(p);
  const acciones = {
    alto: "Llámalo esta semana y ofrécele una clase de reingreso o un plan flexible.",
    medio: "Envíale un mensaje con una clase sugerida y revisa su asistencia en dos semanas.",
    bajo: "No requiere acción por ahora. Mantén el seguimiento habitual.",
  };
  const pct = document.createElement("p"); pct.className = "pct"; pct.textContent = Math.round(p * 100) + "% de probabilidad de abandono";
  const pill = document.createElement("span"); pill.className = "pill " + n; pill.textContent = "Riesgo " + etiqueta[n].toLowerCase();
  const txt = document.createElement("p"); txt.textContent = acciones[n];
  r.append(pct, pill, txt);
});

/* Navegación por vistas (hash) */
function ruta() {
  const h = location.hash.slice(1);
  const id = ["panel", "socios", "evaluar"].includes(h) ? h : "panel";
  document.querySelectorAll("main > section").forEach((s) => (s.hidden = s.id !== id));
  document.querySelectorAll("nav a").forEach((a) =>
    a.dataset.vista === id ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  const t = document.querySelector(`#${id} :is(h1,h2)`);
  document.title = `${t.textContent} · ActivaFit`;
  if (ruta.listo) t.focus();
  ruta.listo = true;
}
window.addEventListener("hashchange", ruta);
ruta(); cargar();
