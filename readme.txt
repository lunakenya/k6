===========================================================
EJERCICIO 1: Prueba de Carga — FakeStore Login API
Instrucciones de Ejecución Paso a Paso
===========================================================

DESCRIPCIÓN DEL RETO
-----------------------------------------------------------
Automatizar una prueba de carga sobre el endpoint de autenticación
de FakeStore API, validando que el sistema soporte al menos 20 TPS
con un tiempo de respuesta máximo de 1.5 segundos y una tasa de
error inferior al 3%.

Servicio: POST https://fakestoreapi.com/auth/login
Credenciales: 5 usuarios parametrizados desde data/users.csv

SLA:
  - Throughput    : >= 20 TPS
  - Tiempo máximo : < 1500 ms
  - Tiempo p(95)  : < 1500 ms
  - Tasa de error : < 3%
  - Token success : > 97%

HERRAMIENTA
-----------------------------------------------------------
K6 (Grafana k6) — herramienta de pruebas de carga open-source
que ejecuta JavaScript ES6 nativo sin depender de Node.js.

VERSIONES REQUERIDAS
-----------------------------------------------------------
- k6          : v2.0.0 (go1.26.3, linux/amd64) — versión usada en la ejecución real
- JavaScript  : ES6, soportado nativamente por k6 (motor Go)
- Sistema op. : Windows / Linux / macOS (multiplataforma)
- Node.js     : NO requerido. K6 ejecuta JS directamente.
- Git         : v2.30 o superior (para clonar el repositorio)

PRERREQUISITOS
-----------------------------------------------------------
1. k6 instalado y disponible en el PATH del sistema.
   Verificar: k6 version
   Salida esperada: k6 v2.0.0 (commit/8c3be52cc1, go1.26.3, linux/amd64)

2. Conexión a internet activa (el test consume la API pública
   https://fakestoreapi.com — no requiere servidor local).

3. El archivo data/users.csv debe estar presente en la raíz
   del proyecto (ya incluido en el repositorio).

INSTALACIÓN DE K6
-----------------------------------------------------------
Descarga oficial: https://k6.io/docs/get-started/installation/

  Windows (via winget):
  > winget install k6 --source winget

  Windows (via Chocolatey):
  > choco install k6

  macOS (via Homebrew):
  > brew install k6

  Linux (Debian/Ubuntu):
  > sudo gpg -k
  > sudo gpg --no-default-keyring \
      --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
      --keyserver hkp://keyserver.ubuntu.com:80 \
      --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
  > echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] \
      https://dl.k6.io/deb stable main" \
      | sudo tee /etc/apt/sources.list.d/k6.list
  > sudo apt-get update && sudo apt-get install k6

PASOS DE EJECUCIÓN
-----------------------------------------------------------
Paso 1: Clonar el repositorio
  > git clone https://github.com/lunakenya/k6.git
  > cd fakestore-k6-load-test

Paso 2: Verificar k6
  > k6 version

Paso 3: (Recomendado) Ejecutar el smoke test PRIMERO
  > k6 run scripts/smoke-login.js

  Duración: ~10 segundos
  Objetivo: Confirmar conectividad y que el script funciona.
  Resultado esperado: thresholds en verde.

Paso 4: Ejecutar el load test completo
  > k6 run scripts/load-login.js

  Duración: ~3 minutos (30s warm + 120s main + 30s cool)
  Reportes generados automáticamente en:
    reports/textSummary.txt
    reports/summary.json

COMANDOS CON VARIABLES DE ENTORNO
-----------------------------------------------------------
Cambiar el TPS objetivo (default: 20):
  > k6 run -e TPS_TARGET=25 scripts/load-login.js

Cambiar el endpoint base:
  > k6 run -e BASE_URL=https://fakestoreapi.com scripts/load-login.js

Combinar variables:
  > k6 run -e TPS_TARGET=20 -e BASE_URL=https://fakestoreapi.com scripts/load-login.js

Cambiar el timeout por request (default: 1490ms):
  > k6 run -e REQUEST_TIMEOUT=1490ms scripts/load-login.js

Habilitar logs de debug por VU:
  > k6 run -e DEBUG_MODE=true scripts/load-login.js

REQUEST_TIMEOUT Y SLA DE 1.5 SEGUNDOS
-----------------------------------------------------------
REQUEST_TIMEOUT controla cuánto tiempo espera K6 cada petición HTTP
antes de cortarla por timeout.

Valor por defecto:
  REQUEST_TIMEOUT=1490ms

Se usa un timeout menor a 1500 ms porque el reto exige un tiempo de
respuesta máximo de 1.5 segundos. Si una petición supera ese límite,
no debe seguir esperando 20s, 35s o 60s; debe cortarse y contabilizarse
como fallo real de la prueba.

Interpretación:
  - Una respuesta menor a 1500 ms puede aprobar los checks de tiempo.
  - Una petición que excede REQUEST_TIMEOUT falla por timeout.
  - Ese timeout incrementa http_req_failed y puede fallar checks.
  - La ejecución sigue siendo válida si el total de fallos permanece
    por debajo del 3% y login_success_rate se mantiene por encima del 97%.

Ejemplo:
  > k6 run -e REQUEST_TIMEOUT=1490ms scripts/load-login.js

REPORTES
-----------------------------------------------------------
Los reportes se generan automáticamente al finalizar el load test.

  reports/textSummary.txt  — Resumen legible con métricas y thresholds
  reports/summary.json     — Datos completos en formato JSON (para integración)

NOTA: Los archivos de reports/ están en .gitignore por defecto.
Para incluirlos como evidencia en GitHub, agrégalos manualmente:
  > git add -f reports/textSummary.txt reports/summary.json
  > git commit -m "chore: add execution reports as evidence"

