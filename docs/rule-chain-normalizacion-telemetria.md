# Rule chain — normalización de telemetría de medidores

Scripts JavaScript para nodos **Script** de ThingsBoard. Un nodo por tipo de conector/medidor.

## Modelo canónico (unidad única)

| Key canónica | Unidad | Origen |
|---|---|---|
| `energiaActivaImportadaIntervalo` | kWh | AcePilot/DLMS `*_intervalo_kWh`; Metercat `activa_imp_wh ÷ 1000` |
| `energiaActivaExportadaIntervalo` | kWh | Idem |
| `energiaReactivaImportadaIntervalo` | kVArh | AcePilot/DLMS `*_intervalo_kVArh`; Metercat `reactiva_imp_varh ÷ 1000` |
| `energiaReactivaExportadaIntervalo` | kVArh | Idem |
| `energiaActivaImportadaTotal` | kWh | Solo AcePilot/DLMS (`*_total_kWh`) |
| `energiaActivaExportadaTotal` | kWh | Solo AcePilot/DLMS |
| `energiaReactivaImportadaTotal` | kVArh | Solo AcePilot/DLMS |
| `energiaReactivaExportadaTotal` | kVArh | Solo AcePilot/DLMS |
| `potenciaActiva` | kW | Preferir `*_kW`; si solo hay W → ÷ 1000 |
| `voltajeFaseA` / `B` / `C` | V | |
| `corrienteFaseA` / `B` / `C` | A | |
| `factorPotencia` | adimensional | |
| `frecuencia` | Hz | |

## Nota AcePilot: potencia

En `AcePilotConnector._build_instantaneos`:

```python
add("potencia_activa_w", "potencia_activa_W")
add("potencia_activa_w", "potencia_activa_kW", lambda v: round(v / 1000, 3))
```

**Son el mismo valor duplicado:** `potencia_activa_kW = potencia_activa_W / 1000`.  
Mapear a `potenciaActiva` desde `potencia_activa_kW` (o W÷1000). No sumar ni promediar ambas.

## Cómo cablear en ThingsBoard

1. Rule chain del device (o root con filtro por device profile / type).
2. Nodo **Message Type Switch** → `POST_TELEMETRY_REQUEST`.
3. Nodo **Script** (Transform) con el script correspondiente al perfil.
4. Nodo **Save Timeseries** (guarda las keys canónicas del `msg` transformado).
5. Opcional: borrar/ignorar keys de fabricante si no las quieres persistir.

Cada script:
- Lee el `msg` de telemetría entrante.
- Escribe solo keys canónicas presentes.
- Devuelve `{ msg, metadata, msgType }` (API de script TB).

---

## 1) AcePilot — ITRON SL7000 (DLMS)

```javascript
/**
 * Normaliza telemetría AcePilot (ITRON SL7000) → keys canónicas RP CONNECT.
 * Unidades de salida: kWh, kVArh, kW, V, A, Hz.
 */
function toNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  var n = Number(v);
  return isFinite(n) ? n : null;
}

function put(out, key, value) {
  if (value !== null && value !== undefined) {
    out[key] = value;
  }
}

var src = msg;
var out = {};

put(out, 'energiaActivaImportadaIntervalo', toNumber(src.energia_activa_importada_intervalo_kWh));
put(out, 'energiaActivaExportadaIntervalo', toNumber(src.energia_activa_exportada_intervalo_kWh));
put(out, 'energiaReactivaImportadaIntervalo', toNumber(src.energia_reactiva_importada_intervalo_kVArh));
put(out, 'energiaReactivaExportadaIntervalo', toNumber(src.energia_reactiva_exportada_intervalo_kVArh));

put(out, 'energiaActivaImportadaTotal', toNumber(src.energia_activa_importada_total_kWh));
put(out, 'energiaActivaExportadaTotal', toNumber(src.energia_activa_exportada_total_kWh));
put(out, 'energiaReactivaImportadaTotal', toNumber(src.energia_reactiva_importada_total_kVArh));
put(out, 'energiaReactivaExportadaTotal', toNumber(src.energia_reactiva_exportada_total_kVArh));

// potencia_activa_W y potencia_activa_kW son el mismo valor (W y W/1000). Preferir kW.
var pKw = toNumber(src.potencia_activa_kW);
if (pKw === null) {
  var pW = toNumber(src.potencia_activa_W);
  if (pW !== null) {
    pKw = pW / 1000;
  }
}
put(out, 'potenciaActiva', pKw);

put(out, 'voltajeFaseA', toNumber(src.voltaje_fase_A_V));
put(out, 'voltajeFaseB', toNumber(src.voltaje_fase_B_V));
put(out, 'voltajeFaseC', toNumber(src.voltaje_fase_C_V));
put(out, 'corrienteFaseA', toNumber(src.corriente_fase_A_A));
put(out, 'corrienteFaseB', toNumber(src.corriente_fase_B_A));
put(out, 'corrienteFaseC', toNumber(src.corriente_fase_C_A));
put(out, 'factorPotencia', toNumber(src.factor_potencia));
put(out, 'frecuencia', toNumber(src.frecuencia_Hz));

return { msg: out, metadata: metadata, msgType: msgType };
```

