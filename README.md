# 🚀 FakeStore Login Load Test Challenge

Suite de pruebas de carga para validar el servicio de autenticación de **FakeStore API** utilizando **K6**, **JavaScript ES6** y **constant-arrival-rate executor**.

El proyecto fue diseñado siguiendo principios de **QA Performance Testing**, priorizando:

* Reproducibilidad
* Modularidad
* Parametrización desde datos externos
* Thresholds literales del SLA
* Honestidad en la medición de fallos

---

<p align="center">

![K6](https://img.shields.io/badge/K6-v2.0.0-7D64FF?style=for-the-badge&logo=k6)

![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=for-the-badge&logo=javascript)

</p>

---

# 📖 Descripción

Este proyecto automatiza una prueba de carga sobre el endpoint de autenticación de FakeStore API.

Endpoint bajo prueba:

```http
POST /auth/login
```

Base URL:

```text
https://fakestoreapi.com
```

La prueba valida que el sistema soporte la carga objetivo cumpliendo los tres SLA del reto:

* Throughput mínimo de 20 TPS
* Tiempo de respuesta máximo menor a 1500 ms
* Tasa de error inferior al 3%

---

# 🎯 Objetivos

✅ Alcanzar y sostener 20 TPS durante la fase de carga principal.

✅ Mantener el tiempo de respuesta máximo por debajo de 1500 ms.

✅ Mantener la tasa de error por debajo del 3%.

✅ Validar que cada respuesta exitosa contenga un token JWT válido.

✅ Parametrizar credenciales desde un archivo CSV externo.

✅ Generar reportes automáticos en texto y JSON.

---

# 🛠 Stack Tecnológico

| Tecnología    | Uso                                  |
| ------------- | ------------------------------------ |
| K6 v2.0.0     | Motor de pruebas de carga            |
| JavaScript ES6 | Lógica de scripts (nativo en K6)    |
| SharedArray   | Carga eficiente del CSV entre VUs    |
| constant-arrival-rate | Executor para garantizar TPS |
| Git           | Control de versiones                 |

---

# 📂 Estructura del Proyecto

```text
fakestore-k6-load-test/
│
├── .gitignore
├── README.md
├── readme.txt
├── conclusiones.txt
│
├── data/
│   └── users.csv              ← Credenciales parametrizadas (5 usuarios)
│
├── config/
│   ├── env.js                 ← Variables de entorno con defaults
│   ├── options.js             ← Escenarios y fases de carga
│   └── thresholds.js          ← SLA thresholds smoke/load
│
├── lib/
│   ├── utils.js               ← SharedArray, CSV parser, round-robin
│   ├── checks.js              ← Validaciones de respuesta
│   └── metrics.js             ← Métricas personalizadas (Rate, Counter)
│
├── scripts/
│   ├── smoke-login.js         ← Test de conectividad (10s)
│   └── load-login.js          ← Test de carga completo (180s)
│
└── reports/
    ├── textSummary.txt        ← Resumen legible post-ejecución
    └── summary.json           ← Datos completos en JSON
```

---

# ⚙️ Arquitectura de Automatización

La solución fue diseñada bajo una arquitectura modular desacoplada.

### Config

Centraliza toda la configuración del test.

```text
config/env.js          Variables de entorno y defaults
config/options.js      Definición de fases y executor
config/thresholds.js   Criterios de aprobación SLA
```

### Lib

Componentes reutilizables independientes del script.

```text
lib/utils.js    Carga del CSV con SharedArray y round-robin
lib/checks.js   Validación de status, token y tiempo por request
lib/metrics.js  Métricas personalizadas: login_success_rate, login_attempts
```

### Scripts

Puntos de entrada de ejecución.

```text
scripts/smoke-login.js   Conectividad y validación rápida (10s)
scripts/load-login.js    Prueba de carga completa con 3 fases (180s)
```

### Data

Datos de entrada externos al script.

```text
data/users.csv   5 credenciales de FakeStore parametrizadas
```

---

# 📋 Requisitos Previos

## K6

```bash
k6 version
```

Resultado esperado:

```text
k6 v2.0.0 (commit/8c3be52cc1, go1.26.3, linux/amd64)
```

---

## Conexión a Internet

El test consume la API pública de FakeStore. No requiere servidor local.

```text
https://fakestoreapi.com
```

---

# 🚀 Instalación

## Instalar K6

```bash
# Linux (Debian/Ubuntu)
sudo gpg --no-default-keyring \
    --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
    --keyserver hkp://keyserver.ubuntu.com:80 \
    --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69

echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] \
    https://dl.k6.io/deb stable main" \
    | sudo tee /etc/apt/sources.list.d/k6.list

sudo apt-get update && sudo apt-get install k6
```

```bash
# macOS
brew install k6
```

```bash
# Windows
winget install k6 --source winget
```

## Clonar repositorio

```bash
git clone [URL DEL REPOSITORIO]
```

```bash
cd fakestore-k6-load-test
```

---

# ▶️ Ejecución

## Paso 1 — Smoke Test (recomendado primero)

```bash
k6 run scripts/smoke-login.js
```

---

## Paso 2 — Load Test completo

```bash
k6 run scripts/load-login.js
```

---

## Ejecutar con TPS personalizado

```bash
k6 run -e TPS_TARGET=25 scripts/load-login.js
```

---

## Ejecutar con debug por VU

```bash
k6 run -e DEBUG_MODE=true scripts/load-login.js
```

---

## Ejecutar con timeout personalizado

```bash
k6 run -e REQUEST_TIMEOUT=1490ms scripts/load-login.js
```

---

# 📊 Perfil de Carga

| Fase        | Duración | TPS | Inicio |
| ----------- | -------- | --- | ------ |
| warm_up     | 30s      | 5   | 0s     |
| main_load   | 120s     | 20  | 30s    |
| cool_down   | 30s      | 5   | 150s   |
| **Total**   | **180s** | —   | —      |

---

# 📊 Cobertura de Validaciones

| ID    | Validación                              |
| ----- | --------------------------------------- |
| V-001 | Status HTTP 200 o 201                   |
| V-002 | Presencia de token JWT en la respuesta  |
| V-003 | Tiempo de respuesta menor a 1500 ms     |
| V-004 | Tasa de error menor al 3%               |
| V-005 | Token success rate mayor al 97%         |
| V-006 | p(95) de latencia menor a 1500 ms       |

---

# 🔍 Estrategias Implementadas

## SharedArray

El CSV se carga una sola vez en el init context y se comparte entre todos los VUs:

```javascript
const credentials = new SharedArray('fakestore-login-credentials', function () {
  return parseCSV(open('../data/users.csv'));
});
```

---

## Round-Robin de Credenciales

Distribución equitativa entre VUs e iteraciones:

```javascript
const index = (__VU - 1 + __ITER) % credentials.length;
```

---

## Timeout como Mecanismo de SLA

El timeout por request se configura por debajo del límite máximo del reto:

```javascript
REQUEST_TIMEOUT = '1490ms'
```

Cualquier petición que supere el tiempo permitido es cortada y contabilizada como fallo dentro del presupuesto de error del 3%.

---

## Variables de Entorno

Todas las configuraciones son sobreescribibles sin tocar el código:

```text
BASE_URL          URL base de la API
LOGIN_ENDPOINT    Path del endpoint
TPS_TARGET        Throughput objetivo (default: 20)
REQUEST_TIMEOUT   Timeout por petición (default: 1490ms)
DEBUG_MODE        Logs por VU (default: false)
```

---

# ⚠️ Hallazgo Importante de la API

FakeStore puede retornar tanto **HTTP 200** como **HTTP 201** en un login exitoso.

Por esta razón la validación acepta ambos:

```javascript
'status is 200 or 201': (r) => r.status === 200 || r.status === 201
```

> Un HTTP 200 sin token sigue siendo un fallo funcional.

---

# 📈 Reportes

K6 genera los reportes automáticamente al finalizar el load test.

Ubicación:

```text
reports/textSummary.txt   Resumen legible con métricas y thresholds
reports/summary.json      Datos completos en formato JSON
```

---

# 📷 Información Disponible en los Reportes

* Total de requests ejecutados
* TPS real por fase
* Tiempo de respuesta: avg, p(50), p(90), p(95), max
* Tasa de error HTTP
* Login attempts, successes y failures
* Token success rate
* Checks passed / failed
* Threshold pass/fail por condición
* Dropped iterations

---

# 🧪 Resultado Esperado

```text
✓ http_req_failed.............: rate<0.03
✓ http_req_duration...........: max<1500, p(95)<1500
✓ login_success_rate..........: rate>0.97
✓ checks......................: rate>0.97

Exit code: 0
```

---

# 🧠 Conclusiones

La solución implementada demuestra:

* Uso correcto del executor `constant-arrival-rate` para garantizar TPS
* Parametrización desde CSV con `SharedArray` en init context
* Thresholds literales del SLA del reto
* Transparencia en el reporte de errores y timeouts
* Documentación autocontenida y reproducible

Para el análisis completo de resultados consulte:

```text
conclusiones.txt
```

---

# 👨‍💻 Autor

**Luna Kenya**

---