DESCRIPCIÓN DEL CSV
-----------------------------------------------------------
Archivo: data/users.csv
Formato: user,passwd
Contiene 5 credenciales válidas de FakeStore API.
El script distribuye las credenciales en round-robin entre todos
los VUs para evitar colisiones y reducir la presión sobre un
único usuario.

ESTRUCTURA DEL PROYECTO
-----------------------------------------------------------
fakestore-k6-load-test/
├── readme.txt                  <- Este archivo
├── conclusiones.txt            <- Hallazgos y resultados
├── .gitignore
├── data/
│   └── users.csv               <- Credenciales de prueba
├── config/
│   ├── env.js                  <- Variables de entorno con defaults
│   ├── options.js              <- Configuración de escenarios K6
│   └── thresholds.js           <- SLA thresholds smoke/load
├── lib/
│   ├── utils.js                <- SharedArray, CSV parser, round-robin
│   ├── checks.js               <- Validaciones de respuesta
│   └── metrics.js              <- Métricas personalizadas (Rate, Counter)
├── scripts/
│   ├── smoke-login.js          <- Test de conectividad (10s)
│   └── load-login.js           <- Test de carga completo (180s)
└── reports/
    └── .gitkeep

INTERPRETACIÓN DE THRESHOLDS
-----------------------------------------------------------
Al finalizar la ejecución, K6 muestra la sección THRESHOLDS:

  ✓  Threshold cumplido (SLA aprobado)
  ✗  Threshold fallido  (SLA incumplido) — el test termina con exit code != 0

Thresholds del load test:
  http_req_failed rate < 0.03     — Tasa de error HTTP < 3%
  http_req_duration max < 1500    — Ningún request medido supera 1500ms
  http_req_duration p(95) < 1500  — 95% de requests < 1500ms
  login_success_rate rate > 0.97  — Token recibido en > 97% de logins
  checks rate > 0.97              — Checks aprobados en > 97%

INTERPRETACIÓN DE MÉTRICAS CLAVE
-----------------------------------------------------------
error rate:
  Proporción de requests fallidos, incluyendo timeouts y respuestas HTTP
  fuera del rango esperado por K6.
  Objetivo: < 3%. Si supera este valor, el threshold falla.

max:
  Mayor duración registrada en http_req_duration.
  Objetivo: < 1500 ms. REQUEST_TIMEOUT=1490ms evita que una petición
  lenta permanezca abierta por encima del SLA del reto.

p(95):
  El 95% de los requests respondieron en menos de este tiempo.
  Objetivo: < 1500 ms.

timeouts:
  Si FakeStore tarda más que REQUEST_TIMEOUT, K6 corta la petición.
  Ese caso es un error válido dentro del margen permitido por el reto:
  la prueba pasa solo si esos fallos se mantienen por debajo del 3%.

dropped_iterations:
  K6 no pudo lanzar algunas iteraciones porque el servidor
  respondía más lento que el intervalo del arrival-rate.
  Ejemplo: Con 20 TPS y avg 1.5s, K6 necesita 30 VUs mínimo.
  Si hay dropped_iterations > 0, aumentar preAllocatedVUs en options.js.
  Nota: Esto no es un error del script, sino un límite de capacidad del API.

TPS real vs TPS objetivo:
  El campo http_reqs rate muestra el TPS promedio de la ejecución completa.
  En el load test, el valor global esperado ronda 15 req/s porque combina
  warm_up (5 TPS), main_load (20 TPS) y cool_down (5 TPS).
  El requisito de >= 20 TPS debe validarse en la fase main_load.
  Si dropped_iterations > 0: K6 no pudo sostener el TPS objetivo.
  En ambos casos, documentar en conclusiones.txt.

TROUBLESHOOTING
-----------------------------------------------------------
Problema: ERRO[0000] open ../data/users.csv: no such file or directory
Causa   : El script debe ejecutarse desde la raíz del proyecto.
Solución: cd fakestore-k6-load-test && k6 run scripts/smoke-login.js

Problema: dial tcp: connection refused / timeout
Causa   : FakeStore API no responde, hay problema de red o el endpoint
          excedió REQUEST_TIMEOUT.
Solución: Verificar conectividad: curl https://fakestoreapi.com/auth/login

Problema: FAIL - threshold http_req_duration max crossed
Causa   : Al menos una petición medida superó el SLA máximo de 1500ms.
Solución: Mantener REQUEST_TIMEOUT por debajo de 1500ms y revisar si
          el error rate permanece bajo 3%. Si no, documentar el hallazgo.

Problema: FAIL - threshold http_req_duration p(95) crossed
Causa   : Más del 5% de las peticiones responde lento frente al SLA de 1500ms.
Solución: Documentar en conclusiones.txt como hallazgo real de la API.
          El threshold es correcto; el problema es del servidor.

Problema: dropped_iterations > 0
Causa   : El TPS objetivo supera la capacidad actual del API.
Solución: Aumentar preAllocatedVUs y maxVUs en config/options.js,
          o reducir TPS_TARGET: k6 run -e TPS_TARGET=15 scripts/load-login.js

Problema: checks_failed > 0 — "response has token"
Causa   : FakeStore devolvió 200 pero sin campo "token" en el body.
Solución: Verificar con curl que las credenciales del CSV sean válidas.

NOTA DE REPRODUCIBILIDAD
-----------------------------------------------------------
Requisitos mínimos para ejecutarlo:
  1. k6 v2.0.0 instalado
  2. Conexión a internet
  3. git clone del repositorio

No requiere Node.js, npm, Maven, Java ni ninguna dependencia adicional.
El CSV con credenciales está incluido en el repositorio.