---

## 2) Metercat — Elster A1800R (ANSI C12)

Metercat solo publica **intervalos** en Wh/varh (sin totales acumulados). Convertir ÷ 1000 → kWh/kVArh.

```javascript
/**
 * Normaliza telemetría Metercat (Elster A1800R) → keys canónicas RP CONNECT.
 * activa_imp_wh está en Wh → kWh (÷1000). No hay totales en este conector.
 */
function toNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  var n = Number(v);
  return isFinite(n) ? n : null;
}

function whToKwh(v) {
  var n = toNumber(v);
  return n === null ? null : n / 1000;
}

function put(out, key, value) {
  if (value !== null && value !== undefined) {
    out[key] = value;
  }
}

var src = msg;
var out = {};

put(out, 'energiaActivaImportadaIntervalo', whToKwh(src.activa_imp_wh));
put(out, 'energiaActivaExportadaIntervalo', whToKwh(src.activa_exp_wh));
put(out, 'energiaReactivaImportadaIntervalo', whToKwh(src.reactiva_imp_varh));
put(out, 'energiaReactivaExportadaIntervalo', whToKwh(src.reactiva_exp_varh));

// Sin energia*Total ni potencia/voltaje/corriente en Metercat LP actual.

return { msg: out, metadata: metadata, msgType: msgType };
```

---

## 3) DLMSConnector — MeterView P2000-T

```javascript
/**
 * Normaliza telemetría DLMSConnector (MeterView P2000-T) → keys canónicas RP CONNECT.
 * Intervalos y totales ya vienen en kWh/kVArh. Potencia: preferir kW; si solo W → ÷1000.
 */
function toNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  var n = Number(v);
  return isFinite(n) ? n : null;
}

function put(out, key, value) {
  if (value !== null && value !== undefined) {
    out[key] = value;
  }
}

var src = msg;
var out = {};

put(out, 'energiaActivaImportadaIntervalo', toNumber(src.energia_activa_importada_intervalo_kWh));
put(out, 'energiaActivaExportadaIntervalo', toNumber(src.energia_activa_exportada_intervalo_kWh));
put(out, 'energiaReactivaImportadaIntervalo', toNumber(src.energia_reactiva_importada_intervalo_kVArh));
put(out, 'energiaReactivaExportadaIntervalo', toNumber(src.energia_reactiva_exportada_intervalo_kVArh));

put(out, 'energiaActivaImportadaTotal', toNumber(src.energia_activa_importada_total_kWh));
put(out, 'energiaActivaExportadaTotal', toNumber(src.energia_activa_exportada_total_kWh));
put(out, 'energiaReactivaImportadaTotal', toNumber(src.energia_reactiva_importada_total_kVArh));
put(out, 'energiaReactivaExportadaTotal', toNumber(src.energia_reactiva_exportada_total_kVArh));

var pKw = toNumber(src.potencia_activa_kW);
if (pKw === null) {
  var pW = toNumber(src.potencia_activa_W);
  if (pW !== null) {
    pKw = pW / 1000;
  }
}
put(out, 'potenciaActiva', pKw);

// Instantáneos vivos (fase A) + valores de perfil si vienen en el mismo mensaje
put(out, 'voltajeFaseA', toNumber(src.voltaje_fase_A_V) !== null
  ? toNumber(src.voltaje_fase_A_V)
  : toNumber(src.voltaje_A_V));
put(out, 'voltajeFaseB', toNumber(src.voltaje_B_V));
put(out, 'voltajeFaseC', toNumber(src.voltaje_C_V));
put(out, 'corrienteFaseA', toNumber(src.corriente_fase_A_A) !== null
  ? toNumber(src.corriente_fase_A_A)
  : toNumber(src.corriente_A_A));
put(out, 'corrienteFaseB', toNumber(src.corriente_B_A));
put(out, 'corrienteFaseC', toNumber(src.corriente_C_A));

return { msg: out, metadata: metadata, msgType: msgType };
```

---

## Home / gráfica de consumo

Cuando la rule chain esté activa, la home debe leer:

- Key: `energiaActivaImportadaIntervalo`
- Agregación: `SUM` por intervalo diario (`86400000` ms)
- Visualización: valor diario (kWh) ÷ 1000 → **MWh**
