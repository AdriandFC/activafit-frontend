# ActivaFit · Panel de retención de socios

Aplicación web para que el personal de un gimnasio identifique qué socios tienen mayor riesgo de abandonar su membresía y decida a quién contactar primero.

**App publicada:** https://adriandfc.github.io/activafit-frontend/
**Repositorio:** https://github.com/adriandfc/activafit-frontend

Proyecto final del curso Desarrollo Front-End (2026-2). Parte de un trabajo previo del curso de Machine Learning, cuyo modelo de predicción de abandono se lleva aquí a una interfaz usable.

- **Autor:** ADRIAN DAVID FERIA LEZAMA · 100163106
- **Versión actual:** v1 (avance EC2)


## 1. Problema y usuario

Los gimnasios pierden ingresos cuando los socios dejan de asistir y cancelan sin que el centro lo note a tiempo. El usuario de ActivaFit es el personal administrativo o de recepción de un gimnasio, que necesita saber a quién llamar esta semana sin interpretar un modelo estadístico.

## 2. Qué hace la aplicación

| Vista | Función |
|---|---|
| **Panel** | Cantidad de socios por nivel de riesgo (alto, medio, bajo), ingreso mensual en riesgo e ingreso mensual retenido estimado, en soles. |
| **Socios** | Tabla ordenada por riesgo, con buscador por nombre o código, filtro por nivel y botón "Marcar contactado" que actualiza el Panel. |
| **Evaluar socio** | Formulario validado con las 8 variables del modelo. Devuelve la probabilidad de abandono, el nivel de riesgo y una acción sugerida. |

## 3. El modelo detrás de la interfaz

El riesgo se calcula en el navegador con una **regresión logística** entrenada en el trabajo de Machine Learning con el [DadosV3 Dataset](https://www.kaggle.com/datasets/saurabhshahane/DadosV3-dataset) (14 942 socios, 80,1 % de abandono; licencia DbCL v1.0).

- **Variables de entrada:** Age, Gender, EnrollmentDuration, LifetimeValue, AverageFrequency, RealNumberOfVisits, NumberOfActivities, NumberOfRenewals.
- **Parámetros:** `data/modelo.json` guarda el intercepto, los coeficientes y la media y desviación del `StandardScaler`, exportados directamente del Pipeline entrenado. Verificado contra `predict_proba` de scikit-learn con un socio del conjunto de prueba (92,5 % en ambos).
- **Desempeño en el conjunto de prueba (2 989 registros):** balanced accuracy 0,589, recall de abandono 0,969, AUC-ROC 0,757. Es una capacidad **moderada** para ordenar socios por riesgo.
- **Niveles de riesgo relativos:** como la mayoría de los socios abandona, los niveles se definen por percentiles de las probabilidades del conjunto de prueba: **alto** ≥ 0,91 (20 % de mayor riesgo), **medio** ≥ 0,86, **bajo** el resto. "Alto" no significa abandono seguro.
- **Coeficiente positivo de antigüedad:** `EnrollmentDuration` y `NumberOfRenewals` tienen correlación de 0,92, por lo que el modelo reparte su efecto entre ambas. Juntas, más antigüedad y renovaciones siguen indicando menor riesgo.

## 4. Limitaciones

- Los **24 socios de `data/socios.json` son ficticios**, generados a partir de los estadísticos del análisis exploratorio. No hay datos personales reales.
- El dataset proviene de un centro deportivo de Lisboa; los resultados podrían no representar a gimnasios peruanos.
- El **ingreso retenido estimado** supone que 30 % de los socios contactados de riesgo alto o medio se queda (`exitoCampana` en `modelo.json`). Es un supuesto de demostración, no una medición.
- La aplicación no guarda datos: los socios marcados como contactados se reinician al recargar.

## 5. Tecnologías

HTML semántico, CSS propio (variables, grid, flexbox, media queries, modo oscuro) y JavaScript sin frameworks ni librerías. Datos cargados con `fetch` desde archivos JSON. Control de versiones en GitHub y publicación en GitHub Pages.

## 6. Accesibilidad

- Estructura con `header`, `nav`, `main`, `section` y `footer`; enlace para saltar al contenido.
- Todos los campos con `label` visible; errores asociados con `aria-describedby`, resumen de errores con enlaces a cada campo.
- Uso completo con teclado, foco visible y foco movido al título al cambiar de vista.
- El riesgo se comunica con texto y porcentaje, no solo con color.
- Colores con contraste suficiente en modo claro y oscuro; respeta `prefers-reduced-motion`.
- Tabla con `caption` y encabezados `scope`; desplazamiento horizontal dentro de su contenedor en pantallas pequeñas.

## 7. Estructura del proyecto

```
activafit/
├── index.html          Estructura y las tres vistas
├── css/
│   └── styles.css      Estilos, diseño responsivo y modo oscuro
├── js/
│   └── app.js          Carga de datos, modelo, filtros, formulario y navegación
├── data/
│   ├── socios.json     Socios de ejemplo (ficticios)
│   └── modelo.json     Parámetros de la regresión logística
├── docs/
│   └── capturas/       Capturas de pantalla de la v1
└── README.md
```

## 8. Cómo ejecutarla

`fetch` no funciona abriendo `index.html` con doble clic. Usa un servidor local:

1. Abre la carpeta en VS Code e instala la extensión **Live Server**.
2. Clic derecho en `index.html` > **Open with Live Server**.

Alternativa con Node: `npx serve .`

**Para actualizar el modelo:** reemplaza `data/modelo.json` con los valores de tu Pipeline (`scaler.mean_`, `scaler.scale_`, `coef_`, `intercept_`) y recarga con Ctrl+F5.

## 9. Evaluación de usabilidad

Plan de dos momentos: se evalúa la v1, se corrige y se mide la v2.

| Técnica | Detalle | Estado |
|---|---|---|
| Evaluación heurística | 3 evaluadores con las 10 heurísticas de Nielsen, severidad 0 a 4 | Pendiente |
| Auditoría técnica | Lighthouse y axe DevTools, WCAG 2.2 A y AA | Pendiente |
| Prueba con usuarios | 5 tareas, al menos 5 participantes, cuestionario SUS | Pendiente |

Los reportes se guardarán en `docs/auditoria/v1/` y `docs/auditoria/v2/`. Los participantes se identifican con códigos (P1, P2…), con consentimiento informado y sin datos personales.

## 10. Uso de inteligencia artificial

Se utilizó ChatGPT como herramienta de apoyo para resolver algunas dudas y obtener orientación durante el desarrollo del proyecto. El contenido y los resultados fueron revisados por el autor.

## 11. Referencias

- Nielsen, J. (1994). *Enhancing the explanatory power of usability heuristics.* CHI '94. https://doi.org/10.1145/191666.191729
- Lewis, J. R. (2018). *The System Usability Scale: Past, present, and future.* https://doi.org/10.1080/10447318.2018.1455307
- W3C (2023). *Web Content Accessibility Guidelines (WCAG) 2.2.* https://www.w3.org/TR/WCAG22/
- Google. *Lighthouse overview.* https://developer.chrome.com/docs/lighthouse/overview