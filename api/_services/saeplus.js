// api/services/saeplus.js - Cliente de integración directa con SAEPLUS (Fibex Telecom)

import crypto from 'crypto';

const TIMEOUT_MS = 15000; // Timeout de 15 segundos solicitado por el usuario

class SaeplusService {
  constructor() {
    this.baseUrl = process.env.SAEPLUS_BASE_URL || 'https://fibextelecom.saeplus.com';
    this.username = (process.env.SAEPLUS_USER || 'caruiz').toUpperCase();
    this.password = process.env.SAEPLUS_PASSWORD || 'Ingreso-1';
    this.empresa = process.env.SAEPLUS_EMPRESA || 'conexven';
    this.cookies = '';
    this.csrfToken = '';
    this.sessionExpires = 0;
  }

  // Doble hashing requerido por el frontend de SAEPLUS: sha1(md5(password))
  _getPassKey(pass) {
    return {
      md5: crypto.createHash('md5').update(pass).digest('hex'),
      sha1: crypto.createHash('sha1').update(crypto.createHash('md5').update(pass).digest('hex')).digest('hex')
    };
  }

  // Extrae y concatena cookies de una respuesta HTTP nativa
  _extractCookies(res) {
    const raw = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie')] : []);
    return raw.map(c => c.split(';')[0]).join('; ');
  }

  // Autenticación completa contra el sistema
  async login() {
    // 1. Obtener CSRF Token inicial mediante cargador.php
    const resCargador = await fetch(`${this.baseUrl}/Seguridad/cargador.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)'
      },
      body: 'data[id]=&data[accion]=cargar_formulario&data[form]=login',
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    this.cookies = this._extractCookies(resCargador);
    const jsonCargador = await resCargador.json();
    this.csrfToken = jsonCargador.csrf_token || '';

    const { md5, sha1 } = this._getPassKey(this.password);
    const payloadLogin = [{
      clase: 'Seguridad', accion: 'iniciar_sesion',
      datos: {
        login: this.username, cedula: '', remember_usuario: 'NO', remember_password: 'NO',
        empresa: this.empresa, pass_key: sha1, v_key: '', hab_dos_pasos: false,
        code_pass: '', key_to_sms: md5, pass_key2: '', csrf_token: this.csrfToken
      }
    }];

    const resLogin = await fetch(`${this.baseUrl}/controlador.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': this.csrfToken,
        'Cookie': this.cookies,
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)'
      },
      body: 'parametros=' + encodeURIComponent(JSON.stringify(payloadLogin)),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    const newCookies = this._extractCookies(resLogin);
    if (newCookies) this.cookies = `${this.cookies}; ${newCookies}`;
    const matchXsrf = this.cookies.match(/XSRF-TOKEN=([^;]+)/);
    if (matchXsrf) this.csrfToken = decodeURIComponent(matchXsrf[1]);

