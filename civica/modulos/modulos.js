"use strict";

(() => {
  const elements = Object.fromEntries([...document.querySelectorAll("[id]")].map(node => [node.id, node]));
  const modes = {
    bogota: {title: "Habitabilidad de Bogotá", description: "Explora 884 zonas, los cinco dominios de habitabilidad y los indicadores publicados por CIVICA."},
    septima: {title: "Carrera Séptima", description: "Consulta las 102 zonas del corredor y compara el escenario original del proyecto."},
    simulador: {title: "Simulador de habitabilidad", description: "Explora cambios en una zona con el modelo original y los indicadores disponibles para consulta pública."}
  };
  const colors = ["#ffffcc", "#c2e699", "#78c679", "#31a354", "#006837"];
  const number = new Intl.NumberFormat("es-CO", {maximumFractionDigits: 4});
  const scoreOrder = ["total", "movilidad", "ambiente", "vivienda", "seguridad", "infraestructura"];
  let mode = new URLSearchParams(location.search).get("module");
  if (!Object.hasOwn(modes, mode)) mode = "bogota";
  let api, catalog, collection, map, polygons, selectedZone, range;
  let scenarioResult = new Map();
  let scenarioName = "";
  let busy = false;
  let loading = false;

  function status(message, state = "loading") {
    elements.status.textContent = message;
    elements.status.dataset.state = state;
  }

  function formatted(value) {
    return typeof value === "number" && Number.isFinite(value) ? number.format(value) : "Sin dato";
  }

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function visibleFeatures() {
    return collection.features.filter(feature => mode !== "septima" || feature.properties.carrera_septima);
  }

  function layerValue(properties, useScenario = true) {
    const [type, code] = elements.layer.value.split(":");
    if (type === "score") return (useScenario && scenarioResult.get(properties.zat) || properties.scores)[code];
    return properties.indicators[code];
  }

  function selectedFeature() {
    return collection.features.find(feature => feature.properties.zat === selectedZone);
  }

  function selectedLayerLabel() {
    return elements.layer.selectedOptions[0]?.textContent || "Habitabilidad";
  }

  function mapStyle(feature) {
    const value = layerValue(feature.properties);
    const finite = typeof value === "number" && Number.isFinite(value);
    const position = finite && range[1] > range[0] ? Math.floor((value - range[0]) / (range[1] - range[0]) * 5) : 2;
    return {color: feature.properties.zat === selectedZone ? "#542581" : "#596e68", weight: feature.properties.zat === selectedZone ? 3 : 0.6, opacity: 1, fillOpacity: 0.7, fillColor: finite ? colors[Math.max(0, Math.min(4, position))] : "#d1d5db"};
  }

  function updateLegend() {
    elements.legend.replaceChildren();
    for (let index = 0; index < 5; index++) {
      const item = element("span", undefined, "legend-item");
      const swatch = element("span", undefined, "swatch");
      swatch.style.backgroundColor = colors[index];
      const lower = range[0] + (range[1] - range[0]) * index / 5;
      const upper = range[0] + (range[1] - range[0]) * (index + 1) / 5;
      item.append(swatch, element("span", `${formatted(lower)} a ${formatted(upper)}`));
      elements.legend.append(item);
    }
  }

  function drawMap(fit = false) {
    const features = visibleFeatures();
    const referenceValues = features.map(feature => layerValue(feature.properties, false)).filter(value => typeof value === "number" && Number.isFinite(value));
    range = referenceValues.length ? [Math.min(...referenceValues), Math.max(...referenceValues)] : [0, 1];
    elements["map-title"].textContent = selectedLayerLabel();
    elements.coverage.textContent = `${features.length} zonas`;
    if (polygons) polygons.remove();
    polygons = L.geoJSON(features, {
      style: mapStyle,
      onEachFeature(feature, layer) {
        const properties = feature.properties;
        const tooltip = element("div");
        tooltip.append(element("div", `ZAT ${properties.zat}`), element("div", `${selectedLayerLabel()}: ${formatted(layerValue(properties))}`));
        layer.bindTooltip(tooltip, {sticky: true});
        layer.on("click", () => {if (!busy) selectZone(properties.zat);});
      }
    }).addTo(map);
    if (fit) map.fitBounds(polygons.getBounds(), {padding: [12, 12], maxZoom: 13});
    polygons.eachLayer(layer => {if (layer.feature.properties.zat === selectedZone) layer.bringToFront();});
    updateLegend();
    updateSelection();
  }

  function updateSelection() {
    const properties = selectedFeature().properties;
    elements["zone-name"].textContent = `Zona ${properties.zat}`;
    elements["value-label"].textContent = selectedLayerLabel();
    elements["zone-value"].textContent = formatted(layerValue(properties));
    elements["zone-location"].textContent = [properties.municipality, properties.utam].filter(Boolean).join(" / ");
    const after = scenarioResult.get(selectedZone);
    elements["result-context"].textContent = after && elements.layer.value.startsWith("score:") ? scenarioName : "Referencia original del modelo";
    elements["comparison-description"].textContent = after ? `${scenarioName}. Comparación de la ZAT ${selectedZone}; diferencia = escenario menos referencia.` : `Valores de referencia de la ZAT ${selectedZone}.`;
    elements["score-rows"].replaceChildren();
    for (const key of scoreOrder) {
      const row = element("tr");
      row.append(element("td", catalog.score_labels[key]), element("td", formatted(properties.scores[key])), element("td", after ? formatted(after[key]) : "Sin escenario"));
      const difference = after ? (Math.round((after[key] - properties.scores[key]) * 10000) / 10000 || 0) : null;
      row.append(element("td", difference === null ? "Sin escenario" : `${difference > 0 ? "+" : ""}${formatted(difference)}`, difference > 0 ? "positive" : difference < 0 ? "negative" : ""));
      elements["score-rows"].append(row);
    }
  }

  function selectZone(zone, zoom = false) {
    selectedZone = Number(zone);
    elements.zone.value = String(selectedZone);
    polygons.setStyle(mapStyle);
    polygons.eachLayer(layer => {
      if (layer.feature.properties.zat === selectedZone) {
        layer.bringToFront();
        if (zoom) map.fitBounds(layer.getBounds(), {maxZoom: 14, padding: [30, 30]});
      }
    });
    updateSelection();
    renderInputs();
  }

  function renderInputs() {
    if (mode !== "simulador") return;
    const values = selectedFeature().properties.indicators;
    elements.inputs.replaceChildren();
    const groups = new Map();
    for (const indicator of catalog.indicators.filter(item => item.editable)) {
      if (!groups.has(indicator.domain)) {
        const details = element("details");
        details.append(element("summary", indicator.domain));
        groups.set(indicator.domain, details);
        elements.inputs.append(details);
      }
      const row = element("div", undefined, "input-row");
      const label = element("label", indicator.label);
      const input = element("input");
      input.id = `input-${indicator.code}`;
      input.name = indicator.code;
      input.type = "number";
      input.step = "any";
      input.min = String(indicator.minimum);
      input.max = String(indicator.maximum);
      input.value = values[indicator.code] ?? "";
      input.dataset.original = input.value;
      input.disabled = values[indicator.code] === null || values[indicator.code] === undefined;
      label.htmlFor = input.id;
      const help = element("small", `Rango publicado: ${formatted(indicator.minimum)} a ${formatted(indicator.maximum)}. Código: ${indicator.code}.`);
      help.id = `help-${indicator.code}`;
      input.setAttribute("aria-describedby", help.id);
      input.addEventListener("input", () => {row.dataset.changed = String(input.value !== input.dataset.original);});
      row.append(label, input, help);
      groups.get(indicator.domain).append(row);
    }
  }

  function chooseMode(next) {
    mode = next;
    const url = new URL(location.href);
    url.searchParams.set("module", mode);
    history.replaceState(null, "", url);
    elements["module-title"].textContent = modes[mode].title;
    elements["module-description"].textContent = modes[mode].description;
    document.title = `${modes[mode].title} | CIVICA`;
    for (const link of document.querySelectorAll("[data-module]")) {
      if (link.dataset.module === mode) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    elements["scenario-panel"].hidden = mode !== "septima";
    elements["simulation-panel"].hidden = mode !== "simulador";
    if (!collection) return;
    scenarioResult = new Map();
    elements.reset.hidden = true;
    const features = visibleFeatures();
    elements.zone.replaceChildren(...features.map(feature => {
      const properties = feature.properties;
      const option = element("option", `ZAT ${properties.zat} - ${properties.utam || properties.municipality}`);
      option.value = String(properties.zat);
      return option;
    }));
    selectedZone = features.some(feature => feature.properties.zat === selectedZone) ? selectedZone : features[0].properties.zat;
    elements.zone.value = String(selectedZone);
    drawMap(true);
    renderInputs();
  }

  async function request(path, body) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 100000);
    try {
      const response = await fetch(api + path, {method: body === undefined ? "GET" : "POST", headers: body === undefined ? {Accept: "application/json"} : {"Content-Type": "application/json", Accept: "application/json"}, body: body === undefined ? undefined : JSON.stringify(body), credentials: "omit", signal: controller.signal});
      let data;
      try {data = await response.json();} catch {throw new Error("El servidor está iniciando. Reintenta en un minuto.");}
      if (!response.ok) {
        if (response.status === 429) throw new Error("Se alcanzó el límite de cálculos. Espera un minuto y vuelve a intentar.");
        if (data.error === "simulation_busy") throw new Error("Hay otro cálculo en curso. Vuelve a intentar en unos segundos.");
        if (response.status === 400) throw new Error("El modelo no pudo calcular esos valores. Revisa los rangos y prueba un cambio menor.");
        throw new Error("El servicio no está disponible en este momento. Reintenta en un minuto.");
      }
      return data;
    } finally {clearTimeout(timeout);}
  }

  function setBusy(value) {
    busy = value;
    elements["run-simulation"].disabled = value;
    elements["run-scenario"].disabled = value;
    elements.zone.disabled = value;
    elements.reset.disabled = value;
    for (const link of document.querySelectorAll("[data-module]")) link.setAttribute("aria-disabled", String(value));
    if (polygons) polygons.eachLayer(layer => {layer.options.interactive = !value;});
  }

  async function calculate(path, body, name) {
    if (busy) return;
    setBusy(true);
    status("Calculando con el modelo original. Conserva esta página abierta.");
    try {
      const result = await request(path, body);
      if (!Array.isArray(result.after) || !result.after.length) throw new Error("El modelo no devolvió un resultado válido.");
      scenarioResult = new Map(result.after.map(row => [row.zat, row.scores]));
      scenarioName = name;
      elements.reset.hidden = false;
      if (!elements.layer.value.startsWith("score:")) elements.layer.value = "score:total";
      drawMap();
      status(`Cálculo completado para ${result.zones.length} ${result.zones.length === 1 ? "zona" : "zonas"}. Selecciona una zona para consultar sus resultados.`, "ready");
    } catch (error) {status(error.name === "AbortError" ? "El cálculo tardó demasiado. Reintenta en un minuto." : error.message, "error");}
    finally {setBusy(false);}
  }

  async function initialize() {
    if (loading) return;
    loading = true;
    elements.retry.hidden = true;
    status("Conectando con los datos públicos. El primer acceso puede tardar cerca de un minuto.");
    try {
      const configResponse = await fetch("config.json", {cache: "no-cache"});
      if (!configResponse.ok) throw new Error("No se pudo leer la configuración del visor.");
      const config = await configResponse.json();
      const address = new URL(config.apiBaseUrl);
      const localPreview = ["localhost", "127.0.0.1"].includes(location.hostname) && ["localhost", "127.0.0.1"].includes(address.hostname);
      if (address.protocol !== "https:" && !localPreview) throw new Error("La conexión del visor debe usar HTTPS.");
      api = address.origin;
      [catalog, collection] = await Promise.all([request("/api/v1/catalog"), request("/api/v1/zones.geojson")]);
      if (collection.features?.length !== 884 || !catalog.indicators?.length) throw new Error("El conjunto de datos está incompleto. Reintenta la conexión.");
      const scores = element("optgroup");
      scores.label = "Índices de habitabilidad";
      for (const key of scoreOrder) {
        const option = element("option", catalog.score_labels[key]);
        option.value = `score:${key}`;
        scores.append(option);
      }
      elements.layer.replaceChildren(scores);
      const groups = new Map();
      for (const indicator of catalog.indicators) {
        if (!groups.has(indicator.domain)) {
          const group = element("optgroup");
          group.label = indicator.domain;
          groups.set(indicator.domain, group);
          elements.layer.append(group);
        }
        const option = element("option", `${indicator.label} (${indicator.code})`);
        option.value = `indicator:${indicator.code}`;
        groups.get(indicator.domain).append(option);
      }
      elements.layer.value = "score:total";
      elements.workspace.hidden = false;
      if (!map) {
        map = L.map("map", {preferCanvas: true, scrollWheelZoom: false}).setView([4.67, -74.08], 11);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(map);
        new ResizeObserver(() => map.invalidateSize()).observe(elements.map);
      }
      chooseMode(mode);
      status(`Datos disponibles: 884 zonas y ${catalog.indicators.length} indicadores publicados.`, "ready");
    } catch (error) {
      status(error.name === "AbortError" ? "El servidor no respondió a tiempo. Puede estar iniciando; reintenta en un minuto." : error.message === "Failed to fetch" ? "No se pudo conectar con el servidor. Revisa tu conexión y reintenta en un minuto." : error.message, "error");
      elements.retry.hidden = false;
    } finally {loading = false;}
  }

  for (const link of document.querySelectorAll("[data-module]")) link.addEventListener("click", event => {
    event.preventDefault();
    if (!busy) chooseMode(link.dataset.module);
  });
  elements.layer.addEventListener("change", () => drawMap());
  elements.zone.addEventListener("change", () => selectZone(elements.zone.value, true));
  elements.retry.addEventListener("click", initialize);
  elements["run-scenario"].addEventListener("click", () => calculate("/api/v1/scenarios/carrera-septima", {}, "Escenario original Carrera Séptima"));
  elements["simulation-form"].addEventListener("submit", event => {
    event.preventDefault();
    const changes = {};
    for (const input of elements.inputs.querySelectorAll("input")) {
      if (!input.disabled && input.value !== input.dataset.original) {
        const value = input.valueAsNumber;
        if (!Number.isFinite(value)) {input.reportValidity(); return;}
        changes[input.name] = value;
      }
    }
    if (!Object.keys(changes).length) {status("Modifica al menos un indicador para calcular un escenario.", "error"); return;}
    calculate("/api/v1/simulate", {zone: selectedZone, changes}, "Escenario exploratorio");
  });
  elements.reset.addEventListener("click", () => {
    scenarioResult = new Map();
    elements.reset.hidden = true;
    drawMap();
    renderInputs();
    status("Se muestran nuevamente los valores de referencia del proyecto.", "ready");
  });
  chooseMode(mode);
  initialize();
})();
