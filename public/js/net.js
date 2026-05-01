// public/js/net.js
(function(global) {
  // 1) Config del backend (se puede cambiar según entorno)
  global.APP_CONFIG = {
    API_BASE_URL: 'http://localhost:3001',
    BACKEND_TOKEN: 'change_this_to_a_random_string' // debe coincidir con BACKEND_TOKEN del .env del backend
  };

  // 2) Cookie store (Chrome 26 compatible)
  var CookieStore = {
    set: function(key, value, days) {
      var expires = '';
      if (days) {
        var d = new Date();
        d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
        expires = '; expires=' + d.toUTCString();
      }
      document.cookie = key + '=' + (value || '') + expires + '; path=/';
    },
    get: function(key) {
      var nameEQ = key + '=';
      var ca = document.cookie.split(';');
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    },
    remove: function(key) {
      document.cookie = key + '=; Max-Age=-99999999; path=/';
    }
  };

  // 3) Request helper: XMLHttpRequest puro (no fetch, no Promise)
  //    callback(err, response)
  function request(options, callback) {
    var xhr = new XMLHttpRequest();
    var url = (options.baseUrl || global.APP_CONFIG.API_BASE_URL) + options.path;
    xhr.open(options.method || 'GET', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    // Headers extra
    if (options.headers) {
      Object.keys(options.headers).forEach(function(k) {
        xhr.setRequestHeader(k, options.headers[k]);
      });
    }

    // Auth header si existe token guardado
    var token = CookieStore.get('auth_token');
    if (token && !options.skipAuth) {
      xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    }

    // Backend token para rutas protegidas
    if (options.requireBackendToken) {
      xhr.setRequestHeader('x-backend-token', global.APP_CONFIG.BACKEND_TOKEN);
    }

    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) return;
      var body = null;
      if (xhr.responseText) {
        try { body = JSON.parse(xhr.responseText); } catch(e) { body = xhr.responseText; }
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        callback(null, body, xhr);
      } else {
        var err = new Error('Request failed: ' + xhr.status);
        err.status = xhr.status;
        err.body = body;
        callback(err, body, xhr);
      }
    };

    xhr.onerror = function() {
      callback(new Error('Network error'));
    };

    xhr.send(options.body ? JSON.stringify(options.body) : undefined);
    return xhr;
  }

  // Shortcuts
  function post(path, body, options, callback) {
    if (typeof options === 'function') { callback = options; options = {}; }
    options = options || {};
    options.method = 'POST';
    options.path = path;
    options.body = body;
    return request(options, callback);
  }

  function get(path, options, callback) {
    if (typeof options === 'function') { callback = options; options = {}; }
    options = options || {};
    options.method = 'GET';
    options.path = path;
    return request(options, callback);
  }

  // Exponer API
  global.Api = {
    request: request,
    get: get,
    post: post,
    CookieStore: CookieStore
  };
})(window);