    const jsonLogin = await resLogin.json();
    if (!jsonLogin.success) throw new Error(`Error en login SAEPLUS: ${jsonLogin.error || 'Autenticación fallida'}`);
    this.sessionExpires = Date.now() + 25 * 60 * 1000;
  }

  // Asegura que la sesión esté viva antes de cualquier consulta
  async asegurarSesion() {
    if (!this.cookies || !this.csrfToken || Date.now() > this.sessionExpires) await this.login();
  }

  // Helper para llamadas al backend con reintento automático si expira la sesión
  async _postControlador(payload) {
    await this.asegurarSesion();
    if (payload[0]?.datos) payload[0].datos.csrf_token = this.csrfToken;

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-Token': this.csrfToken,
      'Cookie': this.cookies,
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)'
    };

    let res = await fetch(`${this.baseUrl}/controlador.php`, {
      method: 'POST', headers,
      body: 'parametros=' + encodeURIComponent(JSON.stringify(payload)),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    if (res.status === 403 || res.status === 401) {
      this.sessionExpires = 0;
      await this.login();
      if (payload[0]?.datos) payload[0].datos.csrf_token = this.csrfToken;
      headers['X-CSRF-Token'] = this.csrfToken;
      headers['Cookie'] = this.cookies;
      res = await fetch(`${this.baseUrl}/controlador.php`, {
        method: 'POST', headers,
        body: 'parametros=' + encodeURIComponent(JSON.stringify(payload)),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
    }
    return await res.json();
  }

  // Consulta los contratos de un cliente por su número de cédula
  async consultarAbonadoPorCedula(cedulaRaw) {
    const cedulaLimpia = String(cedulaRaw || '').replace(/\D/g, '').trim();
    if (!cedulaLimpia) return null;

    const payload = [{
      clase: 'busqueda_avanzada',
      accion: 'buscar_data_cedula',
      datos: { cedula_b: cedulaLimpia, claseGlobal: 'act_contrato' }
    }];

    const data = await this._postControlador(payload);
    if (!data.success || !Array.isArray(data.retorno)) return null;

    const coincidencias = data.retorno.filter(
      item => String(item.cedula || '').trim() === cedulaLimpia
    );
    if (coincidencias.length === 0) return null;

    return coincidencias.map(c => ({
      nombreCompleto: `${c.nombre || ''} ${c.apellido || ''}`.trim(),
      nombre: c.nombre || '',
      apellido: c.apellido || '',
      cedula: c.cedula,
      nroContrato: c.nro_contrato,
      estatus: c.nombrestatus || c.status_contrato || 'DESCONOCIDO',
      saldoPendienteUsd: parseFloat(c.saldo || '0').toFixed(2),
      montoMensualidad: parseFloat(c.suscripcion || '0').toFixed(2),
      plan: c.nombre_g_a || 'HOGAR',
      sector: c.nombre_sector || '',
      ciudad: c.nombre_ciudad || '',
      franquicia: c.nombre_franq || '',
      direccionFiscal: c.direccion_fiscal || ''
    }));
  }

  // Consulta la última factura o aviso de cobro emitido por Cédula o Contrato
  async consultarUltimaFactura(criterio, contratoParam = '') {
    let cedula = typeof criterio === 'object' ? String(criterio?.cedula || '') : String(criterio || '');
    let contrato = typeof criterio === 'object' ? String(criterio?.nroContrato || '') : String(contratoParam || '');
    cedula = cedula.replace(/\D/g, '').trim();
    contrato = contrato.trim();
    if (!cedula && !contrato) return null;

    const buscarDocs = async (c, n) => {
      const payload = [{ clase: 'tabs', accion: 'consultar_documento', datos: { nro_factura: '', nro_control: '', nro_contrato: n || '', cedulacli: c || '' } }];
      const res = await this._postControlador(payload);
      return (res.success && Array.isArray(res.retorno)) ? res.retorno : [];
    };

    let docs = cedula ? await buscarDocs(cedula, '') : [];
    if (docs.length === 0 && contrato) docs = await buscarDocs('', contrato);
    if (docs.length === 0) return null;

    for (const doc of docs) {
      const match = (doc.verdatos || '').match(/imprimir_factura_cargar_deuda\('([^']+)',\s*'([^']+)'\)/);
      if (match) {
        return {
          nroFactura: doc.nro_factura || 'S/N',
          fechaEmision: doc.fecha || doc.fecha_pago || '',
          tipo: doc.tipo || 'FACTURA',
          concepto: doc.obser_pago || 'SERVICIO DE INTERNET',
          monto: doc.monto_pago || '0.00',
          cliente: doc.cliente || '',
          nroContrato: doc.nro_contrato || '',
          franquicia: doc.nombre_franq || '',
          idPago: match[1],
          archivoFormatoFactura: match[2]
        };
      }
    }
    return null;
  }

  // Descarga el archivo binario PDF oficial de la factura desde SAEPLUS
  async descargarFacturaPdf(idPago, archivoFormatoFactura) {
    await this.asegurarSesion();
    const datos = JSON.stringify({ facturacion: { id_pago: idPago }, archivo_formato_factura: archivoFormatoFactura });
    const url = `${this.baseUrl}/modules/cobranza/report/lotes_filtro_${archivoFormatoFactura}?datos=${encodeURIComponent(datos)}&`;
    const res = await fetch(url, {
      headers: { 'Cookie': this.cookies, 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)' },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (!res.ok) throw new Error(`Error descargando factura PDF de SAEplus: Status ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
}

export const saeplusService = new SaeplusService();

