// api/services/saeplus.js
// Cliente de integración directa con SAEPLUS (Fibex Telecom)
// Consulta de abonados, contratos, estatus y saldo adeudado por documento de identidad.

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
    const md5 = crypto.createHash('md5').update(pass).digest('hex');
    const sha1 = crypto.createHash('sha1').update(md5).digest('hex');
    return { md5, sha1 };
  }

  // Extrae y concatena cookies de una respuesta HTTP nativa
  _extractCookies(res) {
    const rawCookies = typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie')] : []);
    return rawCookies.map(c => c.split(';')[0]).join('; ');
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

    // 2. Iniciar sesión en controlador.php
    const payloadLogin = [{
      clase: 'Seguridad',
      accion: 'iniciar_sesion',
      datos: {
        login: this.username,
        cedula: '',
        remember_usuario: 'NO',
        remember_password: 'NO',
        empresa: this.empresa,
        pass_key: sha1,
        v_key: '',
        hab_dos_pasos: false,
        code_pass: '',
        key_to_sms: md5,
        pass_key2: '',
        csrf_token: this.csrfToken
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
    if (newCookies) {
      this.cookies = `${this.cookies}; ${newCookies}`;
    }

    const matchXsrf = this.cookies.match(/XSRF-TOKEN=([^;]+)/);
    if (matchXsrf) {
      this.csrfToken = decodeURIComponent(matchXsrf[1]);
    }

    const jsonLogin = await resLogin.json();
    if (!jsonLogin.success) {
      throw new Error(`Error en login SAEPLUS: ${jsonLogin.error || 'Autenticación fallida'}`);
    }

    // Mantener sesión válida en memoria por 25 minutos
    this.sessionExpires = Date.now() + 25 * 60 * 1000;
  }

  // Asegura que la sesión esté viva antes de cualquier consulta
  async asegurarSesion() {
    if (!this.cookies || !this.csrfToken || Date.now() > this.sessionExpires) {
      await this.login();
    }
  }

  // Consulta los contratos de un cliente por su número de cédula
  async consultarAbonadoPorCedula(cedulaRaw) {
    const cedulaLimpia = String(cedulaRaw || '').replace(/\D/g, '').trim();
    if (!cedulaLimpia) return null;

    await this.asegurarSesion();

    const payloadSearch = [{
      clase: 'busqueda_avanzada',
      accion: 'buscar_data_cedula',
      datos: {
        cedula_b: cedulaLimpia,
        claseGlobal: 'act_contrato',
        csrf_token: this.csrfToken
      }
    }];

    let res = await fetch(`${this.baseUrl}/controlador.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': this.csrfToken,
        'Cookie': this.cookies,
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)'
      },
      body: 'parametros=' + encodeURIComponent(JSON.stringify(payloadSearch)),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    // Si la sesión expiró remotamente, reautenticar y reintentar 1 vez
    if (res.status === 403 || res.status === 401) {
      this.sessionExpires = 0;
      await this.login();
      payloadSearch[0].datos.csrf_token = this.csrfToken;
      res = await fetch(`${this.baseUrl}/controlador.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': this.csrfToken,
          'Cookie': this.cookies,
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)'
        },
        body: 'parametros=' + encodeURIComponent(JSON.stringify(payloadSearch)),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
    }

    const data = await res.json();
    if (!data.success || !Array.isArray(data.retorno)) {
      return null;
    }

    // Filtrar coincidencias exactas por número de cédula
    const coincidencias = data.retorno.filter(
      item => String(item.cedula || '').trim() === cedulaLimpia
    );

    if (coincidencias.length === 0) {
      return null;
    }

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
}

export const saeplusService = new SaeplusService();
